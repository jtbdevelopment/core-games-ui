
export class Player {
    id: string;
    md5: string;
    source: string;
    sourceId: string;
    displayName: string;
    imageUrl: string;
    profileUrl: string;
    lastVersionNotes: string;
    adminUser: boolean = false;
    gameSpecificPlayerAttributes: any = {};

    constructor(original?: any) {
        Object.assign(this, original);
    }
}
