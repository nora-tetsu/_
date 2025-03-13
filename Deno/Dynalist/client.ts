import type { FileData, ChangeFileRequest, NodeData, ChangeContentRequest, SendToInboxRequest } from "./type.ts";

export class DynalistClient {
    token: string;
    constructor(token: string) {
        this.token = token;
    }
    file = {
        list: async () => {
            return await fetch('https://dynalist.io/api/v1/file/list', {
                method: 'POST',
                body: JSON.stringify({
                    token: this.token,
                }),
            })
                .then(response => response.json() as Promise<{
                    _code: string,
                    _msg: string,
                    root_file_id: string,
                    files: FileData[],
                }>)
                .then(json => json.files)
        },
        edit: async (changes: ChangeFileRequest[]) => {
            return await fetch('https://dynalist.io/api/v1/file/edit', {
                method: 'POST',
                body: JSON.stringify({
                    token: this.token,
                    changes: changes,
                }),
            })
                .then(response => response.json() as Promise<{
                    _code: string,
                    _msg: string,
                    results: boolean[],
                    created?: string[],
                }>)
        }
    }
    doc = {
        readOrig: async (fileId: string) => {
            return await fetch('https://dynalist.io/api/v1/doc/read', {
                method: 'POST',
                body: JSON.stringify({
                    token: this.token,
                    'file_id': fileId,
                }),
            })
                .then(response => response.json() as Promise<{
                    _code: string,
                    _msg: string,
                    file_id: string,
                    title: string,
                    version: number,
                    nodes: NodeData[]
                }>)
        },
        read: async (fileId: string) => {
            return this.doc.readOrig(fileId).then(json => json.nodes);
        },
        edit: async (fileId: string, changes: ChangeContentRequest[]) => {
            return await fetch('https://dynalist.io/api/v1/doc/edit', {
                method: 'POST',
                body: JSON.stringify({
                    token: this.token,
                    'file_id': fileId,
                    changes
                }),
            })
                .then(response => response.json() as Promise<{
                    _code: string,
                    _msg: string,
                    new_node_ids: string[],
                }>)
        },
        /** 指定したノードに子項目を追加する
         * indexは0でtop、-1でend */
        insert: async (fileId: string, change: {
            parent_id: string,
            index: number,
            content: string,
            note?: string,
            checked?: boolean,
            checkbox?: boolean,
            heading?: number,
            color?: number,
        }) => {
            const req = Object.assign(change, { action: 'insert' });
            return await this.doc.edit(fileId, [req]);
        },
        /** 指定したノードのプロパティを編集する */
        change: async (fileId: string, change: {
            node_id: string,
            content?: string,
            note?: string,
            checked?: boolean,
            checkbox?: boolean,
            heading?: number,
            color?: number,
        }) => {
            const req = Object.assign(change, { action: 'edit' });
            return await this.doc.edit(fileId, [req]);
        },
        /** 指定したノードを指定したparentノードの子に移動する */
        move: async (fileId: string, change: {
            node_id: string,
            parent_id: string,
            index: number,
        }) => {
            const req = Object.assign(change, { action: 'move' });
            return await this.doc.edit(fileId, [req]);
        },
        /** 指定したノードを削除する */
        delete: async (fileId: string, change: {
            node_id: string,
        }) => {
            const req = Object.assign(change, { action: 'delete' });
            return await this.doc.edit(fileId, [req]);
        },
    }
    inbox = {
        add: async (req: SendToInboxRequest) => {
            req.token = this.token;
            return await fetch('https://dynalist.io/api/v1/inbox/add', {
                method: 'POST',
                body: JSON.stringify(req),
            })
                .then(response => response.json() as Promise<{
                    _code: string,
                    _msg: string,
                    file_id: string,
                    node_id: string,
                    index: number,
                }>)
        }
    }
}
