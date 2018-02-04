import {NgModule} from '@angular/core';
import {MapKeysPipe} from './map-keys.pipe';

export {MapKeysPipe} from './map-keys.pipe';

@NgModule({
  exports: [
    MapKeysPipe
  ],
  declarations: [
    MapKeysPipe
  ]
})
export class JTBCoreGamesUIUtils {
}
