/*global FB:false */
'use strict';

angular.module('coreGamesUi.services').factory('jtbFacebook',
    ['$http', '$location', '$q', '$rootScope',
        function ($http, $location, $q, $rootScope) {
            var loaded = false;
            var facebookAppId = '';
            var facebookPermissions = '';

            //  TODO - deal with facebook disconnect and such
            function loadFB() {
                var fbLoaded = $q.defer();
                if (!loaded) {
                    $http.get('/api/social/apis', {cache: true}).success(function (response) {
                        facebookAppId = response.facebookAppId;
                        facebookPermissions = response.facebookPermissions;
                        window.fbAsyncInit = function () {
                            FB.init({
                                appId: facebookAppId,
                                xfbml: true,
                                version: 'v2.1'
                            });
                            fbLoaded.resolve(facebookPermissions);
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

            //  eventName - string
            //  params - object with
            $rootScope.$on('event', function(eventName, countable, otherData) {
                var data = otherData;
                if(!angular.isDefined(data)) {
                    data = {};
                }
                var count = countable;
                if(!angular.isDefined(countable)) {
                    count = 1;
                }
                try {
                    FB.AppEvents.logEvent(eventName, count, data);
                } catch(err) {
                    console.debug('Failed to log to FB ' + err);
                }
            });

            return {
                canAutoSignIn: function () {
                    var autoDefer = $q.defer();
                    loadFB().then(function (facebookPermissions) {
                        FB.getLoginStatus(function (response) {
                            autoDefer.resolve(
                                {
                                    auto: angular.isDefined(response) &&
                                    angular.isDefined(response.status) &&
                                    response.status === 'connected',
                                    permissions: facebookPermissions
                                }
                            );
                        });
                    }, function () {
                        autoDefer.reject();
                    });
                    return autoDefer.promise;
                },

                inviteFriends: function (ids) {
                    loadFB().then(function () {
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
                        FB.ui({
                                method: 'apprequests',
                                message: 'Come play Twisted Hangman with me!',
                                to: s
                            },
                            function (response) {
                                //  TODO - track?
                                console.info(JSON.stringify(response));
                            });
                    }, function () {
                        //  TODO - alert error
                    });
                },
                playerAndFBMatch: function (player) {
                    var matchDeferred = $q.defer();
                    loadFB().then(function () {
                        if (player.source === 'facebook') {
                            FB.getLoginStatus(function (response) {
                                if (response.status === 'connected') {
                                    matchDeferred.resolve(response.authResponse.userID === player.sourceId);
                                }
                                else {
                                    matchDeferred.resolve(false);
                                }
                            });
                        } else {
                            matchDeferred.resolve(false);
                        }
                    });
                    return matchDeferred.promise;
                }
            };
        }
    ]);
