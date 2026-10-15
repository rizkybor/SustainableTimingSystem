// src/lib/ipcRequest.js
//
// Request/response IPC yang AMAN dari "balasan tertukar".
//
// Masalah lama: `ipcRenderer.once("x-reply", ...)` menerima balasan PERTAMA
// yang lewat di channel itu — kalau 2 permintaan di channel yang sama
// sedang berjalan bersamaan (pindah kategori cepat, 2 panel fetch paralel,
// komponen lain kebetulan memakai channel yang sama), masing2 bisa menerima
// balasan milik permintaan LAIN. Sumber bug "data bocor antar kategori/babak"
// yg berulang (lihat catatan BUG FIX di HeadToHead.vue, eventCategories.js).
//
// Solusi: setiap permintaan membawa `__reqId` unik; main process
// menggemakannya balik di balasan (otomatis utk SEMUA handler, lihat
// installReqIdEcho() di bawah); listener di sini hanya menerima balasan
// dengan `__reqId` miliknya sendiri, lalu melepas dirinya. Ada batas waktu
// supaya UI tidak menggantung kalau main process tidak membalas.
//
// Modul murni (tanpa import electron) — `ipc` disuntikkan, supaya bisa
// diuji dgn emitter palsu (tests/ipcRequest.test.js). Pemakaian di app:
// `import { ipcRequest } from "@/utils/ipcRequest"`.

let seq = 0;
function nextReqId(channel) {
  seq = (seq + 1) % 1e9;
  return `${channel}#${Date.now().toString(36)}-${seq.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export class IpcTimeoutError extends Error {
  constructor(channel, timeoutMs) {
    super(`IPC "${channel}" tidak membalas dalam ${timeoutMs} ms`);
    this.name = "IpcTimeoutError";
    this.channel = channel;
  }
}

// createIpcRequest(ipcRenderer) -> ipcRequest(channel, payload, options)
//   payload  : HARUS object (biasa) — __reqId ditambahkan ke dalamnya.
//   options.replyChannel : default `${channel}-reply`
//   options.timeoutMs    : default 10000
//   options.onTimeout    : "resolve-null" (default) | "reject"
// Resolve dgn object balasan (tanpa field __reqId).
export function createIpcRequest(ipc) {
  return function ipcRequest(channel, payload = {}, options = {}) {
    const {
      replyChannel = `${channel}-reply`,
      timeoutMs = 10000,
      onTimeout = "resolve-null",
    } = options;
    if (!ipc) return Promise.resolve(null);
    if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
      return Promise.reject(
        new TypeError(`ipcRequest("${channel}"): payload harus object, bukan ${typeof payload}`)
      );
    }
    const reqId = nextReqId(channel);

    return new Promise((resolve, reject) => {
      let timer = null;
      const cleanup = () => {
        clearTimeout(timer);
        ipc.removeListener(replyChannel, onReply);
      };
      function onReply(_event, res) {
        if (!res || typeof res !== "object" || res.__reqId !== reqId) return; // milik permintaan lain
        cleanup();
        // eslint-disable-next-line no-unused-vars
        const { __reqId, ...rest } = res;
        resolve(rest);
      }
      ipc.on(replyChannel, onReply);
      timer = setTimeout(() => {
        cleanup();
        if (onTimeout === "reject") reject(new IpcTimeoutError(channel, timeoutMs));
        else resolve(null);
      }, timeoutMs);
      ipc.send(channel, { ...payload, __reqId: reqId });
    });
  };
}

// Dipasang SEKALI di main process (sebelum handler didaftarkan): setiap
// handler `ipcMain.on(channel, (event, payload) => ...)` yang menerima
// payload object ber-`__reqId` otomatis menggemakan `__reqId` itu di SEMUA
// `event.reply(...)` berbentuk object — handler lama tidak perlu diubah satu
// per satu. Balasan array/primitif & payload tanpa __reqId tidak disentuh,
// jadi pemanggil lama (ipcRenderer.once polos) tetap berjalan seperti biasa.
export function installReqIdEcho(ipcMain) {
  if (!ipcMain || ipcMain.__reqIdEchoInstalled) return;
  const originalOn = ipcMain.on.bind(ipcMain);
  ipcMain.on = function patchedOn(channel, handler) {
    return originalOn(channel, function wrapped(event, payload, ...rest) {
      const reqId =
        payload && typeof payload === "object" && !Array.isArray(payload) ? payload.__reqId : undefined;
      if (reqId !== undefined && event && typeof event.reply === "function") {
        const originalReply = event.reply.bind(event);
        event.reply = (replyChannel, data, ...more) => {
          const echo =
            data && typeof data === "object" && !Array.isArray(data) && data.__reqId === undefined
              ? { ...data, __reqId: reqId }
              : data;
          return originalReply(replyChannel, echo, ...more);
        };
      }
      return handler.call(this, event, payload, ...rest);
    });
  };
  ipcMain.__reqIdEchoInstalled = true;
}
