// src/utils/ipcRequest.js — instance siap pakai di renderer.
//
//   import { ipcRequest } from "@/utils/ipcRequest";
//   const res = await ipcRequest("teams-sprint-registered:find", { ... });
//   if (!res) { /* timeout / tidak ada balasan */ }
//
// Pengganti pola `ipcRenderer.once("<channel>-reply", ...)` + send(): balasan
// dicocokkan lewat __reqId sehingga tidak bisa tertukar dgn permintaan lain
// di channel yang sama. Detail & tes: src/lib/ipcRequest.js,
// tests/ipcRequest.test.js.
import { ipcRenderer } from "electron";
import { createIpcRequest, IpcTimeoutError } from "@/lib/ipcRequest";

export const ipcRequest = createIpcRequest(
  typeof ipcRenderer !== "undefined" ? ipcRenderer : null
);
export { IpcTimeoutError };
