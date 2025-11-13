import { renderTemplate } from '../../utils/renderTemplate.js';
import { templates } from '../../templates/index.js';
import { prettyLog } from '../../lib/logger.js';
import { formatTanggal } from '../../utils/formatTanggal.js';

export async function handleRegistrasi(row, { db, sendFonnteMessage }) { 

    if (row.poli?.toUpperCase().includes('IGD')) {
        await db.query(`UPDATE wa_gateway SET status_send='batal' WHERE id=?`, [row.id]);
        await db.query(`
        INSERT INTO log_wa_gateway (wa_gateway_id, nomor, wa_status, status_log, pesan)
        VALUES (?, ?, ?, 'batal', 'Poli IGD — pesan tidak dikirim')
        `, [row.id, row.no_hp || '-', row.wa_status]);
        
        prettyLog.warn(
        { id: row.id, poli: row.poli },
        `🚫 Registrasi tidak dikirim karena pasien di IGD`
        );
        return;
    }

    const [updateResult] = await db.query(`
        UPDATE wa_gateway 
        SET status_send = 'proses' 
        WHERE id = ? AND status_send IN ('belum')
    `, [row.id]);

    if (updateResult.affectedRows === 0) return;

    const formattedData = {
        ...row,
        tanggal_daftar: formatTanggal(row.tgl_registrasi),
        tgl_lahir: formatTanggal(row.tgl_lahir),
    };

    const pesan = renderTemplate(templates.registrasi, formattedData);
    const res = await sendFonnteMessage(row.no_hp, pesan);

    if (res?.status) {
    await db.query(`UPDATE wa_gateway SET status_send='terkirim' WHERE id=?`, [row.id]);
    await db.query(`
        INSERT INTO log_wa_gateway (wa_gateway_id, nomor, wa_status, status_log, pesan)
        VALUES (?, ?, ?, 'sukses', 'Pesan Registrasi berhasil dikirim')
    `, [row.id, row.no_hp, row.wa_status]);
    prettyLog.info({ id: row.id, nomor: row.no_hp }, `✅ Registrasi berhasil dikirim`);
    } else {
        await db.query(`UPDATE wa_gateway SET status_send='gagal' WHERE id=?`, [row.id]);
        prettyLog.error({ id: row.id, nomor: row.no_hp }, `❌ Gagal kirim Registrasi`);
    }
}