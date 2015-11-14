describe('Service: facebook', function () {
    // load the controller's module
    beforeEach(module('coreGamesUi.services'));

    beforeEach(module(function ($provide) {
    }));

    var service, location, http, q, window, rootScope;
    var fbAppId = 'someid';
    var fbPerms = 'email,profile';
    var fbSourceId = 'FBID1';
    var authResponse = {field: 'X134', userID: fbSourceId};

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

            describe('with connected status', function () {
                beforeEach(function () {
                    window.FB.getLoginStatus = function (cb) {
                        cb({status: 'connected', authResponse: authResponse});
                    };
                });

                it('can auto signin', function () {
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

                it('can auto signin even if some permissions denied', function () {
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

                it('cannot auto signin if some permissions missing', function () {
                    service.canAutoSignIn().then(function () {
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

                it('cannot auto signin if has permissions error', function () {
                    service.canAutoSignIn().then(function () {
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

                it('player and fb matches successfully', function () {
                    var player = {source: 'facebook', sourceId: fbSourceId};
                    service.playerAndFBMatch(player).then(function (data) {
                        expect(data).toEqual(true);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });

                it('player and fb do not match id successfully', function () {
                    var player = {source: 'facebook', sourceId: fbSourceId + 'X'};
                    service.playerAndFBMatch(player).then(function (data) {
                        expect(data).toEqual(false);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });

                it('invite friends', function () {
                    window.FB.ui = function (params, cb) {
                        expect(params).toEqual({method: 'apprequests', message: 'Come play', to: '1, 2, 3'});
                        cb();
                    };
                    service.inviteFriends(['1', '2', '3'], 'Come play').then(function () {
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });
            });

            describe('with not connected status', function () {
                beforeEach(function () {
                    window.FB.getLoginStatus = function (cb) {
                        cb({status: 'not connected'});
                    };
                });

                it('cannot auto signin if status not connected', function () {
                    service.canAutoSignIn().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed due to not connected');
                        finalCheck = true;
                    });
                });

                it('cannot auto signin if getloginstatus exceptions', function () {
                    window.FB.getLoginStatus = function () {
                        throw 'blah';
                    };
                    service.canAutoSignIn().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed due to not connected');
                        finalCheck = true;
                    });
                });

                it('initiate login successfully', function () {
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

                it('initiate login returns error', function () {
                    window.FB.login = function (cb, params) {
                        expect(params).toEqual({scope: fbPerms});
                        cb({status: 'error'});
                    };
                    service.initiateFBLogin().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed to login');
                        finalCheck = true;
                    });
                });

                it('initiate login throws exceptions', function () {
                    window.FB.login = function () {
                        throw 'blah';
                    };
                    service.initiateFBLogin().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed to login');
                        finalCheck = true;
                    });
                });

                it('player and fb do not match if not logged in', function () {
                    var player = {source: 'facebook', sourceId: fbSourceId};
                    service.playerAndFBMatch(player).then(function (data) {
                        expect(data).toEqual(false);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });
            });

            it('player and fb do not match if not login status throws exception', function () {
                window.FB.getLoginStatus = function () {
                    throw 'blah';
                };
                var player = {source: 'facebook', sourceId: fbSourceId};
                service.playerAndFBMatch(player).then(function (data) {
                    expect(data).toEqual(false);
                    finalCheck = true;
                }, function () {
                    fail('should not be here');
                });
            });


            it('player and fb do not match if not fb source', function () {
                var player = {source: 'twitter'};
                service.playerAndFBMatch(player).then(function (data) {
                    expect(data).toEqual(false);
                    finalCheck = true;
                }, function () {
                    fail('should not be here');
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

            it('cannot auto signin if http fails', function () {
                service.canAutoSignIn().then(function () {
                    fail('should not be here');
                }, function () {
                    console.log('failed due to no api lookup');
                    finalCheck = true;
                });
            });

            it('cannot login if http fails', function () {
                service.initiateFBLogin().then(function () {
                    fail('should not be here');
                }, function () {
                    console.log('failed to login');
                    finalCheck = true;
                });
            });

            it('cannot invited friends if http fails', function () {
                service.inviteFriends(['1', '2'], 'Come play').then(function () {
                    fail('should not be here');
                }, function () {
                    console.log('failed to login');
                    finalCheck = true;
                });
            });
        });

        //  Only doing one of these tests, even though theoretically each call should be
        it('can auto signin called multiple times only inits once', function () {
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
        var cordovaFacebook, window;
        beforeEach(module(function ($provide) {
            cordovaFacebook = {};
            $provide.factory('$cordovaFacebook', [function () {
                return cordovaFacebook;
            }]);
            window = {
                location: {
                    href: ''
                }
            };
            $provide.factory('$window', [function() {
                return window;
            }]);
        }));

        beforeEach(inject(function ($injector, $q, $location, $httpBackend, $rootScope) {
            rootScope = $rootScope;
            location = $location;
            http = $httpBackend;
            window.location.href = 'file://somefile';
            q = $q;
            spyOn(location, 'path');

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
                rootScope.$apply();
                expect(finalCheck).toEqual(true);
            });

            describe('with connected status', function () {
                beforeEach(function () {
                    cordovaFacebook.getLoginStatus = function () {
                        var s = q.defer();
                        s.resolve({status: 'connected', authResponse: authResponse});
                        return s.promise;
                    };
                });

                it('can auto signin', function () {
                    service.canAutoSignIn().then(function (data) {
                        expect(data).toEqual({auto: true, permissions: 'email,profile'});
                        expect(service.currentAuthorization()).toEqual(authResponse);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                    cordovaFacebook.api = function (path, param) {
                        var api = q.defer();
                        expect(path).toEqual('/me/permissions');
                        expect(param).toEqual([]);
                        api.resolve({
                            data: [{permission: 'email', status: 'granted'}, {
                                permission: 'profile',
                                status: 'granted'
                            }, {permission: 'ignoreMe', status: '??'}]
                        });
                        return api.promise;
                    };
                });

                it('can auto signin even if some permissions denied', function () {
                    service.canAutoSignIn().then(function (data) {
                        expect(data).toEqual({auto: true, permissions: 'email,profile'});
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                    cordovaFacebook.api = function (path, param) {
                        var api = q.defer();
                        expect(path).toEqual('/me/permissions');
                        expect(param).toEqual([]);
                        api.resolve({
                            data: [{permission: 'email', status: 'declined'}, {
                                permission: 'profile',
                                status: 'granted'
                            }]
                        });
                        return api.promise;
                    };
                });

                it('cannot auto signin if some permissions missing', function () {
                    service.canAutoSignIn().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed due to permissions');
                        finalCheck = true;
                    });
                    cordovaFacebook.api = function (path, param) {
                        var api = q.defer();
                        expect(path).toEqual('/me/permissions');
                        expect(param).toEqual([]);
                        api.resolve({data: [{permission: 'profile', status: 'granted'}]});
                        return api.promise;
                    };
                });

                it('cannot auto signin if has permissions error', function () {
                    service.canAutoSignIn().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed due to error checking perms');
                        finalCheck = true;
                    });
                    cordovaFacebook.api = function (path, param) {
                        var api = q.defer();
                        expect(path).toEqual('/me/permissions');
                        expect(param).toEqual([]);
                        api.resolve({error: 'bad stuff'});
                        return api.promise;
                    };
                });

                it('cannot auto signin if cordova call resolves to reject', function () {
                    service.canAutoSignIn().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed due to error checking perms');
                        finalCheck = true;
                    });
                    cordovaFacebook.api = function (path, param) {
                        var api = q.defer();
                        expect(path).toEqual('/me/permissions');
                        expect(param).toEqual([]);
                        api.reject();
                        return api.promise;
                    };
                });

                it('player and fb matches successfully', function () {
                    var player = {source: 'facebook', sourceId: fbSourceId};
                    service.playerAndFBMatch(player).then(function (data) {
                        expect(data).toEqual(true);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });

                it('player and fb do not match id successfully', function () {
                    var player = {source: 'facebook', sourceId: fbSourceId + 'X'};
                    service.playerAndFBMatch(player).then(function (data) {
                        expect(data).toEqual(false);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });

                it('invite friends', function () {
                    cordovaFacebook.showDialog = function (params) {
                        var cb = q.defer();
                        expect(params).toEqual({method: 'apprequests', message: 'Come play', to: '1, 2, 3'});
                        cb.resolve();
                        return cb.promise;
                    };
                    service.inviteFriends(['1', '2', '3'], 'Come play').then(function () {
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });

                it('invite friends call resolves to reject', function () {
                    cordovaFacebook.showDialog = function (params) {
                        var cb = q.defer();
                        expect(params).toEqual({method: 'apprequests', message: 'Come play', to: '1, 2, 3'});
                        cb.reject();
                        return cb.promise;
                    };
                    service.inviteFriends(['1', '2', '3'], 'Come play').then(function () {
                        fail('should not be here');
                    }, function () {
                        finalCheck = true;
                    });
                });
            });

            describe('with not connected status', function () {
                beforeEach(function () {
                    cordovaFacebook.getLoginStatus = function () {
                        var s = q.defer();
                        s.resolve({status: 'not connected'});
                        return s.promise;
                    };
                });

                it('cannot auto signin if status not connected', function () {
                    service.canAutoSignIn().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed due to not connected');
                        finalCheck = true;
                    });
                });

                it('cannot auto signin if getloginstatus exceptions', function () {
                    cordovaFacebook.getLoginStatus = function () {
                        throw 'blah';
                    };
                    service.canAutoSignIn().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed due to not connected');
                        finalCheck = true;
                    });
                });

                it('initiate login successfully', function () {
                    cordovaFacebook.login = function (perms) {
                        var l = q.defer();
                        expect(perms).toEqual(['email', 'profile']);
                        l.resolve({status: 'connected', authResponse: authResponse});
                        return l.promise;
                    };
                    service.initiateFBLogin().then(function (data) {
                        expect(data).toEqual({auto: true, permissions: 'email,profile'});
                        expect(service.currentAuthorization()).toEqual(authResponse);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });

                it('initiate login returns error', function () {
                    cordovaFacebook.login = function (perms) {
                        var l = q.defer();
                        expect(perms).toEqual(['email', 'profile']);
                        l.resolve({status: 'error'});
                        return l.promise;
                    };
                    service.initiateFBLogin().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed to login');
                        finalCheck = true;
                    });
                });

                it('initiate login resolves to reject', function () {
                    cordovaFacebook.login = function (perms) {
                        var l = q.defer();
                        expect(perms).toEqual(['email', 'profile']);
                        l.reject();
                        return l.promise;
                    };
                    service.initiateFBLogin().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed to login');
                        finalCheck = true;
                    });
                });

                it('initiate login throws exceptions', function () {
                    cordovaFacebook.login = function () {
                        throw 'blah';
                    };
                    service.initiateFBLogin().then(function () {
                        fail('should not be here');
                    }, function () {
                        console.log('failed to login');
                        finalCheck = true;
                    });
                });

                it('player and fb do not match if not logged in', function () {
                    var player = {source: 'facebook', sourceId: fbSourceId};
                    service.playerAndFBMatch(player).then(function (data) {
                        expect(data).toEqual(false);
                        finalCheck = true;
                    }, function () {
                        fail('should not be here');
                    });
                });
            });

            it('player and fb do not match if not login status throws exception', function () {
                cordovaFacebook.getLoginStatus = function () {
                    throw 'blah';
                };
                var player = {source: 'facebook', sourceId: fbSourceId};
                service.playerAndFBMatch(player).then(function (data) {
                    expect(data).toEqual(false);
                    finalCheck = true;
                }, function () {
                    fail('should not be here');
                });
            });

            it('player and fb do not match if not login status resolves to error', function () {
                cordovaFacebook.getLoginStatus = function () {
                    var s = q.defer();
                    s.reject();
                    return s.promise;
                };
                var player = {source: 'facebook', sourceId: fbSourceId};
                service.playerAndFBMatch(player).then(function (data) {
                    expect(data).toEqual(false);
                    finalCheck = true;
                }, function () {
                    fail('should not be here');
                });
            });

            it('player and fb do not match if not fb source', function () {
                var player = {source: 'twitter'};
                service.playerAndFBMatch(player).then(function (data) {
                    expect(data).toEqual(false);
                    finalCheck = true;
                }, function () {
                    fail('should not be here');
                });
            });

            it('cannot auto signin if login status resolves to error', function () {
                cordovaFacebook.getLoginStatus = function () {
                    var s = q.defer();
                    s.reject();
                    return s.promise;
                };
                service.canAutoSignIn().then(function () {
                    fail('should not be here');
                }, function () {
                    finalCheck = true;
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

            it('cannot auto signin if http fails', function () {
                service.canAutoSignIn().then(function () {
                    fail('should not be here');
                }, function () {
                    console.log('failed due to no api lookup');
                    finalCheck = true;
                });
            });

            it('cannot login if http fails', function () {
                service.initiateFBLogin().then(function () {
                    fail('should not be here');
                }, function () {
                    console.log('failed to login');
                    finalCheck = true;
                });
            });

            it('cannot invited friends if http fails', function () {
                service.inviteFriends(['1', '2'], 'Come play').then(function () {
                    fail('should not be here');
                }, function () {
                    console.log('failed to login');
                    finalCheck = true;
                });
            });
        });

        //  Only doing one of these tests, even though theoretically each call should be
        it('can auto signin called multiple times only inits once', function () {
            var finalCheck = false;
            http.expectGET('/api/social/apis').respond({facebookAppId: fbAppId, facebookPermissions: fbPerms});
            cordovaFacebook.getLoginStatus = function () {
                var login = q.defer();
                login.resolve({status: 'connected', authResponse: authResponse});
                return login.promise;
            };
            cordovaFacebook.api = function (path, param) {
                var api = q.defer();
                expect(path).toEqual('/me/permissions');
                expect(param).toEqual([]);
                api.resolve({data: [{permission: 'email', status: 'granted'}, {permission: 'profile', status: 'granted'}]});
                return api.promise;
            };
            service.canAutoSignIn().then(function (data) {
                expect(data).toEqual({auto: true, permissions: 'email,profile'});
                expect(service.currentAuthorization()).toEqual(authResponse);
            }, function () {
                fail('should not be here');
            });
            http.flush();
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
});