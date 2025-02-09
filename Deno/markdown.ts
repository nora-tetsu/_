import Turndown from "npm:turndown";
import { Readability } from "npm:@mozilla/readability";


export function html2markdown(element: HTMLElement) {
    return new Turndown({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
    }).turndown(element);
}

export function getHtmlInfo(element: HTMLElement) {
    return new Readability(element).parse();
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

    const {
        title,
        byline,
        content,
        publishedTime
    } = getHtmlInfo(document.cloneNode(true));

    return {
        title,
        url,
        author: byline,
        html: content,
        markdown: html2markdown(selection || content),
        published: publishedTime,
    }
}

