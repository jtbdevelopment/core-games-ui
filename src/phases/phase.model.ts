export class Phase {
  public value: string;
  public groupLabel: string;
  public description: string;

  constructor(value: string, label: string, description: string) {
    this.value = value;
    this.groupLabel = label;
    this.description = description;
  }
}
