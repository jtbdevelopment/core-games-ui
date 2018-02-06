import {Phase} from './phase.model';
import {TestBed} from '@angular/core/testing';
import {PhaseCacheService} from './phase-cache.service';
import {MessageBusService} from '../messagebus/message-bus.service';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';

describe('Service: phase cache service', () => {
  let phaseCache: PhaseCacheService;
  let messageBus: MessageBusService;
  let httpMock: HttpTestingController;
  let currentPhases: Phase[];

  beforeEach(() => {
    currentPhases = null;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PhaseCacheService, MessageBusService]
    });
    phaseCache = TestBed.get(PhaseCacheService);
    messageBus = TestBed.get(MessageBusService);
    httpMock = TestBed.get(HttpTestingController);
    phaseCache.phases.subscribe((p) => {
      currentPhases = p;
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('defaults to empty phases', () => {
    expect(currentPhases).toEqual([]);
  });

  describe('loading phases', () => {
    const results = {
      'p1': ['d1', 'g1'],
      'p2': ['d2', 'g2'],
      'p4': ['d4', 'g4'],
      'p3': ['d3', 'g3']
    };

    afterEach(() => {
      expect(JSON.stringify(currentPhases)).toEqual(JSON.stringify([
        new Phase('p1', 'g1', 'd1'),
        new Phase('p2', 'g2', 'd2'),
        new Phase('p4', 'g4', 'd4'),
        new Phase('p3', 'g3', 'd3'),
      ]));
    });

    it('it requests phases on first request', () => {
      messageBus.connectionStatus.next(true);
      const request = httpMock.expectOne('/api/phases');
      expect(request.request.method).toEqual('GET');
      expect(request.request.body).toBeNull();
      request.flush(results);
    });

    it('it does not re-request after first call', () => {
      messageBus.connectionStatus.next(true);
      const request = httpMock.expectOne('/api/phases');
      expect(request.request.method).toEqual('GET');
      expect(request.request.body).toBeNull();
      request.flush(results);

      messageBus.connectionStatus.next(false);
      messageBus.connectionStatus.next(true);
    });
  });
});
