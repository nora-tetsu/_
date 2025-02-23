
type DataType = {
    id: number;
    title: string;
    depth: number;
    text: string;
    children: number[];
}

export class HierarchicalText {
    data: DataType[];
    active: number;
    constructor(htext: string) {
        this.data = parse(htext);
        this.active = 0;
    }
    stringify() {
        return convertToText(this.data);
    }
    private createId() {
        let number = 1;
        while (this.data.some(obj => obj.id === number)) {
            number++;
            if (number > 9999999999) break;
        }
        return number;
    }
    private defaultData() {
        return {
            id: this.createId(),
            title: "",
            depth: 1,
            text: "",
            children: [],
        } as DataType;
    }
    private get activeData() {
        const find = this.data.find(obj => obj.id === this.active);
        if (!find) console.error("activeデータが存在しません");
        return find as DataType;
    }
    private get parentData() {
        const find = this.data.find(obj => obj.children.includes(this.active));
        if (!find) console.error("parentデータが存在しません");
        return find as DataType;
    }
    private get index() {
        return this.parentData.children.indexOf(this.active);
    }
    add(place: "parent" | "previous" | "next" | "child") {
        const newData = this.defaultData();
        switch (place) {
            case "parent":
                this.data.push(newData);
                newData.children.push(this.active);
                this.parentData.children.splice(this.index, 1, newData.id);
                newData.depth = this.activeData.depth;
                this.activeData.depth++;
                break;
            case "child":
                this.data.push(newData);
                this.activeData.children.push(newData.id);
                newData.depth = this.activeData.depth + 1;
                break;
            case "next":
                this.data.push(newData);
                this.parentData.children.splice(this.index, 0, newData.id);
                newData.depth = this.activeData.depth;
                break;
            case "previous":
                this.data.push(newData);
                this.parentData.children.splice(this.index - 1, 0, newData.id);
                newData.depth = this.activeData.depth;
                break;
        }
        return newData.id;
    }
    /**
     * 
     * @param fn 除去前に実行するコード
     */
    remove(fn: (data: HierarchicalText) => void) {
        fn(this);

        const roop = (obj: DataType) => {
            obj.children.forEach(id => {
                const find = this.data.find(d => d.id === id);
                if (find) roop(find);
            })
            this.active = obj.id;
            this.parentData.children.splice(this.index, 1);
            const index = this.data.findIndex(o => o === obj);
            this.data.splice(index, 1);
        }
        roop(this.activeData);
    }
}

function parse(htext: string) {
    const rep = htext.replace(/\n(\.+( |\n))/g, "\n<<<>>>$1");
    const split = rep.split("\n<<<>>>").filter(v => v);
    const root = {
        id: 0,
        depth: 0,
        title: "root",
        text: "",
        children: [],
    } as DataType;
    const result: DataType[] = [root];
    split.forEach((v, i) => {
        const match = v.match(/(^\.+) ([^\n]*)\n?(.*)/);
        if (!match) return;
        const id = i + 1;
        const depth = match[1].trim().length;
        const title = match[2];
        const text = match[3];
        const children: number[] = [];
        if (depth > result[i].depth) {
            result[i].children.push(id);
        } else {
            let target = i;
            while (result[target].depth >= depth) {
                target--;
                if (target < 0) break;
            }
            if (target >= 0) result[target].children.push(id);
        }
        result.push({ id, title, depth, text, children });
    });
    return result;
}

function convertToText(master: DataType[]) {
    const root = master.find(obj => obj.id === 0);
    if (!root) return "";
    const result: string[] = [];

    const getPeriod = (len: number) => {
        let t = "";
        for (let i = 0; i < len; i++) {
            t += ".";
        }
        return t;
    }

    roop(root);

    function roop(obj: DataType) {
        if (obj.depth > 0) {
            result.push(getPeriod(obj.depth) + " " + obj.title);
            result.push(obj.text);
        }
        obj.children.forEach(id => {
            const find = master.find(o => o.id === id);
            if (!find) return;
            roop(find);
        })
    }
    return result.join("\n");
}

// 2025/02/23
type Data = {
    id: number
    title: string;
    body: string;
    children: number[];
};

export function parseHierarchicalText(text: string): Data[] {
    const formatted = text.replace(/\n(\.+? )/g, "\nZYXZYXZYX\n$1");
    const nodes = formatted.split("ZYXZYXZYX");
    const data = nodes.map(str => {
        const lines = str.trim().split("\n");
        const match = lines[0].match(/^(\.+) (.*)/) as RegExpMatchArray;
        const depth = match[1].length;
        const title = match[2];
        const body = lines.slice(1).join("\n");
        console.log({ title, body, depth })
        return { title, body, depth }
    })
    const result: Data[] = [];
    const indent: Data[] = new Array(100);
    data.forEach((obj, i) => {
        const d: Data = {
            id: i,
            title: obj.title,
            body: obj.body,
            children: [],
        }
        if (i === 0 || obj.depth === 1) {
            result.push(d);
        } else if (data[i - 1].depth < obj.depth) {
            obj.depth = data[i - 1].depth + 1;
            result[i - 1].children.push(d.id);
        } else {
            indent[obj.depth - 1].children.push(d.id);
        }
        indent[obj.depth] = d;
    })
    return result;
}
/*
// 例:
const input = `. タイトル
任意の本文
本文
本文ここまで
.. 子ノードタイトル
本分
... 孫ノードタイトル
body

.. child
. 兄弟`;

console.log(JSON.stringify(parseText(input), null, 2));
*/
