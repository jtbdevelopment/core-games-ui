import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {PlayerService} from './player.service';
import {HttpClientModule} from '@angular/common/http';

export * from './player.model';
export * from './player.service';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    providers: [
        PlayerService
    ]
})
export class JTBCoreGamesUIPlayer {
}
