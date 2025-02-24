import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

type DataType = {
    title: string;
    date: string;
    body: string;
    category: string;
    tags: string[];
}

export class OpmlParser {
    title: string;
    private doc: Document;
    private outlines: HTMLElement[] = [];
    constructor(title: string) {
        this.title = title;
        const doc = new DOMParser().parseFromString("<body></body>", "text/html");
        this.doc = doc;
    }
    addOutline(outline: HTMLElement) {
        this.outlines.push(outline);

    }
    private get header() {
        return `<?xml version="1.0" encoding="UTF-8"?>
    <opml version="2.0">
      <head>
        <title>${this.title}</title>
      </head>
      <body>`;
    }
    private footer = `
      </body>
    </opml>`;
    parse(outlines?: HTMLElement[]) {
        const body = this.doc.querySelector("body") as HTMLBodyElement;
        const _outlines = outlines || this.outlines;
        _outlines.forEach(elm => body.appendChild(elm));
        const escaped = body.innerHTML
            .replace(/(?<!&)lt;/g, "&lt;")
            .replace(/(?<!&)gt;/g, "&gt;")
            .replace(/(?<!&)#039;/g, "&#039;")
            .replace(/(?<!&)#x0A;/g, "&#x0A;")
            .replace(/&nbsp;/g, "&#160;")

        return this.header + escaped + this.footer;
    }
    createOutlineElm(content: string, note: string, replaceFunc: (str: string) => string = (t) => t) {
        const outline = this.doc.createElement("outline");
        outline.setAttribute("text", escapeHtml(replaceFunc(content)));
        if (note) outline.setAttribute("_note", escapeHtml(replaceFunc(note)).replace(/\r\n/g, "#x0A;").replace(/\n/g, "#x0A;"));
        return outline;
    }
    parseSimpleData(data: DataType[]) {
        const result: { [key: string]: DataType[] } = {};
        const key: string[] = [];
        const outlines: HTMLElement[] = [];
        data.forEach(obj => {
            if (!key.includes(obj.category)) key.push(obj.category);
            if (result[obj.category]) {
                result[obj.category].push(obj);
            } else {
                result[obj.category] = [obj];
            }
        })
        key.forEach(category => {
            const outline = this.createOutlineElm(category, "");
            result[category].forEach(obj => {
                const note = `${obj.date} ${obj.tags.map(tag => '#' + tag).join(" ")}`;
                const elm = this.createOutlineElm(obj.title, note);
                const bodyElm = this.createOutlineElm("", obj.body);
                elm.appendChild(bodyElm);
                outline.appendChild(elm);
            })
            outlines.push(outline);
        })
        return this.parse(outlines);
    }
    static simpleJsonToOpml(jsonPath: string, outputPath: string, title: string) {
        const json = Deno.readTextFileSync(jsonPath);
        const data = JSON.parse(json) as DataType[];
        const parser = new OpmlParser(title);
        const opml = parser.parseSimpleData(data);
        Deno.writeTextFileSync(outputPath, opml);
        console.log(`Done: ${outputPath}`);
    }
}

/**
 * 自動で処理されないらしい記号の処理 &を付けると&amp;になってしまうので&なしで置換
 */
function escapeHtml(unsafe: string) {
    return unsafe
        //.replace(/&/g, "&amp;") // 自動で処理される
        .replace(/</g, "lt;")
        .replace(/>/g, "gt;")
        //.replace(/"/g, "&quot;") // 自動で処理される
        .replace(/'/g, "#039;");
}
