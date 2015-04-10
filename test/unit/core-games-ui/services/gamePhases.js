'use strict';

describe('Service: gamePhases', function () {
  // load the controller's module
  beforeEach(module('coreGamesUi.services'));

  var service, httpBackend;
  var result = {Something: 'A Phase', Playing: 'Playing!'};

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($httpBackend, $injector) {
    httpBackend = $httpBackend;
    service = $injector.get('jtbGamePhaseService');
  }));

  it('sets phases to http results', function () {
    var phases = null;
    httpBackend.expectGET('/api/phases').respond(result);
    service.phases().then(function (data) {
      phases = data;
    }, function (error) {
      phases = error;
    });
    httpBackend.flush();

    expect(phases).toEqual(result);
  });

  it('sets phases to error results', function () {
    var phases;
    httpBackend.expectGET('/api/phases').respond(500);
    var errorCalled = false;
    service.phases().then(function (data) {
      phases = data;
    }, function (error) {
      expect(error).toBeDefined();
      errorCalled = true;
    });
    httpBackend.flush();

    expect(errorCalled).toEqual(true);
    expect(phases).toBeUndefined();
  });

  it('multiple calls only one http result', function () {
    var phases = null;
    httpBackend.expectGET('/api/phases').respond(result);
    service.phases().then(function (data) {
      phases = data;
    }, function (error) {
      phases = error;
    });
    httpBackend.flush();

    expect(phases).toEqual(result);

    service.phases().then(function (data) {
      phases = data;
    }, function (error) {
      phases = error;
    });

    expect(phases).toEqual(result);
  });
});
