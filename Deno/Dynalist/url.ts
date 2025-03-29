export class DynalistURL {
    id: string;
    fileId: string;
    url: string;
    isDynalistUrl: boolean;
    constructor(url: string) {
        // https://dynalist.io/d/7F7AbyNsJf7K--oz0vtxVZSF#z=_yaThzLWYEcFoW1CK5aOEFEI
        this.url = url;
        this.isDynalistUrl = url.startsWith("https://dynalist.io/d/");
        const matchId = url.match(/https:\/\/dynalist.io\/d\/.*?#z=(.*)/);
        this.id = matchId ? matchId[1] : "";
        const matchFileId = url.match(/https:\/\/dynalist.io\/d\/([^#?]*)/);
        this.fileId = matchFileId ? matchFileId[1] : "";
    }
}
