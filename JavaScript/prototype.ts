type DateDataObjectOld = {
    yyyy: number,
    yy: string,
    m: number,
    mm: string,
    d: number,
    dd: string,
    h: number,
    hh: string,
    n: number,
    nn: string,
    s: number,
    ss: string,
    day: number,
}
type DateDataObject = {
    YYYY: number,
    YY: string,
    M: number,
    MM: string,
    D: number,
    DD: string,
    h: number,
    hh: string,
    m: number,
    mm: string,
    s: number,
    ss: string,
    day: number,
}

type SortOption = {
    key?: string;
    isAscending?: boolean;
    isDescending?: boolean;
    isDate?: boolean;
    isLocale?: boolean;
}

declare global {
    interface String {
        toClipboard(needsAlert?: boolean): this;
        convertLinkToHTML(): string;
        convertScrapboxToMarkdown(): string;
        convertMarkdownToScrapbox(): string;
        searchEx(searchWords: string): boolean;
        removeComment(type?: string[]): string;
        replaceInvalidFilenameCharacters(): string;
        /** 文字列の先頭を大文字にする */
        capitalize(): string;
        /** 指定した文字列の個数を数える */
        count(character: string): number;
    }
    interface Array<T> {
        cycle(index: number): any;
        getRandom(num: number): any[];
        /**
         * @param option SortOption = {
         *     key?: string;
         *     isAscending?: boolean;
         *     isDescending?: boolean;
         *     isDate?: boolean;
         *     isLocale?: boolean;
         * }
         */
        sortEx(option: SortOption): this;
        changeOrder(index1: number, index2: number): this;
        search(text: string, keys?: string[], stringify?: boolean): any[];
        removeDuplicatesAndSort(): any[];
    }
    interface ArrayConstructor {
        /** 2つの配列の共通要素を配列で返す */
        getCommonElement(arr1: any[], arr2: any[]): any[];
    }
    interface Date {
        clearTime(): Date;
        getDayOfYear(): number;
        getWeekOfYear(): number;
        getDataObjectOld(): DateDataObjectOld;
        getDataObject(): DateDataObject;
        createNoid(): string;
        /** 旧版 formatStringを使うこと */
        format(format: string): string;
        /** 既定値は YYYY-MM-DDThh:mm:ss */
        formatString(format: string): string;
        getUnixTime(): number;
        /** 一日の最初と最後のUnix時間を取得する */
        getUnixTimeRange(): {
            since: number;
            until: number;
        };
    }
    interface DateConstructor {
        compare(since: Date, until: Date, unit: 'date' | 'month' | 'year' | 'hour' | 'minute'): number;
        getWeek(year: number, week: number): Date[];
    }
    interface Math {
        randomInteger(min: number, max: number): number;
    }
}

String.prototype.toClipboard = function (needsAlert = false) {
    const txt = this.toString();
    navigator.clipboard.writeText(txt)
        .then(() => {
            const display = (num: number) => txt.length < num ? txt : txt.slice(0, num) + '…';
            console.group('Copied to clipboard');
            console.log(display(100));
            console.groupEnd();
            if (needsAlert) alert(`クリップボードにコピーしました。\n\n${display(30)}`);
        })
        .catch(err => {
            console.log('Something went wrong', err);
            if (needsAlert) alert('コピーできませんでした。');
        })
    return this;
}

String.prototype.convertLinkToHTML = function () {
    let text = this.toString();
    const arr: { regexp: RegExp, func: (...params: string[]) => string }[] = [
        { // [title](url) → aタグ
            regexp: /\[([^\]]+)\]\(((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\)/g,
            func(_match, title, url, _h, _href) { return `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>` },
        },
        { // [title url] → aタグ
            regexp: /\[([^\]]+) ((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]/g,
            func(_match, title, url, _h, _href) { return `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>` },
        },
        { // [url title] → aタグ
            regexp: /\[((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+)) ([^\]]+)\]/g,
            func(_match, url, _h, _href, title) { return `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>` },
        },
        { // [gyazo] → imgタグ
            regexp: /\[((h?)(ttps?:\/\/gyazo.com\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]/g,
            func(_match, url, _h, _href) { return `<img src="${url}/raw">` },
        },
        { // [url] → imgタグ
            regexp: /\[((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]/g,
            func(_match, url, _h, _href) { return `<img src="${url}">` },
        },
    ]
    for (const obj of arr) {
        text = text.replace(obj.regexp, obj.func);
    }
    return text;
}

String.prototype.convertScrapboxToMarkdown = function () {
    let text = this.replace(/\[/g, '[[').replace(/\]/g, ']]'); // []だと処理済みリンクと区別できなくなるため
    const arr: { regexp: RegExp, func: (...params: string[]) => string }[] = [
        { // [[title url]]になっているリンクを修正する
            regexp: /\[\[([^\]]+) ((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]\]/g,
            func(_match, title, url, _h, _href) { return `[${title}](${url})` },
        },
        { //[[url title]]
            regexp: /\[\[((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+)) ([^\]]+)\]\]/g,
            func(_match, url, _h, _href, title) { return `[${title}](${url})` },
        },
        { // gyazo
            regexp: /\[\[((h?)(ttps?:\/\/gyazo.com\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]\]/g,
            func(_match, url, _h, _href) { return `![](${url}/raw)` },
        },
        { // ハッシュタグ
            regexp: /(^|\s)#([^\s$]+)(\s|$)/g,
            func(_match, _head, tag, _foot) { return ` [[${tag}]] ` },
        },
        { // 他プロジェクトへのページリンク
            regexp: /\[\[\/([^\]]+)\]\]/g,
            func(_match, link) { return `▶${link}` },
        },
        { // 太字のみ
            regexp: /\[\[(\*+)\s(\S+)\]\]/g,
            func(_match, strong, text) { return `<b data-bold="${strong.length}">${text}</b>` }
        },
        { // 太字以外を含む文字修飾
            regexp: /\[\[([!"#%&'()*+,-./{|}<>_~]+)\s(\S+)\]\]/g,
            func(_match, deco, text) { return `<span data-deco="${deco}">${text}</span>` }
        },
        { // ![]()にダブルブラケット
            regexp: /\[\[(!\[\S*\([^)]*\))\]\]/g,
            func(_match, link) { return link }
        },
        { //[[画像url]]→![]()
            regexp: /\[\[((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))(\.(jpg|jpeg|png|bmp|gif|JPG|JPEG))\]\]/g,
            func(_match, url, _h, _href, ex) { return `![](${url}${ex})` },
        },
        { //[[https://www.youtube.com/~]]→ブラケットを外す
            regexp: /\[\[((h?)(ttps?:\/\/www\.youtube\.com\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\]\]/g,
            func(_match, url, _h, _href) { return url },
        },
    ]
    for (const obj of arr) {
        text = text.replace(obj.regexp, obj.func);
    }
    return text;
}

String.prototype.convertMarkdownToScrapbox = function () {
    let text = this.toString();
    text = text.replace(
        /!\[([^\]]+)\]\(((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\)/g,
        (_match, _title, url, _h, _href) => `[[${url}]]`
    ).replace(
        /\[([^\]]+)\]\(((h?)(ttps?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))\)/g,
        (_match, title, url, _h, _href) => `[${title} ${url}]`
    ).replace(
        /\[\[(.+?)\]\]/g,
        (_match, title) => `[${title}]`
    ).replace(
        /\t*\|/g,
        '\t'
    ).replace(
        /^#+ (.*)/g,
        (_match, title) => `[** ${title}]`
    ).replace(
        /^( *)- /g,
        (_match, space) => `${'\t'.repeat(space.count(' ') / 2 + 1)}`
    ).replace(
        /(( |　|\t)+)$/,
        ''
    )

    return text;
}

String.prototype.searchEx = function (searchWords: string) {
    let isIncluded = false;
    const text = this.toString();
    if (!searchWords.startsWith(' ')) { // AND検索（半角スペース始まりでない）
        for (let word of searchWords.split(/\s/).sort((a, b) => a.startsWith('-') && !b.startsWith('-') ? 1 : -1)) {
            if (!word.startsWith('-')) { // AND
                if (text.includes(word)) {
                    isIncluded = true;
                } else {
                    isIncluded = false;
                    break;
                }
            } else { // NOT
                word = word.replace(/^-/, '');
                if (text.includes(word)) {
                    isIncluded = false;
                    break;
                }
            }
        }
    } else { // OR検索（半角スペース始まり）
        for (let word of searchWords.split(/\s/).sort((a, b) => a.startsWith('-') && !b.startsWith('-') ? 1 : -1)) {
            if (!word.startsWith('-')) { // AND
                if (text.includes(word)) {
                    isIncluded = true;
                }
            } else { // NOT
                word = word.replace(/^-/, '');
                if (text.includes(word)) {
                    isIncluded = false;
                    break;
                }
            }
        }
    }
    return isIncluded;
}

String.prototype.removeComment = function (type?: string[]) {
    const str = this.toString();
    if (!type) {
        const regexp = /[\s\t]*\/\*\/?(\n|[^/]|[^*]\/)*\*\/|(^|\s)+\/\/.*/g;
        return str.replace(regexp, '');
    }
    return str;
}

String.prototype.replaceInvalidFilenameCharacters = function () {
    let str = this.toString();
    // \/:*?"<>|
    str = str.replace(/\\/g, '￥');
    str = str.replace(/\//g, '／');
    str = str.replace(/\:/g, '：');
    str = str.replace(/\*/g, '＊');
    str = str.replace(/\?/g, '？');
    str = str.replace(/\"/g, '_');
    str = str.replace(/\</g, '〈');
    str = str.replace(/\>/g, '〉');
    str = str.replace(/\|/g, '｜');
    return str;
}

// 文字列の先頭のみ大文字に変換 | JavaScript逆引き | Webサイト制作支援 | ShanaBrian Website https://shanabrian.com/web/javascript/string-capitalize.php
String.prototype.capitalize = function () {
    const str = this.toString();
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

String.prototype.count = function (character: string) {
    const str = this.toString();
    if (!str) return 0;
    return (str.match(new RegExp(character, "g")) || []).length;
}

Array.prototype.cycle = function (index: number) {
    const i = index % this.length;
    if (i >= 0) {
        return this[i];
    } else {
        return this[this.length + i]
    }
}

Array.prototype.getRandom = function (num: number) {
    const n = this.length < num ? this.length : num;
    const result: unknown[] = [];
    for (let i = 0; i < n; i++) {
        const item = this.splice(Math.randomInteger(0, this.length - 1), 1);
        result.push(item[0]);
    }
    return result;
}

Array.prototype.sortEx = function (option: SortOption) {
    const { key, isAscending, isDescending, isDate, isLocale } = option;
    const compareFanc = (function () {
        if (key) {
            if (isDate) {
                return (a: any, b: any) => new Date(a[key]) > new Date(b[key]) ? -1 : 1;
            } else if (isLocale) {
                return (a: any, b: any) => b[key].localeCompare(a[key], 'ja');
            } else {
                return (a: any, b: any) => a[key] > b[key] ? -1 : 1;
            }
        } else {
            if (isDate) {
                return (a: any, b: any) => new Date(a) > new Date(b) ? -1 : 1;
            } else if (isLocale) {
                return (a: any, b: any) => b.localeCompare(a, 'ja');
            } else {
                return (a: any, b: any) => a > b ? -1 : 1;
            }
        }
    })();
    this.sort(compareFanc);
    if (isAscending || isDescending === false) this.reverse();

    return this;
}

Array.prototype.changeOrder = function (index1: number, index2: number) {
    const splice = this.splice(index1, 1);
    this.splice(index2, 0, splice[0]);
    return this;
}

Array.prototype.search = function (text: string, keys?: string[], stringify: boolean = false) {
    // 空白文字区切りでAND検索 -でNOT検索 半角スペース始まりでOR検索
    if (!text) return [];
    const createCallback = (word: string) => {
        if (!word.startsWith('-')) { // AND
            if (keys && keys.length > 0) {
                return (data: { [key: string]: any }) => keys.some(key => data[key].includes(word));
            } else if (stringify) {
                return (data: object) => JSON.stringify(data).includes(word);
            } else {
                return (data: string) => data.includes(word);
            }
        } else { // NOT
            word = word.replace(/^-/, '');
            if (keys && keys.length > 0) {
                return (data: { [key: string]: any }) => keys.every(key => !data[key].includes(word));
            } else if (stringify) {
                return (data: object) => !JSON.stringify(data).includes(word);
            } else {
                return (data: string) => !data.includes(word);
            }
        }
    }
    if (!text.startsWith(' ')) { // AND検索（半角スペース始まりでない）
        let filter = this.slice();
        for (const word of text.split(/\s/).sort((a, b) => a.startsWith('-') && !b.startsWith('-') ? 1 : -1)) {
            filter = filter.filter(createCallback(word));
        }
        return filter;
    } else { // OR検索（半角スペース始まり）
        let filter: any[] = [];
        for (const word of text.replace(/^\s/, '').split(/\s/).sort((a, b) => a.startsWith('-') && !b.startsWith('-') ? 1 : -1)) {
            if (!word.startsWith('-')) { // OR
                filter = filter.concat(this.filter(createCallback(word)));
            } else { // NOT
                filter = filter.filter(createCallback(word));
            }
        }
        return filter;
    }
}

Array.prototype.removeDuplicatesAndSort = function () {
    const countMap = this.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});

    return Object.keys(countMap)
        .sort((a, b) => countMap[b] - countMap[a])
        .map(key => key);
}

Array.getCommonElement = function (arr1: any[], arr2: any[]) {
    const filter = [...arr1, ...arr2].filter(item => arr1.includes(item) && arr2.includes(item));
    return Array.from(new Set(filter));
}

const DIVISOR = 1000 * 60 * 60 * 24; // =86400000 ミリ秒から日数にする

Date.prototype.clearTime = function () {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate());
}

// https://opentechnica.blogspot.com/2012/03/javascript.html
Date.prototype.getDayOfYear = function () {
    const firstDay = new Date(this.getFullYear(), 0, 1);
    return (this.clearTime().getTime() - firstDay.getTime()) / DIVISOR + 1;
};

Date.prototype.getWeekOfYear = function () {
    const firstDay = new Date(this.getFullYear(), 0, 1);
    const offset = firstDay.getDay() - 1;
    const weeks = Math.floor((this.getDayOfYear() + offset) / 7);
    //return (firstDay.getDay() == 0) ? weeks + 1 : weeks;
    return weeks + 1;
};

Date.prototype.getDataObjectOld = function () {
    return {
        yyyy: this.getFullYear(),
        yy: this.getFullYear().toString().slice(-2),
        m: this.getMonth() + 1,
        mm: ('00' + (this.getMonth() + 1)).slice(-2),
        d: this.getDate(),
        dd: ('00' + this.getDate()).slice(-2),
        h: this.getHours(),
        hh: ('00' + this.getHours()).slice(-2),
        n: this.getMinutes(),
        nn: ('00' + this.getMinutes()).slice(-2),
        s: this.getSeconds(),
        ss: ('00' + this.getSeconds()).slice(-2),
        day: this.getDay(),
    }
}
Date.prototype.getDataObject = function () {
    return {
        YYYY: this.getFullYear(),
        YY: this.getFullYear().toString().slice(-2),
        M: this.getMonth() + 1,
        MM: ('00' + (this.getMonth() + 1)).slice(-2),
        D: this.getDate(),
        DD: ('00' + this.getDate()).slice(-2),
        h: this.getHours(),
        hh: ('00' + this.getHours()).slice(-2),
        m: this.getMinutes(),
        mm: ('00' + this.getMinutes()).slice(-2),
        s: this.getSeconds(),
        ss: ('00' + this.getSeconds()).slice(-2),
        day: this.getDay(),
    }
}

Date.prototype.createNoid = function () {
    const str = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    const { yy, m, d, h, n, s } = this.getDataObjectOld();
    return str[Number(yy)] + str[m - 1] + str[d] + str[h] + str[n] + str[s] + this.getMilliseconds();
}

Date.prototype.format = function (format = 'yyyy-mm-ddThh:nn') {
    const { yyyy, yy, mm, m, dd, d, hh, h, nn, n, ss, s } = this.getDataObjectOld();
    return format.replace('yyyy', yyyy.toString()).replace('yy', yy)
        .replace('mm', mm).replace('m', m.toString())
        .replace('dd', dd).replace('d', d.toString())
        .replace('hh', hh).replace('h', h.toString())
        .replace('nn', nn).replace('n', n.toString())
        .replace('ss', ss).replace('s', s.toString())
        .replace('年月日', `${yyyy}年${m}月${d}日`)
        .replace('時分', `${h}時${n}分`)
}


Date.prototype.formatString = function (format = 'YYYY-MM-DDThh:mm:ss') {
    const { YYYY, YY, MM, M, DD, D, hh, h, mm, m, ss, s } = this.getDataObject();
    return format.replace('YYYY', YYYY.toString()).replace('YY', YY)
        .replace('MM', MM).replace('M', M.toString())
        .replace('DD', DD).replace('D', D.toString())
        .replace('hh', hh).replace('h', h.toString())
        .replace('mm', mm).replace('m', m.toString())
        .replace('ss', ss).replace('s', s.toString())
        .replace('年月日', `${YYYY}年${M}月${D}日`)
        .replace('時分', `${h}時${m}分`)
}

Date.prototype.getUnixTime = function () {
    return Math.floor(this.getTime() / 1000);
}

Date.prototype.getUnixTimeRange = function () {
    const date = this.clearTime(); // 時刻以下を0にする
    return {
        since: date.getUnixTime(),
        until: date.getUnixTime() + (24 * 60 * 60) - 1,
    }
}

Date.compare = function (since: Date, until?: Date, unit = 'date') {
    if (!until) until = new Date();
    const diff = until.getTime() - since.getTime();
    switch (unit) {
        case 'minute':
            return Math.floor(diff / 1000 / 60);
        case 'hour':
            return Math.floor(diff / 1000 / 60 / 60);
        case 'date':
            return Math.floor(diff / 1000 / 60 / 60 / 24);
        case 'month':
            return Math.floor(diff / 1000 / 60 / 60 / 24 / (365.25 / 12));
        case 'year':
            return Math.floor(diff / 1000 / 60 / 60 / 24 / 365.25);
        default:
            return 0;
    }
}

Date.getWeek = function (year: number, week: number) {
    // 週の頭＝元日に（週番号-1）*7を足して元日の曜日分戻った日
    const firstDay = new Date(year, 0, 1);
    const offset = (week - 1) * 7 - firstDay.getDay();
    const sunday = new Date(year, 0, firstDay.getDate() + offset);
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
        result.push(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i));
    }
    return result;
}

Math.randomInteger = function (min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min; // 最小値x、最大値yの乱数を作る
}

export { };