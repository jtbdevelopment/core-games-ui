/*global FB:false */
'use strict';

angular.module('coreGamesUi.services').factory('jtbFacebook',
    ['$http', '$location', '$q', '$injector', '$window',
        function ($http, $location, $q, $injector, $window) {
            var loaded = false;
            var facebookAppId = '';
            var facebookPermissions = '';

            var cordovaFacebook;
            try {
                if ($window.location.href.indexOf('file:') === 0) {
                    cordovaFacebook = $injector.get('$cordovaFacebook');
                }
            } catch(ex) {
                cordovaFacebook = undefined;
            }

            function loadFB() {
                var fbLoaded = $q.defer();
                if (!loaded) {
                    $http.get('/api/social/apis', {cache: true}).success(function (response) {
                        facebookAppId = response.facebookAppId;
                        facebookPermissions = response.facebookPermissions;
                        if(angular.isDefined(cordovaFacebook)) {
                            fbLoaded.resolve();
                        } else {
                            window.fbAsyncInit = function () {
                                FB.init({
                                    appId: facebookAppId,
                                    xfbml: false,
                                    version: 'v2.2'
                                });
                                fbLoaded.resolve();
                            };

                            (function (d, s, id) {
                                function onLoadCB() {
                                    loaded = false;
                                    fbLoaded.reject();
                                }

                                var js, fjs = d.getElementsByTagName(s)[0];
                                if (d.getElementById(id)) {
                                    return;
                                }
                                js = d.createElement(s);
                                js.id = id;
                                js.src = '//connect.facebook.net/en_US/sdk.js';
                                js.onerror = onLoadCB;
                                fjs.parentNode.insertBefore(js, fjs);
                            }(document, 'script', 'facebook-jssdk'));
                        }
                        loaded = true;
                    }).error(function () {
                        $location.path('/error');
                        fbLoaded.reject();
                    });

                    return fbLoaded.promise;
                } else {
                    fbLoaded.resolve();
                    return fbLoaded.promise;
                }
            }

            function login(fbLogin) {
                try {
                    var callback = function(response) {
                        if (angular.isDefined(response) &&
                            angular.isDefined(response.status) &&
                            response.status === 'connected') {
                            fbLogin.resolve({
                                auto: true,
                                permissions: facebookPermissions
                            });
                        } else {
                            fbLogin.reject();
                        }
                    };

                    if(angular.isDefined(cordovaFacebook)) {
                        cordovaFacebook.login(facebookPermissions.split(',')).then(callback,
                            function(e) {
                                console.log(JSON.stringify(e));
                                fbLogin.reject();
                            });
                    } else {
                        FB.login(callback, {scope: facebookPermissions});
                    }
                } catch (ex) {
                    console.error(JSON.stringify(ex));
                    fbLogin.reject();
                }
            }

            function checkGrantedPermissions(autoDefer) {
                var checkFunction = function (response) {
                    if (angular.isDefined(response) && !angular.isDefined(response.error)) {
                        var permissions = facebookPermissions.split(',');
                        var allFound = true;
                        angular.forEach(permissions, function (permission) {
                            var found = false;
                            angular.forEach(response.data, function (fbPermission) {
                                if (permission === fbPermission.permission &&
                                    (
                                        fbPermission.status === 'granted' ||
                                        fbPermission.status === 'declined'
                                    )) {
                                    found = true;
                                }
                            });
                            if (!found) {
                                allFound = false;
                            }
                        });
                        if (allFound) {
                            autoDefer.resolve(
                                {
                                    auto: true,
                                    permissions: facebookPermissions
                                }
                            );
                        } else {
                            autoDefer.reject();
                        }
                    } else {
                        autoDefer.reject();
                    }
                };
                var graphPath = '/me/permissions';
                if(angular.isDefined(cordovaFacebook)) {
                    cordovaFacebook.api(graphPath, []).then(checkFunction, function(e) {
                        console.log(JSON.stringify(e));
                        autoDefer.reject();
                    });
                } else {
                    FB.api(graphPath, checkFunction);
                }
            }

            function canAutoLogin(autoDefer) {
                try {
                    var callback = function (response) {
                        if (angular.isDefined(response) &&
                            angular.isDefined(response.status) &&
                            response.status === 'connected') {
                            checkGrantedPermissions(autoDefer);
                        } else {
                            autoDefer.reject();
                        }
                    };
                    if(angular.isDefined(cordovaFacebook)) {
                        cordovaFacebook.getLoginStatus().then(callback, function(e) {
                            console.log(JSON.stringify(e));
                            autoDefer.reject();
                        });
                    } else {
                        FB.getLoginStatus(callback);
                    }
                } catch (ex) {
                    console.error(JSON.stringify(ex));
                }
            }

            function inviteFriends(ids, message) {
                var first = true;
                var s = '';
                angular.forEach(ids, function (id) {
                    if (!first) {
                        s = s + ', ';
                    } else {
                        first = false;
                    }
                    s = s + id;
                });
                var callback = function (response) {
                    //  TODO - track?
                    console.info(JSON.stringify(response));
                };
                var dialog = {
                    method: 'apprequests',
                    message: message,
                    to: s
                };
                if(angular.isDefined(cordovaFacebook)) {
                    cordovaFacebook.showDialog(dialog).then(callback, function() {
                        //  TODO
                    });
                } else {
                    FB.ui(dialog, callback);
                }
            }

            function gameAndFacebookLoginMatch(player, matchDeferred) {
                if (player.source === 'facebook') {
                    try {
                        var callback = function (response) {
                            if (response.status === 'connected') {
                                matchDeferred.resolve(response.authResponse.userID === player.sourceId);
                            }
                            else {
                                matchDeferred.resolve(false);
                            }
                        };
                        if(angular.isDefined(cordovaFacebook)) {
                            cordovaFacebook.getLoginStatus().then(callback, function(e) {
                                console.log(JSON.stringify(e));
                                matchDeferred.resolve(false);
                            });
                        } else {
                            FB.getLoginStatus(callback);
                        }
                    } catch (ex) {
                        console.error(JSON.stringify);
                        matchDeferred.resolve(false);
                    }
                } else {
                    matchDeferred.resolve(false);
                }
            }

            return {
                initiateFBLogin: function () {
                    var fbLogin = $q.defer();
                    loadFB().then(function () {
                        login(fbLogin);
                    }, function () {
                        fbLogin.reject();
                    });
                    return fbLogin.promise;
                },
                canAutoSignIn: function () {
                    var autoDefer = $q.defer();
                    loadFB().then(function () {
                        canAutoLogin(autoDefer);
                    }, function () {
                        autoDefer.reject();
                    });
                    return autoDefer.promise;
                },

                inviteFriends: function (ids, message) {
                    loadFB().then(function () {
                        inviteFriends(ids, message);
                    }, function () {
                        //  TODO - alert error
                    });
                },
                playerAndFBMatch: function (player) {
                    var matchDeferred = $q.defer();
                    loadFB().then(function () {
                        gameAndFacebookLoginMatch(player, matchDeferred);
                    });
                    return matchDeferred.promise;
                }
            };
        }
    ]);
