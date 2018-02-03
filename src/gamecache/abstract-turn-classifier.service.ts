import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {from} from 'rxjs/observable/from';

@Injectable()
export abstract class AbstractTurnClassifier {
    protected static YOUR_TURN: string = 'Your Turn';
    protected static THEIR_TURN: string = 'Their Turn';
    protected static OLDER_GAMES: string = 'Older Games';

    private DEFAULT_CLASSIFICATIONS: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(['Your Turn', 'Their Turn', 'Older Games']);

    private DEFAULT_ICONS: BehaviorSubject<Map<string, string>> = new BehaviorSubject<Map<string, string>>(new Map<string, string>(
        [
            [AbstractTurnClassifier.YOUR_TURN, 'play'],
            [AbstractTurnClassifier.THEIR_TURN, 'pause'],
            [AbstractTurnClassifier.OLDER_GAMES, 'stop']
        ] as [string, string][]
    ));

    //noinspection JSMethodCanBeStatic
    public getClassifications(): Observable<string[]> {
      return from(this.DEFAULT_CLASSIFICATIONS);
    }

    //  Game buckets to icons - can return empty map if not initialized
    //noinspection JSMethodCanBeStatic
    public getIcons(): Observable<Map<string, string>> {
      return from(this.DEFAULT_ICONS);
    }
}
