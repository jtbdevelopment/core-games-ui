import {AbstractTurnClassifier} from './abstract-turn-classifier.service';
import {TestBed} from '@angular/core/testing';

class MockClassifier extends AbstractTurnClassifier {

}

describe('Service: abstract turn classifier service', () => {
  let classifier: AbstractTurnClassifier;
  let classifications: string[];
  let icons: Map<string, string>;

  beforeEach(() => {
    classifications = null;
    icons = null;
    TestBed.configureTestingModule({
      providers:
        [
          {provide: 'GameClassifier', useClass: MockClassifier}
        ]
    });
    classifier = TestBed.get('GameClassifier');
  });

  it('static categories and icons', () => {
    classifier.getIcons().subscribe(i => icons = i);
    classifier.getClassifications().subscribe(c => classifications = c);
    expect(classifications).toEqual(['Your Turn', 'Their Turn', 'Older Games']);
    expect(icons.size).toEqual(3);
    expect(icons.get('Your Turn')).toEqual('play');
    expect(icons.get('Their Turn')).toEqual('pause');
    expect(icons.get('Older Games')).toEqual('stop');
  });
});
