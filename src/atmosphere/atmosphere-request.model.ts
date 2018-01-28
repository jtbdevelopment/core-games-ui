import {BehaviorSubject, Subject} from 'rxjs';

export class AtmosphereRequest {
    requestConnectionStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    messageSubject: Subject<any> = new Subject<any>();

    url: string = '';
    contentType: string = 'application/json';
    logLevel: string = 'info';
    transport: string = 'websocket';
    trackMessageLength: boolean = true;
    fallbackTransport: string = 'long-polling';
    handleOlineOffline: boolean = false;
    withCredentials: boolean = true;
    closeAsync: boolean = true;  //  needed due to with credentials

    constructor(endPoint: string, playerId: string) {
        this.url = endPoint + '/livefeed/' + playerId;
    }

    onOpen(response: any): void {
        console.log(this.url + ' - Atmosphere connected using ' + response.transport);
        this.requestConnectionStatus.next(true);
    }

    onClose(): void {
        console.log(this.url + ' - Atmosphere connection closed.');
        this.requestConnectionStatus.next(false);
    }

    onError(response: any): void {
        console.log(this.url + ' - Atmosphere error.' + JSON.stringify(response));
    }

    onMessage(message: any): void {
        let localMessage = Object.assign({}, message);  //  clone as atmosphere can re-use
        if (localMessage.messages) {
            let messages: string[] = localMessage.messages as string[];
            messages.forEach(messageAsString => {
                let message: any;
                try {
                    message = JSON.parse(messageAsString);
                } catch (error) {
                    console.error('got non-parseable message');
                    return;
                }

                this.messageSubject.next(message);
            });
        }
    }
}

