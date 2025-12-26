interface DataType {
    title: string;
    date: string;
    body: string;
    category: string;
    tags: string[];
}

export function parseCatMemoNote(rootPath: string) {
    const data: DataType[] = [];

    const dirs = Deno.readDirSync(rootPath);
    for (const dir of dirs) {
        if (dir.isDirectory) {
            const dirPath = rootPath + "/" + dir.name;
            const files = Deno.readDirSync(dirPath);
            for (const file of files) {
                if (!file.name.endsWith(".txt")) continue;

                const filePath = dirPath + '/' + file.name;
                const stat = Deno.statSync(filePath);
                const txt = Deno.readTextFileSync(filePath);
                // const decoder = new TextDecoder("shift-jis");
                // const str = decoder.decode(txt);
                if (!txt) continue;
                const date = (stat.mtime as Date).toLocaleString("ja", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })
                data.push({
                    title: file.name.replace(/\.txt$/, ""),
                    date,
                    body: txt.replace(/\r\n/g, "\n"),
                    category: dir.name,
                    tags: [],
                })
            }
        }
    }

    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return data;
}

function convertXTMemoToData(text: string, category: string) {
    const split = text.trim().replace(/\r\n/g, "\n").split("\n\n").filter(v => v);
    const map = split.map(str => {
        const spl = str.trim().split("\n");
        const shift = spl.shift() as string;
        const match = shift.match(/(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}) (.*?: )?(.*)/);
        if (!match) return undefined;
        const date = match[1];
        const tags = match[2] ? match[2].replace(/: $/, "").split(" ") : [];
        const title = match[3];
        const lines = spl.map(v => v.replace(/^\t/, ""));
        const obj: DataType = { title, date, body: lines.join("\n"), category, tags };
        return obj;
    })
    return map.filter(v => v) as DataType[];
}

export function parseXTMemo(rootPath: string) {
    const data = [];

    const files = Deno.readDirSync(rootPath);
    for (const file of files) {
        if (file.name.endsWith(".txt")) {
            const txt = Deno.readFileSync(rootPath + '/' + file.name);
            const decoder = new TextDecoder("shift-jis");
            const str = decoder.decode(txt);
            const arr = convertXTMemoToData(str, file.name.replace(/\.txt$/, ""));
            data.push(...arr);
        }
    }

    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return data;
}

export function convertXTMemoDiaryToText(jsonPath: string) {
    const data = JSON.parse(jsonPath) as DataType[];

    const filter = data.filter(obj => obj.category === "ChangeLog" && obj.tags.includes("Daily"));
    const map = filter.map(obj => {
        return `${obj.title}(${obj.date})\n${obj.body}`;
    })
    const text = map.join("\n\n\n---\n\n\n");
    return text;
}
