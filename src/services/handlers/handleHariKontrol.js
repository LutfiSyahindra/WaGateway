import { renderTemplate } from '../../utils/renderTemplate.js';
import { templates } from '../../templates/index.js';
import { prettyLog } from '../../lib/logger.js';
import { formatTanggal } from '../../utils/formatTanggal.js';

export async function handleHariKontrol(row, { db, sendFonnteMessage }) {

    const tanggalSekarang = new Date().toDateString();
    const tanggalJadwal = new Date(row.tgl_wa).toDateString();

    if (tanggalSekarang !== tanggalJadwal) {
        prettyLog.info({ id: row.id, nama: row.nama, tanggalJadwal }, `⏳ Hari kontrol belum waktunya dikirim`);
        return;
    }

    const [updateResult] = await db.query(`
        UPDATE wa_gateway 
        SET status_send = 'proses' 
        WHERE id = ? AND status_send IN ('terjadwal')
    `, [row.id]);

    if (updateResult.affectedRows === 0) return;

    const formattedData = {
        ...row,
        tanggal_kontrol: formatTanggal(row.tgl_wa),
    };

    const pesan = renderTemplate(templates.hari_kontrol, formattedData);
    const res = await sendFonnteMessage(row.no_hp, pesan);

    if (res?.status) {
        await db.query(`UPDATE wa_gateway SET status_send='terkirim' WHERE id=?`, [row.id]);
        await db.query(`
        INSERT INTO log_wa_gateway (wa_gateway_id, nomor, wa_status, status_log, pesan)
        VALUES (?, ?, ?, 'sukses', 'Pesan Hari Kontrol berhasil dikirim')
        `, [row.id, row.nohp, row.wa_status]);
        prettyLog.info({ id: row.id, nomor: row.nohp }, `✅ Hari Kontrol berhasil dikirim`);
    } else {
        await db.query(`UPDATE wa_gateway SET status_send='gagal' WHERE id=?`, [row.id]);
        prettyLog.error({ id: row.id, nomor: row.nohp }, `❌ Gagal kirim Hari Kontrol`);
    }
}
