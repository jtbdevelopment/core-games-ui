import {ReflectiveInjector} from '@angular/core';
import {AbstractTurnClassifier} from './abstract-turn-classifier.service';

class MockClassifier extends AbstractTurnClassifier {

}

describe('Service: abstract turn classifier service', () => {
    let classifier: AbstractTurnClassifier;
    let classifications: string[];
    let icons: Map<string, string>;

    beforeEach(() => {
        classifications = null;
        icons = null;
        this.injector = ReflectiveInjector.resolveAndCreate(
            [
                {provide: 'GameClassifier', useClass: MockClassifier}
            ]
        );
        classifier = this.injector.get('GameClassifier');
        classifier.getClassifications().subscribe(c => classifications = c);
        classifier.getIcons().subscribe(i => icons = i);
    });

    it('static categories and icons', () => {
        expect(classifications).toEqual(['Your Turn', 'Their Turn', 'Older Games']);
        expect(JSON.stringify(icons)).toEqual(JSON.stringify([['Your Turn', 'play'], ['Their Turn', 'pause'], ['Older Games', 'stop']] as [string, string][]));
    });
});
