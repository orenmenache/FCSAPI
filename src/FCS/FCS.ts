import axios from 'axios';
import dotenv from 'dotenv';
import formatToSQLDate from '../functions/formatToSQLDate';
import { HighLowPriceAnalyzer } from './Analyzers/HighLowAnalyzer';
import { VolumeAnanyzer } from './Analyzers/VolumeAnalyzer';
import { AssetSinglePackage } from './Asset';
import { FCSCandle } from './Candle';
import { JSONCandle } from './JsonCandle';
import { FCSRoute, JSONResponse } from './Response';
import {
    AssetType,
    CandleKeys,
    FCSDateString,
    HighLow,
    MovingAverage,
    MovingAverageCluster,
    MovingAverageNames,
} from './types';
dotenv.config();

//https://fcsapi.com/api-v3/forex/history?symbol=EUR/USD&period=1d&from=2022-9-11&to=2022-09-12&access_key=API_KEY

class FCS_H {
    static key = process.env.FCS_API_KEY || '';
    static baseURL = `https://fcsapi.com/api-v3/`;
    static maxCandles = 90;
    static maxChartCandles = 30;

    constructor() {}
    /**
     * Gets the last trading day NOT including today obviously
     * cause it's not history just yet.
     * If yesterday was not a trading day we'll get an error
     * as there is no data.
     * @param  {AssetType} assetType
     * @param  {string} symbol
     */
    async getSingleCandleData(
        assetType: AssetType,
        symbol: string
    ): Promise<false | FCSCandle> {
        let today = new Date();
        //@ts-ignore
        let yesterday = new Date(Date.parse(today) - 24 * 60 * 60 * 1000);
        let from = formatToSQLDate(yesterday);
        let to = formatToSQLDate(today);

        let URL = `${FCS_H.baseURL}${assetType}/history?symbol=${symbol}&period=1d`;
        URL += `&from=${from}&to=${to}`;
        URL += `&access_key=${FCS_H.key}`;

        let response: false | JSONResponse = await this.axiosGetLIMITED(
            URL,
            5000
        );

        if (!response) {
            console.warn(`!response`);
            return false;
        }
        if (Number(response.status) !== 200) {
            console.warn(`response.status !== 200`);
            return false;
        }
        if (!('data' in response)) {
            console.warn(`Data couldn't be found in response`);
            return false;
        }
        if (!('response' in response.data)) {
            console.warn(`response couldn't be found in response.data`);
        }
        let finalResponse = response.data.response;
        if (Object.entries(finalResponse).length !== 1) {
            console.warn(
                `finalResponse.length !== 1: ${
                    Object.entries(finalResponse).length
                }`
            );
            return false;
        }

        let jCandle: JSONCandle = Object.values(finalResponse)[0];

        // Check if all keys recieved:
        let candleKeys: CandleKeys[] = ['c', 'h', 'l', 'o', 't', 'tm', 'v'];
        for (let candleKey of candleKeys) {
            if (!(candleKey in jCandle)) {
                console.warn(`Key ${candleKey} not found in jCandle`);
                return false;
            }
        }

        let candle = new FCSCandle(jCandle);
        return candle;

        //https://fcsapi.com/api-v3/forex/history?symbol=EUR/USD&period=1d&from=2022-9-8&to=2022-9-9&access_key=
    }
    async axiosGetLIMITED(
        url: string,
        timeLimit: number
    ): Promise<JSONResponse | false> {
        try {
            const timeLimitError = 'TimeLimitReached';

            const limit = new Promise<string>((resolve, reject) => {
                setTimeout(resolve, timeLimit, timeLimitError);
            });

            const axiosResult = new Promise<false | JSONResponse>(
                async (resolve, reject) => {
                    let result = await this.axiosGET(url);
                    resolve(result);
                }
            );

            const value: false | string | JSONResponse = await Promise.race([
                limit,
                axiosResult,
            ]);

            if (value === timeLimitError) {
                console.warn(timeLimitError);
                return false;
            }
            if (!value) {
                console.warn(`!value`);
                return false;
            }

            return value as JSONResponse;
        } catch (e) {
            console.warn(`Failure in axiosGetLIMITED: ${e}`);
            return false;
        }
    }
    async axiosGET(url: string): Promise<JSONResponse | false> {
        let runThis: any = {
            method: 'get',
            url: url,
        };
        try {
            let response = (await axios(runThis)) as unknown;
            if (this.isPositiveResponse(response)) {
                return response as JSONResponse;
            }
            console.warn(`Negative response from API: ${response}`);
        } catch (e) {
            console.warn(`Error in axiosGET: ${e}`);
        }
        return false;
    }
    isPositiveResponse(response: any) {
        return response.status >= 200 && response.status < 300;
    }
    // buildAssetData(
    //     response: JSONResponse,
    //     assetName: string
    // ): false | AssetSinglePackage {
    //     let data: { [key: FCSDateString]: JSONCandle } = response.data.response;
    //     let dataLength = Object.entries(data).length;
    //     if (dataLength !== 1) {
    //         console.warn(`dataLength !== 1: ${dataLength}`);
    //         return false;
    //     }
    //     let jsonCandle: JSONCandle = Object.values(data)[0];
    //     let candle = new FCSCandle(jsonCandle);

    //     let HL: HighLow = this.getCandleHighLow(candles);
    //     //console.log(`HighLow: ${HL.high} ${HL.low}`);
    //     let HLAnalyzer = new HighLowPriceAnalyzer(HL.high, HL.low);
    //     let VAnalyzer = new VolumeAnanyzer(candles);
    //     // for (let n in VAnalyzer){
    //     //     console.log(`Vanal ${n} ${VAnalyzer[n]}`);
    //     // }
    //     let MA = this.getMovingAverages(candles);
    //     if (!MA) {
    //         return new AssetSinglePackage(
    //             assetName,
    //             candles,
    //             HLAnalyzer,
    //             VAnalyzer
    //         );
    //     }
    //     return new AssetSinglePackage(
    //         assetName,
    //         candles,
    //         HLAnalyzer,
    //         VAnalyzer,
    //         MA
    //     );
    // }
    getCandlesHighLow(candleSticks: FCSCandle[]): HighLow {
        let result = { high: 0, low: 0 };
        if (candleSticks.length == 0) {
            return result;
        }
        let candle: FCSCandle = candleSticks[0];
        result.high = candle.h;
        result.low = candle.l;

        // We want the high low of last 30 bars (this.maxChartCandles)
        // and not last 90 bars (this.maxCandles) as only 30 will be visible
        for (let i = 1; i < FCS_H.maxChartCandles; i++) {
            let candle: FCSCandle = candleSticks[i];
            //console.log(`candle high low ${candleSticks[i].h} ${candleSticks[i].l} high ${result.high} low ${result.low}`);
            if (candle.h > result.high) {
                //console.log(`%cHigh is higher`,'color: green');
                result.high = candle.h;
            }
            if (candle.l < result.low) {
                //console.log(`%cLow is lower`,'color: red');
                result.low = candle.l;
            }
        }
        return result;
    }
    getMovingAverages(candleSticks: FCSCandle[]): MovingAverageCluster | false {
        if (candleSticks.length == 0) {
            return false;
        }
        let result = {} as MovingAverageCluster;
        let periods = [5, 10, 15, 20, 25];
        for (let i = 0; i < periods.length; i++) {
            let period = periods[i];
            let maName = `MA${period}` as MovingAverageNames;
            let MA = this.getSingleMovingAverage(candleSticks, period);
            if (!MA) {
                console.log(`Couldn't get MA for period ${period}`);
                return false;
            }
            result[maName] = MA;
        }
        return result;
    }
    getSingleMovingAverage(
        candles: FCSCandle[],
        period: number
    ): MovingAverage | false {
        if (candles.length == 0) {
            return false;
        }
        // Because we're showing 30 candles we need the given period plus 30 candles minimum
        let requiredDataLength = period + 30;
        //console.log(`candleLen: ${candles.length} reqPeriod ${requiredDataLength}`);
        if (candles.length < requiredDataLength) {
            //console.log(`CandleStick length ${candles.length} smaller than required data length ${requiredDataLength}`);
            return false;
        }

        let MA: MovingAverage = [];

        for (let i = 0; i < FCS_H.maxChartCandles; i++) {
            let candle: FCSCandle = candles[i];
            let sum = 0;
            for (let j = i; j < period + i; j++) {
                let jCandle = candles[j];
                //console.log(`jCandle: ${j} ${jCandle}`);
                sum += jCandle.c;
            }
            let average = sum / period;
            MA.push(average);
        }

        return MA;
    }
    sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

export { FCS_H };
