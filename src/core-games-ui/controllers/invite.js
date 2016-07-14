'use strict';

//  TODO - this is dependent on angular-bootstrap - this should get removed from this library
angular.module('coreGamesUi.controllers').controller('CoreInviteCtrl',
    ['$uibModalInstance', '$scope', 'invitableFriends', 'message', 'jtbFacebook',
        function ($uibModalInstance, $scope, invitableFriends, message, jtbFacebook) {
            $scope.invitableFriends = invitableFriends;
            $scope.chosenFriends = [];
            $scope.message = message;
            $scope.invite = function () {
                var ids = [];
                angular.forEach($scope.chosenFriends, function (chosen) {
                    ids.push(chosen.id);
                });
                jtbFacebook.inviteFriends(ids, message);
                $uibModalInstance.close();
            };
            $scope.cancel = function () {
                $uibModalInstance.dismiss();
            };
        }]);

