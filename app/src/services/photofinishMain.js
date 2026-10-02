// Integrasi STS Photo Finish di MAIN process Electron.
//
// Renderer (serialPortMixin & view race) hanya bicara lewat IPC:
//   renderer → main : "pf:impulse", "pf:heartbeat", "pf:applied",
//                     invoke "pf:status", invoke "pf:pending"
//   main → renderer : "pf:verified", "pf:status", "pf:trigger"
//
// Konfigurasi (salah satu):
//   1. .env (dibaca dotenv):  PF_API_URL, PF_DEVICE_TOKEN, PF_HMAC_SECRET
//   2. <userData>/photofinish.json: { "apiUrl", "deviceToken", "hmacSecret" }
//      — untuk aplikasi terpasang (build) yang tidak membawa .env.
// Tanpa konfigurasi, integrasi nonaktif dan alur lama berjalan apa adanya.
const { ipcMain, BrowserWindow, app } = require("electron");
const fs = require("fs");
const path = require("path");
const { io } = require("socket.io-client");
const { createPhotofinishClient } = require("./photofinishCore");
require("dotenv").config();

let client = null;

function userFile(name) {
  return path.join(app.getPath("userData"), "photofinish-" + name + ".json");
}

function loadConfig() {
  if (process.env.PF_API_URL && process.env.PF_DEVICE_TOKEN && process.env.PF_HMAC_SECRET) {
    return {
      apiUrl: process.env.PF_API_URL,
      deviceToken: process.env.PF_DEVICE_TOKEN,
      hmacSecret: process.env.PF_HMAC_SECRET,
    };
  }
  try {
    const raw = fs.readFileSync(path.join(app.getPath("userData"), "photofinish.json"), "utf8");
    const cfg = JSON.parse(raw);
    if (cfg.apiUrl && cfg.deviceToken && cfg.hmacSecret) return cfg;
  } catch (_e) {
    // tidak ada file konfigurasi — integrasi nonaktif
  }
  return null;
}

const storage = {
  load: function (name) {
    try {
      return JSON.parse(fs.readFileSync(userFile(name), "utf8"));
    } catch (_e) {
      return null;
    }
  },
  save: function (name, data) {
    try {
      // tulis ke file sementara lalu rename — tidak korup bila listrik mati di tengah tulis
      const file = userFile(name);
      fs.writeFileSync(file + ".tmp", JSON.stringify(data));
      fs.renameSync(file + ".tmp", file);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[photofinish] gagal menyimpan " + name + ":", err.message);
    }
  },
};

function broadcast(channel, payload) {
  BrowserWindow.getAllWindows().forEach(function (w) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  });
}

function hostNowNs() {
  const perf = require("perf_hooks").performance;
  const us = Math.round((perf.timeOrigin + perf.now()) * 1000);
  return String(us) + "000";
}

function setupPhotofinish() {
  const cfg = loadConfig();
  if (cfg) {
    client = createPhotofinishClient({
      apiUrl: cfg.apiUrl,
      deviceToken: cfg.deviceToken,
      hmacSecret: cfg.hmacSecret,
      io: io,
      storage: storage,
      now: hostNowNs,
      onVerified: function (msg) {
        broadcast("pf:verified", msg);
      },
      onStatus: function (st) {
        broadcast("pf:status", st);
      },
      onTrigger: function (msg) {
        broadcast("pf:trigger", msg);
      },
    });
    client.start();
  }

  ipcMain.on("pf:impulse", function (_event, p) {
    if (client && p) client.sendImpulse(p);
  });
  ipcMain.on("pf:heartbeat", function (_event, p) {
    if (client && p) client.heartbeat(p);
  });
  ipcMain.on("pf:applied", function (_event, p) {
    if (client && p && p.crossingId) client.markApplied(p.crossingId, Number(p.revision) || 0);
  });
  ipcMain.handle("pf:status", function () {
    return client ? client.status() : { enabled: false, connected: false, outbox: 0, pending: 0, lastError: null };
  });
  ipcMain.handle("pf:pending", function () {
    return client ? client.pending() : [];
  });

  app.on("before-quit", function () {
    if (client) client.stop();
  });
}

module.exports = { setupPhotofinish: setupPhotofinish };
