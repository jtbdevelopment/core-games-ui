import {TestBed} from '@angular/core/testing';
import {Game} from '../games/game.model';
import {GameClassifier} from './game-classifier.serviceinterface';
import {GameCacheService} from './game-cache.service';
import {GameFactory} from '../games/gamefactory.serviceinterface';
import {MultiPlayerGame} from '../games/multi-player-game.model';
import {MessageBusService} from '../messagebus/message-bus.service';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {from} from 'rxjs/observable/from';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';

class MockClassifier implements GameClassifier<Game> {
  public classifications = ['A', 'B', 'D'];

  public classificationSubject: BehaviorSubject<string[]> = new BehaviorSubject([]);

  public getClassifications(): Observable<string[]> {
    return from(this.classificationSubject);
  }

  public getIcons(): Observable<Map<string, string>> {
    return new BehaviorSubject(null);
  }

  //  Classify game into one of the buckets returned above
  public classifyGame(game: Game): string {
    return game.gamePhase;
  }
}

class MockGameFactory implements GameFactory {
  public newGame(original?: Object): any {
    return new MultiPlayerGame(original);
  }
}

describe('Service: game cache service', () => {
  let gameCache: GameCacheService;
  let messageBus: MessageBusService;
  let classifier: MockClassifier;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {provide: 'GameClassifier', useClass: MockClassifier},
        {provide: 'GameFactory', useClass: MockGameFactory},
        MessageBusService,
        GameCacheService,
      ]
    });
    gameCache = TestBed.get(GameCacheService);
    messageBus = TestBed.get(MessageBusService);
    classifier = TestBed.get('GameClassifier');
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('initial state is no categories', () => {
    expect(gameCache.getGamesCount()).toBeCloseTo(0);
  });

  describe('initialization', () => {
    const expectedGames = [
      new MultiPlayerGame({id: '1', gamePhase: 'B', lastUpdate: 0}),
      new MultiPlayerGame({id: '2', gamePhase: 'A', lastUpdate: 0}),
      new MultiPlayerGame({id: '3', gamePhase: 'B', lastUpdate: 0}),
      new MultiPlayerGame({id: '4', gamePhase: 'D', lastUpdate: 0}),
      new MultiPlayerGame({id: '5', gamePhase: 'B', lastUpdate: 0}),
    ];

    describe('state after connecting but categories are not ready', () => {
      beforeEach(() => {
        messageBus.connectionStatus.next(true);
        const request = httpMock.expectOne('/api/player/games');
        expect(request.request.method).toEqual('GET');
        expect(request.request.body).toBeNull();
        request.flush(expectedGames);
      });

      afterEach(() => {
        expectedGames.forEach(expectedGame => {
          let game: Game;
          gameCache.getGame(expectedGame.id).subscribe(x => game = x);
          expect(JSON.stringify(game)).toEqual(JSON.stringify(expectedGame));
        });
      });

      it('requests games after connected', () => {
        expect(gameCache.getGamesCount()).toBeCloseTo(5);
      });

      describe('state after connected and categories are ready', () => {
        it('categories are available and empty games initialized', () => {
          classifier.classificationSubject.next(classifier.classifications);
          const games: Game[][] = [];
          classifier.classifications.forEach((c, i) => {
            games.push(null);
            gameCache.getGamesForCategory(c).subscribe(x => games[i] = x);
          });
          expect(gameCache.getGamesCount()).toBeCloseTo(5);
          expect(JSON.stringify(games[0])).toEqual(JSON.stringify([expectedGames[1]]));
          //  cant guarantee order
          expect(JSON.stringify(games[1].filter(x => x.id === expectedGames[0].id))).toEqual(JSON.stringify([expectedGames[0]]));
          expect(JSON.stringify(games[1].filter(x => x.id === expectedGames[2].id))).toEqual(JSON.stringify([expectedGames[2]]));
          expect(JSON.stringify(games[1].filter(x => x.id === expectedGames[4].id))).toEqual(JSON.stringify([expectedGames[4]]));
          expect(JSON.stringify(games[2])).toEqual(JSON.stringify([expectedGames[3]]));
        });
      });
    });

    describe('state after categories are ready, but not connected initially', () => {
      const games: Game[][] = [];
      beforeEach(async () => {
        classifier.classificationSubject.next(classifier.classifications);
        classifier.classifications.forEach((c, i) => {
          games.push(null);
          gameCache.getGamesForCategory(c).subscribe(x => games[i] = x);
        });
      });

      it('categories are available and empty games initialized', () => {
        games.forEach(gameList => {
          expect(gameList).toEqual([]);
        });
        expect(gameCache.getGamesCount()).toBeCloseTo(0);
      });

      describe('state after categories are ready and server connected', () => {
        beforeEach(() => {
          messageBus.connectionStatus.next(true);
        });

        it('requests games after connected', () => {
          const request = httpMock.expectOne('/api/player/games');
          expect(request.request.method).toEqual('GET');
          expect(request.request.body).toBeNull();
          request.flush(expectedGames);

          expect(gameCache.getGamesCount()).toBeCloseTo(5);
          expect(JSON.stringify(games[0])).toEqual(JSON.stringify([expectedGames[1]]));
          expect(JSON.stringify(games[1])).toEqual(JSON.stringify([expectedGames[0], expectedGames[2], expectedGames[4]]));
          expect(JSON.stringify(games[2])).toEqual(JSON.stringify([expectedGames[3]]));
        });
      });
    });
  });

  describe('updates after initialized', () => {
    const expectedGames = [
      new MultiPlayerGame({id: '1', gamePhase: 'B', lastUpdate: 0}),
      new MultiPlayerGame({id: '2', gamePhase: 'A', lastUpdate: 0}),
      new MultiPlayerGame({id: '3', gamePhase: 'B', lastUpdate: 0}),
      new MultiPlayerGame({id: '4', gamePhase: 'D', lastUpdate: 0}),
      new MultiPlayerGame({id: '5', gamePhase: 'B', lastUpdate: 0}),
    ];

    const games: Map<string, Game[]> = new Map<string, Game[]>();
    beforeEach(() => {
      messageBus.connectionStatus.next(true);
      const request = httpMock.expectOne('/api/player/games');
      expect(request.request.method).toEqual('GET');
      expect(request.request.body).toBeNull();
      request.flush(expectedGames);
      classifier.classificationSubject.next(classifier.classifications);
      classifier.classifications.forEach((c) => {
        games.set(c, null);
        gameCache.getGamesForCategory(c).subscribe(x => games.set(c, x));
      });
    });

    it('clears games on stop', () => {
      messageBus.connectionStatus.next(false);
      expect(gameCache.getGamesCount()).toBeCloseTo(0);
      games.forEach((v, k) => {
        expect(v).toEqual([]);
      });
    });

    const methods = [(game: Game) => {
      messageBus.gameUpdates.next(game);
    }, (game: Game) => {
      gameCache.putGame(game);
    }];

    methods.forEach(method => {
      it('new game adding to list', () => {
        const newGame = new MultiPlayerGame({id: '6', gamePhase: 'A', lastUpdate: 1});
        method(newGame);

        let subscribed: Game;
        gameCache.getGame(newGame.id).subscribe(x => subscribed = x);

        expect(gameCache.getGamesCount()).toBeCloseTo(6);
        expect(JSON.stringify(subscribed)).toEqual(JSON.stringify(newGame));
        expect(JSON.stringify(games.get('A'))).toEqual(JSON.stringify([expectedGames[1], newGame]));
      });

      it('updating newer version of game in list, keeping classification', () => {
        const newGame = new MultiPlayerGame({id: '4', gamePhase: 'D', lastUpdate: 1});
        method(newGame);
        let subscribed: Game;
        gameCache.getGame(newGame.id).subscribe(x => subscribed = x);

        expect(gameCache.getGamesCount()).toBeCloseTo(5);
        expect(JSON.stringify(subscribed)).toEqual(JSON.stringify(newGame));
        expect(JSON.stringify(games.get('D'))).toEqual(JSON.stringify([newGame]));
      });

      it('ignores older version of game in list', () => {
        const newGame = new MultiPlayerGame({id: '4', gamePhase: 'D', lastUpdate: -1});
        method(newGame);
        let subscribed: Game;
        gameCache.getGame(newGame.id).subscribe(x => subscribed = x);

        expect(gameCache.getGamesCount()).toBeCloseTo(5);
        expect(JSON.stringify(subscribed)).toEqual(JSON.stringify(expectedGames[3]));
        expect(JSON.stringify(games.get('D'))).toEqual(JSON.stringify([expectedGames[3]]));
      });

      it('updating newer version of game in list, changing classification', () => {
        const newGame = new MultiPlayerGame({id: '4', gamePhase: 'A', lastUpdate: 1});
        method(newGame);
        let subscribed: Game;
        gameCache.getGame(newGame.id).subscribe(x => subscribed = x);

        expect(gameCache.getGamesCount()).toBeCloseTo(5);
        expect(JSON.stringify(subscribed)).toEqual(JSON.stringify(newGame));
        expect(JSON.stringify(games.get('D'))).toEqual(JSON.stringify([]));
        expect(JSON.stringify(games.get('A'))).toEqual(JSON.stringify([expectedGames[1], newGame]));
      });

      it('deals with non classifiable games on existing classified', () => {
        const newGame = new MultiPlayerGame({id: '4', gamePhase: 'AD', lastUpdate: 1});
        method(newGame);

        let subscribed: Game;
        gameCache.getGame(newGame.id).subscribe(x => subscribed = x);

        expect(gameCache.getGamesCount()).toBeCloseTo(5);
        expect(JSON.stringify(subscribed)).toEqual(JSON.stringify(newGame));
        expect(JSON.stringify(games.get('A'))).toEqual(JSON.stringify([expectedGames[1]]));
        expect(JSON.stringify(games.get('B'))).toEqual(JSON.stringify([expectedGames[0], expectedGames[2], expectedGames[4]]));
        expect(JSON.stringify(games.get('D'))).toEqual(JSON.stringify([]));
        expect(games.get('AD')).toBeUndefined();
      });

      it('deals with non classifiable games on existing classified moving to classified', () => {
        const newGame = new MultiPlayerGame({id: '6', gamePhase: 'AD', lastUpdate: 1});
        method(newGame);

        let subscribed: Game;
        gameCache.getGame(newGame.id).subscribe(x => subscribed = x);

        expect(gameCache.getGamesCount()).toBeCloseTo(6);
        expect(JSON.stringify(subscribed)).toEqual(JSON.stringify(newGame));

        expect(JSON.stringify(games.get('A'))).toEqual(JSON.stringify([expectedGames[1]]));
        expect(JSON.stringify(games.get('B'))).toEqual(JSON.stringify([expectedGames[0], expectedGames[2], expectedGames[4]]));
        expect(JSON.stringify(games.get('D'))).toEqual(JSON.stringify([expectedGames[3]]));
        expect(games.get('AD')).toBeUndefined();

        const updateToGame = new MultiPlayerGame({id: '6', gamePhase: 'D', lastUpdate: 2});
        messageBus.gameUpdates.next(updateToGame);

        expect(gameCache.getGamesCount()).toBeCloseTo(6);
        expect(JSON.stringify(subscribed)).toEqual(JSON.stringify(updateToGame));

        expect(JSON.stringify(games.get('A'))).toEqual(JSON.stringify([expectedGames[1]]));
        expect(JSON.stringify(games.get('B'))).toEqual(JSON.stringify([expectedGames[0], expectedGames[2], expectedGames[4]]));
        expect(JSON.stringify(games.get('D'))).toEqual(JSON.stringify([expectedGames[3], updateToGame]));
        expect(games.get('AD')).toBeUndefined();
      });

    });
  });
});
