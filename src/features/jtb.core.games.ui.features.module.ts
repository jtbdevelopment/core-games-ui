import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FeatureCacheService} from './feature-cache.service';
import {HttpClientModule} from '@angular/common/http';

export * from './feature-cache.service';
export * from './feature-group.model';
export * from './feature-option.model';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    providers: [
        FeatureCacheService
    ]
})
export class JTBCoreGamesUIFeatures {
}
