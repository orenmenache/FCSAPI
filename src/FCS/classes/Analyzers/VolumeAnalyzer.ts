import * as math from 'mathjs';
import { HighLow } from '../../types';
import { FCSCandle } from '../Candle';

class VolumeAnanyzer {
    highLow: HighLow;
    range: number;
    lastVolSTR: string;
    constructor(candles: FCSCandle[]) {
        this.highLow = this.getVolHighLow(candles);
        this.range = math.round(this.highLow.high - this.highLow.low);
        this.lastVolSTR = this.getLastVolSTR(Number(candles[0].v));
    }
    getVolHighLow(candles: FCSCandle[]): HighLow {
        //console.log(`candle[0] vol: ${candles[0].v}`);
        let high = Number(candles[0].v);
        let low = high;
        for (let i = 1; i < candles.length; i++) {
            //console.log(`vol ${i}: ${candles[i].v} high: ${high} low: ${low}`);
            let vol = Number(candles[i].v);
            if (vol > high) {
                high = vol;
            }
            if (vol < low) {
                low = vol;
            }
        }
        return { high: high, low: low };
    }
    getLastVolSTR(vol: number): string {
        let volSTR = '';
        if (vol > 1000000) {
            volSTR = `${math.round(vol / 1000000, 1)}M`;
            return volSTR;
        }
        if (vol > 1000) {
            volSTR = `${math.round(vol / 1000, 1)}K`;
            return volSTR;
        }
        return vol.toString();
    }
}

export { VolumeAnanyzer };
