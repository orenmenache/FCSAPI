import sql from 'mssql';
import { DBbuilder } from './DBbuilder';
import { FCSCandle } from './FCS/Candle';
import { FCS_H } from './FCS/FCS';
import { AssetType } from './FCS/types';
import formatToSQLDate from './functions/formatToSQLDate';

async function main() {
    let FCS = new FCS_H();
    let DB = new DBbuilder();

    // Create DB connection:
    await DB.L01__createDBConnection();
    if (!DB.connection) {
        console.warn(`Unable to connect to DB`);
        return false;
    }

    await DB.L03__pushAllSymbolsToDB(FCS);

    DB.connection.close();
}

main();
