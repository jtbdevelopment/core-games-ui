import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {AtmosphereService} from './atmosphere.service';
import {AtmosphereMessageProcessorService} from './atmosphere-message-processor.service';

@NgModule({
    imports: [JTBCoreGamesUIMessageBus],
    exports: [JTBCoreGamesUIMessageBus],
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
