import AtprotoAPI from "npm:@atproto/api";

export type BskyFeedViewPost = AtprotoAPI.AppBskyFeedDefs.FeedViewPost;

export type SavedData = {
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
    private password: string;
    private hasLogined = false;
    constructor(identifier: string, password: string) {
        const service = "https://bsky.social";
        this.agent = new BskyAgent({ service });
        this.identifier = identifier;
        this.password = password;
    }
    async login() {
        if (this.hasLogined) return;
        await this.agent.login({ identifier: this.identifier, password: this.password });
        this.hasLogined = true;
    }
    async post(text: string) {
        await this.login();
        const res = await this.agent.post({
            $type: "app.bsky.feed.post",
            text: text,
            langs: ["ja"]
        })
        console.log('postしました');
        return res;
    }
    private async getAllMyPosts(conditionFn?: (data: BskyFeedViewPost[]) => boolean) {
        await this.login();
        const agent = this.agent;
        const identifier = this.identifier;
        return getAuthorFeed([], conditionFn);

        // 再帰処理のための関数
        async function getAuthorFeed(feed: BskyFeedViewPost[], conditionFn?: (data: BskyFeedViewPost[]) => boolean, cursor?: string) {
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
    private formatFeedData(feed: BskyFeedViewPost[]) {
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
    async getMyPosts(conditionFn?: (data: BskyFeedViewPost[]) => boolean) {
        const feed = await this.getAllMyPosts(conditionFn);
        return this.formatFeedData(feed);
    }
    /**
     * 既存のデータとの差分を返す
     * @param existingFeed 
     * @returns 既存データにないポストデータ
     */
    async getLastMyPosts(existingFeed: BskyFeedViewPost[]) {
        const conditionFn = (feed: BskyFeedViewPost[]) => feed.some(obj => existingFeed.some(o => new Date(o.createdAt as string).getTime() === new Date(obj.post.record.createdAt).getTime()));
        const feed = await this.getAllMyPosts(conditionFn);
        const filter = feed.filter(obj => !existingFeed.some(o => new Date(o.createdAt as string).getTime() === new Date(obj.post.record.createdAt).getTime()));
        const records = this.formatFeedData(filter);
        records.sort((a, b) => {
            return new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1;
        })
        return records;
    }
}
