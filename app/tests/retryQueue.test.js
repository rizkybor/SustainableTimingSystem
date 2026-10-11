// Jalankan: yarn test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRetryQueue } from "../src/lib/retryQueue.js";

// Timer palsu: jalankan semua timer yang terjadwal secara manual.
function fakeTimers() {
  let id = 0;
  const timers = new Map();
  return {
    setTimeoutFn: (fn, ms) => {
      id += 1;
      timers.set(id, { fn, ms });
      return id;
    },
    clearTimeoutFn: (t) => timers.delete(t),
    async tick() {
      const due = Array.from(timers.entries());
      timers.clear();
      for (const [, t] of due) await t.fn();
    },
    count: () => timers.size,
    pendingDelays: () => Array.from(timers.values()).map((t) => t.ms),
  };
}

// "DB" palsu yang bisa diputus/disambung
function fakeDb() {
  return {
    online: false,
    writes: [],
    async write(v) {
      if (!this.online) throw new Error("ECONNRESET");
      this.writes.push(v);
    },
  };
}

test("sukses langsung -> tidak ada antrean", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  db.online = true;
  const q = createRetryQueue(t);
  assert.equal(await q.run("A", () => db.write("a1")), true);
  assert.equal(q.size(), 0);
  assert.deepEqual(db.writes, ["a1"]);
});

test("koneksi putus saat klik Start -> dicoba ulang & tersimpan setelah pulih", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  let recovered = null;
  const q = createRetryQueue({ ...t, onRecovered: (k, n) => (recovered = [k, n]) });
  assert.equal(await q.run("team-1", () => db.write("start-1")), false);
  assert.equal(q.size(), 1);
  await t.tick(); // masih offline
  assert.equal(q.size(), 1);
  db.online = true;
  await t.tick();
  assert.equal(q.size(), 0);
  assert.deepEqual(db.writes, ["start-1"]);
  assert.deepEqual(recovered, ["team-1", 2]);
});

test("jeda makin panjang lalu mentok di 30 detik", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  const q = createRetryQueue(t);
  await q.run("k", () => db.write(1));
  const seen = [];
  for (let i = 0; i < 7; i++) {
    seen.push(...t.pendingDelays());
    await t.tick();
  }
  assert.deepEqual(seen, [2000, 5000, 10000, 20000, 30000, 30000, 30000]);
});

test("nilai terbaru per key menang (yang lama dibatalkan)", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  const q = createRetryQueue(t);
  await q.run("team-1", () => db.write("old"));
  await q.run("team-1", () => db.write("new"));
  assert.equal(q.size(), 1);
  db.online = true;
  await t.tick();
  assert.deepEqual(db.writes, ["new"]);
});

test("versi lama yg gagal belakangan tidak menimpa versi baru yg sudah sukses", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  db.online = true;
  const q = createRetryQueue(t);
  let failOld;
  const oldRun = q.run("team-1", () => new Promise((_, rej) => (failOld = rej)));
  assert.equal(await q.run("team-1", () => db.write("new")), true);
  failOld(new Error("timeout")); // balasan gagal versi lama datang terlambat
  assert.equal(await oldRun, false);
  assert.equal(q.size(), 0, "versi lama tidak boleh mengantre");
  await t.tick();
  assert.deepEqual(db.writes, ["new"]);
});

test("key berbeda tidak saling membatalkan", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  const q = createRetryQueue(t);
  await q.run("team-1", () => db.write("t1"));
  await q.run("team-2", () => db.write("t2"));
  db.online = true;
  await t.tick();
  assert.deepEqual(db.writes.sort(), ["t1", "t2"]);
});

test("menyerah setelah maxAttempts & lapor", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  let gaveUp = null;
  const q = createRetryQueue({ ...t, maxAttempts: 3, onGiveUp: (k) => (gaveUp = k) });
  await q.run("k", () => db.write(1));
  for (let i = 0; i < 5; i++) await t.tick();
  assert.equal(gaveUp, "k");
  assert.equal(q.size(), 0);
  assert.equal(t.count(), 0);
});

test("retryLater: antre tanpa percobaan langsung; cancel menghapus", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  db.online = true;
  const q = createRetryQueue(t);
  q.retryLater("x", () => db.write("x"));
  assert.deepEqual(db.writes, []);
  q.cancel("x");
  await t.tick();
  assert.deepEqual(db.writes, []);
  q.retryLater("y", () => db.write("y"));
  await t.tick();
  assert.deepEqual(db.writes, ["y"]);
});

test("retryLater(expectedSeq): batch lama yg gagal belakangan tidak menimpa batch baru", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  const q = createRetryQueue(t);
  const oldSeq = q.cancel("team-1"); // batch lama dimulai
  const newSeq = q.cancel("team-1"); // batch baru dimulai (lebih baru)
  db.online = true;
  await db.write("new"); // batch baru sukses
  assert.equal(q.retryLater("team-1", () => db.write("old"), oldSeq), false);
  assert.equal(q.size(), 0);
  assert.equal(q.retryLater("team-1", () => db.write("new-retry"), newSeq), true);
  await t.tick();
  assert.deepEqual(db.writes, ["new", "new-retry"]);
});

test("onChange melaporkan jumlah antrean (utk indikator UI)", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  const seen = [];
  const q = createRetryQueue({ ...t, onChange: (n) => seen.push(n) });
  await q.run("a", () => db.write("a"));
  await q.run("b", () => db.write("b"));
  db.online = true;
  await t.tick();
  // naik 1 -> 2 saat dua tulisan gagal, turun ke 0 setelah keduanya tersimpan
  assert.deepEqual(seen.slice(0, 2), [1, 2]);
  assert.equal(seen[seen.length - 1], 0);
  assert.ok(seen.every((n, i) => i === 0 || n !== seen[i - 1]), "tidak lapor nilai sama berturut");
});

test("retryAllNow: coba ulang segera tanpa menunggu jeda", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  const q = createRetryQueue(t);
  await q.run("a", () => db.write("a"));
  await t.tick(); // jeda berikutnya sekarang 5000
  assert.deepEqual(t.pendingDelays(), [5000]);
  db.online = true;
  q.retryAllNow();
  assert.deepEqual(t.pendingDelays(), [0]);
  await t.tick();
  assert.deepEqual(db.writes, ["a"]);
  assert.equal(q.size(), 0);
});

test("retryAllNow saat masih offline: kembali ke jadwal backoff", async () => {
  const t = fakeTimers();
  const db = fakeDb();
  const q = createRetryQueue(t);
  await q.run("a", () => db.write("a"));
  q.retryAllNow();
  await t.tick(); // gagal lagi
  assert.equal(q.size(), 1);
  assert.deepEqual(t.pendingDelays(), [5000]);
});
