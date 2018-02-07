import {Inject, Injectable} from '@angular/core';
import {Game} from '../games/game.model';
import {GameClassifier} from './game-classifier.serviceinterface';
import {GameFactory} from '../games/gamefactory.serviceinterface';
import {MessageBusService} from '../messagebus/message-bus.service';
import {HttpClient} from '@angular/common/http';
import {from} from 'rxjs/observable/from';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';

//  TODO - split up fetcher from cache logic?
@Injectable()
export class GameCacheService {
  private gamesById: Map<string, BehaviorSubject<Game>> = new Map<string, BehaviorSubject<Game>>();
  private gamesByClassification: Map<string, BehaviorSubject<Game[]>> = new Map<string, BehaviorSubject<Game[]>>();

  private isConnected = false;

  constructor(private http: HttpClient,
              private messageBus: MessageBusService,
              @Inject('GameFactory') private gameFactory: GameFactory,
              @Inject('GameClassifier') private gameClassifier: GameClassifier<any>) {
    gameClassifier.getClassifications().subscribe(classifications => {
      this.initializeCategoryCaches(classifications);
      //  In case classifier took longer than logging in to setup classifications
      this.reclassifyGames();
    });

    this.messageBus.connectionStatus.subscribe(status => {
      this.processConnectionStatus(status);
    });

    this.messageBus.gameUpdates.subscribe(game => {
      this.processGame(game);
    });
  }

  //  probably never used except for testing?
  public getGamesCount(): number {
    return this.gamesById.size;
  }

  public getGame(id: string): Observable<Game> {
    return from(this.gamesById.get(id));
  }

  public getGamesForCategory(category: string): Observable<any[]> {
    return from(this.gamesByClassification.get(category));
  }

  public putGame(game: Game): void {
    this.processGame(game);
  }

  private processGame(game: Game): void {
    let idSubject: BehaviorSubject<Game>;
    let previouslyCachedGame: any;
    if (this.gamesById.has(game.id)) {
      idSubject = this.gamesById.get(game.id);
      previouslyCachedGame = idSubject.getValue();
      if (previouslyCachedGame.lastUpdate > game.lastUpdate) {
        return;
      }
    } else {
      idSubject = new BehaviorSubject<Game>(null);
      this.gamesById.set(game.id, idSubject);
    }
    idSubject.next(game);
    this.classifyGame(game, previouslyCachedGame);
  }

  private classifyGame(game: Game, previouslyCachedGame?: Game): void {
    if (previouslyCachedGame) {
      this.removeClassifiedGame(previouslyCachedGame);
    }
    this.addClassifiedGame(game);
  }

  private addClassifiedGame(game: Game) {
    const classification = this.gameClassifier.classifyGame(game);
    if (this.gamesByClassification.has(classification)) {
      const subject = this.gamesByClassification.get(classification);
      const newGames = subject.getValue().slice();
      newGames.push(game);
      subject.next(newGames);
    }
  }

  private removeClassifiedGame(game: Game): void {
    const classification = this.gameClassifier.classifyGame(game);
    if (this.gamesByClassification.has(classification)) {
      const subject = this.gamesByClassification.get(classification);
      const classifiedGames = subject.getValue().slice();
      const indexToClear = classifiedGames.indexOf(game);
      if (indexToClear >= 0) {
        classifiedGames.splice(indexToClear, 1);
        subject.next(classifiedGames);
      }
    }
  }

  private reclassifyGames(): void {
    const keys = this.gamesById.keys();
    while (1) {
      const id = keys.next();
      if (id.value) {
        const game = this.gamesById.get(id.value).getValue();
        this.classifyGame(game, game);
      }
      if (id.done) {
        break;
      }
    }
  }

  private initializeCategoryCaches(classifications: string[]) {
    this.gamesByClassification = new Map<string, BehaviorSubject<Game[]>>();
    classifications.forEach(c => {
      this.gamesByClassification.set(c, new BehaviorSubject<Game[]>([]));
    });
  }

  private processConnectionStatus(status: boolean) {
    if (status) {
      this.updatesStarted();
    } else {
      this.updatesStopped();
    }
  }

  private updatesStopped(): void {
    this.gamesById.clear();
    this.gamesByClassification.forEach((v) => {
      v.next([]);
    });
    this.isConnected = false;
  }

  private updatesStarted(): void {
    this.isConnected = true;
    this.http.get<any[]>('/api/player/games')
      .map(gameObjects => {
        const games = [];
        gameObjects.forEach(gameObject => {
          games.push(this.gameFactory.newGame(gameObject));
        });
        return games;
      })
      .subscribe(games => {
        games.forEach(game => {
          this.processGame(game);
        });
      });
  }
}
