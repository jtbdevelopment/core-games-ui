import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {MessageBusService} from '../messagebus/message-bus.service';
import {Observable} from 'rxjs/Observable';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private messageBus: MessageBusService) {
    }

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        let subject = new Subject<HttpEvent<any>>();
        next.handle(req).subscribe((event) => {
            // Remember, there may be other events besides just the response.
            if (event instanceof HttpErrorResponse) {
                switch (event.status) {
                    case 409:
                        subject.next(event);
                        break;
                    case 401:
                        this.messageBus.invalidSessionError.next(event);
                        subject.complete();
                        break;
                    default:
                        this.messageBus.generalError.next(event);
                        subject.complete();
                        break;
                }
            } else {
                subject.next(event);
            }
        });
        return Observable.from(subject);
    }
}
