'use strict';

describe('', function () {

    var moduleUnderTest;
    var dependencies = [];

    var window;
    window = {};
    window.FB = {x: 'var', ahoy: 'there'};

    var hasModule = function (module) {
        return dependencies.indexOf(module) >= 0;
    };

    beforeEach(function () {
        // Get module
        moduleUnderTest = angular.module('coreGamesUi');
        dependencies = moduleUnderTest.requires;
    });
    
    it('should load outside dependencies', function () {
        expect(hasModule('ngSanitize')).toBeTruthy();
        expect(hasModule('ngCookies')).toBeTruthy();
        expect(hasModule('ngResource')).toBeTruthy();
    });

    it('should load config module', function () {
        expect(hasModule('coreGamesUi.config')).toBeTruthy();
    });

    it('should load filters module', function () {
        expect(hasModule('coreGamesUi.filters')).toBeTruthy();
    });

    it('should load controllers module', function () {
        expect(hasModule('coreGamesUi.controllers')).toBeTruthy();
    });

    it('should load directives module', function () {
        expect(hasModule('coreGamesUi.directives')).toBeTruthy();
    });

    it('should load services module', function () {
        expect(hasModule('coreGamesUi.services')).toBeTruthy();
    });

    it('should load interceptors module', function () {
        expect(hasModule('coreGamesUi.interceptors')).toBeTruthy();
    });
});
