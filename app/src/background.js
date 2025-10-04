"use strict";
// Tangkap semua Promise rejection biar gak bikin crash diam-diam
process.on("unhandledRejection", function (e) {
  console.error("[UNHANDLED] Rejection:", e && e.message ? e.message : e);
});

import { app, protocol, BrowserWindow, ipcMain, nativeImage } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import path from "path";

// ==== Network & DB (main process) ====
import {
  ensureDefaults,
  readConfig,
  writeConfig,
  pickEndpoints,
} from "./services/networkManager";
import { connectMongo } from "./services/db";

import dns from "dns";
import fetch from "node-fetch";

const isDev = !app.isPackaged;

// URL dev renderer: ambil dari env plugin atau env kamu sendiri, lalu fallback.
const DEV_URL =
  (process && process.env && process.env.WEBPACK_DEV_SERVER_URL) ||
  (process && process.env && process.env.VUE_APP_BASE_URL) ||
  "http://localhost:8080";

// Handler IPC kustom kamu yang lain
const { setupIPCMainHandlers } = require("./services/ipcMainServices");
setupIPCMainHandlers();

// ===== network boot =====
async function bootNetwork() {
  ensureDefaults();
  const pick = await pickEndpoints();
  console.log("🌐 [BOOT NETWORK]", {
    mode: pick.mode,
    apiBase: pick.apiBase,
    mongoUri: pick.mongoUri,
    realtime: pick.realtime,
  });
  const result = await connectMongo(pick.mongoUri);
  console.log("✅ Mongo connected to:", pick.mongoUri);
  return pick;
}

function httpTimeout(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function httpHealth(url) {
  if (!url) return { ok: false, reason: "no-url" };
  try {
    const u = new URL("/health", url).toString();
    const ctrl = new AbortController();
    const to = setTimeout(function () {
      ctrl.abort();
    }, 3000);
    const res = await fetch(u, { signal: ctrl.signal });
    clearTimeout(to);
    return { ok: !!res && res.ok, status: res ? res.status : 0 };
  } catch (e) {
    return { ok: false, reason: e && e.message ? e.message : String(e) };
  }
}

async function mongoPing(uri) {
  try {
    // 1 attempt saja, kita hanya cek “hidup” atau tidak
    const db = await connectMongo(uri, 1);
    const r = await db.command({ ping: 1 });
    return { ok: r && r.ok === 1 };
  } catch (e) {
    return { ok: false, reason: e && e.message ? e.message : String(e) };
  }
}

function resolveHost(host) {
  return new Promise(function (resolve) {
    if (!host) return resolve(null);
    dns.lookup(host, function (err, addr) {
      if (err) return resolve(null);
      resolve(addr);
    });
  });
}

// ===== IPC: network config =====
ipcMain.handle("network:get", async () => {
  const pick = await pickEndpoints();
  return { ...pick, config: readConfig() };
});

ipcMain.handle("network:set", async (_e, partial) => {
  const next = Object.assign({}, readConfig(), partial);
  writeConfig(next);
  const pick = await pickEndpoints();
  await connectMongo(pick.mongoUri);

  // ⬇️ kirim ke semua renderer
  const wins = BrowserWindow.getAllWindows();
  for (let i = 0; i < wins.length; i++) {
    const w = wins[i];
    if (!w.isDestroyed()) {
      w.webContents.send("network:changed", pick);
    }
  }

  console.log("🔁 Network mode changed:", pick.mode, pick.apiBase);
  return { ...pick, config: next };
});

ipcMain.handle("network:inspect", async () => {
  const pick = await pickEndpoints();
  return { ok: true, pick };
});

// ipcMain.handle("network:ping-db", async () => {
//   try {
//     await connectMongo(/* kalau connectMongo simpan client global, cukup ping */);
//     const pick = await pickEndpoints();
//     return { ok: true, uri: pick.mongoUri };
//   } catch (e) {
//     return { ok: false, error: e && e.message ? e.message : String(e) };
//   }
// });

ipcMain.handle("network:refresh", async () => {
  const pick = await pickEndpoints();
  await connectMongo(pick.mongoUri);
  return pick;
});

// ===== protocol app:// =====
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

function resolveIcon() {
  const file = process.platform === "win32" ? "icon.ico" : "icon.png";
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "assets", "icons", file);
  }
  return path.join(__dirname, "../src/assets/icons", file);
}

function setDockIconIfMac() {
  if (process.platform !== "darwin") return;
  const pngPath = path.join(__dirname, "../src/assets/icons/icon.png");
  const img = nativeImage.createFromPath(pngPath);
  if (!img.isEmpty()) app.dock.setIcon(img);
}

async function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");

  // ---- MAIN WINDOW ----
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false,
    icon: resolveIcon(),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // ---- SPLASH WINDOW (opsional) ----
  const splash = new BrowserWindow({
    width: 500,
    height: 200,
    show: false,
    transparent: true,
    frame: false,
    alwaysOnTop: false,
    icon: resolveIcon(),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Muat splash
  if (isDev) {
    await splash.loadFile(path.join(__dirname, "../public/splash.html"));
  } else {
    createProtocol("app");
    await splash.loadURL("app://./splash.html");
  }
  splash.once("ready-to-show", function () {
    splash.show();
  });

  // ====== BOOT NETWORK + DB sebelum render ======
  const pick = await bootNetwork();
  win.webContents.once("did-finish-load", function () {
    win.webContents.send("network:booted", pick);
  });

  // ---- LOAD RENDERER ----
  if (isDev) {
    const loadDev = async function (attempt) {
      attempt = attempt || 1;
      try {
        await win.loadURL(DEV_URL);
      } catch (e) {
        console.warn(
          "[DEV] loadURL failed (attempt " + attempt + "):",
          e && e.message ? e.message : e
        );
      }
    };

    win.webContents.on("did-fail-load", function (_e, code, desc) {
      console.warn("[DEV] did-fail-load:", code, desc);
      setTimeout(function () {
        loadDev(2);
      }, 700);
    });

    await loadDev(1);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    await win.loadURL("app://./index.html");
  }

  // ---- Tampilkan main saat siap, lalu tutup splash ----
  let shown = false;
  win.once("ready-to-show", function () {
    shown = true;
    if (!splash.isDestroyed()) splash.close();
    win.center();
    win.show();
  });

  // fallback
  setTimeout(function () {
    if (!shown) {
      if (!splash.isDestroyed()) splash.close();
      win.show();
    }
  }, 6000);

  win.webContents.on("did-fail-load", function (e, code, desc, url) {
    console.error("❌ did-fail-load", code, desc, url);
  });
  win.webContents.on("render-process-gone", function (e, details) {
    console.error("⚠️ Renderer crashed:", details);
  });
}

// ===== IPC umum =====
ipcMain.handle("app:exit", function () {
  app.quit();
});

// ===== Lifecycle =====
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("ready", async function () {
  if (isDev && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  setDockIconIfMac();
  createWindow();
});

// graceful-exit dev
if (isDev) {
  if (process.platform === "win32") {
    process.on("message", function (data) {
      if (data === "graceful-exit") app.quit();
    });
  } else {
    process.on("SIGTERM", function () {
      app.quit();
    });
  }
}
