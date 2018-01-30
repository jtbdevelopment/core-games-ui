import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {PhaseCacheService} from './phase-cache.service';
import {HttpClientModule} from '@angular/common/http';

export * from './phase.model';
export * from './standard-phases.model';
export * from './phase-cache.service';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    providers: [
        PhaseCacheService
    ]
})
export class JTBCoreGamesUIPhases {
}
