
const mime: { [key: string]: string } = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    // 読み取りたいMIMEタイプはここに追記
};
const getMimeType = (pathname: string) => {
    let result = '';
    for (const property in mime) {
        if (pathname.endsWith(property)) result = mime[property];
    }
    return result || 'text/plain';
}

interface FileType { name: string, dir: string }
/**
 * 
 * @param {string} directory アドレス
 * @param {boolean} sub trueならサブディレクトリも対象
 * @param {boolean} isFile trueならファイルリスト、falseならフォルダリスト
 * @param {string|string[]} extension 拡張子（単体か配列で指定）
 * @returns {FileType[]}
 */
function dirToArr(directory: string, sub: boolean, isFile: boolean, extension: string | string[]) { // extension=拡張子
    const all = Array.from(Deno.readDirSync(directory));
    const directories = all.filter((file) => file.isDirectory);
    const result: FileType[] = [];
    if (isFile) {
        const files: string[] = [];
        if (extension && Array.isArray(extension)) {
            all.forEach(file => {
                if (extension.some(ex => file.name.toLocaleLowerCase().endsWith(`.${ex}`))) files.push(file.name);
            })
        } else if (extension && typeof extension == 'string') {
            all.forEach(file => {
                if (file.name.toLocaleLowerCase().endsWith(`.${extension}`)) files.push(file.name);
            })
        } else {
            all.forEach(file => {
                if (!file.isDirectory) files.push(file.name);
            })
        }
        files.forEach((value) => {
            result.push({ name: value, dir: directory });
        })
    } else {
        directories.forEach((file) => {
            result.push({ name: file.name, dir: directory });
        })
    }
    if (sub) {
        directories.forEach(file => {
            result.push(...dirToArr(`${directory}/${file.name}`, sub, isFile, extension));
        })
    }
    return result;
}

function createHandler(indexHtml: string | URL) {
    const handler = async (request: Request): Promise<Response> => {
        console.log("Request:", request.method, request.url);
        const { pathname, search } = new URL(request.url);
        if (pathname === '/') {
            const html = Deno.readFileSync(indexHtml);
            return new Response(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        } else if (request.method === "GET") {
            const data = JSON.stringify({ pathname, search }, null, 2);
            console.log("Request Data:", data);
            /*
              // GET リクエストの場合は、クエリパラメータを返す
              return new Response(data, {
                headers: { "Content-Type": "application/json" },
              });
              */
            const type = getMimeType(pathname);
            return new Response(Deno.readFileSync(pathname.substring(1)), {
                headers: { 'Content-Type': `${type}; charset=utf-8` },
            });
        } else if (request.method === "POST") {
            // POST リクエストの場合は、リクエストボディを返す
            const payload = await request.text();
            let data = JSON.stringify({ pathname, payload }, null, 2);
            switch (pathname) {
                case '/file/write':
                    if (payload.includes('�')) console.warn('writeFile: �が含まれています。');
                    (() => {
                        const { fileName, body } = JSON.parse(payload);
                        Deno.writeTextFileSync(fileName, body);
                        console.log(fileName);
                    })()
                    break;
                case '/file/read':
                    (() => {
                        const fileName = payload;
                        const body = Deno.readTextFileSync(fileName);
                        data = body;
                    })()
                    break;
                case '/file/list':
                    (() => {
                        const { directory, sub, isFile, extension } = JSON.parse(payload);
                        const body = dirToArr(directory, sub, isFile, extension);
                        data = JSON.stringify(body);
                    })()
                    break;
                default: break;
            }
            //const data = JSON.stringify({ pathname, payload }, null, 2);
            //console.log("Request Data:", data);
            return new Response(data, {
                headers: { "Content-Type": "application/json" },
            });
        }
        return new Response("Not Found", { status: 404 });
    };
    return handler;
}

/**
 * @param port ポート番号
 * @param html index.htmlのパス
 */
export function setServer(port: number, html: string) {
    Deno.serve({ port }, createHandler(html));
}
