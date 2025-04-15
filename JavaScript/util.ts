export class UnixTime {
  unix: number;
  constructor(unix: number | Date) {
    if (unix instanceof Date) {
      unix = Math.floor(unix.getTime() / 1000);
    }
    this.unix = unix;
  }
  get Date() {
    return new Date(this.unix * 1000);
  }
  get year() {
    return this.Date.getFullYear();
  }
  get month() {
    return this.Date.getMonth() + 1;
  }
  get date() {
    return this.Date.getDate();
  }
  get hour() {
    return this.Date.getHours();
  }
  get minute() {
    return this.Date.getMinutes();
  }
  get second() {
    return this.Date.getSeconds();
  }
  getDateString(withTime = true) {
    const f = (num: number) => ("00" + num).slice(-2);
    if (withTime) {
      return `${this.year}/${f(this.month)}/${f(this.date)} ${f(this.hour)}:${f(this.minute)
        }`;
    } else {
      return `${this.year}/${f(this.month)}/${f(this.date)}`;
    }
  }
  getJpDateString() {
    return this.Date.toLocaleString("sv-SE", {
      timeZone: "Asia/Tokyo",
    }).replace(" ", "T") + "+09:00";
  }
  isIncluded(year: string, month: string) {
    const target = this.Date;
    const y = Number(year);
    const m = Number(month);
    const start = new Date();
    start.setFullYear(y);
    start.setMonth(m - 1);
    start.setDate(1);
    const end = new Date();
    end.setFullYear(y);
    end.setMonth(m);
    end.setDate(1);
    return (target >= start) && (target < end);
  }
  /**
   * numが正の場合は○後より手前、負の場合は○前より後の時true
   * @param num
   * @param type
   * @param target
   * @returns
   */
  within(
    num: number,
    type: "year" | "month" | "date" | "hour" | "minute" | "second",
    target = new Date(),
  ) {
    switch (type) {
      case "year":
        target.setFullYear(target.getFullYear() + num);
        break;
      case "month":
        target.setMonth(target.getMonth() + num);
        break;
      case "date":
        target.setDate(target.getDate() + num);
        break;
      case "hour":
        target.setHours(target.getHours() + num);
        break;
      case "minute":
        target.setMinutes(target.getMinutes() + num);
        break;
      case "second":
        target.setSeconds(target.getSeconds() + num);
        break;
      default:
    }
    return num > 0 ? this.Date < target : this.Date > target;
  }
  static getNewUnixId(idList: number[], date = new Date()) {
    let unix = Math.floor(date.getTime() / 1000);
    const find = (unix: number) => idList.includes(unix);
    while (find(unix)) {
      unix++;
      if (!find(unix)) break;
    }
    return unix;
  }
}

export function random(x: number, y: number) {
  return Math.floor(Math.random() * (y - x + 1)) + x; // 最小値x、最大値yの乱数を作る
}

// https://qiita.com/fernet/items/a99928e73c8daca6f6af
function compile(cond: string[][]) {
  const joinAnd = (arr: string[]) =>
    `^(?=[\\s\\S]*${arr.join(")(?=[\\s\\S]*")})`;
  const joinOr = (arr: string[]) => `(?:${arr.join("|")})`;
  const escape = (str: string) => str.replace(/(?=[(){}\[\].*\\^$?])/, "\\");
  let rx = joinOr(cond.map((inner) => joinAnd(inner.map(escape))));
  rx = rx.replace(/=\[\\s\\S\]\*-/g, "![\\s\\S]*");
  return new RegExp(rx);
}

export function search(target: string | string[], condition: string) {
  const cond = ((text: string) => {
    const cond: string[][] = [];
    const or = text.trim().split(/\s+OR\s+/);
    or.forEach((str) => {
      if (str) cond.push(str.toLocaleLowerCase().split(/\s+/));
    });
    return cond;
  })(condition);

  if (typeof target === "string") {
    return compile(cond).test(target.toLocaleLowerCase());
  } else {
    const map = target.map((v) => v.toLocaleLowerCase());
    const or: string[][] = [];
    const not: string[] = [];
    cond.forEach((arr) => {
      or.push(arr.filter((v) => !v.startsWith("-")));
      not.push(...arr.filter((v) => v.startsWith("-")));
    });

    // NOTは位置に関係なく除外
    if (map.some((str) => not.some((v) => str.includes(v.replace(/^-/, ""))))) {
      return false;
    }

    return or.some((arr) => {
      return arr.every((v) => {
        return map.some((str) => str.includes(v));
      });
    });
  }
}

/*
二つの文字列の共通部分を抽出する

2023/09/21
ChatGPTに聞いて作ってもらったものを元に改良
removeDuplicatesは完全に自作
MyBookmarkManager（Chrome拡張）に組み込んで各ブックマークと関連するものをバーッと出せるようにしたい。
*/

function findCommonBetweenTwo(str1: string, str2: string) {
  const commonSubstrings = [];
  for (let i = 0; i < str1.length; i++) {
    for (let j = 0; j < str2.length; j++) {
      let match = '';
      let x = i;
      let y = j;
      while (x < str1.length && y < str2.length && str1[x] === str2[y]) {
        match += str1[x];
        x++;
        y++;
      }
      if (match.length > 0) {
        commonSubstrings.push(match);
      }
    }
  }
  return Array.from(new Set(commonSubstrings));
}
function findAllCommonSubstrings(strings: string[]): string[] {
  if (strings.length === 0) return [];
  if (strings.length === 1) return [strings[0]];

  let commonSubstrings = findCommonBetweenTwo(strings[0], strings[1]);

  for (let i = 2; i < strings.length; i++) {
    const newCommonSubstrings = [];
    for (const common of commonSubstrings) {
      newCommonSubstrings.push(...findCommonBetweenTwo(common, strings[i]));
    }
    commonSubstrings = Array.from(new Set(newCommonSubstrings));
  }

  return commonSubstrings;
}
function removeDuplicates(array: string[]) {
  const result: string[] = [];
  array.forEach((value, i) => {
    const clone = array.slice();
    clone.splice(i, 1);
    const bool = clone.some(v => v.includes(value)); // 他の候補の一部になっているか
    if (!bool) result.push(value);
  })
  return result;
}
/**
 * 複数の文字列から共通部分を抽出する
 * @param strings 
 * @returns 
 */
export function findCommonStrings(strings: string[]) {
  const commonParts = findAllCommonSubstrings(strings);
  return removeDuplicates(commonParts);
}

/**
 * @param target タイプを確認したい対象
 * @param type 文字列を入れるとタイプを照合してブール値を返し、省略するとタイプを文字列で返す
 */
export function getObjectType(target: unknown, type?: string) {
  const str = Object.prototype.toString.call(target);
  const replace = str.replace(/^\[object ([^\]]*)\]/, '$1');
  if (type) {
    return replace.toLocaleLowerCase() === type.toLocaleLowerCase();
  } else {
    return replace;
  }
}

// Copilot
export function getCleanLink(url: string): string {
  try {
    const urlObj = new URL(url);

    // プロトコル、ホスト、パス名を含むクリーンリンクを作成
    const cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

    return cleanUrl;
  } catch (error) {
    console.error('Invalid URL:', error);
    return '';
  }
}

export function createPath(dirPath: string, filePath: string) {
  dirPath = dirPath.replace(/(.*?)(\/*)$/, "$1") + "/";
  return dirPath + filePath;
}
export function analyzePath(path: string) {
  path = path.replace(/\/$/, "");
  const match = path.match(/(.*?\/)([^/]*)$/);
  return {
    dir: match ? match[1] : path,
    name: match ? match[2] : "", // path.split("/").slice(-2)[0]
  }
}
