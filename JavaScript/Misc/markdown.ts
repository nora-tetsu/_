import { marked } from "https://deno.land/x/marked@1.0.2/mod.ts";
import * as Yaml from "https://deno.land/std@0.207.0/yaml/mod.ts";
import TurndownService from "npm:turndown";

/** trim時に行頭字下げなどの全角スペースが除去されるのを防ぐ */
const hundleSpace = {
    refuge: (text: string) => text.replace(/　/g, "‡‡‡"),
    restore: (text: string) => text.replace(/‡{3,}/g, "　"),
}

const renderer = new marked.Renderer();
renderer.link = ({ href, title, text }) => {
    return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

const parser = (text: string) => marked.parse(text, {
    gfm: true,
    breaks: true,
    renderer,
})

export async function parseMarkdownText2Html(text: string) {
    return hundleSpace.restore(await parser(hundleSpace.refuge(text)));
}

export async function parseMdfile(text: string) {
    if (text.startsWith("---")) {
        const split = text.split("---");
        const yaml = split[1].trim();
        const body = split.slice(2).join("---");
        return {
            body,
            marked: await parseMarkdownText2Html(body),
            frontmatter: Yaml.parse(yaml) as Record<string, unknown>,
        }
    } else {
        return {
            body: text,
            marked: await parseMarkdownText2Html(text),
            frontmatter: {},
        }
    }
}

export function html2Markdown(html: string) {
    const turndownService = new TurndownService({
        headingStyle: 'atx',           // 'setext' または 'atx'
        hr: '---',                     // 水平線の記法: '---' または '***' など
        bulletListMarker: '-',         // 箇条書きの記号: '-', '*', '+'
        codeBlockStyle: 'fenced',      // コードブロック: 'indented' または 'fenced'
        emDelimiter: '_',              // イタリック: '_' または '*'
        strongDelimiter: '**',         // ボールド: '**' または '__'
    });
    return turndownService.turndown(html);
}

/**
 * 指定した見出し部分のテキストを取得する（ChatGPT製）
 * @param markdownText フロントマターを除く本文部分
 * @param level 取得したい見出しレベル（`#`の数）
 * @param headingText 取得したい見出しテキスト
 * @returns 
 */
export function pickMarkdownSections(markdownText: string, level: number, headingText: string): string[] {
    const lines = markdownText.split("\n");
    const targetHeading = "#".repeat(level) + " " + headingText;
    const headingRegex = /^#{1,6}\s+(.*)$/;

    const sections: string[] = [];
    let currentStart: number | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 次の対象の見出しが来たとき：前のセクションを閉じる
        if (line === targetHeading) {
            if (currentStart !== null) {
                const section = lines.slice(currentStart, i).join("\n").trim();
                sections.push(section);
            }
            currentStart = i + 1;
            continue;
        }

        // 他の見出し（同レベル以上）でセクションを閉じる
        if (currentStart !== null) {
            const match = line.match(headingRegex);
            if (match) {
                const currentLevel = line.match(/^#+/)![0].length;
                if (currentLevel <= level && line !== targetHeading) {
                    const section = lines.slice(currentStart, i).join("\n").trim();
                    sections.push(section);
                    currentStart = null;
                }
            }
        }
    }

    // 最後のセクションを追加（文末まで）
    if (currentStart !== null) {
        const section = lines.slice(currentStart).join("\n").trim();
        sections.push(section);
    }

    return sections;
}

export class MdfileParser {
    text: string;
    body: string = "";
    html: string = "";
    frontmatter: Record<string, unknown> = {};
    constructor(text: string) {
        this.text = text;
    }

    /**
     * Markdownをパースして、本文、marked、frontmatterを取得する
     * @returns 
     */
    async init() {
        const { body, marked, frontmatter } = await parseMdfile(this.text);
        this.body = body;
        this.html = marked;
        this.frontmatter = frontmatter;
        return this;
    }

    async getHtml() {
        return await parseMarkdownText2Html(this.body);
    }

    /**
     * 指定した見出し部分のテキストを取得する
     * @param level 取得したい見出しレベル（`#`の数）
     * @param headingText 取得したい見出しテキスト
     * @returns 
     */
    pickSections(level: number, headingText: string): string[] {
        return pickMarkdownSections(this.body, level, headingText);
    }

    /**
     * 本文またはフロントマターの変更
     * @param newData 
     * @returns 
     */
    replace(newData: {
        body?: string;
        frontmatter?: Record<string, unknown>;
    }) {
        if (newData.body !== undefined) {
            this.body = newData.body;
        }
        if (newData.frontmatter !== undefined) {
            this.frontmatter = newData.frontmatter;
        }
        const yaml = Yaml.stringify(this.frontmatter);
        const body = this.body;
        this.text = `---\n${yaml}---\n${body}`;
        return this.text;
    }

    /** フロントマターと本文からデータを生成 */
    static getText(frontmatter: Record<string, unknown>, body: string): string {
        const yaml = Yaml.stringify(frontmatter);
        return `---\n${yaml}---\n${body}`;
    }
}

