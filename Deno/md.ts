/// <reference lib="deno.ns" />
import { OpmlParser } from "../JavaScript/opml.ts";
import { getFilesData } from "./file.ts";
import { text2MarkdownData } from "../JavaScript/markdown.ts";
import { analyzePath } from "../JavaScript/util.ts"

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

function getDirnameFromPath(path: string) {
    return path.split("/").slice(-2)[0];
}

export function mdFilesToOpml(dirPath: string, outputDir = "./", bodyToNote = true) {
    if (!dirPath.endsWith("/")) dirPath += "/";
    if (!outputDir.endsWith("/")) outputDir += "/";
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
            parent = parser.createOutlineElm(getDirnameFromPath(data.dir), "`" + data.dir + "`");
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
        Deno.writeTextFileSync(`${outputDir}${vault}.opml`, opml);
        console.log(`Done: ${vault}.opml`);
    }
}

export function mdFilesToOpmlPerSubdir(dirPath: string, vault: string) {
    const files = Deno.readDirSync(dirPath + vault);
    for (const file of files) {
        if (file.isDirectory) {
            if (file.name.startsWith(".")) continue;
            const dir = dirPath + vault + "/" + file.name + "/";
            mdFilesToOpml(dir, `./${vault}/`);
        }
    }
}
