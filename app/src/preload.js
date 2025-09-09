const { contextBridge, ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
    for (const type of ['chrome', 'node', 'electron']) {
      replaceText(`${type}-version`, process.versions[type])
    }
  })

function expose(key, api) {
  // aman untuk dua mode:
  // - contextIsolation: true  -> lewat contextBridge
  // - contextIsolation: false -> assign langsung ke window
  if (process.contextIsolated) {
    try { contextBridge.exposeInMainWorld(key, api) } catch (e) {}
  } else {
    // fallback jika contextIsolation dimatikan
    window[key] = api
  }
}

expose('app', {
  exit: () => ipcRenderer.invoke('app:exit'),
  closeWindow: () => ipcRenderer.invoke('app:close-window'),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('app:toggle-maximize'),
});

// file picker (dipanggil renderer: window.fileAPI.pickImage())
expose('fileAPI', {
  pickImage: () => ipcRenderer.invoke('file:pick-image'),
})

// Cloudinary bridge (renderer: window.cloud.uploadImage(), deleteImage())
expose('cloud', {
  uploadImage: (absPath, options = {}) =>
    ipcRenderer.invoke('cloud:upload-image', absPath, options),
  deleteImage: (publicId) =>
    ipcRenderer.invoke('cloud:delete-image', publicId),
})