export interface ImageData {
    "image_id": string, // "8980c52421e452ac3355ca3e5cfe7a0c",
    "permalink_url": string, // "http://gyazo.com/8980c52421e452ac3355ca3e5cfe7a0c",
    "thumb_url": string, // "https://i.gyazo.com/thumb/afaiefnaf.png",
    "url": string,// "https://i.gyazo.com/8980c52421e452ac3355ca3e5cfe7a0c.png",
    "type": string, // "png",
    "created_at": string,// "2014-05-21 14:23:10+0900",
    "metadata": {
        "app": string | null,
        "title": string | null,
        "url": string | null,
        "desc": string | null
    },
    "ocr": {
        "locale": string | null, // "en",
        "description": string, // "Gyazo\n",
    }
}
/*
imagedata	binary	◯		multipart/form-dataのContent-Dispositionにおける`filename`を忘れずに付与してください。`filename`は必須です。
access_policy	string anyone or only_me		anyone	画像の公開範囲を指定する文字列。 デフォルトは anyone で、リンクを知っている全員が閲覧可能です。 only_me を指定すると、アップロードしたユーザーのみが閲覧可能になります。
metadata_is_public	string 'true' or 'false'			URLやタイトルなどのメタデータを公開するか否かの真偽値の文字列
referer_url	string			キャプチャをしたサイトのURL
app	string			キャプチャをしたアプリケーション名
title	string			キャプチャをしたサイトのタイトル
desc	string			任意のコメント
created_at	float			画像の作られた日時（Unix time）
collection_id	string			ユーザーが所有している/参加しているコレクションにのみ追加できます
*/
export interface UploadRequest {
    imagedata: FormData,
    access_policy?: 'anyone' | 'only_me',
    metadata_is_public?: 'true' | 'false',
    referer_url?: string,
    app?: string,
    title?: string,
    desc?: string,
    created_at?: number,
    collection_id?: string,
}

export interface UploadResponse {
    "image_id": string, // "8980c52421e452ac3355ca3e5cfe7a0c",
    "permalink_url": string, // "http://gyazo.com/8980c52421e452ac3355ca3e5cfe7a0c",
    "thumb_url": string, // "https://i.gyazo.com/thumb/180/afaiefnaf.png",
    "url": string, // "https://i.gyazo.com/8980c52421e452ac3355ca3e5cfe7a0c.png",
    "type": string, // "png"
}
