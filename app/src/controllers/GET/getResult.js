const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

// controllers/getResult.js
async function getSprintResult(identity = {}) {
  const db = await getDb();
  const col = db.collection("temporarySprintResult");

  const filter = {};
  if (identity.eventId) filter.eventId = String(identity.eventId);
  if (identity.initialId) filter.initialId = String(identity.initialId);
  if (identity.raceId) filter.raceId = String(identity.raceId);
  if (identity.divisionId) filter.divisionId = String(identity.divisionId);

  if (identity.raceName)
    filter.raceName = String(identity.raceName).toUpperCase();
  if (identity.divisionName)
    filter.divisionName = String(identity.divisionName).toUpperCase();

  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return docs;
}

async function getDrrResult(identity = {}) {
  const db = await getDb();
  const col = db.collection("temporaryDrrResult");

  const filter = {};
  if (identity.eventId) filter.eventId = String(identity.eventId);
  if (identity.initialId) filter.initialId = String(identity.initialId);
  if (identity.raceId) filter.raceId = String(identity.raceId);
  if (identity.divisionId) filter.divisionId = String(identity.divisionId);

  if (identity.raceName)
    filter.raceName = String(identity.raceName).toUpperCase();
  if (identity.divisionName)
    filter.divisionName = String(identity.divisionName).toUpperCase();

  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return docs;
}

async function getSlalomResult(identity = {}) {
  const db = await getDb();
  const col = db.collection("temporarySlalomResult");

  const filter = {};
  if (identity.eventId) filter.eventId = String(identity.eventId);
  if (identity.initialId) filter.initialId = String(identity.initialId);
  if (identity.raceId) filter.raceId = String(identity.raceId);
  if (identity.divisionId) filter.divisionId = String(identity.divisionId);

  if (identity.raceName)
    filter.raceName = String(identity.raceName).toUpperCase();
  if (identity.divisionName)
    filter.divisionName = String(identity.divisionName).toUpperCase();

  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return docs;
}


module.exports = { getSprintResult, getDrrResult, getSlalomResult };
