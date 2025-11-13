import { renderTemplate } from '../../utils/renderTemplate.js';
import { templates } from '../../templates/index.js';
import { prettyLog } from '../../lib/logger.js';
import { formatTanggal } from '../../utils/formatTanggal.js';

export async function handleDokterDatang(row, { db, sendFonnteMessage }) { 

    const [updateResult] = await db.query(`
        UPDATE wa_gateway 
        SET status_send = 'proses' 
        WHERE id = ? AND status_send IN ('belum')
    `, [row.id]);

    if (updateResult.affectedRows === 0) return;

    const formattedData = {
        ...row,
        tanggal_daftar: formatTanggal(row.tgl_registrasi),
    };

    const pesan = renderTemplate(templates.dokter_datang, formattedData);
    const res = await sendFonnteMessage(row.no_hp, pesan);

    if (res?.status) {
    await db.query(`UPDATE wa_gateway SET status_send='terkirim' WHERE id=?`, [row.id]);
    await db.query(`
        INSERT INTO log_wa_gateway (wa_gateway_id, nomor, wa_status, status_log, pesan)
        VALUES (?, ?, ?, 'sukses', 'Pesan Dokter Datang berhasil dikirim')
    `, [row.id, row.no_hp, row.wa_status]);
    prettyLog.info({ id: row.id, nomor: row.no_hp }, `✅ Dokter Datang berhasil dikirim`);
    } else {
        await db.query(`UPDATE wa_gateway SET status_send='gagal' WHERE id=?`, [row.id]);
        prettyLog.error({ id: row.id, nomor: row.no_hp }, `❌ Gagal kirim Dokter Datang`);
    }
}