import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FeatureCacheService} from './feature-cache.service';
import {HttpClientModule} from '@angular/common/http';

export {FeatureCacheService} from './feature-cache.service';
export {FeatureGroup} from './feature-group.model';
export {FeatureOption} from './feature-option.model';
export {Feature} from './feature.model';

@NgModule({
  imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
  exports: [HttpClientModule, JTBCoreGamesUIMessageBus],
  providers: [
    FeatureCacheService
  ]
})
export class JTBCoreGamesUIFeatures {
}
