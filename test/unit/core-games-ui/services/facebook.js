describe('Service: facebook', function () {
    // load the controller's module
    beforeEach(module('coreGamesUi.services'));

    beforeEach(module(function ($provide) {
    }));

    var service, location, http, q, window, rootScope;
    var fbAppId = 'someid';
    var fbPerms = 'email,profile';
    var authResponse = 'X134';

    describe('without a cordova facebook plugin available', function () {
        beforeEach(inject(function ($injector, $q, $location, $httpBackend, $window, $rootScope) {
            rootScope = $rootScope;
            location = $location;
            http = $httpBackend;
            window = $window;
            q = $q;
            spyOn(location, 'path');

            window.FB = {
                init: function (params) {
                    console.log('init called');
                    expect(params).toEqual({appId: 'someid', xfbml: false, version: 'v2.2'});
                }
            };

            service = $injector.get('jtbFacebook');
        }));

        describe('with good http call', function () {
            var finalCheck;
            beforeEach(function () {
                finalCheck = false;
                http.expectGET('/api/social/apis').respond({facebookAppId: fbAppId, facebookPermissions: fbPerms});
            });
            afterEach(function () {
                http.flush();
                window.fbAsyncInit();
                rootScope.$apply();
                expect(finalCheck).toEqual(true);
            });

            it('cold start initialization - cannot auto signin if status not connected', function () {
                service.canAutoSignIn().then(function (data) {
                    fail('should not be here');
                }, function () {
                    console.log('failed due to not connected');
                    finalCheck = true;
                });
                window.FB.getLoginStatus = function (cb) {
                    cb({status: 'not connected'});
                };
            });

            describe('with connected status', function () {
                beforeEach(function () {
                    window.FB.getLoginStatus = function (cb) {
                        cb({status: 'connected', authResponse: authResponse});
                    };
                });

                it('cold start initialization - can auto signin', function () {
                    service.canAutoSignIn().then(function (data) {
                        expect(data).toEqual({auto: true, permissions: 'email,profile'});
                        expect(service.currentAuthorization()).toEqual(authResponse);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                    window.FB.api = function (path, cb) {
                        expect(path).toEqual('/me/permissions');
                        cb({
                            data: [{permission: 'email', status: 'granted'}, {
                                permission: 'profile',
                                status: 'granted'
                            }, {permission: 'ignoreMe', status: '??'}]
                        });
                    };
                });

                it('cold start initialization - can auto signin even if some permissions', function () {
                    service.canAutoSignIn().then(function (data) {
                        expect(data).toEqual({auto: true, permissions: 'email,profile'});
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                    window.FB.api = function (path, cb) {
                        expect(path).toEqual('/me/permissions');
                        cb({
                            data: [{permission: 'email', status: 'declined'}, {
                                permission: 'profile',
                                status: 'granted'
                            }]
                        });
                    };
                });

                it('cold start initialization - cannot auto signin if some permissions missing', function () {
                    service.canAutoSignIn().then(function (data) {
                        fail('should not be here');
                    }, function () {
                        console.log('failed due to permissions');
                        finalCheck = true;
                    });
                    window.FB.api = function (path, cb) {
                        expect(path).toEqual('/me/permissions');
                        cb({data: [{permission: 'profile', status: 'granted'}]});
                    };
                });

                it('cold start initialization - cannot auto signin if some permissions error', function () {
                    service.canAutoSignIn().then(function (data) {
                        fail('should not be here');
                    }, function () {
                        console.log('failed due to error checking perms');
                        finalCheck = true;
                    });
                    window.FB.api = function (path, cb) {
                        expect(path).toEqual('/me/permissions');
                        cb({error: 'bad stuff'});
                    };
                });

            });

            describe('with not connected status', function () {
                beforeEach(function () {
                    window.FB.getLoginStatus = function (cb) {
                        cb({status: 'not connected'});
                    };
                });

                it('cold start initialization - initiate login successfully', function () {
                    window.FB.login = function (cb, params) {
                        expect(params).toEqual({scope: fbPerms});
                        cb({status: 'connected', authResponse: authResponse});
                    };
                    service.initiateFBLogin().then(function (data) {
                        expect(data).toEqual({auto: true, permissions: 'email,profile'});
                        expect(service.currentAuthorization()).toEqual(authResponse);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });

                it('cold start initialization - initiate login successfully', function () {
                    window.FB.login = function (cb, params) {
                        expect(params).toEqual({scope: fbPerms});
                        cb({status: 'error'});
                    };
                    service.initiateFBLogin().then(function (data) {
                        fail('should not be here');
                    }, function () {
                        console.log('failed to login');
                        finalCheck = true;
                    });
                });

                it('cold start initialization - initiate login throws exceptions', function () {
                    window.FB.login = function (cb, params) {
                        throw 'blah';
                    };
                    service.initiateFBLogin().then(function (data) {
                        fail('should not be here');
                    }, function () {
                        console.log('failed to login');
                        finalCheck = true;
                    });
                });
            });
        });

        describe('with bad http call', function () {
            var finalCheck;
            beforeEach(function () {
                finalCheck = false;
                http.expectGET('/api/social/apis').respond(500);
            });
            afterEach(function () {
                http.flush();
                rootScope.$apply();
                expect(finalCheck).toEqual(true);
            });

            it('cold start initialization - cannot auto signin if http fails', function () {
                service.canAutoSignIn().then(function (data) {
                    fail('should not be here');
                }, function () {
                    console.log('failed due to no api lookup');
                    finalCheck = true;
                });
            });

            it('cold start initialization - cannot login if http fails', function () {
                service.initiateFBLogin().then(function (data) {
                    fail('should not be here');
                }, function () {
                    console.log('failed to login');
                    finalCheck = true;
                });
            });

        });
        it('cold start initialization - can auto signin called multiple times only inits once', function () {
            var finalCheck = false;
            http.expectGET('/api/social/apis').respond({facebookAppId: fbAppId, facebookPermissions: fbPerms});
            window.FB.getLoginStatus = function (cb) {
                cb({status: 'connected', authResponse: authResponse});
            };
            service.canAutoSignIn().then(function (data) {
                expect(data).toEqual({auto: true, permissions: 'email,profile'});
                expect(service.currentAuthorization()).toEqual(authResponse);
            }, function () {
                fail('should not be here');
            });
            http.flush();
            window.fbAsyncInit();
            window.FB.api = function (path, cb) {
                expect(path).toEqual('/me/permissions');
                cb({data: [{permission: 'email', status: 'granted'}, {permission: 'profile', status: 'granted'}]});
            };
            rootScope.$apply();

            service.canAutoSignIn().then(function (data) {
                expect(data).toEqual({auto: true, permissions: 'email,profile'});
                expect(service.currentAuthorization()).toEqual(authResponse);
                finalCheck = true;
            }, function () {
                fail('should not be here');
            });
            rootScope.$apply();
            expect(finalCheck).toEqual(true);
        });

    });

    describe('with a cordova facebook plugin available', function () {
        beforeEach(module(function ($provide) {
            $provide.factory('$cordovaFacebook', [function () {
                return {};
            }]);
        }));

        beforeEach(inject(function ($injector, $q, $location, $httpBackend, $window, $rootScope) {
            rootScope = $rootScope;
            location = $location;
            http = $httpBackend;
            window = $window;
            q = $q;
            spyOn(location, 'path');

            service = $injector.get('jtbFacebook');
        }));

    });
});