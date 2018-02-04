import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {PhaseCacheService} from './phase-cache.service';
import {HttpClientModule} from '@angular/common/http';

export {Phase} from './phase.model';
export {StandardPhases} from './standard-phases.model';
export {PhaseCacheService} from './phase-cache.service';

@NgModule({
  imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
  exports: [HttpClientModule, JTBCoreGamesUIMessageBus],
  providers: [
    PhaseCacheService
  ]
})
export class JTBCoreGamesUIPhases {
}
