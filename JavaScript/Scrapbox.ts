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

function generateOPML(data: ScrapboxJson): string {
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
        const outline = generateOutline(doc, page.title, children);
        body.appendChild(outline);
    });

    return header + body.innerHTML + footer;
}

function generateOutline(doc: Document, text: string, children: string[]): Element {
    const outline = doc.createElement("outline");
    const replaced = text.replace(/\[+([^\]]*gyazo\.com.*?)\]+/g, "![]($1/raw)")
        .replace(/(?<!\!)\[(.*?)\]/g, "$1")
        .replace(/^\s+/g, "");
    outline.setAttribute("text", replaced);

    children.forEach(child => {
        const childOutline = generateOutline(doc, child, []);
        outline.appendChild(childOutline);
    });

    return outline;
}

export async function scrapbox2opml(jsonpath: string) {
    const json = Deno.readTextFileSync(jsonpath);
    const data = JSON.parse(json) as ScrapboxJson;
    const opmlContent = generateOPML(data);
    await Deno.writeTextFile(`${data.name}.opml`, opmlContent);
    console.log("OPML file generated successfully.");
}
