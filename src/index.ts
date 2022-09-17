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

    // const customDate = false;
    // const date = customDate || new Date();
    // const TD = new TimeDeltas(date);
    // const nowEdition = TD.nowEdition;
    // const yesterday = new Date(Date.parse(date) - 24 * 60 * 60 * 1000);
    // console.log(`YESTERDAY: ${yesterday}`);

    let result = await DB.L04__CONTINUOUSLY__getTodaysPrices(FCS);
    //let result = await DB.L03__symbolsNotProcessed(yesterday, 'noon');
    console.log(result);

    //DB.connection.close();
}

main();
