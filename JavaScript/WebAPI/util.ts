// deno-lint-ignore-file no-window
import Turndown from "npm:turndown";
import { Readability } from "npm:@mozilla/readability";

declare global {
    interface HTMLElement {
        hide(): void;
        show(): void;
    }
}

HTMLElement.prototype.hide = function () {
    this.classList.add('hidden');
}
HTMLElement.prototype.show = function () {
    this.classList.remove('hidden');
}

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

export function copyToClipboard(txt: string, needsAlert = false) {
    return navigator.clipboard.writeText(txt)
        .then(() => {
            const display = (num: number) => txt.length < num ? txt : txt.slice(0, num) + '…';
            console.group('Copied to clipboard');
            console.log(display(100));
            console.groupEnd();
            if (needsAlert) alert(`クリップボードにコピーしました。\n\n${display(30)}`);
        })
        .catch(err => {
            console.log('Something went wrong', err);
            if (needsAlert) alert('コピーできませんでした。');
        })
}


export function setCaret(target: HTMLElement, length: number) {
    const selection = globalThis.getSelection() as Selection;
    const range = document.createRange();
    const offset = length;
    const child = target.firstChild;
    if (!child) return;
    range.setStart(child, offset);
    range.setEnd(child, offset);
    selection.removeAllRanges();
    selection.addRange(range);
}


/** Turndown */
export function html2markdown(element: string) {
    //element = element.cloneNode(true) as HTMLElement;
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
        if (sel && sel.rangeCount) {
            for (let i = 0, len = sel.rangeCount; i < len; ++i) {
                html += sel.getRangeAt(i).toString();
            }
        }
    }
    /* else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }*/
    return html;
}

export function getArticleInfo() {
    const url = location.href;
    const selection = getSelectionHtml();
    const clonedDocument = document.implementation.createHTMLDocument();
    clonedDocument.documentElement.innerHTML = document.documentElement.outerHTML;
    const readDocument = new Readability(clonedDocument).parse();
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
export const getArticleData = getArticleInfo;


type NodeSearchCondition = {
    text?: string | RegExp;
    note?: string | RegExp;
    url?: string;
}
export type NodeContent = { text: string, note: string }
export class DynalistNodeHtmlParser {
    container: HTMLElement;
    /**
     * 
     * @param container `.Node`要素
     */
    constructor(container: HTMLElement | Element) {
        if (container.classList.contains('Node')) {
            this.container = container as HTMLElement;
        } else {
            this.container = container.closest('.Node') as HTMLElement;
        }
    }
    static getContainer(elm: HTMLElement) {
        const container = elm.closest('.Node') as HTMLElement;
        return new DynalistNodeHtmlParser(container);
    }
    static get nodes() {
        return document.querySelectorAll('.Node') as NodeListOf<HTMLElement>;
    }
    static get root() {
        return new DynalistNodeHtmlParser(this.nodes[0]);
    }
    static filter(condition: NodeSearchCondition, rule: "and" | "or" | "not" = "and") {
        const results: DynalistNodeHtmlParser[] = [];
        if (rule === "and") {
            this.nodes.forEach(node => {
                const parser = new DynalistNodeHtmlParser(node);
                if (condition.text instanceof RegExp && !condition.text.test(parser.text)) return;
                if (condition.note instanceof RegExp && !condition.note.test(parser.note)) return;
                if (condition.url && parser.link.includes(condition.url)) return;
                results.push(parser);
            });
        } else if (rule === "or") {
            this.nodes.forEach(node => {
                const parser = new DynalistNodeHtmlParser(node);
                if (condition.text instanceof RegExp && condition.text.test(parser.text)) {
                    results.push(parser);
                    return;
                }
                if (condition.note instanceof RegExp && condition.note.test(parser.note)) {
                    results.push(parser);
                    return;
                }
                if (condition.url && parser.link.includes(condition.url)) {
                    results.push(parser);
                    return;
                }
            });
        } else if (rule === "not") {
            this.nodes.forEach(node => {
                const parser = new DynalistNodeHtmlParser(node);
                if (condition.text instanceof RegExp && condition.text.test(parser.text)) return;
                if (condition.note instanceof RegExp && condition.note.test(parser.note)) return;
                if (condition.url && parser.link.includes(condition.url)) return;
                results.push(parser);
            });
        }
        return results;
    }
    static find(condition: NodeSearchCondition, rule: "and" | "or" | "not" = "and") {
        return this.filter(condition, rule)[0];
    }
    private get bulletElm() {
        return this.container.querySelector('a.node-line.Node-bullet') as HTMLAnchorElement;
    }
    private get lineElm() {
        return this.container.querySelector('.node-line.needsclick') as HTMLDivElement;
    }
    private get noteElm() {
        return this.container.querySelector('.Node-note.needsclick') as HTMLDivElement;
    }
    private get childrenElm() {
        return this.container.querySelector('.Node-children') as HTMLDivElement;
    }
    get link() {
        return this.bulletElm.href;
    }
    get created() {
        const regexp = /Created at ([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}) on ([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2})/;
        const match = this.bulletElm.title.match(regexp);
        return match ? new Date(match[2] + ' ' + match[1]) : undefined;
    }
    get edited() {
        const regexp = /edited at ([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}) on ([0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2})/;
        const match = this.bulletElm.title.match(regexp);
        return match ? new Date(match[2] + ' ' + match[1]) : undefined;
    }
    get text() {
        return this.lineElm && this.lineElm.textContent ? this.lineElm.textContent : "";
    }
    get note() {
        return this.noteElm && this.noteElm.textContent ? this.noteElm.textContent : "";
    }
    get contents() {
        const result: NodeContent[] = [];
        result.push({ text: this.text, note: this.note });
        const childrenNodes = this.childrenElm.querySelectorAll('.Node') as NodeListOf<HTMLElement>;
        childrenNodes.forEach(childNode => {
            const parser = new DynalistNodeHtmlParser(childNode);
            result.push({ text: parser.text, note: parser.note });
        });
        return result;
    }
}

/**
 * ツイートの情報を取得する
 * @param {HTMLElement} container 
 * @returns 
 */
export async function getTweetInfo(container: HTMLElement) {
    container = container.cloneNode(true) as HTMLElement;
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

    const textElm = container.querySelector(`[data-testid="tweetText"]`) as HTMLDivElement | null;
    if (textElm) emoji2alt(textElm);

    const imgElms = container.querySelectorAll(`[data-testid="tweetPhoto"]`);
    const images = Array.from(imgElms).map(elm => {
        const img = elm.querySelector("img");
        if (!img) return;
        return img.src.replace(/\?format=([^&]*).*/, ".$1");
    }).filter(Boolean) as string[];

    const links = !textElm ? [] : await Promise.all(Array.from(textElm.querySelectorAll("a")).map(async (anchor) => {
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
        text: textElm && textElm.textContent ? textElm.textContent : "",
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
    container = container.cloneNode(true) as HTMLElement;
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
