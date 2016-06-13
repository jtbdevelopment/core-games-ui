'use strict';

describe('Service: unauthorizedHandler', function () {
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
        interceptor = $injector.get('jtbUnauthorizedHandler');
    }));

    it('broadcasts invalid session on 401 response', function() {
        var error = {status: 401, message: 'X'};
        interceptor.responseError(error);
        expect(rootScope.$broadcast).toHaveBeenCalledWith('InvalidSession');
        expect(q.reject).toHaveBeenCalledWith(error);
        expect(q.resolve).not.toHaveBeenCalled();
    });

    it('does not broadcasts invalid session on non 401 response', function() {
        var error = {status: 402, message: 'X'};
        interceptor.responseError(error);
        expect(rootScope.$broadcast).not.toHaveBeenCalledWith('InvalidSession');
        expect(q.reject).toHaveBeenCalledWith(error);
        expect(q.resolve).not.toHaveBeenCalled();
    });
});
