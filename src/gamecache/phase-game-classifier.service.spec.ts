import {Phase} from '../phases/phase.model';
import {Game} from '../games/game.model';
import {PhaseGameClassifier} from './phase-game-classifier.service';
import {PhaseCacheService} from '../phases/phase-cache.service';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {TestBed} from '@angular/core/testing';
import {from} from 'rxjs/observable/from';

class MockPhaseService {
  public phasesSubject: BehaviorSubject<Phase[]> = new BehaviorSubject<Phase[]>([]);
  public phases: Observable<Phase[]> = from(this.phasesSubject);
}

describe('Service: phase game clasifier service', () => {
  let phaseCache: MockPhaseService;
  let classifier: PhaseGameClassifier;
  let classifications: string[];

  beforeEach(() => {
    classifications = null;
    this.injector = TestBed.configureTestingModule({
      providers: [
        {provide: PhaseCacheService, useClass: MockPhaseService},
        PhaseGameClassifier
      ]
    });
    phaseCache = this.injector.get(PhaseCacheService);
    classifier = this.injector.get(PhaseGameClassifier);
    classifier.getClassifications().subscribe(c => classifications = c);
  });

  it('before initialization of phases, returns game phase', () => {
    const g = new Game();
    g.gamePhase = 'phase1';

    expect(classifier.classifyGame(g)).toEqual(g.gamePhase);
    expect(classifications).toEqual([]);
  });

  it('can always get icons', () => {
    let icons: Map<string, string>;
    classifier.getIcons().subscribe(x => icons = x);
    expect(icons.get('Play')).toEqual('play');
    expect(icons.get('Challenged')).toEqual('comment');
    expect(icons.get('Setup')).toEqual('wrench');
    expect(icons.get('Played')).toEqual('forward');
    expect(icons.get('Finished')).toEqual('stop');
    expect(icons.get('Declined')).toEqual('thumbs-down');
    expect(icons.get('Quit')).toEqual('flag');
  });

  describe('after phases initialized', () => {
    const p1 = new Phase('phase1', 'Phase 1', 'Phase 1 Desc');
    const p2 = new Phase('phase2', 'Phase 2', 'Phase 2 Desc');
    beforeEach(() => {
      phaseCache.phasesSubject.next([p1, p2]);
    });

    it('classifications are initialized', () => {
      expect(classifications).toEqual(['Phase 1', 'Phase 2']);
    });

    it('returns Phase 1 for phase1 game', () => {
      const g = new Game();
      g.gamePhase = 'phase1';

      expect(classifier.classifyGame(g)).toEqual(p1.groupLabel);
    });

    it('returns Phase 2 for phase2 game', () => {
      const g = new Game();
      g.gamePhase = 'phase2';

      expect(classifier.classifyGame(g)).toEqual(p2.groupLabel);
    });

    it('returns raw phase for unknown pahse', () => {
      const g = new Game();
      g.gamePhase = 'unknown';

      expect(classifier.classifyGame(g)).toEqual(g.gamePhase);
    });
  });
});
