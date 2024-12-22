import { marked } from "https://deno.land/x/marked@1.0.2/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import "../../JavaScript/prototype.ts";
import { DynalistClient } from "./client.ts";
import type { NodeData } from "./type.ts";

export class DynalistDocument {
    nodes: DynalistNode[] = [];
    static async getNodes(token: string, fileId: string) {
        const client = new DynalistClient(token);
        return await client.doc.read(fileId);
    }
    static async build(token: string, fileId: string, childrenGetCondition?: Partial<NodeData>) {
        const instance = new DynalistDocument();
        const nodes = await this.getNodes(token, fileId);
        instance.nodes = nodes.map(node => new DynalistNode(node, instance, childrenGetCondition));
        return instance;
    }
    get currentData() {
        return this.nodes.map(item => item.data).slice();
    }
    get rootNode() {
        return this.nodes.find(item => item.data.id === 'root') as DynalistNode;
    }
    findNode(fn: (node: DynalistNode) => unknown) {
        return this.nodes.find(fn);
    }
    findNodeByUrl(url: string) {
        const id = url.replace(/[^#]*#/, '');
        return this.nodes.find(obj => obj.data.id === id);
    }
    filterNodes(fn: (node: DynalistNode) => unknown) {
        return this.nodes.filter(fn);
    }
    match(query: Partial<NodeData>) {
        return this.nodes.filter(node => {
            let bool = true;
            if (query.id && query.id !== node.data.id) bool = false;
            if (query.content && !node.data.content.includes(query.content)) bool = false;
            if (query.note && !node.data.note.includes(query.note)) bool = false;
            if (query.checked !== undefined && node.data.checked !== query.checked) bool = false;
            if (query.checkbox !== undefined && node.data.checkbox !== query.checkbox) bool = false;
            if (query.color !== undefined && node.data.color !== query.color) bool = false;
            if (query.heading !== undefined && node.data.heading !== query.heading) bool = false;
            return bool;
        })
    }
    writeData(filepath: string) {
        Deno.writeTextFileSync(filepath, JSON.stringify(this.currentData, null, '\t'));
    }
    printData() {
        console.log(this.currentData);
    }
}

/**
 * @param target タイプを確認したい対象
 * @param type 文字列を入れるとタイプを照合してブール値を返し、省略するとタイプを文字列で返す
 */
function checkType(target: unknown, type?: string) {
    const str = Object.prototype.toString.call(target);
    const replace = str.replace(/^\[object ([^\]]*)\]/, '$1');
    if (type) {
        return replace.toLocaleLowerCase() === type.toLocaleLowerCase();
    } else {
        return replace;
    }
}

/**
 * @param target 検索対象の文字列
 * @param condition 検索条件 ^始まりでstartsWith、|始まりで各行先頭を判定
 * @returns 
 */
function isPass(target: string, condition: string | RegExp) {
    const type = checkType(condition);
    if (typeof condition === 'string') {
        if (condition.startsWith('^')) {
            if (target.startsWith(condition.replace(/^\^/, ''))) {
                return true;
            }
        } else if (condition.startsWith('|')) {
            const regexp = new RegExp(`(^|\n)${condition.replace(/^\|/, '')}`, 'g');
            if (target.match(regexp)) {
                return true;
            }
        } else {
            if (target.includes(condition)) {
                return true;
            }
        }
    } else if (type === 'RegExp') {
        if (target.match(condition)) {
            return true;
        }
    }
    return false;
}

// このノードは条件に合うかどうかのチェック
function isMatch(node: NodeData, condition: Partial<NodeData>, or = false) {
    const result: boolean[] = [];
    if (condition.id) {
        result.push(node.id === condition.id);
    }
    if (condition.content) {
        result.push(node.content.includes(condition.content));
    }
    if (condition.note) {
        result.push(node.note.includes(condition.note));
    }
    if (condition.checked !== undefined) {
        result.push(Boolean(node.checked) === condition.checked);
    }
    if (condition.checkbox !== undefined) {
        result.push(Boolean(node.checkbox) === condition.checkbox);
    }
    if (condition.color !== undefined) {
        result.push(node.color === condition.color);
    }
    if (condition.heading !== undefined) {
        result.push(node.heading === condition.heading);
    }
    if (condition.collapsed !== undefined) {
        result.push(Boolean(node.collapsed) === condition.collapsed);
    }

    return or ? result.some(bool => bool === true) : result.every(bool => bool === true);
}

export class DynalistNode {
    data: NodeData;
    private doc: DynalistDocument;
    shouldBeIgnored: boolean; // 無効な項目でないか
    hasChildren: boolean;
    isCodeblock: boolean;
    /** 「|| 」で始まるノードかどうか（子孫項目を箇条書きにするかどうか） */
    isParentOfBullets: boolean;
    /** 「||o 」で始まるノードかどうか（子孫項目を番号付きリストにするかどうか） */
    isParentOfOrderedBullets: boolean;
    /** details要素にすべきか */
    isParentOfDetails: boolean;
    isDetailsOpend: boolean;
    /** table要素にすべきか */
    isParentOfTable: boolean;
    /** 閉じているchildrenを無視すべきか */
    shouldIgnoreCollapsedChildren: boolean;
    /** 本文取得時に自身のcontentも含むべきか */
    shouldIncludeParent: boolean;

    constructor(data: NodeData, doc: DynalistDocument, childrenGetCondition?: Partial<NodeData>) {
        this.data = data;
        this.doc = doc;

        const IGNORE_LIST = ['//'];
        const c = this.data.content;
        this.hasChildren = Boolean(this.data.children && this.data.children.length);
        this.isCodeblock = Boolean(c.match(/^(?:C|c)ode:\s*(.*)/));
        this.shouldBeIgnored = IGNORE_LIST.some(value => c.startsWith(value));
        this.isParentOfBullets = c.startsWith('|| ') || (!this.isCodeblock && this.data.note.includes('<ul>'));
        this.isParentOfOrderedBullets = c.startsWith('||o ') || (!this.isCodeblock && this.data.note.includes('<ol>'));
        this.isParentOfDetails = (c.startsWith('▼ ') || c.startsWith('▲ ')) && this.hasChildren;
        this.isDetailsOpend = c.startsWith('▼ ');
        this.isParentOfTable = c.startsWith('table:') || c.startsWith('Table:');
        this.shouldIgnoreCollapsedChildren = (() => {
            if (this.isParentOfDetails) return false; // Detailsの親の場合は無視しない
            if (childrenGetCondition) {
                return !isMatch(this.data, childrenGetCondition); // 条件に合えば無視しない
            }
            return true;
        })();
        this.shouldIncludeParent = false;
    }
    set includeParent(bool: boolean) { this.shouldIncludeParent = bool };
    get children() {
        const others = this.doc.nodes;
        if (!this.data.children) return [];
        return this.data.children.map(id => others.find(node => node.data.id === id)) as DynalistNode[];
    }
    findChildByContent(condition: string, type: 'starts' | 'ends' | 'includes' = 'starts') {
        return this.children.find(node => {
            switch (type) {
                case 'starts':
                    return node.data.content.startsWith(condition);
                case 'ends':
                    return node.data.content.endsWith(condition);
                case 'includes':
                    return node.data.content.includes(condition);
            }
        })
    }
    /** 条件に合う子孫項目を取得 */
    filterDescendants(query: {
        content?: RegExp | string,
        note?: RegExp | string,
    }) {
        const result: DynalistNode[] = [];
        roop(this);
        return result;

        /** 条件に合うノードに行き当たるまで子孫を検索 */
        function roop(parent: DynalistNode) {
            const { content, note } = parent.data;
            let bool = true;
            query.content && (bool = isPass(content, query.content));
            query.note && (bool = note ? isPass(note, query.note) : false);
            bool && result.push(parent);
            parent.children.forEach(node => roop(node));
            return;
        }
    }
    matchDescendants(condition: Partial<NodeData>) {
        const result: DynalistNode[] = [];
        roop(this);
        return result;

        function roop(parent: DynalistNode) {
            if (isMatch(parent.data, condition)) result.push(parent);
            parent.children.forEach(node => roop(node));
            return;
        }
    }
    getText(type: "plain" | "plainAll" | "markdownEx" | "html") {
        switch (type) {
            case "plain":
                // コメントアウトは除去する
                return this.getLines(true, false).join('\n');
            case "plainAll":
                // コメントアウトも取得する
                return this.getLines(false, true).join('\n');
            case "markdownEx":
                return this.getLinesEx().join('\n');
            case "html":
                return this.convertToHTML(this.getLinesEx().join('\n'));
            default:
                return null;
        }
    }
    getBody(separator = '\n', includeParent = false) {
        this.includeParent = includeParent;
        return this.getLinesEx().join(separator);
    }
    getLines(ignoreComments: boolean, includeNotes: boolean) {
        const result: string[] = [];
        const includeParent = this.shouldIncludeParent;
        roop(this, true);
        function roop(target: DynalistNode, isParent = false) {
            if (!target) return;
            const { note, collapsed } = target.data;
            const { content } = target.data;
            // 無効な項目でないか
            if (ignoreComments && target.shouldBeIgnored) return;
            if (!isParent || includeParent) {
                result.push(content.replace(/^\s$/, ""));
                includeNotes && result.push(note, '\n');
            }

            // 畳んでいる場合は子孫項目を取得しない
            if (!isParent && target.shouldIgnoreCollapsedChildren && collapsed) return;

            // 子孫項目を再帰的に取得
            if (!target.hasChildren) return;
            const children = target.children;
            children.forEach(obj => {
                // 無効な項目でないか
                if (ignoreComments && obj.shouldBeIgnored) return;
                roop(obj);
            })
        }
        return result;
    }
    getLinesEx() {
        const result: string[] = [];
        const includeParent = this.shouldIncludeParent;
        roop(this, true);
        function roop(target: DynalistNode, isParent = false) {
            if (!target) return;
            const { note, collapsed } = target.data;
            let { content } = target.data;
            // 無効な項目でないか
            if (target.shouldBeIgnored) return;
            // 「・」始まりは「- 」に直す
            content = content.replace(/^・/, '- ');

            if (target.isParentOfDetails) { // detailsの時
                result.push(`<details${target.isDetailsOpend ? ' open' : ''}><summary>${content.replace(/^(▼|▲) /, '')}</summary>`);
            } else if (!isParent || includeParent) { // detailsでなく、かつ自身を取得する必要がある時
                // Code:で始まるノードはnote欄を取得
                const match = content.match(/^(?:C|c)ode:\s*(.*)/);
                if (match && note) {
                    const fileName = match[1];
                    if (fileName) {
                        const hasPeriod = fileName.includes('.');
                        const ex = hasPeriod ? fileName.replace(/[^.]+\.(.*)/, '$1') : fileName;
                        result.push('```' + ex);
                        if (hasPeriod) result.push(`// ${fileName}`);
                    } else {
                        result.push('```');
                    }
                    result.push(note);
                    result.push('```');
                } else {
                    if (target.isParentOfBullets) {
                        result.push(content.replace(/^\|\| /, ''));
                    } else if (target.isParentOfOrderedBullets) {
                        result.push(content.replace(/^\|\|o /, ''));
                    } else {
                        result.push(content);
                    }
                }
            }

            // 畳んでいる場合は子孫項目を取得しない（detailsの場合は除く）
            if (!isParent && target.shouldIgnoreCollapsedChildren && collapsed) return;

            // 子孫項目を再帰的に取得
            if (!target.hasChildren) return;
            const children = target.children;
            const indent = content.match(/^(\s*)(-|\d+\.) /); // 箇条書き判定
            children.forEach(obj => {
                if (target.isParentOfTable) return; // table処理は別にやる
                if (obj.shouldBeIgnored) return;
                const child = obj.data;
                let c = child.content;
                const prefix = c.match(/^\s*- /);
                const order = c.match(/^\s*\d+\. /);
                if (target.isParentOfBullets) { // 親項目が「|| 」始まりの時は「- 」をつける
                    if (prefix) {
                        c = c.replace(/^\s*- /, '- ');
                    } else {
                        c = '- ' + c;
                    }
                } else if (target.isParentOfOrderedBullets) { // 親項目が「||n 」始まりの時は「1. 」をつける
                    if (order) {
                        c = c.replace(/^\s*\d+\. /, '1. ');
                    } else {
                        c = '1. ' + c;
                    }
                } else if (indent) { // 親項目にindentがある時は半角スペース×4を足す
                    if (prefix || order) {
                        c = c.replace(/^\s*/, `    ${indent[0]}`);
                    } else {
                        c = `    ${indent[0]}${c}`;
                    }
                }
                child.content = c;
                roop(obj);
            });

            // table処理
            if (target.isParentOfTable) { // table処理
                const getText = (obj: NodeData) => { // contentとnoteを連結する
                    let text = obj.content;
                    if (obj.note) text += "</ br>" + obj.note.replace(/\n/g, "</ br>");
                    return text;
                }
                const getThead = (obj: NodeData) => {
                    return obj.content.replace(/(\|?).*(\|?)/, (_match, left, right) => {
                        return (left && ':') + '---' + (right && ':');
                    });
                }
                children.forEach((node, i) => {
                    const row: string[] = [];
                    row.push(getText(node.data));
                    const nodes = node.children;
                    if (i === 0) {
                        // 見出し行を作る
                        const heading: string[] = [];
                        heading.push(getThead(node.data));
                        nodes.forEach(o => {
                            row.push(o.data.content.replace(/\|?(.*)\|?/, '$1'));
                            heading.push(getThead(o.data));
                        });
                        result.push('|' + row.join('|') + '|');
                        result.push('|' + heading.join('|') + '|');
                    } else {
                        nodes.forEach(o => row.push(getText(o.data)));
                        result.push('|' + row.join('|') + '|');
                    }
                });
            }

            if (target.isParentOfDetails) {
                result.push(`</details>`);
            }

        }
        return result;
    }
    getHTML() {
        return this.convertToHTML(this.getBody('\n'));
    }
    private convertToHTML(text: string) {
        const footnotes: string[] = [];

        const createAnchorHtml = (url: string, title: string, nofollow = false) => {
            return `<a href="${url}" target="_blank" rel="${nofollow ? 'nofollow ' : ''}noopener noreferrer">${title}</a>`;
        }
        const reflectDecoration = (text: string) => {
            text = text.replace(/^===\s*$/, '<span><!--more--></span>')
                .replace(/^---\s*$/, '<hr />')
                .replace(/^・(.*)/, '- $1')
                .replace(/__(.+?)__/g, `<u>$1</u>`)
                .replace(
                    /`([^`]+?)`/g,
                    (_match, str) => str.includes('`') ? str : `<code>${str}</code>`
                )
                .replace(
                    /!\[(.+?)\]\((h?ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+) *\)(?:\{(.+?)\})?/g,
                    (_match, title, url, alt) => `<div class="separator" style="clear: both; text-align: center;"><a href="${url}" imageanchor="1" style="margin-left: 1em; margin-right: 1em;"><img alt="${alt || "画像"}" border="0" src="${url}" width="${title}" /></a></div>`
                )
                .replace(
                    /\[(.+?)\]\((h?ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+) *\)/g,
                    (_match, title, url) => {
                        if (title.startsWith('///')) {
                            return createAnchorHtml(url, title.replace('///', ''), true);
                        } else {
                            return createAnchorHtml(url, title);
                        }
                    }
                )
                .replace(
                    /\[\[\s*https:\/\/dynalist\.io\/d\/[^#]*#.+?=([^\]\s]+?)\s*?\]\]/g,
                    `[[$1]]`
                )
                .replace(
                    /（.+?）/g,
                    (match) => `<span class="bracket">${match}</span>`
                )
                .replace(// 脚注
                    // https://dynalist.io/d/7F7AbyNsJf7K--oz0vtxVZSF#z=_yaThzLWYEcFoW1CK5aOEFEI
                    // <a href='#{脚注ID}'><sup>{脚注番号}</sup></a>
                    // <a name='{脚注ID}'>{脚注番号}</a>: <!--注釈文を記述-->
                    /\{\s*(https:\/\/dynalist\.io\/d\/[^#]*#z=(.+?))\s*\}/g,
                    (_match, _url, id) => {
                        const target = this.doc.findNode(obj => obj.data.id === id);
                        if (!target) return '';
                        const text = target.getBody('<br>', true);
                        const dom = new DOMParser().parseFromString(text, "text/html")!;
                        const findIndex = footnotes.findIndex(str => str.match(`</a>: ${text}</p>`));
                        if (findIndex > -1) { // 既に同じリンクによる脚注がある時
                            return `<a href="#note${findIndex + 1}" title="${dom.body.textContent}"><sup>*${findIndex + 1}</sup></a>`;
                        } else {
                            const number = footnotes.length + 1;
                            footnotes.push(`<p><a name="note${number}">*${number}</a>: ${reflectDecoration(text)}</p>`);
                            return `<a href="#note${number}" title="${dom.body.textContent}"><sup>*${number}</sup></a>`;
                        }
                    }
                )
                .replace(// git gist
                    // <script src="https://gist.github.com/nora-tetsu/5b1b60c5fae705767ddc7318fab7aa3d.js"></script>
                    /<script src="(https:\/\/gist.github.com\/.+?).js"><\/script>/g,
                    (_match, url) => createAnchorHtml(url, url)
                )

            return text;
        }

        const map = text.split('\n').map(line => reflectDecoration(line));
        let result = marked.parse(map.join('\n\n').replace(/\|\n\n\|/g, '|\n|')) as string;
        if (footnotes.length) result += '\n<hr />\n' + footnotes.join('\n');

        // preタグ内の余計な改行を除去
        const dom = new DOMParser().parseFromString(result, "text/html")!;
        const pre = dom.getElementsByTagName('pre');
        pre.forEach(elm => {
            const code = elm.querySelector('code');
            if (code) code.innerHTML = code.innerHTML.trim();
            elm.innerHTML = elm.innerHTML.replace(/\n\n/g, '\n');
        })
        // codeタグ内のbracketタグ、aタグを除去
        const code = dom.getElementsByTagName('code');
        code.forEach(elm => {
            elm.innerHTML = elm.innerHTML.replace(
                new RegExp(`&lt;span class="bracket"&gt;(.+?)&lt;/span&gt;`, 'g'),
                '$1'
            );
            if (elm.parentElement?.tagName !== 'PRE') {
                elm.innerHTML = elm.innerHTML.replace(
                    new RegExp(`<a href="(.+?)".*?>(.+?)</a>`, 'g'),
                    '$1'
                )
            }
            elm.innerHTML = elm.innerHTML.replace(
                /(^|\n) \/\//g,
                '$1//'
            )
        })
        // ブラケットのないURLを別窓で開く
        const a = dom.getElementsByTagName('a');
        a.forEach(elm => {
            const href = elm.getAttribute('href');
            if (!href || href.startsWith('#note')) return;
            elm.setAttribute('target', '_blank');
            elm.setAttribute('rel', 'noopener noreferrer');
        })
        result = dom.body.innerHTML;

        return result;
    }
}

/*
const dynalist = new Dynalist(token);
dynalist.file.list();
*/
