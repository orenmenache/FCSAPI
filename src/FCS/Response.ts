import { FCSCandle } from './Candle';
import { JSONCandle } from './JsonCandle';

type FCSRoute = 'forex' | 'stock';
type FCSDateString = string;
type FCSResponseKeys = 'status' | 'headers' | 'data';
type FCSResponseOBJ = { [key in FCSResponseKeys]: any };

interface JSONResponse extends FCSResponseOBJ {
    status: string; //convert to number
    headers: {
        date: string; //convert to date
    };
    data: {
        status: string; //convert to boolean
        code: string; //convert to number
        msg: string;
        response: { [key: FCSDateString]: JSONCandle };
        info: {};
    };
}
interface FCSResponse extends FCSResponseOBJ {
    status: number;
    headers: {
        date: Date;
    };
    data: {
        status: boolean;
        code: number;
        msg: string;
        response: { [key: FCSDateString]: FCSCandle };
        info: {};
    };
}

export { JSONResponse, FCSResponse, FCSRoute, FCSDateString, FCSResponseOBJ };
