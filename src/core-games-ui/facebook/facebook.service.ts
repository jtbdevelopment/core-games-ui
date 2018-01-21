/*
'use strict';

angular.module('coreGamesUi.services').factory('jtbFacebook',
    ['$http', '$q', '$injector', '$window',
        function ($http, $q, $injector, $window) {
            var loaded = false;
            var facebookAppId = '';
            var facebookPermissions = '';
            var facebookAuth;


            function login(fbLogin) {
                try {
                    var callback = function (response) {
                        if (angular.isDefined(response) &&
                            angular.isDefined(response.status) &&
                            response.status === 'connected') {
                            facebookAuth = response.authResponse;
                            fbLogin.resolve({
                                auto: true,
                                permissions: facebookPermissions
                            });
                        } else {
                            fbLogin.reject();
                        }
                    };

                    if (angular.isDefined(cordovaFacebook)) {
                        cordovaFacebook.login(facebookPermissions.split(',')).then(callback,
                            function (e) {
                                console.log(JSON.stringify(e));
                                fbLogin.reject();
                            });
                    } else {
                        window.FB.login(callback, {scope: facebookPermissions});
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
                if (angular.isDefined(cordovaFacebook)) {
                    cordovaFacebook.api(graphPath, []).then(checkFunction, function (e) {
                        console.log(JSON.stringify(e));
                        autoDefer.reject();
                    });
                } else {
                    window.FB.api(graphPath, checkFunction);
                }
            }

            function canAutoLogin(autoDefer) {
                try {
                    var callback = function (response) {
                        if (angular.isDefined(response) &&
                            angular.isDefined(response.status) &&
                            response.status === 'connected') {
                            facebookAuth = response.authResponse;
                            checkGrantedPermissions(autoDefer);
                        } else {
                            autoDefer.reject();
                        }
                    };
                    if (angular.isDefined(cordovaFacebook)) {
                        cordovaFacebook.getLoginStatus().then(callback, function (e) {
                            console.log(JSON.stringify(e));
                            autoDefer.reject();
                        });
                    } else {
                        window.FB.getLoginStatus(callback);
                    }
                } catch (ex) {
                    console.error(JSON.stringify(ex));
                    autoDefer.reject();
                }
            }

            function inviteFriends(ids, message, inviteDeferred) {
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
                    inviteDeferred.resolve(response);
                };
                var dialog = {
                    method: 'apprequests',
                    message: message,
                    to: s
                };
                if (angular.isDefined(cordovaFacebook)) {
                    cordovaFacebook.showDialog(dialog).then(callback, function () {
                        inviteDeferred.reject();
                    });
                } else {
                    window.FB.ui(dialog, callback);
                }
            }

            function gameAndFacebookLoginMatch(player, matchDeferred) {
                if (player.source === 'facebook') {
                    try {
                        var callback = function (response) {
                            if (response.status === 'connected') {
                                facebookAuth = response.authResponse;
                                matchDeferred.resolve(response.authResponse.userID === player.sourceId);
                            }
                            else {
                                matchDeferred.resolve(false);
                            }
                        };
                        if (angular.isDefined(cordovaFacebook)) {
                            cordovaFacebook.getLoginStatus().then(callback, function (e) {
                                console.log(JSON.stringify(e));
                                matchDeferred.resolve(false);
                            });
                        } else {
                            window.FB.getLoginStatus(callback);
                        }
                    } catch (ex) {
                        console.error(JSON.stringify(ex));
                        matchDeferred.resolve(false);
                    }
                } else {
                    matchDeferred.resolve(false);
                }
            }

            return {
                currentAuthorization: function () {
                    return facebookAuth;
                },

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
                    var inviteDeferred = $q.defer();
                    loadFB().then(function () {
                        inviteFriends(ids, message, inviteDeferred);
                    }, function () {
                        inviteDeferred.reject();
                    });
                    return inviteDeferred.promise;
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

 */