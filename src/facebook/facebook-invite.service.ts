import {FacebookInitializerService} from './facebook-initializer.service';
import {Injectable} from '@angular/core';
import {Invitable} from '../friends/invitable.model';

declare let FB: any;

@Injectable()
export class FacebookInviteService {
  constructor(private facebookInitializer: FacebookInitializerService) {
  }

  public inviteFriends(friends: Invitable[], message: String): void {
    this.facebookInitializer.fbReady.then(() => {
      let dialogOptions: any = {
        method: 'apprequests',
        message: message,
        to: friends.map((friend: Invitable) => {
          return friend.id;
        }).join(', ')
      };

      FB.ui(dialogOptions);
    });
  }
}
