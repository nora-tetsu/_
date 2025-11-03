
export function random(x: number, y: number) {
    return Math.floor(Math.random() * (y - x + 1)) + x; // 最小値x、最大値yの乱数を作る
}

// https://qiita.com/fernet/items/a99928e73c8daca6f6af
function compile(cond: string[][]) {
    const joinAnd = (arr: string[]) =>
        `^(?=[\\s\\S]*${arr.join(")(?=[\\s\\S]*")})`;
    const joinOr = (arr: string[]) => `(?:${arr.join("|")})`;
    const escape = (str: string) => str.replace(/(?=[(){}\[\].*\\^$?])/, "\\");
    let rx = joinOr(cond.map((inner) => joinAnd(inner.map(escape))));
    rx = rx.replace(/=\[\\s\\S\]\*-/g, "![\\s\\S]*");
    return new RegExp(rx);
}

export function search(target: string | string[], condition: string) {
    const cond = ((text: string) => {
        const cond: string[][] = [];
        const or = text.trim().split(/\s+OR\s+/);
        or.forEach((str) => {
            if (str) cond.push(str.toLocaleLowerCase().split(/\s+/));
        });
        return cond;
    })(condition);

    if (typeof target === "string") {
        return compile(cond).test(target.toLocaleLowerCase());
    } else {
        const map = target.map((v) => v.toLocaleLowerCase());
        const or: string[][] = [];
        const not: string[] = [];
        cond.forEach((arr) => {
            or.push(arr.filter((v) => !v.startsWith("-")));
            not.push(...arr.filter((v) => v.startsWith("-")));
        });

        // NOTは位置に関係なく除外
        if (map.some((str) => not.some((v) => str.includes(v.replace(/^-/, ""))))) {
            return false;
        }

        return or.some((arr) => {
            return arr.every((v) => {
                return map.some((str) => str.includes(v));
            });
        });
    }
}

/*
二つの文字列の共通部分を抽出する

2023/09/21
ChatGPTに聞いて作ってもらったものを元に改良
removeDuplicatesは完全に自作
MyBookmarkManager（Chrome拡張）に組み込んで各ブックマークと関連するものをバーッと出せるようにしたい。
*/

function findCommonBetweenTwo(str1: string, str2: string) {
    const commonSubstrings = [];
    for (let i = 0; i < str1.length; i++) {
        for (let j = 0; j < str2.length; j++) {
            let match = '';
            let x = i;
            let y = j;
            while (x < str1.length && y < str2.length && str1[x] === str2[y]) {
                match += str1[x];
                x++;
                y++;
            }
            if (match.length > 0) {
                commonSubstrings.push(match);
            }
        }
    }
    return Array.from(new Set(commonSubstrings));
}
function findAllCommonSubstrings(strings: string[]): string[] {
    if (strings.length === 0) return [];
    if (strings.length === 1) return [strings[0]];

    let commonSubstrings = findCommonBetweenTwo(strings[0], strings[1]);

    for (let i = 2; i < strings.length; i++) {
        const newCommonSubstrings = [];
        for (const common of commonSubstrings) {
            newCommonSubstrings.push(...findCommonBetweenTwo(common, strings[i]));
        }
        commonSubstrings = Array.from(new Set(newCommonSubstrings));
    }

    return commonSubstrings;
}
function removeDuplicates(array: string[]) {
    const result: string[] = [];
    array.forEach((value, i) => {
        const clone = array.slice();
        clone.splice(i, 1);
        const bool = clone.some(v => v.includes(value)); // 他の候補の一部になっているか
        if (!bool) result.push(value);
    })
    return result;
}
/**
 * 複数の文字列から共通部分を抽出する
 * @param strings 
 * @returns 
 */
export function findCommonStrings(strings: string[]) {
    const commonParts = findAllCommonSubstrings(strings);
    return removeDuplicates(commonParts);
}

/**
 * @param target タイプを確認したい対象
 * @param type 文字列を入れるとタイプを照合してブール値を返し、省略するとタイプを文字列で返す
 */
export function getObjectType(target: unknown, type?: string) {
    const str = Object.prototype.toString.call(target);
    const replace = str.replace(/^\[object ([^\]]*)\]/, '$1');
    if (type) {
        return replace.toLocaleLowerCase() === type.toLocaleLowerCase();
    } else {
        return replace;
    }
}

// Copilot
export function getCleanLink(url: string): string {
    try {
        const urlObj = new URL(url);

        // プロトコル、ホスト、パス名を含むクリーンリンクを作成
        const cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

        return cleanUrl;
    } catch (error) {
        console.error('Invalid URL:', error);
        return '';
    }
}

export function createPath(dirPath: string, filePath: string) {
    dirPath = dirPath.replace(/(.*?)(\/*)$/, "$1") + "/";
    return dirPath + filePath;
}
export function analyzePath(path: string) {
    path = path.replace(/\/$/, "");
    const match = path.match(/(.*?\/)([^/]*)$/);
    return {
        dir: match ? match[1] : path,
        name: match ? match[2] : "", // path.split("/").slice(-2)[0]
    }
}


export function formatLinktext(text: string, type: "cosense2html" | "cosense2markdown" | "markdown2cosense") {
    let result = "";

    const regText = {
        url: "h?ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+",
        gyazo: "h?ttps?:\/\/gyazo.com\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+",
        img: "h?ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+\.(?:jpg|jpeg|png|bmp|gif|JPG|JPEG)",
        youtube: "h?ttps?:\/\/www\.youtube\.com\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+",
    }

    switch (type) {
        case "cosense2html":
            result = convertLinkToHTML(text);
            break;
        case "cosense2markdown":
            result = convertScrapboxToMarkdown(text);
            break;
        case "markdown2cosense":
            result = convertMarkdownToScrapbox(text);
            break;
        default:
            break;
    }

    return result;

    function convertLinkToHTML(text: string) {
        const arr: { regexp: RegExp, func: (...params: string[]) => string }[] = [
            { // [title](url) → aタグ
                regexp: /\[([^\]]+)\]\(((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\)/g,
                func(_match, title, url, _h, _href) { return `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>` },
            },
            { // [title url] → aタグ
                regexp: /\[([^\]]+) ((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]/g,
                func(_match, title, url, _h, _href) { return `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>` },
            },
            { // [url title] → aタグ
                regexp: /\[((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+)) ([^\]]+)\]/g,
                func(_match, url, _h, _href, title) { return `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>` },
            },
            { // [gyazo] → imgタグ
                regexp: /\[((h?)(ttps?:\/\/gyazo.com\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]/g,
                func(_match, url, _h, _href) { return `<img src="${url}/raw">` },
            },
            { // [url] → imgタグ
                regexp: /\[((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]/g,
                func(_match, url, _h, _href) { return `<img src="${url}">` },
            },
        ]
        for (const obj of arr) {
            text = text.replace(obj.regexp, obj.func);
        }
        return text;
    }

    function convertScrapboxToMarkdown(text: string) {
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
            { // ハッシュタグ
                regexp: /(^|\s)#([^\s$]+)(\s|$)/g,
                func(_match, _head, tag, _foot) { return ` [[${tag}]] ` },
            },
            { // 他プロジェクトへのページリンク
                regexp: /\[\[\/([^\]]+)\]\]/g,
                func(_match, link) { return `▶${link}` },
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
        ]
        for (const obj of arr) {
            text = text.replace(obj.regexp, obj.func);
        }
        return text;
    }

    function convertMarkdownToScrapbox(text: string) {
        text = text.replace(
            /!\[([^\]]+)\]\(((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\)/g,
            (_match, _title, url, _h, _href) => `[[${url}]]`
        ).replace(
            /\[([^\]]+)\]\(((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\)/g,
            (_match, title, url, _h, _href) => `[${title} ${url}]`
        ).replace(
            /\[\[(.+?)\]\]/g,
            (_match, title) => `[${title}]`
        ).replace(
            /\t*\|/g,
            '\t'
        ).replace(
            /^#+ (.*)/g,
            (_match, title) => `[** ${title}]`
        ).replace(
            /^( *)- /g,
            (_match, space) => `${'\t'.repeat(space.count(' ') / 2 + 1)}`
        ).replace(
            /(( |　|\t)+)$/,
            ''
        )

        return text;
    }
}
