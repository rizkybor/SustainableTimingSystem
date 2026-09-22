const { getDb } = require("../index");

// Flag "team sudah Start" utk DRR (SATU startTime per team, bukan per-run
// spt Slalom) — ditulis LANGSUNG ke koleksi `drrteamstatuses` (skema sama
// persis dgn models/DRRTeamStatus.js di sts-jurysystem, satu cluster Atlas
// yang sama) dari proses Electron saat IPC `drr:team-started` diterima.
// Sengaja TIDAK dibangun lewat relay browser juri spt Sprint/Slalom
// awalnya — pelajaran dari bug "juri belum Start padahal sudah Start"
// (2026-09-23, lihat MEMORY-SPRINT.md): kalau flag ini cuma bergantung ada
// tab juri yang online tepat di momen operator klik Start, sinyalnya bisa
// hilang tanpa jejak.
async function upsertDRRTeamStatus(payload) {
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
  await db.collection("drrteamstatuses").updateOne(
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

module.exports = { upsertDRRTeamStatus };
