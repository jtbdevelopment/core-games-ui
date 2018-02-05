import {TestBed} from '@angular/core/testing';
import {MessageBusService} from '../messagebus/message-bus.service';
import {FeatureCacheService} from './feature-cache.service';
import {Feature} from './feature.model';
import {FeatureOption} from './feature-option.model';
import {FeatureGroup} from './feature-group.model';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';

describe('Service: feature cache service', () => {
  let featureService: FeatureCacheService;
  let messageBus: MessageBusService;

  let currentFeatures: FeatureGroup[];
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FeatureCacheService, MessageBusService]
    });
    featureService = TestBed.get(FeatureCacheService);
    messageBus = TestBed.get(MessageBusService);
    httpMock = TestBed.get(HttpTestingController);

    featureService.features.subscribe((f) => {
      currentFeatures = f;
    });
  });

  it('defaults to empty features', () => {
    expect(currentFeatures).toEqual([]);
    httpMock.verify();
  });

  describe('loading features', () => {
    let results = [
      {
        'feature': {
          'groupType': 'Difficulty',
          'feature': 'Option1',
          'group': 'Option1',
          'label': 'Option 1',
          'description': 'Some sort of option.'
        },
        'options': [
          {
            'groupType': 'Difficulty',
            'feature': 'Choice1',
            'group': 'Option1',
            'label': 'Choice1',
            'description': 'Tada!'
          },
          {
            'groupType': 'Difficulty',
            'feature': 'Choice2',
            'group': 'Option1',
            'label': 'Two',
            'description': 'Super info!'
          },
          {
            'groupType': 'Difficulty',
            'feature': 'Choice3',
            'group': 'Option1',
            'label': 'Choice3',
            'description': 'Don\'t pick me.'
          }
        ]
      },
      {
        'feature': {
          'groupType': 'Difficulty',
          'feature': 'Option2',
          'group': 'Option2',
          'label': 'Option 2',
          'description': 'Some sort of option.'
        },
        'options': [
          {
            'groupType': 'Difficulty',
            'feature': 'Option2Yes',
            'group': 'Option2',
            'label': 'Yes',
            'description': 'Turns on cool feature!'
          },
          {
            'groupType': 'Difficulty',
            'feature': 'Option2No',
            'group': 'Option2',
            'label': 'No',
            'description': 'Game will suck!'
          }
        ]
      },
      {
        'feature': {
          'groupType': 'MultiPlayer',
          'feature': 'Option3',
          'group': 'Option3',
          'label': 'Multiplayer Option',
          'description': 'Some sort of multi-player option.'
        },
        'options': [
          {
            'groupType': 'MultiPlayer',
            'feature': 'Solo',
            'group': 'Option3',
            'label': 'Solo',
            'description': 'Make more friends!'
          },
          {
            'groupType': 'MultiPlayer',
            'feature': 'Collaborate',
            'group': 'Option3',
            'label': 'Friends',
            'description': 'Play together'
          },
          {
            'groupType': 'MultiPlayer',
            'feature': 'Compete',
            'group': 'Option3',
            'label': 'Enemies',
            'description': 'Play head to head.'
          }
        ]
      }
    ];

    afterEach(() => {
      let expectedGroups = [
        new FeatureGroup('Difficulty'),
        new FeatureGroup('MultiPlayer')
      ];
      expectedGroups[0].features = [
        new Feature('Option1', 'Option 1', 'Some sort of option.'),
        new Feature('Option2', 'Option 2', 'Some sort of option.'),
      ];
      expectedGroups[1].features = [
        new Feature('Option3', 'Multiplayer Option', 'Some sort of multi-player option.')
      ];
      expectedGroups[0].features[0].options = [
        new FeatureOption('Choice1', 'Choice1', 'Tada!'),
        new FeatureOption('Choice2', 'Two', 'Super info!'),
        new FeatureOption('Choice3', 'Choice3', 'Don\'t pick me.'),
      ];
      expectedGroups[0].features[1].options = [
        new FeatureOption('Option2Yes', 'Yes', 'Turns on cool feature!'),
        new FeatureOption('Option2No', 'No', 'Game will suck!'),
      ];
      expectedGroups[1].features[0].options = [
        new FeatureOption('Solo', 'Solo', 'Make more friends!'),
        new FeatureOption('Collaborate', 'Friends', 'Play together'),
        new FeatureOption('Compete', 'Enemies', 'Play head to head.'),
      ];
      expect(JSON.stringify(currentFeatures)).toEqual(JSON.stringify(expectedGroups));
      httpMock.verify();
    });

    it('it requests features on first request', () => {
      messageBus.connectionStatus.next(true);
      let request = httpMock.expectOne('/api/features');
      expect(request.request.method).toEqual('GET');
      request.flush(results);
    });

    it('it does not re-request after first call', () => {
      messageBus.connectionStatus.next(true);
      let request = httpMock.expectOne('/api/features');
      expect(request.request.method).toEqual('GET');
      request.flush(results);

      messageBus.connectionStatus.next(false);
      messageBus.connectionStatus.next(true);
    });
  });
});
