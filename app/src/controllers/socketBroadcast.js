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

// Beritahu sts-jurysystem bahwa operator baru saja membuka/pindah ke
// babak (round) tertentu di H2H — H2H tidak punya "Start Time" per tim
// seperti Sprint, jadi ini pengganti sinyal live "tim mana yang sekarang
// boleh dinilai juri" (dipakai utk filter dropdown Team + label babak
// aktif di jurysystem).
function notifyH2HRoundActive(payload) {
  try {
    const s = getBroadcastSocket();
    if (!s) return;
    s.emit("custom:event", {
      type: "h2h:round-active",
      ts: new Date().toISOString(),
      ...payload, // { eventId, initialId, divisionId, raceId, roundId, roundName, teams: [{teamId, bibTeam, nameTeam}] }
    });
  } catch (_) {
    // non-critical, jangan sampai gagalkan perpindahan babak operator
  }
}

// Beritahu sts-jurysystem bahwa satu team Slalom baru saja diisi Start
// Time-nya oleh operator utk SATU RUN tertentu (Run 1/Run 2 py startTime
// sendiri-sendiri, lihat updateTime() di SlalomRace.vue) — dipakai
// jurysystem utk validasi "team belum Start di run ini" pada submit
// penalty juri. Pola sama persis dgn notifyTeamStarted() Sprint, cuma
// ditambah `runNumber` krn Slalom py 2 run independen per team.
function notifySlalomTeamStarted(payload) {
  try {
    const s = getBroadcastSocket();
    if (!s) return;
    s.emit("custom:event", {
      type: "slalom:team-started",
      ts: new Date().toISOString(),
      ...payload, // { eventId, initialId, divisionId, raceId, teamId, bibTeam, runNumber, startTime }
    });
  } catch (_) {
    // non-critical, jangan sampai gagalkan input operator
  }
}

module.exports = {
  notifyResultsUpdated,
  notifyTeamStarted,
  notifyH2HRoundActive,
  notifySlalomTeamStarted,
};
