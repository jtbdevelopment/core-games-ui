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
      var tmp = 'Have Live Game Feed ' + jtbLiveGameFeed;  //  This is just to force instantiation and suppress warnings
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
            if (!initializing) {
              $rootScope.$broadcast('gameUpdated', existingGame, updatedGame);
            }
          } else {
            var phaseCache = gameCache.get(updatedGame.gamePhase);
            phaseCache.games.push(updatedGame);
            phaseCache.idMap[updatedGame.id] = phaseCache.games.indexOf(updatedGame);
            allCache.games.push(updatedGame);
            allCache.idMap[updatedGame.id] = allCache.games.indexOf(updatedGame);
            if (!initializing) {
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
