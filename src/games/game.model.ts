export class Game {
  public id: string;
  public previousId: string;
  public version: number;

  public round: number;

  public created: number;
  public lastUpdate: number;
  public completedTimestamp: number;

  public gamePhase: string;

  public players: any = {};  // md5 to name
  public playerImages: any = {}; // md5 to image
  public playerProfiles: any = {};  // md5 to profile
  public playerStates: any = {};  // md5 to profile

  public features: string[] = [];

  constructor(original?: any) {
    Object.assign(this, original);
  }

  public standardLink(): string {
    return '/game/' + this.gamePhase.toLowerCase() + '/' + this.id;
  }
}
