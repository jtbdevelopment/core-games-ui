import {Injectable} from '@angular/core';
import {FacebookInitializerService} from './facebook-initializer.service';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {from} from 'rxjs/observable/from';

declare let FB: any;

//  TODO - cordova support
@Injectable()
export class FacebookLoginService {
  public currentAuthorization: Observable<any>;
  public canAutoLogin: Observable<boolean>;

  private currentAuthorizationSubject: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private canAutoLoginSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private fbInitializer: FacebookInitializerService) {
    this.canAutoLogin = from(this.canAutoLoginSubject);
    this.currentAuthorization = from(this.currentAuthorizationSubject);
    this.fbInitializer.fbReady.then(this.checkLoginStatus.bind(this));
  }

  public initiateLogin(): void {
    this.fbInitializer.fbReady.then(() => {
      const fbPermissionString = this.fbInitializer.fbRequiredPermissions.join(',');
      FB.login(this.checkLoginStatus.bind(this), {scope: fbPermissionString});
    });
  }

  private checkLoginStatus(): void {
    FB.getLoginStatus((response: any) => {
      if ('connected' === response.status) {
        this.currentAuthorizationSubject.next(response.authResponse);
        this.verifyPermissions();
      }
    });
  }

  private verifyPermissions(): void {
    FB.api('/me/permissions', (response: any) => {
      const found: Map<string, boolean> = new Map<string, boolean>();
      this.fbInitializer.fbRequiredPermissions.forEach((permission) => {
        found.set(permission, false);
      });
      if (response.data !== undefined && response.data !== null) {
        response.data.forEach((fbPermission: any) => {
          if (fbPermission.status === 'granted' || fbPermission.status === 'declined') {
            //  grant true on declined - they at least saw the dialog box
            if (found.has(fbPermission.permission)) {
              found.set(fbPermission.permission, true);
            }
          }
        });
      }

      let allFound = true;
      found.forEach((value, key) => {
        allFound = allFound && value;
        if (!value) {
          console.log('Missing perrmission ' + key);
        }
      });
      this.canAutoLoginSubject.next(allFound);
    });
  }
}
