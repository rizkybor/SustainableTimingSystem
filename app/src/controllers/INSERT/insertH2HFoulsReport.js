const { getDb } = require("../index");

// Fouls Report — laporan pelanggaran H2H yang dikirim JURI (sts-jurysystem)
// lewat socket "custom:event" (type: "FoulsReport") dan diterima
// HeadToHead.vue::receiveFoulsReport(). MURNI informasi ke operator —
// TIDAK PERNAH mengubah result/penalty resmi tim manapun. Tujuannya
// mencatat pelanggaran di lapangan yang tidak terlihat kamera/operator
// (mis. dorongan tangan/kaki, pukulan, sentuh gate) supaya operator bisa
// mempertimbangkannya secara manual saat menetapkan hasil akhir.
async function insertH2HFoulsReport(payload) {
  const p = payload || {};
  const eventId = p.eventId ? String(p.eventId) : "";
  if (!eventId) throw new Error("eventId is required");

  const doc = {
    eventId,
    initialId: p.initialId ? String(p.initialId) : "",
    divisionId: p.divisionId ? String(p.divisionId) : "",
    raceId: p.raceId ? String(p.raceId) : "",
    roundId: p.roundId ? String(p.roundId) : "",
    roundName: p.roundName ? String(p.roundName) : "",
    foulTeam: normalizeTeamRef(p.foulTeam),
    unfoulTeam: normalizeTeamRef(p.unfoulTeam),
    position: p.position ? String(p.position) : "",
    positionLabel: p.positionLabel ? String(p.positionLabel) : "",
    detail: p.detail ? String(p.detail) : "",
    detailLabel: p.detailLabel ? String(p.detailLabel) : "",
    penaltySecondsLabel: Number.isFinite(Number(p.penaltySecondsLabel))
      ? Number(p.penaltySecondsLabel)
      : null,
    remarks: p.remarks ? String(p.remarks) : "",
    judge: p.judge ? String(p.judge) : "",
    sourceTs: p.sourceTs ? String(p.sourceTs) : "",
    receivedAt: new Date(),
  };

  const db = await getDb();
  const col = db.collection("h2hFoulsReports");
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

// LIST: fouls report utk satu event, opsional filter divisionId+raceId
// (kategori) dan roundId (babak) — urut terbaru dulu.
async function listH2HFoulsReports(eventId, opts) {
  const options = opts || {};
  let limit = Number.isFinite(options.limit) ? options.limit : 200;
  limit = Math.min(Math.max(limit, 1), 500);

  const db = await getDb();
  const col = db.collection("h2hFoulsReports");

  const query = { eventId: String(eventId || "") };
  if (options.divisionId) query.divisionId = String(options.divisionId);
  if (options.raceId) query.raceId = String(options.raceId);
  if (options.roundId) query.roundId = String(options.roundId);

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

module.exports = { insertH2HFoulsReport, listH2HFoulsReports };
