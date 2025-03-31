import { createPath } from "../JavaScript/util.ts";

export function getFilesData<T>(rootPath: string, fileDataGetter: (filename: string, text: string, dirPath: string, stat: Partial<Deno.FileInfo>) => T|Promise<T>) {
    const result: T[] = [];
    const roop = async (path: string) => {
        const files = Deno.readDirSync(path);
        for (const file of files) {
            const dir = createPath(path, file.name);
            if (file.isFile) {
                const text = Deno.readTextFileSync(dir);
                const stat = Deno.statSync(dir);
                const fileData = await fileDataGetter(file.name, text, path, stat);
                result.push(fileData);
            } else if (file.isDirectory) {
                if (file.name.startsWith(".")) continue;
                roop(dir);
            }
        }
    }
    roop(rootPath);
    return result;
}
