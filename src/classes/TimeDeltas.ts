type EditionType = 'noon' | 'evening';
type DualValue = { [key in EditionType]: number };

class TimeDeltas {
    now: Date;
    startHour: DualValue;
    deadLines: DualValue;
    nowHour: number;
    nowEdition: EditionType;
    nowParsed: number;
    editionDate: Date;
    editionDateFormatted: string;

    constructor(customDate?: Date) {
        this.startHour = { noon: 10, evening: 20 };
        this.deadLines = {
            noon: this.startHour.noon + 4,
            evening: this.startHour.evening + 5,
        };
        this.now = customDate ? customDate : new Date();
        //@ts-ignore
        this.nowParsed = Date.parse(this.now);
        this.nowHour = this.now.getHours();
        this.nowEdition = this.getNowEdition();
        this.editionDate = this.getCurrentEditionDate();
        this.editionDateFormatted = this.formatToSixDigits(this.editionDate);
    }

    getNowEdition(): EditionType {
        if (
            this.nowHour >= this.startHour.noon &&
            this.nowHour < this.startHour.evening
        ) {
            return 'noon';
        }
        return 'evening';
    }

    getCurrentEditionDate() {
        if (this.nowEdition == 'noon') {
            let tomorrow = this.getTomorrow();
            console.log(
                `%ccurrent edition is noon so edition date is tomorrow ${tomorrow}`,
                'color: pink'
            );
            return tomorrow;
        }
        if (this.nowHour >= this.startHour.evening) {
            console.log(
                `%ccurrent edition is evening but we're after ${this.startHour.evening} PM so edition date is tomorrow`,
                'color: pink'
            );
            let tomorrow = this.getTomorrow();
            return tomorrow;
        }
        console.log(
            `%ccurrent edition is evening and we're after midnight so edition date is today`,
            'color: pink'
        );
        return this.now;
    }

    getTomorrow() {
        return new Date(this.nowParsed + 24 * 60 * 60 * 1000);
    }

    formatToSixDigits(date: Date): string {
        let year = (date.getFullYear() - 2000).toString();
        let month = (date.getMonth() + 1).toString();
        if (month.length == 1) {
            month = '0' + month;
        }
        let day = date.getDate().toString();
        if (day.length == 1) {
            day = '0' + day;
        }
        return day + month + year;
    }
}

export { TimeDeltas, EditionType };
