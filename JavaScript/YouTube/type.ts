
type VideoThumnail = {
    default: { url: string, width: number, height: number },
    medium?: { url: string, width: number, height: number },
    high?: { url: string, width: number, height: number },
    standard?: { url: string, width: number, height: number },
    maxres?: { url: string, width: number, height: number },
}

type VideoSnippet = {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: VideoThumnail;
    channelTitle: string;
    tags: string[];
    categoryId: string;
    liveBroadcastContent: string;
    localized: {
        title: string;
        description: string;
    },
    defaultAudioLanguage: string;
    resourceId?: {
        kind: string;
        videoId: string;
    },
    publishTime?: string
}

export type VideoItem = {
    kind: string;
    etag: string;
    id: string;
    snippet: VideoSnippet,
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
}

export type PlaylistItemsResponse = {
    kind: string;
    etag: string;
    items: VideoItem[];
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    }
    nextPageToken?: string;
}

export type SearchResponse = {
    kind: string,
    etag: string,
    nextPageToken: string,
    regionCode: string,
    pageInfo: { totalResults: number, resultsPerPage: number },
    items: {
        kind: string,
        etag: string,
        id: {
            kind: string,
            channelId: string
        },
        snippet: Omit<VideoSnippet, "tags" | "categoryId" | "localized" | "defaultAudioLanguage" | "resourceId">
    }[]
}

type ChannelItem = {
    kind: string,
    etag: string,
    id: string,
    snippet: {
        publishedAt: string,
        title: string,
        description: string,
        customUrl: string,
        thumbnails: VideoThumnail,
        localized: {
            title: string,
            description: string
        },
        country: string
    },
    contentDetails: {
        relatedPlaylists: { likes: string, uploads: string }
    },
    statistics: {
        viewCount: string,
        subscriberCount: string,
        hiddenSubscriberCount: boolean,
        videoCount: string
    },
    status: {
        privacyStatus: string,
        isLinked: boolean,
        longUploadsStatus: string
    }
}

export type ChannelsResponse = {
    kind: string;
    etag: string;
    pageInfo: { totalResults: number, resultsPerPage: number },
    items: ChannelItem[]
}

