import { marked } from "https://deno.land/x/marked@1.0.2/mod.ts";
import * as Yaml from "https://deno.land/std@0.207.0/yaml/mod.ts";

const renderer = new marked.Renderer();
renderer.link = ({ href, title, text }) => {
    return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

const parser = (text: string) => marked.parse(text, {
    gfm: true,
    breaks: true,
    renderer,
})

export async function text2MarkdownData(text: string) {
    if (text.startsWith("---")) {
        const split = text.split("---");
        const yaml = split[1].trim();
        const body = split.slice(2).join("---").trim();
        return {
            body,
            marked: await parser(body),
            frontmatter: Yaml.parse(yaml),
        }
    } else {
        return {
            body: text,
            marked: await parser(text),
            frontmatter: null,
        }
    }
}

/**
 * 指定した見出し部分のテキストを取得する（ChatGPT製）
 * @param markdown フロントマターを除く本文部分
 * @param level 取得したい見出しレベル（`#`の数）
 * @param headingText 取得したい見出しテキスト
 * @returns 
 */
export function extractSections(markdown: string, level: number, headingText: string): string[] {
    const lines = markdown.split("\n");
    const targetHeading = "#".repeat(level) + " " + headingText;
    const headingRegex = /^#{1,6}\s+(.*)$/;

    const sections: string[] = [];
    let currentStart: number | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

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

export class MarkdownParser {
    text: string;
    body: string = "";
    marked: string = "";
    frontmatter: unknown = {};
    constructor(text: string) {
        this.text = text;
    }

    /**
     * Markdownをパースして、本文、marked、frontmatterを取得する
     * @returns 
     */
    async init() {
        const { body, marked, frontmatter } = await text2MarkdownData(this.text);
        this.body = body;
        this.marked = marked;
        this.frontmatter = frontmatter;
        return this;
    }

    /**
     * 指定した見出し部分のテキストを取得する
     * @param level 取得したい見出しレベル（`#`の数）
     * @param headingText 取得したい見出しテキスト
     * @returns 
     */
    extractSections(level: number, headingText: string): string[] {
        return extractSections(this.body, level, headingText);
    }
}

