import { OpmlParser, type DataType } from "../JavaScript/WebAPI/opml.ts";
import { hierarchicalTextToOpml, hierarchicalTextToOutlines } from "../JavaScript/Misc/hierarchicalText.ts";
import { scrapboxJson2Opml, type ScrapboxJson } from "../JavaScript/Scrapbox.ts";

export function simpleJsonToOpml(jsonPath: string, outputPath: string, title: string) {
    const json = Deno.readTextFileSync(jsonPath);
    const data = JSON.parse(json) as DataType[];
    const parser = new OpmlParser(title);
    const opml = parser.parseSimpleData(data);
    Deno.writeTextFileSync(outputPath, opml);
    console.log(`Done: ${outputPath}`);
}

function getDirnameFromPath(path: string) {
    return path.split("/").slice(-2)[0];
}

export function halna2Opml(filename: string, dirPath: string, outputDir: string) {
    if (!dirPath.endsWith("/")) dirPath += "/";
    if (!outputDir.endsWith("/")) outputDir += "/";
    const dirName = getDirnameFromPath(dirPath);
    const text = Deno.readTextFileSync(dirPath + filename);
    const opml = hierarchicalTextToOpml(text, filename);
    Deno.writeTextFileSync(`${outputDir}${dirName}_${filename}.opml`, opml);
    console.log(`Done: ${filename}.opml`);
}

export function halna2OpmlInFolder(dirPath: string, outputDir: string) {
    const files = Deno.readDirSync(dirPath);
    for (const file of files) {
        if (file.isFile && file.name.endsWith(".hol")) {
            halna2Opml(file.name, dirPath, outputDir);
        } else if (file.isDirectory) {
            halna2OpmlInFolder(dirPath + file.name + "/", outputDir);
        }
    }
}

export function halna2OpmlInFolder2(dirPath: string) {
    if (!dirPath.endsWith("/")) dirPath += "/";
    const parser = new OpmlParser("HalnaOutline");
    function roop(dirPath: string) {
        const files = Deno.readDirSync(dirPath);
        for (const file of files) {
            if (file.isFile && file.name.endsWith(".hol")) {
                const text = Deno.readTextFileSync(dirPath + file.name);
                const dirName = getDirnameFromPath(dirPath);
                hierarchicalTextToOutlines(parser, text, dirName + "_" + file.name);
            } else if (file.isDirectory) {
                roop(dirPath + file.name + "/");
            }
        }
    }
    roop(dirPath);
    const opml = parser.parse();
    Deno.writeTextFileSync(`./HalnaOutline.opml`, opml);
    console.log(`Done: ./HalnaOutline.opml`);
}


export function scrapbox2opmlSimple(jsonpath: string) {
    const json = Deno.readTextFileSync(jsonpath);
    const data = JSON.parse(json) as ScrapboxJson;
    const opmlContent = scrapboxJson2Opml.simple(data);
    Deno.writeTextFileSync(`${data.name}.opml`, opmlContent);
    console.log("OPML file generated successfully.");
}
export function scrapbox2opmlComplex(jsonpath: string) {
    const json = Deno.readTextFileSync(jsonpath);
    const data = JSON.parse(json) as ScrapboxJson;
    const opmlContent = scrapboxJson2Opml.complex(data);
    Deno.writeTextFileSync(`${data.name}.opml`, opmlContent);
    console.log("OPML file generated successfully.");
}

