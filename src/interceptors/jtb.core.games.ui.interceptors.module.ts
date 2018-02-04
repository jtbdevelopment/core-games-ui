import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {ErrorInterceptor} from './error.interceptor';
import {HTTP_INTERCEPTORS} from '@angular/common/http';

export {ErrorInterceptor} from './error.interceptor';

@NgModule({
  imports: [
    JTBCoreGamesUIMessageBus
  ],
  exports: [
    JTBCoreGamesUIMessageBus
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true,
  }]
})
export class JTBCoreGamesUIInterceptors {
}
