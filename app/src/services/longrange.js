// Sisi RENDERER integrasi STS Long Range Start — pembungkus IPC tipis ke
// longrangeMain.js (main process). Secret tidak pernah ada di sini.
import { ipcRenderer } from "electron";

/**
 * Frame START RaceTime2 yang membawa jam berjalan → acuan jam RaceTime2 untuk
 * mengubah waktu start dari garis start jauh. Frame "bare" (tanpa waktu)
 * diabaikan. `meta` = { recvUs, frameBytes } dari microGateReader.
 */
export function reportHeartbeat(formatted, meta, baudRate) {
  const deviceTime = formatted && String(formatted).trim();
  if (!deviceTime || !meta || !meta.recvUs) return;
  const latencyUs = meta.frameBytes && baudRate ? (meta.frameBytes * 10 * 1e6) / baudRate : 0;
  try {
    ipcRenderer.send("lr:heartbeat", { deviceTime: deviceTime, hostMs: (meta.recvUs - latencyUs) / 1000 });
  } catch (_e) {
    // long range start tidak boleh mengganggu alur timing
  }
}

function subscribe(channel, handler) {
  const fn = function (_event, payload) {
    handler(payload);
  };
  ipcRenderer.on(channel, fn);
  return function () {
    ipcRenderer.removeListener(channel, fn);
  };
}

/** START baru: { startId, time "HH:MM:SS.mmm", raceId, wave, deviceName, basis, … } */
export function onStart(handler) {
  return subscribe("lr:start", handler);
}

/** RECALL / false start: { refStartId, refTime, … } */
export function onRecall(handler) {
  return subscribe("lr:recall", handler);
}

export function onStatus(handler) {
  return subscribe("lr:status", handler);
}

export function getStatus() {
  return ipcRenderer.invoke("lr:status").catch(function () {
    return { enabled: false };
  });
}

/** Riwayat start yang diterima, terbaru di depan. */
export function getRecent() {
  return ipcRenderer.invoke("lr:recent").catch(function () {
    return [];
  });
}

/** Jam epoch host dalam ms — dicatat SAAT tombol "Set" ditekan. */
export function hostNowMs() {
  return performance.timeOrigin + performance.now();
}

/** Kalibrasi manual — lihat calibrate() di longrangeCore.js. → { ok, status } | { ok:false, error } */
export function calibrate(body) {
  return ipcRenderer.invoke("lr:calibrate", body).catch(function (err) {
    return { ok: false, error: (err && err.message) || String(err) };
  });
}

/** Hitung ulang satu start dengan kalibrasi terbaru lalu terapkan lagi ke Buffer-Timer-Start. */
export function recompute(startId) {
  return ipcRenderer.invoke("lr:recompute", { startId: startId }).catch(function (err) {
    return { ok: false, error: (err && err.message) || String(err) };
  });
}
