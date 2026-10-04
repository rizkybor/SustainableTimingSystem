// Kalibrasi jam RaceTime2 di MAIN process — satu sumber untuk ketiga aplikasi.
//
// Selalu aktif (tidak bergantung pada konfigurasi Long Range / Photo Finish):
//   - Long Range Start memakai kalibrasi ini untuk Buffer-Timer-Start & jam garis start
//   - STS Photo Finish disinkronkan dua arah lewat clockSyncMain.js (lebih baru menang)
//
// Renderer:
//   renderer → main : "clock:heartbeat" (juga "lr:heartbeat" lama), invoke "clock:status",
//                     invoke "clock:calibrate"
//   main → renderer : "clock:status"
//
// Disimpan di <userData>/clock-calibration.json. Kalibrasi lama Long Range
// (<userData>/longrange-calibration.json) dipindahkan otomatis sekali.
const { ipcMain, BrowserWindow, app } = require("electron");
const fs = require("fs");
const path = require("path");
const { createClockCalibration } = require("./clockCalibrationCore");
require("dotenv").config();

let calibration = null;
const statusSources = []; // fungsi tambahan untuk status (Photo Finish, Long Range)

function userFile(name) {
  return path.join(app.getPath("userData"), "clock-" + name + ".json");
}

const storage = {
  load: function (name) {
    try {
      return JSON.parse(fs.readFileSync(userFile(name), "utf8"));
    } catch (_e) {
      if (name !== "calibration") return null;
      // Pindahkan kalibrasi lama Long Range (sebelum kalibrasi milik timing).
      try {
        return JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "longrange-calibration.json"), "utf8"));
      } catch (_e2) {
        return null;
      }
    }
  },
  save: function (name, data) {
    try {
      const file = userFile(name);
      fs.writeFileSync(file + ".tmp", JSON.stringify(data));
      fs.renameSync(file + ".tmp", file);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[clock] gagal menyimpan " + name + ":", err.message);
    }
  },
};

function broadcast(channel, payload) {
  BrowserWindow.getAllWindows().forEach(function (w) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);
  });
}

function status() {
  const st = Object.assign({ enabled: true }, calibration.summary());
  statusSources.forEach(function (fn) {
    try {
      Object.assign(st, fn());
    } catch (_e) {
      // sumber status opsional
    }
  });
  return st;
}

function getCalibration() {
  if (!calibration) {
    calibration = createClockCalibration({ storage: storage, trimMs: Number(process.env.LRS_TRIM_MS) || 0 });
    calibration.onChange(function () {
      broadcast("clock:status", status());
    });
  }
  return calibration;
}

function setupClock() {
  const cal = getCalibration();
  function onHeartbeat(_event, p) {
    if (p) cal.heartbeat(p);
  }
  ipcMain.on("clock:heartbeat", onHeartbeat);
  ipcMain.on("lr:heartbeat", onHeartbeat);
  ipcMain.handle("clock:status", function () {
    return status();
  });
  ipcMain.handle("clock:calibrate", function (_event, body) {
    try {
      cal.calibrate(body);
      return { ok: true, status: status() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
  // Status sambungan berubah (mis. Photo Finish tersambung) → segarkan jendela kalibrasi.
  setInterval(function () {
    broadcast("clock:status", status());
  }, 5000).unref();
}

module.exports = {
  setupClock: setupClock,
  getCalibration: getCalibration,
  /** fn() → objek yang digabung ke status (mis. { photofinish: {...} }) */
  addStatusSource: function (fn) {
    statusSources.push(fn);
  },
  notifyStatus: function () {
    if (calibration) broadcast("clock:status", status());
  },
};
