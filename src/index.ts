import sql from 'mssql';
import { DBbuilder } from './DBbuilder';
import { FCSCandle } from './FCS/Candle';
import { FCS_H } from './FCS/FCS';
import { AssetType } from './FCS/types';
import formatToSQLDate from './functions/formatToSQLDate';

type AssetDBRecord = {
    symbol: string;
    assetType: AssetType;
    assetName: string;
    editionNameA: string;
    editionNameB: null | string;
};

type PriceDataDBRecord = {
    symbol: string;
    h: number;
    l: number;
    o: number;
    c: number;
    v: number;
    tm: string;
};

async function main() {
    let FCS = new FCS_H();
    let dbBuilder = new DBbuilder();
    await dbBuilder.createDBConnection();
    if (!dbBuilder.connection) {
        console.warn(`Unable to connect to DB`);
        return false;
    }

    let AssetDBRecordResult: false | sql.IResult<AssetDBRecord> =
        await dbBuilder.executeStatement(
            dbBuilder.connection,
            `   SELECT * FROM symbols`
        );
    if (!AssetDBRecordResult) {
        return false;
    }
    for (let i in AssetDBRecordResult.recordset) {
        let assetDBRecord: AssetDBRecord = AssetDBRecordResult.recordset[i];
        let storeInDB = await storeCandleInDB(assetDBRecord, FCS, dbBuilder);
    }
    dbBuilder.connection.close();
}

main();

async function storeCandleInDB(
    assetDBRecord: AssetDBRecord,
    FCS: FCS_H,
    dbBuilder: DBbuilder
) {
    let assetData: false | FCSCandle = await FCS.getSingleCandleData(
        assetDBRecord.assetType,
        assetDBRecord.symbol
    );
    if (assetData) {
        console.log(assetData);
        let priceRecord: PriceDataDBRecord = {
            symbol: assetDBRecord.symbol,
            h: assetData.h,
            l: assetData.l,
            o: assetData.o,
            c: assetData.c,
            v: assetData.v,
            tm: formatToSQLDate(assetData.tm),
        };

        console.log(priceRecord);

        // Insert into DB
        let stringified: string = Object.values(priceRecord).join(`', '`);

        let sqlStateMent = `
                INSERT INTO assetData
                VALUES
                ('${stringified}');
            `;

        //console.log(sqlStateMent);

        let INSERTresult: false | sql.IResult<unknown> =
            await dbBuilder.executeStatement(
                dbBuilder.connection,
                sqlStateMent
            );
        if (!INSERTresult) {
            console.warn(`Failed to insert`);
            return false;
        }
        let rowsAffected = INSERTresult.rowsAffected[0];
        return rowsAffected === 1;
    }
}
