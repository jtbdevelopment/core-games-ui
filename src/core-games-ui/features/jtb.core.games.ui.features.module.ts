import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FeatureCacheService} from './feature-cache.service';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    exports: [JTBCoreGamesUIMessageBus],
    providers: [
        FeatureCacheService
    ]
})
export class JTBCoreGamesUIFeatures {
}
