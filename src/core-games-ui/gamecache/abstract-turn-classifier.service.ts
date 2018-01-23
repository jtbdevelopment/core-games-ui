import {BehaviorSubject, Observable} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable()
export abstract class AbstractTurnClassifier {
    protected static YOUR_TURN: string = 'Your Turn';
    protected static THEIR_TURN: string = 'Their Turn';
    protected static OLDER_GAMES: string = 'Older Games';

    private static DEFAULT_CLASSIFICATIONS: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(['Your Turn', 'Their Turn', 'Older Games']);

    private static DEFAULT_ICONS: BehaviorSubject<Map<string, string>> = new BehaviorSubject<Map<string, string>>(new Map<string, string>(
        [
            [AbstractTurnClassifier.YOUR_TURN, 'play'],
            [AbstractTurnClassifier.THEIR_TURN, 'pause'],
            [AbstractTurnClassifier.OLDER_GAMES, 'stop']
        ] as [string, string][]
    ));

    //noinspection JSMethodCanBeStatic
    public getClassifications(): Observable<string[]> {
        return Observable.from(AbstractTurnClassifier.DEFAULT_CLASSIFICATIONS);
    }

    //  Game buckets to icons - can return empty map if not initialized
    //noinspection JSMethodCanBeStatic
    public getIcons(): Observable<Map<string, string>> {
        return Observable.from(AbstractTurnClassifier.DEFAULT_ICONS);
    }
}
