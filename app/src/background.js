"use strict";

import { app, protocol, BrowserWindow, ipcMain, nativeImage } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import path from "path";
import { pathToFileURL } from "url";

const isDev = !app.isPackaged;
const DEV_URL =
  process.env.WEBPACK_DEV_SERVER_URL ||  
  process.env.VUE_APP_BASE_URL

const { setupIPCMainHandlers } = require("./services/ipcMainServices");
setupIPCMainHandlers();

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

  // --- SPLASH ---
  if (isDev) {
    await splash.loadURL(pathToFileURL(path.join(__dirname, "../public/splash.html")).toString());
  } else {
    createProtocol("app");
    await splash.loadURL("app://./splash.html");
  }
  splash.once("ready-to-show", () => splash.show());

  setTimeout(() => {
    try {
      splash.close();
    } catch {}
    win.center();
    win.show();
  }, 7000);


// --- MAIN ---
  if (isDev) {
    await win.loadURL(DEV_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    await win.loadURL("app://./index.html");
  }

  // tampilkan main ketika siap, lalu tutup splash
  win.once("ready-to-show", () => {
    if (!splash.isDestroyed()) splash.close();
    win.center();
    win.show();
  });

  // logging opsional
  win.webContents.on("did-fail-load", (e, code, desc, url) => {
    console.error("❌ did-fail-load", code, desc, url);
  });
  win.webContents.on("render-process-gone", (e, details) => {
    console.error("⚠️ Renderer crashed:", details);
  });
}

// IPC
ipcMain.handle("app:exit", () => app.quit());

// Lifecycle
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("ready", async () => {
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
    process.on("message", (data) => {
      if (data === "graceful-exit") app.quit();
    });
  } else {
    process.on("SIGTERM", () => app.quit());
  }
}
