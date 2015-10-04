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

