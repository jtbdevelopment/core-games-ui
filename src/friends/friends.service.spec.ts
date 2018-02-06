import {FriendsService} from './friends.service';
import {TestBed} from '@angular/core/testing';
import {Friend} from './friend.model';
import {Invitable} from './invitable.model';
import {MessageBusService} from '../messagebus/message-bus.service';
import {Player} from '../player/player.model';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';


describe('Service: friends service', () => {
  let friendService: FriendsService;
  let friends: Friend[];
  let invitables: Invitable[];
  let messageBus: MessageBusService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MessageBusService,
        FriendsService
      ]
    });
    httpMock = TestBed.get(HttpTestingController);
    friendService = TestBed.get(FriendsService);
    messageBus = TestBed.get(MessageBusService);
    friendService.friends.subscribe(x => friends = x);
    friendService.invitableFriends.subscribe(x => invitables = x);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('initial state is no friends', () => {
    expect(friends).toEqual([]);
    expect(invitables).toEqual([]);
  });

  it('refresh friends, only invitables', () => {
    friendService.refreshFriends();

    const request = httpMock.expectOne('/api/player/friendsV2');
    expect(request.request.method).toEqual('GET');
    expect(request.request.body).toBeNull();

    const friendsResponse = {
      invitableFriends: [
        {
          id: 'id1',
          name: 'name1'
        },
        {
          id: 'id3',
          name: 'name3'
        },
        {
          id: 'id2',
          name: 'name2'
        },
      ]
    };
    request.flush(friendsResponse);

    expect(friends).toEqual([]);
    expect(invitables.length).toEqual(3);
    expect(JSON.stringify(invitables)).toEqual('[{"id":"id1","displayName":"name1"},{"id":"id3","displayName":"name3"},{"id":"id2","displayName":"name2"}]');
  });

  it('refresh friends, only friends', () => {
    friendService.refreshFriends();
    const request = httpMock.expectOne('/api/player/friendsV2');
    expect(request.request.method).toEqual('GET');
    expect(request.request.body).toBeNull();
    const friendsResponse = {
      maskedFriends: [
        {
          md5: 'x1',
          displayName: 'dname1'
        },
        {
          md5: '1fx',
          displayName: 'dname3'
        }
      ]
    };
    request.flush(friendsResponse);

    expect(invitables).toEqual([]);
    expect(friends.length).toEqual(2);
    expect(JSON.stringify(friends)).toEqual('[{"md5":"x1","displayName":"dname1"},{"md5":"1fx","displayName":"dname3"}]');
  });

  it('refresh friends', () => {
    friendService.refreshFriends();
    const request = httpMock.expectOne('/api/player/friendsV2');
    expect(request.request.method).toEqual('GET');
    expect(request.request.body).toBeNull();
    const friendsResponse = {
      invitableFriends: [
        {
          id: 'id1',
          name: 'name1'
        },
        {
          id: 'id3',
          name: 'name3'
        },
        {
          id: 'id2',
          name: 'name2'
        },
      ],
      maskedFriends: [
        {
          md5: 'x1',
          displayName: 'dname1'
        },
        {
          md5: '1fx',
          displayName: 'dname3'
        }
      ]
    };
    request.flush(friendsResponse);

    expect(friends.length).toEqual(2);
    expect(JSON.stringify(friends)).toEqual('[{"md5":"x1","displayName":"dname1"},{"md5":"1fx","displayName":"dname3"}]');
    expect(invitables.length).toEqual(3);
    expect(JSON.stringify(invitables)).toEqual('[{"id":"id1","displayName":"name1"},{"id":"id3","displayName":"name3"},{"id":"id2","displayName":"name2"}]');
  });

  it('update to player does not clear friends', () => {

    messageBus.playerUpdates.next(new Player({id: 'thisId'}));
    friendService.refreshFriends();
    const request = httpMock.expectOne('/api/player/friendsV2');
    expect(request.request.method).toEqual('GET');
    expect(request.request.body).toBeNull();
    const friendsResponse = {
      invitableFriends: [
        {
          id: 'id1',
          name: 'name1'
        }
      ],
      maskedFriends: [
        {
          md5: 'x1',
          displayName: 'dname1'
        }
      ]
    };
    request.flush(friendsResponse);

    expect(friends.length).toEqual(1);
    expect(invitables.length).toEqual(1);

    messageBus.playerUpdates.next(new Player({id: 'thisId', imageUrl: 'y'}));

    expect(friends.length).toEqual(1);
    expect(invitables.length).toEqual(1);

  });

  it('update to new player does clear friends', () => {
    messageBus.playerUpdates.next(new Player({id: 'thisId', imageUrl: 'x'}));
    friendService.refreshFriends();
    const request = httpMock.expectOne('/api/player/friendsV2');
    expect(request.request.method).toEqual('GET');
    expect(request.request.body).toBeNull();
    const friendsResponse = {
      invitableFriends: [
        {
          id: 'id1',
          name: 'name1'
        }
      ],
      maskedFriends: [
        {
          md5: 'x1',
          displayName: 'dname1'
        }
      ]
    };
    request.flush(friendsResponse);

    expect(friends.length).toEqual(1);
    expect(invitables.length).toEqual(1);

    messageBus.playerUpdates.next(new Player({id: 'newId', imageUrl: 'y'}));

    expect(friends.length).toEqual(0);
    expect(invitables.length).toEqual(0);

  });
});
