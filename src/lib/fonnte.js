// src/lib/fonnte.js
import axios from 'axios';
import dotenv from 'dotenv';
import { prettyLog } from './logger.js';
dotenv.config();

const API_URL = process.env.FONNTE_API || 'https://api.fonnte.com/send';
const TOKEN = process.env.FONNTE_TOKEN || '';

/**
 * sendFonnteMessage
 * - target: '62812xxxx...' (no +)
 * - message: string
 * - options: { retries, backoffMs }
 */
export async function sendFonnteMessage(target, message, options = {}) {
    const retries = Number(options.retries ?? 3);
    const backoffMs = Number(options.backoffMs ?? 2000);

    if (!TOKEN) throw new Error('FONNTE_TOKEN not configured');

    let lastErr = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
        const res = await axios.post(
            API_URL,
            { target, message },
            { headers: { Authorization: TOKEN, 'Content-Type': 'application/json' }, timeout: 15000 }
        );
        // assume API returns { status: true, ... } on success
       prettyLog.info('Pesan berhasil dikirim');

        return res.data;
        } catch (err) {
        lastErr = err;
        prettyLog.warn({ target, attempt, err: err.response?.data ?? err.message }, 'Fonnte send failed');
        if (attempt < retries) {
            // exponential-ish backoff
            await new Promise((r) => setTimeout(r, backoffMs * attempt));
        }
        }
    }
    throw lastErr ?? new Error('Unknown error sending via Fonnte');
}
