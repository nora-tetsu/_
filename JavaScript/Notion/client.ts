import { Client } from "npm:@notionhq/client";
// import { markdownToBlocks, markdownToRichText } from 'npm:@tryfabric/martian';
// import { NotionConverter } from "npm:notion-to-md";
// import { $getPageFullContent, NotionMarkdownConverter } from "npm:@notion-md-converter/core";

type QueryDatabaseRes = Awaited<ReturnType<typeof Client.prototype.databases.query>>;
type Page = QueryDatabaseRes["results"][number];
type Block = Awaited<ReturnType<typeof Client.prototype.blocks.children.list>>["results"][number];
type CreatePageBodyParams = Parameters<typeof Client.prototype.pages.create>[0];

// 2025-09-03バージョンをnpmで利用できないらしいためfetchでAPIを呼び出す
const NOTION_API_URL = "https://api.notion.com/v1";

export class NotionClient {
    client;
    private token;
    constructor(token: string) {
        this.client = new Client({ auth: token, notionVersion: "2025-09-03" });
        this.token = token;
    }
    addPageOnDatabase(database_id: string, prop: CreatePageBodyParams) {
        return this.client.pages.create({
            parent: {
                type: "database_id",
                database_id,
            },
            properties: prop.properties,
            ...(prop.children && { children: prop.children }),
            ...(prop.icon && { icon: prop.icon }),
            ...(prop.cover && { cover: prop.cover }),
        });
    }
    async getPagesOnDatabase(databaseId: string) {
        let allPages: Page[] = [];
        let hasMore = true;
        let cursor: string | null | undefined = undefined;

        while (hasMore) {
            const response = await this.client.databases.query({
                database_id: databaseId,
                start_cursor: cursor as string | undefined,
            });

            allPages = allPages.concat(response.results);
            cursor = response.next_cursor;
            hasMore = response.has_more;
        }

        return allPages;
    }
    async getSource(source_id: string) {
        const res = await fetch(
            `${NOTION_API_URL}/data_sources/${source_id}/`,
            {
                method: "get",
                headers: {
                    "Authorization": `Bearer ${this.token}`,
                    "Notion-Version": "2025-09-03",
                    "Content-Type": "application/json",
                },
            },
        );

        if (!res.ok) {
            throw new Error(`Notion API error: ${res.status}`);
        }

        const data = await res.json();
        return data;
    }
    async getPagesOnSource(data_source_id: string) {
        let allPages: Page[] = [];
        let hasMore = true;
        let cursor: string | null | undefined = undefined;

        while (hasMore) {
            /*
            const response = await this.client.dataSources.query({
                data_source_id,
                start_cursor: cursor as string | undefined,
            });
            */
            const res = await fetch(
                `${NOTION_API_URL}/data_sources/${data_source_id}/query`,
                {
                    method: 'POST',
                    headers: {
                        "Authorization": `Bearer ${this.token}`,
                        "Notion-Version": "2025-09-03",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        start_cursor: cursor,
                        page_size: 100,
                    })
                },
            );

            if (!res.ok) {
                throw new Error(`Notion API error: ${res.status}`);
            }
            const response = await res.json() as QueryDatabaseRes;
            allPages = allPages.concat(response.results);
            cursor = response.next_cursor;
            hasMore = response.has_more;
        }

        return allPages;
    }
    async getPageChildren(fileId: string) {
        let allBlocks: Block[] = [];
        let hasMore = true;
        let cursor: string | null | undefined = undefined;

        while (hasMore) {
            const response = await this.client.blocks.children.list({
                block_id: fileId,
                start_cursor: cursor as string | undefined,
            });

            allBlocks = allBlocks.concat(response.results);
            cursor = response.next_cursor;
            hasMore = response.has_more;
        }

        return allBlocks;
    }
    async getAllDataOnDatabase(databaseId: string) {
        const pages = await this.getPagesOnDatabase(databaseId);
        const roop = async (page: Block) => {
            if (!("has_children" in page) || !("children" in page)) return;
            if (!page.has_children) return;
            const blocks = await this.getPageChildren(page.id);
            for (const block of blocks) {
                roop(block);
            }
            page.children = blocks;
        }
        for (const page of pages) {
            if (!("children" in page)) return;
            const blocks = await this.getPageChildren(page.id);
            for (const block of blocks) {
                roop(block);
            }
            page.children = blocks;
        }
        return pages;
    }
    async getPageProperty(pageId: string, propertyId: string) {
        const res = await this.client.pages.properties.retrieve({
            page_id: pageId,
            property_id: propertyId,
        })
        return res;
    }
    /*
    static pageToMarkdown(pages: QueryDatabaseResponse[]) {
        return new NotionMarkdownConverter().execute(pages);
    }
    static reloadContents(pages: QueryDatabaseResponse[]) {
        return markdownToBlocks(this.pageToMarkdown(pages));
    }
    */
}
