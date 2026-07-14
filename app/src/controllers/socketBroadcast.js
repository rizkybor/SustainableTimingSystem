const { io } = require("socket.io-client");
require("dotenv").config();

const BROKER_URL = process.env.VUE_APP_RT_URL;

let socket;
function getBroadcastSocket() {
  if (!socket && BROKER_URL) {
    socket = io(BROKER_URL, { transports: ["websocket"] });
  }
  return socket;
}

// Beritahu client lain (mis. Live Result di sts-jurysystem) bahwa hasil
// resmi kategori tertentu baru saja tersimpan/berubah, supaya mereka bisa
// refetch tanpa menunggu polling.
function notifyResultsUpdated(payload) {
  try {
    const s = getBroadcastSocket();
    if (!s) return;
    s.emit("custom:event", {
      type: "results:updated",
      ts: new Date().toISOString(),
      ...payload, // { eventId, category, initialId, divisionId, raceId }
    });
  } catch (_) {
    // non-critical, jangan sampai gagalkan proses simpan hasil
  }
}

module.exports = { notifyResultsUpdated };
