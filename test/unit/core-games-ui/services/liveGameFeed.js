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
        spyOn(rootScope, '$broadcast').and.callThrough();
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
            expect(workingRequest.transport).toEqual('websocket');
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

        it('resubscribes if end point set', function () {
            throwException = true;
            timeout.flush();
            expect(workingRequest.url).toEqual('/livefeed/' + theId);
            expect(workingRequest.transport).toEqual('websocket');

            service.setEndPoint('http://www.something.com');
            throwException = false;
            timeout.flush();
            expect(workingRequest.url).toEqual('http://www.something.com/livefeed/' + theId);
            expect(workingRequest.transport).toEqual('websocket');
            expect(subscribeCount).toEqual(2);
            expect(socket.close).not.toHaveBeenCalled();
        });

        it('resubscribes with long-polling it dev endpoint setset', function () {
            throwException = true;
            timeout.flush();
            expect(workingRequest.url).toEqual('/livefeed/' + theId);

            service.setEndPoint('http://localhost:9998');
            throwException = false;
            timeout.flush();
            expect(workingRequest.url).toEqual('http://localhost:9998/livefeed/' + theId);
            expect(workingRequest.transport).toEqual('long-polling');
            expect(subscribeCount).toEqual(2);
            expect(socket.close).not.toHaveBeenCalled();
        });

        describe('test request handlers after initialized', function () {
            beforeEach(function () {
                timeout.flush();
            });


            it('on close currently does nothing, but log', function () {
                workingRequest.onClose({x: 'y'});
                timeout.flush();
            });

            it('on error currently does nothing, but log', function () {
                workingRequest.onError({x: 'y'});
                timeout.flush();
            });

            it('on open broadcasts link established', function () {
                expect(rootScope.$broadcast).not.toHaveBeenCalledWith('liveFeedEstablished');
                workingRequest.onOpen({transport: 'magic'});
                timeout.flush();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('liveFeedEstablished');
            });

            it('broadcasts game on game update', function () {
                var game = {id: 'some id', data: {}, more: []};
                workingRequest.onMessage({messages: [JSON.stringify({messageType: 'Game', game: game})]});
                timeout.flush();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdate', game.id, game);
            });

            it('broadcasts player on player update', function () {
                var player = {id: 'some id', data: {}, more: []};
                workingRequest.onMessage({messages: [JSON.stringify({messageType: 'Player', player: player})]});
                timeout.flush();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('playerUpdate', player.id, player);
            });

            it('just logs on heartbeat', function () {
                var data = {id: 'some id', data: {}, more: []};
                workingRequest.onMessage({messages: [JSON.stringify({messageType: 'Heartbeat', data: data})]});
                rootScope.$broadcast.calls.reset();
                timeout.flush();
                expect(rootScope.$broadcast).not.toHaveBeenCalled();
            });

            it('handles multi messages', function () {
                var game = {id: 'some id', data: {}, more: []};
                var player = {id: 'some id', data: {}, more: []};
                var data = {id: 'some id', data: {}, more: []};
                workingRequest.onMessage({messages: [
                    JSON.stringify({messageType: 'Game', game: game}),
                    JSON.stringify({messageType: 'Player', player: player}),
                    JSON.stringify({messageType: 'Heartbeat', data: data})
                ]});
                timeout.flush();
                expect(rootScope.$broadcast).toHaveBeenCalledWith('gameUpdate', game.id, game);
                expect(rootScope.$broadcast).toHaveBeenCalledWith('playerUpdate', player.id, player);
            });

            it('just logs on unknown message', function () {
                var data = {id: 'some id', data: {}, more: []};
                workingRequest.onMessage({messages: [JSON.stringify({messageType: 'Somethin', data: data})]});
                rootScope.$broadcast.calls.reset();
                timeout.flush();
                expect(rootScope.$broadcast).not.toHaveBeenCalled();
            });

            it('just logs on undefined message', function () {
                var data = {id: 'some id', data: {}, more: []};
                workingRequest.onMessage({messages: [JSON.stringify({data: data})]});
                rootScope.$broadcast.calls.reset();
                timeout.flush();
                expect(rootScope.$broadcast).not.toHaveBeenCalled();
            });

            it('just logs on unparseable message', function () {
                workingRequest.onMessage({messages: ['blah']});
                rootScope.$broadcast.calls.reset();
                timeout.flush();
                expect(rootScope.$broadcast).not.toHaveBeenCalled();
            });

            it('just logs on undefined messages', function () {
                workingRequest.onMessage({});
                rootScope.$broadcast.calls.reset();
                timeout.flush();
                expect(rootScope.$broadcast).not.toHaveBeenCalled();
            });
        });
    });

});
