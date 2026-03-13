
import mysql from 'mysql2/promise';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
        });

        const [rows] = await connection.query('DESCRIBE usuarios');
        fs.writeFileSync('db_check.json', JSON.stringify(rows, null, 2));
        await connection.end();
    } catch (err) {
        fs.writeFileSync('db_check.json', JSON.stringify({ error: err.message }, null, 2));
    }
}

check();
