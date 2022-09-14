import { CandleOBJ, JSONCandle } from './JsonCandle';

class FCSCandle implements CandleOBJ {
    o: number;
    c: number;
    h: number;
    l: number;
    v: number;
    t: number;
    tm: Date;

    constructor(fcsCandleObject: JSONCandle) {
        this.o = Number(fcsCandleObject.o);
        this.c = Number(fcsCandleObject.c);
        this.h = Number(fcsCandleObject.h);
        this.l = Number(fcsCandleObject.l);
        this.v = Number(fcsCandleObject.v);
        this.t = Number(fcsCandleObject.t);
        this.tm = new Date(fcsCandleObject.tm);
    }
}

export { FCSCandle };
