
export type HololiveEventsProps = {
    内容: string,
    タイトル: string,
    日付: { start: string, end?: string },
    ホロメン: string,
    チャンネル: string,
    URL: string,
    種類: string[],
    備考: string,
}
export function createEventsProperties(prop: HololiveEventsProps) {
    let date;
    if (!prop.日付.start) {
        date = null;
    } else {
        date = {
            "start": prop.日付.start,
            "end": prop.日付.end || null,
            "time_zone": null
        }
    }
    return {
        "内容": {
            "title": [
                {
                    "text": {
                        "content": prop.内容
                    }
                }
            ]
        },
        "タイトル": {
            "rich_text": [
                {
                    "text": {
                        "content": prop.タイトル
                    }
                }
            ]
        },
        "日付": {
            "date": date
        },
        "ホロメン": {
            "rich_text": [
                {
                    "text": {
                        "content": prop.ホロメン
                    }
                }
            ]
        },
        "チャンネル": {
            "rich_text": [
                {
                    "text": {
                        "content": prop.チャンネル
                    }
                }
            ]
        },
        "URL": {
            "url": prop.URL || null
        },
        "備考": {
            "rich_text": [
                {
                    "text": {
                        "content": prop.備考
                    }
                }
            ]
        },
        "種類": {
            "multi_select": prop.種類.map(type => {
                return { name: type };
            })
        },
    }
}

export type HololiveDiaryProps = {
    内容: string,
    日付: { start: string, end?: string },
    ホロメン: string,
    種類: string[],
    対象: string[],
}
export function createDiaryProperties(prop: HololiveDiaryProps) {
    let date;
    if (!prop.日付.start) {
        date = null;
    } else {
        date = {
            "start": prop.日付.start,
            "end": prop.日付.end || null,
            "time_zone": null
        }
    }
    return {
        "内容": {
            "title": [
                {
                    "text": {
                        "content": prop.内容
                    }
                }
            ]
        },
        "日付": {
            "date": date
        },
        "ホロメン": {
            "rich_text": [
                {
                    "text": {
                        "content": prop.ホロメン
                    }
                }
            ]
        },
        "種類": {
            "multi_select": prop.種類.map(type => {
                return { name: type };
            })
        },
        "対象": {
            "relation": prop.対象.map(target => {
                return { id: target };
            })
        },
    }
}
