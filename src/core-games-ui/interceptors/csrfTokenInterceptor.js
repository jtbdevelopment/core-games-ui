'use strict';

angular.module('coreGamesUi.interceptors')
    .factory('jtbCSRFHttpInterceptor', function () {
        var csrfToken;
        return {
            'request': function (config) {
                if (angular.isDefined(csrfToken)) {
                    config.headers['X-XSRF-TOKEN'] = csrfToken;
                }
                return config;
            },
            'response': function (response) {
                if (angular.isDefined(response.headers) &&
                    angular.isDefined(response.headers('XSRF-TOKEN')) &&
                    response.headers('XSRF-TOKEN') !== null) {
                    csrfToken = response.headers('XSRF-TOKEN');
                }
                return response;
            }
        };
    })
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('jtbCSRFHttpInterceptor');
    }]);

