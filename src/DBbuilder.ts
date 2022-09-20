import fs from 'fs';
import sql from 'mssql';
import dotenv from 'dotenv';
import { AssetType } from './FCS/types';
import { FCS_H } from './FCS/FCS';
import { FCSCandle } from './FCS/classes/Candle';
import formatToSQLDate from './functions/formatToSQLDate';
import { EditionType, TimeDeltas } from './classes/TimeDeltas';
import { AssetSinglePackage } from './FCS/classes/AssetSinglePackage';
dotenv.config();

type Asset__DBRecord = {
    symbol: string;
    assetType: AssetType;
    assetName: string;
    editionNameA: string;
    editionNameB: null | string;
};

type PriceData__DBRecord = {
    symbol: string;
    h: number;
    l: number;
    o: number;
    c: number;
    v: number;
    tm: string;
};
class DBbuilder {
    static config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        server: process.env.DB_HOST,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000,
        },
        options: {
            encrypt: true, // for azure
            trustServerCertificate: false, // change to true for local dev / self-signed certs
        },
    } as sql.config;

    errors: string[];
    connection: sql.ConnectionPool;

    constructor() {
        this.connection = {} as sql.ConnectionPool;
        this.errors = [];
    }
    async L04__CONTINUOUSLY__getTodaysPrices(FCS: FCS_H, customDate?: Date) {
        if (!this.connection) {
            this.errors.push(
                `Couldn't execute L04__CONTINUOUSLY__getTodaysPrices. No connection.`
            );
            return false;
        }
        const date = customDate || new Date();
        const TD = new TimeDeltas(date);
        const nowEdition = TD.nowEdition;

        // We want YESTERDAY's prices
        //@ts-ignore
        const yesterday = new Date(Date.parse(date) - 24 * 60 * 60 * 1000);
        console.log(`YESTERDAY: ${yesterday}`);

        await this.L04__pushAllPricesToDB(FCS);
        const remainingSymbols__RESULT = await this.L03__symbolsNotProcessed(
            yesterday,
            nowEdition
        );
        if (!remainingSymbols__RESULT) {
            this.errors.push(
                `Error in L04__CONTINUOUSLY__getTodaysPrices: remainingSymbols__RESULT === false`
            );
            return false;
        }
        const remainingSymbols: string[] = remainingSymbols__RESULT;
        console.log(
            `%cRemaining symbols: ${remainingSymbols.join()}`,
            'color: orange'
        );
        const symbolList__RESULT = await this.L02__getAssetsBySymbols(
            remainingSymbols
        );

        if (!symbolList__RESULT) {
            this.errors.push(
                `Error in L04__CONTINUOUSLY__getTodaysPrices: symbolList__RESULT === false`
            );
            return false;
        }

        const symbolList: Asset__DBRecord[] = symbolList__RESULT.recordset;

        // for (let sym of symbolList) {
        //     let assetDBRecord: Asset__DBRecord = sym;
        //     let pushSingleCandle__RESULT =
        //         await this.L02__store_SINGLE_CandleInDB(assetDBRecord, FCS);
        //     console.log(
        //         `NEW PUSH RESULT for symbol: ${sym.symbol}: ${pushSingleCandle__RESULT}`
        //     );
        // }
    }
    /**
     * Checks which prices we have for given date
     * checks the result list against the symbols for that edition
     * return the unprocessed symbols for the given date
     */
    async L03__symbolsNotProcessed(
        date: Date,
        nowEdition: EditionType
    ): Promise<false | string[]> {
        if (!this.connection) {
            this.errors.push(
                `Couldn't execute L03__symbolsNotProcessed. No connection.`
            );
            return false;
        }

        // Prices for date:
        let pricesForDate__RESULT:
            | false
            | { recordset: PriceData__DBRecord[] } =
            await this.L02__getAllPricesForDate(date);
        if (!pricesForDate__RESULT) {
            this.errors.push(`Couldn't getPrices for date ${date}`);
            return false;
        }
        let pricesForDate: PriceData__DBRecord[] =
            pricesForDate__RESULT.recordset;

        // Symbols for edition (noon / evening)
        let symbolsForEdition__RESULT:
            | false
            | { recordset: Asset__DBRecord[] } =
            await this.L02__getSymbolListForEdition(nowEdition);

        if (!symbolsForEdition__RESULT) {
            this.errors.push(`Couldn't symbolsForEdition`);
            return false;
        }
        let symbolsForEdition: Asset__DBRecord[] =
            symbolsForEdition__RESULT.recordset;

        // Now check which symbols in symbolsForEdition DON'T exist in pricesForDate
        let todaySymbols = pricesForDate.map((price) => price.symbol);
        let symbolsThatNeedDoing: string[] = [];

        for (let sym of symbolsForEdition) {
            if (!todaySymbols.includes(sym.symbol)) {
                symbolsThatNeedDoing.push(sym.symbol);
            }
        }

        return symbolsThatNeedDoing;
    }
    /**
     * Gets the symbol list from DB
     * And then gets the data for those symbols from FCS API
     * And stores them in DB
     *
     * ASSUMES an established connection
     *
     * @param  {FCS_H} FCS
     */
    async L04__pushAllPricesToDB(FCS: FCS_H) {
        if (!this.connection) {
            return false;
        }

        let symbolList: false | Asset__DBRecord[] =
            await this.L02__getAllSymbols();
        if (!symbolList) {
            return false;
        }

        console.log(`%cGot symbols`, 'color: green');

        for (let i in symbolList) {
            let assetDBRecord: Asset__DBRecord = symbolList[i];

            await this.L01__sleep(5000);
        }
        if (this.errors.length > 0) {
            console.warn(
                `Errors in pushAllSymbolsToDB: ${this.errors.join('\n')}`
            );
        }
    }
    /**
     * For now we focus on storing the last trading day in db
     * @param  {FCS_H} FCS
     * @param  {Asset__DBRecord} assetDBRecord
     */
    async L03__store_single_assetInDB(
        FCS: FCS_H,
        assetDBRecord: Asset__DBRecord
    ) {
        console.log(
            `Symbol: ${assetDBRecord.assetName} - ${assetDBRecord.symbol}`
        );

        let assetData: false | AssetSinglePackage = await FCS.getSingleSymbol(
            assetDBRecord.assetType,
            assetDBRecord.symbol
        );

        if (!assetData) {
            console.warn(`Couldnt' get assetData!`);
            return false;
        }

        for (let candle of assetData.candles) {
            let storeResult: boolean = await this.L02__store_SINGLE_CandleInDB(
                assetDBRecord,
                candle as FCSCandle
            );
            if (!storeResult) {
                console.warn(`!StoreResult`);
            }
        }
    }
    async L02__store_SINGLE_CandleInDB(
        assetDBRecord: Asset__DBRecord,
        candle: FCSCandle
    ): Promise<boolean> {
        try {
            //console.log(`%c${assetData}`, 'color: orange');

            let priceRecord: PriceData__DBRecord = {
                symbol: assetDBRecord.symbol,
                h: candle.h,
                l: candle.l,
                o: candle.o,
                c: candle.c,
                v: candle.v,
                tm: formatToSQLDate(candle.tm),
            };

            //console.log(`%c${priceRecord}`, 'color: orange');

            // Insert into DB
            let stringifiedPriceRecord: string =
                Object.values(priceRecord).join(`', '`);

            //console.log(`%c${stringifiedPriceRecord}`, 'color: yellow');

            let sqlStateMent = `
                INSERT INTO assetData
                VALUES
                ('${stringifiedPriceRecord}');
            `;

            //console.log(`%c${sqlStateMent}`, 'color: yellow');

            let INSERTresult: false | sql.IResult<any> =
                await this.L01__executeStatement<any>(sqlStateMent);
            if (!INSERTresult) {
                console.warn(`Failed to insert`);
                return false;
            }
            let rowsAffected = INSERTresult.rowsAffected[0];

            return rowsAffected === 1;
        } catch (e) {
            this.errors.push(`Error in L02__store_SINGLE_CandleInDB: ${e}`);
            return false;
        }
    }
    async L02__getAllSymbols(): Promise<false | Asset__DBRecord[]> {
        if (!this.connection) {
            return false;
        }
        try {
            let result: false | sql.IResult<Asset__DBRecord> =
                await this.L01__executeStatement(`SELECT * FROM symbols`);
            if (!result) {
                return false;
            }
            let AssetDBRecordResult: sql.IResult<Asset__DBRecord> = result;
            if (!('recordset' in AssetDBRecordResult)) {
                console.warn(`Cannot get recordset`);
                return false;
            }
            return AssetDBRecordResult.recordset;
        } catch (e) {
            this.errors.push(`Error in L02__getAllSymbols: ${e}`);
            return false;
        }
    }
    async L02__DANGEROUSLY__RESET__SYMBOLS() {
        try {
            const resetFile = `C:/Users/User/Documents/programming/NewsFactory/FCSAPI/sql/INIT__symbols.sql`;
            const sqlStatement = this.L01__loadStatementFromFile(resetFile);
            const result: false | sql.IResult<any> =
                await this.L01__executeStatement<any>(sqlStatement);
            if (!result) {
                console.warn(`Failed to reset`);
                return false;
            }
            console.log(`DB resetted`);
            return true;
        } catch (e) {
            this.errors.push(`Error in L02__DANGEROUSLY__RESET__SYMBOLS: ${e}`);
            return false;
        }
    }
    /**
     * Get ALL prices
     * @param  {Date} date
     * @returns PriceData__DBRecord
     */
    async L02__getAllPricesForDate(
        date: Date
    ): Promise<false | { recordset: PriceData__DBRecord[] }> {
        if (!this.connection) {
            return false;
        }
        let sqlDate = formatToSQLDate(date);
        let sqlStatement = `
            SELECT * FROM assetData
            WHERE tm = '${sqlDate}'
        `;
        let result: false | { recordset: PriceData__DBRecord[] } =
            await this.L01__executeStatement(sqlStatement);

        return result;
    }
    async L02__getPriceForDate__SINGLE(
        date: Date,
        symbol: string
    ): Promise<false | { recordset: PriceData__DBRecord[] }> {
        if (!this.connection) {
            return false;
        }
        let sqlDate = formatToSQLDate(date);
        let sqlStatement = `
            SELECT * FROM assetData
            WHERE tm = '${sqlDate}'
            AND symbol = '${symbol}';
        `;
        let result: false | { recordset: PriceData__DBRecord[] } =
            await this.L01__executeStatement(sqlStatement);

        return result;
    }
    async L02__getSymbolListForEdition(
        nowEdition: EditionType
    ): Promise<false | { recordset: Asset__DBRecord[] }> {
        if (!this.connection) {
            return false;
        }
        let sqlStatement = `
            SELECT * FROM symbols
            WHERE (editionNameA = '${nowEdition}') OR 
            (editionNameB = '${nowEdition}');
        `;
        let result: false | { recordset: Asset__DBRecord[] } =
            await this.L01__executeStatement(sqlStatement);

        return result;
    }
    async L02__getAssetsBySymbols(
        symbols: string[]
    ): Promise<false | { recordset: Asset__DBRecord[] }> {
        if (!this.connection) {
            return false;
        }

        const symbolsStr: string = symbols.join(`')\nOR (symbol = '`);

        let sqlStatement = `
            SELECT * FROM symbols
            WHERE (symbol = '${symbolsStr}');`; // ONE '

        let result: false | { recordset: Asset__DBRecord[] } =
            await this.L01__executeStatement(sqlStatement);

        return result;
    }
    async L02__getAssetBySymbol(symbol: string) {
        if (!this.connection) {
            return false;
        }
        let sqlStatement = `
            SELECT * FROM symbols
            WHERE symbol = '${symbol}';
        `;
        let result: false | { recordset: Asset__DBRecord[] } =
            await this.L01__executeStatement(sqlStatement);

        return result;
    }
    /*
        Every method with L02 and above relies on an existing connection
    */
    /**
     * Connect to DB using the config in the static section
     * Returns a connection which you can then use to communicate
     * @returns Promise
     */
    async L01__createDBConnection() {
        return new Promise(async (resolve, reject) => {
            try {
                let connection: sql.ConnectionPool = await sql.connect(
                    DBbuilder.config
                );
                this.connection = connection;
                resolve(true);
            } catch (e) {
                console.warn(`DB connection error: ${e}`);
                reject(false);
            }
        });
    }
    async L01__executeStatement<T extends any>(
        sqlStatement: string
    ): Promise<false | sql.IResult<T>> {
        if (!this.connection) {
            return false;
        }
        return new Promise(async (resolve, reject) => {
            console.log(`%c${sqlStatement}`, 'color: gray');
            try {
                let req = new sql.Request(this.connection);
                let result: sql.IResult<T> = await req.query(sqlStatement);
                console.log(result);
                resolve(result);
            } catch (e) {
                this.errors.push(`Error executing query: ${e}`);
                reject(false);
            }
        });
    }
    L01__loadStatementFromFile(filePath: string) {
        return fs.readFileSync(filePath).toString();
    }
    L01__sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

export { DBbuilder, PriceData__DBRecord, Asset__DBRecord };
