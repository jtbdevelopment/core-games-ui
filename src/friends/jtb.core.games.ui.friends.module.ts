import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FriendsService} from './friends.service';
import {HttpClientModule} from '@angular/common/http';

export * from './friend.model';
export * from './friends.service';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    providers: [
        FriendsService
    ]
})
export class JTBCoreGamesUIFriends {
}
