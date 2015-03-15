(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('coreGamesUi.config', [])
      .value('coreGamesUi.config', {
          debug: true
      });

  // Modules
  angular.module('coreGamesUi.directives', []);
  angular.module('coreGamesUi.filters', []);
  angular.module('coreGamesUi.services', []);
  angular.module('coreGamesUi',
      [
          'coreGamesUi.config',
          'coreGamesUi.directives',
          'coreGamesUi.filters',
          'coreGamesUi.services',
          'ngResource',
          'ngCookies',
          'ngSanitize'
      ]);

})(angular);
