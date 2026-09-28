// Protest Time — configurable duration stamped on PDF Result printouts
// (every race category & initial) whenever the result is still UNOFFICIAL.
// Stored/displayed as "HH:MM:SS.mmm" text, same format already used
// elsewhere in the app for race times. Hours is always "00" here — the UI
// only exposes Minutes/Seconds/Milliseconds since protest windows are
// realistically sub-hour.

// BUG FIX (2026-09-28): default lama "00:00:05.000" = 5 DETIK — protest
// window realistis itu hitungan MENIT, bukan detik. Default sekarang 5
// MENIT ("00:05:00.000"), konsisten dgn UI-nya sendiri yang memang
// menonjolkan input Menit di atas Detik/Milidetik (lihat RaceSettings.vue).
export const DEFAULT_PROTEST_TIME = "00:05:00.000";

const PROTEST_TIME_RE = /^([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{3})$/;

export function isValidProtestTime(v) {
  return typeof v === "string" && PROTEST_TIME_RE.test(v);
}

export function normalizeProtestTime(v) {
  return isValidProtestTime(v) ? v : DEFAULT_PROTEST_TIME;
}

export function parseProtestTimeParts(v) {
  const m = PROTEST_TIME_RE.exec(normalizeProtestTime(v));
  return { min: Number(m[2]), sec: Number(m[3]), ms: Number(m[4]) };
}

export function buildProtestTime(min, sec, ms) {
  const pad = (n, w) => String(Math.max(0, Number(n) || 0)).padStart(w, "0");
  return `00:${pad(min, 2)}:${pad(sec, 2)}.${pad(ms, 3)}`;
}
