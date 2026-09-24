import Vue from "vue";
import { io } from "socket.io-client";
import { logger } from "@/utils/logger";

const BROKER_URL =
  process.env.VUE_APP_MODE === "lan"
    ? process.env.VUE_APP_RT_URL_LAN
    : process.env.VUE_APP_RT_URL;

const TOKEN =
  typeof window !== "undefined" ? localStorage.getItem("authToken") : undefined;

let socket;

// State koneksi realtime, reaktif (Vue.observable) supaya komponen mana pun
// (ConnectionStatusBadge.vue, atau langsung di race-entry page) bisa
// `import { connectionState } from "@/services/socket"` dan bind ke
// template tanpa perlu prop-drilling/event bus manual.
//
// BUG FIX: sebelumnya socket.js sama sekali tidak expose status koneksi ke
// UI — operator tidak py cara tahu kapan channel realtime ke sts-jurysystem
// terputus. Kalau penalty juri terkirim TEPAT saat socket putus, update
// itu hilang dari layar tanpa jejak & tanpa indikasi apa pun ke operator.
export const connectionState = Vue.observable({
  status: "connecting", // "connecting" | "connected" | "disconnected" | "reconnecting"
  // Increment tiap kali socket BERHASIL reconnect setelah sempat putus
  // (bukan koneksi pertama kali) — dipakai race-entry page sbg trigger
  // "waktunya catch-up: re-fetch penalty yg mungkin terlewat selama
  // koneksi putus". Bukan boolean krn watcher Vue butuh nilai yg BERUBAH
  // tiap kali, termasuk kalau reconnect terjadi berkali-kali berturutan.
  reconnectTick: 0,
  lastDisconnectedAt: null,
});

export function getSocket() {
  if (!socket) {
    socket = io(BROKER_URL, {
      auth: { token: TOKEN },
      // BUG FIX: sebelumnya pakai default socket.io-client sepenuhnya —
      // default-nya SEBENARNYA sudah reconnect otomatis, tapi tanpa batas
      // waktu attempt yg jelas & tanpa cara bagi UI utk tahu sedang dalam
      // proses reconnect. Eksplisitkan supaya perilakunya jelas & bisa
      // di-tune: retry terus (reconnectionAttempts Infinity, ini koneksi
      // krusial utk race berlangsung, jangan pernah "menyerah" sendiri),
      // delay makin lama tiap percobaan (exponential-ish, dibatasi max 10s)
      // supaya tidak spam broker kalau memang sedang down lama.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    let everConnected = false;

    socket.on("connect", () => {
      const wasDisconnected = connectionState.status !== "connected";
      connectionState.status = "connected";
      if (process.env.VUE_APP_ENV !== "production") {
        logger.info("[Electron] socket connected:", socket.id);
      }
      // reconnectTick HANYA naik kalau ini benar2 reconnect (sudah pernah
      // connect sebelumnya lalu sempat putus) — koneksi PERTAMA kali saat
      // halaman baru dibuka bukan "catch-up", tidak ada apa pun yg
      // terlewat krn belum pernah connect sama sekali.
      if (everConnected && wasDisconnected) {
        connectionState.reconnectTick += 1;
      }
      everConnected = true;
    });

    socket.on("disconnect", () => {
      connectionState.status = "disconnected";
      connectionState.lastDisconnectedAt = new Date().toISOString();
      if (process.env.VUE_APP_ENV !== "production") {
        logger.info("[Electron] socket disconnected");
      }
    });

    socket.on("reconnect_attempt", () => {
      connectionState.status = "reconnecting";
    });
  }
  return socket;
}
