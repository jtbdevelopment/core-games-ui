import {AtmosphereRequest} from './atmosphere-request.model';

describe('Model: atmosphererequest', () => {
  it('initializes variables for connection parameters', () => {
    let request = new AtmosphereRequest('localhost:123', '1234');
    expect(request.url).toEqual('localhost:123/livefeed/1234');
    expect(request.closeAsync).toBeTruthy();
    expect(request.withCredentials).toBeTruthy();
    expect(request.handleOlineOffline).toBeFalsy();
    expect(request.trackMessageLength).toBeTruthy();
    expect(request.contentType).toEqual('application/json');
    expect(request.logLevel).toEqual('info');
    expect(request.transport).toEqual('websocket');
    expect(request.fallbackTransport).toEqual('long-polling');

    let connected: boolean = true;
    request.requestConnectionStatus.subscribe(status => {
      connected = status;
    });
    expect(connected).toBeFalsy();
  });

  describe('post initialize connection status tests', () => {

    let request: AtmosphereRequest;
    let status = true;
    beforeEach(() => {
      request = new AtmosphereRequest('', '34');
      request.requestConnectionStatus.subscribe(newStatus => {
        status = newStatus;
      });
    });

    it('publishes when connected', () => {
      request.onOpen({transport: 'magic tunnel'});
      expect(status).toBeTruthy();
    });

    it('publishes when closed', () => {
      request.onOpen({transport: 'magic tunnel'});
      expect(status).toBeTruthy();
      request.onClose();
      expect(status).toBeFalsy();
    });

    it('does not publish onError', () => {
      status = null;
      request.onError({something: 'something'});
      expect(status).toBeNull();
    });
  });

  it('publishes all parsable messages in a batch', () => {
    let request: AtmosphereRequest = new AtmosphereRequest('', '');
    let m1: string = JSON.stringify({f1: 3, f2: 'string'});
    let m2: string = 'not json';
    let m3: string = JSON.stringify({messageType: 'heartbeat', message: 'here i am'});

    let messages: any[] = [];
    request.messageSubject.subscribe(message => {
      messages.push(message);
    });
    request.onMessage({messages: [m1, m2, m3]});
    //noinspection TypeScriptValidateTypes
    expect(messages.length).toEqual(2);
    expect(JSON.stringify(messages[0])).toEqual(m1);
    expect(JSON.stringify(messages[1])).toEqual(m3);
  });

  it('ignores if no messages fields', () => {
    let request: AtmosphereRequest = new AtmosphereRequest('', '');
    let m1: string = JSON.stringify({f1: 3, f2: 'string'});
    let m2: string = 'not json';
    let m3: string = JSON.stringify({messageType: 'heartbeat', message: 'here i am'});

    let messages: any[] = [];
    request.messageSubject.subscribe(message => {
      messages.push(message);
    });
    request.onMessage({notMessages: [m1, m2, m3]});
    //noinspection TypeScriptValidateTypes
    expect(messages.length).toEqual(0);
  });
});
