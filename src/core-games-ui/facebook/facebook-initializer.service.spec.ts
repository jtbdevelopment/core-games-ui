import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {FacebookInitializerService} from './facebook-initializer.service';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';

declare let window: any;

describe('Service: facebook initalizer', () => {
    let httpMock: HttpTestingController;
    let fbInit: FacebookInitializerService;

    let ready: boolean;
    let reject: boolean;

    beforeEach(() => {
        window.FB = {};
        ready = false;
        reject = false;
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [FacebookInitializerService]
        });

        httpMock = TestBed.get(HttpTestingController);
        fbInit = TestBed.get(FacebookInitializerService);
        fbInit.fbReady.then(() => {
            ready = true;
        }, () => {
            reject = true;
        });
    });

    it('initializes from server and inits FB', fakeAsync(() => {
        let request = httpMock.expectOne('/api/social/apis');
        window.FB.init = jasmine.createSpy('init');
        expect(request.request.method).toEqual('GET');
        request.flush({
            facebookAppId: 'someappid',
            facebookPermissions: '1,perm2,another'
        });
        expect(window.FB.init).toHaveBeenCalledWith({
            appId: 'someappid',
            xfbml: false,
            version: 'v2.11'
        });
        tick();
        expect(reject).toBeFalsy();
        expect(ready).toBeTruthy();
        expect(fbInit.fbRequiredPermissions).toEqual(['1', 'perm2', 'another']);
        expect(fbInit.fbAppId).toEqual('someappid');
    }));

    it('initializes from server and fails on server', fakeAsync(() => {
        let request = httpMock.expectOne('/api/social/apis');
        window.FB.init = jasmine.createSpy('init');
        expect(request.request.method).toEqual('GET');
        request.flush('something is not right', {
            status: 402,
            statusText: 'x'
        });
        expect(window.FB.init).not.toHaveBeenCalled();
        tick();
        expect(reject).toBeTruthy();
        expect(ready).toBeFalsy();
    }));
});
