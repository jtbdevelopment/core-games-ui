'use strict';

describe('Service: gamePhases', function () {
    // load the controller's module
    beforeEach(module('coreGamesUi.services'));

    var anId = '';
    var theId = 'some-id';
    var workingRequest;
    var socket = {close: jasmine.createSpy('close')};
    var subscribeCount;
    var throwException = false;
    var atmosphere = {
        subscribe: function (request) {
            console.log('got request');
            workingRequest = request;
            subscribeCount = subscribeCount + 1;
            if (throwException) {
                console.log('throw');
                throw {x: 'y'};
            } else {
                console.log('socket');
                return socket;
            }
        }
    };

    beforeEach(module(function ($provide) {
        $provide.factory('jtbPlayerService', function () {
            return {
                currentID: function () {
                    console.log('getting id ' + anId);
                    return anId;
                }
            };
        });
    }));

    var service, httpBackend, rootScope, timeout, injector;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($httpBackend, $rootScope, $timeout, $injector) {
        httpBackend = $httpBackend;
        rootScope = $rootScope;
        timeout = $timeout;
        workingRequest = undefined;
        injector = $injector;
        anId = '';
        subscribeCount = 0;
        window.atmosphere = atmosphere;
        throwException = false;
        socket = {close: jasmine.createSpy('close')};
    }));

    describe('player already defined by time feed is initialized', function () {
        beforeEach(function () {
            anId = theId;
            service = injector.get('jtbLiveGameFeed');
        });

        it('subscribes automatically', function () {
            timeout.flush();
            expect(workingRequest).toBeDefined();
            expect(workingRequest.url).toEqual('/livefeed/' + theId);
            expect(workingRequest.contentType).toEqual('application/json');
            expect(workingRequest.logLevel).toEqual('info');
            expect(workingRequest.trackMessageLength).toEqual(true);
            expect(workingRequest.withCredentials).toEqual(true);
            expect(workingRequest.closeAsync).toEqual(true);
            expect(workingRequest.handleOnlineOffline).toEqual(false);
            expect(workingRequest.transport).toEqual('long-polling');
            expect(workingRequest.fallbackTransport).toEqual('long-polling');
            expect(workingRequest.onOpen).toBeDefined();
            expect(workingRequest.onMessage).toBeDefined();
            expect(workingRequest.onClose).toBeDefined();
            expect(workingRequest.onError).toBeDefined();
        });
    });

    describe('player not defined by time feed is initialized', function () {
        beforeEach(function () {
            service = injector.get('jtbLiveGameFeed');
            rootScope.$broadcast('playerLoaded');
            anId = theId;
            rootScope.$apply();
        });

        it('subscribes when player loaded', function () {
            expect(workingRequest).toBeUndefined();
            timeout.flush();
            expect(workingRequest).toBeDefined();
        });

        it('doesnt subscribes when player loaded but id = blank', function () {
            anId = '';
            expect(workingRequest).toBeUndefined();
            timeout.flush();
            expect(workingRequest).toBeUndefined();
            expect(subscribeCount).toEqual(0);
        });

        it('unsubscribes when player already loaded', function () {
            timeout.flush();
            expect(workingRequest).toBeDefined();
            expect(socket.close).not.toHaveBeenCalled();

            rootScope.$broadcast('playerLoaded');
            anId = theId + 'X';
            rootScope.$apply();
            timeout.flush();

            expect(workingRequest.url).toEqual('/livefeed/' + theId + 'X');
            expect(socket.close).toHaveBeenCalled();
            expect(subscribeCount).toEqual(2);
        });

        it('unsubscribes when player timeout pending', function () {
            //  2nd broadcast
            rootScope.$broadcast('playerLoaded');
            anId = theId + 'X';
            rootScope.$apply();
            timeout.flush();

            expect(workingRequest.url).toEqual('/livefeed/' + theId + 'X');
            expect(socket.close).not.toHaveBeenCalled();
            expect(subscribeCount).toEqual(1);
        });

        describe('test retry logic', function () {
            it('subscribes up to 5 additional times if exception', function () {
                throwException = true;
                timeout.flush();

                timeout.flush();
                timeout.flush();

                timeout.flush();
                timeout.flush();

                timeout.flush();
                timeout.flush();

                timeout.flush();
                timeout.flush();

                timeout.flush();
                timeout.flush();
                expect(subscribeCount).toEqual(6);  //  initial + 5 more attempts
            });

            it('stops subscribing if 1 succeeds', function () {
                throwException = true;
                timeout.flush();

                timeout.flush();
                timeout.flush();

                timeout.flush();
                throwException = false;
                timeout.flush();

                expect(subscribeCount).toEqual(3);
            });
        });

        it('suspend feed attempts to unsubscribe if already subscribed', function () {
            expect(workingRequest).toBeUndefined();
            timeout.flush();
            expect(workingRequest).toBeDefined();
            service.suspendFeed();
            expect(socket.close).toHaveBeenCalled();
        });

        it('suspend feed does nothing if not subscribed', function () {
            anId = '';
            timeout.flush();
            expect(workingRequest).toBeUndefined();
            expect(subscribeCount).toEqual(0);
            service.suspendFeed();
            expect(socket.close).not.toHaveBeenCalled();
        });

        it('resubscribes if end point set', function() {
            throwException = true;
            timeout.flush();
            expect(workingRequest.url).toEqual('/livefeed/' + theId);

            service.setEndPoint('http://www.something.com');
            throwException = false;
            timeout.flush();
            expect(workingRequest.url).toEqual('http://www.something.com/livefeed/' + theId);
            expect(subscribeCount).toEqual(2);
            expect(socket.close).not.toHaveBeenCalled();
        });
    });

});
