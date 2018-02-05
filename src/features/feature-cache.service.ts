import {Injectable} from '@angular/core';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import {MessageBusService} from '../messagebus/message-bus.service';
import {Feature} from './feature.model';
import {FeatureOption} from './feature-option.model';
import {FeatureGroup} from './feature-group.model';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {from} from 'rxjs/observable/from';

@Injectable()
export class FeatureCacheService {
  public features: Observable<FeatureGroup[]>;

  private featuresSubject: BehaviorSubject<FeatureGroup[]> = new BehaviorSubject<FeatureGroup[]>([]);

  constructor(private http: HttpClient, private messageBus: MessageBusService) {
    this.features = from(this.featuresSubject);
    this.messageBus.connectionStatus.subscribe(connected => {
      if (connected && this.featuresSubject.getValue().length === 0) {
        this.initialize();
      }
    });
  }

  private initialize(): void {
    this.http.get<any[]>('/api/features')
      .map(json => {
        let groups = [];
        let groupMap = new Map<string, number>();
        json.forEach(feature => {
          let groupType = feature.feature.groupType;
          if (groupMap.has(groupType) === false) {
            let group = new FeatureGroup(groupType);
            groups.push(group);
            groupMap.set(groupType, groups.length - 1);
          }
        });
        return {groups: groups, groupMap: groupMap, features: json};
      })
      .map(groupsAndFeatures => {
        groupsAndFeatures.features.forEach(feature => {
          let groupType = feature.feature.groupType;
          let newFeature = new Feature(feature.feature.feature, feature.feature.label, feature.feature.description);
          feature.options.forEach(option => {
            //noinspection TypeScriptUnresolvedVariable
            let newOption = new FeatureOption(option.feature, option.label, option.description);
            newFeature.options.push(newOption);
          });
          groupsAndFeatures.groups[groupsAndFeatures.groupMap.get(groupType)].features.push(newFeature);
        });
        return groupsAndFeatures.groups;
      })
      .subscribe(featureGroups => {
        this.featuresSubject.next(featureGroups);
      });
  }
}
