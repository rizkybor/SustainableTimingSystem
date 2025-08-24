const { connectToDatabase } = require("../index");
const { ObjectId } = require('mongodb');

// get All Events
async function getSprintResult(query = {}) {
  const db = await connectToDatabase();
  const col = db.collection("temporarySprintResult");

  // siapkan filter opsional
  const filter = {};
  if (query.eventId) filter.eventId = query.eventId;         // kamu isi saat save result
  if (query.model)   filter.model = query.model;             // "SPRINT"
  if (query.initial) filter.initial = query.initial;         // "MEN" / "WOMEN" / ...
  if (query.race)    filter.race = query.race;               // "OPEN" / "JUNIOR" / ...
  if (query.division) filter.division = query.division;      // "R4" / "R6" / ...

  // default: terbaru duluan
  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return docs;
}

module.exports = {
  getSprintResult,
};
