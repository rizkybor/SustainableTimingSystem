const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

async function upsertEventResultsDoc(payload) {
  const db = await getDb();
  const col = db.collection("temporaryOverallEventResults");

  const filter = {
    eventId: payload.eventId,
    initialId: payload.initialId,
    raceName: payload.raceName,
    divisionId: payload.divisionId,
  };

  const updateDoc = {
    $set: {
      eventId: payload.eventId,
      initialId: payload.initialId,
      raceId: payload.raceId,
      divisionId: payload.divisionId,
      eventName: payload.eventName,
      initialName: payload.initialName,
      raceName: payload.raceName,
      divisionName: payload.divisionName,
      eventResult: payload.eventResult,
      updatedAt: new Date(),
    },
    $setOnInsert: { createdAt: new Date() },
  };

  const options = { upsert: true };
  const result = await col.updateOne(filter, updateDoc, options);
  return result;
}


async function getEventResultsAggregate(f) {
  const db = await getDb();
  const col = db.collection("temporaryOverallEventResults"); // nama koleksi rekap kamu

  const q = {
    eventId: String(f.eventId || ""),
    initialId: String(f.initialId || ""),
    divisionId: String(f.divisionId || ""),
  };

  // sesuai struktur kamu: satu dokumen per kombinasi 3 field di atas
  // kalau ternyata ada lebih dari satu, ambil yang terbaru by updatedAt
  const doc = await col
    .find(q)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(1)
    .next();

  if (!doc) throw new Error("Aggregate not found");
  return doc;
}



module.exports = { upsertEventResultsDoc, getEventResultsAggregate };