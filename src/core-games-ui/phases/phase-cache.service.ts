import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Phase} from './phase.model';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import {MessageBusService} from '../messagebus/message-bus.service';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class PhaseCacheService {
    public phases: Observable<Phase[]>;

    private phasesSubject: BehaviorSubject<Phase[]> = new BehaviorSubject<Phase[]>([]);

    constructor(private http: HttpClient, private messageBus: MessageBusService) {
        this.phases = Observable.from(this.phasesSubject);
        this.messageBus.connectionStatus.subscribe(connected => {
            if (connected && this.phasesSubject.getValue().length === 0) {
                this.initializePhases();
            }
        });
    }

    private initializePhases(): void {
        this.http.get('/api/phases')
            .map(json => {
                let phases = [];
                Object.getOwnPropertyNames(json).forEach(phase => {
                    phases.push(new Phase(phase, json[phase][1], json[phase][0]));
                });
                return phases;
            })
            .subscribe(phases => {
                this.phasesSubject.next(phases);
            });
    }
}
