// Klien STS Long Range Start — logika murni (tanpa Electron) agar bisa diuji
// langsung terhadap server sts-longrangestart. Dijalankan di MAIN process
// lewat longrangeMain.js supaya secret (token & HMAC) tidak pernah masuk ke
// bundle renderer.
//
// Alur: pistol Seiko PS-77 di garis start → HP/Laptop (aplikasi web
// sts-longrangestart) → server sts-longrangestart → socket.io "lrs:start"
// (HMAC) → klien ini → Buffer-Timer-Start di halaman race.
//
// Basis waktu: server mengirim `startServerMs` (epoch jam server). Klien ini
// mengubahnya ke jam yang dipakai Buffer-Timer-Start dalam dua langkah:
//   1. jam server → jam laptop timing   (ping-pong "clock:ping", RTT terkecil)
//   2. jam laptop → jam RaceTime2, urutan prioritas:
//      a. kalibrasi MANUAL operator ("Set ke waktu RaceTime2" / kunci dari heartbeat)
//      b. heartbeat START RaceTime2 yang membawa waktu (min-filter)
//      c. jam lokal laptop
//      lalu + trim (koreksi halus ms, diatur operator; awal dari LRS_TRIM_MS).
//   Kalibrasi disimpan (storage "calibration") dan dicatat di log kalibrasi.
//
// Catatan sintaks: main process di-bundle webpack 4 (Electron 13 / Node 14)
// — JANGAN pakai `?.`, `??`, atau literal BigInt.
const crypto = require("crypto");

const DAY_MS = 86400000;
const CLOCK_SAMPLES = 8;
const CLOCK_EVERY_MS = 60000;
const CLOCK_STATE_EVERY_MS = 15000;
const PING_TIMEOUT_MS = 2000;
const HB_WINDOW_MS = 5000;
const HB_FRESH_MS = 10000;
const HB_MIN_SAMPLES = 5;
const SEEN_MAX = 500;
const HISTORY_MAX = 100;
const CAL_LOG_MAX = 50;
const TRIM_LIMIT_MS = 60000;

// HARUS identik dengan canonical() di sts-longrangestart/server/index.mjs.
function canonical(v) {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return v.map(canonical);
  if (typeof v === "object") {
    const out = {};
    Object.keys(v)
      .sort()
      .forEach(function (k) {
        if (v[k] !== undefined) out[k] = canonical(v[k]);
      });
    return out;
  }
  return v;
}

function hmac(secret, payload) {
  return crypto.createHmac("sha256", secret).update(JSON.stringify(canonical(payload))).digest("hex");
}

function verify(secret, msg) {
  if (!msg || typeof msg.sig !== "string" || !/^[0-9a-f]{64}$/.test(msg.sig)) return false;
  const rest = Object.assign({}, msg);
  delete rest.sig;
  return crypto.timingSafeEqual(Buffer.from(hmac(secret, rest), "hex"), Buffer.from(msg.sig, "hex"));
}

/** "HH:MM:SS.fff" → ms sejak tengah malam, atau null. */
function clockToMs(clock) {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?$/.exec(String(clock || "").trim());
  if (!m) return null;
  const frac = Number(("0." + (m[4] || "0")));
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
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  return p(h) + ":" + p(m) + ":" + p(s) + "." + p(t % 1000, 3);
}

/**
 * @param {object} opts
 * @param {string} opts.apiUrl        URL server sts-longrangestart
 * @param {string} opts.timingToken   LRS_TIMING_TOKEN server
 * @param {string} opts.hmacSecret    LRS_HMAC_SECRET server
 * @param {number} [opts.trimMs]      trim awal (ms, + = waktu start maju) bila belum ada kalibrasi tersimpan
 * @param {Function} opts.io          io() dari socket.io-client
 * @param {Function} opts.now         jam epoch laptop saat ini (ms, boleh pecahan)
 * @param {{load: Function, save: Function}} opts.storage
 * @param {Function} [opts.onStart]   dipanggil untuk setiap START baru
 * @param {Function} [opts.onRecall]  dipanggil untuk setiap RECALL baru
 * @param {Function} [opts.onStatus]
 */
function createLongrangeClient(opts) {
  const storage = opts.storage;
  let socket = null;
  let clockTimer = null;
  let stateTimer = null;
  let syncing = null;
  let lastError = null;
  let hbSamples = [];
  const clock = { synced: false, offsetMs: 0, rttMs: null, syncedAt: null };

  // startId yang sudah diproses — server mengirim ulang setelah reconnect.
  let seen = storage.load("seen") || [];
  let history = storage.load("history") || [];
  // Kalibrasi manual jam RaceTime2. manualOffsetMs = jam laptop − jam RaceTime2
  // (time-of-day); null = tidak manual (heartbeat / jam laptop).
  const cal = Object.assign(
    { manualOffsetMs: null, trimMs: Number(opts.trimMs) || 0, revision: 0, updatedAt: null, log: [] },
    storage.load("calibration") || {}
  );

  function heartbeatOffset() {
    const now = Date.now();
    const fresh = hbSamples.filter(function (s) {
      return now - s.at <= HB_FRESH_MS;
    });
    if (fresh.length >= HB_MIN_SAMPLES) {
      let min = fresh[0].offsetMs;
      fresh.forEach(function (s) {
        if (s.offsetMs < min) min = s.offsetMs;
      });
      return min;
    }
    return null;
  }

  function basis() {
    if (cal.manualOffsetMs !== null) return { source: "manual", offsetMs: cal.manualOffsetMs };
    const hb = heartbeatOffset();
    if (hb !== null) return { source: "racetime", offsetMs: hb };
    return { source: "laptop", offsetMs: 0 };
  }

  function status() {
    const b = basis();
    return {
      enabled: true,
      connected: !!(socket && socket.connected),
      clockSynced: clock.synced,
      serverOffsetMs: clock.offsetMs,
      rttMs: clock.rttMs,
      basis: b.source,
      trimMs: cal.trimMs,
      // Jam Buffer-Timer-Start saat ini = jam lokal laptop − displayOffsetMs (renderer menghitung jam berjalan).
      displayOffsetMs: b.offsetMs - cal.trimMs,
      heartbeatAvailable: heartbeatOffset() !== null,
      calibration: {
        manual: cal.manualOffsetMs !== null,
        manualOffsetMs: cal.manualOffsetMs,
        trimMs: cal.trimMs,
        revision: cal.revision,
        updatedAt: cal.updatedAt,
        log: cal.log.slice(0, 10),
      },
      lastError: lastError,
      lastStart: history[0] || null,
    };
  }

  /**
   * Status jam kalibrasi untuk aplikasi garis start: jam Buffer-Timer-Start
   * (ms sejak tengah malam) = wrap(jam server epoch + todShiftMs). Dengan ini
   * HP menampilkan waktu basis RaceTime2 (hasil kalibrasi), bukan jam laptop/server.
   */
  function clockState() {
    const b = basis();
    const tzMs = -new Date().getTimezoneOffset() * 60000;
    return {
      todShiftMs: Math.round(-clock.offsetMs + tzMs - (b.offsetMs - cal.trimMs)),
      basis: b.source,
      trimMs: cal.trimMs,
      revision: cal.revision,
      updatedAt: cal.updatedAt,
      note: cal.log.length ? cal.log[0].note : null,
    };
  }

  function sendClockState() {
    if (socket && socket.connected && clock.synced) socket.emit("timing:clock-state", clockState());
  }

  function emitStatus() {
    if (typeof opts.onStatus === "function") opts.onStatus(status());
    sendClockState();
  }

  async function doSync() {
    const results = [];
    for (let i = 0; i < CLOCK_SAMPLES && socket && socket.connected; i++) {
      try {
        const t0 = opts.now();
        const res = await socket.timeout(PING_TIMEOUT_MS).emitWithAck("clock:ping", {});
        const t1 = opts.now();
        if (res && typeof res.serverTime === "number") results.push({ rtt: t1 - t0, offset: res.serverTime - (t0 + t1) / 2 });
      } catch (_e) {
        // timeout satu sampel — lanjut
      }
    }
    if (!results.length) return false;
    results.sort(function (a, b) {
      return a.rtt - b.rtt;
    });
    clock.synced = true;
    clock.offsetMs = results[0].offset;
    clock.rttMs = results[0].rtt;
    clock.syncedAt = new Date().toISOString();
    emitStatus();
    return true;
  }

  function syncClock() {
    if (!syncing) {
      syncing = doSync().finally(function () {
        syncing = null;
      });
    }
    return syncing;
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

  /** jam server (epoch ms) → "HH:MM:SS.mmm" basis Buffer-Timer-Start. */
  function toBufferTime(startServerMs) {
    const b = basis();
    const laptopMs = startServerMs - clock.offsetMs;
    return { time: formatClock(localTodMs(laptopMs) - b.offsetMs + cal.trimMs), basis: b.source };
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
    cal.revision += 1;
    cal.updatedAt = new Date().toISOString();
    cal.log.unshift({ at: cal.updatedAt, action: b.action, note: note, before: before, after: { manualOffsetMs: cal.manualOffsetMs, trimMs: cal.trimMs } });
    cal.log = cal.log.slice(0, CAL_LOG_MAX);
    storage.save("calibration", cal);
    emitStatus();
    return status();
  }

  /** Hitung ulang waktu satu start dengan kalibrasi saat ini, lalu terapkan lagi ke halaman race. */
  function recompute(startId) {
    const entry = history.filter(function (h) {
      return h.startId === startId && h.kind === "START";
    })[0];
    if (!entry) throw new Error("Start tidak ditemukan");
    const conv = toBufferTime(Number(entry.startServerMs));
    if (!entry.originalTime) entry.originalTime = entry.time;
    entry.time = conv.time;
    entry.basis = conv.basis;
    entry.calibrationRevision = cal.revision;
    entry.recomputedAt = new Date().toISOString();
    storage.save("history", history);
    // Perbarui waktu yang ditampilkan aplikasi garis start untuk start ini.
    if (socket && socket.connected) socket.emit("timing:recomputed", { startId: entry.startId, time: entry.time });
    if (typeof opts.onStart === "function") opts.onStart(Object.assign({ recomputed: true }, entry));
    emitStatus();
    return Object.assign({}, entry);
  }

  async function onStartMessage(msg, ack) {
    const reply = typeof ack === "function" ? ack : function () {};
    if (!verify(opts.hmacSecret, msg)) {
      lastError = "Pesan Long Range Start dengan tanda tangan tidak valid ditolak";
      emitStatus();
      return reply({ ok: false, error: "HMAC tidak valid" });
    }
    if (seen.indexOf(msg.startId) !== -1) return reply({ ok: true, duplicate: true });

    // Kiriman ulang tepat setelah tersambung bisa tiba sebelum jam tersinkron.
    if (!clock.synced) await syncClock();

    const conv = toBufferTime(Number(msg.startServerMs));
    const entry = {
      startId: msg.startId,
      kind: msg.kind,
      refStartId: msg.refStartId || null,
      time: conv.time,
      basis: conv.basis,
      clockSynced: clock.synced,
      starterClockSynced: !!msg.clockSynced,
      startServerMs: msg.startServerMs,
      eventName: msg.eventName || null,
      raceId: msg.raceId || null,
      wave: msg.wave === undefined ? null : msg.wave,
      deviceName: msg.deviceName || null,
      inputMode: msg.inputMode || null,
      calibrationRevision: cal.revision,
      receivedAt: new Date().toISOString(),
    };
    if (entry.kind === "RECALL") {
      const ref = history.filter(function (h) {
        return h.startId === entry.refStartId;
      })[0];
      entry.refTime = ref ? ref.time : null;
      if (ref) ref.recalled = true;
    }

    seen.push(msg.startId);
    if (seen.length > SEEN_MAX) seen = seen.slice(-SEEN_MAX);
    history.unshift(entry);
    history = history.slice(0, HISTORY_MAX);
    storage.save("seen", seen);
    storage.save("history", history);

    // Salinan — pemanggil tidak boleh ikut mengubah riwayat internal.
    if (entry.kind === "RECALL") {
      if (typeof opts.onRecall === "function") opts.onRecall(Object.assign({}, entry));
    } else if (typeof opts.onStart === "function") {
      opts.onStart(Object.assign({}, entry));
    }
    emitStatus();
    reply({ ok: true, time: entry.time });
  }

  function start() {
    socket = opts.io(opts.apiUrl, {
      auth: { token: opts.timingToken },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    socket.on("connect", function () {
      lastError = null;
      emitStatus();
      syncClock();
    });
    socket.on("disconnect", function (reason) {
      emitStatus();
      // Server di-restart dengan rapi → socket.io tidak reconnect sendiri.
      if (reason === "io server disconnect") {
        setTimeout(function () {
          if (socket && !socket.connected) socket.connect();
        }, 1000);
      }
    });
    socket.on("connect_error", function (err) {
      lastError = "Tidak bisa terhubung ke Long Range Start: " + ((err && err.message) || err);
      emitStatus();
    });
    socket.on("lrs:start", onStartMessage);
    clockTimer = setInterval(syncClock, CLOCK_EVERY_MS);
    // Basis bisa berubah sendiri (heartbeat RaceTime2 datang/hilang) — kirim berkala.
    stateTimer = setInterval(sendClockState, CLOCK_STATE_EVERY_MS);
  }

  function stop() {
    if (clockTimer) clearInterval(clockTimer);
    if (stateTimer) clearInterval(stateTimer);
    clockTimer = null;
    stateTimer = null;
    if (socket) socket.close();
    socket = null;
  }

  return {
    start: start,
    stop: stop,
    heartbeat: heartbeat,
    syncClock: syncClock,
    toBufferTime: toBufferTime,
    calibrate: calibrate,
    clockState: clockState,
    recompute: recompute,
    status: status,
    history: function () {
      return history.slice();
    },
  };
}

module.exports = {
  createLongrangeClient: createLongrangeClient,
  verify: verify,
  formatClock: formatClock,
  clockToMs: clockToMs,
  localTodMs: localTodMs,
};
