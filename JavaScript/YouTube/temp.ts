//import { YouTube } from 'https://deno.land/x/youtube@v0.3.0/mod.ts';

type YouTubeSnippet = {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
        default: { url: string, width: number, height: number },
        medium: { url: string, width: number, height: number },
        high: { url: string, width: number, height: number },
        standard: { url: string, width: number, height: number },
        maxres: { url: string, width: number, height: number },
    },
    channelTitle: string;
    tags: string[];
    categoryId: string;
    liveBroadcastContent: string;
    localized: {
        title: string;
        description: string;
    },
    defaultAudioLanguage: string;
}

type YouTubeData = {
    kind: string;
    etag: string;
    items: {
        kind: string;
        etag: string;
        id: string;
        snippet: YouTubeSnippet,
        contentDetails: {
            duration: string;
            dimension: string;
            definition: string;
            caption: string;
            licensedContent: boolean;
            contentRating: unknown;
            projection: string;
        },
        status: {
            uploadStatus: string;
            privacyStatus: string;
            license: string;
            embeddable: boolean;
            publicStatsViewable: boolean;
            madeForKids: boolean;
        },
        statistics: {
            viewCount: string;
            likeCount: string;
            favoriteCount: string;
            commentCount: string;
        }
    }[];
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    }
}

export class YouTubeURL {
    id: string;
    type: string;
    url: string;
    constructor(url: string) {
        this.url = url;

        this.type = (() => {
            if (url.includes('watch?v=')) return 'watch';
            if (url.includes('shorts')) return 'shorts';
            if (url.includes('live')) return 'live';
            if (url.includes('music')) return 'music';
            if (url.includes('youtu.be')) return 'watch';
            return 'unknown';
        })();

        if (url.includes('youtu.be')) {
            // https://youtu.be/gvJdHEhUtHM?si=~
            const match = url.match(/https?:\/\/youtu\.be\/([^?]*)/);
            this.id = match ? match[1] : "";
        } else {
            const match = url.match(/https?:\/\/(?:www|m|music).youtube.com\/(?:watch\?v=|shorts\/|live\/)([^&?]*).*/);
            this.id = match ? match[1] : "";
        }

    }
    get watchURL() {
        return `https://www.youtube.com/watch?v=${this.id}`;
    }
    /** `https://www.googleapis.com/youtube/v3/videos` */
    data(api: string) {
        // https://www.googleapis.com/youtube/v3/videos?id=動画のID&key=APIキー&part=snippet,contentDetails,statistics,status    
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${this.id}&key=${api}&part=snippet,contentDetails,statistics,status`;
        return fetch(url).then(response => response.json()) as Promise<YouTubeData>;
    }
    static getThumnail(snippet: YouTubeSnippet) {
        const item = snippet;// data.items[0].snippet;
        const thumnails = item.thumbnails;
        const thumnail = thumnails.maxres || thumnails.high || thumnails.standard || thumnails.medium || thumnails.default;
        return thumnail.url;
    }
}

export class YouTubeClient {
    key: string;
    constructor(api_key: string) {
        this.key = api_key;
    }
    /** `https://www.googleapis.com/youtube/v3/search` */
    searchChannel(query: string) {
        const url = `https://www.googleapis.com/youtube/v3/search?q=${query}&key=${this.key}&type=channel&part=snippet`;
        return fetch(url).then(response => response.json() as Promise<YouTubeData>);
    }
    /** `https://www.googleapis.com/youtube/v3/channels` */
    retrieveChannel(channelId: string) {
        const url = `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&key=${this.key}&part=snippet,contentDetails,statistics,status`;
        return fetch(url).then(response => response.json() as Promise<YouTubeData>);
    }
    /** `https://www.googleapis.com/youtube/v3/playlistItems` */
    async getChannelVideos(playlistId: string) {
        let results: unknown[] = [];
        let hasMore = true;
        let cursor: string | null | undefined = undefined;
        let url: string;

        while (hasMore) {
            if (!results.length) {
                url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${this.key}&part=snippet&maxResults=50`;
            } else {
                url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&pageToken=${cursor}&key=${this.key}&part=snippet&maxResults=50`;
            }
            const response = await fetch(url).then(response => response.json()) as YouTubeData & { nextPageToken: string };

            results = results.concat(response.items);
            cursor = response.nextPageToken;
            hasMore = Boolean(response.nextPageToken);
        }

        return results;
    }
}
