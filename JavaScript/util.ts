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
