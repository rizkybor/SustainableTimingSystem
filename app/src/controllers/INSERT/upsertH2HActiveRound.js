const { getDb } = require("../index");

// Babak (round) H2H yang sedang aktif — pengganti sinyal "team belum
// Start" utk kategori lain (H2H tidak punya Start Time per tim, lihat
// models/H2HActiveRound.js di sts-jurysystem). Dipakai jurysystem utk
// filter dropdown Team & Heat di halaman juri H2H.
//
// BUG FIX (2026-09-23): sebelumnya HANYA tersimpan lewat relay browser
// juri (app/judges/headtohead/page.jsx menerima broadcast socket
// `h2h:round-active` lalu POST ke /api/judges/h2h/round-active) — kalau
// tidak ada tab dashboard juri H2H yang online tepat saat operator
// mengaktifkan babak/menentukan Heat, data ini TIDAK PERNAH tersimpan
// (terbukti: koleksi h2hactiverounds kosong total di production). Sama
// akar masalah dgn bug Sprint/Slalom (lihat MEMORY-SPRINT.md) — sekarang
// ditulis LANGSUNG dari proses Electron, broadcast socket lama TETAP
// dipertahankan sbg jalur redundan (update UI juri yang sedang online).
async function upsertH2HActiveRound(payload) {
  const p = payload || {};
  const eventId = p.eventId ? String(p.eventId) : "";
  const raceId = p.raceId ? String(p.raceId) : "";
  const divisionId = p.divisionId ? String(p.divisionId) : "";

  if (!eventId || !raceId || !divisionId) {
    throw new Error("eventId, raceId, divisionId are required");
  }

  const initialId = p.initialId ? String(p.initialId) : "";
  const now = new Date();

  const normalizeTeam = (t) => ({
    teamId: t && t.teamId ? String(t.teamId) : "",
    bibTeam: t && t.bibTeam ? String(t.bibTeam) : "",
    nameTeam: t && t.nameTeam ? String(t.nameTeam) : "",
  });

  const teams = Array.isArray(p.teams) ? p.teams.map(normalizeTeam) : [];
  const matches = Array.isArray(p.matches)
    ? p.matches.map((m) => ({
        heat: Number.isFinite(Number(m && m.heat)) ? Number(m.heat) : null,
        team1: normalizeTeam(m && m.team1),
        team2: normalizeTeam(m && m.team2),
      }))
    : [];

  const db = await getDb();
  await db.collection("h2hactiverounds").updateOne(
    { eventId, initialId, raceId, divisionId },
    {
      $set: {
        roundId: p.roundId ? String(p.roundId) : "",
        roundName: p.roundName ? String(p.roundName) : "",
        teams,
        matches,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
}

module.exports = { upsertH2HActiveRound };
