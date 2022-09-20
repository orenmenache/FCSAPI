import axios from 'axios';
import dotenv from 'dotenv';
import formatToSQLDate from '../functions/formatToSQLDate';
import { HighLowPriceAnalyzer } from './classes/Analyzers/HighLowAnalyzer';
import { VolumeAnanyzer } from './classes/Analyzers/VolumeAnalyzer';
import { AssetSinglePackage } from './classes/AssetSinglePackage';
import { FCSCandle } from './classes/Candle';
import { JSONCandle } from './classes/JsonCandle';
import { JSONResponse } from './classes/Response';
import {
    AssetName,
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
    static maxWaitTime = 5000;

    constructor() {}
    /**
     * Gets the last trading day NOT including today obviously
     * cause it's not history just yet.
     * If yesterday was not a trading day we'll get an error
     * as there is no data.
     * @param  {AssetType} assetType
     * @param  {string} symbol
     */
    // async getSingleCandleData(
    //     assetType: AssetType,
    //     symbol: string
    // ): Promise<false | FCSCandle> {
    //     let today = new Date();
    //     //@ts-ignore
    //     let yesterday = new Date(Date.parse(today) - 24 * 60 * 60 * 1000);
    //     let from = formatToSQLDate(yesterday);
    //     let to = formatToSQLDate(today);

    //     let URL = `${FCS_H.baseURL}${assetType}/history?symbol=${symbol}&period=1d`;
    //     URL += `&from=${from}&to=${to}`;
    //     URL += `&access_key=${FCS_H.key}`;

    //     let response: false | JSONResponse = await this.axiosGetLIMITED(
    //         URL,
    //         FCS_H.maxWaitTime
    //     );

    //     if (!response) {
    //         //console.warn(`!response`);
    //         return false;
    //     }
    //     if (Number(response.status) !== 200) {
    //         console.warn(`response.status !== 200`);
    //         return false;
    //     }
    //     if (!('data' in response)) {
    //         console.warn(`Data couldn't be found in response`);
    //         return false;
    //     }
    //     if (!('response' in response.data)) {
    //         console.warn(
    //             `response couldn't be found in response.data.\nResponse.data keys: ${Object.keys(
    //                 response.data
    //             ).join(', ')}`
    //         );
    //         if ('msg' in response.data) {
    //             console.log(
    //                 `%cresponse.data.msg: ${response.data.msg}`,
    //                 'color: orange'
    //             );
    //         } else {
    //             console.log(`%c${JSON.stringify(response)}`, 'color: yellow');
    //         }
    //     }
    //     let finalResponse = response.data.response;
    //     if (Object.entries(finalResponse).length !== 1) {
    //         console.warn(
    //             `finalResponse.length !== 1: ${
    //                 Object.entries(finalResponse).length
    //             }`
    //         );
    //         return false;
    //     }

    //     let jCandle: JSONCandle = Object.values(finalResponse)[0];

    //     // Check if all keys recieved:
    //     let candleKeys: CandleKeys[] = ['c', 'h', 'l', 'o', 't', 'tm', 'v'];
    //     for (let candleKey of candleKeys) {
    //         if (!(candleKey in jCandle)) {
    //             console.warn(`Key ${candleKey} not found in jCandle`);
    //             return false;
    //         }
    //     }

    //     let candle = new FCSCandle(jCandle);
    //     return candle;

    //     //https://fcsapi.com/api-v3/forex/history?symbol=EUR/USD&period=1d&from=2022-9-8&to=2022-9-9&access_key=
    // }
    // async getSingleCandleData__WO__TimeLimit(
    //     assetType: AssetType,
    //     symbol: string
    // ): Promise<false | FCSCandle> {
    //     let today = new Date();
    //     //@ts-ignore
    //     let yesterday = new Date(Date.parse(today) - 24 * 60 * 60 * 1000);
    //     let from = formatToSQLDate(yesterday);
    //     let to = formatToSQLDate(today);

    //     let URL = `${FCS_H.baseURL}${assetType}/history?symbol=${symbol}&period=1d`;
    //     URL += `&from=${from}&to=${to}`;
    //     URL += `&access_key=${FCS_H.key}`;

    //     let response: false | JSONResponse = await this.axiosGET(URL);

    //     if (!response) {
    //         //console.warn(`!response`);
    //         return false;
    //     }
    //     if (Number(response.status) !== 200) {
    //         console.warn(`response.status !== 200`);
    //         return false;
    //     }
    //     if (!('data' in response)) {
    //         console.warn(`Data couldn't be found in response`);
    //         return false;
    //     }
    //     if (!('response' in response.data)) {
    //         console.warn(
    //             `response couldn't be found in response.data.\nResponse.data keys: ${Object.keys(
    //                 response.data
    //             ).join(', ')}`
    //         );
    //         if ('msg' in response.data) {
    //             console.log(
    //                 `%cresponse.data.msg: ${response.data.msg}`,
    //                 'color: orange'
    //             );
    //         } else {
    //             console.log(`%c${JSON.stringify(response)}`, 'color: yellow');
    //         }
    //     }
    //     let finalResponse = response.data.response;
    //     if (Object.entries(finalResponse).length !== 1) {
    //         console.warn(
    //             `finalResponse.length !== 1: ${
    //                 Object.entries(finalResponse).length
    //             }`
    //         );
    //         return false;
    //     }

    //     let jCandle: JSONCandle = Object.values(finalResponse)[0];

    //     // Check if all keys recieved:
    //     let candleKeys: CandleKeys[] = ['c', 'h', 'l', 'o', 't', 'tm', 'v'];
    //     for (let candleKey of candleKeys) {
    //         if (!(candleKey in jCandle)) {
    //             console.warn(`Key ${candleKey} not found in jCandle`);
    //             return false;
    //         }
    //     }

    //     let candle = new FCSCandle(jCandle);
    //     return candle;

    //     //https://fcsapi.com/api-v3/forex/history?symbol=EUR/USD&period=1d&from=2022-9-8&to=2022-9-9&access_key=
    // }
    async getSingleSymbol(
        assetType: AssetType,
        //fromTo: string,
        //period: string,
        symbol: AssetName
    ): Promise<AssetSinglePackage | false> {
        const fromTo = this.getFromTo();
        const period = '1d';
        const route = this.getRoute(assetType);
        const URL = this.buildURL(route, symbol, period, fromTo);
        //console.log(`URL: ${URL}`);
        const response = await this.axiosGetLIMITED(URL, FCS_H.maxWaitTime);
        if (!response) {
            return false;
        }
        if (response.status != '200') {
            return false;
        }
        let assetPackage: AssetSinglePackage = this.buildAssetData(
            response,
            symbol
        );
        //console.log(`symbol: ${symbol} asset[0].tm: ${assetPackage.candles[0].tm} length: ${assetPackage.candles.length}`);
        //let HL = assetPackage.HLAnalyzer;
        //console.log(`HL high: ${HL.chartHigh.rounded} low: ${HL.chartLow.rounded} gap: ${HL.gap.rounded} gapFactor ${HL.gap.factor.f} ${HL.gap.factor.type} trueRange: ${HL.trueRange} steps: ${HL.steps}`);
        return assetPackage;
    }
    getFromTo() {
        //Time period for candleSticks
        const oneDay = 1000 * 60 * 60 * 24;
        const dateGap = FCS_H.maxCandles;
        const now = new Date();
        const then = new Date(Date.parse(now.toString()) - dateGap * oneDay);
        const nowFormatted = formatToSQLDate(now);
        const thenFormatted = formatToSQLDate(then);
        const fromTo = `from=${thenFormatted}&to=${nowFormatted}`;
        //console.log(`nowFormatted: ${nowFormatted} thenFormatted: ${thenFormatted}`);
        return fromTo;
    }
    getRoute(type: AssetType) {
        return `https://fcsapi.com/api-v3/${type}/history?symbol=`;
    }
    buildURL(route: string, symbol: string, period: string, fromTo: string) {
        return `${route}${symbol}&period=${period}&${fromTo}&access_key=${FCS_H.key}`;
    }
    buildAssetData(
        response: JSONResponse,
        assetName: string
    ): AssetSinglePackage {
        let data = response.data.response;
        //console.log(`data ${data}`);
        let candles: FCSCandle[] = [];
        for (let n in data) {
            let jCandle: JSONCandle = data[n];

            let candle = new FCSCandle(jCandle);
            //console.log(`candle ${candle}`);
            candles.push(candle);
        }
        candles.reverse();
        //Now we have the most recent candle at position 0

        let HL: HighLow = this.getCandlesHighLow(candles);
        //console.log(`HighLow: ${HL.high} ${HL.low}`);
        let HLAnalyzer = new HighLowPriceAnalyzer(HL.high, HL.low);
        let VAnalyzer = new VolumeAnanyzer(candles);
        // for (let n in VAnalyzer){
        //     console.log(`Vanal ${n} ${VAnalyzer[n]}`);
        // }
        let MA = this.getMovingAverages(candles);
        if (!MA) {
            return new AssetSinglePackage(
                assetName,
                candles,
                HLAnalyzer,
                VAnalyzer
            );
        }
        return new AssetSinglePackage(
            assetName,
            candles,
            HLAnalyzer,
            VAnalyzer,
            MA
        );
    }
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
        console.log(`%cSleeping ${ms}`, 'color: gray');
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    /**
     * Added a Promise.race to ensure a time limit
     * on axiosGet
     *
     * @param  {string} url
     * @param  {number} timeLimit
     * @returns Promise
     */
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

            //console.log(`%c${JSON.stringify(value)}`, 'color: yellow');

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
            let response = (await axios(runThis)) as { data: any };
            if (this.isPositiveResponse(response)) {
                console.log(`%cPositive Response`, 'color: green');
                if ('data' in response) {
                    //console.log(`%cHas data`, 'color: green');
                    if ('response' in response.data) {
                        console.log(`%cdata has response`, 'color: green');
                        // console.log(
                        //     `%c${JSON.stringify(response.data.response)}`,
                        //     'color: purple'
                        // );
                        return response as JSONResponse;
                    } else {
                        // console.log(
                        //     `%cData doesn't have response:\n${JSON.stringify(
                        //         response.data
                        //     )}`,
                        //     'color: orange'
                        // );
                        console.log(
                            `%cData doesn't have response`,
                            'color: orange'
                        );
                    }
                }
            }
            console.warn(`Negative response from API`);
        } catch (e) {
            console.warn(`Error in axiosGET: ${e}`);
        }
        return false;
    }
    isPositiveResponse(response: any) {
        return response.status >= 200 && response.status < 300;
    }
}

export { FCS_H };
