import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';

export class AtmosphereRequest {
  requestConnectionStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  messageSubject: Subject<any> = new Subject<any>();

  url = '';
  contentType = 'application/json';
  logLevel = 'info';
  transport = 'websocket';
  trackMessageLength = true;
  fallbackTransport = 'long-polling';
  handleOlineOffline = false;
  withCredentials = true;
  closeAsync = true;  //  needed due to with credentials

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
    const localMessage = Object.assign({}, message);  //  clone as atmosphere can re-use
    if (localMessage.messages) {
      const messages: string[] = localMessage.messages as string[];
      messages.forEach(messageAsString => {
        let json: any;
        try {
          json = JSON.parse(messageAsString);
        } catch (error) {
          console.error('got non-parseable message');
          return;
        }

        this.messageSubject.next(json);
      });
    }
  }
}

