import {FacebookLoginService} from './facebook-login.service';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {FacebookInitializerService} from './facebook-initializer.service';

declare let window: any;

class MockInitService {
  public fbReady: Promise<any>;
  public fbRequiredPermissions: string[];

  public resolve: (result?: boolean) => void;
  public reject: (reason?: any) => void;

  constructor() {
    this.fbReady = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

}

describe('Service: facebook login service', () => {
  let loginService: FacebookLoginService;
  let mockInit: MockInitService;

  let canAutoLogin: boolean;
  let currentAuth: any;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: FacebookInitializerService, useClass: MockInitService},
        FacebookLoginService
      ]
    });
    mockInit = TestBed.get(FacebookInitializerService) as MockInitService;
    loginService = TestBed.get(FacebookLoginService);
    loginService.canAutoLogin.subscribe((can) => {
      canAutoLogin = can;
    });
    loginService.currentAuthorization.subscribe((ca) => {
      currentAuth = ca;
    });
    window.FB = {};
  });

  it('initializes before init ready', () => {
    expect(canAutoLogin).toBeFalsy();
    expect(currentAuth).toEqual({});
  });

  describe('after init is ready', () => {
    it('not connected', fakeAsync(() => {
      let called = false;
      window.FB.getLoginStatus = (callback: (response: any) => void) => {
        called = true;
        callback({status: 'not connected'});
      };
      mockInit.resolve(true);
      tick();
      expect(called).toBeTruthy();
      expect(canAutoLogin).toBeFalsy();
      expect(currentAuth).toEqual({});
    }));

    it('connected, missing perms', fakeAsync(() => {
      mockInit.fbRequiredPermissions = ['perm1', 'perm2', 'perm3'];
      let called = false;
      window.FB.getLoginStatus = (callback: (response: any) => void) => {
        callback({status: 'connected', authResponse: {code: 'x'}});
      };
      window.FB.api = (api: string, callback: (response: any) => void) => {
        called = true;
        expect(api).toEqual('/me/permissions');
        callback({
            data: [
              {permission: 'perm2', status: 'granted'},
              {permission: 'perm3', status: 'declined'},
              {permission: 'other', status: 'granted'}]
          }
        );
      };
      mockInit.resolve(true);
      tick();
      expect(called).toBeTruthy();
      expect(canAutoLogin).toBeFalsy();
      expect(currentAuth).toEqual({code: 'x'});
    }));

    it('connected, have perms', fakeAsync(() => {
      mockInit.fbRequiredPermissions = ['perm1', 'perm2', 'perm3'];
      let called = false;
      window.FB.getLoginStatus = (callback: (response: any) => void) => {
        callback({status: 'connected', authResponse: {x: 1, y: '32'}});
      };
      window.FB.api = (api: string, callback: (response: any) => void) => {
        called = true;
        expect(api).toEqual('/me/permissions');
        callback({
            data: [
              {permission: 'perm1', status: 'granted'},
              {permission: 'perm2', status: 'granted'},
              {permission: 'perm3', status: 'declined'},
              {permission: 'other', status: 'granted'}]
          }
        );
      };
      mockInit.resolve(true);
      tick();
      expect(called).toBeTruthy();
      expect(canAutoLogin).toBeTruthy();
      expect(currentAuth).toEqual({x: 1, y: '32'});
    }));
  });

  it('manually initiating login before init does nothing', () => {
    mockInit.fbRequiredPermissions = ['perm1', 'perm3'];
    window.FB.login = jest.fn();
    loginService.initiateLogin();
    expect(window.FB.login.mock.calls.length).toEqual(0);
  });

  it('manually initiating login after init', fakeAsync(() => {
    mockInit.fbRequiredPermissions = ['perm1', 'perm3'];

    //  initially not connected
    window.FB.getLoginStatus = (callback: (response: any) => void) => {
      callback({status: 'not connected'});
    };
    mockInit.resolve(true);
    tick();


    window.FB.login = (callback: () => void, data: any) => {
      expect(data).toEqual({scope: 'perm1,perm3'});
      callback();
    };

    let called = false;
    window.FB.getLoginStatus = (callback: (response: any) => void) => {
      callback({status: 'connected', authResponse: {x: 2, y: '32'}});
    };
    window.FB.api = (api: string, callback: (response: any) => void) => {
      called = true;
      expect(api).toEqual('/me/permissions');
      callback({
          data: [
            {permission: 'perm1', status: 'granted'},
            {permission: 'perm3', status: 'declined'},
            {permission: 'other', status: 'granted'}]
        }
      );
    };

    loginService.initiateLogin();
    tick();

    expect(called).toBeTruthy();
    expect(canAutoLogin).toBeTruthy();
    expect(currentAuth).toEqual({x: 2, y: '32'});
  }));
});
