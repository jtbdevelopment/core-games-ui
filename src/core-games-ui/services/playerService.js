'use strict';


angular.module('coreGamesUi.services').factory('jtbPlayerService',
    ['$http', '$rootScope', '$window', 'jtbFacebook',
        function ($http, $rootScope, $window, jtbFacebook) {
            var realPID = '';
            var simulatedPID = '';
            var BASE_PLAYER_URL = '/api/player';
            var FRIENDS_PATH = '/friends';
            var service = {};

            var simulatedPlayer;

            function broadcastLoaded() {
                console.log('Broadcasting playerLoad');
                $rootScope.$broadcast('playerLoaded');
            }

            function initializePlayer() {
                $http.get('/api/security', {cache: true}).then(function (response) {
                    simulatedPlayer = response.data;
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
                });
            }

            service = {
                overridePID: function (newPID) {
                    $http.put(this.currentPlayerBaseURL() + '/admin/' + newPID).then(function (response) {
                        simulatedPlayer = response.data;
                        simulatedPID = simulatedPlayer.id;
                        broadcastLoaded();
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

                //  Only generally used in testing
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

