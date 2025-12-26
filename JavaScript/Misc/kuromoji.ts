import { kuromoji } from "https://code4fukui.github.io/kuromoji-es/kuromoji.js";

/*
const tokenizer = await kuromoji.createTokenizer();
const path = tokenizer.tokenize("すもももももももものうち");
console.log(path);
*/
/*
[ {
    word_id: 509800,          // 辞書内での単語ID
    word_type: 'KNOWN',       // 単語タイプ(辞書に登録されている単語ならKNOWN, 未知語ならUNKNOWN)
    word_position: 1,         // 単語の開始位置
    surface_form: '黒文字',    // 表層形
    pos: '名詞',               // 品詞
    pos_detail_1: '一般',      // 品詞細分類1
    pos_detail_2: '*',        // 品詞細分類2
    pos_detail_3: '*',        // 品詞細分類3
    conjugated_type: '*',     // 活用型
    conjugated_form: '*',     // 活用形
    basic_form: '黒文字',      // 基本形
    reading: 'クロモジ',       // 読み
    pronunciation: 'クロモジ'  // 発音
  } ]
*/

interface KuromojiToken {
    word_id: number,          // 辞書内での単語ID
    word_type: string,       // 単語タイプ(辞書に登録されている単語ならKNOWN, 未知語ならUNKNOWN)
    word_position: number,         // 単語の開始位置
    surface_form: string,    // 表層形
    pos: string,               // 品詞
    pos_detail_1: string,      // 品詞細分類1
    pos_detail_2: string,        // 品詞細分類2
    pos_detail_3: string,        // 品詞細分類3
    conjugated_type: string,     // 活用型
    conjugated_form: string,     // 活用形
    basic_form: string,      // 基本形
    reading: string,       // 読み
    pronunciation: string  // 発音
}

const posList = ["名詞", "動詞", "形容詞", "副詞", "未定義語"];

// 以下Copilotからの提案
// 文字列をベクトルに変換する関数
function textToVector(text: string, tokenizer: any) {
    const tokens = tokenizer.tokenize(text).filter((obj: KuromojiToken) => posList.includes(obj.pos));
    const vector: { [key: string]: number } = {};
    tokens.forEach((token: KuromojiToken) => {
        if (vector[token.surface_form]) {
            vector[token.surface_form]++;
        } else {
            vector[token.surface_form] = 1;
        }
    });
    return vector;
}

// コサイン類似度を計算する関数
function cosineSimilarity(vec1: { [key: string]: number }, vec2: { [key: string]: number }) {
    const dotProduct = Object.keys(vec1).reduce((sum, key) => {
        return sum + (vec1[key] * (vec2[key] || 0));
    }, 0);

    const magnitude1 = Math.sqrt(Object.values(vec1).reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(Object.values(vec2).reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitude1 * magnitude2);
}

// 文字列の類似度を測定して並べ替える関数
const tokenizer = await kuromoji.createTokenizer();
export function sortStringsBySimilarity(baseString: string, strings: string[]) {
    const baseVector = textToVector(baseString, tokenizer);
    return strings.map(str => ({
        text: str,
        similarity: cosineSimilarity(baseVector, textToVector(str, tokenizer))
    })).sort((a, b) => b.similarity - a.similarity);
}

/**
 * 文字列の類似度を測定してデータを並べ替える関数
 * @param baseString 基準となる文字列
 * @param data 
 * @returns 類似度順に並んだデータ
 */
export function getSimilarity(baseString: string, data: { id: string, text: string }[]) {
    const baseVector = textToVector(baseString, tokenizer);
    return data.map(d => ({
        id: d.id,
        text: d.text,
        similarity: cosineSimilarity(baseVector, textToVector(d.text, tokenizer))
    })).sort((a, b) => b.similarity - a.similarity);
}

export function createSortedStringsBySimilarity(data: { id: string, text: string }[]) {
    const vectorArray = data.map(obj => textToVector(obj.text, tokenizer));
    return data.map((obj, index) => {
        const similarityArray = vectorArray.map((vector, i) => {
            if (i === index) return;
            return {
                id: data[i].id,
                similarity: cosineSimilarity(vector, vectorArray[index])
            }
        }).filter(Boolean) as { id: string, similarity: number }[];
        similarityArray.sort((a, b) => b.similarity - a.similarity);
        return {
            id: obj.id,
            similar: similarityArray.map(obj => obj.id)
        };
    });
}

/*
// 使用例
const baseString = "基準となる文字列";
const strings = ["文字列1", "hoge", "となり","基準になる文字列"];
sortStringsBySimilarity(baseString, strings).then(sortedStrings => {
    console.log(sortedStrings);
});
*/
