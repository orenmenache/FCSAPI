import fs from 'fs';
import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

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

    constructor() {
        this.errors = [];
    }
    /**
     * Connect to DB using the config in the static section
     * Returns a connection which you can then use to communicate
     * @returns Promise
     */
    async createDBConnection(): Promise<false | sql.ConnectionPool> {
        return new Promise(async (resolve, reject) => {
            try {
                let connection: sql.ConnectionPool = await sql.connect(
                    DBbuilder.config
                );
                resolve(connection);
            } catch (e) {
                console.warn(`DB connection error: ${e}`);
                reject(false);
            }
        });
    }

    async executeStatement(
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

    loadStatementFromFile(filePath: string) {
        return fs.readFileSync(filePath).toString();
    }
}

export { DBbuilder };
