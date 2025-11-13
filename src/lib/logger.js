import pino from 'pino';
// src/lib/logger.js
import chalk from 'chalk';
import dayjs from 'dayjs';

/**
 * 🕒 Format waktu pendek & panjang
 */
function timestamp() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}
function shortTime() {
  return dayjs().format('HH:mm:ss');
}

/**
 * 🔍 Format argumen log agar aman (stringify object)
 */
function formatArg(arg) {
  if (typeof arg === 'string') return arg;
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}

/**
 * 🌈 prettyLog — log yang cantik dan aman
 */
export const prettyLog = {
  start: (...args) => {
    const txt = args.map(formatArg).join(' ');
    console.log(chalk.cyan.bold(`🚀 [${timestamp()}] ${txt}`));
  },

  info: (...args) => {
    const txt = args.map(formatArg).join(' ');
    console.log(chalk.blue(`[${timestamp()}] ℹ️  ${txt}`));
  },

  section: (...args) => {
    const txt = args.map(formatArg).join(' ');
    console.log(chalk.magenta(`──────────────────────────────────────────────\n${txt}\n──────────────────────────────────────────────`));
  },

  success: (id, waStatus, nomor, msg = 'Pesan berhasil dikirim') => {
    console.log(chalk.greenBright(
      `──────────────────────────────────────────────\n` +
      `🟢 [${shortTime()}] [#${id}] ${waStatus} → ${nomor}\n` +
      `     ✅ ${msg}\n` +
      `──────────────────────────────────────────────`
    ));
  },

  wait: (id, waStatus, tanggalJadwal) => {
    console.log(chalk.yellowBright(
      `📅 [${shortTime()}] [#${id}] ${waStatus}\n` +
      `     ⏳ Belum waktunya dikirim (jadwal ${tanggalJadwal})`
    ));
  },

  warn: (...args) => {
    const txt = args.map(formatArg).join(' ');
    console.log(chalk.yellow(`[${shortTime()}] ⚠️  ${txt}`));
  },

  error: (...args) => {
    const txt = args.map(formatArg).join(' ');
    console.log(chalk.redBright(
      `──────────────────────────────────────────────\n` +
      `🔴 [${shortTime()}] ${txt}\n` +
      `──────────────────────────────────────────────`
    ));
  },

  raw: console, // fallback log
};
