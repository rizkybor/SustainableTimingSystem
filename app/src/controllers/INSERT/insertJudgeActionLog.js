const { getDb } = require("../index");

var VALID_CATEGORIES = ["sprint", "h2h", "slalom", "drr", "rx"];

// INSERT: satu tindakan judge (penalty/booyan/dst) yang diterima via socket
// "custom:event" dari sts-jurysystem dan berhasil diterapkan ke tim lokal.
// Tujuannya murni audit trail — tidak boleh mengganggu alur
// applyPenaltyFromSocket* yang sudah ada kalau insert ini gagal.
async function insertJudgeActionLog(payload) {
  var p = payload || {};
  var eventId = p.eventId ? String(p.eventId) : "";
  var raceCategory = p.raceCategory ? String(p.raceCategory).toLowerCase() : "";

  if (!eventId) throw new Error("eventId is required");
  if (VALID_CATEGORIES.indexOf(raceCategory) === -1) {
    throw new Error(
      "raceCategory is required and must be one of: " + VALID_CATEGORIES.join(", ")
    );
  }

  var value =
    p.value === "" || p.value === undefined || p.value === null
      ? null
      : Number(p.value);

  var doc = {
    eventId: eventId,
    raceCategory: raceCategory,
    type: p.type ? String(p.type) : "",
    text: p.text ? String(p.text) : "",
    teamId: p.teamId ? String(p.teamId) : "",
    teamName: p.teamName ? String(p.teamName) : "",
    bibTeam: p.bibTeam ? String(p.bibTeam) : "",
    value: Number.isFinite(value) ? value : null,
    from: p.from ? String(p.from) : "",
    sourceTs: p.sourceTs ? String(p.sourceTs) : "",
    raw: p.raw && typeof p.raw === "object" ? p.raw : null,
    receivedAt: new Date(),
  };

  var db = await getDb();
  var col = db.collection("judgeActionLogs");
  var res = await col.insertOne(doc);

  return { ...doc, _id: String(res.insertedId) };
}

// LIST: riwayat tindakan judge untuk satu event (+ opsional raceCategory),
// urut terbaru dulu.
async function listJudgeActionLogsByEvent(eventId, raceCategory, opts) {
  var options = opts || {};
  var limit = Number.isFinite(options.limit) ? options.limit : 200;
  limit = Math.min(Math.max(limit, 1), 500);

  var db = await getDb();
  var col = db.collection("judgeActionLogs");

  var query = { eventId: String(eventId || "") };
  if (raceCategory) query.raceCategory = String(raceCategory).toLowerCase();

  var items = await col
    .find(query)
    .sort({ receivedAt: -1 })
    .limit(limit)
    .toArray();

  items.forEach(function (it) {
    it._id = String(it._id);
  });

  return items;
}

module.exports = {
  insertJudgeActionLog,
  listJudgeActionLogsByEvent,
  VALID_CATEGORIES,
};
