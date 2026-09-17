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

// Beritahu sts-jurysystem bahwa satu team Sprint baru saja diisi Start
// Time-nya oleh operator (live, sebelum "Save Result" diklik) — dipakai
// jurysystem utk validasi "team belum Start" pada submit penalty juri.
function notifyTeamStarted(payload) {
  try {
    const s = getBroadcastSocket();
    if (!s) return;
    s.emit("custom:event", {
      type: "sprint:team-started",
      ts: new Date().toISOString(),
      ...payload, // { eventId, initialId, divisionId, raceId, teamId, bibTeam, startTime }
    });
  } catch (_) {
    // non-critical, jangan sampai gagalkan input operator
  }
}

module.exports = { notifyResultsUpdated, notifyTeamStarted };
