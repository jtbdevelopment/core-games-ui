'use strict';

describe('Controller: CoreSignInCtrl', function () {

    // load the controller's module
    beforeEach(module('coreGamesUi.controllers'));

    var SignInCtrl, scope, q, mockFacebook, autoLogin, doLogin;
    var cookies = {
        somethin: 'somethin'
    };
    var window;


    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, $q) {
        q = $q;
        window = {location: jasmine.createSpy()};
        cookies['XSRF-TOKEN'] = 'TOKEN';
        mockFacebook = {
            canAutoSignIn: function () {
                autoLogin = q.defer();
                return autoLogin.promise;
            },
            initiateFBLogin: function () {
                doLogin = q.defer();
                return doLogin.promise;
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
        autoLogin.resolve({auto: true, permissions: 'perm'});
        scope.$apply();
        expect(scope.showFacebook).toEqual(false);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('Logging in via Facebook');
        expect(window.location).toEqual('/auth/facebook');
    });

    it('initializes and cannot autologin with localhost', function () {
        expect(scope.csrf).toEqual('TOKEN');
        expect(scope.showFacebook).toEqual(false);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('Initializing...');
        window.location = {href: 'somethinglocalhostsomething'};
        autoLogin.resolve({auto: false, permissions: 'perm'});
        scope.$apply();
        expect(scope.showFacebook).toEqual(true);
        expect(scope.showManual).toEqual(true);
        expect(scope.message).toEqual('');
    });

    it('errors with localhost', function () {
        expect(scope.csrf).toEqual('TOKEN');
        expect(scope.showFacebook).toEqual(false);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('Initializing...');
        window.location = {href: 'somethinglocalhostsomething'};
        autoLogin.reject();
        scope.$apply();
        expect(scope.showFacebook).toEqual(true);
        expect(scope.showManual).toEqual(true);
        expect(scope.message).toEqual('');
    });

    it('initializes and cannot autologin with -dev', function () {
        expect(scope.csrf).toEqual('TOKEN');
        expect(scope.showFacebook).toEqual(false);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('Initializing...');
        window.location = {href: 'something-devsomething'};
        autoLogin.resolve({auto: false, permissions: 'perm'});
        scope.$apply();
        expect(scope.showFacebook).toEqual(true);
        expect(scope.showManual).toEqual(true);
        expect(scope.message).toEqual('');
    });

    it('errors with -dev', function () {
        expect(scope.csrf).toEqual('TOKEN');
        expect(scope.showFacebook).toEqual(false);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('Initializing...');
        window.location = {href: 'something-devsomething'};
        autoLogin.reject();
        scope.$apply();
        expect(scope.showFacebook).toEqual(true);
        expect(scope.showManual).toEqual(true);
        expect(scope.message).toEqual('');
    });

    it('initializes and cannot autologin with non-manual', function () {
        expect(scope.csrf).toEqual('TOKEN');
        expect(scope.showFacebook).toEqual(false);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('Initializing...');
        window.location = {href: 'somethingsomething'};
        autoLogin.resolve({auto: false, permissions: 'perm2'});
        scope.$apply();
        expect(scope.showFacebook).toEqual(true);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('');
    });

    it('errors with non-manual', function () {
        expect(scope.csrf).toEqual('TOKEN');
        expect(scope.showFacebook).toEqual(false);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('Initializing...');
        window.location = {href: 'somethingsomething'};
        autoLogin.reject();
        scope.$apply();
        expect(scope.showFacebook).toEqual(true);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('');
    });

    it('pressing FB Login to success and auto-login', function () {
        scope.fbLogin();
        doLogin.resolve({auto: true});
        scope.$apply();
        expect(scope.showFacebook).toEqual(false);
        expect(scope.showManual).toEqual(false);
        expect(scope.message).toEqual('Logging in via Facebook');
        expect(window.location).toEqual('/auth/facebook');
    });

    it('pressing FB Login to success but not auto-login', function () {
        window.location = {href: 'somethinglocalhostsomething'};
        scope.fbLogin();
        doLogin.resolve({auto: false});
        scope.$apply();
        expect(scope.showFacebook).toEqual(true);
        expect(scope.showManual).toEqual(true);
        expect(scope.message).toEqual('');
    });

    it('pressing FB Login to failure', function () {
        window.location = {href: 'somethinglocalhostsomething'};
        scope.fbLogin();
        doLogin.reject();
        scope.$apply();
        expect(scope.showFacebook).toEqual(true);
        expect(scope.showManual).toEqual(true);
        expect(scope.message).toEqual('');
    });
});
