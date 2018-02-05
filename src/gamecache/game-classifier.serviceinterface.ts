import {Game} from '../games/game.model';
import {Observable} from 'rxjs/Observable';

export interface GameClassifier<G extends Game> {
  //  Buckets of games - aka ['Your turn', 'Their turn', 'Other']  in order of display
  //  expected to be called once
  //  can return [] if not yet initialized
  getClassifications(): Observable<string[]>;

  //  Game buckets to icons - can return empty map if not initialized
  getIcons(): Observable<Map<string, string>>;

  //  Classify game into one of the buckets returned above
  classifyGame(game: G): string;
}
