// Klien STS Photo Finish — logika murni (tanpa Electron) agar bisa diuji
// langsung terhadap API photofinish. Dijalankan di MAIN process lewat
// photofinishMain.js supaya secret (token perangkat & HMAC) tidak pernah
// masuk ke bundle renderer.
//
// Kontrak pesan: sts-photofinish/api/src/schemas.ts (satu sumber kebenaran).
//
// Catatan sintaks: main process di-bundle webpack 4 (Electron 13 / Node 14)
// — JANGAN pakai `?.`, `??`, atau literal BigInt (`1000n`).
/* global BigInt */ // Node 14 punya BigInt; konfigurasi ESLint proyek belum mengenalnya
const crypto = require("crypto");

const NS_PER_MS = BigInt(1000000);
const NS_PER_SEC = BigInt(1000000000);
const CLOCK_WINDOW_MS = 5000;
const CLOCK_SEND_EVERY_MS = 5000;
const ACK_TIMEOUT_MS = 3000;
const PF_CLOCK_SAMPLES = 8;
const PF_CLOCK_EVERY_MS = 60000;
const HISTORY_MAX = 300; // riwayat hasil Photo Finish yang disimpan (panel "Hasil Photo Finish")

// HARUS identik dengan canonicalJson() di sts-photofinish/api/src/canonical.ts
// (payload di sini hanya berisi string/angka — nilai ns selalu string).
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

function sign(secret, payload) {
  return Object.assign({}, payload, { sig: hmac(secret, payload) });
}

function verify(secret, msg) {
  if (!msg || typeof msg.sig !== "string" || !/^[0-9a-f]{64}$/.test(msg.sig)) return false;
  const rest = Object.assign({}, msg);
  delete rest.sig;
  return crypto.timingSafeEqual(Buffer.from(hmac(secret, rest), "hex"), Buffer.from(msg.sig, "hex"));
}

/** "HH:MM:SS.fff" → BigInt ns sejak tengah malam, atau null. */
function clockToNs(clock) {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?$/.exec(String(clock || "").trim());
  if (!m) return null;
  const secs = (BigInt(m[1]) * BigInt(60) + BigInt(m[2])) * BigInt(60) + BigInt(m[3]);
  return secs * NS_PER_SEC + BigInt((m[4] || "").padEnd(9, "0"));
}

/**
 * Estimasi waktu transmisi satu frame serial: start + 8 data + stop = 10 bit
 * per byte. Di 1200 baud frame bare 20 byte (19 + CR) ≈ 167 ms — waktu terima
 * di host telat sebesar ini dari kejadian sebenarnya.
 */
function serialLatencyNs(frameBytes, baudRate) {
  if (!frameBytes || !baudRate) return "0";
  return ((BigInt(frameBytes) * BigInt(10) * NS_PER_SEC) / BigInt(baudRate)).toString();
}

/**
 * @param {object} opts
 * @param {string} opts.apiUrl
 * @param {string} opts.deviceToken  token perangkat (npm run token:device -w api -- timing <nama>)
 * @param {string} opts.hmacSecret   sama dengan PF_HMAC_SECRET di API
 * @param {Function} opts.io         io() dari socket.io-client
 * @param {{load: Function, save: Function}} opts.storage  persistensi kecil (JSON)
 * @param {Function} opts.onVerified dipanggil untuk setiap hasil photo finish baru/terkoreksi
 * @param {Function} [opts.onStatus] dipanggil saat status koneksi/antrean berubah
 * @param {Function} [opts.onTrigger] dipanggil untuk setiap perahu yang terdeteksi kamera Photo Finish
 * @param {Function} [opts.onCalibration] dipanggil saat kalibrasi jam Photo Finish diterima, atau jam
 *                   server PF baru tersinkron (untuk penyelaras kalibrasi Long Range ⇄ Photo Finish)
 */
function createPhotofinishClient(opts) {
  const storage = opts.storage;
  const bootId = crypto.randomUUID ? crypto.randomUUID() : uuidV4();
  let seq = 0;
  let socket = null;
  let flushing = false;
  let clockTimer = null;
  let lastError = null;
  let samples = [];
  // Jam server API Photo Finish − jam laptop (ms), ping-pong "clock:ping" RTT terkecil.
  const pfClock = { synced: false, offsetMs: 0, rttMs: null, syncedAt: null };
  let pfClockTimer = null;
  // Kalibrasi jam Photo Finish terakhir yang diterima ("pf:calibration", HMAC valid).
  let remoteCal = null;

  // Antrean sinyal — disimpan ke disk agar tidak hilang saat Wi-Fi putus
  // atau aplikasi ditutup sebelum sempat terkirim.
  let outbox = storage.load("outbox") || [];
  // Hasil photo finish yang sudah diterima tetapi belum diterapkan di view.
  let pending = storage.load("pending") || {};
  // Riwayat kiriman hasil juri — untuk panel "Hasil Photo Finish" (hanya
  // dilihat & disalin admin). Terbaru di depan, maksimal HISTORY_MAX entri.
  let history = storage.load("history") || [];
  // Hasil yang sudah menunggu sebelum riwayat ada (versi lama) ikut tampil.
  Object.keys(pending).forEach(function (id) {
    const m = pending[id];
    const known = history.some(function (h) {
      return h.crossingId === m.crossingId && h.revision === m.revision;
    });
    if (!known) history.push(Object.assign(historyEntry(m, false), { receivedAt: m.verifiedAt || null }));
  });

  function status() {
    return {
      enabled: true,
      connected: !!(socket && socket.connected),
      outbox: outbox.length,
      pending: Object.keys(pending).length,
      lastError: lastError,
    };
  }

  function emitStatus() {
    if (typeof opts.onStatus === "function") opts.onStatus(status());
  }

  async function flush() {
    if (flushing) return;
    flushing = true;
    try {
      while (socket && socket.connected && outbox.length) {
        let res = null;
        try {
          res = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck("timing:impulse", outbox[0]);
        } catch (_e) {
          res = null; // timeout — coba lagi saat reconnect
        }
        if (!res) break;
        if (!res.ok) {
          // Ditolak permanen (mis. HMAC salah) — jangan blok antrean selamanya.
          lastError = "Sinyal ditolak API: " + (res.error || "tidak diketahui");
        }
        outbox.shift();
        storage.save("outbox", outbox);
      }
    } finally {
      flushing = false;
      emitStatus();
    }
  }

  function sendImpulse(p) {
    const payload = {
      type: "timing:impulse",
      bootId: bootId,
      seq: seq++,
      channel: p.channel === "START" ? "START" : "FINISH",
      hostNs: String(p.hostNs),
    };
    // Frame bare RaceTime2 tidak membawa waktu — biarkan API memakai jam PF.
    if (p.deviceTime && clockToNs(p.deviceTime) !== null) payload.deviceTime = String(p.deviceTime);
    if (p.serialLatencyNs && p.serialLatencyNs !== "0") payload.serialLatencyNs = String(p.serialLatencyNs);
    outbox.push(sign(opts.hmacSecret, payload));
    storage.save("outbox", outbox);
    emitStatus();
    flush();
  }

  /** Frame heartbeat RaceTime2 yang MEMBAWA jam berjalan (bukan frame bare). */
  function heartbeat(p) {
    const dev = clockToNs(p.deviceTime);
    if (dev === null || !p.hostNs) return;
    const now = Date.now();
    samples.push({ at: now, offset: BigInt(p.hostNs) - dev });
    samples = samples.filter(function (s) {
      return now - s.at <= CLOCK_WINDOW_MS;
    });
  }

  function sendClock() {
    if (!socket || !socket.connected || samples.length < 5) return;
    // Filter minimum: buang jitter USB/OS; delay transmisi konstan terserap.
    let min = samples[0].offset;
    samples.forEach(function (s) {
      if (s.offset < min) min = s.offset;
    });
    socket.emit(
      "timing:clock",
      sign(opts.hmacSecret, {
        type: "timing:clock",
        bootId: bootId,
        deviceOffsetNs: min.toString(),
        samples: samples.length,
        windowMs: CLOCK_WINDOW_MS,
        hostNs: String(opts.now()),
      })
    );
  }

  function onVerified(msg, ack) {
    if (!verify(opts.hmacSecret, msg)) {
      lastError = "Hasil photo finish dengan tanda tangan tidak valid ditolak";
      if (typeof ack === "function") ack({ ok: false, error: "HMAC tidak valid" });
      emitStatus();
      return;
    }
    const prev = pending[msg.crossingId];
    const fresh = !prev || prev.revision <= msg.revision;
    if (fresh) {
      pending[msg.crossingId] = msg;
      storage.save("pending", pending);
      if (typeof opts.onVerified === "function") opts.onVerified(msg);
    }
    recordReceived(msg, !fresh);
    // Ack = "sudah diterima & disimpan aplikasi timing". Penerapan ke view
    // dilacak terpisah lewat markApplied() — view bisa saja belum dibuka.
    if (typeof ack === "function") ack({ ok: true });
    emitStatus();
  }

  function historyChanged() {
    history = history.slice(0, HISTORY_MAX);
    storage.save("history", history);
    if (typeof opts.onHistory === "function") opts.onHistory();
  }

  function recordReceived(msg, stale) {
    const dup = history.some(function (h) {
      return h.crossingId === msg.crossingId && h.revision === msg.revision;
    });
    if (dup) return; // kiriman ulang (reconnect) — sudah tercatat
    history.forEach(function (h) {
      if (h.crossingId === msg.crossingId && h.revision < msg.revision && h.status === "menunggu") h.status = "diganti";
    });
    history.unshift(historyEntry(msg, stale));
    historyChanged();
  }

  function historyEntry(msg, stale) {
    return {
      crossingId: msg.crossingId,
      revision: msg.revision,
      receivedAt: new Date().toISOString(),
      eventId: msg.eventId,
      eventName: msg.eventName || null,
      sessionLabel: msg.sessionLabel || null,
      sessionNote: msg.sessionNote || null,
      raceCategory: msg.raceCategory || null,
      heatId: msg.heatId || null,
      teamId: msg.teamId,
      teamName: msg.teamName || null,
      bib: msg.bib || null,
      rank: msg.rank,
      finishTime: msg.finishTime,
      officialTime: msg.officialTime,
      timeSource: msg.timeSource,
      penalties: msg.penalties || {},
      verifiedByName: msg.verifiedByName || null,
      verifiedAt: msg.verifiedAt || null,
      reason: msg.reason || null,
      status: stale ? "diganti" : "menunggu",
      note: null,
      appliedAt: null,
    };
  }

  /** outcome: "diterapkan" (Finish Time diisi) atau "dipertahankan" (operator menolak mengganti). */
  function markApplied(crossingId, revision, outcome) {
    const cur = pending[crossingId];
    if (cur && cur.revision <= revision) {
      delete pending[crossingId];
      storage.save("pending", pending);
      emitStatus();
    }
    let touched = false;
    history.forEach(function (h) {
      if (h.crossingId !== crossingId || h.status !== "menunggu" || h.revision > revision) return;
      h.status = h.revision === revision ? outcome || "diterapkan" : "diganti";
      h.appliedAt = new Date().toISOString();
      h.note = null;
      touched = true;
    });
    if (touched) historyChanged();
  }

  /**
   * Hapus satu baris riwayat (panel Hasil Photo Finish). Bila hasil itu masih
   * menunggu diterapkan, antreannya ikut dibuang — operator memutuskan tidak
   * memakainya. Data di STS Photo Finish TIDAK ikut terhapus.
   */
  function deleteHistory(crossingId, revision) {
    const before = history.length;
    history = history.filter(function (h) {
      return !(h.crossingId === crossingId && h.revision === revision);
    });
    const cur = pending[crossingId];
    if (cur && cur.revision === revision) {
      delete pending[crossingId];
      storage.save("pending", pending);
      emitStatus();
    }
    if (history.length !== before) historyChanged();
    return before - history.length;
  }

  /** Gambar bukti (slit-scan + foto frame) satu hasil; URL absolut, berumur pendek. */
  async function resultImage(crossingId) {
    if (!socket || !socket.connected) return { ok: false, error: "Photo Finish tidak terhubung" };
    try {
      const res = await socket.timeout(8000).emitWithAck("timing:result-image", { crossingId: String(crossingId) });
      if (!res || !res.ok) return { ok: false, error: (res && res.error) || "Gambar tidak tersedia" };
      const base = String(opts.apiUrl).replace(/\/+$/, "");
      res.url = base + res.url;
      if (res.frameUrl) res.frameUrl = base + res.frameUrl;
      return res;
    } catch (_e) {
      return { ok: false, error: "Photo Finish tidak menjawab (timeout)" };
    }
  }

  /** Alasan hasil masih menunggu (dilaporkan halaman race), mis. tim tidak tampil. */
  function noteResult(crossingId, revision, note) {
    let touched = false;
    history.forEach(function (h) {
      if (h.crossingId === crossingId && h.revision === revision && h.status === "menunggu" && h.note !== note) {
        h.note = note;
        touched = true;
      }
    });
    if (touched) historyChanged();
  }

  function laptopNowMs() {
    return Number(opts.now()) / 1e6; // opts.now() = epoch ns (string)
  }

  /** Ukur jam server Photo Finish terhadap jam laptop (dipakai konversi kalibrasi). */
  async function syncPfClock() {
    const results = [];
    for (let i = 0; i < PF_CLOCK_SAMPLES && socket && socket.connected; i++) {
      try {
        const t0 = laptopNowMs();
        const res = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck("clock:ping", {});
        const t1 = laptopNowMs();
        if (res && res.ok && res.serverNs) results.push({ rtt: t1 - t0, offset: Number(res.serverNs) / 1e6 - (t0 + t1) / 2 });
      } catch (_e) {
        // timeout — sampel dilewati
      }
    }
    if (!results.length) return;
    results.sort(function (a, b) {
      return a.rtt - b.rtt;
    });
    pfClock.offsetMs = results[0].offset;
    pfClock.rttMs = results[0].rtt;
    pfClock.synced = true;
    pfClock.syncedAt = Date.now();
    if (remoteCal && typeof opts.onCalibration === "function") opts.onCalibration(remoteCal);
  }

  /** Kirim kalibrasi (sudah dalam basis jam server PF) — diterapkan PF bila lebih baru. */
  async function sendCalibration(cal) {
    if (!socket || !socket.connected) return { ok: false, error: "Photo Finish tidak terhubung" };
    const payload = sign(opts.hmacSecret, {
      type: "timing:calibration",
      mode: cal.mode,
      manualOffsetNs: cal.manualOffsetNs,
      trimNs: cal.trimNs,
      updatedAt: cal.updatedAt,
      note: cal.note || null,
    });
    try {
      return await socket.timeout(ACK_TIMEOUT_MS).emitWithAck("timing:calibration", payload);
    } catch (_e) {
      return { ok: false, error: "Photo Finish tidak menjawab (timeout)" };
    }
  }

  function start() {
    socket = opts.io(opts.apiUrl, {
      auth: { token: opts.deviceToken },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    socket.on("connect", function () {
      lastError = null;
      emitStatus();
      flush();
      syncPfClock();
    });
    socket.on("pf:calibration", function (msg) {
      if (!verify(opts.hmacSecret, msg)) return;
      remoteCal = msg;
      if (typeof opts.onCalibration === "function") opts.onCalibration(msg);
    });
    socket.on("disconnect", function (reason) {
      emitStatus();
      // API ditutup/di-restart dengan rapi (Ctrl+C dev:local, deploy) → alasan
      // "io server disconnect", dan socket.io TIDAK reconnect sendiri. Sambung
      // ulang manual; bila API belum hidup, reconnect bawaan socket.io mengambil
      // alih (jeda bertahap s.d. 10 dtk).
      if (reason === "io server disconnect") {
        setTimeout(function () {
          if (socket && !socket.connected) socket.connect();
        }, 1000);
      }
    });
    socket.on("connect_error", function (err) {
      lastError = "Tidak bisa terhubung ke Photo Finish: " + ((err && err.message) || err);
      emitStatus();
    });
    socket.on("photofinish:verified", onVerified);
    // Setiap perahu yang terdeteksi kamera Photo Finish → baris Registration Id "PF…"
    // di panel waktu + Buffer-Timer-Finish. Pesan palsu (HMAC salah) dibuang.
    socket.on("photofinish:trigger", function (msg) {
      if (!verify(opts.hmacSecret, msg)) return;
      if (typeof opts.onTrigger === "function") opts.onTrigger(msg);
    });
    clockTimer = setInterval(sendClock, CLOCK_SEND_EVERY_MS);
    pfClockTimer = setInterval(syncPfClock, PF_CLOCK_EVERY_MS);
  }

  function stop() {
    if (clockTimer) clearInterval(clockTimer);
    if (pfClockTimer) clearInterval(pfClockTimer);
    clockTimer = null;
    pfClockTimer = null;
    if (socket) socket.close();
    socket = null;
  }

  return {
    start: start,
    stop: stop,
    sendImpulse: sendImpulse,
    heartbeat: heartbeat,
    markApplied: markApplied,
    noteResult: noteResult,
    deleteHistory: deleteHistory,
    resultImage: resultImage,
    history: function () {
      return history.slice();
    },
    pending: function () {
      return Object.keys(pending).map(function (k) {
        return pending[k];
      });
    },
    status: status,
    pfClock: function () {
      return Object.assign({}, pfClock);
    },
    remoteCalibration: function () {
      return remoteCal;
    },
    sendCalibration: sendCalibration,
    flush: flush,
  };
}

function uuidV4() {
  const b = crypto.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString("hex");
  return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
}

module.exports = {
  createPhotofinishClient: createPhotofinishClient,
  serialLatencyNs: serialLatencyNs,
  clockToNs: clockToNs,
  sign: sign,
  verify: verify,
  NS_PER_MS: NS_PER_MS,
};
