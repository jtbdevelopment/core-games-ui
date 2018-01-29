import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FeatureCacheService} from './feature-cache.service';
import {HttpClientModule} from '@angular/common/http';
import {Feature} from './feature.model';
import {FeatureOption} from './feature-option.model';
import {FeatureGroup} from './feature-group.model';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    exports: [JTBCoreGamesUIMessageBus, Feature, FeatureOption, FeatureGroup],
    providers: [
        FeatureCacheService
    ]
})
export class JTBCoreGamesUIFeatures {
}
