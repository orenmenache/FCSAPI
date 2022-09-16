import { Asset__DBRecord, DBbuilder, PriceData__DBRecord } from './DBbuilder';
import { FCS_H } from './FCS/FCS';
import sql from 'mssql';
import { TimeDeltas } from './classes/TimeDeltas';

async function main() {
    let FCS = new FCS_H();
    let DB = new DBbuilder();

    // Create DB connection:
    await DB.L01__createDBConnection();
    if (!DB.connection) {
        console.warn(`Unable to connect to DB`);
        return false;
    }

    let result = await DB.L03__getAssetsBySymbols([`EUR/USD`, `USD/JPY`]);
    console.log(result);

    //DB.connection.close();
}

main();
