import Turndown from "npm:turndown";
import { Readability } from "npm:@mozilla/readability";
import { marked } from "https://deno.land/x/marked@1.0.2/mod.ts";
import * as Yaml from "https://deno.land/std@0.207.0/yaml/mod.ts";

/** Turndown */
export function html2markdown(element: HTMLElement) {
    return new Turndown({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
    }).turndown(element);
}

function getSelectionHtml() {
    let html = "";
    if (typeof window.getSelection != "undefined") {
        const sel = window.getSelection();
        if (sel.rangeCount) {
            const container = document.createElement("div");
            for (let i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    return html;
}

export function getArticleInfo() {
    const url = location.href;
    const selection = getSelectionHtml();
    const readDocument = new Readability(document).parse();
    if (!readDocument) return;

    const {
        title,
        byline,
        content,
        publishedTime
    } = readDocument;

    return {
        title,
        url,
        author: byline,
        html: content,
        markdown: html2markdown(selection || content),
        published: publishedTime,
    }
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
