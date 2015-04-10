'use strict';

angular.module('coreGamesUi.services').factory('jtbGamePhaseService', ['$http', function ($http) {
  return {
    phases: function () {
      return $http.get('/api/phases', {cache: true}).then(function (response) {
        return response.data;
      });
    }
  };
}]);

