import {NgModule} from '@angular/core';
import {JTBCoreGamesUIMessageBus} from '../messagebus/jtb.core.games.ui.messagebus.module';
import {JTBCoreGamesUIPhases} from '../phases/jtb.core.games.ui.phases.module';
import {GameCacheService} from './game-cache.service';
import {PhaseGameClassifier} from './phase-game-classifier.service';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
    imports: [JTBCoreGamesUIMessageBus, HttpClientModule, JTBCoreGamesUIPhases],
    exports: [JTBCoreGamesUIMessageBus, JTBCoreGamesUIPhases],
    providers: [
        GameCacheService,
        PhaseGameClassifier
    ]
})
export class JTBCoreGamesUIGameCache {
}
