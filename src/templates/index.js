export const templates = {
  registrasi: `
  ============================
  🏥RS ARSY - PACIRAN 
  👋 Halo! 😊Hp: {no_hp}
  ============================
  📄 BUKTI REGISTER PENDAFTARAN 
  📌 ANTRIAN POLI
  📅 Tanggal : {tanggal_daftar}
  🆔 No Rawat : {no_rawat}
  🆔 No RM : {no_rm}
  👤 Nama : {nama} ({umur} Th)
  🎂 Tanggal Lahir : {tgl_lahir}
  ⚥ JK : {jk}
  🏠 Alamat : {alamat}
  🏥 Poli : {poli} ({jam_mulai} - {jam_selesai})
  👨 Dokter : {dokter}
  💳 Cara bayar : {jns_bayar}
  🔢 No Antri Poli : {no_antri}
  ============================`,

  reminder_kontrol: `
🩺 *Reminder Kontrol Pasca Rawat Inap / Rawat Jalan*

Halo Bpk/Ibu {nama},

📅 *Tanggal:* {tanggal_kontrol}  
🏥 *Poli:* {poli}  

🙏 Semoga sehat selalu!
`,

  hari_kontrol: `
🗓️ *Pengingat Hari Kontrol*

Halo Bpk/Ibu {nama},
📅 Jadwal kontrol: {tanggal_kontrol}  
🏥 Poli: {poli}
`,

  fu_kondisi: `
📋 *Feedback & Pemantauan Kondisi*

Halo Bpk/Ibu {nama},
Semoga Bapak/Ibu dalam kondisi sehat. Mohon isi form berikut:
https://forms.gle/AvRm4KDburfuEKRG7
`,

  poli_batal: `
🚫 *Pemberitahuan Pembatalan Poli*

Halo Bpk/Ibu {nama},
Jadwal kunjungan {tanggal_daftar} ke {poli} dibatalkan karena dokter berhalangan.
`,

  dokter_datang: `
👨‍⚕️ *Dokter Datang*

Halo {nama},
{dokter} sudah datang dan siap melayani pasien di {poli}.
`
};

// tes itur