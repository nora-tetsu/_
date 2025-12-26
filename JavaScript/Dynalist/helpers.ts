import type { NodeData } from "./type.ts";

export type NodeID = string;

export interface NodeObject extends NodeData {
    matchesAll(condtion: Partial<NodeData>): boolean;
    matchesAny(condtion: Partial<NodeData>): boolean;
}

// このノードは条件に合うかどうかのチェック
function isMatch(node: NodeData, condition: Partial<NodeData>, or = false) {
    const result: boolean[] = [];
    if (condition.id) {
        result.push(node.id === condition.id);
    }
    if (condition.content) {
        result.push(node.content.includes(condition.content));
    }
    if (condition.note) {
        result.push(node.note.includes(condition.note));
    }
    if (condition.checked !== undefined) {
        result.push(Boolean(node.checked) === condition.checked);
    }
    if (condition.checkbox !== undefined) {
        result.push(Boolean(node.checkbox) === condition.checkbox);
    }
    if (condition.color !== undefined) {
        result.push(node.color === condition.color);
    }
    if (condition.heading !== undefined) {
        result.push(node.heading === condition.heading);
    }
    if (condition.collapsed !== undefined) {
        result.push(Boolean(node.collapsed) === condition.collapsed);
    }

    return or ? result.some(bool => bool === true) : result.every(bool => bool === true);
}


export class NodeDataArray extends Array<NodeObject> {
    pick(id: NodeID) {
        return this.find((d) => d.id === id);
    }
    getParent(childId: NodeID) {
        return this.find((node) => node.children?.includes(childId));
    }
    getChildren(parent: NodeID | NodeObject) {
        const result = new NodeDataArray();

        if (typeof parent === "string") {
            const parentNode = this.pick(parent);
            if (!parentNode) return result;
            parent = parentNode;
        }

        if (!parent.children) return result;

        result.push(...parent.children.map(id => this.pick(id)!));
        return result;
    }
    getAncestors(child: NodeID | NodeObject) {
        const result = new NodeDataArray();

        if (typeof child === "string") {
            const childNode = this.pick(child);
            if (!childNode) return result;
            child = childNode;
        }

        let parent = this.getParent(child.id);
        while (parent) {
            result.push(parent);
            parent = this.getParent(parent.id);
        }
        result.reverse();
        return result;
    }
    /** 条件に一致する子孫ノードを取得する */
    filterDescendants(root: NodeID | NodeObject, condition: Partial<NodeObject>) {
        const result = new NodeDataArray();

        if (typeof root === "string") {
            const rootNode = this.pick(root);
            if (!rootNode) return result;
            root = rootNode;
        }

        const loop = (parent: NodeObject) => {
            if (parent.matchesAll(condition)) result.push(parent);
            this.getChildren(parent).forEach(node => loop(node));
            return;
        }
        loop(root);
        return result;
    }
}

export function parseNodeData(data: NodeData[]) {
    return new NodeDataArray(...data.map(obj => {
        return Object.assign(obj, {
            matchesAll(condition: Partial<NodeData>) {
                return isMatch(obj, condition, false)
            },
            matchesAny(condition: Partial<NodeData>) {
                return isMatch(obj, condition, true)
            },
        })
    }))
}
