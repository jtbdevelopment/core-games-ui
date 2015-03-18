'use strict';

describe('Controller: CoreSignInCtrl', function () {

  // load the controller's module
  beforeEach(module('coreGamesUi.controllers'));

  var SignInCtrl, scope, q, mockFacebook, facebookDeferred;
  var cookies = {
    somethin: 'somethin',
  };
  var window;


  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $q) {
    q = $q;
    window = {location: jasmine.createSpy()};
    cookies['XSRF-TOKEN'] = 'TOKEN';
    mockFacebook = {
      canAutoSignIn: function () {
        facebookDeferred = q.defer();
        return facebookDeferred.promise;
      }
    };
    scope = $rootScope.$new();
    SignInCtrl = $controller('CoreSignInCtrl', {
      $scope: scope,
      $cookies: cookies,
      $window: window,
      jtbFacebook: mockFacebook
    });
  }));

  it('initializes', function () {
    expect(scope.csrf).toEqual('TOKEN');
    expect(scope.showFacebook).toEqual(false);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('Initializing...');
  });

  it('initializes and can autologin', function () {
    expect(scope.csrf).toEqual('TOKEN');
    expect(scope.showFacebook).toEqual(false);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('Initializing...');
    expect(scope.facebookPermissions).toEqual('');
    facebookDeferred.resolve({auto: true, permissions: 'perm'});
    scope.$apply();
    expect(scope.showFacebook).toEqual(false);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('Logging in via Facebook');
    expect(window.location).toEqual('/auth/facebook');
    expect(scope.facebookPermissions).toEqual('perm');
  });

  it('initializes and cannot autologin with localhost', function () {
    expect(scope.csrf).toEqual('TOKEN');
    expect(scope.showFacebook).toEqual(false);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('Initializing...');
    expect(scope.facebookPermissions).toEqual('');
    window.location = {href: 'somethinglocalhostsomething'};
    facebookDeferred.resolve({auto: false, permissions: 'perm'});
    scope.$apply();
    expect(scope.showFacebook).toEqual(true);
    expect(scope.showManual).toEqual(true);
    expect(scope.message).toEqual('');
    expect(scope.facebookPermissions).toEqual('perm');
  });

  it('errors with localhost', function () {
    expect(scope.csrf).toEqual('TOKEN');
    expect(scope.showFacebook).toEqual(false);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('Initializing...');
    expect(scope.facebookPermissions).toEqual('');
    window.location = {href: 'somethinglocalhostsomething'};
    facebookDeferred.reject();
    scope.$apply();
    expect(scope.showFacebook).toEqual(true);
    expect(scope.showManual).toEqual(true);
    expect(scope.message).toEqual('');
    expect(scope.facebookPermissions).toEqual('');
  });

  it('initializes and cannot autologin with -dev', function () {
    expect(scope.csrf).toEqual('TOKEN');
    expect(scope.showFacebook).toEqual(false);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('Initializing...');
    expect(scope.facebookPermissions).toEqual('');
    window.location = {href: 'something-devsomething'};
    facebookDeferred.resolve({auto: false, permissions: 'perm'});
    scope.$apply();
    expect(scope.showFacebook).toEqual(true);
    expect(scope.showManual).toEqual(true);
    expect(scope.message).toEqual('');
    expect(scope.facebookPermissions).toEqual('perm');
  });

  it('errors with -dev', function () {
    expect(scope.csrf).toEqual('TOKEN');
    expect(scope.showFacebook).toEqual(false);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('Initializing...');
    expect(scope.facebookPermissions).toEqual('');
    window.location = {href: 'something-devsomething'};
    facebookDeferred.reject();
    scope.$apply();
    expect(scope.showFacebook).toEqual(true);
    expect(scope.showManual).toEqual(true);
    expect(scope.message).toEqual('');
    expect(scope.facebookPermissions).toEqual('');
  });

  it('initializes and cannot autologin with non-manual', function () {
    expect(scope.csrf).toEqual('TOKEN');
    expect(scope.showFacebook).toEqual(false);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('Initializing...');
    expect(scope.facebookPermissions).toEqual('');
    window.location = {href: 'somethingsomething'};
    facebookDeferred.resolve({auto: false, permissions: 'perm2'});
    scope.$apply();
    expect(scope.showFacebook).toEqual(true);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('');
    expect(scope.facebookPermissions).toEqual('perm2');
  });

  it('errors with non-manual', function () {
    expect(scope.csrf).toEqual('TOKEN');
    expect(scope.showFacebook).toEqual(false);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('Initializing...');
    expect(scope.facebookPermissions).toEqual('');
    window.location = {href: 'somethingsomething'};
    facebookDeferred.reject();
    scope.$apply();
    expect(scope.showFacebook).toEqual(true);
    expect(scope.showManual).toEqual(false);
    expect(scope.message).toEqual('');
    expect(scope.facebookPermissions).toEqual('');
  });
});
