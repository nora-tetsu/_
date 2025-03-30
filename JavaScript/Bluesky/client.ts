import AtprotoAPI from "npm:@atproto/api";

type SavedData = {
    text: string,
    createdAt: string,
    isRepost: boolean,
    author: string,
    // 実際には他にもある
}

const { BskyAgent } = AtprotoAPI;

export class Bluesky {
    agent: AtprotoAPI.BskyAgent;
    identifier: string;
    constructor(identifier: string, password: string) {
        const service = "https://bsky.social";
        this.agent = new BskyAgent({ service });
        this.identifier = identifier;
        this.agent.login({ identifier, password });
    }
    async post(text: string) {
        const res = await this.agent.post({
            $type: "app.bsky.feed.post",
            text: text,
            langs: ["ja"]
        })
        console.log('postしました');
        return res;
    }
    private getAllMyPosts(conditionFn?: (data: AtprotoAPI.AppBskyFeedDefs.FeedViewPost[]) => boolean) {
        const agent = this.agent;
        const identifier = this.identifier;
        return getAuthorFeed([], conditionFn);

        // 再帰処理のための関数
        async function getAuthorFeed(feed: AtprotoAPI.AppBskyFeedDefs.FeedViewPost[], conditionFn?: (data: AtprotoAPI.AppBskyFeedDefs.FeedViewPost[]) => boolean, cursor?: string) {
            if (conditionFn && conditionFn(feed)) return feed;
            const timeline = await agent.getAuthorFeed({
                actor: identifier,
                limit: 100,
                cursor,
            })
            if (timeline.success) {
                if (timeline.data.cursor) {
                    return getAuthorFeed([...feed, ...timeline.data.feed], conditionFn, timeline.data.cursor)
                } else {
                    return [...feed, ...timeline.data.feed];
                }
            } else {
                throw new Error('timeline fetch error:' + JSON.stringify(timeline.data));
            }
        }
    }
    private formatFeedData(feed: AtprotoAPI.AppBskyFeedDefs.FeedViewPost[]) {
        feed.sort((a, b) => {
            return new Date(a.post.indexedAt) > new Date(b.post.indexedAt) ? -1 : 1;
        })
        const records = feed.map(data => {
            const obj = Object.assign(data.post.record);
            delete obj.langs;
            delete obj.$type;

            if (data.post.author.handle === this.identifier) {
                return obj;
            } else {
                obj.isRepost = true;
                obj.author = data.post.author.handle;
                return obj;
            }
        });
        return records as SavedData[];
    }
    /**
     * 自分の投稿を全て取得する
     * @param conditionFn 途中で処理を切り上げる条件
     * @returns 
     */
    async getMyPosts(conditionFn?: (data: AtprotoAPI.AppBskyFeedDefs.FeedViewPost[]) => boolean) {
        const feed = await this.getAllMyPosts(conditionFn);
        return this.formatFeedData(feed);
    }
    /**
     * 既存のデータとの差分を追加して返す
     * @param existingFeed 
     */
    async getLastMyPosts(existingFeed: AtprotoAPI.AppBskyFeedDefs.FeedViewPost[]) {
        const conditionFn = (feed: AtprotoAPI.AppBskyFeedDefs.FeedViewPost[]) => feed.some(obj => existingFeed.some(o => o.createdAt === obj.post.indexedAt));
        const feed = await this.getAllMyPosts(conditionFn);
        const filter = feed.filter(obj => !existingFeed.some(o => o.createdAt === obj.post.indexedAt));
        const records = this.formatFeedData(filter);
        const result = [...existingFeed, ...records] as SavedData[];
        result.sort((a, b) => {
            return new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1;
        })
        return result;
    }
}
