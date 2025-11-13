import dotenv from 'dotenv';
import { prettyLog } from './lib/logger.js';
import { processPendingMessages } from './services/waGatewayService.js';
import dayjs from 'dayjs';

dotenv.config();

const INTERVAL_MINUTES = Number(process.env.INTERVAL_MINUTES || 1);
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

prettyLog.info({ obj: { INTERVAL_MINUTES } }, `🚀 WA Gateway Fonnte aktif`);
prettyLog.info({ obj: { today: dayjs().format('YYYY-MM-DD') } }, `📅 Memulai proses pending messages`);

async function tick() {
  await processPendingMessages();
}

tick();
setInterval(tick, INTERVAL_MS);
