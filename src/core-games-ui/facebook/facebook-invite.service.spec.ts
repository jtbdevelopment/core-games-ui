import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {FacebookInitializerService} from './facebook-initializer.service';
import {FacebookInviteService} from './facebook-invite.service';
import {Invitable} from '../friends/invitable.model';

declare let window: any;

class MockInitService {
    public fbReady: Promise<any>;

    public resolve: (result?: boolean) => void;
    public reject: (reason?: any) => void;

    constructor() {
        this.fbReady = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

}

describe('Service: facebook invite service', () => {
    let inviteService: FacebookInviteService;
    let mockInit: MockInitService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {provide: FacebookInitializerService, useClass: MockInitService},
                FacebookInviteService
            ]
        });
        mockInit = TestBed.get(FacebookInitializerService) as MockInitService;
        inviteService = TestBed.get(FacebookInviteService);
        window.FB = {
            ui: jasmine.createSpy('ui')
        };
    });

    it('invite before init ready', () => {
        expect(window.FB.ui).not.toHaveBeenCalled();
        inviteService.inviteFriends([new Invitable('id1', 'dn1')], 'message');
        expect(window.FB.ui).not.toHaveBeenCalled();
    });


    it('invite friends when ready', fakeAsync(() => {
        let message = 'to boldly go';
        let friends = [
            new Invitable('id1', 'dn1'),
            new Invitable('id2', 'dn2'),
            new Invitable('id3', 'dn3')
        ];
        inviteService.inviteFriends(friends, message);
        expect(window.FB.ui).not.toHaveBeenCalled();
        mockInit.resolve(true);
        tick();
        expect(window.FB.ui).toHaveBeenCalledWith({
            method: 'apprequests',
            message: message,
            to: 'id1, id2, id3'
        });
    }));

});
