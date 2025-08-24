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

module.exports = { getSprintResult, getDrrResult };