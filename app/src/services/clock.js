// Sisi RENDERER kalibrasi jam RaceTime2 bersama (clockMain.js) — SELALU
// tersedia, tidak bergantung pada konfigurasi Long Range / Photo Finish.
// Heartbeat sudah dikirim lewat services/longrange.js::reportHeartbeat()
// (channel "lr:heartbeat", didengarkan clockMain.js juga) — tidak perlu
// dikirim ulang dari sini.
import { ipcRenderer } from "electron";

function subscribe(channel, handler) {
  const fn = function (_event, payload) {
    handler(payload);
  };
  ipcRenderer.on(channel, fn);
  return function () {
    ipcRenderer.removeListener(channel, fn);
  };
}

export function onStatus(handler) {
  return subscribe("clock:status", handler);
}

export function getStatus() {
  return ipcRenderer.invoke("clock:status").catch(function () {
    return { enabled: true };
  });
}

/** Jam epoch host dalam ms — dicatat SAAT tombol "Set" ditekan. */
export function hostNowMs() {
  return performance.timeOrigin + performance.now();
}

/** Kalibrasi manual — lihat calibrate() di clockCalibrationCore.js. → { ok, status } | { ok:false, error } */
export function calibrate(body) {
  return ipcRenderer.invoke("clock:calibrate", body).catch(function (err) {
    return { ok: false, error: (err && err.message) || String(err) };
  });
}
