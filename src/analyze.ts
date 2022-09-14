import { DBbuilder } from './DBbuilder';
import formatToSQLDate from './functions/formatToSQLDate';

type FCSinitForexJsonResponse = {
    status: string; //boolean
    code: string; //number
    msg: string;
    response: FCS__SINGLE__forexJsonData[];
};
type FCS__SINGLE__forexJsonData = {
    id: string;
    o: string;
    h: string;
    l: string;
    c: string;
    s: string;
    t: string;
    tm: string;
};
type FCS__forexSymbols =
    | 'EUR/USD'
    | 'AUD/USD'
    | 'USD/JPY'
    | 'USD/CHF'
    | 'USD/CAD'
    | 'USD/ZAR'
    | 'USD/INR'
    | 'USD/CNY'
    | 'USD/KRW';
type FCS__stockSymbols = '' | '';

type FCS__comodSymbols = '' | '';
type FCS__indexSymbols = '' | '';
type FCS__cryptSymbols =
    | 'BTC/USD'
    | 'ETH/USD'
    | 'XRP/USD'
    | 'XLM/USD'
    | 'BCH/USD'
    | 'ADA/USD'
    | 'LTC/USD';

const FCS_forexSymbolsARR: FCS__forexSymbols[] = [
    'EUR/USD',
    'AUD/USD',
    'USD/JPY',
    'USD/CHF',
    'USD/CAD',
    'USD/ZAR',
    'USD/INR',
    'USD/CNY',
    'USD/KRW',
];

class FCS__Handler {
    constructor() {}

    async FOREX(initResponse?: FCSinitForexJsonResponse) {
        let data: FCSinitForexJsonResponse =
            initResponse || require('../test.json');

        if (Number(data.code) !== 200) {
            console.log(`Couldn't connect`);
            return false;
        }

        let forexData = {} as {
            [key in FCS__forexSymbols]: FCS__SINGLE__forexJsonData;
        };

        for (let i in data.response) {
            let asset = data.response[i];
            let symbolName: string = asset.s;
            if (FCS_forexSymbolsARR.includes(symbolName as FCS__forexSymbols)) {
                console.log(asset.c);
                console.log(asset.s);
                //console.log(asset.tm);
                let date = new Date(asset.tm);
                //console.log(date);
                console.log(formatToSQLDate(date));
            }
        }
    }
}

async function main() {
    let dbBuilder = new DBbuilder();
    let connection = await dbBuilder.createDBConnection();
    //let sqlStatement = `SELECT * FROM forex__symbols`;
    let sqlStatement = dbBuilder.loadStatementFromFile(
        `C:/Users/User/Documents/programming/NewsFactory/FCSAPI/sql/createForexSymbolsTable.sql`
    );
    let result = await dbBuilder.executeStatement(connection, sqlStatement);
    if (!result) {
        return false;
    }
    for (let objArr of result) {
        for (let obj of objArr) {
            for (let n in obj) {
                console.log(`${n} ${obj[n]}`);
            }
        }
    }

    connection.close();
}

main();

// async function VERSION__A() {
//     //let FCSH = new FCS__Handler();
//     //await FCSH.FOREX();

//     // let sqlStatement = dbBuilder.loadStatementFromFile(
//     //     `C:/Users/User/Documents/programming/NewsFactory/FCSAPI/sql/test.sql`
//     // );

//     let dbBuilder = new DBbuilder();
//     let connection = await dbBuilder.createDBConnection();
//     let sqlStatement = `SELECT * FROM forex__symbols`;

//     let request = new Request(sqlStatement, function (
//         err: Error,
//         rowCount: number,
//         rows: any[]
//     ) {
//         if (err) {
//             console.log(err);
//             return;
//         }
//         console.log(`Callback`);
//         return [rowCount, rows];
//     });

//     connection.execSql(request);

//     request.on('row', () => {
//         console.log('row');
//     });

//     request.on('requestCompleted', () => {
//         console.log('requestCompleted');
//         connection.close();
//     });
// }

// async function VERSION__B() {
//     let dbBuilder = new DBbuilder();
//     let connection = await dbBuilder.createDBConnection();
//     let sqlStatement = `SELECT * FROM forex__symbols`;

//     let pr = new Promise((resolve, reject) => {
//         let data: string[] = [];

//         let request = new Request(sqlStatement, function (
//             err: Error,
//             rowCount: number,
//             rows: any[]
//         ) {
//             if (err) {
//                 console.log(err);
//                 reject();
//             }
//             resolve(data);
//         });

//         connection.execSql(request);

//         request.on('row', (columns) => {
//             let row = ``;
//             columns.forEach((column) => {
//                 // You can try JSON.stringify here too
//                 row += column.value;
//             });
//             data.push(row);
//         });
//     });

//     let result = await pr;
//     console.log(result);
//     connection.close();

//     // pr.then((result) => {
//     //     console.log(result);
//     //     console.log(`Closing connection`);
//     //     connection.close();
//     // }).catch((err) => {
//     //     console.log(err);
//     // });
// }
