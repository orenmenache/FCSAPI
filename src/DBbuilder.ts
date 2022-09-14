import fs from 'fs';
import sql from 'mssql';
import dotenv from 'dotenv';
import { AssetType } from './FCS/types';
import { FCS_H } from './FCS/FCS';
import { FCSCandle } from './FCS/Candle';
import formatToSQLDate from './functions/formatToSQLDate';
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
            await this.L01__sleep(15 * 1000);
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

            let INSERTresult: false | sql.IResult<unknown> =
                await this.L01__executeStatement(sqlStateMent);
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
                await this.L01__executeStatement(sqlStatement);
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
    async L01__executeStatement(
        sqlStatement: string
    ): Promise<false | sql.IResult<any>> {
        if (!this.connection) {
            return false;
        }
        return new Promise(async (resolve, reject) => {
            try {
                let req = new sql.Request(this.connection);
                let result = await req.query(sqlStatement);
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

export { DBbuilder };
