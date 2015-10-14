'use strict';

/**
 * Uses an optional custom classifier
 * If a service 'jtbGameClassifier' is available, will add additional caches
 *
 * jtbGameClassifier must have several functions defined:
 *   -- getClassifications - returns array of new buckets of game classifications
 *      ['Your Turn', 'Their Turn', 'Older Games']
 *   -- getClassification(game) - returns classification for a given game, must match one of returned items above
 */

angular.module('coreGamesUi.services').factory('jtbGameCache',
    ['$rootScope', '$cacheFactory', '$location', '$http', 'jtbLocalStorage',
        'jtbGamePhaseService', 'jtbPlayerService', 'jtbLiveGameFeed', '$q', '$injector',
        function ($rootScope, $cacheFactory, $location, $http, jtbLocalStorage,
                  jtbGamePhaseService, jtbPlayerService, jtbLiveGameFeed, $q, $injector) {
            var ALL = 'All';
            var gameCache = $cacheFactory('game-gameCache');
            var phases = [];

            //  This is just to force instantiation and suppress warnings
            var tmp = 'Have Live Game Feed ' + jtbLiveGameFeed;
            console.info(tmp);
            var customClassifier;

            try {
                customClassifier = $injector.get('jtbGameClassifier');
            } catch (ex) {
                customClassifier = undefined;
            }

            function localStorageKey() {
                return 'gameCache-' + jtbPlayerService.currentPlayer().md5;
            }

            function initializeSubCaches() {
                phases.forEach(function (phase) {
                        var phaseCache = gameCache.get(phase);
                        if (angular.isDefined(phaseCache)) {
                            Object.keys(phaseCache.idMap).forEach(function (key) {
                                delete phaseCache.idMap[key];
                            });
                            phaseCache.games.splice(0);
                        } else {
                            //  Would be nice to use more caches but can't get keys
                            gameCache.put(phase, {
                                idMap: {},
                                games: []
                            });
                        }
                    }
                );
            }

            function deleteOldCachedGames(originalCache) {
                var deleted = 0;
                for (var id in originalCache.idMap) {
                    if (originalCache.idMap.hasOwnProperty(id)) {
                        var gameToDelete = originalCache.games[originalCache.idMap[id]];
                        var phaseCache = gameCache.get(ALL);
                        var phaseIndex = phaseCache.idMap[gameToDelete.id];
                        if (angular.isDefined(phaseIndex)) {
                            removeGameFromCache(phaseCache, gameToDelete, phaseIndex);
                        }
                        phaseCache = gameCache.get(gameToDelete.gamePhase);
                        phaseIndex = phaseCache.idMap[gameToDelete.id];
                        if (angular.isDefined(phaseIndex)) {
                            removeGameFromCache(phaseCache, gameToDelete, phaseIndex);
                        }

                        if (angular.isDefined(customClassifier)) {
                            phaseCache = gameCache.get(customClassifier.getClassification(gameToDelete));
                            phaseIndex = phaseCache.idMap[gameToDelete.id];
                            if (angular.isDefined(phaseIndex)) {
                                removeGameFromCache(phaseCache, gameToDelete, phaseIndex);
                            }
                        }

                        $rootScope.$broadcast('gameRemoved', gameToDelete);
                        ++deleted;
                    }
                }
            }

            function updateLocalStorage() {
                jtbLocalStorage.setObject(localStorageKey(), gameCache.get(ALL).games);
            }

            function loadCache() {
                if(phases.length === 0) {
                    initialize.then(loadCache());
                    return;
                }
                var originalCache = JSON.parse(JSON.stringify(gameCache.get(ALL)));
                $http.get(jtbPlayerService.currentPlayerBaseURL() + '/games').success(function (data) {
                    data.forEach(function (game) {
                        cache.putUpdatedGame(game);
                        if (angular.isDefined(originalCache.idMap[game.id])) {
                            delete originalCache.idMap[game.id];
                        }
                    });
                    deleteOldCachedGames(originalCache);
                    updateLocalStorage();
                    $rootScope.$broadcast('gameCachesLoaded', 1);
                }).error(function () {
                    //  TODO - better
                    $location.path('/error');
                });
            }

            function loadFromLocalStorage() {
                var localGames = jtbLocalStorage.getObject(localStorageKey(), '[]');
                angular.forEach(localGames, function (game) {
                    cache.putUpdatedGame(game);
                });
                $rootScope.$broadcast('gameCachesLoaded', 0);
            }

            function initialize() {
                var initialized = $q.defer();
                if (phases.length > 0) {
                    initializeSubCaches();
                    loadFromLocalStorage();
                    initialized.resolve();
                } else {
                    jtbGamePhaseService.phases().then(function (phaseMap) {
                        phases.slice(0);
                        phases.push(ALL);
                        angular.forEach(phaseMap, function (array, phase) {
                            phases.push(phase);
                        });
                        if (angular.isDefined(customClassifier)) {
                            angular.forEach(customClassifier.getClassifications(), function (classification) {
                                phases.push(classification);
                            });
                        }
                        initializeSubCaches();
                        loadFromLocalStorage();
                        initialized.resolve();
                    }, function () {
                        //  TODO - better
                        $location.path('/error');
                        initialized.reject();
                    });
                }
                return initialized.promise;
            }

            function addGameToCache(updatedGame, allCache) {
                var phaseCache = gameCache.get(updatedGame.gamePhase);
                phaseCache.games.push(updatedGame);
                phaseCache.idMap[updatedGame.id] = phaseCache.games.indexOf(updatedGame);
                if (angular.isDefined(customClassifier)) {
                    phaseCache = gameCache.get(customClassifier.getClassification(updatedGame));
                    phaseCache.games.push(updatedGame);
                    phaseCache.idMap[updatedGame.id] = phaseCache.games.indexOf(updatedGame);
                }
                allCache.games.push(updatedGame);
                allCache.idMap[updatedGame.id] = allCache.games.indexOf(updatedGame);
                $rootScope.$broadcast('gameAdded', updatedGame);
            }

            function removeGameFromCache(existingCache, existingGame, existingCacheIndex) {
                delete existingCache.idMap[existingGame.id];
                existingCache.games.splice(existingCacheIndex, 1);
                for (var id in existingCache.idMap) {
                    if (existingCache.idMap.hasOwnProperty(id)) {
                        var indexOfId = existingCache.idMap[id];
                        if (indexOfId > existingCacheIndex) {
                            existingCache.idMap[id] = indexOfId - 1;
                        }
                    }
                }
            }

            function modifyCaches(existingCacheName, existingGame, updatedCacheName, updatedGame) {
                var existingCache = gameCache.get(existingCacheName);
                var existingCacheIndex = existingCache.idMap[existingGame.id];
                if (existingCacheName === updatedCacheName) {
                    existingCache.games[existingCacheIndex] = updatedGame;
                } else {
                    var updatedCache = gameCache.get(updatedCacheName);
                    updatedCache.idMap[updatedGame.id] = updatedCache.games.push(updatedGame) - 1;
                    removeGameFromCache(existingCache, existingGame, existingCacheIndex);
                }
            }

            function updateGameInCache(allCache, allIndex, updatedGame, existingGame) {
                allCache.games[allIndex] = updatedGame;

                var updatedCacheName = updatedGame.gamePhase;
                var existingCacheName = existingGame.gamePhase;
                modifyCaches(existingCacheName, existingGame, updatedCacheName, updatedGame);
                if (angular.isDefined(customClassifier)) {
                    updatedCacheName = customClassifier.getClassification(updatedGame);
                    existingCacheName = customClassifier.getClassification(existingGame);
                    modifyCaches(existingCacheName, existingGame, updatedCacheName, updatedGame);
                }

                $rootScope.$broadcast('gameUpdated', existingGame, updatedGame);
            }

            var cache = {
                putUpdatedGame: function (updatedGame) {
                    var allCache = gameCache.get(ALL);
                    var allIndex = allCache.idMap[updatedGame.id];

                    if (angular.isDefined(allIndex)) {
                        var existingGame = allCache.games[allIndex];
                        if (updatedGame.lastUpdate <= existingGame.lastUpdate) {
                            console.info('Skipping Stale game update for ' + updatedGame.id);
                            return;
                        }
                        updateGameInCache(allCache, allIndex, updatedGame, existingGame);
                    } else {
                        addGameToCache(updatedGame, allCache);
                    }

                    updateLocalStorage();
                },

                getGameForID: function (id) {
                    var allCache = gameCache.get(ALL);
                    if (angular.isDefined(allCache)) {
                        var index = allCache.idMap[id];
                        if (angular.isDefined(index)) {
                            return allCache.games[index];
                        }
                    }
                },

                getGamesForPhase: function (phase) {
                    var cache = gameCache.get(phase);
                    if (angular.isDefined(cache)) {
                        return cache.games;
                    }
                    return undefined;
                },

                initialized: function () {
                    return angular.isDefined(gameCache) && angular.isDefined(gameCache.get(ALL));
                }
            };

            $rootScope.$on('gameUpdate', function (event, id, game) {
                cache.putUpdatedGame(game);
                $rootScope.$apply();
            });

            $rootScope.$on('playerLoaded', function () {
                initialize();
            });

            $rootScope.$on('liveFeedEstablished', function () {
                loadCache();
            });

            $rootScope.$on('refreshGames', function () {
                loadCache();
            });

            return cache;
        }
    ]
);

