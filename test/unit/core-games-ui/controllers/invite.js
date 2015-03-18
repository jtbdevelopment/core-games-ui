'use strict';

describe('Controller: CoreInviteCtrl', function () {

  // load the controller's module
  beforeEach(module('coreGamesUi.controllers'));

  var InviteCtrl, scope;

  var invitableFriends = [{name: 'X', id: '1'}, {name: 'Y', id: '5'}, {name: 'Z', id: '10'}];
  var facebookMock = {inviteFriends: jasmine.createSpy()};
  var modalInstance = jasmine.createSpyObj('modalInstance', ['close', 'dismiss']);

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    invitableFriends = [];
    scope = $rootScope.$new();
    InviteCtrl = $controller('CoreInviteCtrl', {
      $scope: scope,
      jtbFacebook: facebookMock,
      $modalInstance: modalInstance,
      invitableFriends: function () {
        return invitableFriends;
      }
    });
  }));

  it('initializes to friends and none chosen', function () {
    expect(scope.invitableFriends()).toEqual(invitableFriends);
    expect(scope.chosenFriends).toEqual([]);
  });

  it('cancel closes dialog', function () {
    scope.cancel();
    expect(modalInstance.dismiss).toHaveBeenCalled();
    expect(facebookMock.inviteFriends).not.toHaveBeenCalled();
  });

  it('invite invites chosen friend ids', function () {
    scope.chosenFriends = [{name: 'X', id: '1'}, {name: 'A', id: '3'}];
    scope.invite();
    expect(modalInstance.close).toHaveBeenCalled();
    expect(facebookMock.inviteFriends).toHaveBeenCalledWith(['1', '3']);
  });
});
