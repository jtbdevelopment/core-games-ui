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
    ['$rootScope', '$cacheFactory', '$location', '$http',
        'jtbGamePhaseService', 'jtbPlayerService', 'jtbLiveGameFeed', '$q', '$injector',
        function ($rootScope, $cacheFactory, $location, $http,
                  jtbGamePhaseService, jtbPlayerService, jtbLiveGameFeed, $q, $injector) {
            var ALL = 'All';
            var gameCache = $cacheFactory('game-gameCache');
            var phases = [];
            var loadedCounter = 0;

            var initializing = false;
            //  This is just to force instantiation and suppress warnings
            var tmp = 'Have Live Game Feed ' + jtbLiveGameFeed;
            console.info(tmp);
            var customClassifier;

            try {
                customClassifier = $injector.get('jtbGameClassifier');
            } catch (ex) {
                customClassifier = undefined;
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

            function loadCache() {
                initialize().then(function () {
                    initializeSubCaches();
                    $http.get(jtbPlayerService.currentPlayerBaseURL() + '/games').success(function (data) {
                        initializing = true;
                        data.forEach(function (game) {
                            cache.putUpdatedGame(game);
                        });
                        initializing = false;
                        ++loadedCounter;
                        $rootScope.$broadcast('gameCachesLoaded', loadedCounter);
                    }).error(function () {
                        //  TODO - better
                        $location.path('/error');
                    });
                }, function () {
                    //  TODO - better
                    $location.path('/error');
                });
            }

            function initialize() {
                var initialized = $q.defer();
                if (phases.length > 0) {
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
                if(angular.isDefined(customClassifier)) {
                    phaseCache = gameCache.get(customClassifier.getClassification(updatedGame));
                    phaseCache.games.push(updatedGame);
                    phaseCache.idMap[updatedGame.id] = phaseCache.games.indexOf(updatedGame);
                }
                allCache.games.push(updatedGame);
                allCache.idMap[updatedGame.id] = allCache.games.indexOf(updatedGame);
                if (initializing === false) {
                    $rootScope.$broadcast('gameAdded', updatedGame);
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
            }

            function updateGameInCache(allCache, allIndex, updatedGame, existingGame) {
                allCache.games[allIndex] = updatedGame;

                var updatedCacheName = updatedGame.gamePhase;
                var existingCacheName = existingGame.gamePhase;
                modifyCaches(existingCacheName, existingGame, updatedCacheName, updatedGame);
                if(angular.isDefined(customClassifier)) {
                    updatedCacheName = customClassifier.getClassification(updatedGame);
                    existingCacheName = customClassifier.getClassification(existingGame);
                    modifyCaches(existingCacheName, existingGame, updatedCacheName, updatedGame);
                }

                // Based on javascript threading model, and server data
                // this is an unlikely necessary if - as it probably always falls into true
                if (initializing === false) {
                    $rootScope.$broadcast('gameUpdated', existingGame, updatedGame);
                }
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
                    if(angular.isDefined(cache)) {
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

