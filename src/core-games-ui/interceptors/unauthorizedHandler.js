'use strict';

angular.module('coreGamesUi.interceptors')
    .factory('jtbUnauthorizedHandler', [
        '$q', '$rootScope',
        function ($q, $rootScope) {
            return {
                'responseError': function (response) {
                    console.log('responseError:' + JSON.stringify(response));
                    if (response.status === 401) {
                        $rootScope.$broadcast('InvalidSession');
                    }
                    return $q.reject(response);
                }
            };
        }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('jtbUnauthorizedHandler');
    }]);

