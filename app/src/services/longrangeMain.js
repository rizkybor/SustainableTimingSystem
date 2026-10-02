// Integrasi STS Long Range Start di MAIN process Electron.
//
// Renderer (serialPortMixin) hanya bicara lewat IPC:
//   renderer → main : "lr:heartbeat", invoke "lr:status", invoke "lr:recent",
//                     invoke "lr:calibrate", invoke "lr:recompute"
//   main → renderer : "lr:start", "lr:recall", "lr:status"
//
// Konfigurasi (salah satu):
//   1. .env (dibaca dotenv):  LRS_API_URL, LRS_TIMING_TOKEN, LRS_HMAC_SECRET, [LRS_TRIM_MS]
//   2. <userData>/longrange.json: { "apiUrl", "timingToken", "hmacSecret", "trimMs" }
//      — untuk aplikasi terpasang (build) yang tidak membawa .env.
// Tanpa konfigurasi, integrasi nonaktif dan alur lama berjalan apa adanya.
const { ipcMain, BrowserWindow, app } = require("electron");
const fs = require("fs");
const path = require("path");
const { io } = require("socket.io-client");
const { createLongrangeClient } = require("./longrangeCore");
require("dotenv").config();

let client = null;

function userFile(name) {
  return path.join(app.getPath("userData"), "longrange-" + name + ".json");
}

function loadConfig() {
  if (process.env.LRS_API_URL && process.env.LRS_TIMING_TOKEN && process.env.LRS_HMAC_SECRET) {
    return {
      apiUrl: process.env.LRS_API_URL,
      timingToken: process.env.LRS_TIMING_TOKEN,
      hmacSecret: process.env.LRS_HMAC_SECRET,
      trimMs: Number(process.env.LRS_TRIM_MS) || 0,
    };
  }
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "longrange.json"), "utf8"));
    if (cfg.apiUrl && cfg.timingToken && cfg.hmacSecret) return cfg;
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
      console.error("[longrange] gagal menyimpan " + name + ":", err.message);
    }
  },
};

function broadcast(channel, payload) {
  BrowserWindow.getAllWindows().forEach(function (w) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  });
}

function hostNowMs() {
  const perf = require("perf_hooks").performance;
  return perf.timeOrigin + perf.now();
}

function setupLongrange() {
  const cfg = loadConfig();
  if (cfg) {
    client = createLongrangeClient({
      apiUrl: cfg.apiUrl,
      timingToken: cfg.timingToken,
      hmacSecret: cfg.hmacSecret,
      trimMs: cfg.trimMs,
      io: io,
      now: hostNowMs,
      storage: storage,
      onStart: function (entry) {
        broadcast("lr:start", entry);
      },
      onRecall: function (entry) {
        broadcast("lr:recall", entry);
      },
      onStatus: function (st) {
        broadcast("lr:status", st);
      },
    });
    client.start();
  }

  ipcMain.on("lr:heartbeat", function (_event, p) {
    if (client && p) client.heartbeat(p);
  });
  ipcMain.handle("lr:status", function () {
    return client ? client.status() : { enabled: false, connected: false };
  });
  ipcMain.handle("lr:recent", function () {
    return client ? client.history() : [];
  });
  // Kalibrasi manual jam RaceTime2 & hitung ulang start. Error dikembalikan sebagai { ok:false }.
  ipcMain.handle("lr:calibrate", function (_event, body) {
    if (!client) return { ok: false, error: "Long Range Start belum dikonfigurasi" };
    try {
      return { ok: true, status: client.calibrate(body) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
  ipcMain.handle("lr:recompute", function (_event, p) {
    if (!client) return { ok: false, error: "Long Range Start belum dikonfigurasi" };
    try {
      return { ok: true, entry: client.recompute(p && p.startId) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  app.on("before-quit", function () {
    if (client) client.stop();
  });
}

module.exports = { setupLongrange: setupLongrange };
