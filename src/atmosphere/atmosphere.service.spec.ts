import {Player} from '../player/player.model';
import {AtmosphereService} from './atmosphere.service';
import {PlayerService} from '../player/player.service';
import {AtmosphereMessageProcessorService} from './atmosphere-message-processor.service';
import {TestBed} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

class MockPlayerService {
  player: BehaviorSubject<Player> = new BehaviorSubject(new Player());
}

class MockProcessor {
  listen = jasmine.createSpy('listen');
}

class MockSocket {
  close = jasmine.createSpy('close');
}


describe('Service: atmosphere service', () => {
  let mockAtmosphere: any = {};
  let atmosphereService: AtmosphereService;
  let processor: MockProcessor;
  let playerService: MockPlayerService;
  let socket: MockSocket;

  beforeEach(() => {
    socket = new MockSocket();
    TestBed.configureTestingModule({
      providers: [
        {provide: PlayerService, useClass: MockPlayerService},
        {provide: AtmosphereMessageProcessorService, useClass: MockProcessor},
        AtmosphereService
      ]
    });
    atmosphereService = TestBed.get(AtmosphereService);
    processor = TestBed.get(AtmosphereMessageProcessorService);
    playerService = TestBed.get(PlayerService);
    mockAtmosphere.subscribe = jasmine.createSpy('subscribe').and.returnValue(socket);
    atmosphereService.socket = mockAtmosphere;
  });

  it('basic listen setup when player changed', () => {
    playerService.player.next(new Player({id: '1'}));
    expect(processor.listen).toHaveBeenCalled();
    expect(processor.listen.calls.argsFor(0)[0].url).toEqual('/livefeed/1');
    expect(mockAtmosphere.subscribe.calls.argsFor(0)[0]).toEqual(processor.listen.calls.argsFor(0)[0]);
  });

  it('will attempt another subscribe if first attempt failed', () => {
    mockAtmosphere.subscribe.and.throwError('No good!');
    playerService.player.next(new Player({id: '1'}));
    expect(processor.listen).toHaveBeenCalled();
    expect(processor.listen.calls.argsFor(0)[0].url).toEqual('/livefeed/1');
    expect(mockAtmosphere.subscribe.calls.argsFor(0)[0]).toEqual(processor.listen.calls.argsFor(0)[0]);
    mockAtmosphere.subscribe.and.returnValue(socket);
    playerService.player.next(new Player({id: '1'}));
    expect(processor.listen).toHaveBeenCalledTimes(2);
    expect(processor.listen.calls.argsFor(1)[0].url).toEqual('/livefeed/1');
    expect(mockAtmosphere.subscribe.calls.argsFor(1)[0]).toEqual(processor.listen.calls.argsFor(1)[0]);
  });

  it('basic listen setup when player changed with endpoint specified', () => {
    atmosphereService.endPoint = 'http://xyx.com';
    playerService.player.next(new Player({id: '3'}));
    expect(processor.listen).toHaveBeenCalled();
    expect(processor.listen.calls.argsFor(0)[0].url).toEqual('http://xyx.com/livefeed/3');
    expect(mockAtmosphere.subscribe.calls.argsFor(0)[0]).toEqual(processor.listen.calls.argsFor(0)[0]);
  });

  it('ignores player update if same id', () => {
    playerService.player.next(new Player({id: '3'}));
    expect(processor.listen).toHaveBeenCalledTimes(1);
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(1);
    playerService.player.next(new Player({id: '3', displayName: 'X'}));
    expect(processor.listen).toHaveBeenCalledTimes(1);
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(1);
  });

  it('closes socked and resubscribes when player changed', () => {
    playerService.player.next(new Player({id: '1'}));
    expect(processor.listen).toHaveBeenCalledTimes(1);
    expect(processor.listen.calls.argsFor(0)[0].url).toEqual('/livefeed/1');
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(1);
    expect(mockAtmosphere.subscribe.calls.argsFor(0)[0]).toEqual(processor.listen.calls.argsFor(0)[0]);
    playerService.player.next(new Player({id: '3'}));
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(processor.listen).toHaveBeenCalledTimes(2);
    expect(processor.listen.calls.argsFor(1)[0].url).toEqual('/livefeed/3');
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(2);
    expect(mockAtmosphere.subscribe.calls.argsFor(1)[0]).toEqual(processor.listen.calls.argsFor(1)[0]);
  });

  it('closes socket if player goes to null', () => {
    playerService.player.next(new Player({id: '1'}));
    expect(processor.listen).toHaveBeenCalledTimes(1);
    expect(processor.listen.calls.argsFor(0)[0].url).toEqual('/livefeed/1');
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(1);
    expect(mockAtmosphere.subscribe.calls.argsFor(0)[0]).toEqual(processor.listen.calls.argsFor(0)[0]);
    playerService.player.next(null);
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(processor.listen).toHaveBeenCalledTimes(1);
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(1);
  });

  it('closes socket if player.id goes to null', () => {
    playerService.player.next(new Player({id: '1'}));
    expect(processor.listen).toHaveBeenCalledTimes(1);
    expect(processor.listen.calls.argsFor(0)[0].url).toEqual('/livefeed/1');
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(1);
    expect(mockAtmosphere.subscribe.calls.argsFor(0)[0]).toEqual(processor.listen.calls.argsFor(0)[0]);
    playerService.player.next(new Player());
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(processor.listen).toHaveBeenCalledTimes(1);
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(1);
  });

  it('closes socked and resubscribes when player changed even if close throws error', () => {
    socket.close.and.throwError('bad things');
    playerService.player.next(new Player({id: '1'}));
    expect(processor.listen).toHaveBeenCalledTimes(1);
    expect(processor.listen.calls.argsFor(0)[0].url).toEqual('/livefeed/1');
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(1);
    expect(mockAtmosphere.subscribe.calls.argsFor(0)[0]).toEqual(processor.listen.calls.argsFor(0)[0]);
    playerService.player.next(new Player({id: '3'}));
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(processor.listen).toHaveBeenCalledTimes(2);
    expect(processor.listen.calls.argsFor(1)[0].url).toEqual('/livefeed/3');
    expect(mockAtmosphere.subscribe).toHaveBeenCalledTimes(2);
    expect(mockAtmosphere.subscribe.calls.argsFor(1)[0]).toEqual(processor.listen.calls.argsFor(1)[0]);
  });
});
