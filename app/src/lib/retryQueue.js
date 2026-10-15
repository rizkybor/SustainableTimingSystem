// src/lib/retryQueue.js
//
// Antrean ulang-coba utk penulisan "fire-and-forget" di main process —
// status "team sudah Start" (dipakai halaman juri utk validasi penalty),
// babak aktif H2H, dan Live Result per langkah. Dulu kalau koneksi DB/
// internet putus TEPAT saat operator klik Start/Finish, tulisan itu cuma
// di-console.error lalu HILANG selamanya -> juri tertahan "team belum Start"
// walau koneksi sudah pulih, Live Result tertinggal.
//
// Aturan:
// - Gagal -> dicoba ulang otomatis dgn jeda makin panjang (default 2s, 5s,
//   10s, 20s, lalu tiap 30s), sampai maxAttempts (default 40 ≈ 20 menit).
// - Per `key` (mis. per tim) HANYA nilai TERBARU yang dipertahankan: tulisan
//   baru utk key yang sama membatalkan ulang-coba versi lama, dan hasil
//   gagal dari versi lama yang datang terlambat TIDAK boleh mengantre di
//   atas versi baru (dijaga lewat nomor urut per key).
//
// Modul murni & tanpa dependensi — timer disuntikkan supaya bisa diuji
// (tests/retryQueue.test.js).

export const DEFAULT_DELAYS = [2000, 5000, 10000, 20000, 30000];

export function createRetryQueue(options = {}) {
  const {
    delays = DEFAULT_DELAYS,
    maxAttempts = 40,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
    onGiveUp = null, // (key, error) => void
    onRecovered = null, // (key, attempts) => void
    onChange = null, // (pendingCount) => void — utk indikator UI
  } = options;

  const latestSeq = new Map(); // key -> nomor urut versi terbaru
  const pending = new Map(); // key -> { seq, attempt, timer, task }
  let lastReported = 0;
  const changed = () => {
    if (onChange && pending.size !== lastReported) {
      lastReported = pending.size;
      onChange(pending.size);
    }
  };

  const bump = (key) => {
    const seq = (latestSeq.get(key) || 0) + 1;
    latestSeq.set(key, seq);
    return seq;
  };
  const isLatest = (key, seq) => latestSeq.get(key) === seq;

  // Batalkan ulang-coba key ini & tandai versi berjalan sbg usang.
  // Return nomor versi BARU (dipakai retryLater(..., expectedSeq)).
  function cancel(key) {
    const p = pending.get(key);
    if (p) {
      clearTimeoutFn(p.timer);
      pending.delete(key);
      changed();
    }
    return bump(key); // versi yang sedang berjalan pun dianggap usang
  }

  function scheduleRetry(key, seq, task, attempt) {
    if (!isLatest(key, seq)) return; // sudah ada versi lebih baru
    if (attempt > maxAttempts) {
      pending.delete(key);
      changed();
      if (onGiveUp) onGiveUp(key, new Error("max attempts"));
      return;
    }
    const delay = delays[Math.min(attempt - 1, delays.length - 1)];
    const entry = { seq, attempt, task, timer: null };
    entry.timer = setTimeoutFn(async () => {
      if (pending.get(key) !== entry || !isLatest(key, seq)) return;
      try {
        await task();
        if (pending.get(key) === entry) pending.delete(key);
        changed();
        if (onRecovered) onRecovered(key, attempt);
      } catch (err) {
        if (attempt >= maxAttempts) {
          if (pending.get(key) === entry) pending.delete(key);
          changed();
          if (onGiveUp) onGiveUp(key, err);
          return;
        }
        scheduleRetry(key, seq, task, attempt + 1);
      }
    }, delay);
    pending.set(key, entry);
    changed();
  }

  // Coba ulang SEMUA antrean SEKARANG (mis. koneksi baru pulih / operator
  // klik "Coba sekarang") tanpa menunggu jeda berikutnya. Percobaan ke-N
  // tetap dihitung (tidak me-reset batas maxAttempts).
  function retryAllNow() {
    Array.from(pending.entries()).forEach(([key, entry]) => {
      clearTimeoutFn(entry.timer);
      pending.delete(key);
      scheduleRetryNow(key, entry);
    });
    changed();
  }

  function scheduleRetryNow(key, entry) {
    const { seq, task, attempt } = entry;
    const now = { seq, attempt, task, timer: null };
    now.timer = setTimeoutFn(async () => {
      if (pending.get(key) !== now || !isLatest(key, seq)) return;
      try {
        await task();
        if (pending.get(key) === now) pending.delete(key);
        changed();
        if (onRecovered) onRecovered(key, attempt);
      } catch (_err) {
        if (pending.get(key) === now) pending.delete(key);
        scheduleRetry(key, seq, task, attempt + 1);
      }
    }, 0);
    pending.set(key, now);
  }

  // Jalankan sekarang; kalau gagal, antre ulang-coba. Resolve true/false
  // (tidak pernah reject — pemanggil fire-and-forget).
  async function run(key, task) {
    cancel(key);
    const seq = latestSeq.get(key);
    try {
      await task();
      return true;
    } catch (_err) {
      scheduleRetry(key, seq, task, 1);
      return false;
    }
  }

  // Antre ulang-coba TANPA percobaan langsung (dipakai saat tulisan gabungan
  // sudah gagal & dipecah per key). `expectedSeq` (hasil cancel() saat
  // tulisan gabungan DIMULAI): kalau sejak itu sudah ada versi lebih baru utk
  // key ini, versi lama TIDAK diantre (return false).
  function retryLater(key, task, expectedSeq) {
    if (expectedSeq !== undefined && !isLatest(key, expectedSeq)) return false;
    const seq = cancel(key);
    scheduleRetry(key, seq, task, 1);
    return true;
  }

  return {
    run,
    retryLater,
    cancel,
    retryAllNow,
    size: () => pending.size,
    has: (key) => pending.has(key),
  };
}
