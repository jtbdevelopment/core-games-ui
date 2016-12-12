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

            $http.get('/api/player/admin/playerCount').then(function (response) {
                controller.playerCount = response.data;
            });

            $http.get('/api/player/admin/gameCount').then(function (response) {
                controller.gameCount = response.data;
            });
            function getPlayerCreatedCounts() {
                $http.get('/api/player/admin/playersCreated/' + time24).then(function (response) {
                    controller.playersCreated24hours = response.data;
                });
                $http.get('/api/player/admin/playersCreated/' + time7).then(function (response) {
                    controller.playersCreated7days = response.data;
                });
                $http.get('/api/player/admin/playersCreated/' + time30).then(function (response) {
                    controller.playersCreated30days = response.data;
                });
            }

            function getPlayerLoginCounts() {
                $http.get('/api/player/admin/playersLoggedIn/' + time24).then(function (response) {
                    controller.playersLastLogin24hours = response.data;
                });
                $http.get('/api/player/admin/playersLoggedIn/' + time7).then(function (response) {
                    controller.playersLastLogin7days = response.data;
                });
                $http.get('/api/player/admin/playersLoggedIn/' + time30).then(function (response) {
                    controller.playersLastLogin30days = response.data;
                });
            }

            function getGameCounts() {
                $http.get('/api/player/admin/gamesSince/' + time24).then(function (response) {
                    controller.gamesLast24hours = response.data;
                });

                $http.get('/api/player/admin/gamesSince/' + time7).then(function (response) {
                    controller.gamesLast7days = response.data;
                });

                $http.get('/api/player/admin/gamesSince/' + time30).then(function (response) {
                    controller.gamesLast30days = response.data;
                });
            }

            getPlayerCreatedCounts();
            getPlayerLoginCounts();
            getGameCounts();

            function processUserSearchResponse(response) {
                controller.totalItems = response.totalElements;
                controller.numberOfPages = response.totalPages;
                controller.players = response.content;
                controller.currentPage = response.number + 1;
            }

            function requestData() {
                var pageParams = '?pageSize=' + controller.pageSize +
                    '&page=' + (controller.currentPage - 1) +
                    //  TODO - encode
                    '&like=' + controller.searchText;
                $http.get('/api/player/admin/playersLike/' + pageParams).then(
                    function (response) {
                        processUserSearchResponse(response.data);
                    });
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
