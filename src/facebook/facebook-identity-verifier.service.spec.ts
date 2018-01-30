import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {FacebookInitializerService} from './facebook-initializer.service';
import {FacebookIdentifyVerifierService} from './facebook-identity-verifier.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Player} from '../player/player.model';
import {Observable} from 'rxjs/Observable';
import {PlayerService} from '../player/player.service';

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

class MockPlayerService {
    public subject: BehaviorSubject<Player> = new BehaviorSubject<Player>(new Player());
    public loggedInPlayer: Observable<Player> = Observable.from(this.subject);

    public logout: any = jest.fn();
}

describe('Service: facebook identity verifier service', () => {
    let verifierService: FacebookIdentifyVerifierService;
    let mockInit: MockInitService;
    let playerService: MockPlayerService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {provide: FacebookInitializerService, useClass: MockInitService},
                {provide: PlayerService, useClass: MockPlayerService},
                FacebookIdentifyVerifierService
            ]
        });
        mockInit = TestBed.get(FacebookInitializerService) as MockInitService;
        playerService = TestBed.get(PlayerService) as MockPlayerService;
        verifierService = TestBed.get(FacebookIdentifyVerifierService);
        window.FB = {};
    });

    it('not facebook player does not check', fakeAsync(() => {
        mockInit.resolve(true);
        let p = new Player({sourceId: 'x', source: 'manual'});
        playerService.subject.next(p);
        tick();
        expect(playerService.logout).not.toHaveBeenCalled();
    }));

    it('everything matches does not logout', fakeAsync(() => {
        mockInit.resolve(true);
        window.FB.getLoginStatus = (callback: (response: any) => void) => {
            callback({status: 'connected', authResponse: {userID: 'x'}});
        };
        let p = new Player({sourceId: 'x', source: 'facebook'});
        playerService.subject.next(p);
        tick();
        expect(playerService.logout).not.toHaveBeenCalled();
    }));

    describe('failures to verify performs logout', () => {
        beforeEach(() => {
            mockInit.resolve(true);
        });

        afterEach(fakeAsync(() => {
            let p = new Player({sourceId: 'x', source: 'facebook'});
            playerService.subject.next(p);
            tick();
            expect(playerService.logout).toHaveBeenCalledTimes(1);
        }));

        it('ids do not match', fakeAsync(() => {
            window.FB.getLoginStatus = (callback: (response: any) => void) => {
                callback({status: 'connected', authResponse: {userID: 'y'}});
            };
        }));

        it('null auth response', fakeAsync(() => {
            window.FB.getLoginStatus = (callback: (response: any) => void) => {
                callback({status: 'connected', authResponse: null});
            };
        }));

        it('mo auth response', fakeAsync(() => {
            window.FB.getLoginStatus = (callback: (response: any) => void) => {
                callback({status: 'connected'});
            };
        }));


        it('mot connected', fakeAsync(() => {
            window.FB.getLoginStatus = (callback: (response: any) => void) => {
                callback({status: 'not connected'});
            };
        }));
    });
});
