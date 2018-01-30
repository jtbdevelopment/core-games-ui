import {ModuleWithProviders, NgModule} from '@angular/core';
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
import {AppConfig} from './appconfig.interface';
import {JTBCoreGamesUIGames} from './games/jtb.core.games.ui.games.module';

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
        JTBCoreGamesUIGames,
        JTBCoreGamesUIFriends,
        JTBCoreGamesUIUtils,
        JTBCoreGamesUIInterceptors,
        JTBCoreGamesUIFacebook
    ],
    exports: [
        JTBCoreGamesUIMessageBus,
        JTBCoreGamesUIGameCache,
        JTBCoreGamesUIFeatures,
        JTBCoreGamesUIPhases,
        JTBCoreGamesUIPlayer,
        JTBCoreGamesUIGames,
        JTBCoreGamesUIFriends,
        JTBCoreGamesUIUtils,
        JTBCoreGamesUIFacebook
    ]
})
export class JTBCoreGamesUI {
    constructor(private appConfig: AppConfig) {
        console.log('Initializing core ui for ' + this.appConfig.appName);
    }

    static forRoot(): ModuleWithProviders {
        return {
            ngModule: JTBCoreGamesUI
        };
    }
}
