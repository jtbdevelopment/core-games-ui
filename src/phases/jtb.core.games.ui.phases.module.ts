import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {PhaseCacheService} from './phase-cache.service';
import {HttpClientModule} from '@angular/common/http';
// noinspection ES6UnusedImports
import {StandardPhases} from './standard-phases.model';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    exports: [JTBCoreGamesUIMessageBus],
    providers: [
        PhaseCacheService
    ]
})
export class JTBCoreGamesUIPhases {
}
