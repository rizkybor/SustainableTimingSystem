// Penyelaras kalibrasi jam RaceTime2: STS Photo Finish ⇄ STS Long Range Start.
//
// sts-timingsystem tersambung ke keduanya, jadi aplikasi ini yang menjadi
// penghubung (lihat clockSyncCore.js untuk konversi & aturan):
//   - Admin kalibrasi di web Photo Finish   → "pf:calibration" → kalibrasi Long Range
//     ikut berubah → aplikasi garis start (sts-longrangestart) menerima jam baru.
//   - Operator kalibrasi Long Range (badge di Buffer-Timer-Start) → "timing:calibration"
//     → jam Photo Finish ikut berubah.
//   - Yang lebih baru menang. Kalibrasi tersimpan di masing-masing sisi, sehingga
//     aplikasi yang sedang mati/terputus menyusul saat tersambung lagi.
// Aktif bila integrasi Photo Finish DAN Long Range sama-sama dikonfigurasi.
// Matikan dengan CLOCK_SYNC=off di .env.
const { reconcile } = require("./clockSyncCore");

const RECONCILE_EVERY_MS = 60000;

let pf = null; // klien photofinishCore
let lr = null; // klien longrangeCore
let nowMs = null;
let timer = null;
let busy = false;
let again = false;

function enabled() {
  return String(process.env.CLOCK_SYNC || "on").toLowerCase() !== "off";
}

function log(msg) {
  // eslint-disable-next-line no-console
  console.log("[clock-sync] " + msg);
}

async function run() {
  if (!pf || !lr || !enabled()) return;
  const clock = pf.pfClock();
  const remote = pf.remoteCalibration();
  if (!clock.synced || !remote) return; // tunggu jam PF tersinkron & kalibrasi PF diterima
  const d = reconcile(remote, lr.calibrationState(), nowMs(), clock.offsetMs);
  if (d.action === "toLongrange") {
    if (lr.applySyncedCalibration(d.cal)) log("Long Range mengikuti kalibrasi Photo Finish (" + d.cal.updatedAt + ")");
  } else if (d.action === "toPhotofinish") {
    const res = await pf.sendCalibration(Object.assign({}, d.cal, { note: "dari Long Range Start" }));
    if (res && res.ok) log(res.applied ? "Photo Finish mengikuti kalibrasi Long Range (" + d.cal.updatedAt + ")" : "Photo Finish punya kalibrasi lebih baru");
    else log("gagal mengirim kalibrasi ke Photo Finish: " + ((res && res.error) || "?") + " — dicoba lagi nanti");
  }
}

/** Dipanggil saat ada perubahan di salah satu sisi. Antre agar tidak tumpang tindih. */
async function schedule() {
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  try {
    do {
      again = false;
      await run();
    } while (again);
  } catch (err) {
    log("error: " + ((err && err.message) || err));
  } finally {
    busy = false;
  }
}

function start() {
  if (timer || !pf || !lr) return;
  // Jaring pengaman: pertukaran berkala bila sebuah notifikasi terlewat.
  timer = setInterval(schedule, RECONCILE_EVERY_MS);
  if (timer.unref) timer.unref(); // jangan menahan proses tetap hidup
  schedule();
}

module.exports = {
  /** dari photofinishMain.js */
  attachPhotofinish: function (client) {
    pf = client;
    start();
  },
  /** dari longrangeMain.js; now = jam laptop (epoch ms) yang sama dgn klien Long Range */
  attachLongrange: function (client, now) {
    lr = client;
    nowMs = now;
    start();
  },
  /** opts.onCalibration photofinishCore & opts.onCalibrated longrangeCore */
  notify: schedule,
};
