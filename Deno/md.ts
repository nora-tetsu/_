/// <reference lib="deno.ns" />
import { OpmlParser } from "Module/opml.ts";

type DataInfo = {
    filename: string;
    frontmatter: string;
    body: string;
    dir: string;
}

function getMdData(file: Deno.DirEntry, dirPath: string) {
    const txt = Deno.readTextFileSync(dirPath + file.name);
    if (txt.startsWith("---")) {
        const split = txt.split("---");
        const yaml = split[1].trim();
        const body = split.slice(2).join("---").trim();
        return {
            filename: file.name,
            frontmatter: yaml,
            body,
            dir: dirPath,
        } as DataInfo;
    } else {
        return {
            filename: file.name,
            frontmatter: "",
            body: txt,
            dir: dirPath,
        } as DataInfo;
    }
}

export function getMdFiles(dirPath: string) {
    const result: DataInfo[] = [];
    const files = Deno.readDirSync(dirPath);
    for (const file of files) {
        if (file.isFile && file.name.endsWith(".md")) {
            const fileData = getMdData(file, dirPath);
            result.push(fileData);
        } else if (file.isDirectory) {
            if (file.name.startsWith(".")) continue;
            const dir = dirPath + file.name + "/";
            const childrenData = getMdFiles(dir);
            result.push(...childrenData);
        }
    }
    return result;
}

function getDirnameFromPath(path: string) {
    return path.split("/").slice(-2)[0];
}

export function mdFilesToOpml(dirPath: string, outputDir = "./", bodyToNote = true) {
    if (!dirPath.endsWith("/")) dirPath += "/";
    if (!outputDir.endsWith("/")) outputDir += "/";
    const vault = getDirnameFromPath(dirPath);
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
