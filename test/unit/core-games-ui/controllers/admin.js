'use strict';

describe('Controller: CoreAdminCtrl', function () {

    // load the controller's module
    beforeEach(module('coreGamesUi.controllers'));

    var CoreAdminCtrl, jtbPlayerService, $http, $scope, $rootScope;
    var overridePID, realPID;
    var playerCount = 10 + '';
    var gameCount = 100 + '';
    var gamesLast24 = 11 + '';
    var gamesLast7 = 24 + '';
    var gamesLast30 = 101 + '';
    var playerCreatedLast24 = 17 + '';
    var playerCreatedLast7 = 21 + '';
    var playerCreatedLast30 = 33 + '';
    var playerLastLogin24 = 111 + '';
    var playerLastLogin7 = 22 + '';
    var playerLastLogin30 = 55 + '';
    var expectedResults = {
        totalElements: 10,
        totalPages: 5,
        number: 3,
        content: [
            {
                id: '1',
                displayName: 'dn1'
            },
            {
                id: '2',
                displayName: 'dn2'
            },
            {
                id: '3',
                displayName: 'dn2'
            }
        ]
    };

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, _$rootScope_, $httpBackend) {
        $http = $httpBackend;
        realPID = 'REAL';
        overridePID = realPID;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();

        jtbPlayerService = {
            realPID: function () {
                return realPID;
            },
            currentID: function () {
                return overridePID;
            },
            overridePID: function (pid) {
                overridePID = pid;
            }
        };
        CoreAdminCtrl = $controller('CoreAdminCtrl', {
            jtbPlayerService: jtbPlayerService,
            $scope: $scope
        });
    }));

    beforeEach(function () {
        var time = Math.floor((new Date()).getTime() / 1000);
        var dayInSeconds = 86400;
        var base;
        var time24, time7, time30;

        $http.expectGET('/api/player/admin/playerCount').respond(playerCount);
        $http.expectGET('/api/player/admin/gameCount').respond(gameCount);

        base = '\/api\/player\/admin\/playersCreated\/';
        time24 = new RegExp(base + (time - (dayInSeconds) + '').slice(0, -1) + '[0-9]');
        time7 = new RegExp(base + (time - (dayInSeconds * 7) + '').slice(0, -1) + '[0-9]');
        time30 = new RegExp(base + (time - (dayInSeconds * 30) + '').slice(0, -1) + '[0-9]');
        $http.expectGET(time24).respond(playerCreatedLast24);
        $http.expectGET(time7).respond(playerCreatedLast7);
        $http.expectGET(time30).respond(playerCreatedLast30);

        base = '\/api\/player\/admin\/playersLoggedIn\/';
        time24 = new RegExp(base + (time - (dayInSeconds) + '').slice(0, -1) + '[0-9]');
        time7 = new RegExp(base + (time - (dayInSeconds * 7) + '').slice(0, -1) + '[0-9]');
        time30 = new RegExp(base + (time - (dayInSeconds * 30) + '').slice(0, -1) + '[0-9]');
        $http.expectGET(time24).respond(playerLastLogin24);
        $http.expectGET(time7).respond(playerLastLogin7);
        $http.expectGET(time30).respond(playerLastLogin30);

        base = '\/api\/player\/admin\/gamesSince\/';
        time24 = new RegExp(base + (time - (dayInSeconds) + '').slice(0, -1) + '[0-9]');
        time7 = new RegExp(base + (time - (dayInSeconds * 7) + '').slice(0, -1) + '[0-9]');
        time30 = new RegExp(base + (time - (dayInSeconds * 30) + '').slice(0, -1) + '[0-9]');
        $http.expectGET(time24).respond(gamesLast24);
        $http.expectGET(time7).respond(gamesLast7);
        $http.expectGET(time30).respond(gamesLast30);

        $http.expectGET('/api/player/admin/playersLike/?pageSize=20&page=0&like=').respond(expectedResults);
    });

    it('initializes users', function () {
        expect(CoreAdminCtrl.revertEnabled).toEqual(false);
        expect(CoreAdminCtrl.revertText).toEqual('You are yourself.');

        expect(CoreAdminCtrl.numberOfPages).toEqual(0);
        expect(CoreAdminCtrl.currentPage).toEqual(1);
        expect(CoreAdminCtrl.players).toEqual([]);
        expect(CoreAdminCtrl.searchText).toEqual('');
        expect(CoreAdminCtrl.pageSize).toEqual(20);
        expect(overridePID).toEqual(realPID);

        $http.flush();

        expect(CoreAdminCtrl.totalItems).toEqual(expectedResults.totalElements);
        expect(CoreAdminCtrl.numberOfPages).toEqual(expectedResults.totalPages);
        expect(CoreAdminCtrl.currentPage).toEqual(expectedResults.number + 1);
        expect(CoreAdminCtrl.players).toEqual(expectedResults.content);
        expect(CoreAdminCtrl.searchText).toEqual('');
        expect(CoreAdminCtrl.pageSize).toEqual(20);
    });

    it('changes pages', function () {
        $http.flush();

        expect(CoreAdminCtrl.totalItems).toEqual(expectedResults.totalElements);
        expect(CoreAdminCtrl.numberOfPages).toEqual(expectedResults.totalPages);
        expect(CoreAdminCtrl.currentPage).toEqual(expectedResults.number + 1);
        expect(CoreAdminCtrl.players).toEqual(expectedResults.content);
        expect(CoreAdminCtrl.searchText).toEqual('');
        expect(CoreAdminCtrl.pageSize).toEqual(20);

        CoreAdminCtrl.searchText = 'aaa';
        CoreAdminCtrl.currentPage = 7;
        $http.expectGET('/api/player/admin/playersLike/?pageSize=20&page=6&like=aaa').respond({
            totalElements: 0,
            totalPages: 0,
            number: 0,
            content: []
        });

        CoreAdminCtrl.changePage();
        $http.flush();

        expect(CoreAdminCtrl.totalItems).toEqual(0);
        expect(CoreAdminCtrl.numberOfPages).toEqual(0);
        expect(CoreAdminCtrl.currentPage).toEqual(1);
        expect(CoreAdminCtrl.players).toEqual([]);
        expect(CoreAdminCtrl.searchText).toEqual('aaa');
        expect(CoreAdminCtrl.pageSize).toEqual(20);

    });

    it('refresh data', function () {
        $http.flush();

        expect(CoreAdminCtrl.totalItems).toEqual(expectedResults.totalElements);
        expect(CoreAdminCtrl.numberOfPages).toEqual(expectedResults.totalPages);
        expect(CoreAdminCtrl.currentPage).toEqual(expectedResults.number + 1);
        expect(CoreAdminCtrl.players).toEqual(expectedResults.content);
        expect(CoreAdminCtrl.searchText).toEqual('');
        expect(CoreAdminCtrl.pageSize).toEqual(20);

        CoreAdminCtrl.searchText = 'a3';
        CoreAdminCtrl.currentPage = 7;
        var refreshedResults = {
            totalElements: 1,
            totalPages: 1,
            number: 0,
            content: [{id: 'a3', displayName: 'a3'}]
        };
        $http.expectGET('/api/player/admin/playersLike/?pageSize=20&page=0&like=a3').respond(refreshedResults);

        CoreAdminCtrl.refreshData();
        $http.flush();

        expect(CoreAdminCtrl.totalItems).toEqual(1);
        expect(CoreAdminCtrl.numberOfPages).toEqual(1);
        expect(CoreAdminCtrl.currentPage).toEqual(1);
        expect(CoreAdminCtrl.players).toEqual(refreshedResults.content);
        expect(CoreAdminCtrl.searchText).toEqual('a3');
        expect(CoreAdminCtrl.pageSize).toEqual(20);
    });

    it('initializes stats', function () {
        expect(CoreAdminCtrl.playerCount).toEqual(0);
        expect(CoreAdminCtrl.gameCount).toEqual(0);
        expect(CoreAdminCtrl.playersCreated24hours).toEqual(0);
        expect(CoreAdminCtrl.playersCreated7days).toEqual(0);
        expect(CoreAdminCtrl.playersCreated30days).toEqual(0);
        expect(CoreAdminCtrl.playersLastLogin24hours).toEqual(0);
        expect(CoreAdminCtrl.playersLastLogin7days).toEqual(0);
        expect(CoreAdminCtrl.playersLastLogin30days).toEqual(0);
        expect(CoreAdminCtrl.gamesLast7days).toEqual(0);
        expect(CoreAdminCtrl.gamesLast24hours).toEqual(0);
        expect(CoreAdminCtrl.gamesLast30days).toEqual(0);

        $http.flush();
        expect(CoreAdminCtrl.playerCount).toEqual(playerCount);
        expect(CoreAdminCtrl.gameCount).toEqual(gameCount);
        expect(CoreAdminCtrl.gamesLast24hours).toEqual(gamesLast24);
        expect(CoreAdminCtrl.gamesLast7days).toEqual(gamesLast7);
        expect(CoreAdminCtrl.gamesLast30days).toEqual(gamesLast30);
        expect(CoreAdminCtrl.playersCreated24hours).toEqual(playerCreatedLast24);
        expect(CoreAdminCtrl.playersCreated7days).toEqual(playerCreatedLast7);
        expect(CoreAdminCtrl.playersCreated30days).toEqual(playerCreatedLast30);
        expect(CoreAdminCtrl.playersLastLogin24hours).toEqual(playerLastLogin24);
        expect(CoreAdminCtrl.playersLastLogin7days).toEqual(playerLastLogin7);
        expect(CoreAdminCtrl.playersLastLogin30days).toEqual(playerLastLogin30);
    });

    it('changes to user', function () {
        expect(CoreAdminCtrl.revertEnabled).toEqual(false);
        expect(CoreAdminCtrl.revertText).toEqual('You are yourself.');

        CoreAdminCtrl.switchToPlayer('33');
        expect(overridePID).toEqual('33');

        expect(CoreAdminCtrl.revertEnabled).toEqual(false);
        expect(CoreAdminCtrl.revertText).toEqual('You are yourself.');
        $rootScope.$broadcast('playerLoaded');
        $rootScope.$apply();

        expect(CoreAdminCtrl.revertEnabled).toEqual(true);
        expect(CoreAdminCtrl.revertText).toEqual('You are simulating another player.');
    });

    it('changes to user can revert back', function () {
        CoreAdminCtrl.switchToPlayer('33');
        $rootScope.$broadcast('playerLoaded');
        $rootScope.$apply();

        expect(CoreAdminCtrl.revertEnabled).toEqual(true);
        expect(CoreAdminCtrl.revertText).toEqual('You are simulating another player.');

        CoreAdminCtrl.revertToNormal();
        expect(CoreAdminCtrl.revertEnabled).toEqual(true);
        expect(CoreAdminCtrl.revertText).toEqual('You are simulating another player.');

        $rootScope.$broadcast('playerLoaded');
        $rootScope.$apply();

        expect(CoreAdminCtrl.revertEnabled).toEqual(false);
        expect(CoreAdminCtrl.revertText).toEqual('You are yourself.');
    });
});

