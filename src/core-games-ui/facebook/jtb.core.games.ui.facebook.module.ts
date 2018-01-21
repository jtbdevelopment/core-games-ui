import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FacebookInitializerService} from './facebook-initializer.service';
import {FacebookLoginService} from './facebook-login.service';
import {JTBCoreGamesUIPlayer} from '../player/jtb.core.games.ui.player.module';
import {FacebookIdentifyVerifierService} from './facebook-identity-verifier.service';
import {FacebookInviteService} from './facebook-invite.service';

@NgModule({
    imports: [JTBCoreGamesUIMessageBus, JTBCoreGamesUIPlayer],
    exports: [JTBCoreGamesUIMessageBus],
    providers: [
        FacebookInitializerService,
        FacebookIdentifyVerifierService,
        FacebookLoginService,
        FacebookInviteService
    ]
})
export class JTBCoreGamesUIFacebook {
    // noinspection JSUnusedLocalSymbols
    constructor(private initializer: FacebookInitializerService, private verifier: FacebookIdentifyVerifierService) {
    }
}
