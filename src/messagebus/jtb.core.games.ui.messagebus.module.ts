import {NgModule} from '@angular/core';
import {MessageBusService} from './message-bus.service';

export {MessageBusService} from './message-bus.service';

@NgModule({
  providers: [
    MessageBusService,
  ]
})
export class JTBCoreGamesUIMessageBus {
}
