// Jalankan: yarn test
import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createIpcRequest, installReqIdEcho, IpcTimeoutError } from "../src/lib/ipcRequest.js";

// IPC palsu: renderer (send/on/removeListener) <-> main (ipcMain.on + event.reply)
function fakeIpc() {
  const renderer = new EventEmitter();
  const mainBus = new EventEmitter();
  const ipcMain = { on: (ch, fn) => mainBus.on(ch, fn) };
  const ipcRenderer = {
    send: (ch, payload) => {
      const event = { reply: (rch, data) => setImmediate(() => renderer.emit(rch, {}, data)) };
      setImmediate(() => mainBus.emit(ch, event, payload));
    },
    on: (ch, fn) => renderer.on(ch, fn),
    removeListener: (ch, fn) => renderer.removeListener(ch, fn),
    listenerCount: (ch) => renderer.listenerCount(ch),
  };
  return { ipcMain, ipcRenderer };
}

test("balasan dicocokkan ke permintaannya sendiri walau datang terbalik (race lama .once)", async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  installReqIdEcho(ipcMain);
  // handler LAMA (tidak tahu soal __reqId): balas lambat utk bucket A, cepat utk B
  ipcMain.on("teams:find", (event, payload) => {
    const delay = payload.bucket === "A" ? 30 : 5;
    setTimeout(() => event.reply("teams:find-reply", { items: [payload.bucket] }), delay);
  });
  const ipcRequest = createIpcRequest(ipcRenderer);
  const [a, b] = await Promise.all([
    ipcRequest("teams:find", { bucket: "A" }),
    ipcRequest("teams:find", { bucket: "B" }),
  ]);
  assert.deepEqual(a, { items: ["A"] });
  assert.deepEqual(b, { items: ["B"] });
  assert.equal(ipcRenderer.listenerCount("teams:find-reply"), 0, "listener harus dilepas");
});

test("timeout -> null (default) dan listener dilepas", async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  installReqIdEcho(ipcMain);
  ipcMain.on("diam", () => {}); // tidak pernah membalas
  const ipcRequest = createIpcRequest(ipcRenderer);
  const res = await ipcRequest("diam", {}, { timeoutMs: 20 });
  assert.equal(res, null);
  assert.equal(ipcRenderer.listenerCount("diam-reply"), 0);
});

test("timeout -> reject kalau diminta", async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  installReqIdEcho(ipcMain);
  ipcMain.on("diam", () => {});
  const ipcRequest = createIpcRequest(ipcRenderer);
  await assert.rejects(ipcRequest("diam", {}, { timeoutMs: 20, onTimeout: "reject" }), IpcTimeoutError);
});

test("pemanggil lama (tanpa __reqId) & balasan array tidak diubah", async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  installReqIdEcho(ipcMain);
  ipcMain.on("list", (event) => event.reply("list-reply", [1, 2, 3]));
  ipcMain.on("obj", (event) => event.reply("obj-reply", { ok: true }));
  const got = await new Promise((resolve) => {
    ipcRenderer.on("obj-reply", (_e, d) => resolve(d));
    ipcRenderer.send("obj", "primitive-payload");
  });
  assert.deepEqual(got, { ok: true }); // tanpa __reqId tambahan
  const arr = await new Promise((resolve) => {
    ipcRenderer.on("list-reply", (_e, d) => resolve(d));
    ipcRenderer.send("list", { __reqId: "x" });
  });
  assert.deepEqual(arr, [1, 2, 3]);
});

test("handler yg sudah menggemakan __reqId sendiri tetap jalan", async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  installReqIdEcho(ipcMain);
  ipcMain.on("own", (event, p) => event.reply("own-reply", { ok: 1, __reqId: p.__reqId }));
  const ipcRequest = createIpcRequest(ipcRenderer);
  assert.deepEqual(await ipcRequest("own", {}), { ok: 1 });
});

test("payload bukan object ditolak jelas (bukan diam2 rusak)", async () => {
  const { ipcRenderer } = fakeIpc();
  const ipcRequest = createIpcRequest(ipcRenderer);
  await assert.rejects(ipcRequest("x", "abc"), TypeError);
});

test("installReqIdEcho idempoten", () => {
  const { ipcMain } = fakeIpc();
  installReqIdEcho(ipcMain);
  const patched = ipcMain.on;
  installReqIdEcho(ipcMain);
  assert.equal(ipcMain.on, patched);
});
