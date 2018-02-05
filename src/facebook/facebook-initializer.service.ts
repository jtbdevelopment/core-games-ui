import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

declare let FB: any;

@Injectable()
export class FacebookInitializerService {
  public fbReady: Promise<any>;
  public fbRequiredPermissions: string[];
  public fbAppId: string[];

  private _resolve: (result?: boolean) => void;
  private _reject: (reason?: any) => void;

  constructor(private http: HttpClient) {
    this.fbReady = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });

    http.get('/api/social/apis').subscribe((params: any) => {
      this.fbAppId = params.facebookAppId;
      this.fbRequiredPermissions = params.facebookPermissions.split(',');

      //  TODO - skip this if cordova facebook defined and just resolve
      console.log('initialized fb');
      FB.init({
        appId: this.fbAppId,
        xfbml: false,
        version: 'v2.11'
      });

      this._resolve(true);
    }, error => {
      console.log(error);
      this._reject(error);
    });
  }
}

