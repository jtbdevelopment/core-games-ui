'use strict';

describe('Interceptor: jtbGeneralErrorHandler', function () {
    var httpProvider;
    // load the controller's module
    beforeEach(module('coreGamesUi.interceptors', function ($httpProvider) {
        httpProvider = $httpProvider;
    }));
    // load the controller's module
    beforeEach(module('coreGamesUi.interceptors'));

    var interceptor;

    var rootScope, q;
    // Initialize the controller and a mock scope
    beforeEach(inject(function ($injector, $rootScope, $q) {
        rootScope = $rootScope;
        q = $q;
        spyOn(rootScope, '$broadcast');
        spyOn(q, 'reject');
        spyOn(q, 'resolve');
        interceptor = $injector.get('jtbGeneralErrorHandler');
    }));

    it('registers interceptor', function () {
        expect(httpProvider.interceptors).toContain('jtbGeneralErrorHandler');
    });

    it('broadcasts invalid session on 401 response', function () {
        var error = {status: 401, message: 'X'};
        interceptor.responseError(error);
        expect(rootScope.$broadcast).toHaveBeenCalledWith('InvalidSession');
        expect(q.reject).toHaveBeenCalledWith(error);
        expect(q.resolve).not.toHaveBeenCalled();
    });

    it('broadcasts general error for any other error between 400 and 499 that is not 401 or 409', function () {
        var i = 400;
        while (i < 900) {
            if (i !== 401) {
                var error = {status: i, message: 'test'};
                interceptor.responseError(error);
                if (i !== 409) {
                    expect(rootScope.$broadcast).not.toHaveBeenCalledWith('InvalidSession');
                    expect(rootScope.$broadcast).toHaveBeenCalledWith('GeneralError');
                } else {
                    expect(rootScope.$broadcast).not.toHaveBeenCalledWith('InvalidSession');
                    expect(rootScope.$broadcast).not.toHaveBeenCalledWith('GeneralError');
                }
                expect(q.reject).toHaveBeenCalledWith(error);
                expect(q.resolve).not.toHaveBeenCalled();
                rootScope.$broadcast.calls.reset();
            }
            i += 1;
        }
    });
});
