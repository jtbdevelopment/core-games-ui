import {Game} from './game.model';

describe('Model: Game', () => {
    it('defaults to undefined', () => {
        let g: Game = new Game();

        expect(g.id).toBeUndefined();
        expect(g.previousId).toBeUndefined();
        expect(g.version).toBeUndefined();
        expect(g.round).toBeUndefined();
        expect(g.created).toBeUndefined();
        expect(g.lastUpdate).toBeUndefined();
        expect(g.completedTimestamp).toBeUndefined();
        expect(g.gamePhase).toBeUndefined();
        expect(JSON.stringify(g.features)).toEqual(JSON.stringify([]));
        expect(JSON.stringify(g.players)).toEqual(JSON.stringify({}));
        expect(JSON.stringify(g.playerProfiles)).toEqual(JSON.stringify({}));
        expect(JSON.stringify(g.playerImages)).toEqual(JSON.stringify({}));
    });

    it('copies from optional param if provided', () => {
        let source: Game = new Game();
        source.id = 'id1';
        source.previousId = 'pid';
        source.version = 3;
        source.round = 4;
        source.created = 123455;
        source.lastUpdate = source.created + 100;
        source.completedTimestamp = source.lastUpdate + 200;
        source.gamePhase = 'aphase';
        source.players = {
            'md51': 'p1',
            'md52': 'p2'
        };
        source.playerImages = {
            'md52': 'imageurl2',
            'md51': 'imageurl1'
        };
        source.playerProfiles = {
            'md52': 'profile2',
            'md51': 'profile2'
        };
        source.features = ['F1', 'F3', 'F2'];
        let g: Game = new Game(source);

        expect(g.id).toEqual(source.id);
        expect(g.previousId).toEqual(source.previousId);
        expect(g.version).toBeCloseTo(source.version);
        expect(g.round).toBeCloseTo(source.round);
        expect(g.created).toBeCloseTo(source.created);
        expect(g.lastUpdate).toBeCloseTo(source.lastUpdate);
        expect(g.completedTimestamp).toBeCloseTo(source.completedTimestamp);
        expect(g.gamePhase).toEqual(source.gamePhase);
        expect(JSON.stringify(g.features)).toEqual(JSON.stringify(source.features));
        expect(JSON.stringify(g.players)).toEqual(JSON.stringify(source.players));
        expect(JSON.stringify(g.playerProfiles)).toEqual(JSON.stringify(source.playerProfiles));
        expect(JSON.stringify(g.playerImages)).toEqual(JSON.stringify(source.playerImages));
    });

    it('copies from optional param if provided, as map', () => {
        let source = {
            id: 'id1',
            previousId: 'pid',
            version: 3,
            round: 4,
            created: 123455,
            lastUpdate: 1233455,
            completedTimestamp: 12334135,
            gamePhase: 'aphase',
            players: {
                'md51': 'p1',
                'md52': 'p2'
            },
            playerImages: {
                'md52': 'imageurl2',
                'md51': 'imageurl1'
            },
            playerProfiles: {
                'md52': 'profile2',
                'md51': 'profile2'
            },
            features: ['F1', 'F3', 'F2']
        };
        let g: Game = new Game(source);

        expect(g.id).toEqual(source.id);
        expect(g.previousId).toEqual(source.previousId);
        expect(g.version).toBeCloseTo(source.version);
        expect(g.round).toBeCloseTo(source.round);
        expect(g.created).toBeCloseTo(source.created);
        expect(g.lastUpdate).toBeCloseTo(source.lastUpdate);
        expect(g.completedTimestamp).toBeCloseTo(source.completedTimestamp);
        expect(g.gamePhase).toEqual(source.gamePhase);
        expect(JSON.stringify(g.features)).toEqual(JSON.stringify(source.features));
        expect(JSON.stringify(g.players)).toEqual(JSON.stringify(source.players));
        expect(JSON.stringify(g.playerProfiles)).toEqual(JSON.stringify(source.playerProfiles));
        expect(JSON.stringify(g.playerImages)).toEqual(JSON.stringify(source.playerImages));
    });

    it('computes standard link', function () {
        let g: Game = new Game({id: 'myid', gamePhase: 'APhase'});
        expect(g.standardLink()).toEqual('/game/aphase/myid');
    });
});
