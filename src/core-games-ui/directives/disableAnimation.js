'use strict';

//  From https://github.com/angular-ui/bootstrap/issues/1350
angular.module('coreGamesUi.directives').directive('disableAnimation', function ($animate) {
  return {
    restrict: 'A',
    link: function ($scope, $element, $attrs) {
      $attrs.$observe('disableAnimation', function (value) {
        $animate.enabled(!value, $element);
      });
    }
  };
});
