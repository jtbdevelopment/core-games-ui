import {BehaviorSubject, Observable} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable()
export abstract class AbstractTurnClassifier {
    protected static YOUR_TURN: string = 'Your Turn';
    protected static THEIR_TURN: string = 'Their Turn';
    protected static OLDER_GAMES: string = 'Older Games';

    //noinspection JSMethodCanBeStatic
    public getClassifications(): Observable<string[]> {
        return new BehaviorSubject(['Your Turn', 'Their Turn', 'Older Games']);
    }

    //  Game buckets to icons - can return empty map if not initialized
    //noinspection JSMethodCanBeStatic
    public getIcons(): Observable<Map<string, string>> {
        return new BehaviorSubject(
            new Map<string, string>(
                [
                    [AbstractTurnClassifier.YOUR_TURN, 'play'],
                    [AbstractTurnClassifier.THEIR_TURN, 'pause'],
                    [AbstractTurnClassifier.OLDER_GAMES, 'stop']
                ] as [string, string][]
            )
        );
    }
}
