'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'


const db = require('electron-db');
const path = require('path');
const fs = require('fs');


// Set path untuk folder userData aplikasi
const userDataPath = app.getPath('userData');
const tableFilePath = path.join(userDataPath);

console.log("userDataPath:", userDataPath);

// Buat tabel 'customers' di dalam file JSON
if (!fs.existsSync(tableFilePath)) {
  db.createTable('customers', tableFilePath, (succ, msg) => {
    console.log("Success: " + succ);
    console.log("Message: " + msg);

    
  });
} else {
  db.getAll("customers", (succ, data) => {
    if (succ) {
      console.log("Data from customers table:", data);
    } else {
      console.error("Failed to retrieve data from customers table");
    }
  });
  console.log("Database file already exists at: " + tableFilePath);
}

ipcMain.on('get-all-customers', (event) => {
  db.getAll("customers", (succ, data) => {
    if (succ) {
      event.reply('customers-data', data);
    } else {
      event.reply('customers-data', null);
    }
  });
});


// let obj = new Object();
 
// obj.name = "Alexius Academia";
// obj.address = "Paco, Botolan, Zambales";

// if (db.valid('customers')) {
//   db.insertTableContent('customers', obj, (succ, msg) => {
//     console.log("Success ADD: " + succ);
//     console.log("Message: " + msg);

//   })
// }



// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}