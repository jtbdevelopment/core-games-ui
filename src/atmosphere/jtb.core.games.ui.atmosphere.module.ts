import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {AtmosphereService} from './atmosphere.service';
import {AtmosphereMessageProcessorService} from './atmosphere-message-processor.service';
import {JTBCoreGamesUIGames} from '../games/jtb.core.games.ui.games.module';

export {AtmosphereMessageProcessorService} from './atmosphere-message-processor.service';
export {AtmosphereRequest} from './atmosphere-request.model';
export {AtmosphereService} from './atmosphere.service';

@NgModule({
  imports: [JTBCoreGamesUIMessageBus, JTBCoreGamesUIGames],
  exports: [JTBCoreGamesUIGames, JTBCoreGamesUIMessageBus],
  providers: [
    AtmosphereService,
    AtmosphereMessageProcessorService
  ]
})
export class JTBCoreGamesUIAtmosphere {
  // noinspection JSUnusedLocalSymbols
  constructor(private atmosphereService: AtmosphereService) {
  }
}
