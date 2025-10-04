// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// versi & DOMContentLoaded (opsional)
window.addEventListener("DOMContentLoaded", function () {
  function replaceText(id, text) {
    var el = document.getElementById(id);
    if (el) el.innerText = text;
  }
  var types = ["chrome", "node", "electron"];
  for (var i = 0; i < types.length; i++) {
    var t = types[i];
    replaceText(t + "-version", process.versions[t]);
  }
});

// Helper expose: aman utk contextIsolation ON/OFF
function expose(key, api) {
  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld(key, api);
    } catch (e) {}
  } else {
    window[key] = api;
  }
}

/* ======================
   NETCFG (network bridge)
   ====================== */
var netcfgAPI = {
  get: () => ipcRenderer.invoke("network:get"),
  set: (partial) => ipcRenderer.invoke("network:set", partial),
  refresh: () => ipcRenderer.invoke("network:refresh"),
  inspect: () => ipcRenderer.invoke("network:inspect"),
  pingDb: () => ipcRenderer.invoke("network:ping-db"),

  // subscribe; return function untuk un-subscribe
  onBooted: function (cb) {
    function handler(_e, pick) {
      try {
        cb && cb(pick);
      } catch (e) {}
    }
    ipcRenderer.on("network:booted", handler);
    return function () {
      ipcRenderer.removeListener("network:booted", handler);
    };
  },
  onChanged: function (cb) {
    function handler(_e, pick) {
      try {
        cb && cb(pick);
      } catch (e) {}
    }
    ipcRenderer.on("network:changed", handler);
    return function () {
      ipcRenderer.removeListener("network:changed", handler);
    };
  },
};

expose("netcfg", netcfgAPI);

/* ==============
   APP controls
   ============== */
expose("app", {
  exit: function () {
    return ipcRenderer.invoke("app:exit");
  },
  closeWindow: function () {
    return ipcRenderer.invoke("app:close-window");
  },
  minimize: function () {
    return ipcRenderer.invoke("app:minimize");
  },
  toggleMaximize: function () {
    return ipcRenderer.invoke("app:toggle-maximize");
  },
});

/* ====================
   File helper (reader)
   ==================== */
expose("fileAPI", {
  toDataURL: async function (absPath) {
    const fs = require("fs").promises;
    const path = require("path");
    const buf = await fs.readFile(absPath);
    var ext = path.extname(absPath).toLowerCase();
    var mime = "application/octet-stream";
    if (ext === ".png") mime = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
    return "data:" + mime + ";base64," + buf.toString("base64");
  },
  pickImage: function () {
    return ipcRenderer.invoke("file:pick-image");
  },
});

/* ==================
   Cloudinary Bridge
   ================== */
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
  uploadImage: function (absPath, options) {
    if (!options) options = {};
    return ipcRenderer.invoke("cloud:upload-image", absPath, options);
  },
  deleteImage: function (publicId) {
    return ipcRenderer.invoke("cloud:delete-image", publicId);
  },
});
