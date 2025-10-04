"use strict";

import { app, protocol, BrowserWindow, ipcMain, nativeImage } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import path from "path";
import { pathToFileURL } from "url";

const isDevelopment = process.env.VUE_APP_ENV !== "production";
const { setupIPCMainHandlers } = require("./services/ipcMainServices");

// Function to Services Communication to Database
setupIPCMainHandlers();

// wajib utk app:// protocol saat production
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

/** Tentukan path icon sesuai platform & mode (dev vs build) */
function resolveIcon() {
  const file = process.platform === "win32" ? "icon.ico" : "icon.png";

  // production: electron-builder menaruh di resources/assets/icons
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "assets", "icons", file);
  }
  // development: kamu menaruh di src/assets/icons
  return path.join(__dirname, "../src/assets/icons", file);
}

/** Set Dock icon khusus macOS (BrowserWindow.icon diabaikan oleh Dock) */
function setDockIconIfMac() {
  if (process.platform !== "darwin") return;
  // const iconPath = resolveIcon();
  // const img = nativeImage.createFromPath(iconPath);
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
    icon: resolveIcon(), // dipakai Win/Linux; di mac untuk window bukan Dock
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const splash = new BrowserWindow({
    width: 500,
    height: 200,
    show: false, // tampil setelah ready-to-show
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

  // DEV: ../public  |  PROD: __static
  const isDev = !!process.env.VUE_APP_BASE_URL;
  // Path ABSOLUT ke file splash.html
  const splashHtmlPath = isDev
    ? path.join(__dirname, "../public/splash.html") // dev
    : path.join(__static, "splash.html"); // build

  // Debug cepat (cek apakah file ada)
  console.log("splashHtmlPath:", splashHtmlPath);

  // Ubah ke file:// URL secara aman lintas OS
  const splashFileURL = pathToFileURL(splashHtmlPath).toString();

  // Muat via file:// ke FILE langsung
  splash.loadURL(splashFileURL);
  splash.once("ready-to-show", () => splash.show());

  setTimeout(() => {
    try {
      splash.close();
    } catch {}
    win.center();
    win.show();
  }, 7000);

  if (process.env.VUE_APP_BASE_URL) {
    await win.loadURL(process.env.VUE_APP_BASE_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    await win.loadURL("app://./index.html");
  }
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
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }

  // set Dock icon untuk macOS (dev & build)
  setDockIconIfMac();

  // buat window utama
  createWindow();
});

// graceful-exit dev
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") app.quit();
    });
  } else {
    process.on("SIGTERM", () => app.quit());
  }
}
