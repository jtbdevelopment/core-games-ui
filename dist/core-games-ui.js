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
  angular.module('coreGamesUi.directives', []);
  angular.module('coreGamesUi.filters', []);
  angular.module('coreGamesUi.services', []);
  angular.module('coreGamesUi',
      [
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
  ['$http', '$location', '$q',
    function ($http, $location, $q) {
      var loaded = false;
      var facebookAppId = '';
      var facebookPermissions = '';

      //  TODO - deal with facebook disconnect and such
      function loadFB() {
        var fbLoaded = $q.defer();
        if (!loaded) {
          $http.get('/api/social/apis', {cache: true}).success(function (response) {
            facebookAppId = response.facebookAppId;
            facebookPermissions = response.facebookPermissions;
            window.fbAsyncInit = function () {
              FB.init({
                appId: facebookAppId,
                xfbml: true,
                version: 'v2.1'
              });
              fbLoaded.resolve(facebookPermissions);
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

      return {
        canAutoSignIn: function () {
          var autoDefer = $q.defer();
          loadFB().then(function (facebookPermissions) {
            FB.getLoginStatus(function (response) {
              autoDefer.resolve(
                {
                  auto: angular.isDefined(response) && 
                        angular.isDefined(response.status) && 
                        response.status === 'connected',
                  permissions: facebookPermissions
                }
              );
            });
          }, function () {
            autoDefer.reject();
          });
          return autoDefer.promise;
        },

        inviteFriends: function (ids) {
          loadFB().then(function () {
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
            FB.ui({
                method: 'apprequests',
                message: 'Come play Twisted Hangman with me!',
                to: s
              },
              function (response) {
                //  TODO - track?
                console.info(JSON.stringify(response));
              });
          }, function () {
            //  TODO - alert error
          });
        },
        playerAndFBMatch: function (player) {
          var matchDeferred = $q.defer();
          loadFB().then(function () {
            if (player.source === 'facebook') {
              FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                  matchDeferred.resolve(response.authResponse.userID === player.sourceId);
                }
                else {
                  matchDeferred.resolve(false);
                }
              });
            } else {
              matchDeferred.resolve(false);
            }
          });
          return matchDeferred.promise;
        }
      };
    }
  ]);

/*global $:false */
'use strict';
angular.module('coreGamesUi.services').factory('jtbLiveGameFeed',
  ['$rootScope', 'jtbPlayerService',
    function ($rootScope, jtbPlayerService) {
      var request = {
        url: '',
        contentType: 'application/json',
        logLevel: 'debug',
        //  AWS doesn't support so kind of pointless and slow to default to it
        //transport: 'websocket',
        transport: 'long-polling',
        trackMessageLength: true,
        fallbackTransport: 'long-polling',

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

      function subscribeToCurrentPlayer() {
        request.url = '/livefeed/' + jtbPlayerService.currentID();
        subscribed = socket.subscribe(request);
      }

      $rootScope.$on('playerLoaded', function () {
        if (angular.isDefined(subscribed)) {
          subscribed.close();
        }
        subscribed = undefined;
        subscribeToCurrentPlayer();
      });

      return {
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

      function broadcastLoaded() {
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

      $rootScope.$on('playerUpdate', function (event, id, player) {
        console.log('playerUpdate');
        if (simulatedPID === id) {
          angular.copy(player, simulatedPlayer);
          $rootScope.$apply();
        }
      });

      initializePlayer();

      return service;
    }]);

