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

