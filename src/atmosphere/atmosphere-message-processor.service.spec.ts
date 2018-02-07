import {Player} from '../player/player.model';
import {Game} from '../games/game.model';
import {AtmosphereMessageProcessorService} from './atmosphere-message-processor.service';
import {AtmosphereRequest} from './atmosphere-request.model';
import {GameFactory} from '../games/gamefactory.serviceinterface';
import {MultiPlayerGame} from '../games/multi-player-game.model';
import {MessageBusService} from '../messagebus/message-bus.service';
import {Subscription} from 'rxjs/Subscription';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {TestBed} from '@angular/core/testing';

class MockSubscription extends Subscription {
  constructor() {
    super();
    this.unsubscribe = jest.fn();
  }
}

export class MockGameFactory implements GameFactory {
  public newGame(original?: MultiPlayerGame): any {
    return new MultiPlayerGame(original);
  }
}

class MockAtmosphereRequest extends AtmosphereRequest {
  requestConnectionStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  messageSubject: Subject<any> = new Subject<any>();

  connectionSubscriptions: MockSubscription[] = [new MockSubscription(), new MockSubscription(), new MockSubscription()];
  messageSubscriptions: MockSubscription[] = [new MockSubscription(), new MockSubscription(), new MockSubscription()];

  constructor() {
    super('', '');
    this.requestConnectionStatus.subscribe = jasmine.createSpy(
      'rcssubscribe',
      this.requestConnectionStatus.subscribe).and.returnValues(this.connectionSubscriptions);
    this.messageSubject.subscribe = jasmine.createSpy(
      'mssubscribe',
      this.messageSubject.subscribe).and.returnValue(this.messageSubscriptions);
  }
}

describe('Service: atmosphere message handler service', () => {
  let messageBus: MessageBusService;
  let processor: AtmosphereMessageProcessorService;
  let lastPlayer: Player;
  let lastGame: Game;
  let lastStatus: boolean;

  beforeEach(() => {
    lastPlayer = null;
    lastStatus = null;
    lastGame = null;
    TestBed.configureTestingModule({
      providers: [
        {provide: 'GameFactory', useClass: MockGameFactory},
        MessageBusService,
        AtmosphereMessageProcessorService,
      ]
    });
    processor = TestBed.get(AtmosphereMessageProcessorService);
    messageBus = TestBed.get(MessageBusService);
    messageBus.playerUpdates.subscribe(p => {
      lastPlayer = p;
    });
    messageBus.connectionStatus.subscribe(s => {
      lastStatus = s;
    });
    messageBus.gameUpdates.subscribe(g => {
      lastGame = g;
    });
  });

  it('basic listen setup', () => {
    const r: MockAtmosphereRequest = new MockAtmosphereRequest();
    processor.listen(r);
    expect(lastStatus).toBeFalsy();
    expect(r.requestConnectionStatus.subscribe).toHaveBeenCalledTimes(1);
    expect(r.messageSubject.subscribe).toHaveBeenCalledTimes(1);
    r.connectionSubscriptions.forEach(s => {
      expect(s.unsubscribe).not.toHaveBeenCalled();
    });
    r.messageSubscriptions.forEach(s => {
      expect(s.unsubscribe).not.toHaveBeenCalled();
    });
  });

  it('basic listen publishes connection status', () => {
    const r: AtmosphereRequest = new AtmosphereRequest('', '');
    processor.listen(r);
    expect(lastStatus).toBeFalsy();
    r.requestConnectionStatus.next(true);
    expect(lastStatus).toBeTruthy();
    r.requestConnectionStatus.next(false);
    expect(lastStatus).toBeFalsy();
  });

  it('basic listen publishes game status', () => {
    const r: AtmosphereRequest = new AtmosphereRequest('', '');
    processor.listen(r);
    expect(lastGame).toBeNull();
    let g1: MultiPlayerGame = new MultiPlayerGame();
    g1.gamePhase = 'Test';
    g1.id = 'id';
    g1 = new MultiPlayerGame(g1);
    r.messageSubject.next({messageType: 'Game', game: g1, ignoredfield: 32});
    expect(JSON.stringify(lastGame)).toEqual(JSON.stringify(g1));

    let g2: MultiPlayerGame = new MultiPlayerGame();
    g2.gamePhase = 'Test2';
    g2.id = 'id2';
    g2 = new MultiPlayerGame(g2);
    r.messageSubject.next({messageType: 'Game', game: g2});
    expect(JSON.stringify(lastGame)).toEqual(JSON.stringify(g2));
  });

  it('basic listen publishes player status', () => {
    const r: AtmosphereRequest = new AtmosphereRequest('', '');
    processor.listen(r);
    expect(lastPlayer).toBeNull();
    let p1: Player = new Player();
    p1.displayName = 'name';
    p1.id = 'id';
    p1.md5 = 'md5';
    p1 = new Player(p1);
    r.messageSubject.next({messageType: 'Player', player: p1, ignoredfield: 32});
    expect(JSON.stringify(lastPlayer)).toEqual(JSON.stringify(p1));

    let p2: Player = new Player();
    p2.displayName = '2name';
    p2.id = 'id2';
    p2.md5 = '!md5';
    p2 = new Player(p2);
    r.messageSubject.next({messageType: 'Player', player: p2});
    expect(JSON.stringify(lastPlayer)).toEqual(JSON.stringify(p2));
  });

  describe('testing disconnect/reconnects', () => {
    it('disconnects and reconnects', () => {
      const r1: AtmosphereRequest = new AtmosphereRequest('', '');
      processor.listen(r1);
      expect(lastStatus).toBeFalsy();
      expect(lastPlayer).toBeNull();
      r1.requestConnectionStatus.next(true);
      expect(lastStatus).toBeTruthy();
      const r2: AtmosphereRequest = new AtmosphereRequest('', '');
      processor.listen(r2);
      expect(lastStatus).toBeFalsy();
      r1.requestConnectionStatus.next(true);  // ignored
      expect(lastStatus).toBeFalsy();
      r2.requestConnectionStatus.next(true);  // ignored

      expect(lastStatus).toBeTruthy();
      let p2: Player = new Player();
      p2.displayName = '2name';
      p2.id = 'id2';
      p2.md5 = '!md5';
      p2 = new Player(p2);
      r1.messageSubject.next({messageType: 'Player', player: p2});
      expect(lastPlayer).toBeNull();
      r2.messageSubject.next({messageType: 'Player', player: p2});
      expect(JSON.stringify(lastPlayer)).toEqual(JSON.stringify(p2));
    });
  });
});
