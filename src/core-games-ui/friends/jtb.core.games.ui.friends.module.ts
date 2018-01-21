import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FriendsService} from './friends.service';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
    imports: [HttpClientModule, JTBCoreGamesUIMessageBus],
    exports: [JTBCoreGamesUIMessageBus],
    providers: [
        FriendsService
    ]
})
export class JTBCoreGamesUIFriends {
}
