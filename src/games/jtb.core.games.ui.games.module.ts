import {NgModule} from '@angular/core';
import {Game} from './game.model';
import {MultiPlayerGame} from './multi-player-game.model';
import {SinglePlayerGame} from './single-player-game.model';
import {StandardPlayerStates} from './player-states.model';

@NgModule({
    exports: [
        Game, MultiPlayerGame, SinglePlayerGame, StandardPlayerStates
    ]
})
export class JTBCoreGamesUIGames {
}
