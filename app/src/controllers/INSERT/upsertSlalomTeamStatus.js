const { getDb } = require("../index");

// BUG FIX (2026-09-23): sama persis dgn upsertSprintTeamStatus.js — flag
// "team sudah Start" utk Slalom (PER RUN, beda dari Sprint yang cuma 1
// Start per team) sebelumnya HANYA tersimpan lewat relay browser juri
// (sts-jurysystem, /api/judges/slalom/team-started) begitu menerima
// broadcast socket `slalom:team-started`. Kalau tidak ada tab dashboard
// juri Slalom yang online tepat di momen operator klik Start, broadcast
// itu hilang tanpa jejak.
//
// Tulis LANGSUNG ke koleksi `slalomteamstatuses` (skema sama persis dgn
// models/SlalomTeamStatus.js di sts-jurysystem, satu cluster Atlas yang
// sama) dari proses Electron saat IPC `slalom:team-started` diterima —
// TIDAK lagi bergantung ada/tidaknya juri online. Broadcast socket ke
// browser juri (notifySlalomTeamStarted) TETAP dipertahankan sbg jalur
// live-update UI juri.
async function upsertSlalomTeamStatus(payload) {
  const p = payload || {};
  const eventId = p.eventId ? String(p.eventId) : "";
  const raceId = p.raceId ? String(p.raceId) : "";
  const divisionId = p.divisionId ? String(p.divisionId) : "";
  const teamId = p.teamId ? String(p.teamId) : "";
  const startTime = p.startTime ? String(p.startTime) : "";
  const runNumber = Number(p.runNumber);

  if (
    !eventId ||
    !raceId ||
    !divisionId ||
    !teamId ||
    !startTime ||
    !Number.isFinite(runNumber)
  ) {
    throw new Error(
      "eventId, raceId, divisionId, teamId, runNumber, startTime are required"
    );
  }

  const initialId = p.initialId ? String(p.initialId) : "";
  const now = new Date();

  const db = await getDb();
  await db.collection("slalomteamstatuses").updateOne(
    { eventId, initialId, raceId, divisionId, teamId, runNumber },
    {
      $set: {
        bibTeam: p.bibTeam ? String(p.bibTeam) : "",
        startTime,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
}

module.exports = { upsertSlalomTeamStatus };
