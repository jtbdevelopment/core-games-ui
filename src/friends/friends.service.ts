import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Friend} from './friend.model';
import {Invitable} from './invitable.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {MessageBusService} from '../messagebus/message-bus.service';
import {Player} from '../player/player.model';
import {HttpClient} from '@angular/common/http';
import {from} from 'rxjs/observable/from';
import 'rxjs/add/operator/map';

//  TODO - if we ever support multiple social networks - this might be where
//  to move overall invite functionality
@Injectable()
export class FriendsService {
    friends: Observable<Friend[]>;
    invitableFriends: Observable<Invitable[]>;

    private player: Player;
    private friendsSubject: BehaviorSubject<Friend[]> = new BehaviorSubject([]);
    private invitableFriendsSubject: BehaviorSubject<Invitable[]> = new BehaviorSubject([]);

    constructor(private http: HttpClient, private messageBus: MessageBusService) {
      this.friends = from<Friend[]>(this.friendsSubject);
      this.invitableFriends = from<Invitable[]>(this.invitableFriendsSubject);
        this.messageBus.playerUpdates.subscribe(p => {
            if (this.player === undefined || this.player.id !== p.id) {
                this.friendsSubject.next([]);
                this.invitableFriendsSubject.next([]);
                this.player = p;
            }
        });
    }

    public refreshFriends(): void {
        this.http.get<any>('/api/player/friendsV2')
            .map(obj => {
                let container = new Map<string, Object[]>();
                let newFriends = [];
                let newInvitable = [];
                let invitableFriendsRaw = obj.invitableFriends;
                if (invitableFriendsRaw !== undefined) {
                    invitableFriendsRaw.forEach(friendObject => {
                        newInvitable.push(new Invitable(friendObject.id, friendObject.name));
                    });
                }
                let maskedFriendsRaw = obj.maskedFriends;
                if (maskedFriendsRaw !== undefined) {
                    maskedFriendsRaw.forEach(friendObject => {
                        newFriends.push(new Friend(friendObject.md5, friendObject.displayName));
                    });
                }

                container.set('friends', newFriends);
                container.set('invitables', newInvitable);
                return container;
            })
            .subscribe(container => {
                this.friendsSubject.next(container.get('friends') as Friend[]);
                this.invitableFriendsSubject.next(container.get('invitables') as Invitable[]);
            });
    }
}
