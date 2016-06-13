'use strict';

describe('Service: unauthorizedHandler', function () {
    // load the controller's module
    beforeEach(module('coreGamesUi.interceptors'));

    var interceptor;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($injector) {
        interceptor = $injector.get('jtbCSRFHttpInterceptor');
    }));

    it('appends nothing if no csrf token has been set', function () {
        var config = {content: 'X'};
        interceptor.request(config);
        expect(config).toEqual({content: 'X'});
    });

    it('picks up csrf on response and adds to next request', function () {
        var token = '1234434x4';
        var response = {
            headers: function (x) {
                if (x === 'XSRF-TOKEN') return token;
                return null;
            }
        };
        interceptor.response(response);
        var config = {content: 'X', headers: {otherHeader: 'Y'}};
        interceptor.request(config);
        expect(config).toEqual({content: 'X', headers: {otherHeader: 'Y', 'X-XSRF-TOKEN': token}});
    });

    it('picks up multiple csrf on response and adds to next request', function () {
        var token1 = '1234434x4';
        var token2 = token1 + 'x3x';
        var token = token1;
        var response = {
            headers: function (x) {
                if (x === 'XSRF-TOKEN') return token;
                return null;
            }
        };
        interceptor.response(response);
        token = token2;
        interceptor.response(response);
        var config = {content: 'X', headers: {otherHeader: 'Y'}};
        interceptor.request(config);
        expect(config).toEqual({content: 'X', headers: {otherHeader: 'Y', 'X-XSRF-TOKEN': token2}});
    });

    it('ignores null tokens', function () {
        var token1 = '1234434x4';
        var token2 = null;
        var token = token1;
        var response = {
            headers: function (x) {
                if (x === 'XSRF-TOKEN') return token;
                return null;
            }
        };
        interceptor.response(response);
        token = token2;
        interceptor.response(response);
        var config = {content: 'X', headers: {otherHeader: 'Y'}};
        interceptor.request(config);
        expect(config).toEqual({content: 'X', headers: {otherHeader: 'Y', 'X-XSRF-TOKEN': token1}});
    });
});
