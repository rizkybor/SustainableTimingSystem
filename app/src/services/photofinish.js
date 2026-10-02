// Sisi RENDERER integrasi STS Photo Finish — pembungkus IPC tipis ke
// photofinishMain.js (main process). Secret tidak pernah ada di sini.
import { clipboard, ipcRenderer } from "electron";

/** Salin teks (mis. waktu finish) ke clipboard sistem. */
export function copyText(text) {
  try {
    clipboard.writeText(String(text));
  } catch (_e) {
    if (navigator.clipboard) navigator.clipboard.writeText(String(text));
  }
}

/** Jam epoch host dalam mikrodetik (Number aman: < 2^53). */
export function hostNowUs() {
  return Math.round((performance.timeOrigin + performance.now()) * 1000);
}

/**
 * Lapor frame RaceTime2 ke Photo Finish. Dipanggil dari serialPortMixin.
 *  - kind "finish": sinyal FINISH (juga LAP, yang dipakai sbg finish).
 *  - kind "start" : hanya dipakai sbg heartbeat jam bila frame MEMBAWA
 *    waktu; frame start bare TIDAK dikirim (belum dipastikan apakah dikirim
 *    per tekan tombol atau terus-menerus — jangan banjiri API).
 * `meta` = { recvUs, frameBytes } dari microGateReader.
 */
export function reportFrame(kind, formatted, meta, baudRate) {
  if (!meta || !meta.recvUs) return;
  const latencyUs = meta.frameBytes && baudRate ? (meta.frameBytes * 10 * 1e6) / baudRate : 0;
  const hostNs = String(Math.round(meta.recvUs - latencyUs)) + "000";
  const deviceTime = formatted && String(formatted).trim() ? String(formatted).trim() : null;
  try {
    if (kind === "finish") {
      ipcRenderer.send("pf:impulse", {
        channel: "FINISH",
        deviceTime: deviceTime,
        hostNs: hostNs,
        serialLatencyNs: String(Math.round(latencyUs)) + "000",
      });
    } else if (kind === "start" && deviceTime) {
      ipcRenderer.send("pf:heartbeat", { deviceTime: deviceTime, hostNs: hostNs });
    }
  } catch (_e) {
    // photo finish tidak boleh mengganggu alur timing
  }
}

/** Langganan hasil photo finish. Mengembalikan fungsi untuk berhenti langganan. */
export function onVerified(handler) {
  const fn = function (_event, msg) {
    handler(msg);
  };
  ipcRenderer.on("pf:verified", fn);
  return function () {
    ipcRenderer.removeListener("pf:verified", fn);
  };
}

export function getPending() {
  return ipcRenderer.invoke("pf:pending").catch(function () {
    return [];
  });
}

/** outcome: "diterapkan" (bawaan) atau "dipertahankan" (operator menolak mengganti Finish Time). */
export function markApplied(crossingId, revision, outcome) {
  ipcRenderer.send("pf:applied", { crossingId: crossingId, revision: revision, outcome: outcome || "diterapkan" });
}

/** Catat alasan hasil masih menunggu (ditampilkan di panel Hasil Photo Finish). */
export function noteResult(crossingId, revision, note) {
  try {
    ipcRenderer.send("pf:note", { crossingId: crossingId, revision: revision, note: note });
  } catch (_e) {
    // panel riwayat tidak boleh mengganggu alur timing
  }
}

/** Riwayat kiriman hasil juri, terbaru di depan. */
export function getHistory() {
  return ipcRenderer.invoke("pf:history").catch(function () {
    return [];
  });
}

/** Hapus satu baris riwayat (lokal di timing; data Photo Finish tidak terhapus). */
export function deleteHistory(crossingId, revision) {
  return ipcRenderer.invoke("pf:history-delete", { crossingId: crossingId, revision: revision }).catch(function () {
    return 0;
  });
}

/** { ok, url, width, height, column, marks:[{column,rank,teamId,lane,self}], frameUrl } */
export function getResultImage(crossingId) {
  return ipcRenderer.invoke("pf:result-image", { crossingId: crossingId }).catch(function (err) {
    return { ok: false, error: (err && err.message) || String(err) };
  });
}

export function onHistoryChanged(handler) {
  const fn = function () {
    handler();
  };
  ipcRenderer.on("pf:history-changed", fn);
  return function () {
    ipcRenderer.removeListener("pf:history-changed", fn);
  };
}

export function getStatus() {
  return ipcRenderer.invoke("pf:status").catch(function () {
    return { enabled: false };
  });
}

export function onStatus(handler) {
  const fn = function (_event, st) {
    handler(st);
  };
  ipcRenderer.on("pf:status", fn);
  return function () {
    ipcRenderer.removeListener("pf:status", fn);
  };
}

/** Langganan pemicu kamera Photo Finish (setiap perahu lewat garis finish). */
export function onTrigger(handler) {
  const fn = function (_event, msg) {
    handler(msg);
  };
  ipcRenderer.on("pf:trigger", fn);
  return function () {
    ipcRenderer.removeListener("pf:trigger", fn);
  };
}
