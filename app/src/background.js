"use strict";

import { app, protocol, BrowserWindow, ipcMain, nativeImage, screen } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import path from "path";
import { pathToFileURL } from "url";


const isDev = !app.isPackaged;
const DEV_URL = process.env.WEBPACK_DEV_SERVER_URL || process.env.VUE_APP_BASE_URL || "";

let splash = null;
let mainWindow = null;

const { setupIPCMainHandlers } = require("./services/ipcMainServices");
setupIPCMainHandlers();

protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);

function resolveIcon() {
  let file = process.platform === "win32" ? "icon.ico" : "icon.png";
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "assets", "icons", file);
  } else {
    return path.join(__dirname, "../src/assets/icons", file);
  }
}

function centerWindow(win) {
  if (!win) return;
  const winBounds = win.getBounds();
  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);
  const wa = display.workArea;
  const x = Math.round(wa.x + (wa.width  - winBounds.width)  / 2);
  const y = Math.round(wa.y + (wa.height - winBounds.height) / 2);
  win.setPosition(x, y);
}

function setDockIconIfMac() {
  if (process.platform === "darwin") {
    const pngPath = path.join(__dirname, "../src/assets/icons/icon.png");
    const img = nativeImage.createFromPath(pngPath);
    if (!img.isEmpty()) {
      app.dock.setIcon(img);
    }
  }
}

function createSplash(preloadPath) {
  splash = new BrowserWindow({
    width: 500,
    height: 200,
    useContentSize: true,     
    show: false,
    transparent: true,
    frame: false,
    resizable: false,
    center: false,           
    backgroundColor: "#00000000",
    icon: resolveIcon(),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  let splashUrl = "";
  if (isDev) {
    splashUrl = `${DEV_URL.replace(/\/$/, "")}/splash.html`;
  } else {
    createProtocol("app");
    splashUrl = "app://./splash.html";
  }
  centerWindow(splash);

  splash.loadURL(splashUrl);
  splash.once("ready-to-show", function () {
    splash.webContents.setZoomFactor(0.7);
    centerWindow(splash);
    splash.show();
  });
}

function createMain(preloadPath) {
  mainWindow = new BrowserWindow({
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

  let mainUrl = "";
  if (isDev) {
    mainUrl = DEV_URL;
  } else {
    createProtocol("app");
    mainUrl = "app://./index.html";
  }

  mainWindow.loadURL(mainUrl);
}

function bootApp() {
  const preloadPath = path.join(__dirname, "preload.js");

  createSplash(preloadPath);
  createMain(preloadPath);

  const splashStart = Date.now();
  const MIN_SPLASH_MS = 5000;
  const MAX_SPLASH_MS = 15000;

  mainWindow.once("ready-to-show", function () {
    const elapsed = Date.now() - splashStart;
    const waitTime = Math.max(0, MIN_SPLASH_MS - elapsed);

    setTimeout(function () {
      mainWindow.center();
      mainWindow.show();

      if (splash && !splash.isDestroyed()) {
        splash.close();
      }
    }, waitTime);
  });

  setTimeout(function () {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.center();
      mainWindow.show();
    }
    if (splash && !splash.isDestroyed()) {
      splash.close();
    }
  }, MAX_SPLASH_MS);
}

ipcMain.handle("app:exit", function () {
  app.quit();
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    bootApp();
  }
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
  bootApp();
});

if (isDev) {
  if (process.platform === "win32") {
    process.on("message", function (data) {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", function () {
      app.quit();
    });
  }
}