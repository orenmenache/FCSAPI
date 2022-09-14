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
    let connection: false | sql.ConnectionPool =
        await dbBuilder.createDBConnection();
    if (!connection) {
        return false;
    }
    // let sqlFilePath = `C:/Users/User/Documents/programming/NewsFactory/FCSAPI/sql/INIT__symbols.sql`;
    // let sqlStatement = dbBuilder.loadStatementFromFile(sqlFilePath);
    // await dbBuilder.executeStatement(connection, sqlStatement);
    let result: false | sql.IResult<AssetDBRecord> =
        await dbBuilder.executeStatement(
            connection,
            `   SELECT * FROM symbols`
        ); //as any[][];
    if (!result) {
        return false;
    }
    for (let i in result.recordset) {
        let assetDBRecord: AssetDBRecord = result.recordset[i];
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

            let INSERTresult: false | sql.IResult<PriceDataDBRecord> =
                await dbBuilder.executeStatement(connection, sqlStateMent); //as any[][];
            if (!INSERTresult) {
                return false;
            }
            let priceRecordData: PriceDataDBRecord = INSERTresult.recordset[i];
            console.log(`PriceRecordData: ${priceRecordData}`);
        }

        return;
    }
    connection.close();
}

main();
