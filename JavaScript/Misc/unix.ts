export class UnixTime {
    unix: number;

    /**
     * @param value UNIX時間（UNIXエポックからの経過秒数）または`Date`オブジェクト
     */
    constructor(value: number | Date) {
        if (value instanceof Date) {
            value = Math.floor(value.getTime() / 1000);
        }
        this.unix = value;
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

    /**
     * @returns YYYY/MM/DDまたはYYYY/MM/DD hh:mm
     */
    getDateString(withTime = true) {
        const f = (num: number) => ("00" + num).slice(-2);
        if (withTime) {
            return `${this.year}/${f(this.month)}/${f(this.date)} ${f(this.hour)}:${f(this.minute)
                }`;
        } else {
            return `${this.year}/${f(this.month)}/${f(this.date)}`;
        }
    }

    /**
     * @returns YYYY-MM-DDThh:mm+09:00
     */
    getJpDateString() {
        return this.Date.toLocaleString("sv-SE", {
            timeZone: "Asia/Tokyo",
        }).replace(" ", "T") + "+09:00";
    }

    /**
     * @returns この日時が`year`年`month`月に含まれている時`true`
     */
    isIncluded(year: number | string, month: number | string) {
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
     * @param offset 幅
     * @param type 単位
     * @param target 基準日
     * @returns この日時が`target`の`offset`後より手前か、または`offset`前より後なら`true`
     */
    within(
        offset: number,
        type: "year" | "month" | "date" | "hour" | "minute" | "second",
        target = new Date(),
    ) {
        switch (type) {
            case "year":
                target.setFullYear(target.getFullYear() + offset);
                break;
            case "month":
                target.setMonth(target.getMonth() + offset);
                break;
            case "date":
                target.setDate(target.getDate() + offset);
                break;
            case "hour":
                target.setHours(target.getHours() + offset);
                break;
            case "minute":
                target.setMinutes(target.getMinutes() + offset);
                break;
            case "second":
                target.setSeconds(target.getSeconds() + offset);
                break;
            default:
        }
        return offset > 0 ? this.Date < target : this.Date > target;
    }

    static generateUniqueUnix(unixList: number[], date = new Date()) {
        let unix = Math.floor(date.getTime() / 1000);
        const find = (unix: number) => unixList.includes(unix);
        while (find(unix)) {
            unix++;
            if (!find(unix)) break;
        }
        return unix;
    }
}
