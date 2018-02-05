import {Game} from './game.model';

export class SinglePlayerGame extends Game {
  constructor(original?: any) {
    super(original);
    Object.assign(this, original);
  }
}
