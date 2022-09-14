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

        for (let i in symbolList) {
            let assetDBRecord: Asset__DBRecord = symbolList[i];
            let storeInDBResult = await this.L02__store_SINGLE_CandleInDB(
                assetDBRecord,
                FCS
            );
            if (!storeInDBResult) {
                this.errors.push(
                    `Couldn't store symbol ${assetDBRecord.assetName}`
                );
            }
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
        let assetData: false | FCSCandle = await FCS.getSingleCandleData(
            assetDBRecord.assetType,
            assetDBRecord.symbol
        );

        if (!assetData) {
            console.warn(`Cannot get assetData`);
            return false;
        }

        //console.log(assetData);
        let priceRecord: PriceData__DBRecord = {
            symbol: assetDBRecord.symbol,
            h: assetData.h,
            l: assetData.l,
            o: assetData.o,
            c: assetData.c,
            v: assetData.v,
            tm: formatToSQLDate(assetData.tm),
        };

        // Insert into DB
        let stringifiedPriceRecord: string =
            Object.values(priceRecord).join(`', '`);

        let sqlStateMent = `
            INSERT INTO assetData
            VALUES
            ('${stringifiedPriceRecord}');
        `;

        //console.log(sqlStateMent);

        let INSERTresult: false | sql.IResult<unknown> =
            await this.L01__executeStatement(this.connection, sqlStateMent);
        if (!INSERTresult) {
            console.warn(`Failed to insert`);
            return false;
        }
        let rowsAffected = INSERTresult.rowsAffected[0];
        return rowsAffected === 1;
    }
    async L02__getAllSymbols(): Promise<false | Asset__DBRecord[]> {
        if (!this.connection) {
            return false;
        }
        let result: false | sql.IResult<Asset__DBRecord> =
            await this.L01__executeStatement(
                this.connection,
                `   SELECT * FROM symbols`
            );
        if (!result) {
            return false;
        }
        let AssetDBRecordResult: sql.IResult<Asset__DBRecord> = result;
        if (!('recordSet' in AssetDBRecordResult)) {
            console.warn(`Cannot get recordSet`);
            return false;
        }
        return AssetDBRecordResult.recordset;
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
        connection: sql.ConnectionPool,
        sqlStatement: string
    ): Promise<false | sql.IResult<any>> {
        return new Promise(async (resolve, reject) => {
            try {
                let req = new sql.Request(connection);
                let result = await req.query(sqlStatement);
                resolve(result);
            } catch (e) {
                console.warn(`Error executing query`);
                reject(false);
            }
        });
    }
    L01__loadStatementFromFile(filePath: string) {
        return fs.readFileSync(filePath).toString();
    }
}

export { DBbuilder };
