// src/utils/validateNumber.js
export function formatPhoneNumber(nohp) {
  if (!nohp) return null;
  let clean = String(nohp).replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  // minimal 10 digits incl country code, max 15
  if (clean.length < 10 || clean.length > 13) return null;
  return clean;
}
