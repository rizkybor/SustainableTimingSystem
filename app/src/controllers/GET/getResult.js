const { connectToDatabase } = require("../index");
const { ObjectId } = require("mongodb");

async function getSprintResult(eventId) {
  const db = await connectToDatabase();
  const col = db.collection("temporarySprintResult");

  const filter = {};
  if (eventId) filter.eventId = eventId;  
  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return docs;
}

async function getDrrResult(eventId) {
  const db = await connectToDatabase();
  const col = db.collection("temporaryDrrResult");

  const filter = {};
  if (eventId) filter.eventId = eventId;  
  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return docs;
}

/**
 * Cek apakah sprint-result sudah ada berdasarkan identity penuh
 */
async function existsSprintResult(identity) {
  const db = await connectToDatabase();
  const col = db.collection("temporarySprintResult");

  const filter = {
    eventId: String(identity.eventId || ""),
    initialId: String(identity.initialId || ""),
    raceId: String(identity.raceId || ""),
    divisionId: String(identity.divisionId || ""),
    eventName: String(identity.eventName || "").toUpperCase(),
    initialName: String(identity.initialName || "").toUpperCase(),
    raceName: String(identity.raceName || "").toUpperCase(),
    divisionName: String(identity.divisionName || "").toUpperCase(),
  };

  const count = await col.countDocuments(filter, { limit: 1 });
  return count > 0;
}

module.exports = { existsSprintResult, getSprintResult, getDrrResult };