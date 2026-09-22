const { getDb } = require("../index");

// BUG FIX (2026-09-23): sebelumnya flag "team sudah Start" HANYA tersimpan
// lewat relay browser juri (sts-jurysystem, /api/judges/sprint/team-started)
// begitu menerima broadcast socket `sprint:team-started`. Kalau tidak ada
// tab dashboard juri Sprint yang online tepat di momen operator klik Start,
// broadcast itu hilang tanpa jejak — validasi "team belum Start" salah
// menolak penalty walau tim sungguhan sudah start di timing system (lihat
// MEMORY-SPRINT.md).
//
// Di sini kita tulis LANGSUNG ke koleksi `sprintteamstatuses` (skema sama
// persis dgn models/SprintTeamStatus.js di sts-jurysystem, satu cluster
// Atlas yang sama) dari proses Electron saat IPC `sprint:team-started`
// diterima — TIDAK lagi bergantung ada/tidaknya juri online. Broadcast
// socket ke browser juri (notifyTeamStarted) TETAP dipertahankan sbg jalur
// live-update UI juri, cuma bukan lagi satu-satunya cara flag ini tersimpan.
async function upsertSprintTeamStatus(payload) {
  const p = payload || {};
  const eventId = p.eventId ? String(p.eventId) : "";
  const raceId = p.raceId ? String(p.raceId) : "";
  const divisionId = p.divisionId ? String(p.divisionId) : "";
  const teamId = p.teamId ? String(p.teamId) : "";
  const startTime = p.startTime ? String(p.startTime) : "";

  if (!eventId || !raceId || !divisionId || !teamId || !startTime) {
    throw new Error(
      "eventId, raceId, divisionId, teamId, startTime are required"
    );
  }

  const initialId = p.initialId ? String(p.initialId) : "";
  const now = new Date();

  const db = await getDb();
  await db.collection("sprintteamstatuses").updateOne(
    { eventId, initialId, raceId, divisionId, teamId },
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

module.exports = { upsertSprintTeamStatus };
