const { getDb } = require("../index");

// Field Notes — versi RINGAN dari H2H Fouls Report (lihat
// insertH2HFoulsReport.js), dipakai Sprint/Slalom/DRR/RX yang TIDAK
// punya konsep "Unfouls Team"/Pen Position/Pen Detail (cuma satu tim
// per laporan, kontak fisik antartim tidak relevan di kategori
// single-boat). Dikirim JURI (sts-jurysystem) lewat socket
// "custom:event" (type: "FieldNotes"), diterima masing-masing view
// race category (SprintRace.vue/SlalomRace.vue/DownRiverRace.vue/
// RaftingCross.vue). MURNI catatan bebas ke operator — TIDAK PERNAH
// mengubah result/penalty resmi tim manapun.
async function insertFieldNotesReport(payload) {
  const p = payload || {};
  const eventId = p.eventId ? String(p.eventId) : "";
  if (!eventId) throw new Error("eventId is required");
  const category = p.category ? String(p.category).toUpperCase() : "";
  if (!category) throw new Error("category is required");

  const doc = {
    eventId,
    category, // "SPRINT" | "SLALOM" | "DRR" | "RX"
    initialId: p.initialId ? String(p.initialId) : "",
    divisionId: p.divisionId ? String(p.divisionId) : "",
    raceId: p.raceId ? String(p.raceId) : "",
    // Cuma relevan utk Slalom (2 Run independen) — kosong utk kategori lain.
    runNumber: Number.isFinite(Number(p.runNumber)) ? Number(p.runNumber) : null,
    team: normalizeTeamRef(p.team),
    remarks: p.remarks ? String(p.remarks) : "",
    judge: p.judge ? String(p.judge) : "",
    sourceTs: p.sourceTs ? String(p.sourceTs) : "",
    receivedAt: new Date(),
  };

  const db = await getDb();
  const col = db.collection("judgeFieldNotes");
  const res = await col.insertOne(doc);

  return { ...doc, _id: String(res.insertedId) };
}

function normalizeTeamRef(t) {
  if (!t || typeof t !== "object") return { teamId: "", bibTeam: "", nameTeam: "" };
  return {
    teamId: t.teamId ? String(t.teamId) : "",
    bibTeam: t.bibTeam ? String(t.bibTeam) : "",
    nameTeam: t.nameTeam ? String(t.nameTeam) : "",
  };
}

// LIST: field notes utk satu event + kategori, opsional filter
// divisionId+raceId (spesifik kategori itu) — urut terbaru dulu.
async function listFieldNotesReports(eventId, category, opts) {
  const options = opts || {};
  let limit = Number.isFinite(options.limit) ? options.limit : 200;
  limit = Math.min(Math.max(limit, 1), 500);

  const db = await getDb();
  const col = db.collection("judgeFieldNotes");

  const query = {
    eventId: String(eventId || ""),
    category: String(category || "").toUpperCase(),
  };
  if (options.divisionId) query.divisionId = String(options.divisionId);
  if (options.raceId) query.raceId = String(options.raceId);

  const items = await col
    .find(query)
    .sort({ receivedAt: -1 })
    .limit(limit)
    .toArray();

  items.forEach((it) => {
    it._id = String(it._id);
  });

  return items;
}

module.exports = { insertFieldNotesReport, listFieldNotesReports };
