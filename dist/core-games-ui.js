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

            jtbFacebook.canAutoSignIn().then(function (details) {
                if (!details.auto) {
                    showLoginOptions();
                } else {
                    autoLogin();
                }
            }, function () {
                showLoginOptions();
            });

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

angular.module('coreGamesUi.services').factory('jtbGameCache',
    ['$rootScope', '$cacheFactory', '$location', '$http',
        'jtbGamePhaseService', 'jtbPlayerService', 'jtbLiveGameFeed',
        function ($rootScope, $cacheFactory, $location, $http,
                  jtbGamePhaseService, jtbPlayerService, jtbLiveGameFeed) {
            var ALL = 'All';
            var gameCache = $cacheFactory('game-gameCache');
            var phases = [];
            var loadedCounter = 0;

            var initializing = false;
            //  This is just to force instantiation and suppress warnings
            var tmp = 'Have Live Game Feed ' + jtbLiveGameFeed;
            console.info(tmp);

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
                initializeSubCaches();  // This call presumes phase load in initialize has completed
                $http.get(jtbPlayerService.currentPlayerBaseURL() + '/games').success(function (data) {
                    initializing = true;
                    data.forEach(function (game) {
                        cache.putUpdatedGame(game);
                    });
                    initializing = false;
                    ++loadedCounter;
                    $rootScope.$broadcast('gameCachesLoaded', loadedCounter);
                }).error(function () {
                    $location.path('/error');
                });
            }

            function initialize() {
                jtbGamePhaseService.phases().then(function (phaseMap) {
                    phases.slice(0);
                    phases.push(ALL);
                    angular.forEach(phaseMap, function (array, phase) {
                        phases.push(phase);
                    });
                    initializeSubCaches();
                }, function () {
                    $location.path('/error');
                });
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
                        allCache.games[allIndex] = updatedGame;

                        var existingPhaseCache = gameCache.get(existingGame.gamePhase);
                        var existingPhaseIndex = existingPhaseCache.idMap[existingGame.id];
                        if (existingGame.gamePhase === updatedGame.gamePhase) {
                            existingPhaseCache.games[existingPhaseIndex] = updatedGame;
                        } else {
                            var newPhaseCache = gameCache.get(updatedGame.gamePhase);
                            newPhaseCache.games.push(updatedGame);
                            newPhaseCache.idMap[updatedGame.id] = newPhaseCache.games.indexOf(updatedGame);
                            existingPhaseCache.games.splice(existingPhaseIndex, 1);
                            delete existingPhaseCache.idMap[existingGame.id];
                        }
                        // Based on javascript threading model, and server data
                        // this is an unlikely necessary if - as it probably always falls into true
                        if (initializing === false) {
                            $rootScope.$broadcast('gameUpdated', existingGame, updatedGame);
                        }
                    } else {
                        var phaseCache = gameCache.get(updatedGame.gamePhase);
                        phaseCache.games.push(updatedGame);
                        phaseCache.idMap[updatedGame.id] = phaseCache.games.indexOf(updatedGame);
                        allCache.games.push(updatedGame);
                        allCache.idMap[updatedGame.id] = allCache.games.indexOf(updatedGame);
                        if (initializing === false) {
                            $rootScope.$broadcast('gameAdded', updatedGame);
                        }
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
                    return gameCache.get(phase).games;
                }
            };

            $rootScope.$on('gameUpdate', function (event, id, game) {
                cache.putUpdatedGame(game);
                $rootScope.$apply();
            });

            $rootScope.$on('liveFeedEstablished', function () {
                loadCache();
            });

            $rootScope.$on('refreshGames', function () {
                loadCache();
            });

            initialize();

            return cache;
        }
    ]
);

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


/*global $:false */
'use strict';
angular.module('coreGamesUi.services').factory('jtbLiveGameFeed',
    ['$rootScope', 'jtbPlayerService',
        function ($rootScope, jtbPlayerService) {
            var endpoint = '';

            var request = {
                url: '',
                contentType: 'application/json',
                logLevel: 'debug',
                //  AWS doesn't support so kind of pointless and slow to default to it
                //transport: 'websocket',
                transport: 'long-polling',
                trackMessageLength: true,
                fallbackTransport: 'long-polling',
                withCredentials: true,

                onOpen: function (response) {
                    console.info(this.url + ' Atmosphere connected using ' + response.transport);
                    $rootScope.$broadcast('liveFeedEstablished');
                },

                onMessage: function (response) {
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
                                    default:
                                        console.warn('onMessage: unknown message type \'' + message.messageType + '\'');
                                        break;
                                }
                                console.warn('onMessage: unknown message type \'' + message.messageType + '\'');
                            }
                            console.warn('unknown message structure ' + message);
                        });
                    } else {
                        console.warn(this.url + ' unknown onMessage: ' + JSON.stringify(response));
                    }
                },

                onClose: function (response) {
                    console.warn(this.url + ' closed: ' + JSON.stringify(response));
                },

                onError: function (response) {
                    console.error(this.url + ' onError: ' + JSON.stringify(response));
                }
            };

            var socket = $.atmosphere;
            var subscribed;

            function unssubscribe() {
                if (angular.isDefined(subscribed)) {
                    console.log('ending livefeedsubcription to ' + jtbPlayerService.currentID());
                    subscribed.close();
                }
                subscribed = undefined;
            }

            function subscribeToCurrentPlayer() {
                unssubscribe();
                request.url = endpoint + '/livefeed/' + jtbPlayerService.currentID();
                subscribed = socket.subscribe(request);
            }

            $rootScope.$on('playerLoaded', function () {
                subscribeToCurrentPlayer();
            });

            if (jtbPlayerService.currentID() !== '') {
                subscribeToCurrentPlayer();
            }

            return {
                suspendFeed: function() {
                    unssubscribe();
                },
                setEndPoint: function (newEndpoint) {
                    endpoint = newEndpoint;
                },
                handler: function () {
                    return request;
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
                        $window.location = '/signin';
                    }).error(function () {
                        $window.location = '/signin';
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

            initializePlayer();

            return service;
        }]);

