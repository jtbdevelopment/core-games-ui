'use strict';

describe('Service: gameCache', function () {
    // load the controller's module
    beforeEach(module('coreGamesUi.services'));

    var ng1 = {id: 'ng1', gamePhase: 'Phase1'};
    var ng2 = {id: 'ng2', gamePhase: 'Phase1'};
    var ng3 = {id: 'ng3', gamePhase: 'Phase2'};
    var ng4 = {id: 'ng4', gamePhase: 'Phase1', lastUpdate: 1000};

    var phaseDeferred;
    var phases = {Phase1: [], Phase2: [], Phase3: []};
    var alt1 = 'Alt 1';
    var alt2 = 'Another';
    var alternates = [alt1, alt2];

    var baseURL = '/api/player/MANUAL1';
    var initialMD5 = '4jjd42oi0x';
    var altMD5 = initialMD5 + 'X';
    var currentPlayer = {
        md5: initialMD5
    };
    var gamesURL = '/games';

    var altClass1Flag = true;

    var window;

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
                },
                currentPlayer: function () {
                    return currentPlayer;
                }
            };
        });
        $provide.factory('jtbLiveGameFeed', function () {
            return {};
        });
    }));

    var service, rootScope, http;

    // Initialize the controller and a mock scope
    function mainCacheKey() {
        return 'gameCache-' + initialMD5;
    }

    function altCacheKey() {
        return 'gameCache-' + altMD5;
    }

    describe('without a custom classifier - limited tests', function () {
        beforeEach(inject(function ($injector, $q, $rootScope, $httpBackend, $window) {
            rootScope = $rootScope;
            http = $httpBackend;
            window = $window;
            spyOn(rootScope, '$broadcast').and.callThrough();

            window.localStorage[mainCacheKey()] = '[]';
            window.localStorage[altCacheKey()] = '[]';
            currentPlayer.md5 = initialMD5;

            service = $injector.get('jtbGameCache');
        }));

        describe('test initialization, no initial local storage', function () {
            beforeEach(function () {
                rootScope.$broadcast('playerLoaded');
                rootScope.$apply();
            });

            it('initialize started but live feed comes in before done, pends on initialize', function() {
                expect(service.initialized()).toEqual(false);
                rootScope.$broadcast('liveFeedEstablished');
                rootScope.$apply();

                http.expectGET(baseURL + gamesURL).respond([ng3]);
                phaseDeferred.resolve(phases);
                rootScope.$apply();
                http.flush();
                expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
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
                expect(service.getGamesForPhase(alt1)).toBeUndefined();
                expect(service.getGamesForPhase(alt2)).toBeUndefined();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 0);

                http.expectGET(baseURL + gamesURL).respond([ng3]);
                rootScope.$broadcast('liveFeedEstablished');
                rootScope.$apply();
                http.flush();
                expect(service.getGamesForPhase('Phase1')).toEqual([]);
                expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                expect(service.getGamesForPhase('Phase3')).toEqual([]);
                expect(service.getGamesForPhase('All')).toEqual([ng3]);
                expect(service.getGamesForPhase(alt1)).toBeUndefined();
                expect(service.getGamesForPhase(alt2)).toBeUndefined();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng3);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameRemoved', jasmine.any(Object));

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng3]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
            });

            it('initialize started but refresh games comes in before done, pends on initialize', function() {
                expect(service.initialized()).toEqual(false);
                rootScope.$broadcast('refreshGames');
                rootScope.$apply();

                http.expectGET(baseURL + gamesURL).respond([ng3]);
                phaseDeferred.resolve(phases);
                rootScope.$apply();
                http.flush();
                expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
            });

        });

        describe('test initialization, with local storage', function () {
            beforeEach(function () {
                window.localStorage[mainCacheKey()] = JSON.stringify([ng1, ng2, ng3]);
                window.localStorage[altCacheKey()] = JSON.stringify([ng4]);
                rootScope.$broadcast('playerLoaded');
                rootScope.$apply();
            });

            it('initializes cache on player loaded and waits for player live feed for games', function () {
                expect(service.initialized()).toEqual(false);
                phaseDeferred.resolve(phases);
                rootScope.$apply();
                expect(service.initialized()).toEqual(true);
                expect(service.getGamesForPhase('Phase1')).toEqual([ng1, ng2]);
                expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                expect(service.getGamesForPhase('Phase3')).toEqual([]);
                expect(service.getGamesForPhase('All')).toEqual([ng1, ng2, ng3]);
                expect(service.getGamesForPhase(alt1)).toBeUndefined();
                expect(service.getGamesForPhase(alt2)).toBeUndefined();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 0);

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1, ng2, ng3]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([ng4]));

                var ng1v2 = angular.copy(ng1);
                ng1v2.lastUpdate = 1001;
                ng1v2.gamePhase = 'Phase3';
                http.expectGET(baseURL + gamesURL).respond([ng3, ng1v2, ng4]);
                rootScope.$broadcast('liveFeedEstablished');
                rootScope.$apply();
                http.flush();
                expect(service.getGamesForPhase('Phase1')).toEqual([ng4]);
                expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                expect(service.getGamesForPhase('Phase3')).toEqual([ng1v2]);
                expect(service.getGamesForPhase('All')).toEqual([ng1v2, ng3, ng4]);
                expect(service.getGamesForPhase(alt1)).toBeUndefined();
                expect(service.getGamesForPhase(alt2)).toBeUndefined();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng4);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdated', ng1, ng1v2);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameRemoved', ng2);

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1v2, ng3, ng4]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([ng4]));

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
                rootScope.$broadcast.calls.reset();
            });

            afterEach(function () {
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameDeleted', jasmine.any(Object));
            });

            it('can serve game by id', function () {
                expect(service.getGameForID(ng1.id)).toEqual(ng1);
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
                            expect(service.getGamesForPhase(alt1)).toBeUndefined();
                            expect(service.getGamesForPhase(alt2)).toBeUndefined();
                            expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng5);
                            expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));

                            expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1, ng2, ng3, ng4, ng5]));
                            expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
                        });

                        it('takes in a newer game update', function () {
                            var ng1v2 = angular.copy(ng1);
                            ng1v2.lastUpdate = 1001;
                            updateCall(ng1v2);

                            expect(service.getGamesForPhase('Phase1')).toEqual([ng1v2, ng2, ng4]);
                            expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                            expect(service.getGamesForPhase('Phase3')).toEqual([]);
                            expect(service.getGamesForPhase('All')).toEqual([ng1v2, ng2, ng3, ng4]);
                            expect(service.getGamesForPhase(alt1)).toBeUndefined();
                            expect(service.getGamesForPhase(alt2)).toBeUndefined();
                            expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdated', ng1, ng1v2);
                            expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));

                            expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1v2, ng2, ng3, ng4]));
                            expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
                        });

                    });
                });
            });
        });
    });

    describe('with a custom classifier', function () {
        beforeEach(module(function ($provide) {
            $provide.factory('jtbGameClassifier', [function () {
                return {
                    getClassifications: function () {
                        return alternates;
                    },
                    getClassification: function (game) {
                        return (altClass1Flag === true && game.lastUpdate !== 1001 ) ? alt1 : alt2;
                    }
                };
            }]);
        }));
        beforeEach(inject(function ($injector, $q, $rootScope, $httpBackend, $window) {
            rootScope = $rootScope;
            http = $httpBackend;
            window = $window;
            spyOn(rootScope, '$broadcast').and.callThrough();

            window.localStorage[mainCacheKey()] = '[]';
            window.localStorage[altCacheKey()] = '[]';
            currentPlayer.md5 = initialMD5;

            service = $injector.get('jtbGameCache');
        }));

        describe('test initialization, no initial local storage', function () {
            beforeEach(function () {
                rootScope.$broadcast('playerLoaded');
                rootScope.$apply();
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
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 0);

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
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng3);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameRemoved', jasmine.any(Object));

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng3]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
            });

            it('asking for a game before initialization yields undefined', function () {
                expect(service.getGameForID('ng3')).toBeUndefined();
                expect(service.initialized()).toEqual(false);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameRemoved', jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameCachesLoaded', 0);

                http.expectGET(baseURL + gamesURL).respond([ng3]);
                phaseDeferred.resolve(phases);
                rootScope.$apply();
                rootScope.$broadcast('liveFeedEstablished');
                rootScope.$apply();
                http.flush();
                expect(service.getGameForID('ng3')).toEqual(ng3);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng3);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameRemoved', jasmine.any(Object));
            });

            it('errors when phases errors', function () {
                rootScope.$broadcast('playerLoaded');
                rootScope.$apply();
                phaseDeferred.reject();
                rootScope.$apply();
                expect(service.initialized()).toEqual(false);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameAdded', jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameRemoved', jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameCachesLoaded', 0);
            });

            it('re-initializes on player switch', function () {
                expect(service.initialized()).toEqual(false);
                http.expectGET(baseURL + gamesURL).respond([ng3]);
                phaseDeferred.resolve(phases);
                rootScope.$apply();
                expect(service.initialized()).toEqual(true);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 0);
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
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng3);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameRemoved', jasmine.any(Object));

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng3]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));

                var referenceHoldover = service.getGamesForPhase('All');

                currentPlayer.md5 = altMD5;

                rootScope.$broadcast('playerLoaded');
                rootScope.$apply();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 0);

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
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng1);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameRemoved', jasmine.any(Object));

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng3]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([ng1]));
            });

            it('re-initializes on refreshGames games', function () {
                http.expectGET(baseURL + gamesURL).respond([ng3]);
                phaseDeferred.resolve(phases);
                rootScope.$apply();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 0);
                rootScope.$broadcast('liveFeedEstablished');
                rootScope.$apply();
                http.flush();
                expect(service.getGamesForPhase('Phase1')).toEqual([]);
                expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                expect(service.getGamesForPhase('Phase3')).toEqual([]);
                expect(service.getGamesForPhase('All')).toEqual([ng3]);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng3);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameRemoved', jasmine.any(Object));

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng3]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));

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
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng1);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng2);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameRemoved', ng3);

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1, ng2]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
            });
        });

        describe('test initialization, with local storage', function () {
            beforeEach(function () {
                window.localStorage[mainCacheKey()] = JSON.stringify([ng1, ng2, ng3]);
                window.localStorage[altCacheKey()] = JSON.stringify([ng4]);
                rootScope.$broadcast('playerLoaded');
                rootScope.$apply();
            });

            it('initializes cache on player loaded and waits for player live feed for games', function () {
                expect(service.initialized()).toEqual(false);
                phaseDeferred.resolve(phases);
                rootScope.$apply();
                expect(service.initialized()).toEqual(true);
                expect(service.getGamesForPhase('Phase1')).toEqual([ng1, ng2]);
                expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                expect(service.getGamesForPhase('Phase3')).toEqual([]);
                expect(service.getGamesForPhase('All')).toEqual([ng1, ng2, ng3]);
                expect(service.getGamesForPhase(alt1)).toEqual([ng1, ng2, ng3]);
                expect(service.getGamesForPhase(alt2)).toEqual([]);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 0);

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1, ng2, ng3]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([ng4]));

                var ng1v2 = angular.copy(ng1);
                ng1v2.lastUpdate = 1001;
                ng1v2.gamePhase = 'Phase3';
                http.expectGET(baseURL + gamesURL).respond([ng3, ng1v2, ng4]);
                rootScope.$broadcast('liveFeedEstablished');
                rootScope.$apply();
                http.flush();
                expect(service.getGamesForPhase('Phase1')).toEqual([ng4]);
                expect(service.getGamesForPhase('Phase2')).toEqual([ng3]);
                expect(service.getGamesForPhase('Phase3')).toEqual([ng1v2]);
                expect(service.getGamesForPhase('All')).toEqual([ng1v2, ng3, ng4]);
                expect(service.getGamesForPhase(alt1)).toEqual([ng3, ng4]);
                expect(service.getGamesForPhase(alt2)).toEqual([ng1v2]);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng4);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdated', ng1, ng1v2);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameRemoved', ng2);

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1v2, ng3, ng4]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([ng4]));

            });

            it('re-initializes on player switch', function () {
                expect(service.initialized()).toEqual(false);
                http.expectGET(baseURL + gamesURL).respond([ng1, ng2]);
                phaseDeferred.resolve(phases);
                rootScope.$apply();
                expect(service.initialized()).toEqual(true);
                rootScope.$broadcast('liveFeedEstablished');
                rootScope.$apply();
                expect(service.initialized()).toEqual(true);
                http.flush();
                expect(service.initialized()).toEqual(true);
                expect(service.getGamesForPhase('Phase1')).toEqual([ng1, ng2]);
                expect(service.getGamesForPhase('Phase2')).toEqual([]);
                expect(service.getGamesForPhase('Phase3')).toEqual([]);
                expect(service.getGamesForPhase('All')).toEqual([ng1, ng2]);
                expect(service.getGamesForPhase(alt1)).toEqual([ng1, ng2]);
                expect(service.getGamesForPhase(alt2)).toEqual([]);

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1, ng2]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([ng4]));

                var referenceHoldover = service.getGamesForPhase('All');

                rootScope.$broadcast.calls.reset();

                baseURL = '/api/player/MANUAL3';
                currentPlayer.md5 = altMD5;
                rootScope.$broadcast('playerLoaded');
                rootScope.$apply();

                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng4);
                http.expectGET(baseURL + gamesURL).respond([ng4]);
                expect(service.initialized()).toEqual(true);
                rootScope.$broadcast('liveFeedEstablished');
                rootScope.$apply();
                expect(service.initialized()).toEqual(true);
                http.flush();
                expect(service.initialized()).toEqual(true);
                expect(service.getGamesForPhase('Phase1')).toEqual([ng4]);
                expect(service.getGamesForPhase('Phase2')).toEqual([]);
                expect(service.getGamesForPhase('Phase3')).toEqual([]);
                expect(service.getGamesForPhase('All')).toEqual([ng4]);
                expect(service.getGamesForPhase(alt1)).toEqual([ng4]);
                expect(service.getGamesForPhase(alt2)).toEqual([]);
                expect(referenceHoldover).toEqual([ng4]);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameRemoved', jasmine.any(Object));

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1, ng2]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([ng4]));
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
                expect(service.getGamesForPhase(alt1)).toEqual([ng3]);
                expect(service.getGamesForPhase(alt2)).toEqual([]);

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng3]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([ng4]));

                var referenceHoldover = service.getGamesForPhase('All');

                service.putUpdatedGame(ng2);

                rootScope.$broadcast.calls.reset();

                var ng3v2 = angular.copy(ng3);
                ng3v2.lastUpdate = 1001;
                ng3v2.gamePhase = 'Phase3';

                http.expectGET(baseURL + gamesURL).respond([ng3v2, ng4]);
                rootScope.$broadcast('refreshGames');
                rootScope.$apply();
                http.flush();
                expect(service.getGamesForPhase('Phase1')).toEqual([ng4]);
                expect(service.getGamesForPhase('Phase2')).toEqual([]);
                expect(service.getGamesForPhase('Phase3')).toEqual([ng3v2]);
                expect(service.getGamesForPhase('All')).toEqual([ng3v2, ng4]);
                expect(service.getGamesForPhase(alt1)).toEqual([ng4]);
                expect(service.getGamesForPhase(alt2)).toEqual([ng3v2]);
                expect(referenceHoldover).toEqual([ng3v2, ng4]);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameCachesLoaded', 1);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameAdded', ng4);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdated', ng3, ng3v2);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameRemoved', ng2);

                expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng3v2, ng4]));
                expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([ng4]));
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
                rootScope.$broadcast.calls.reset();
            });

            afterEach(function () {
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameDeleted', jasmine.any(Object));
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
                            expect(rootScope.$broadcast).not.toHaveBeenCalledWith('gameUpdated', jasmine.any(Object), jasmine.any(Object));

                            expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1, ng2, ng3, ng4, ng5]));
                            expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
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

                            expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1v2, ng2, ng3, ng4]));
                            expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
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

                            expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1v2, ng2, ng3, ng4]));
                            expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
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

                            expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1v2, ng2v2, ng3, ng4]));
                            expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
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

                            expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1, ng2, ng3, ng4]));
                            expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
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

                            expect(window.localStorage[mainCacheKey()]).toEqual(JSON.stringify([ng1, ng2, ng3, ng4]));
                            expect(window.localStorage[altCacheKey()]).toEqual(JSON.stringify([]));
                        });
                    });
                });
            });
        });
    });
});
