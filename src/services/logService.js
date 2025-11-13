// src/services/logService.js
import { db } from '../config/database.js';

export async function insertLog(wa_gateway_id, nomor, wa_status, status_log, pesan) {
    await db.query(
        `INSERT INTO log_wa_gateway (wa_gateway_id, nomor, wa_status, status_log, pesan)
        VALUES (?, ?, ?, ?, ?)`,
        [wa_gateway_id, nomor, wa_status, status_log, pesan]
    );
}
