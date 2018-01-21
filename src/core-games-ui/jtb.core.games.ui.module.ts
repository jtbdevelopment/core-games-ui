import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from './messagebus/jtb.core.games.ui.messagebus.module';
import {JTBCoreGamesUIAtmosphere} from './atmosphere/jtb.core.games.ui.atmosphere.module';
import {JTBCoreGamesUIGameCache} from './gamecache/jtb.core.games.ui.gamecache.module';
import {JTBCoreGamesUIPhases} from './phases/jtb.core.games.ui.phases.module';
import {JTBCoreGamesUIPlayer} from './player/jtb.core.games.ui.player.module';
import {JTBCoreGamesUIUtils} from './utils/jtb.core.games.ui.utils.module';
import {JTBCoreGamesUIFeatures} from './features/jtb.core.games.ui.features.module';
import {JTBCoreGamesUIFriends} from './friends/jtb.core.games.ui.friends.module';
import {JTBCoreGamesUIInterceptors} from './interceptors/jtb.core.games.ui.interceptors.module';
import {JTBCoreGamesUIFacebook} from './facebook/jtb.core.games.ui.facebook.module';

export {AppConfig} from './appconfig.interface';

//  Use of this module presumes:
//  1.  You will implement GameFactory and provide as 'GameFactory'
//  2.  You will create (or re-use PhaseGameClassifier) an GameClassifier and provide as 'GameClassifier'
@NgModule({
    imports: [
        JTBCoreGamesUIAtmosphere,
        JTBCoreGamesUIMessageBus,
        JTBCoreGamesUIGameCache,
        JTBCoreGamesUIFeatures,
        JTBCoreGamesUIPhases,
        JTBCoreGamesUIPlayer,
        JTBCoreGamesUIFriends,
        JTBCoreGamesUIUtils,
        JTBCoreGamesUIInterceptors,
        JTBCoreGamesUIFacebook
    ],
    exports: [
        JTBCoreGamesUIAtmosphere,
        JTBCoreGamesUIMessageBus,
        JTBCoreGamesUIGameCache,
        JTBCoreGamesUIFeatures,
        JTBCoreGamesUIPhases,
        JTBCoreGamesUIPlayer,
        JTBCoreGamesUIFriends,
        JTBCoreGamesUIUtils,
        JTBCoreGamesUIInterceptors,
        JTBCoreGamesUIFacebook
    ]
})
export class JTBCoreGamesUI {
}
