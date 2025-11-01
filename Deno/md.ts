/// <reference lib="deno.ns" />
import { OpmlParser } from "../JavaScript/WebAPI/opml.ts";
import { getFilesData } from "./file.ts";
import { text2MarkdownData } from "../JavaScript/markdown.ts";
import { analyzePath, createPath } from "../JavaScript/util.ts"

type DataInfo = {
    filename: string;
    frontmatter: unknown;
    body: string;
    dir: string;
    marked: string;
}

export function getMdFiles(rootPath: string) {
    return getFilesData(rootPath, async (filename: string, txt: string, dirPath: string) => {
        if (!filename.endsWith(".md")) return;
        const { body, marked, frontmatter } = await text2MarkdownData(txt);
        return {
            filename,
            body,
            marked,
            frontmatter,
            dir: dirPath,
        } as DataInfo;
    }).filter(v => v) as DataInfo[];
}

export function mdFilesToOpml(dirPath: string, outputDir = "./", bodyToNote = true) {
    const vault = analyzePath(dirPath).name;
    const parser = new OpmlParser(vault);
    const mdData = getMdFiles(dirPath);
    const parents: { elm: HTMLElement, dir: string }[] = [];
    mdData.forEach(data => {
        const findParent = parents.find(p => p.dir === data.dir);
        let parent: HTMLElement;
        if (findParent) {
            parent = findParent.elm;
        } else {
            parent = parser.createOutlineElm(analyzePath(data.dir).name, "`" + data.dir + "`");
            parents.push({ elm: parent, dir: data.dir });
        }
        const fileOutline = parser.createOutlineElm(data.filename, data.frontmatter);
        parent.appendChild(fileOutline);

        if (bodyToNote) {
            // 子項目に空行作ってノート欄に本文
            const bodyOutline = parser.createOutlineElm("", data.body);
            fileOutline.appendChild(bodyOutline);
        } else {
            // 子項目に本文
            data.body.replace(/\r\n/g, "\n").split("\n").forEach(line => {
                const outline = parser.createOutlineElm(line, "");
                fileOutline.appendChild(outline);
            })
        }
    })

    if (parents.length) {
        const outlines: HTMLElement[] = parents.map(p => p.elm);
        const opml = parser.parse(outlines);
        Deno.writeTextFileSync(createPath(outputDir, `${vault}.opml`), opml);
        console.log(`Done: ${vault}.opml`);
    }
}

export function mdFilesToOpmlPerSubdir(rootPath: string, vault: string) {
    const vaultPath = createPath(rootPath, vault);
    const files = Deno.readDirSync(vaultPath);
    for (const file of files) {
        if (file.isDirectory) {
            if (file.name.startsWith(".")) continue;
            const dir = createPath(vaultPath, file.name);
            mdFilesToOpml(dir, `./${vault}/`);
        }
    }
}
