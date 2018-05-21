'use strict';

describe('Service: playerService', function () {
    // load the controller's module
    beforeEach(module('coreGamesUi.services'));

    var service, httpBackend, injector, rootScope, location, q;
    var window = {location: jasmine.createSpy('location')};

    var testID = 'MANUAL1';
    var playerResult = {
        id: testID,
        md5: 'b8da6510b173e84f6cd3a2bd697d7612',
        disabled: false,
        displayName: 'Manual Player1'
    };
    var friendResult = {maskedFriends: [{md5: 1, displayName: '2'}, {md5: 5, displayName: '6'}], otherData: ['1,', '2']};

    var facebookDeferred, matchedPlayer;
    beforeEach(module(function ($provide) {
        var facebookService = {
            playerAndFBMatch: function (player) {
                matchedPlayer = player;
                facebookDeferred = q.defer();
                return facebookDeferred.promise;
            }
        };
        $provide.factory('jtbFacebook', function () {
            return facebookService;
        });
        $provide.factory('$window', function () {
            return window;
        });
    }));

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($injector, $rootScope, $location, $httpBackend, $q) {
        rootScope = $rootScope;
        q = $q;
        spyOn(rootScope, '$broadcast').and.callThrough();
        httpBackend = $httpBackend;
        injector = $injector;
    }));

    describe('with player responses', function () {
        beforeEach(function () {
            httpBackend.expectGET('/api/security').respond(playerResult);
            service = injector.get('jtbPlayerService');
            rootScope.$broadcast('login');
            rootScope.$apply();
        });

        it('initializes', function () {
            expect(service.currentID()).toEqual('');
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.realPID()).toEqual('');
            expect(service.currentPlayer()).toBeUndefined();
            httpBackend.flush();
            expect(service.currentID()).toEqual(testID);
            expect(service.realPID()).toEqual(testID);
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.currentPlayer()).toEqual(playerResult);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('playerLoaded');
        });

        it('processes player Updates for same id', function () {
            var updatedPlayer = {
                id: testID,
                md5: 'b8da6510b173e84f6cd3a2bd697d7612',
                disabled: true,
                displayName: 'Manual Player1 Updated'
            };
            expect(service.currentID()).toEqual('');
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.realPID()).toEqual('');
            expect(service.currentPlayer()).toBeUndefined();
            httpBackend.flush();
            expect(service.currentID()).toEqual(testID);
            expect(service.realPID()).toEqual(testID);
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.currentPlayer()).toEqual(playerResult);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('playerLoaded');
            rootScope.$broadcast('playerUpdate', updatedPlayer.id, updatedPlayer);
            rootScope.$apply();
            expect(service.currentPlayer()).toEqual(updatedPlayer);
        });

        it('ignores player Updates for diff id', function () {
            var updatedPlayer = {
                id: testID + 'X',
                md5: 'b8da6510b173e84f6cd3a2bd697d7612',
                disabled: true,
                displayName: 'Manual Player1 Updated'
            };
            expect(service.currentID()).toEqual('');
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.realPID()).toEqual('');
            expect(service.currentPlayer()).toBeUndefined();
            httpBackend.flush();
            expect(service.currentID()).toEqual(testID);
            expect(service.realPID()).toEqual(testID);
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.currentPlayer()).toEqual(playerResult);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('playerLoaded');
            rootScope.$broadcast('playerUpdate', updatedPlayer.id, updatedPlayer);
            rootScope.$apply();
            expect(service.currentPlayer()).toEqual(playerResult);
        });

        it('reloads on switch', function () {
            expect(service.currentID()).toEqual('');
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.realPID()).toEqual('');
            expect(service.currentPlayer()).toBeUndefined();
            httpBackend.flush();
            expect(service.currentID()).toEqual(testID);
            expect(service.realPID()).toEqual(testID);
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.currentPlayer()).toEqual(playerResult);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('playerLoaded');

            var newPlayer = angular.copy(playerResult);

            newPlayer.id = 'NEW';
            httpBackend.expectPUT('/api/player/admin/NEW').respond(newPlayer);
            service.overridePID(newPlayer.id);
            expect(service.currentPlayer()).toEqual(playerResult);
            expect(service.currentID()).toEqual(testID);
            httpBackend.flush();
            expect(service.currentID()).toEqual(newPlayer.id);
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.currentPlayer()).toEqual(newPlayer);
        });

        it('sets current friends with http', function () {
            httpBackend.flush();

            httpBackend.expectGET('/api/player/friendsV2').respond(friendResult);
            var friends = null;
            service.currentPlayerFriends().then(function (data) {
                friends = data;
            }, function (error) {
                friends = error;
            });
            httpBackend.flush();

            expect(friends).toEqual(friendResult);
        });

        it('sets current friends with error', function () {
            httpBackend.flush();

            httpBackend.expectGET('/api/player/friendsV2').respond(500, {err: 'error'});
            var friends;
            var errorCalled = false;
            service.currentPlayerFriends().then(function (data) {
                friends = data;
            }, function (error) {
                expect(error).toBeDefined();
                errorCalled = true;
            });
            httpBackend.flush();

            expect(errorCalled).toEqual(true);
            //noinspection JSUnusedAssignment
            expect(friends).toBeUndefined();
        });

        it('can update version notes', function () {
            var v = '1.2';
            httpBackend.expectPOST('/api/player/lastVersionNotes/' + v).respond(200);
            service.updateLastVersionNotes(v);
            httpBackend.flush();
        });

        it('multiple calls only one http friends', function () {
            httpBackend.flush();

            httpBackend.expectGET('/api/player/friendsV2').respond(friendResult);
            expect(service.currentID()).toEqual(testID);
            var friends = null;
            service.currentPlayerFriends().then(function (data) {
                friends = data;
            }, function (error) {
                friends = error;
            });
            httpBackend.flush();

            expect(friends).toEqual(friendResult);

            service.currentPlayerFriends().then(function (data) {
                friends = data;
            }, function (error) {
                friends = error;
            });

            expect(friends).toEqual(friendResult);
        });

        it('initializes friends for non-fb player', function () {
            httpBackend.flush();

            httpBackend.expectGET('/api/player/friendsV2').respond({
                maskedFriends: [
                  {md5: 'md51', displayName: 'Friend 1'},
                  {md5: 'md52', displayName: 'Friend 52'}
                ]
            });
            var controller = {};
            var promiseResolved = false;
            service.initializeFriendsForController(controller).then(function () {
                promiseResolved = true
            });
            expect(controller.chosenFriends).toEqual([]);
            expect(controller.friends).toEqual([]);
            httpBackend.flush();
            expect(controller.friends).toEqual([
                {md5: 'md51', displayName: 'Friend 1'},
                {md5: 'md52', displayName: 'Friend 52'}
            ]);
            expect(controller.chosenFriends).toEqual([]);
            expect(promiseResolved).toEqual(true);
        });

        it('logout function success', function () {
            httpBackend.expectPOST('/signout').respond({});
            service.signOutAndRedirect();
            httpBackend.flush();
            expect(window.location).toEqual('#/signin');
        });

        it('logout function fail', function () {
            httpBackend.expectPOST('/signout').respond(404, {});
            service.signOutAndRedirect();
            httpBackend.flush();
            expect(window.location).toEqual('#/signin');
        });

    });

    describe('with bad responses', function () {
        beforeEach(function () {
            httpBackend.expectGET('/api/security').respond(500, {something: 'somethin'});
            service = injector.get('jtbPlayerService');
            rootScope.$broadcast('login');
            rootScope.$apply();
        });
    });

    describe('with facebook player', function () {
        var fbPlayerResult = {
            id: testID,
            md5: 'b8da6510b173e84f6cd3a2bd697d7612',
            disabled: false,
            displayName: 'Manual Player1',
            source: 'facebook'
        };
        beforeEach(function () {
            httpBackend.expectGET('/api/security').respond(fbPlayerResult);
            matchedPlayer = {};
            service = injector.get('jtbPlayerService');
            rootScope.$broadcast('login');
            rootScope.$apply();
        });

        it('initializes and can autologin', function () {
            expect(service.currentID()).toEqual('');
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.realPID()).toEqual('');
            expect(service.currentPlayer()).toBeUndefined();
            httpBackend.flush();
            facebookDeferred.resolve(true);
            rootScope.$apply();
            expect(service.currentID()).toEqual(testID);
            expect(service.realPID()).toEqual(testID);
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.currentPlayer()).toEqual(fbPlayerResult);
            expect(rootScope.$broadcast).toHaveBeenCalledWith('playerLoaded');
            expect(matchedPlayer).toEqual(fbPlayerResult);
        });

        it('initializes and cannot autologin', function () {
            expect(service.currentID()).toEqual('');
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.realPID()).toEqual('');
            expect(service.currentPlayer()).toBeUndefined();
            httpBackend.flush();
            facebookDeferred.resolve(false);
            httpBackend.expectPOST('/signout').respond({});
            rootScope.$apply();
            httpBackend.flush();
            expect(service.currentID()).toEqual(testID);
            expect(service.realPID()).toEqual(testID);
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.currentPlayer()).toEqual(fbPlayerResult);
            expect(rootScope.$broadcast).not.toHaveBeenCalledWith('playerLoaded');
            expect(matchedPlayer).toEqual(fbPlayerResult);
            expect(window.location).toEqual('#/signin');
        });

        it('initializes and cannot autologin with fb error', function () {
            expect(service.currentID()).toEqual('');
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.realPID()).toEqual('');
            expect(service.currentPlayer()).toBeUndefined();
            httpBackend.flush();
            facebookDeferred.reject();
            httpBackend.expectPOST('/signout').respond({});
            rootScope.$apply();
            httpBackend.flush();
            expect(service.currentID()).toEqual(testID);
            expect(service.realPID()).toEqual(testID);
            expect(service.currentPlayerBaseURL()).toEqual('/api/player');
            expect(service.currentPlayer()).toEqual(fbPlayerResult);
            expect(rootScope.$broadcast).not.toHaveBeenCalledWith('playerLoaded');
            expect(rootScope.$broadcast).not.toHaveBeenCalledWith('playerLoaded');
            expect(matchedPlayer).toEqual(fbPlayerResult);
            expect(window.location).toEqual('#/signin');
        });

        it('initializes friends for fb player', function () {
            httpBackend.expectGET('/api/player/friendsV2').respond({
                maskedFriends: [
                    {md5:'md51', displayName: 'Friend 1'},
                    {md5: 'md52', displayName: 'Friend 52'}
                ]
            });
            var controller = {};
            service.initializeFriendsForController(controller);
            expect(controller.chosenFriends).toEqual([]);
            expect(controller.friends).toEqual([]);
            httpBackend.flush();

            expect(controller.friends).toEqual([
                {md5: 'md51', displayName: 'Friend 1'},
                {md5: 'md52', displayName: 'Friend 52'}
            ]);
            expect(controller.chosenFriends).toEqual([]);
        });

    });
});

