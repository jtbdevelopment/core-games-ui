import {SinglePlayerGame} from './single-player-game.model';

describe('Model: SinglePlayerGame', () => {
  it('defaults to undefined', () => {
    const g: SinglePlayerGame = new SinglePlayerGame();

    //  select checks from underlying game class
    expect(g.id).toBeUndefined();
    expect(g.version).toBeUndefined();
    expect(g.created).toBeUndefined();
    expect(JSON.stringify(g.players)).toEqual(JSON.stringify({}));

    //  SPG specific checks - none for now
  });
});
