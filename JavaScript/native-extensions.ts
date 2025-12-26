interface DateData {
    year?: number;
    month?: number;
    date?: number;
    hour?: number;
    minute?: number;
    second?: number;
    milliseconds?: number;
}

interface DateFormatStringObject {
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

interface SortOption {
    key?: string;
    isAscending?: boolean;
    isDescending?: boolean;
    isDate?: boolean;
    isLocale?: boolean;
}

declare global {
    interface String {
        searchEx(searchWords: string): boolean;
        removeComment(type?: string[]): string;
        replaceInvalidFilenameCharacters(): string;
        /** 文字列の先頭を大文字にする */
        capitalize(): string;
        /** 指定した文字列の個数を数える */
        count(character: string): number;
    }
    interface Array<T> {
        cycle(index: number): T;
        getRandom(num: number): T[];
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
        search(text: string, keys?: string[], stringify?: boolean): T[];
        removeDuplicatesAndSort(): T[];
    }
    interface ArrayConstructor {
        /** 2つの配列の共通要素を配列で返す */
        getCommonElement<T>(arr1: T[], arr2: T[]): T[];
    }
    interface Date {
        clearTime(): Date;
        getDayOfYear(): number;
        getWeekOfYear(): number;
        getFormattedValue(): DateFormatStringObject;
        /** 既定値は YYYY-MM-DDThh:mm:ss */
        toFormattedString(format?: string): string;
        getUnixTime(): number;
        /** 一日の最初と最後のUnix時間を取得する */
        getUnixTimeRange(): {
            since: number;
            until: number;
        };
        add(yearOrObject: DateData | number, month?: number, date?: number, hour?: number, minute?: number, second?: number): Date;
        subtract(yearOrObject: DateData | number, month?: number, date?: number, hour?: number, minute?: number, second?: number): Date;
    }
    interface DateConstructor {
        compare(since: Date, until: Date, unit: 'date' | 'month' | 'year' | 'hour' | 'minute'): number;
        getWeek(year: number, week: number): Date[];
    }
    interface Math {
        randomInteger(min: number, max: number): number;
    }
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

    this.sort((a, b) => {
        if (key) {
            if (isDate) {
                return new Date(a[key]) > new Date(b[key]) ? -1 : 1;
            } else if (isLocale) {
                return b[key].localeCompare(a[key], 'ja');
            } else {
                return a[key] > b[key] ? -1 : 1;
            }
        } else {
            if (isDate) {
                return new Date(a) > new Date(b) ? -1 : 1;
            } else if (isLocale) {
                return b.localeCompare(a, 'ja');
            } else {
                return a > b ? -1 : 1;
            }
        }

    });
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

Array.getCommonElement = function (arr1, arr2) {
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

Date.prototype.getFormattedValue = function () {
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

Date.prototype.toFormattedString = function (format = 'YYYY-MM-DDThh:mm:ss') {
    const { YYYY, YY, MM, M, DD, D, hh, h, mm, m, ss, s } = this.getFormattedValue();
    return format.replace('YYYY', YYYY.toString()).replace('YY', YY)
        .replace('MM', MM).replace('M', M.toString())
        .replace('DD', DD).replace('D', D.toString())
        .replace('HH', hh).replace('hh', hh).replace('h', h.toString())
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

Date.prototype.add = function (yearOrObject: DateData | number, month?: number, date?: number, hour?: number, minute?: number, second?: number) {
    if (typeof yearOrObject === "number") {
        const year = yearOrObject;
        if (year) this.setFullYear(this.getFullYear() + year);
        if (month) this.setMonth(this.getMonth() + month);
        if (date) this.setDate(this.getDate() + date);
        if (hour) this.setHours(this.getHours() + hour);
        if (minute) this.setMinutes(this.getMinutes() + minute);
        if (second) this.setSeconds(this.getSeconds() + second);
    } else {
        const { year, month: m, date: d, hour: h, minute: n, second: s } = yearOrObject;
        if (year) this.setFullYear(this.getFullYear() + year);
        if (m) this.setMonth(this.getMonth() + m);
        if (d) this.setDate(this.getDate() + d);
        if (h) this.setHours(this.getHours() + h);
        if (n) this.setMinutes(this.getMinutes() + n);
        if (s) this.setSeconds(this.getSeconds() + s);
    }
    return this;
}

Date.prototype.subtract = function (yearOrObject: DateData | number, month?: number, date?: number, hour?: number, minute?: number, second?: number) {
    if (typeof yearOrObject === "number") {
        const year = yearOrObject;
        if (year) this.setFullYear(this.getFullYear() - year);
        if (month) this.setMonth(this.getMonth() - month);
        if (date) this.setDate(this.getDate() - date);
        if (hour) this.setHours(this.getHours() - hour);
        if (minute) this.setMinutes(this.getMinutes() - minute);
        if (second) this.setSeconds(this.getSeconds() - second);
    } else {
        const { year, month: m, date: d, hour: h, minute: n, second: s } = yearOrObject;
        if (year) this.setFullYear(this.getFullYear() - year);
        if (m) this.setMonth(this.getMonth() - m);
        if (d) this.setDate(this.getDate() - d);
        if (h) this.setHours(this.getHours() - h);
        if (n) this.setMinutes(this.getMinutes() - n);
        if (s) this.setSeconds(this.getSeconds() - s);
    }
    return this;
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