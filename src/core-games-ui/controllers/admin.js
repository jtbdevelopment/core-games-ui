'use strict';

angular.module('coreGamesUi.controllers').controller('CoreAdminCtrl',
    ['$scope', '$http', 'jtbPlayerService',
        function ($scope, $http, jtbPlayerService) {
            var controller = this;

            controller.searchText = '';
            controller.pageSize = 20;
            controller.players = [];
            controller.computeRevertFields = function () {
                controller.revertEnabled = jtbPlayerService.realPID() !== jtbPlayerService.currentID();
                controller.revertText = controller.revertEnabled ?
                    'You are simulating another player.' :
                    'You are yourself.';
            };

            controller.playerCount = 0;
            controller.gameCount = 0;
            controller.playersCreated24hours = 0;
            controller.playersCreated7days = 0;
            controller.playersCreated30days = 0;
            controller.playersLastLogin24hours = 0;
            controller.playersLastLogin7days = 0;
            controller.playersLastLogin30days = 0;
            controller.gamesLast24hours = 0;
            controller.gamesLast7days = 0;
            controller.gamesLast30days = 0;

            var time = Math.floor((new Date()).getTime() / 1000);
            var dayInSeconds = 86400;
            var time24 = time - (dayInSeconds);
            var time7 = time - (dayInSeconds * 7);
            var time30 = time - (dayInSeconds * 30);

            $http.get('/api/player/admin/playerCount').success(function (data) {
                controller.playerCount = data;
            });

            $http.get('/api/player/admin/gameCount').success(function (data) {
                controller.gameCount = data;
            });
            function getPlayerCreatedCounts() {
                $http.get('/api/player/admin/playersCreated/' + time24).success(function (data) {
                    controller.playersCreated24hours = data;
                });
                $http.get('/api/player/admin/playersCreated/' + time7).success(function (data) {
                    controller.playersCreated7days = data;
                });
                $http.get('/api/player/admin/playersCreated/' + time30).success(function (data) {
                    controller.playersCreated30days = data;
                });
            }

            function getPlayerLoginCounts() {
                $http.get('/api/player/admin/playersLoggedIn/' + time24).success(function (data) {
                    controller.playersLastLogin24hours = data;
                });
                $http.get('/api/player/admin/playersLoggedIn/' + time7).success(function (data) {
                    controller.playersLastLogin7days = data;
                });
                $http.get('/api/player/admin/playersLoggedIn/' + time30).success(function (data) {
                    controller.playersLastLogin30days = data;
                });
            }

            function getGameCounts() {
                $http.get('/api/player/admin/gamesSince/' + time24).success(function (data) {
                    controller.gamesLast24hours = data;
                });

                $http.get('/api/player/admin/gamesSince/' + time7).success(function (data) {
                    controller.gamesLast7days = data;
                });

                $http.get('/api/player/admin/gamesSince/' + time30).success(function (data) {
                    controller.gamesLast30days = data;
                });
            }

            getPlayerCreatedCounts();
            getPlayerLoginCounts();
            getGameCounts();

            function processUserSearchResponse(data) {
                controller.totalItems = data.totalElements;
                controller.numberOfPages = data.totalPages;
                controller.players = data.content;
                controller.currentPage = data.number + 1;
            }

            function requestData() {
                var pageParams = '?pageSize=' + controller.pageSize +
                    '&page=' + (controller.currentPage - 1) +
                    //  TODO - encode
                    '&like=' + controller.searchText;
                $http.get('/api/player/admin/playersLike/' + pageParams).then(
                    function (response) {
                        processUserSearchResponse(response.data);
                    },
                    function (data, status/*, headers, config*/) {
                        console.error(data + '/' + status);
                        //  TODO
                    }
                );
            }

            controller.refreshData = function () {
                controller.players.slice(0);
                controller.totalItems = 0;
                controller.numberOfPages = 0;
                controller.currentPage = 1;
                requestData();
            };

            controller.changePage = function () {
                requestData();
            };

            controller.switchToPlayer = function (id) {
                jtbPlayerService.overridePID(id);
            };

            controller.revertToNormal = function () {
                jtbPlayerService.overridePID(jtbPlayerService.realPID());
            };

            controller.refreshData();
            controller.computeRevertFields();

            $scope.$on('playerLoaded', function () {
                controller.computeRevertFields();
            });

        }
    ]
);
