// deno-lint-ignore-file no-namespace

const DATABASE_ID = {
    hololive_events: "1b9c674359f180b18a3af577200df8dc",
    hololive_diary: "1b9c674359f18012ab65f1370bf7e276",
}

function generateDatabaseObject(database_id: string) {
    return {
        "type": "database_id",
        "database_id": database_id,
    }
}

export const hololiveEventsParent = generateDatabaseObject(DATABASE_ID.hololive_events);
export const hololiveDiaryParent = generateDatabaseObject(DATABASE_ID.hololive_diary);

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

export namespace HololiveEvents {
    export type Props = HololiveEventsProps;
    export const parent = hololiveEventsParent;
    export const createProperties = createEventsProperties;
}

export namespace HololiveDiary {
    export type Props = HololiveDiaryProps;
    export const parent = hololiveDiaryParent;
    export const createProperties = createDiaryProperties;
}

export namespace FanArts {
    export type Props = {
        Subject: string;
        URL: string;
        Genre: string[];
        Date: { start: string, end?: string },
    }
    export const parent = generateDatabaseObject("1dc3c17be12980b18b34d27fd6dffcde");
    export const createProperties = (prop: FanArts.Props) => {
        let date;
        if (!prop.Date.start) {
            date = null;
        } else {
            date = {
                "start": prop.Date.start,
                "end": prop.Date.end || null,
                "time_zone": null
            }
        }
        return {
            "Subject": {
                "title": [
                    {
                        "text": {
                            "content": prop.Subject
                        }
                    }
                ]
            },
            "URL": {
                "url": prop.URL || null
            },
            "Genre": {
                "multi_select": prop.Genre.map(type => {
                    return { name: type };
                })
            },
            "Date": {
                "date": date
            },
        }
    }
}
