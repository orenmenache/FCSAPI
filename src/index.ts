import { DBbuilder } from './DBbuilder';
import { FCS_H } from './FCS/FCS';

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
    //await DB.L02__DANGEROUSLY__RESET__SYMBOLS();

    if (DB.errors.length > 0) {
        console.warn(`Errors in DB ${DB.errors.join('\n')}`);
    }

    DB.connection.close();
}

main();
