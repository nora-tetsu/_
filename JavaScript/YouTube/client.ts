//import { YouTube } from 'https://deno.land/x/youtube@v0.3.0/mod.ts';
import type { VideoItem, PlaylistItemsResponse, SearchResponse, ChannelsResponse } from "./type.ts";

const ENDPOINT = {
    videos: "https://www.googleapis.com/youtube/v3/videos",
    search: "https://www.googleapis.com/youtube/v3/search",
    channels: "https://www.googleapis.com/youtube/v3/channels",
    playlistItems: "https://www.googleapis.com/youtube/v3/playlistItems",
}

const generateApiUrl = (endpoint: string, params: Record<string, string>) => endpoint + "?" + new URLSearchParams(params).toString();

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
        const url = generateApiUrl(ENDPOINT.videos, {
            id: this.id, // 動画のID
            key: api, // APIキー
            part: "snippet,contentDetails,statistics,status",
        })
        return fetch(url).then(response => response.json()) as Promise<PlaylistItemsResponse>;
    }
    static getThumnail(video: VideoItem) {
        const item = video.snippet;
        const thumnails = item.thumbnails;
        const thumnail = thumnails.maxres || thumnails.high || thumnails.standard || thumnails.medium || thumnails.default;
        return thumnail ? thumnail.url : "";
    }
}

export class YouTubeClient {
    key: string;
    constructor(api_key: string) {
        this.key = api_key;
    }
    /** `https://www.googleapis.com/youtube/v3/search` */
    searchChannel(query: string) {
        const url = generateApiUrl(ENDPOINT.search, {
            q: query,
            key: this.key,
            type: "channel",
            part: "snippet",
        })
        return fetch(url).then(response => response.json() as Promise<SearchResponse>);
    }
    /** `https://www.googleapis.com/youtube/v3/channels` */
    retrieveChannel(channelId: string) {
        const url = generateApiUrl(ENDPOINT.channels, {
            id: channelId,
            key: this.key,
            part: "snippet,contentDetails,statistics,status",
        })
        return fetch(url).then(response => response.json() as Promise<ChannelsResponse>);
    }
    /** `https://www.googleapis.com/youtube/v3/playlistItems` */
    async getChannelVideos(playlistId: string, limit?: number) {
        let results: VideoItem[] = [];
        let hasMore = true;
        let cursor: string | null | undefined = undefined;
        let url: string;

        while (hasMore) {
            if (!results.length) {
                url = generateApiUrl(ENDPOINT.playlistItems, {
                    playlistId,
                    key: this.key,
                    part: "snippet",
                    maxResults: "50",
                })
            } else {
                url = generateApiUrl(ENDPOINT.playlistItems, {
                    playlistId,
                    pageToken: cursor!,
                    key: this.key,
                    part: "snippet",
                    maxResults: "50",
                })
            }
            const response = await fetch(url).then(response => response.json()) as PlaylistItemsResponse;

            results = results.concat(response.items);
            cursor = response.nextPageToken;
            hasMore = Boolean(response.nextPageToken);
            if (limit && results.length > (limit - 1)) break;
        }

        return results;
    }

    /**
     * 再生リストに含まれる動画について、動画自体の情報を取得する
     * @param playlistId 
     * @param limit 
     * @returns 
     */
    async getPlaylistItems(playlistId: string, limit?: number) {
        const data = await this.getChannelVideos(playlistId, limit);
        const videos: VideoItem[] = [];
        for (const item of data) {
            const id = item.snippet.resourceId?.videoId;
            if (!id) continue;
            const parser = new YouTubeURL(`https://www.youtube.com/watch?v=${id}`);
            const video = await parser.data(this.key);
            const result = video.items[0];
            if (result && result.id) videos.push(video.items[0]);
        }
        return videos;
    }

    /**
     * 検索語でヒットするトップのアカウントの投稿動画情報を取得する
     * @param query 検索語
     */
    async test_getVideosByQuery(query: string, limit?: number) {
        const search = await this.searchChannel(query);
        const map = search.items.map((item) => {
            return {
                title: item.snippet.title,
                channelId: item.id.channelId,
            }
        })
        console.log(map);
        if (map.length == 0) return;
        const retrieve = await this.retrieveChannel(map[0].channelId);
        if (retrieve.items.length == 0) return;
        const playlistId = retrieve.items[0].contentDetails.relatedPlaylists.uploads;
        console.log(playlistId);
        const result = await this.getChannelVideos(playlistId, limit);
        return {
            title: map[0].title,
            channel: retrieve.items[0],
            videos: result,
        }
    }
}
