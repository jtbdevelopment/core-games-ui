import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FriendsService} from './friends.service';
import {HttpClientModule} from '@angular/common/http';

export {Friend} from './friend.model';
export {Invitable} from './invitable.model';
export {FriendsService} from './friends.service';

@NgModule({
  imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
  exports: [HttpClientModule, JTBCoreGamesUIMessageBus],
  providers: [
    FriendsService
  ]
})
export class JTBCoreGamesUIFriends {
}
