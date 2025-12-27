import { marked } from "https://deno.land/x/marked@1.0.2/mod.ts";
//import { DOMParser } from "jsr:@b-fuze/deno-dom";
import "../native-extensions.ts";
import { NodeDataArray, type NodeObject } from "./helpers.ts";
import type { NodeData } from "./type.ts";


export class DynalistNodeDataAdapter extends NodeDataArray {
    DOMParser: typeof DOMParser;
    constructor(data: NodeData[], domParser: typeof DOMParser) {
        super();
        this.importNodeData(data);
        this.DOMParser = domParser;
    }
    private condition = {
        hasChildren(node: NodeObject) {
            return Boolean(node.children && node.children.length);
        },
        /** 既定値：contentが「📃」始まりである */
        isNote(node: NodeObject) {
            return node.content.startsWith("📃");
        },
        /** 既定値：contentが「//」始まりである */
        shouldBeIgnored(node: NodeObject) {
            const IGNORE_LIST = ['//'];
            return IGNORE_LIST.some(value => node.content.startsWith(value));
        },
        /** 既定値：contentが「Code:」または「code:」始まりである */
        isCodeblock(node: NodeObject) {
            return Boolean(node.content.match(/^(?:C|c)ode:\s*(.*)/));
        },
        /** 既定値：contentが「|| 」始まりまたはnoteに「<ul>」を含む */
        isParentOfBullets(node: NodeObject) {
            return node.content.startsWith('|| ') || (!this.isCodeblock(node) && node.note.includes('<ul>'));
        },
        /** 既定値：contentが「||o 」始まりまたはnoteに「<ol>」を含む */
        isParentOfOrderedBullets(node: NodeObject) {
            return node.content.startsWith('||o ') || (!this.isCodeblock(node) && node.note.includes('<ol>'));
        },
        /** 既定値：childrenを持ち、contentが「▼ 」または「▲ 」始まり */
        isParentOfDetails(node: NodeObject) {
            return (node.content.startsWith('▼ ') || node.content.startsWith('▲ ')) && this.hasChildren(node);
        },
        /** 既定値：contentが「▼ 」始まり */
        isDetailsOpend(node: NodeObject) {
            return node.content.startsWith('▼ ');
        },
        /** 既定値：contentが「table:」または「Table:」始まり */
        isParentOfTable(node: NodeObject) {
            return node.content.startsWith('table:') || node.content.startsWith('Table:');
        },
        /** 既定値：isParentOfDetailsがfalse */
        shouldIgnoreCollapsedChildren(node: NodeObject) {
            if (this.isParentOfDetails(node)) return false; // Detailsの親の場合は無視しない
            return true;
        },
    }
    setCondition(key: keyof typeof this.condition, condition: (node: NodeObject) => boolean) {
        this.condition[key] = condition;
    }

    // 以下テキスト取得メソッド

    textGetter(data: NodeObject) {
        if (!data) return () => "";
        return (type: "plain" | "plainAll" | "markdownEx" | "html" | "br") => {
            switch (type) {
                case "plain":
                    // コメントアウトは除去する
                    return this.getPlainText(data, false, false).join('\n');
                case "plainAll":
                    // コメントアウトも取得する
                    return this.getPlainText(data, true, true).join('\n');
                case "markdownEx":
                    return this.getMarkedText(data).join('\n');
                case "br":
                    return this.getMarkedText(data, true).join('<br>');
                case "html":
                    return this.convertToHTML(this.getMarkedText(data).join('\n'));
                default:
                    return "";
            }
        }
    }
    private getPlainText(node: NodeObject, includeComments: boolean, includeNotes: boolean, includeParent = false) {
        const result: string[] = [];
        const loop = (target: NodeObject, isParent = false) => {
            if (!target) return;
            const { note, collapsed, content } = target;
            // 無効な項目でないか
            if (!includeComments && this.condition.shouldBeIgnored(target)) return;
            if (!isParent || includeParent) {
                result.push(content.replace(/^\s$/, ""));
                includeNotes && result.push(note, '\n');
            }

            // 畳んでいる場合は子孫項目を取得しない
            if (!isParent && this.condition.shouldIgnoreCollapsedChildren(target) && collapsed) return;

            // 子孫項目を再帰的に取得
            if (!this.condition.hasChildren(target)) return;
            const children = this.getChildren(target);
            children.forEach(obj => {
                // 無効な項目でないか
                if (!includeComments && this.condition.shouldBeIgnored(obj)) return;
                loop(obj);
            })
        }
        loop(node, true);
        return result;
    }
    private getMarkedText(node: NodeObject, includeParent = false) {
        const result: string[] = [];
        const cond = this.condition;
        const loop = (target: NodeObject, isParent = false) => {
            if (!target) return;
            const { note, collapsed } = target;
            let { content } = target;
            // 無効な項目でないか
            if (cond.shouldBeIgnored(target)) return;
            // 「・」始まりは「- 」に直す
            content = content.replace(/^・/, '- ');

            if (cond.isParentOfDetails(target)) { // detailsの時
                result.push(`<details${cond.isDetailsOpend(target) ? ' open' : ''}><summary>${content.replace(/^(▼|▲) /, '')}</summary>`);
            } else if (!isParent || includeParent) { // detailsでなく、かつ自身を取得する必要がある時
                // Code:で始まるノードはnote欄を取得
                const match = content.match(/^(?:C|c)ode:\s*(.*)/);
                if (cond.isNote(target) && note) {
                    result.push(note);
                } else if (match && note) {
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
                    if (cond.isParentOfBullets(target)) {
                        result.push(content.replace(/^\|\| /, ''));
                    } else if (cond.isParentOfOrderedBullets(target)) {
                        result.push(content.replace(/^\|\|o /, ''));
                    } else {
                        result.push(content);
                    }
                }
            }

            // 畳んでいる場合は子孫項目を取得しない（detailsの場合は除く）
            if (!isParent && cond.shouldIgnoreCollapsedChildren(target) && collapsed) return;

            // 子孫項目を再帰的に取得
            if (!cond.hasChildren(target)) return;
            const children = this.getChildren(target);
            const indent = content.match(/^(\s*)(-|\d+\.) /); // 箇条書き判定
            children.forEach(obj => {
                if (cond.isParentOfTable(target)) return; // table処理は別にやる
                if (cond.shouldBeIgnored(obj)) return;
                const child = obj;
                let c = child.content;
                const prefix = c.match(/^\s*- /);
                const order = c.match(/^\s*\d+\. /);
                if (cond.isParentOfBullets(target)) { // 親項目が「|| 」始まりの時は「- 」をつける
                    if (prefix) {
                        c = c.replace(/^\s*- /, '- ');
                    } else {
                        c = '- ' + c;
                    }
                } else if (cond.isParentOfOrderedBullets(target)) { // 親項目が「||n 」始まりの時は「1. 」をつける
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
                loop(obj);
            });

            // table処理
            if (cond.isParentOfTable(target)) { // table処理
                const getText = (obj: NodeObject) => { // contentとnoteを連結する
                    let text = obj.content;
                    if (obj.note) text += "</ br>" + obj.note.replace(/\n/g, "</ br>");
                    return text;
                }
                const getThead = (obj: NodeObject) => {
                    return obj.content.replace(/(\|?).*(\|?)/, (_match, left, right) => {
                        return (left && ':') + '---' + (right && ':');
                    });
                }
                children.forEach((node, i) => {
                    const row: string[] = [];
                    row.push(getText(node));
                    const nodes = this.getChildren(node);
                    if (i === 0) {
                        // 見出し行を作る
                        const heading: string[] = [];
                        heading.push(getThead(node));
                        nodes.forEach(o => {
                            row.push(o.content.replace(/\|?(.*)\|?/, '$1'));
                            heading.push(getThead(o));
                        });
                        result.push('|' + row.join('|') + '|');
                        result.push('|' + heading.join('|') + '|');
                    } else {
                        nodes.forEach(o => row.push(getText(o)));
                        result.push('|' + row.join('|') + '|');
                    }
                });
            }

            if (cond.isParentOfDetails(target)) {
                result.push(`</details>`);
            }

        }
        loop(node, true);
        return result;
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
                        const target = this.find(obj => obj.id === id);
                        if (!target) return '';
                        const text = this.textGetter(target)("br");
                        const dom = new this.DOMParser().parseFromString(text, "text/html")!;
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
        const dom = new this.DOMParser().parseFromString(result, "text/html")!;
        const pre = dom.getElementsByTagName('pre');
        Array.from(pre).forEach(elm => {
            const code = elm.querySelector('code');
            if (code) code.innerHTML = code.innerHTML.trim();
            elm.innerHTML = elm.innerHTML.replace(/\n\n/g, '\n');
        })
        // codeタグ内のbracketタグ、aタグを除去
        const code = dom.getElementsByTagName('code');
        Array.from(code).forEach(elm => {
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
        Array.from(a).forEach(elm => {
            const href = elm.getAttribute('href');
            if (!href || href.startsWith('#note')) return;
            elm.setAttribute('target', '_blank');
            elm.setAttribute('rel', 'noopener noreferrer');
        })
        result = dom.body.innerHTML;

        return result;
    }
}
