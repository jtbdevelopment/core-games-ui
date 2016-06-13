'use strict';

angular.module('coreGamesUi.interceptors').factory('jtbUnauthorizedHandler', function ($q, $rootScope) {
    return {
        'responseError': function (response) {
            console.log('responseError:' + JSON.stringify(response));
            if (response.status === 401) {
                $rootScope.$broadcast('InvalidSession');
            }
            return $q.reject(response);
        }
    };
});

