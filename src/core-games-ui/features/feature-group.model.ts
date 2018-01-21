import {Feature} from './feature.model';

export class FeatureGroup {
    public groupType: string;

    public features: Feature[] = [];

    constructor(groupType: string) {
        this.groupType = groupType;
    }
}
