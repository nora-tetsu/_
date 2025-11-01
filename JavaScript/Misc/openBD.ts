
export async function getBookData(ISBN: string | number) {
    try {
        const response = await fetch(`https://api.openbd.jp/v1/get?${new URLSearchParams({
            isbn: ISBN.toString()
        }).toString()}`);
        if (!response.ok) return console.error(`HTTPリクエストに失敗しました。ステータスコード: ${response.status}`);

        const bookData = await response.json();
        const data = bookData[0];
        if (data == null) return console.log("指定されたISBNに対応する書籍情報が見つかりません。");

        const title = data.summary.title;
        const author = data.summary.author;
        const description = data.hanmoto?.kaisetsu105w || "概要はありません。";
        const publisher = data.summary.publisher;
        const pubdate = (data.hanmoto?.dateshuppan?.replace("-", "") || data.summary.pubdate) as string;
        const pubYear = pubdate.substring(0, 4);
        const pubMonth = pubdate.substring(-2, 2);
        const coverUrl = data.summary.cover;

        return {
            title,
            author,
            description,
            publisher,
            pubYear,
            pubMonth,
            coverUrl
        }

    } catch (error) {
        console.error('エラーが発生しました:', error);
    }
}
