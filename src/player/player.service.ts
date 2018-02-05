import {Injectable} from '@angular/core';
import {Player} from './player.model';
import {MessageBusService} from '../messagebus/message-bus.service';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {from} from 'rxjs/observable/from';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';

@Injectable()
export class PlayerService {
  //  Unless dealing in admin functions use player
  //  In general, these two will be the same unless an admin player
  //  switches to simulation mode - then loggedInPlayer will retain the admin details
  //  while player will switch to the simulated player
  player: Observable<Player>;
  loggedInPlayer: Observable<Player>;

  private playerSubject: BehaviorSubject<Player> = new BehaviorSubject(new Player());
  private loggedInSubject: BehaviorSubject<Player> = new BehaviorSubject(new Player());

  constructor(private http: HttpClient,
              private messageBus: MessageBusService,
              private router: Router) {
    this.player = from<Player>(this.playerSubject);
    this.loggedInPlayer = from<Player>(this.loggedInSubject);
    this.messageBus.playerUpdates.subscribe(player => {
      if (player.id === this.playerSubject.getValue().id) {
        this.playerSubject.next(player);
      }
      if (player.id === this.loggedInSubject.getValue().id) {
        this.loggedInSubject.next(player);
      }
    });
  }

  public loadLoggedInPlayer(): void {
    this.http.get('/api/security')
      .map(json => {
        return new Player(json);
      })
      .subscribe(loaded => {
        this.playerSubject.next(loaded);
        this.loggedInSubject.next(loaded);
      });
  }

  public simulateUser(id: string): void {
    this.http.put('/api/player/admin/' + id, {})
      .subscribe(json => {
        this.playerSubject.next(new Player(json));
      });
  }

  public logout(): void {
    this.http.post('/signout', null).subscribe(() => {
      this.resetPlayer();
    });
  }

  public forceLogout(): void {
    this.resetPlayer();
  }

  private resetPlayer(): void {
    this.loggedInSubject.next(new Player());
    this.playerSubject.next(new Player());
    this.messageBus.playerUpdates.next(new Player());
    this.router.navigateByUrl('/signin');
  }
}
