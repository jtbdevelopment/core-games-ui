'use strict';

//  largely from ionic article http://learn.ionicframework.com/formulas/localstorage/

angular.module('coreGamesUi.services')
    .factory('jtbLocalStorage',
    ['$window',
        function ($window) {
            return {
                set: function (key, value) {
                    $window.localStorage[key] = value;
                },
                get: function (key, defaultValue) {
                    return $window.localStorage[key] || defaultValue;
                },
                setObject: function (key, value) {
                    $window.localStorage[key] = JSON.stringify(value);
                },
                getObject: function (key) {
                    return JSON.parse($window.localStorage[key] || '{}');
                }
            };
        }
    ]
);