export class FeatureOption {
  public option: string;
  public label: string;
  public description: string;

  constructor(option: string, label: string, description: string) {
    this.option = option;
    this.description = description;
    this.label = label;
  }
}
