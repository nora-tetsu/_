import { Client } from "npm:@notionhq/client";
// import { markdownToBlocks, markdownToRichText } from 'npm:@tryfabric/martian';
// import { NotionConverter } from "npm:notion-to-md";
// import { $getPageFullContent, NotionMarkdownConverter } from "npm:@notion-md-converter/core";

type Page = Awaited<ReturnType<typeof Client.prototype.databases.query>>["results"][number];
type Block = Awaited<ReturnType<typeof Client.prototype.blocks.children.list>>["results"][number];
type CreatePageBodyParas = Parameters<typeof Client.prototype.pages.create>[0];

export class NotionClient {
    client;
    constructor(token: string) {
        this.client = new Client({ auth: token, notionVersion: "2025-09-03" });
    }
    addPageOnDatabase(database_id: string, prop: CreatePageBodyParas) {
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
            if (!page.has_children) return;
            const blocks = await this.getPageChildren(page.id);
            for (const block of blocks) {
                roop(block);
            }
            page.children = blocks;
        }
        for (const page of pages) {
            const blocks = await this.getPageChildren(page.id);
            for (const block of blocks) {
                roop(block);
            }
            page.children = blocks;
        }
        return pages;
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
