// src/lib/raceTime.js
//
// Aritmetika waktu lomba "HH:MM:SS.mmm" — SATU sumber utk kelima Race
// Category (Sprint/Slalom/DRR/H2H/Rafting Cross). Dulu tiap halaman punya
// salinan sendiri (hitungSelisihWaktu, hmsToMs/msToHMSms, tambahWaktu) dgn
// perilaku yang sedikit berbeda-beda.
//
// Modul ini SENGAJA murni (tanpa import Vue/Electron/alias "@/") supaya bisa
// diuji langsung dgn `node --test` (lihat tests/raceTime.test.js).
//
// Perbedaan dgn salinan lama (perbaikan, terkunci oleh tes):
// - Pecahan detik dibaca sbg PECAHAN, bukan angka mentah milidetik:
//   ".5" = 500 ms, ".09" = 90 ms, ".0123" = 12 ms. Dulu ".5" dibaca 5 ms dan
//   ".1234" dibaca 1234 ms (melimpah jadi +1,234 detik). Format standar 3
//   digit (".009") hasilnya tetap sama persis dgn sebelumnya.
// - Selisih negatif (Finish lebih awal dari Start, salah input) = 0, bukan
//   string rusak spt "-1:-1:-1.-500" (Slalom memang sudah begini).

const pad = (n, w = 2) => String(n).padStart(w, "0");

// "HH:MM:SS(.fff)" -> milidetik. Bagian yg hilang dianggap 0 ("05:01" =
// 5 jam 1 menit). Kosong/tidak valid -> NaN (pemanggil yg memutuskan
// fallback-nya, mis. Infinity utk sorting atau 0 utk penjumlahan).
export function parseClockMs(value) {
  if (value === null || value === undefined) return NaN;
  const str = String(value).trim();
  if (!str) return NaN;
  const neg = str.startsWith("-");
  const parts = (neg ? str.slice(1) : str).split(":");
  if (parts.length > 3) return NaN;
  const [h = "0", m = "0", sRaw = "0"] = parts;
  const [sInt = "0", frac = ""] = String(sRaw).split(".");
  if (![h, m, sInt].every((x) => /^\d*$/.test(String(x).trim()))) return NaN;
  if (!/^\d*$/.test(frac)) return NaN;
  const ms = frac ? Number((frac + "00").slice(0, 3)) : 0;
  const total =
    (Number(h) || 0) * 3600000 + (Number(m) || 0) * 60000 + (Number(sInt) || 0) * 1000 + ms;
  return neg ? -total : total;
}

// milidetik -> "HH:MM:SS.mmm". Negatif/tidak valid -> 0 (waktu lomba tidak
// pernah negatif). Jam tidak dibatasi 24.
export function formatClockMs(ms) {
  const t = Number.isFinite(ms) ? Math.max(0, Math.round(ms)) : 0;
  const hr = Math.floor(t / 3600000);
  const min = Math.floor((t % 3600000) / 60000);
  const sec = Math.floor((t % 60000) / 1000);
  const mss = t % 1000;
  return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(mss, 3)}`;
}

// Selisih Finish - Start (race time). Input tidak valid dianggap 0.
export function clockDiff(start, finish) {
  const a = parseClockMs(start);
  const b = parseClockMs(finish);
  return formatClockMs((Number.isFinite(b) ? b : 0) - (Number.isFinite(a) ? a : 0));
}

// Penjumlahan dua waktu (mis. race time + penalty). Input tidak valid = 0.
export function clockAdd(a, b) {
  const x = parseClockMs(a);
  const y = parseClockMs(b);
  return formatClockMs((Number.isFinite(x) ? x : 0) + (Number.isFinite(y) ? y : 0));
}

// Detik (angka) -> "HH:MM:SS.000" — sama dgn secondsToTimeString() lama
// (dipakai utk penalty yang dinyatakan dalam detik bulat).
export function secondsToClock(totalSec) {
  return formatClockMs(Math.floor(Math.max(0, Number(totalSec) || 0)) * 1000);
}
