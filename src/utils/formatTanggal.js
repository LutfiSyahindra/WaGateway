import dayjs from 'dayjs';

export function formatTanggal(date) {
  if (!date) return '-';
  return dayjs(date).format('DD-MM-YYYY');
}

export function formatTanggalLahir(date) {
  if (!date) return '-';
  return dayjs(date).format('DD-MM-YYYY');
}
