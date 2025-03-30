import { OpmlParser } from "Module/opml.ts";

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

export type ScrapboxJson = {
    name: string;
    displayName: string;
    exported: number;
    users: User[];
    pages: Page[];
};

function generateOPML(data: ScrapboxJson, replaceFunc: (str: string) => string): string {
    const parser = new OpmlParser(data.displayName);
    const outlines = data.pages.map(page => {
        const children = page.lines.slice(1).map(str => str.replace(/^\s+/, match => "\t".repeat(match.length))).filter(str => str);
        const outline = generateOutline(parser, page.title, children, replaceFunc);
        return outline;
    })
    return parser.parse(outlines);
}

function generateOutline(parser: OpmlParser, text: string, children: string[], replaceFunc: (str: string) => string): HTMLElement {
    function createOutline(text: string) {
        return parser.createOutlineElm(text.replace(/^\t*/, ""), "", replaceFunc);
    }

    const outline = createOutline(text);
    const elmArr: { elm: HTMLElement, num: number }[] = new Array(100);
    elmArr[0] = { elm: outline, num: -1 };
    const map = children.map((str, i) => {
        const matchIndent = str.match(/^\t+/);
        let indent = matchIndent && matchIndent[0] ? matchIndent[0].length + 1 : 1;
        if (i === 0) indent = 1;
        return { text: str, indent };
    })

    let previousIndent = 0;
    map.forEach((child, i, arr) => {
        let indent = child.indent;
        const childOutline = createOutline(child.text);
        if (i === 0) {
            outline.appendChild(childOutline);
        } else {
            if (previousIndent < child.indent) {
                indent = previousIndent + 1;
                arr[i].indent = indent;
            }
            elmArr[indent - 1].elm.appendChild(childOutline);
        }
        elmArr[indent] = { elm: childOutline, num: i };
        previousIndent = indent;
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

export const scrapboxJson2Opml = {
    simple: (data: ScrapboxJson) => generateOPML(data, replaceSimple),
    complex: (data: ScrapboxJson) => generateOPML(data, replaceNoratetsu),
    manual: generateOPML,
}
