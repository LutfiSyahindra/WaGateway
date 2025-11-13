import { db } from './config/database.js';

const [rows] = await db.query('SELECT NOW() AS waktu');
console.log('✅ DB OK:', rows);
process.exit();
