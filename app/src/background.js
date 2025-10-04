"use strict";

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
  await connectMongo(pick.mongoUri);
  return pick; // { mode, apiBase, mongoUri, realtime }
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
  return { ...pick, config: next };
});

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
        console.warn("[DEV] loadURL failed (attempt " + attempt + "):", e && e.message ? e.message : e);
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