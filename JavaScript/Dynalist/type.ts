export interface FileData {
    id: string,
    title: string,
    type: 'document' | 'folder',
    permission: number,
    collapsed?: boolean,
    children?: string[],
}

export interface ChangeFileRequest {
    action: 'edit' | 'move' | 'create',
    type: 'document' | 'folder',
    file_id?: string, // edit | move
    parent_id?: string, // move | create
    index?: number, // move | create
    title?: string, // edit | create
}

export interface NodeData {
    id: string,
    content: string,
    note: string,
    checked?: boolean,
    checkbox?: boolean,
    color?: number, // 0~6
    heading?: number, // 0~3
    created: number,
    modified: number,
    collapsed?: boolean,
    children: string[], // idの配列
}

export interface ChangeContentRequest {
    action: string, //'insert' | 'edit' | 'move' | 'delete',
    node_id?: string,
    parent_id?: string,
    index?: number,
    content?: string,
    note?: string,
    checked?: boolean,
    checkbox?: boolean,
    heading?: number,
    color?: number,
}

export interface SendToInboxRequest {
    index: number,
    content: string,
    note?: string,
    checked?: boolean,
    checkbox?: boolean,
    heading?: number,
    color?: number,
    token?: string,
}
