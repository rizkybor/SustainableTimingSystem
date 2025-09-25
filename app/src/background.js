"use strict";

import { app, protocol, BrowserWindow, ipcMain, nativeImage } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";
const { setupIPCMainHandlers } = require("./services/ipcMainServices");
import path from "path";

// Function to Services Communication to Database
setupIPCMainHandlers();

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

function resolveIcon() {
  const file =
    process.platform === "win32"
      ? "icon.ico"
      : process.platform === "darwin"
      ? "icon.icns"
      : "icon.png";

  if (app.isPackaged) {
    // ketika sudah di-build, electron-builder akan taruh di resources/assets/icons
    return path.join(process.resourcesPath, "assets/icons", file);
  } else {
    // saat development
    return path.join(process.cwd(), "assets/icons", file);
  }
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    show: false,
    icon: resolveIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
  var splash = new BrowserWindow({
    width: 500,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: false,
    icon: resolveIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  splash.loadFile(path.join(__dirname, "../public/splash.html"));
  setTimeout(function () {
    splash.close();
    win.center();
    win.show();
  }, 7000);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    win.loadURL("app://./index.html");
  }
}

ipcMain.handle("app:exit", () => {
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }
  console.log(__dirname,"<<<")
  if (process.platform === "darwin") {
    const base = app.isPackaged
      ? path.join(process.resourcesPath, "assets/icons")
      : path.join(process.cwd(), "assets/icons");
    const img = nativeImage.createFromPath(path.join(base, "icon.icns"));
    if (!img.isEmpty()) app.dock.setIcon(img);
  }

  createWindow();
});

if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
