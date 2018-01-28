import {Injectable} from '@angular/core';
import {Player} from '../player/player.model';
import {BehaviorSubject, Subject} from 'rxjs';
import {Game} from '../games/game.model';

@Injectable()
export class MessageBusService {
    connectionStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    // In general, for internal use
    // Use the feed off player service, which handles logged in vs simulated player
    playerUpdates: Subject<Player> = new Subject<Player>();

    // In general, for internal use
    // Use the feed off game cache which handles race conditions on updates
    gameUpdates: Subject<Game> = new Subject<Game>();

    //  Ticks when invalid sessions occurs
    invalidSessionError: Subject<any> = new Subject<any>();

    //  Ticks when general error occurs
    generalError: Subject<any> = new Subject<any>();
}
