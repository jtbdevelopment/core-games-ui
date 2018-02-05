import {PlayerService} from './player.service';
import {TestBed} from '@angular/core/testing';
import {Player} from './player.model';
import {MessageBusService} from '../messagebus/message-bus.service';
import {Router} from '@angular/router';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';

class MockRouter {
  navigateByUrl = jasmine.createSpy('nbu');
}

describe('Service: player service', () => {
  let currentPlayer: Player = null;
  let loggedInPlayer: Player = null;
  let playerService: PlayerService;
  let messageBus: MessageBusService;
  let router: MockRouter;
  let httpMock: HttpTestingController;


  beforeEach(() => {
    currentPlayer = null;
    loggedInPlayer = null;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MessageBusService,
        PlayerService,
        {provide: Router, useClass: MockRouter},
      ]
    });
    playerService = TestBed.get(PlayerService);
    messageBus = TestBed.get(MessageBusService);
    router = TestBed.get(Router) as MockRouter;
    httpMock = TestBed.get(HttpTestingController);
    playerService.loggedInPlayer.subscribe(p => {
      loggedInPlayer = p;
    });
    playerService.player.subscribe(p => {
      currentPlayer = p;
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('defaults to empty logged in and current player', () => {
    expect(currentPlayer).toBeDefined();
    expect(loggedInPlayer).toBeDefined();
  });

  it('loads logged in player', () => {
    let loadedPlayer = {
      source: 'A source',
      sourceId: 'sidX',
      displayName: 'A player',
      adminUser: false,
      imageUrl: null,
      profileUrl: 'http://myprofile/1'
    };
    let expectedPlayer: Player = new Player(loadedPlayer);
    playerService.loadLoggedInPlayer();
    let request = httpMock.expectOne('/api/security');
    expect(request.request.method).toEqual('GET');
    expect(request.request.body).toBeNull();
    request.flush(loadedPlayer);
    expect(currentPlayer).toBeDefined();
    expect(loggedInPlayer).toBeDefined();
    //noinspection TypeScriptValidateTypes
    expect(currentPlayer).toEqual(loggedInPlayer);
    expect(JSON.stringify(currentPlayer)).toEqual(JSON.stringify(expectedPlayer));
  });

  describe('after loading logged in player', () => {
    let initiallyLoadedPlayer: Player;
    beforeEach(() => {
      let loadedPlayer = {
        id: 'id',
        source: 'a source',
        sourceId: 'sidX',
        displayName: 'A Player',
        adminUser: false,
        imageUrl: 'http://image.png',
        profileUrl: null
      };
      initiallyLoadedPlayer = new Player(loadedPlayer);
      playerService.loadLoggedInPlayer();
      let request = httpMock.expectOne('/api/security');
      expect(request.request.method).toEqual('GET');
      expect(request.request.body).toBeNull();
      request.flush(loadedPlayer);
    });

    it('loads logged in player', () => {
      expect(currentPlayer).toBeDefined();
      expect(loggedInPlayer).toBeDefined();
      //noinspection TypeScriptValidateTypes
      expect(currentPlayer).toEqual(loggedInPlayer);
      expect(JSON.stringify(currentPlayer)).toEqual(JSON.stringify(initiallyLoadedPlayer));
    });

    it('processes update on player when matches id', () => {
      let update = new Player(initiallyLoadedPlayer);
      update.profileUrl = 'a new profile';
      update.displayName = 'a new name';

      messageBus.playerUpdates.next(update);
      expect(currentPlayer).toBeDefined();
      expect(loggedInPlayer).toBeDefined();
      //noinspection TypeScriptValidateTypes
      expect(currentPlayer).toEqual(loggedInPlayer);
      expect(JSON.stringify(currentPlayer)).toEqual(JSON.stringify(update));
    });

    it('ignores update on player when does not match id', () => {
      let update = new Player(initiallyLoadedPlayer);
      update.id = update.id + 'X';
      update.profileUrl = 'a new profile';
      update.displayName = 'a new name';

      messageBus.playerUpdates.next(update);
      expect(currentPlayer).toBeDefined();
      expect(loggedInPlayer).toBeDefined();
      //noinspection TypeScriptValidateTypes
      expect(currentPlayer).toEqual(loggedInPlayer);
      expect(JSON.stringify(currentPlayer)).toEqual(JSON.stringify(initiallyLoadedPlayer));
    });

    it('successful logout posts and redirects', () => {
      playerService.logout();

      let request = httpMock.expectOne('/signout');
      expect(request.request.method).toEqual('POST');
      expect(request.request.body).toBeNull();
      request.flush('');
      expect(JSON.stringify(currentPlayer)).toEqual(JSON.stringify(new Player()));
      expect(JSON.stringify(loggedInPlayer)).toEqual(JSON.stringify(new Player()));
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/signin');
    });

    it('force logout redirects', () => {
      playerService.forceLogout();

      expect(JSON.stringify(currentPlayer)).toEqual(JSON.stringify(new Player()));
      expect(JSON.stringify(loggedInPlayer)).toEqual(JSON.stringify(new Player()));
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/signin');
    });

    it('even failed logout posts and redirects', () => {
      playerService.logout();
      let request = httpMock.expectOne('/signout');
      expect(request.request.method).toEqual('POST');
      expect(request.request.body).toBeNull();
      request.flush('');
      expect(JSON.stringify(currentPlayer)).toEqual(JSON.stringify(new Player()));
      expect(JSON.stringify(loggedInPlayer)).toEqual(JSON.stringify(new Player()));
      expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/signin');
    });

    it('switching to another user', () => {
      playerService.simulateUser('newid');
      let request = httpMock.expectOne('/api/player/admin/newid');
      expect(request.request.method).toEqual('PUT');
      expect(request.request.body).toEqual({});
      let simulatedPlayer = new Player({id: 'newid', displayName: 'sim', source: 'MANUAL'});
      request.flush(simulatedPlayer);

      expect(currentPlayer).toBeDefined();
      expect(loggedInPlayer).toBeDefined();
      //noinspection TypeScriptValidateTypes
      expect(JSON.stringify(loggedInPlayer)).toEqual(JSON.stringify(initiallyLoadedPlayer));
      expect(JSON.stringify(currentPlayer)).toEqual(JSON.stringify(simulatedPlayer));
    });
  });
});
