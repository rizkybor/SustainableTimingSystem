const { contextBridge, ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };
  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

function expose(key, api) {
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld(key, api);
    } catch (e) {}
  } else {
    // fallback jika contextIsolation dimatikan
    window[key] = api;
  }
}


contextBridge.exposeInMainWorld('netcfg', {
  get: () => ipcRenderer.invoke('network:get'),
  set: (partial) => ipcRenderer.invoke('network:set', partial),
  refresh: () => ipcRenderer.invoke('network:refresh'),
});

expose("app", {
  exit: () => ipcRenderer.invoke("app:exit"),
  closeWindow: () => ipcRenderer.invoke("app:close-window"),
  minimize: () => ipcRenderer.invoke("app:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("app:toggle-maximize"),
});

// file picker (dipanggil renderer: window.fileAPI.pickImage())
expose("fileAPI", {
  // tambahkan di expose('fileAPI', { ... })
  toDataURL: async function (absPath) {
    const fs = require("fs").promises;
    const path = require("path");
    const buf = await fs.readFile(absPath);
    const ext = path.extname(absPath).toLowerCase();
    var mime = "application/octet-stream";
    if (ext === ".png") mime = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
    return "data:" + mime + ";base64," + buf.toString("base64");
  },
  pickImage: () => ipcRenderer.invoke("file:pick-image"),
});

// Cloudinary bridge (renderer: window.cloud.uploadImage(), deleteImage())
expose("cloud", {
  uploadEventImage: function (absPath, options) {
    if (!options) options = {};
    const path = require("path");
    const autoName = path.parse(absPath).name;
    const opts = {
      folder: "sustainable-js/event",
      publicId: options.publicId ? options.publicId : autoName,
    };
    return ipcRenderer.invoke("cloud:upload-image", absPath, opts);
  },
  uploadImage: (absPath, options = {}) =>
    ipcRenderer.invoke("cloud:upload-image", absPath, options),
  deleteImage: (publicId) => ipcRenderer.invoke("cloud:delete-image", publicId),
});
