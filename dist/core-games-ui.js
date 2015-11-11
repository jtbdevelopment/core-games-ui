(function (angular) {

    // Create all modules and define dependencies to make sure they exist
    // and are loaded in the correct order to satisfy dependency injection
    // before all nested files are concatenated by Gulp

    // Config
    angular.module('coreGamesUi.config', [])
        .value('coreGamesUi.config', {
            debug: true
        });

    // Modules
    angular.module('coreGamesUi.controllers', []);
    angular.module('coreGamesUi.directives', []);
    angular.module('coreGamesUi.filters', []);
    angular.module('coreGamesUi.services', []);
    angular.module('coreGamesUi',
        [
            'coreGamesUi.controllers',
            'coreGamesUi.config',
            'coreGamesUi.directives',
            'coreGamesUi.filters',
            'coreGamesUi.services',
            'ngResource',
            'ngCookies',
            'ngSanitize'
        ]);

})(angular);

'use strict';

angular.module('coreGamesUi.controllers').controller('CoreInviteCtrl',
    ['$modalInstance', '$scope', 'invitableFriends', 'message', 'jtbFacebook',
        function ($modalInstance, $scope, invitableFriends, message, jtbFacebook) {
            $scope.invitableFriends = invitableFriends;
            $scope.chosenFriends = [];
            $scope.message = message;
            $scope.invite = function () {
                var ids = [];
                angular.forEach($scope.chosenFriends, function (chosen) {
                    ids.push(chosen.id);
                });
                jtbFacebook.inviteFriends(ids, message);
                $modalInstance.close();
            };
            $scope.cancel = function () {
                $modalInstance.dismiss();
            };
        }]);


'use strict';

angular.module('coreGamesUi.controllers')
    .controller('CoreSignInCtrl',
    ['$scope', '$window', '$cookies', 'jtbFacebook',
        function ($scope, $window, $cookies, jtbFacebook) {
            $scope.message = 'Initializing...';
            $scope.showFacebook = false;
            $scope.showManual = false;
            $scope.csrf = $cookies['XSRF-TOKEN'];

            function showLoginOptions() {
                $scope.showFacebook = true;
                $scope.showManual =
                    $window.location.href.indexOf('localhost') > -1 ||
                    $window.location.href.indexOf('-dev') > -1;
                $scope.message = '';
            }

            function autoLogin() {
                $scope.showFacebook = false;
                $scope.showManual = false;
                $scope.message = 'Logging in via Facebook';
                $window.location = '/auth/facebook';
            }

            $scope.fbLogin = function () {
                jtbFacebook.initiateFBLogin().then(function (details) {
                    if (!details.auto) {
                        showLoginOptions();
                    } else {
                        autoLogin();
                    }
                }, function () {
                    showLoginOptions();
                });
            };

            jtbFacebook.canAutoSignIn().then(function (details) {
                if (!details.auto) {
                    showLoginOptions();
                } else {
                    autoLogin();
                }
            }, function () {
                showLoginOptions();
            });

        }]);


'use strict';

//  From https://github.com/angular-ui/bootstrap/issues/1350
angular.module('coreGamesUi.directives').directive('disableAnimation', function ($animate) {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attrs) {
            $attrs.$observe('disableAnimation', function (value) {
                $animate.enabled(!value, $element);
            });
        }
    };
});

'use strict';

//
//  Taken from angular-ui-select multi select plunker demo
//
/* istanbul ignore next */
angular.module('coreGamesUi.filters').filter('propsFilter', function () {
    return function (items, props) {
        var out = [];

        if (angular.isArray(items)) {
            items.forEach(function (item) {
                var itemMatches = false;

                var keys = Object.keys(props);
                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    };
});


/*global FB:false */
'use strict';

angular.module('coreGamesUi.services').factory('jtbFacebook',
    ['$http', '$location', '$q', '$injector', '$window',
        function ($http, $location, $q, $injector, $window) {
            var loaded = false;
            var facebookAppId = '';
            var facebookPermissions = '';
            var facebookAuth;

            var cordovaFacebook;
            try {
                if ($window.location.href.indexOf('file:') === 0) {
                    cordovaFacebook = $injector.get('$cordovaFacebook');
                }
            } catch(ex) {
                cordovaFacebook = undefined;
            }

            function loadFB() {
                var fbLoaded = $q.defer();
                if (!loaded) {
                    $http.get('/api/social/apis', {cache: true}).success(function (response) {
                        facebookAppId = response.facebookAppId;
                        facebookPermissions = response.facebookPermissions;
                        if(angular.isDefined(cordovaFacebook)) {
                            fbLoaded.resolve();
                        } else {
                            window.fbAsyncInit = function () {
                                FB.init({
                                    appId: facebookAppId,
                                    xfbml: false,
                                    version: 'v2.2'
                                });
                                fbLoaded.resolve();
                            };

                            (function (d, s, id) {
                                function onLoadCB() {
                                    loaded = false;
                                    fbLoaded.reject();
                                }

                                var js, fjs = d.getElementsByTagName(s)[0];
                                if (d.getElementById(id)) {
                                    return;
                                }
                                js = d.createElement(s);
                                js.id = id;
                                js.src = '//connect.facebook.net/en_US/sdk.js';
                                js.onerror = onLoadCB;
                                fjs.parentNode.insertBefore(js, fjs);
                            }(document, 'script', 'facebook-jssdk'));
                        }
                        loaded = true;
                    }).error(function () {
                        //  TODO - better
                        $location.path('/error');
                        fbLoaded.reject();
                    });

                    return fbLoaded.promise;
                } else {
                    fbLoaded.resolve();
                    return fbLoaded.promise;
                }
            }

            function login(fbLogin) {
                try {
                    var callback = function(response) {
                        if (angular.isDefined(response) &&
                            angular.isDefined(response.status) &&
                            response.status === 'connected') {
                            facebookAuth = response.authResponse;
                            fbLogin.resolve({
                                auto: true,
                                permissions: facebookPermissions
                            });
                        } else {
                            fbLogin.reject();
                        }
                    };

                    if(angular.isDefined(cordovaFacebook)) {
                        cordovaFacebook.login(facebookPermissions.split(',')).then(callback,
                            function(e) {
                                console.log(JSON.stringify(e));
                                fbLogin.reject();
                            });
                    } else {
                        FB.login(callback, {scope: facebookPermissions});
                    }
                } catch (ex) {
                    console.error(JSON.stringify(ex));
                    fbLogin.reject();
                }
            }

            function checkGrantedPermissions(autoDefer) {
                var checkFunction = function (response) {
                    if (angular.isDefined(response) && !angular.isDefined(response.error)) {
                        var permissions = facebookPermissions.split(',');
                        var allFound = true;
                        angular.forEach(permissions, function (permission) {
                            var found = false;
                            angular.forEach(response.data, function (fbPermission) {
                                if (permission === fbPermission.permission &&
                                    (
                                        fbPermission.status === 'granted' ||
                                        fbPermission.status === 'declined'
                                    )) {
                                    found = true;
                                }
                            });
                            if (!found) {
                                allFound = false;
                            }
                        });
                        if (allFound) {
                            autoDefer.resolve(
                                {
                                    auto: true,
                                    permissions: facebookPermissions
                                }
                            );
                        } else {
                            autoDefer.reject();
                        }
                    } else {
                        autoDefer.reject();
                    }
                };
                var graphPath = '/me/permissions';
                if(angular.isDefined(cordovaFacebook)) {
                    cordovaFacebook.api(graphPath, []).then(checkFunction, function(e) {
                        console.log(JSON.stringify(e));
                        autoDefer.reject();
                    });
                } else {
                    FB.api(graphPath, checkFunction);
                }
            }

            function canAutoLogin(autoDefer) {
                try {
                    var callback = function (response) {
                        if (angular.isDefined(response) &&
                            angular.isDefined(response.status) &&
                            response.status === 'connected') {
                            facebookAuth = response.authResponse;
                            checkGrantedPermissions(autoDefer);
                        } else {
                            autoDefer.reject();
                        }
                    };
                    if(angular.isDefined(cordovaFacebook)) {
                        cordovaFacebook.getLoginStatus().then(callback, function(e) {
                            console.log(JSON.stringify(e));
                            autoDefer.reject();
                        });
                    } else {
                        FB.getLoginStatus(callback);
                    }
                } catch (ex) {
                    console.error(JSON.stringify(ex));
                    autoDefer.reject();
                }
            }

            function inviteFriends(ids, message) {
                var first = true;
                var s = '';
                angular.forEach(ids, function (id) {
                    if (!first) {
                        s = s + ', ';
                    } else {
                        first = false;
                    }
                    s = s + id;
                });
                var callback = function (response) {
                    //  TODO - track?
                    console.info(JSON.stringify(response));
                };
                var dialog = {
                    method: 'apprequests',
                    message: message,
                    to: s
                };
                if(angular.isDefined(cordovaFacebook)) {
                    cordovaFacebook.showDialog(dialog).then(callback, function() {
                        //  TODO
                    });
                } else {
                    FB.ui(dialog, callback);
                }
            }

            function gameAndFacebookLoginMatch(player, matchDeferred) {
                if (player.source === 'facebook') {
                    try {
                        var callback = function (response) {
                            if (response.status === 'connected') {
                                facebookAuth = response.authResponse;
                                matchDeferred.resolve(response.authResponse.userID === player.sourceId);
                            }
                            else {
                                matchDeferred.resolve(false);
                            }
                        };
                        if(angular.isDefined(cordovaFacebook)) {
                            cordovaFacebook.getLoginStatus().then(callback, function(e) {
                                console.log(JSON.stringify(e));
                                matchDeferred.resolve(false);
                            });
                        } else {
                            FB.getLoginStatus(callback);
                        }
                    } catch (ex) {
                        console.error(JSON.stringify);
                        matchDeferred.resolve(false);
                    }
                } else {
                    matchDeferred.resolve(false);
                }
            }

            return {
                currentAuthorization: function() {
                    return facebookAuth;
                },

                initiateFBLogin: function () {
                    var fbLogin = $q.defer();
                    loadFB().then(function () {
                        login(fbLogin);
                    }, function () {
                        fbLogin.reject();
                    });
                    return fbLogin.promise;
                },
                canAutoSignIn: function () {
                    var autoDefer = $q.defer();
                    loadFB().then(function () {
                        canAutoLogin(autoDefer);
                    }, function () {
                        autoDefer.reject();
                    });
                    return autoDefer.promise;
                },

                inviteFriends: function (ids, message) {
                    loadFB().then(function () {
                        inviteFriends(ids, message);
                    }, function () {
                        //  TODO - alert error
                    });
                },
                playerAndFBMatch: function (player) {
                    var matchDeferred = $q.defer();
                    loadFB().then(function () {
                        gameAndFacebookLoginMatch(player, matchDeferred);
                    });
                    return matchDeferred.promise;
                }
            };
        }
    ]);

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
                        removeGameFromCache(phaseCache, gameToDelete, phaseIndex);
                        phaseCache = gameCache.get(gameToDelete.gamePhase);
                        phaseIndex = phaseCache.idMap[gameToDelete.id];
                        removeGameFromCache(phaseCache, gameToDelete, phaseIndex);

                        if (angular.isDefined(customClassifier)) {
                            phaseCache = gameCache.get(customClassifier.getClassification(gameToDelete));
                            phaseIndex = phaseCache.idMap[gameToDelete.id];
                            removeGameFromCache(phaseCache, gameToDelete, phaseIndex);
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


'use strict';

angular.module('coreGamesUi.services').factory('jtbGameFeatureService', ['$http', function ($http) {
    return {
        features: function () {
            return $http.get('/api/features', {cache: true}).then(function (response) {
                return response.data;
            });
        }
    };
}]);

'use strict';

angular.module('coreGamesUi.services').factory('jtbGamePhaseService', ['$http', function ($http) {
    return {
        phases: function () {
            return $http.get('/api/phases', {cache: true}).then(function (response) {
                return response.data;
            });
        }
    };
}]);


/*global atmosphere:false */
'use strict';
angular.module('coreGamesUi.services').factory('jtbLiveGameFeed',
    ['$rootScope', 'jtbPlayerService', '$timeout',
        function ($rootScope, jtbPlayerService, $timeout) {
            var pendingSubscribe;
            var endpoint = '';

            var request = {
                url: '',
                contentType: 'application/json',
                logLevel: 'info',
                //  AWS doesn't support so kind of pointless and slow to default to it
                //transport: 'websocket',
                transport: 'long-polling',
                trackMessageLength: true,
                fallbackTransport: 'long-polling',
                withCredentials: true,
                handleOnlineOffline: false,
                closeAsync: true,  // needed because of withCredentials true

                onOpen: function (response) {
                    var request = this;
                    $timeout(function () {
                        console.info(request.url + ' Atmosphere connected using ' + response.transport);
                        $rootScope.$broadcast('liveFeedEstablished');
                    });
                },

                onMessage: function (response) {
                    var request = this;
                    $timeout(function () {
                        if (angular.isDefined(response.messages)) {
                            response.messages.forEach(function (messageString) {
                                var message;
                                try {
                                    message = JSON.parse(messageString);
                                } catch (error) {
                                    console.error('got non-parseable message');
                                    return;
                                }

                                if (angular.isDefined(message.messageType)) {
                                    switch (message.messageType.toString()) {
                                        //  TODO - Handle Alert
                                        case 'Game':
                                            $rootScope.$broadcast('gameUpdate', message.game.id, message.game);
                                            return;
                                        case 'Heartbeat':
                                            console.info('got a heartbeat ' + JSON.stringify(message.message));
                                            return;
                                        case 'Player':
                                            $rootScope.$broadcast('playerUpdate', message.player.id, message.player);
                                            return;
                                    }
                                    console.warn('onMessage: unknown message type \'' + message.messageType + '\'');
                                }
                                console.warn('unknown message structure ' + message);
                            });
                        } else {
                            console.warn(request.url + ' unknown onMessage: ' + JSON.stringify(response));
                        }
                    });
                },

                onClose: function (response) {
                    var request = this;
                    $timeout(function () {
                        //  TODO
                        console.warn(request.url + ' closed: ' + JSON.stringify(response));
                    });
                },

                onError: function (response) {
                    var request = this;
                    $timeout(function () {
                        //  TODO
                        console.error(request.url + ' onError: ' + JSON.stringify(response));
                    });
                }
            };

            var socket = atmosphere;
            var subscribed;

            function unsubscribe() {
                if (angular.isDefined(pendingSubscribe)) {
                    $timeout.cancel(pendingSubscribe);
                    pendingSubscribe = undefined;
                }
                if (angular.isDefined(subscribed)) {
                    console.log('ending livefeedsubcription to ' + jtbPlayerService.currentID());
                    subscribed.close();
                }
                subscribed = undefined;
            }

            function subscribeToCurrentPlayer(depth) {
                unsubscribe();
                if (angular.isUndefined(depth)) {
                    depth = 0;
                }
                console.log('depth is ' + depth);
                pendingSubscribe = $timeout(function () {
                    if (jtbPlayerService.currentID() !== '') {
                        request.url = endpoint + '/livefeed/' + jtbPlayerService.currentID();
                        try {
                            subscribed = socket.subscribe(request);
                        } catch (ex) {
                            console.log('sub ex ' + JSON.stringify(ex));
                            if (depth < 5) {
                                pendingSubscribe = $timeout(function () {
                                    subscribeToCurrentPlayer(depth + 1);
                                }, 500);
                            } else {
                                //  TODO
                                console.warn('Gave up trying to subscribe to websocket');
                            }
                        }
                    }
                }, 1000);
            }

            $rootScope.$on('playerLoaded', function () {
                subscribeToCurrentPlayer();
            });

            if (jtbPlayerService.currentID() !== '') {
                subscribeToCurrentPlayer();
            }

            return {
                suspendFeed: function () {
                    unsubscribe();
                },
                setEndPoint: function (newEndpoint) {
                    endpoint = newEndpoint;
                    subscribeToCurrentPlayer();
                }
            };
        }

    ]
);

'use strict';

//  largely from ionic article http://learn.ionicframework.com/formulas/localstorage/

angular.module('coreGamesUi.services')
    .factory('jtbLocalStorage',
    ['$window',
        function ($window) {
            return {
                set: function (key, value) {
                    $window.localStorage[key] = value;
                },
                get: function (key, defaultValue) {
                    return $window.localStorage[key] || defaultValue;
                },
                setObject: function (key, value) {
                    $window.localStorage[key] = JSON.stringify(value);
                },
                getObject: function (key, defaultValue) {
                    return JSON.parse($window.localStorage[key] || (defaultValue || '{}'));
                }
            };
        }
    ]
);
'use strict';


angular.module('coreGamesUi.services').factory('jtbPlayerService',
    ['$http', '$rootScope', '$location', '$window', 'jtbFacebook',
        function ($http, $rootScope, $location, $window, jtbFacebook) {
            var realPID = '';
            var simulatedPID = '';
            var BASE_PLAYER_URL = '/api/player';
            var FRIENDS_PATH = '/friends';

            var simulatedPlayer;

            function broadcastLoaded() {
                console.log('Broadcasting playerLoad');
                $rootScope.$broadcast('playerLoaded');
            }

            function initializePlayer() {
                $http.get('/api/security', {cache: true}).success(function (response) {
                    simulatedPlayer = response;
                    realPID = simulatedPlayer.id;
                    simulatedPID = simulatedPlayer.id;
                    switch (simulatedPlayer.source) {
                        case 'facebook':
                            jtbFacebook.playerAndFBMatch(simulatedPlayer).then(function (match) {
                                if (!match) {
                                    service.signOutAndRedirect();
                                } else {
                                    broadcastLoaded();
                                }
                            }, function () {
                                service.signOutAndRedirect();
                            });
                            break;
                        default:
                            broadcastLoaded();
                            break;
                    }
                }).error(function () {
                    //  TODO - better
                    $location.path('/error');
                });
            }

            var service = {
                overridePID: function (newpid) {
                    $http.put(this.currentPlayerBaseURL() + '/admin/' + newpid).success(function (data) {
                        simulatedPID = data.id;
                        simulatedPlayer = data;
                        broadcastLoaded();
                    }).error(function () {
                        //  TODO - better
                        $location.path('/error');
                    });
                },
                realPID: function () {
                    return realPID;
                },


                currentID: function () {
                    return simulatedPID;
                },
                currentPlayerBaseURL: function () {
                    return BASE_PLAYER_URL;
                },
                currentPlayerFriends: function () {
                    return $http.get(this.currentPlayerBaseURL() + FRIENDS_PATH).then(function (response) {
                        return response.data;
                    });
                },
                currentPlayer: function () {
                    return simulatedPlayer;
                },

                signOutAndRedirect: function () {
                    $http.post('/signout').success(function () {
                        //  TODO - location?
                        $window.location = '#/signin';
                    }).error(function () {
                        //  TODO - location?
                        $window.location = '#/signin';
                    });
                }
            };

            $rootScope.$on('login', function () {
                console.log('login received');
                initializePlayer();
            });

            $rootScope.$on('playerUpdate', function (event, id, player) {
                if (simulatedPID === id) {
                    angular.copy(player, simulatedPlayer);
                    $rootScope.$apply();
                }
            });

            return service;
        }]);

