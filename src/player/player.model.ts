export class Player {
  id: string;
  md5: string;
  source: string;
  sourceId: string;
  displayName: string;
  imageUrl: string;
  profileUrl: string;
  lastVersionNotes: string;
  adminUser = false;
  payLevel: string;
  gameSpecificPlayerAttributes: any = {};

  constructor(original?: any) {
    Object.assign(this, original);
  }
}
