'use strict';

angular.module('coreGamesUi.interceptors')
    .factory('jtbGeneralErrorHandler', [
        '$q', '$rootScope',
        function ($q, $rootScope) {
            return {
                'responseError': function (response) {
                    switch (response.status) {
                        case 409:
                            //  Internal exceptions, no broadcast
                            break;
                        case 401:
                            console.log(JSON.stringify(response));
                            $rootScope.$broadcast('InvalidSession');
                            break;
                        default:
                            console.log(JSON.stringify(response));
                            $rootScope.$broadcast('GeneralError');
                            break;
                    }
                    return $q.reject(response);
                }
            };
        }])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('jtbGeneralErrorHandler');
    }]);

