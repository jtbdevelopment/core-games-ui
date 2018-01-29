import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FriendsService} from './friends.service';
import {HttpClientModule} from '@angular/common/http';
import {Invitable} from './invitable.model';
import {Friend} from './friend.model';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    exports: [JTBCoreGamesUIMessageBus, Invitable, Friend],
    providers: [
        FriendsService
    ]
})
export class JTBCoreGamesUIFriends {
}
