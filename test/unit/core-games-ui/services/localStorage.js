'use strict';

describe('Service: localStorage', function () {
    // load the controller's module
    beforeEach(module('coreGamesUi.services'));

    var service, window;
    var result = {Something: 'A Phase', Playing: 'Playing!'};

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($window, $injector) {
        window = $window;
        service = $injector.get('jtbLocalStorage');
    }));

    it('test simple set/get', function () {
        service.set('KEY1', 'VALUE');
        expect(service.get('KEY1')).toEqual('VALUE');
    });

    it('test simple get default', function () {
        expect(service.get('KEY2', 'DEFAULT')).toEqual('DEFAULT');
    });

    it('test simple get already set ', function () {
        window.localStorage['KEY3'] = 'VALUE3';
        expect(service.get('KEY3', 'DEFAULT')).toEqual('VALUE3');
    });

    it('test get/set of object', function () {
        var value = {
            anArray: [1, 2, 3, 4],
            key: 'value',
            subObject: {
                subArray: [{x: 'y'}, {z: 1}],
                subField: 43.5
            }
        };

        service.setObject('KEY4', value);
        expect(service.getObject('KEY4')).toEqual(value);
    });

    it('test get  of object previously set', function () {
        var value = {
            anArray: [3.3, 4],
            key: 'valu2e',
            subObject: {
                subArray: [{x: 'y'}, {z: 1}],
                subField: 13.5
            }
        };
        window.localStorage['KEY5'] = JSON.stringify(value);

        expect(service.getObject('KEY5')).toEqual(value);
    });

    it('test default get of object', function () {
        expect(service.getObject('KEY6')).toEqual({});
    });
});
