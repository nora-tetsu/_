
export function expandShortenedURL(url: string) {
    return fetch(url)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, "text/html");
            const title = doc.querySelector("title");
            return title ? title.textContent : "";
        });
}

type YouTubeData = {
    kind: string;
    etag: string;
    items: {
        kind: string;
        etag: string;
        id: string;
        snippet: {
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
        },
        contentDetails: {
            duration: string;
            dimension: string;
            definition: string;
            caption: string;
            licensedContent: boolean;
            contentRating: {};
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
    data(api: string) {
        // https://www.googleapis.com/youtube/v3/videos?id=動画のID&key=APIキー&part=snippet,contentDetails,statistics,status    
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${this.id}&key=${api}&part=snippet,contentDetails,statistics,status`;
        return fetch(url).then(response => response.json()) as Promise<YouTubeData>;
    }
}

export class DynalistURL {
    id: string;
    fileId: string;
    url: string;
    constructor(url: string) {
        // https://dynalist.io/d/7F7AbyNsJf7K--oz0vtxVZSF#z=_yaThzLWYEcFoW1CK5aOEFEI
        this.url = url;
        this.id = url.replace(/https:\/\/dynalist.io\/d\/.*?#z=(.*)/, "$1");
        this.fileId = url.replace(/https:\/\/dynalist.io\/d\/([^#?]*)/, "$1");
    }
}

/**
 * ツイートの情報を取得する
 * @param {HTMLElement} container 
 * @returns 
 */
export async function getTweetInfo(container: HTMLElement) {
    function emoji2alt(parent: HTMLElement) {
        if (!parent) return;
        const emojis = parent.querySelectorAll(`img[draggable="false"]`) as NodeListOf<HTMLImageElement>;
        emojis.forEach(elm => {
            const alt = document.createTextNode(elm.alt);
            const parentNode = elm.parentNode;
            if (parentNode) parentNode.replaceChild(alt, elm);
        })
    }

    const urlElm = (container.querySelector(`a[aria-describedby]`) || container.querySelector(`a.r-1w6e6rj`)) as HTMLAnchorElement | null;
    if (!urlElm) {
        alert("ツイートが見つかりません。");
        return;
    }
    const url = "https://x.com" + urlElm.href.replace("https://x.com", "");

    const userElm = container.querySelector(`[data-testid="User-Name"]`) as HTMLDivElement;
    emoji2alt(userElm);
    const userElmText = userElm.textContent as string;
    const matchUser = userElmText.match(/(.*)@([^·]*)/);
    const [userName, userId] = matchUser ? [matchUser[1], matchUser[2]] : [userElmText, ""]; // by Copilot

    const textElm = container.querySelector(`[data-testid="tweetText"]`) as HTMLDivElement;
    emoji2alt(textElm);

    const imgElms = container.querySelectorAll(`[data-testid="tweetPhoto"]`);
    const images = Array.from(imgElms).map(elm => {
        const img = elm.querySelector("img");
        if (!img) return;
        return img.src.replace(/\?format=([^&]*).*/, ".$1");
    }).filter(Boolean) as string[];

    const anchors = textElm.querySelectorAll("a");
    const links = await Promise.all(Array.from(anchors).map(async (anchor) => {
        let url = anchor.href;
        url = (url.startsWith("https://t.co/") ? await expandShortenedURL(url) : url) as string;
        if (url.startsWith('https://x.com/hashtag/')) return;
        anchor.textContent = url;
        return {
            title: url,
            url,
        }
    })).then(results => results.filter(Boolean)) as { title: string, url: string }[];
    (async () => {
        const cardElm = (container.querySelector(`[data-testid="card.layout"] a`) || container.querySelector(`[data-testid="card.wrapper"] a`)) as HTMLAnchorElement | null;
        if (!cardElm) return;
        const url = cardElm.href;
        let label = cardElm.getAttribute("aria-label");
        if (!label) {
            const labelElm = cardElm.querySelector(`[aria-label]`);
            const cardElmText = cardElm.textContent as string;
            label = labelElm ? labelElm.getAttribute("aria-label") : cardElmText.replace(/ *\n */g, " ") || "URL";
        }
        links.push({
            title: label as string,
            url: (url.startsWith("https://t.co/") ? await expandShortenedURL(url) : url) as string,
        });
    })();

    const timeElm = container.querySelector("a time") as HTMLTimeElement | null;

    return {
        url,
        userName,
        userId,
        text: textElm.textContent as string,
        images,
        links,
        time: timeElm ? timeElm.dateTime : "",
        date: timeElm ? new Date(timeElm.dateTime) : new Date(),
    }
}

/**
 * Blueskyの情報を取得する
 * @param {HTMLElement} container 
 * @returns 
 */
export function getBskyInfo(container: HTMLElement) {
    const urlElm = container.querySelector(`a[href*="/post/"][data-tooltip]`) as HTMLAnchorElement | null;
    if (!urlElm) {
        alert("ツイートが見つかりません。");
        return;
    }
    const dateStr = urlElm.getAttribute("data-tooltip") as string;
    const formattedDateStr = dateStr.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日 (\d{2}:\d{2})/, (_match, year, month, day, time) => {
        return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')} ${time}`;
    });
    const date = new Date(formattedDateStr);
    const url = "https://bsky.app" + urlElm.href.replace("https://bsky.app", "");
    const userElm = container.querySelectorAll(`[aria-label="プロフィールを表示"]`);
    const [userName, userId] = Array.from(userElm).map(elm => elm.textContent);

    const imgElms = container.querySelectorAll(`[data-testid="contentHider-post"] img`) as NodeListOf<HTMLImageElement>;
    const images = Array.from(imgElms).map(elm => {
        if (elm.closest("a")) return; // aタグが親にあるときはリンクカードの画像なのでスキップ
        return {
            alt: elm.alt,
            src: elm.src.replace("feed_thumbnail", "feed_fullsize"),
        }
    }).filter(Boolean);

    const textElm = container.querySelector(`[data-testid="postText"]`) as HTMLDivElement;
    const anchors = textElm.querySelectorAll("a");
    const links = Array.from(anchors).map(anchor => {
        anchor.textContent = anchor.href;
        return {
            title: anchor.href,
            url: anchor.href,
        }
    });

    return {
        url,
        userName,
        userId,
        text: textElm.textContent,
        images,
        links,
        date,
    }
}
