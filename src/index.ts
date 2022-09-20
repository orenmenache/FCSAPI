import { Asset__DBRecord, DBbuilder, PriceData__DBRecord } from './DBbuilder';
import { AssetSinglePackage } from './FCS/classes/AssetSinglePackage';
import { FCS_H } from './FCS/FCS';
import formatToSQLDate from './functions/formatToSQLDate';
import { getYesterdaySQLDate } from './functions/getYesterdaySQLDate';

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

    //let result = await DB.L04__CONTINUOUSLY__getTodaysPrices(FCS);
    //let result = await DB.L03__symbolsNotProcessed(yesterday, 'noon');
    let symbols: false | Asset__DBRecord[] = await DB.L02__getAllSymbols();
    if (!symbols) {
        return false;
    }

    for (let symbol of symbols) {
        let asset: false | AssetSinglePackage = await FCS.getSingleSymbol(
            symbol.assetType,
            symbol.symbol
        );
        if (!asset) {
            console.warn(`Failed to get ${symbol.symbol}`);
        } else {
            for (let i = 0; i < 15; i++) {
                let lastCandle = asset.candles[i];
                let tm = formatToSQLDate(lastCandle.tm);
                console.log(`${lastCandle} ${tm}`);
            }
        }
        await FCS.sleep(1500);
    }

    //DB.connection.close();
}

main();
