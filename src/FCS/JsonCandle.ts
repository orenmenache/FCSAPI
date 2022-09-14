type CandleKeys = 'o' | 'c' | 'h' | 'l' | 'v' | 't' | 'tm';
type CandleOBJ = { [key in CandleKeys]: any };

interface JSONCandle extends CandleOBJ {
    o: string; //convert to number
    h: string; //convert to number
    l: string; //convert to number
    c: string; //convert to number
    v: string; //convert to number
    t: string; //convert to number
    tm: string;
}

export { JSONCandle, CandleKeys, CandleOBJ };
