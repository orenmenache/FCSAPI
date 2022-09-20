import formatToSQLDate from './formatToSQLDate';

function getYesterdaySQLDate() {
    let date = new Date();
    //@ts-ignore
    let yesterday = new Date(Date.parse(date) - 24 * 60 * 60 * 1000);
    return formatToSQLDate(yesterday);
}

export { getYesterdaySQLDate };
