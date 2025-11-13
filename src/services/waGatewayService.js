// --- src/services/waGatewayService.js
import { db } from '../config/database.js';
import { prettyLog } from '../lib/logger.js';
import { sendFonnteMessage } from '../lib/fonnte.js';
import { insertLog } from './logService.js';
import { formatPhoneNumber } from '../utils/validateNumber.js';
import { renderTemplate } from '../utils/renderTemplate.js';
import { templates } from '../templates/index.js';

// --- handlers
import { handleReminderKontrol } from './handlers/handleReminderKontrol.js';
import { handleHariKontrol } from './handlers/handleHariKontrol.js';
import { handleFUKondisi } from './handlers/handleFUKondisi.js';
import { handleRegistrasi } from './handlers/handleRegistrasi.js';
import { handleFUKondisiRanap } from './handlers/handleFUKondisiRanap.js';
import { handleDokterDatang } from './handlers/handleDokterDatang.js';
import { handlePoliBatal } from './handlers/handlePoliBatal.js';

// --- inisialisasi handlers
const handlers = {
  reminder_kontrol: handleReminderKontrol,
  hari_kontrol: handleHariKontrol,
  fu_kondisi: handleFUKondisi,
  registrasi: handleRegistrasi,
  fu_kondisi_ranap: handleFUKondisiRanap,
  dokter_datang: handleDokterDatang,
  poli_batal: handlePoliBatal,
};

export async function processPendingMessages() {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const timeNow = new Date().toLocaleTimeString('id-ID', { hour12: false });
  prettyLog.start(`🚀 WA Gateway Fonnte aktif — ${today} 🕒 ${timeNow}`);

  // 🔹 Ambil data pending
  const [belumResults] = await db.query(
    `SELECT id FROM wa_gateway WHERE status_send = 'belum' AND tgl = ? ORDER BY id ASC LIMIT 2`,
    [today]
  );
  const [terjadwalResults] = await db.query(
    `SELECT id FROM wa_gateway WHERE status_send = 'terjadwal' AND tgl_wa = ? LIMIT 1`,
    [today]
  );

  prettyLog.info(`📥 Data BELUM: ${belumResults.length}`);
  prettyLog.info(`📅 Data TERJADWAL: ${terjadwalResults.length}`);

  const allIds = [...belumResults, ...terjadwalResults];
  if (allIds.length === 0) {
    prettyLog.info(`✅ Tidak ada pesan yang perlu dikirim hari ini`);
    return;
  }

  // 🔁 Loop semua data
  for (const { id } of allIds) {
    try {
      const [basicRows] = await db.query(
        `SELECT id, no_rawat, no_rm, wa_status, tgl, status_send FROM wa_gateway WHERE id = ?`,
        [id]
      );
      if (!basicRows.length) continue;
      const basic = basicRows[0];

      prettyLog.info(`📦 Memproses ID #${id} — Status: ${basic.wa_status}`);

      // 🔹 Validasi reg_periksa
      const [cekRawat] = await db.query(
        `SELECT no_rkm_medis FROM reg_periksa WHERE no_rawat = ?`,
        [basic.no_rawat]
      );
      if (!cekRawat.length) {
        prettyLog.warn(id, basic.wa_status, '❌ Data reg_periksa tidak ditemukan → dibatalkan');
        await db.query(`UPDATE wa_gateway SET status_send = 'batal' WHERE id = ?`, [basic.id]);
        await insertLog(basic.id, '-', basic.wa_status, 'batal', 'Data reg_periksa tidak ditemukan');
        continue;
      }

      // 🔹 Sinkronisasi no_rm
      const noRkmMedisAsli = cekRawat[0].no_rkm_medis;
      if (basic.no_rm !== noRkmMedisAsli) {
        await db.query(`UPDATE wa_gateway SET no_rm = ? WHERE id = ?`, [noRkmMedisAsli, basic.id]);
        await insertLog(basic.id, '-', basic.wa_status, 'update', 'no_rm diperbarui');
        prettyLog.info(`🔄 Sinkronisasi no_rm (${basic.no_rm} → ${noRkmMedisAsli})`);
      }

      // 🔹 Ambil data lengkap
      const [rows] = await db.query(
        `
        SELECT 
            wa_gateway.*, 
            wa_gateway.no_telp AS no_hp,
            pasien.no_rkm_medis AS no_rm,
            pasien.nm_pasien AS nama,
            pasien.tgl_lahir,
            pasien.jk,
            pasien.alamat,
            reg_periksa.no_reg AS no_antri,
            reg_periksa.jam_reg,
            reg_periksa.tgl_registrasi,
            reg_periksa.kd_dokter,
            skdp_bpjs.diagnosa,
            skdp_bpjs.kd_dokter,
            skdp_bpjs.terapi,
            skdp_bpjs.alasan1,
            skdp_bpjs.alasan2,
            skdp_bpjs.rtl1,
            skdp_bpjs.rtl2,
            skdp_bpjs.tanggal_datang,
            skdp_bpjs.tanggal_rujukan,
            skdp_bpjs.no_antrian as no_antrian_rujukan,
            bridging_surat_kontrol_bpjs.no_surat as no_surat_kontrol_bpjs,
            bridging_surat_kontrol_bpjs.tgl_surat as tgl_surat_kontrol_bpjs,
            bridging_surat_kontrol_bpjs.tgl_rencana as tgl_rencana_kontrol_bpjs,
            bridging_surat_kontrol_bpjs.nm_dokter_bpjs,
            bridging_surat_kontrol_bpjs.nm_poli_bpjs,
            bridging_sep.nama_pasien as nama_pasien_bpjs,  
            bridging_sep.no_kartu as no_kartu_bpjs,  
            bridging_sep.tanggal_lahir as tgl_lahir_bpjs,  
            bridging_sep.nmdiagnosaawal as diagnosa_awal_bpjs,  
            bridging_sep.jkel,  
            TIMESTAMPDIFF(YEAR, pasien.tgl_lahir, CURDATE()) AS umur,
            dokter.nm_dokter,
            spesialis.nm_sps,
            jadwal_spesialis.jam_mulai,
            jadwal_spesialis.jam_selesai
        FROM wa_gateway
        JOIN pasien ON pasien.no_rkm_medis = wa_gateway.no_rm
        JOIN reg_periksa ON reg_periksa.no_rawat = wa_gateway.no_rawat
        LEFT JOIN (
            SELECT *
            FROM bridging_sep bs1
            WHERE bs1.no_sep = (
                SELECT bs2.no_sep
                FROM bridging_sep bs2
                WHERE bs2.no_rawat = bs1.no_rawat
                ORDER BY bs2.tglsep DESC, bs2.no_sep DESC
                LIMIT 1
            )
        ) AS bridging_sep ON bridging_sep.no_rawat = reg_periksa.no_rawat
        LEFT JOIN bridging_surat_kontrol_bpjs ON bridging_surat_kontrol_bpjs.no_sep = bridging_sep.no_sep
        LEFT JOIN skdp_bpjs ON skdp_bpjs.no_rkm_medis = wa_gateway.no_rm
            AND DATE(skdp_bpjs.tanggal_datang) = wa_gateway.tgl
        LEFT JOIN dokter ON dokter.kd_dokter = skdp_bpjs.kd_dokter
        LEFT JOIN spesialis ON spesialis.kd_sps = dokter.kd_sps
        LEFT JOIN jadwal_spesialis ON jadwal_spesialis.kd_dokter =  reg_periksa.kd_dokter
            AND jadwal_spesialis.hari_kerja = CASE DAYOFWEEK(reg_periksa.tgl_registrasi)
              WHEN 1 THEN 'AKHAD'
              WHEN 2 THEN 'SENIN'
              WHEN 3 THEN 'SELASA'
              WHEN 4 THEN 'RABU'
              WHEN 5 THEN 'KAMIS'
              WHEN 6 THEN 'JUMAT'
              WHEN 7 THEN 'SABTU'
            END
        WHERE wa_gateway.id = ?
      `, [id]
      );
      if (!rows.length) continue;
      const row = rows[0];

      // 🔹 Validasi nomor
      let nomor = row.no_hp?.trim();
      if (!nomor || nomor === '-' || nomor.length < 9 || /[^0-9]/.test(nomor)) {
        prettyLog.error(id, row.wa_status, `Nomor tidak valid (${nomor || 'kosong'})`);
        await db.query(`UPDATE wa_gateway SET status_send = 'batal' WHERE id = ?`, [row.id]);
        await insertLog(row.id, nomor || '-', row.wa_status, 'batal', 'Nomor tidak valid atau kosong');
        continue;
      }

      const finalNo = formatPhoneNumber(nomor);
      if (!finalNo) {
        prettyLog.error(id, row.wa_status, `Nomor tidak valid setelah format (${nomor})`);
        await db.query(`UPDATE wa_gateway SET status_send = 'batal' WHERE id = ?`, [row.id]);
        await insertLog(row.id, nomor || '-', row.wa_status, 'batal', 'Nomor invalid setelah formatting');
        continue;
      }

      // 🔹 Tentukan handler
      const normalized = row.wa_status?.toLowerCase().replace(/\s+/g, '_') || 'default';
      const handler = handlers[normalized];

      if (handler) {
        await handler(row, { db, sendFonnteMessage, insertLog, prettyLog, renderTemplate, templates });
      } else {
        // 🔸 fallback: kirim template generik
        const template = templates[normalized] || templates.default;
        const pesan = renderTemplate(template, row);

          const res = await sendFonnteMessage(finalNo, pesan);
          console.info(`📬 Respons dari Fonnte:\n${JSON.stringify(res, null, 2)}`);

        if (res?.status) {
          await db.query(`UPDATE wa_gateway SET status_send = 'terkirim' WHERE id = ?`, [row.id]);
          await insertLog(row.id, finalNo, row.wa_status, 'terkirim', 'Pesan fallback berhasil dikirim');
          prettyLog.success(row.id, row.wa_status, finalNo, 'Pesan fallback berhasil dikirim');
        } else {
          await db.query(`UPDATE wa_gateway SET status_send = 'gagal' WHERE id = ?`, [row.id]);
          await insertLog(row.id, finalNo, row.wa_status, 'gagal', 'Pesan fallback gagal dikirim');
          prettyLog.error(row.id, row.wa_status, 'Pesan fallback gagal dikirim');
        }
      }
    } catch (err) {
      prettyLog.error(id, 'WA-Gateway', `🔥 ${err.message}`);
      console.error(err.stack);
    }
  }

  prettyLog.info('✨ Selesai memproses semua pesan');
}
