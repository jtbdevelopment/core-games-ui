import {MessageBusService} from '../messagebus/message-bus.service';
import {ErrorInterceptor} from './error.interceptor';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaderResponse,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {from} from 'rxjs/observable/from';

class MockHandler extends HttpHandler {
    public lastRequest: HttpRequest<any>;
    public events: Subject<HttpEvent<any>> = new Subject();

    handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
        this.lastRequest = req;
      return from(this.events);
    }
}


describe('Interceptor: error interceptor', () => {
    let messageBus: MessageBusService;
    let interceptor: ErrorInterceptor;
    let next: MockHandler;
    let error: any;
    let session: any;

    beforeEach(() => {
        error = undefined;
        session = undefined;
        next = new MockHandler();
        messageBus = new MessageBusService();
        messageBus.generalError.subscribe((e) => {
            error = e;
        });
        messageBus.invalidSessionError.subscribe((e) => {
            session = e;
        });
        interceptor = new ErrorInterceptor(messageBus);
        expect(error).toBeFalsy();
        expect(session).toBeFalsy();
    });

    it('passes requests on unchanged', () => {

        let req: HttpRequest<any> = new HttpRequest<any>('GET', 'someurl', null);
        interceptor.intercept(req, next);
        expect(next.lastRequest).toEqual(req);
    });

    it('passes on non error response', () => {
        let passedOn: HttpEvent<any>;

        interceptor.intercept(null, next).subscribe((x) => {
            passedOn = x;
        });
        expect(passedOn).toBeUndefined();
        let response: any = new HttpHeaderResponse();
        next.events.next(response);
        expect(passedOn).toEqual(response);
        expect(error).toBeFalsy();
        expect(session).toBeFalsy();

        response = new HttpResponse();
        next.events.next(response);
        expect(passedOn).toEqual(response);
        expect(error).toBeFalsy();
        expect(session).toBeFalsy();
    });

    it('passes on 409 error response', () => {
        let passedOn: HttpEvent<any>;


        interceptor.intercept(null, next).subscribe((x) => {
            passedOn = x;
        });
        expect(passedOn).toBeUndefined();
        let response: any = new HttpErrorResponse({status: 409});
        next.events.next(response);
        expect(passedOn).toEqual(response);
        expect(error).toBeFalsy();
        expect(session).toBeFalsy();
    });

    it('captures invalid session 401', () => {
        let passedOn: HttpEvent<any>;


        interceptor.intercept(null, next).subscribe((x) => {
            passedOn = x;
        });
        expect(passedOn).toBeUndefined();
        let response: any = new HttpErrorResponse({status: 401});
        next.events.next(response);
        expect(passedOn).toBeUndefined();
        expect(error).toBeFalsy();
        expect(session).toEqual(response);
    });

    it('captures general error', () => {
        let passedOn: HttpEvent<any>;


        interceptor.intercept(null, next).subscribe((x) => {
            passedOn = x;
        });
        expect(passedOn).toBeUndefined();
        let response: any = new HttpErrorResponse({status: 404});
        next.events.next(response);
        expect(passedOn).toBeUndefined();
        expect(error).toEqual(response);
        expect(session).toBeFalsy();
    });
});
