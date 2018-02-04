import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {FacebookInitializerService} from './facebook-initializer.service';
import {FacebookLoginService} from './facebook-login.service';
import {JTBCoreGamesUIPlayer} from '../player/jtb.core.games.ui.player.module';
import {FacebookIdentifyVerifierService} from './facebook-identity-verifier.service';
import {FacebookInviteService} from './facebook-invite.service';

export {FacebookInviteService} from './facebook-invite.service';
export {FacebookLoginService} from './facebook-login.service';
export {FacebookInitializerService} from './facebook-initializer.service';
export {FacebookIdentifyVerifierService} from './facebook-identity-verifier.service';

@NgModule({
  imports: [JTBCoreGamesUIMessageBus, JTBCoreGamesUIPlayer],
  exports: [JTBCoreGamesUIMessageBus, JTBCoreGamesUIPlayer],
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
