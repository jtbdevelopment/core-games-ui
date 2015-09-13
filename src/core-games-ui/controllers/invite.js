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

