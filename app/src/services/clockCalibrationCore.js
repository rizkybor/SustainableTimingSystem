// Kalibrasi jam RaceTime2 milik sts-timingsystem — SATU sumber untuk ketiga
// aplikasi: Buffer-Timer-Start (start dari Long Range Start), STS Photo Finish
// (lewat clockSyncMain.js), dan aplikasi garis start sts-longrangestart.
// Logika murni (tanpa Electron) agar bisa diuji langsung.
//
// Jam RaceTime2 = jam lokal laptop − offset + trim, dengan offset menurut
// urutan prioritas:
//   a. kalibrasi MANUAL operator ("Set ke waktu RaceTime2" / kunci dari heartbeat)
//   b. heartbeat frame START RaceTime2 yang membawa waktu (min-filter)
//   c. jam lokal laptop (offset 0)
// trim = koreksi halus (ms, + = jam maju). Kalibrasi disimpan & dicatat di log.
//
// Catatan sintaks: di-bundle webpack 4 (Electron 13 / Node 14) — JANGAN
// pakai `?.`, `??`, atau literal BigInt.

const DAY_MS = 86400000;
const HB_WINDOW_MS = 5000;
const HB_FRESH_MS = 10000;
const HB_MIN_SAMPLES = 5;
const CAL_LOG_MAX = 50;
const TRIM_LIMIT_MS = 60000;

/** "HH:MM:SS.fff" → ms sejak tengah malam, atau null. */
function clockToMs(clock) {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?$/.exec(String(clock || "").trim());
  if (!m) return null;
  const frac = Number("0." + (m[4] || "0"));
  return ((Number(m[1]) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000 + frac * 1000;
}

/** epoch ms → ms sejak tengah malam waktu LOKAL laptop. */
function localTodMs(epochMs) {
  const d = new Date(epochMs);
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return epochMs - midnight;
}

function wrapDay(ms) {
  return ((ms % DAY_MS) + DAY_MS) % DAY_MS;
}

/** Selisih time-of-day terpendek (melewati tengah malam) dalam rentang ±12 jam. */
function diffDay(ms) {
  const d = wrapDay(ms);
  return d > DAY_MS / 2 ? d - DAY_MS : d;
}

/** ms sejak tengah malam → "HH:MM:SS.mmm" (milidetik dipotong, sama seperti RaceTime2). */
function formatClock(todMs) {
  const t = Math.floor(wrapDay(todMs));
  const p = function (n, l) {
    return String(n).padStart(l || 2, "0");
  };
  return p(Math.floor(t / 3600000)) + ":" + p(Math.floor((t % 3600000) / 60000)) + ":" + p(Math.floor((t % 60000) / 1000)) + "." + p(t % 1000, 3);
}

/**
 * @param {object} opts
 * @param {{load: Function, save: Function}} opts.storage  menyimpan "calibration"
 * @param {number} [opts.trimMs]  trim awal bila belum ada kalibrasi tersimpan
 */
function createClockCalibration(opts) {
  const storage = opts.storage;
  const listeners = [];
  let hbSamples = [];
  // manualOffsetMs = jam laptop − jam RaceTime2 (time-of-day); null = tidak manual.
  const cal = Object.assign(
    { manualOffsetMs: null, trimMs: Number(opts.trimMs) || 0, revision: 0, updatedAt: null, origin: "timing", log: [] },
    storage.load("calibration") || {}
  );

  /** kind: "operator" (diubah di timing), "sync" (dari Photo Finish) */
  function changed(kind) {
    storage.save("calibration", cal);
    listeners.slice().forEach(function (fn) {
      fn(kind);
    });
  }

  function heartbeatOffset() {
    const now = Date.now();
    const fresh = hbSamples.filter(function (s) {
      return now - s.at <= HB_FRESH_MS;
    });
    if (fresh.length < HB_MIN_SAMPLES) return null;
    let min = fresh[0].offsetMs;
    fresh.forEach(function (s) {
      if (s.offsetMs < min) min = s.offsetMs;
    });
    return min;
  }

  function basis() {
    if (cal.manualOffsetMs !== null) return { source: "manual", offsetMs: cal.manualOffsetMs };
    const hb = heartbeatOffset();
    if (hb !== null) return { source: "racetime", offsetMs: hb };
    return { source: "laptop", offsetMs: 0 };
  }

  /** Frame START RaceTime2 yang MEMBAWA jam berjalan → acuan jam RaceTime2. */
  function heartbeat(p) {
    const dev = clockToMs(p && p.deviceTime);
    if (dev === null || !p.hostMs) return;
    const now = Date.now();
    hbSamples.push({ at: now, offsetMs: diffDay(localTodMs(Number(p.hostMs)) - dev) });
    hbSamples = hbSamples.filter(function (s) {
      return now - s.at <= HB_WINDOW_MS;
    });
  }

  /** Jam RaceTime2 (ms sejak tengah malam) pada jam laptop `laptopMs`. */
  function todAt(laptopMs) {
    return wrapDay(localTodMs(laptopMs) - basis().offsetMs + cal.trimMs);
  }

  function summary() {
    const b = basis();
    return {
      basis: b.source,
      trimMs: cal.trimMs,
      // Jam RaceTime2 saat ini = jam lokal laptop − displayOffsetMs (renderer menghitung jam berjalan).
      displayOffsetMs: b.offsetMs - cal.trimMs,
      heartbeatAvailable: heartbeatOffset() !== null,
      calibration: {
        manual: cal.manualOffsetMs !== null,
        manualOffsetMs: cal.manualOffsetMs,
        trimMs: cal.trimMs,
        revision: cal.revision,
        updatedAt: cal.updatedAt,
        origin: cal.origin,
        log: cal.log.slice(0, 10),
      },
    };
  }

  function record(action, note, before, origin, at) {
    cal.revision += 1;
    cal.updatedAt = at || new Date().toISOString();
    cal.origin = origin;
    cal.log.unshift({ at: cal.updatedAt, action: action, note: note, before: before, after: { manualOffsetMs: cal.manualOffsetMs, trimMs: cal.trimMs } });
    cal.log = cal.log.slice(0, CAL_LOG_MAX);
  }

  /**
   * Kalibrasi manual oleh operator timing.
   *   { action: "set-time", deviceTime: "HH:MM:SS.mmm", hostMs }  jam RaceTime2 = deviceTime pada hostMs (trim di-reset)
   *   { action: "trim", deltaMs }        koreksi halus relatif
   *   { action: "set-trim", trimMs }     koreksi halus absolut
   *   { action: "reset-trim" }
   *   { action: "freeze-from-racetime" } kunci offset heartbeat RaceTime2 saat ini sebagai manual
   *   { action: "use-auto" }             hapus kalibrasi manual (heartbeat / jam laptop)
   */
  function calibrate(body) {
    const b = body || {};
    const before = { manualOffsetMs: cal.manualOffsetMs, trimMs: cal.trimMs };
    let note = "";
    if (b.action === "set-time") {
      const dev = clockToMs(b.deviceTime);
      const host = Number(b.hostMs);
      if (dev === null) throw new Error("Format waktu harus HH:MM:SS.mmm");
      if (!host) throw new Error("hostMs tidak valid");
      cal.manualOffsetMs = diffDay(localTodMs(host) - dev);
      cal.trimMs = 0;
      note = "Set ke " + b.deviceTime;
    } else if (b.action === "trim" || b.action === "set-trim") {
      const v = Number(b.action === "trim" ? b.deltaMs : b.trimMs);
      if (!isFinite(v)) throw new Error("Nilai trim tidak valid");
      const next = b.action === "trim" ? cal.trimMs + v : v;
      if (Math.abs(next) > TRIM_LIMIT_MS) throw new Error("Trim maksimal ±" + TRIM_LIMIT_MS / 1000 + " detik");
      cal.trimMs = Math.round(next * 1000) / 1000;
      note = b.action === "trim" ? "Trim " + (v > 0 ? "+" : "") + v + " ms" : "Trim = " + cal.trimMs + " ms";
    } else if (b.action === "reset-trim") {
      cal.trimMs = 0;
      note = "Reset trim";
    } else if (b.action === "freeze-from-racetime") {
      const hb = heartbeatOffset();
      if (hb === null) throw new Error("Belum ada heartbeat RaceTime2 berwaktu dalam 10 detik terakhir");
      cal.manualOffsetMs = hb;
      note = "Kunci dari heartbeat RaceTime2";
    } else if (b.action === "use-auto") {
      cal.manualOffsetMs = null;
      note = "Kembali otomatis";
    } else {
      throw new Error("Aksi kalibrasi tidak dikenal");
    }
    record(b.action, note, before, "timing");
    changed("operator");
    return summary();
  }

  /** Kalibrasi saat ini dalam bentuk yang disinkronkan ke Photo Finish. */
  function state() {
    return { manualOffsetMs: cal.manualOffsetMs, trimMs: cal.trimMs, updatedAt: cal.updatedAt, origin: cal.origin, revision: cal.revision };
  }

  /**
   * Terapkan kalibrasi dari Photo Finish (sudah dikonversi ke basis jam laptop
   * ini) bila LEBIH BARU. updatedAt disalin dari sumbernya, sehingga
   * pertukaran berikutnya tidak memantul balik.
   * @returns {boolean} true bila diterapkan
   */
  function applySynced(c) {
    const incoming = Date.parse(c && c.updatedAt);
    const current = cal.updatedAt ? Date.parse(cal.updatedAt) : 0;
    if (!isFinite(incoming) || incoming <= current) return false;
    const trim = Number(c.trimMs) || 0;
    if (Math.abs(trim) > TRIM_LIMIT_MS) return false;
    const before = { manualOffsetMs: cal.manualOffsetMs, trimMs: cal.trimMs };
    cal.manualOffsetMs = c.manualOffsetMs === null || c.manualOffsetMs === undefined ? null : Number(c.manualOffsetMs);
    cal.trimMs = Math.round(trim * 1000) / 1000;
    record("sync-photofinish", "Disinkronkan dari Photo Finish" + (c.note ? " (" + c.note + ")" : ""), before, "photofinish", new Date(incoming).toISOString());
    changed("sync");
    return true;
  }

  return {
    basis: basis,
    heartbeat: heartbeat,
    heartbeatOffset: heartbeatOffset,
    todAt: todAt,
    summary: summary,
    calibrate: calibrate,
    state: state,
    applySynced: applySynced,
    trimMs: function () {
      return cal.trimMs;
    },
    lastNote: function () {
      return cal.log.length ? cal.log[0].note : null;
    },
    /** @returns {Function} berhenti berlangganan */
    onChange: function (fn) {
      listeners.push(fn);
      return function () {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };
}

module.exports = {
  createClockCalibration: createClockCalibration,
  clockToMs: clockToMs,
  localTodMs: localTodMs,
  wrapDay: wrapDay,
  diffDay: diffDay,
  formatClock: formatClock,
  TRIM_LIMIT_MS: TRIM_LIMIT_MS,
};
