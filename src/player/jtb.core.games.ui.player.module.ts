import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {PlayerService} from './player.service';
import {HttpClientModule} from '@angular/common/http';
import {Player} from './player.model';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    exports: [JTBCoreGamesUIMessageBus, Player],
    providers: [
        PlayerService
    ]
})
export class JTBCoreGamesUIPlayer {
}
