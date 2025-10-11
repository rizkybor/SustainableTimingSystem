const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

async function upsertEventResultsDoc(payload) {
  const db = await getDb();
  const col = db.collection("eventResults");

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

module.exports = { upsertEventResultsDoc };