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

  // Antrean impuls — disimpan ke disk agar tidak hilang saat Wi-Fi putus
  // atau aplikasi ditutup sebelum sempat terkirim.
  let outbox = storage.load("outbox") || [];
  // Hasil photo finish yang sudah diterima tetapi belum diterapkan di view.
  let pending = storage.load("pending") || {};

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
          lastError = "Impuls ditolak API: " + (res.error || "tidak diketahui");
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
    if (!prev || prev.revision <= msg.revision) {
      pending[msg.crossingId] = msg;
      storage.save("pending", pending);
      if (typeof opts.onVerified === "function") opts.onVerified(msg);
    }
    // Ack = "sudah diterima & disimpan aplikasi timing". Penerapan ke view
    // dilacak terpisah lewat markApplied() — view bisa saja belum dibuka.
    if (typeof ack === "function") ack({ ok: true });
    emitStatus();
  }

  function markApplied(crossingId, revision) {
    const cur = pending[crossingId];
    if (cur && cur.revision <= revision) {
      delete pending[crossingId];
      storage.save("pending", pending);
      emitStatus();
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
    });
    socket.on("disconnect", emitStatus);
    socket.on("connect_error", function (err) {
      lastError = "Tidak bisa terhubung ke Photo Finish: " + ((err && err.message) || err);
      emitStatus();
    });
    socket.on("photofinish:verified", onVerified);
    clockTimer = setInterval(sendClock, CLOCK_SEND_EVERY_MS);
  }

  function stop() {
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = null;
    if (socket) socket.close();
    socket = null;
  }

  return {
    start: start,
    stop: stop,
    sendImpulse: sendImpulse,
    heartbeat: heartbeat,
    markApplied: markApplied,
    pending: function () {
      return Object.keys(pending).map(function (k) {
        return pending[k];
      });
    },
    status: status,
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
