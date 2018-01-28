import {Game} from './game.model';

export class MultiPlayerGame extends Game {
    public maskedForPlayerID: string;
    public maskedForPlayerMD5: string;

    public declinedTimestamp: number;
    public rematchTimestamp: number;

    public initiatingPlayer: string;
    public playerStates: any = {};  // md5 to state

    constructor(original?: any) {
        super(original);
        Object.assign(this, original);
    }
}
