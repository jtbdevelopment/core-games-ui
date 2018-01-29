import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {PhaseCacheService} from './phase-cache.service';
import {HttpClientModule} from '@angular/common/http';
import {StandardPhases} from './standard-phases.model';
import {Phase} from './phase.model';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    exports: [JTBCoreGamesUIMessageBus, StandardPhases, Phase],
    providers: [
        PhaseCacheService
    ]
})
export class JTBCoreGamesUIPhases {
}
