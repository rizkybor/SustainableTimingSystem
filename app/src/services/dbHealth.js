// src/services/dbHealth.js
//
// Status koneksi database (MongoDB Atlas) + jumlah tulisan yang masih
// menunggu ulang-coba (lihat writeRetry di ipcMainServices.js), dikirim ke
// renderer supaya operator TAHU kalau ada data yang belum tersinkron —
// sebelumnya ulang-coba berjalan diam-diam di belakang.
//
// - Ping ringan tiap 10 detik (tiap 5 detik selama terputus).
// - Begitu koneksi pulih -> seluruh antrean ulang-coba langsung dicoba
//   (tidak menunggu jeda backoff berikutnya).
// - Renderer: event "db-status" (push) + "db-status:get" (ambil sekarang) +
//   "db-status:retry-now" (tombol "Coba sekarang").
const { BrowserWindow, ipcMain } = require("electron");
const { getDb } = require("../controllers/index");

const INTERVAL_ONLINE_MS = 10000;
const INTERVAL_OFFLINE_MS = 5000;

const state = {
  online: null, // null = belum diketahui
  pending: 0,
  lastOkAt: null,
  lastError: "",
};
let checking = false;
let timer = null;
let retryQueue = null;

function publicState() {
  return {
    online: state.online,
    pending: state.pending,
    lastOkAt: state.lastOkAt,
    lastError: state.lastError,
  };
}

function broadcast() {
  const data = publicState();
  BrowserWindow.getAllWindows().forEach((w) => {
    try {
      if (!w.isDestroyed()) w.webContents.send("db-status", data);
    } catch (_) {
      /* jendela sedang ditutup */
    }
  });
}

function withTimeout(promise, ms, label) {
  let t;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      t = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(ping, state.online === false ? INTERVAL_OFFLINE_MS : INTERVAL_ONLINE_MS);
}

async function ping() {
  if (checking) return;
  checking = true;
  const before = state.online;
  try {
    const db = await withTimeout(getDb(), 9000, "connect");
    await withTimeout(db.command({ ping: 1 }), 6000, "ping");
    state.online = true;
    state.lastOkAt = new Date().toISOString();
    state.lastError = "";
    if (before === false && retryQueue) retryQueue.retryAllNow(); // baru pulih
  } catch (err) {
    state.online = false;
    state.lastError = err && err.message ? err.message : String(err);
  } finally {
    checking = false;
    if (before !== state.online) broadcast();
    schedule();
  }
}

// Dipanggil oleh onChange antrean ulang-coba.
function setPending(n) {
  if (state.pending === n) return;
  state.pending = n;
  broadcast();
}

function setupDbHealth(queue) {
  retryQueue = queue || null;
  ipcMain.on("db-status:get", (event) => {
    event.reply("db-status:get-reply", publicState());
  });
  ipcMain.on("db-status:retry-now", (event) => {
    if (retryQueue) retryQueue.retryAllNow();
    ping();
    event.reply("db-status:retry-now-reply", { ok: true });
  });
  ping();
}

module.exports = { setupDbHealth, setPending };
