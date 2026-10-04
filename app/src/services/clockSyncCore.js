// Penyelaras kalibrasi jam RaceTime2 antara STS Photo Finish dan STS Long
// Range Start — logika murni (tanpa Electron) agar bisa diuji langsung.
//
// Kedua aplikasi memetakan sebuah jam komputer ke jam RaceTime2 dengan
// offset + trim (trim positif = jam maju), tetapi jam acuannya berbeda:
//   Photo Finish : jam RaceTime2 = jam server API PF  − (manualOffsetNs − trimNs)
//   Long Range   : jam RaceTime2 = jam lokal laptop   − manualOffsetMs + trimMs
// sts-timingsystem tersambung ke keduanya, dan mengukur selisih jam server PF
// terhadap jam laptop (pfOffsetMs, ping-pong RTT terkecil). Dengan itu satu
// kalibrasi bisa diterjemahkan ke bentuk yang lain.
//
// Aturan: kalibrasi yang LEBIH BARU (updatedAt) menang. Saat diterapkan ke
// sisi lain, updatedAt ikut disalin dari sumbernya, sehingga pertukaran
// berikutnya bernilai sama dan tidak memantul bolak-balik.
//
// Catatan sintaks: di-bundle webpack 4 (Electron 13 / Node 14) — JANGAN
// pakai `?.`, `??`, atau literal BigInt.
/* global BigInt */
const { diffDay, localTodMs, wrapDay } = require("./clockCalibrationCore");

const NS_PER_US = BigInt(1000);

function nsToMs(ns) {
  // BigInt → ms dengan resolusi µs (aman untuk Number)
  const us = BigInt(String(ns || "0")) / NS_PER_US;
  return Number(us) / 1000;
}

function msToNs(ms) {
  return (BigInt(Math.round(Number(ms) * 1000)) * NS_PER_US).toString();
}

function timeOf(iso) {
  const t = iso ? Date.parse(iso) : 0;
  return isFinite(t) ? t : 0;
}

/**
 * Kalibrasi Photo Finish → bentuk Long Range (basis jam laptop).
 * @param {{mode:string, manualOffsetNs:string|null, trimNs:string}} pf
 * @param {number} laptopNowMs  jam laptop saat ini (epoch ms)
 * @param {number} pfOffsetMs   jam server PF − jam laptop (ms)
 */
function photofinishToLongrange(pf, laptopNowMs, pfOffsetMs) {
  const trimMs = nsToMs(pf.trimNs);
  if (pf.mode !== "manual" || pf.manualOffsetNs === null || pf.manualOffsetNs === undefined) {
    return { manualOffsetMs: null, trimMs: trimMs };
  }
  // jam RaceTime2 (tanpa trim) sekarang menurut Photo Finish
  const rt2 = wrapDay(laptopNowMs + pfOffsetMs - nsToMs(pf.manualOffsetNs));
  return { manualOffsetMs: diffDay(localTodMs(laptopNowMs) - rt2), trimMs: trimMs };
}

/**
 * Kalibrasi Long Range → bentuk Photo Finish (basis jam server PF).
 * @param {{manualOffsetMs:number|null, trimMs:number}} lr
 */
function longrangeToPhotofinish(lr, laptopNowMs, pfOffsetMs) {
  const trimNs = msToNs(lr.trimMs || 0);
  if (lr.manualOffsetMs === null || lr.manualOffsetMs === undefined) {
    return { mode: "auto", manualOffsetNs: null, trimNs: trimNs };
  }
  // jam RaceTime2 (tanpa trim) sekarang menurut Long Range
  const rt2 = wrapDay(localTodMs(laptopNowMs) - lr.manualOffsetMs);
  return { mode: "manual", manualOffsetNs: msToNs(laptopNowMs + pfOffsetMs - rt2), trimNs: trimNs };
}

/**
 * Putuskan arah sinkron.
 * @param {object|null} pf   pesan "pf:calibration" terakhir (updatedAt ISO; epoch 0 = belum pernah)
 * @param {object} lr        calibrationState() Long Range (updatedAt ISO | null)
 * @returns {{action:"none"}|{action:"toLongrange", cal:object}|{action:"toPhotofinish", cal:object}}
 */
function reconcile(pf, lr, laptopNowMs, pfOffsetMs) {
  if (!pf || !lr) return { action: "none" };
  const pfAt = timeOf(pf.updatedAt);
  const lrAt = timeOf(lr.updatedAt);
  if (pfAt > lrAt && pf.revision > 0) {
    const c = photofinishToLongrange(pf, laptopNowMs, pfOffsetMs);
    return { action: "toLongrange", cal: Object.assign(c, { updatedAt: pf.updatedAt, note: pf.note || null }) };
  }
  if (lrAt > pfAt) {
    const c = longrangeToPhotofinish(lr, laptopNowMs, pfOffsetMs);
    return { action: "toPhotofinish", cal: Object.assign(c, { updatedAt: new Date(lrAt).toISOString() }) };
  }
  return { action: "none" };
}

module.exports = {
  photofinishToLongrange: photofinishToLongrange,
  longrangeToPhotofinish: longrangeToPhotofinish,
  reconcile: reconcile,
  nsToMs: nsToMs,
  msToNs: msToNs,
};
