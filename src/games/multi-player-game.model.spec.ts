import {MultiPlayerGame} from './multi-player-game.model';

describe('Model: MultiPlayerGame', () => {
  it('defaults to undefined', () => {
    const g: MultiPlayerGame = new MultiPlayerGame();

    //  select checks from underlying game class
    expect(g.id).toBeUndefined();
    expect(g.version).toBeUndefined();
    expect(g.created).toBeUndefined();
    expect(JSON.stringify(g.players)).toEqual(JSON.stringify({}));

    //  MPG specific checks
    expect(g.maskedForPlayerMD5).toBeUndefined();
    expect(g.maskedForPlayerID).toBeUndefined();
    expect(g.declinedTimestamp).toBeUndefined();
    expect(g.rematchTimestamp).toBeUndefined();
    expect(g.initiatingPlayer).toBeUndefined();
    expect(JSON.stringify(g.playerStates)).toEqual(JSON.stringify({}));
  });

  it('copies from optional param if provided', () => {
    const source: MultiPlayerGame = new MultiPlayerGame();
    source.id = 'id1';
    source.version = 17;
    source.created = 123455;
    source.players = {
      'md51': 'p1',
      'md52': 'p2'
    };

    source.maskedForPlayerID = 'mid';
    source.maskedForPlayerMD5 = 'mmd5';
    source.declinedTimestamp = 8831;
    source.rematchTimestamp = 10204;
    source.initiatingPlayer = 'imd5';
    source.playerStates = {
      'md51': 'Accepted',
      'md52': 'Quit'
    };
    const g: MultiPlayerGame = new MultiPlayerGame(source);

    //  select checks from underlying game class
    expect(g.id).toEqual(source.id);
    expect(g.version).toBeCloseTo(source.version);
    expect(g.created).toBeCloseTo(source.created);
    expect(JSON.stringify(g.players)).toEqual(JSON.stringify(source.players));

    //  MPG specific checks
    expect(g.maskedForPlayerMD5).toEqual(source.maskedForPlayerMD5);
    expect(g.maskedForPlayerID).toEqual(source.maskedForPlayerID);
    expect(g.declinedTimestamp).toBeCloseTo(source.declinedTimestamp);
    expect(g.rematchTimestamp).toBeCloseTo(source.rematchTimestamp);
    expect(g.initiatingPlayer).toEqual(source.initiatingPlayer);
    expect(JSON.stringify(g.playerStates)).toEqual(JSON.stringify(source.playerStates));
  });
});
