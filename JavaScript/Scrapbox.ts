import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

type User = {
    id: string;
    name: string;
    displayName: string;
    email: string;
};

type Page = {
    title: string;
    created: number;
    updated: number;
    id: string;
    views: number;
    lines: string[];
};

type ScrapboxJson = {
    name: string;
    displayName: string;
    exported: number;
    users: User[];
    pages: Page[];
};

function generateOPML(data: ScrapboxJson, replaceFunc: (str: string) => string): string {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${data.displayName}</title>
  </head>
  <body>`;

    const footer = `
  </body>
</opml>`;
    const doc = new DOMParser().parseFromString("<body></body>", "text/html");
    const body = doc.querySelector("body");
    data.pages.forEach(page => {
        const children = page.lines.slice(1).filter(str => str);
        const outline = generateOutline(doc, page.title, children, replaceFunc);
        body.appendChild(outline);
    });

    return header + body.innerHTML + footer;
}

function generateOutline(doc: Document, text: string, children: string[], replaceFunc: (str: string) => string): Element {
    const outline = doc.createElement("outline");
    outline.setAttribute("text", replaceFunc(text));

    children.forEach(child => {
        const childOutline = generateOutline(doc, child, [], replaceFunc);
        outline.appendChild(childOutline);
    });

    return outline;
}

function replaceSimple(text: string) {
    return text.replace(/\[+([^\]]*gyazo\.com.*?)\]+/g, "![]($1/raw)")
        .replace(/(?<!\!)\[(.*?)\]/g, "$1")
        .replace(/^\s+/g, "");
}

function replaceNoratetsu(text: string) {
    text = text.replace(/\[/g, '[[').replace(/\]/g, ']]'); // []だと処理済みリンクと区別できなくなるため
    const arr: { regexp: RegExp, func: (...params: string[]) => string }[] = [
        { // [[title url]]になっているリンクを修正する
            regexp: /\[\[([^\]]+) ((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]\]/g,
            func(_match, title, url, _h, _href) { return `[${title}](${url})` },
        },
        { //[[url title]]
            regexp: /\[\[((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+)) ([^\]]+)\]\]/g,
            func(_match, url, _h, _href, title) { return `[${title}](${url})` },
        },
        { // gyazo
            regexp: /\[\[((h?)(ttps?:\/\/gyazo.com\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]\]/g,
            func(_match, url, _h, _href) { return `![](${url}/raw)` },
        },
        { // 太字のみ
            regexp: /\[\[(\*+)\s(\S+)\]\]/g,
            func(_match, strong, text) { return `<b data-bold="${strong.length}">${text}</b>` }
        },
        { // 太字以外を含む文字修飾
            regexp: /\[\[([!"#%&'()*+,-./{|}<>_~]+)\s(\S+)\]\]/g,
            func(_match, deco, text) { return `<span data-deco="${deco}">${text}</span>` }
        },
        { // ![]()にダブルブラケット
            regexp: /\[\[(!\[\S*\([^)]*\))\]\]/g,
            func(_match, link) { return link }
        },
        { //[[画像url]]→![]()
            regexp: /\[\[((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))(\.(jpg|jpeg|png|bmp|gif|JPG|JPEG))\]\]/g,
            func(_match, url, _h, _href, ex) { return `![](${url}${ex})` },
        },
        { //[[https://www.youtube.com/~]]→ブラケットを外す
            regexp: /\[\[((h?)(ttps?:\/\/www\.youtube\.com\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]\]/g,
            func(_match, url, _h, _href) { return url },
        },
        {
            regexp: /\[\[nora\.icon\]\]/g,
            func(_match) { return "" },
        },
        {
            regexp: /\[\[(.*?)(\.icon)\]\]/g,
            func(_match, name, _icon) { return `{${name}}` },
        },
    ]
    for (const obj of arr) {
        text = text.replace(obj.regexp, obj.func);
    }
    const replaced = text.split("\n").map(str => str.replace(/^\s+/, match => "\t".repeat(match.length))).join("\n");
    // const replaced = text.replace(/^\s+/, match => "\t".repeat(match.length)); // 行の先頭のスペースをタブに置換
    return replaced;
}

export async function scrapbox2opml(jsonpath: string, replaceFunc: (str: string) => string) {
    const json = Deno.readTextFileSync(jsonpath);
    const data = JSON.parse(json) as ScrapboxJson;
    const opmlContent = generateOPML(data, replaceFunc);
    await Deno.writeTextFile(`${data.name}.opml`, opmlContent);
    console.log("OPML file generated successfully.");
}

export function scrapbox2opmlSimple(jsonpath: string) {
    return scrapbox2opml(jsonpath, replaceSimple);
}
export function scrapbox2opmlComplex(jsonpath: string) {
    return scrapbox2opml(jsonpath, replaceNoratetsu);
}
