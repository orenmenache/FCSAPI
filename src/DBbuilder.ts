import fs from 'fs';
import sql from 'mssql';
import dotenv from 'dotenv';
import { AssetType } from './FCS/types';
import { FCS_H } from './FCS/FCS';
import { FCSCandle } from './FCS/Candle';
import formatToSQLDate from './functions/formatToSQLDate';
import { EditionType, TimeDeltas } from './classes/TimeDeltas';
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
    async L04__CONTINUOUSLY__getTodaysPrices(customDate?: Date) {
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
    }
    /**
     * Checks which prices we have for given date
     * checks the result list against the symbols for that edition
     * return the unprocessed symbols for the given date
     */
    async L03__symbolsNotProcessed(date: Date, nowEdition: EditionType) {
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
    async L03__pushAllSymbolsToDB(FCS: FCS_H) {
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

            console.log(`Symbol: ${assetDBRecord.assetName}`);

            let storeInDBResult = await this.L02__store_SINGLE_CandleInDB(
                assetDBRecord,
                FCS
            );

            if (!storeInDBResult) {
                this.errors.push(
                    `Couldn't store symbol ${assetDBRecord.assetName}`
                );
            }
            await this.L01__sleep(5000);
        }
        if (this.errors.length > 0) {
            console.warn(
                `Errors in pushAllSymbolsToDB: ${this.errors.join('\n')}`
            );
        }
    }
    async L02__store_SINGLE_CandleInDB(
        assetDBRecord: Asset__DBRecord,
        FCS: FCS_H
    ): Promise<boolean> {
        try {
            let assetData: false | FCSCandle = await FCS.getSingleCandleData(
                assetDBRecord.assetType,
                assetDBRecord.symbol
            );

            if (!assetData) {
                console.warn(`Cannot get assetData`);
                return false;
            }

            //console.log(`%c${assetData}`, 'color: orange');

            let priceRecord: PriceData__DBRecord = {
                symbol: assetDBRecord.symbol,
                h: assetData.h,
                l: assetData.l,
                o: assetData.o,
                c: assetData.c,
                v: assetData.v,
                tm: formatToSQLDate(assetData.tm),
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
    async L03__getAssetsBySymbols(
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
