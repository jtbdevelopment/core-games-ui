'use strict';

describe('Service: gameCache', function () {
    // load the controller's module
    beforeEach(module('coreGamesUi.services'));

    var ng1 = {id: 'ng1', gamePhase: 'Phase1'};
    var ng2 = {id: 'ng2', gamePhase: 'Phase1'};
    var ng3 = {id: 'ng3', gamePhase: 'Phase2'};
    var ng4 = {id: 'ng4', gamePhase: 'Phase1'};

    var phaseDeferred;
    var phases = {Phase1: [], Phase2: [], Phase3: []};
    var alt1 = 'Alt 1';
    var alt2 = 'Another';
    var alternates = [alt1, alt2];

    var baseURL = '/api/player/MANUAL1';
    var gamesURL = '/games';

    var altClass1Flag = true;

    beforeEach(module(function ($provide) {
        baseURL = '/api/player/MANUAL1';
        $provide.factory('jtbGamePhaseService', ['$q', function ($q) {
            return {
                phases: function () {
                    phaseDeferred = $q.defer();
                    return phaseDeferred.promise;
                }
            };
        }]);
        $provide.factory('jtbPlayerService', function () {
            return {
                currentPlayerBaseURL: function () {
                    return baseURL;
                }
            };
        });
        $provide.factory('jtbLiveGameFeed', function () {
            return {};
        });
        $provide.factory('jtbGameClassifier', [function () {
            return {
                getClassifications: function () {
                    return alternates;
                },
                getClassification: function (game) {
                    console.log(altClass1Flag);
                    return (altClass1Flag === true && game.lastUpdate !== 1001 ) ? alt1 : alt2;
                }
            };
        }]);
    }));

    var service, rootScope, location, http;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($injector, $q, $rootScope, $location, $httpBackend) {
        rootScope = $rootScope;
        location = $location;
        http = $httpBackend;
        spyOn(location, 'path');
        spyOn(rootScope, '$broadcast').and.callThrough();
        service = $injector.get('jtbGameCache');
    }));

    describe('test initialization', function () {
        beforeEach(function () {
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
        });
        afterEach(function () {
            expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));
            expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
        });

        it('initializes cache on player loaded and waits for player live feed for games', function () {
            expect(service.initialized()).toEqual(false);
            phaseDeferred.resolve(phases);
            rootScope.$apply();
            expect(service.initialized()).toEqual(true);
            expect(service.getGamesForPhase('Phase1')).toEqual([]);
            expect(service.getGamesForPhase('Phase2')).toEqual([]);
            expect(service.getGamesForPhase('Phase3')).toEqual([]);
            expect(service.getGamesForPhase('All')).toEqual([]);
            expect(service.getGamesForPhase(alt1)).toEqual([]);
            expect(service.getGamesForPhase(alt2)).toEqual([]);

            http.expectGET(baseURL + gamesURL).respond([ng3]);
            rootScope.$broadcast('liveFeedEstablished');
            rootScope.$apply();
            http.flush();
            expect(service.getGamesForPhase('Phase1')).toEqual([]);
            expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
            expect(service.getGamesForPhase('Phase3')).toEqual([]);
            expect(service.getGamesForPhase('All')).toEqual([ng3]);
            expect(service.getGamesForPhase(alt1)).toEqual([ng3]);
            expect(service.getGamesForPhase(alt2)).toEqual([]);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
        });

        it('asking for a game before initialization yields undefined', function () {
            expect(service.getGameForID('ng3')).toBeUndefined();
            expect(service.initialized()).toEqual(false);

            http.expectGET(baseURL + gamesURL).respond([ng3]);
            phaseDeferred.resolve(phases);
            rootScope.$apply();
            rootScope.$broadcast('liveFeedEstablished');
            rootScope.$apply();
            http.flush();
            expect(service.getGameForID('ng3')).toEqual(ng3);
        });

        it('errors when phases errors', function () {
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
            phaseDeferred.reject();
            rootScope.$apply();
            expect(service.initialized()).toEqual(false);
            expect(location.path).toHaveBeenCalledWith('/error');
        });

        it('errors when http.get errors', function () {
            http.expectGET(baseURL + gamesURL).respond(500, {});
            phaseDeferred.resolve(phases);
            rootScope.$apply();
            rootScope.$broadcast('liveFeedEstablished');
            rootScope.$apply();
            http.flush();
            expect(service.initialized()).toEqual(true);
            expect(location.path).toHaveBeenCalledWith('/error');
        });

        it('re-initializes on player switch', function () {
            expect(service.initialized()).toEqual(false);
            http.expectGET(baseURL + gamesURL).respond([ng3]);
            phaseDeferred.resolve(phases);
            rootScope.$apply();
            expect(service.initialized()).toEqual(true);
            rootScope.$broadcast('liveFeedEstablished');
            rootScope.$apply();
            expect(service.initialized()).toEqual(true);
            http.flush();
            expect(service.initialized()).toEqual(true);
            expect(service.getGamesForPhase('Phase1')).toEqual([]);
            expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
            expect(service.getGamesForPhase('Phase3')).toEqual([]);
            expect(service.getGamesForPhase('All')).toEqual([ng3]);
            expect(service.getGamesForPhase(alt1)).toEqual([ng3]);
            expect(service.getGamesForPhase(alt2)).toEqual([]);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);

            var referenceHoldover = service.getGamesForPhase('All');

            baseURL = '/api/player/MANUAL3';
            http.expectGET(baseURL + gamesURL).respond([ng1]);
            expect(service.initialized()).toEqual(true);
            rootScope.$broadcast('liveFeedEstablished');
            rootScope.$apply();
            expect(service.initialized()).toEqual(true);
            http.flush();
            expect(service.initialized()).toEqual(true);
            expect(service.getGamesForPhase('Phase1')).toEqual([ng1]);
            expect(service.getGamesForPhase('Phase2')).toEqual([]);
            expect(service.getGamesForPhase('Phase3')).toEqual([]);
            expect(service.getGamesForPhase('All')).toEqual([ng1]);
            expect(service.getGamesForPhase(alt1)).toEqual([ng1]);
            expect(service.getGamesForPhase(alt2)).toEqual([]);
            expect(referenceHoldover).toEqual([ng1]);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 2);
        });

        it('re-initializes on refreshGames games', function () {
            http.expectGET(baseURL + gamesURL).respond([ng3]);
            phaseDeferred.resolve(phases);
            rootScope.$apply();
            rootScope.$broadcast('liveFeedEstablished');
            rootScope.$apply();
            http.flush();
            expect(service.getGamesForPhase('Phase1')).toEqual([]);
            expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
            expect(service.getGamesForPhase('Phase3')).toEqual([]);
            expect(service.getGamesForPhase('All')).toEqual([ng3]);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);

            var referenceHoldover = service.getGamesForPhase('All');

            http.expectGET(baseURL + gamesURL).respond([ng1, ng2]);
            rootScope.$broadcast('refreshGames');
            http.flush();
            expect(service.getGamesForPhase('Phase1')).toEqual([ng1, ng2]);
            expect(service.getGamesForPhase('Phase2')).toEqual([]);
            expect(service.getGamesForPhase('Phase3')).toEqual([]);
            expect(service.getGamesForPhase('All')).toEqual([ng1, ng2]);
            expect(service.getGamesForPhase(alt1)).toEqual([ng1, ng2]);
            expect(service.getGamesForPhase(alt2)).toEqual([]);
            expect(referenceHoldover).toEqual([ng1, ng2]);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 2);
        });
    });

    describe('test usage', function () {
        beforeEach(function () {
            altClass1Flag = true;
            rootScope.$broadcast('playerLoaded');
            rootScope.$apply();
            phaseDeferred.resolve(phases);
            http.expectGET(baseURL + gamesURL).respond([ng1, ng2, ng3, ng4]);
            rootScope.$apply();
            rootScope.$broadcast('liveFeedEstablished');
            rootScope.$apply();
            http.flush();
        });

        afterEach(function () {
            //  From initialization
            expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
        });

        it('can serve game by id', function () {
            expect(service.getGameForID(ng1.id)).toEqual(ng1);
        });

        it('can serve game by bad id', function () {
            expect(service.getGameForID('badid')).toBeUndefined();
        });

        describe('takes in updates via various means', function () {
            ng1.lastUpdate = 1000;
            var updateMeans = {
                'direct update': function (game) {
                    service.putUpdatedGame(game);
                },
                'via gameUpdate broadcast': function (game) {
                    rootScope.$broadcast('gameUpdate', game.id, game);
                }
            };
            angular.forEach(updateMeans, function (updateCall, name) {
                describe('takes updates via ' + name, function () {

                    it('takes in a new game update', function () {
                        var ng5 = {id: 'ng5', gamePhase: 'Phase2'};
                        altClass1Flag = false;
                        updateCall(ng5);
                        expect(service.getGamesForPhase('Phase1')).toEqual([ng1, ng2, ng4]);
                        expect(service.getGamesForPhase('Phase2')).toEqual([ng3, ng5]);
                        expect(service.getGamesForPhase('Phase3')).toEqual([]);
                        expect(service.getGamesForPhase('All')).toEqual([ng1, ng2, ng3, ng4, ng5]);
                        expect(service.getGamesForPhase(alt1)).toEqual([ng1, ng2, ng3, ng4]);
                        expect(service.getGamesForPhase(alt2)).toEqual([ng5]);
                        expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng5);
                    });

                    it('takes in a newer game update', function () {
                        var ng1v2 = angular.copy(ng1);
                        ng1v2.lastUpdate = 1001;
                        updateCall(ng1v2);

                        expect(service.getGamesForPhase('Phase1')).toEqual([ng1v2, ng2, ng4]);
                        expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                        expect(service.getGamesForPhase('Phase3')).toEqual([]);
                        expect(service.getGamesForPhase('All')).toEqual([ng1v2, ng2, ng3, ng4]);
                        expect(service.getGamesForPhase(alt1)).toEqual([ng2, ng3, ng4]);
                        expect(service.getGamesForPhase(alt2)).toEqual([ng1v2]);
                        expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdated', ng1, ng1v2);
                        expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));
                    });

                    it('takes in a newer game update to a new phase', function () {
                        var ng1v2 = angular.copy(ng1);
                        ng1v2.lastUpdate = 1001;
                        ng1v2.gamePhase = 'Phase2';
                        updateCall(ng1v2);

                        expect(service.getGamesForPhase('Phase1')).toEqual([ng2, ng4]);
                        expect(service.getGamesForPhase('Phase2')).toEqual([ng3, ng1v2]);
                        expect(service.getGamesForPhase('Phase3')).toEqual([]);
                        expect(service.getGamesForPhase('All')).toEqual([ng1v2, ng2, ng3, ng4]);
                        expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdated', ng1, ng1v2);
                        expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));
                    });

                    it('takes in multiple game updates to a new phase', function () {
                        var ng1v2 = angular.copy(ng1);
                        ng1v2.lastUpdate = 1001;
                        ng1v2.gamePhase = 'Phase2';
                        updateCall(ng1v2);

                        expect(service.getGamesForPhase('Phase1')).toEqual([ng2, ng4]);
                        expect(service.getGamesForPhase('Phase2')).toEqual([ng3, ng1v2]);
                        expect(service.getGamesForPhase('Phase3')).toEqual([]);
                        expect(service.getGamesForPhase('All')).toEqual([ng1v2, ng2, ng3, ng4]);
                        expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdated', ng1, ng1v2);
                        expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));

                        var ng2v2 = angular.copy(ng2);
                        ng2v2.lastUpdate = 1001;
                        ng2v2.gamePhase = 'Phase2';
                        updateCall(ng2v2);

                        expect(service.getGamesForPhase('Phase1')).toEqual([ng4]);
                        expect(service.getGamesForPhase('Phase2')).toEqual([ng3, ng1v2, ng2v2]);
                        expect(service.getGamesForPhase('Phase3')).toEqual([]);
                        expect(service.getGamesForPhase('All')).toEqual([ng1v2, ng2v2, ng3, ng4]);
                        expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdated', ng2, ng2v2);
                        expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));
                    });

                    it('rejects a stale game update, matching time', function () {
                        var ng1v2 = angular.copy(ng1);
                        ng1v2.lastUpdate = 1000;
                        ng1v2.someDifferentiator = 'X';
                        updateCall(ng1v2);
                        expect(service.getGamesForPhase('Phase1')).toEqual([ng1, ng2, ng4]);
                        expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                        expect(service.getGamesForPhase('Phase3')).toEqual([]);
                        expect(service.getGamesForPhase('All')).toEqual([ng1, ng2, ng3, ng4]);
                        expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                        expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));
                    });

                    it('rejects a stale game update, older time', function () {
                        var ng1v2 = angular.copy(ng1);
                        ng1v2.lastUpdate = 999;
                        ng1v2.someDifferentiator = 'X';
                        updateCall(ng1v2);
                        expect(service.getGamesForPhase('Phase1')).toEqual([ng1, ng2, ng4]);
                        expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                        expect(service.getGamesForPhase('Phase3')).toEqual([]);
                        expect(service.getGamesForPhase('All')).toEqual([ng1, ng2, ng3, ng4]);
                        expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                        expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));
                    });
                });
            });
        });
    });
});
