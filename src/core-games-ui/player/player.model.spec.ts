import {Player} from './player.model';

describe('Model: player', () => {
    it('defaults to undefined player with no admin rights', () => {
        let p: Player = new Player();

        expect(p.id).toBeUndefined();
        expect(p.md5).toBeUndefined();
        expect(p.displayName).toBeUndefined();
        expect(p.adminUser).toBeFalsy();
        expect(p.imageUrl).toBeUndefined();
        expect(p.profileUrl).toBeUndefined();
        expect(p.source).toBeUndefined();
        expect(p.sourceId).toBeUndefined();
        expect(p.lastVersionNotes).toBeUndefined();
        expect(p.gameSpecificPlayerAttributes).toEqual({});
    });

    it('copies from optional param if provided', () => {
        let source: Player = new Player();
        source.imageUrl = 'imageurl';
        source.profileUrl = 'profileUrl';
        source.adminUser = true;
        source.displayName = 'disname';
        source.lastVersionNotes = 'lvn';
        source.source = 's';
        source.sourceId = 'sid';
        source.md5 = 'anmd5';
        source.id = 'someid';
        source.gameSpecificPlayerAttributes = {
            freeGamesRemaining: 32,
            anAttribute: 'X'
        };
        let p: Player = new Player(source);

        expect(p.id).toEqual(source.id);
        expect(p.md5).toEqual(source.md5);
        expect(p.imageUrl).toEqual(source.imageUrl);
        expect(p.profileUrl).toEqual(source.profileUrl);
        //noinspection TypeScriptValidateTypes
        expect(p.adminUser).toEqual(source.adminUser);
        expect(p.displayName).toEqual(source.displayName);
        expect(p.lastVersionNotes).toEqual(source.lastVersionNotes);
        expect(p.source).toEqual(source.source);
        expect(p.sourceId).toEqual(source.sourceId);
        expect(JSON.stringify(p.gameSpecificPlayerAttributes)).toEqual(JSON.stringify(source.gameSpecificPlayerAttributes));
    });

    it('copies from optional param if provided as general json', () => {
        let source: Player = new Player();
        source.imageUrl = 'imageurl';
        source.profileUrl = 'profileUrl';
        source.adminUser = true;
        source.displayName = 'disname';
        source.lastVersionNotes = 'lvn';
        source.source = 's';
        source.sourceId = 'sid';
        source.md5 = 'anmd5';
        source.id = 'someid';
        source.gameSpecificPlayerAttributes = {
            freeGamesRemaining: 32,
            anAttribute: 'X'
        };
        let p: Player = new Player(JSON.parse(JSON.stringify(source)));

        expect(p.id).toEqual(source.id);
        expect(p.md5).toEqual(source.md5);
        expect(p.imageUrl).toEqual(source.imageUrl);
        expect(p.profileUrl).toEqual(source.profileUrl);
        //noinspection TypeScriptValidateTypes
        expect(p.adminUser).toEqual(source.adminUser);
        expect(p.displayName).toEqual(source.displayName);
        expect(p.lastVersionNotes).toEqual(source.lastVersionNotes);
        expect(p.source).toEqual(source.source);
        expect(p.sourceId).toEqual(source.sourceId);
        expect(JSON.stringify(p.gameSpecificPlayerAttributes)).toEqual(JSON.stringify(source.gameSpecificPlayerAttributes));
    });

});
