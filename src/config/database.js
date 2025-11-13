// src/config/database.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'rs_arsy',
    waitForConnections: true,
    connectionLimit: 10,
});
