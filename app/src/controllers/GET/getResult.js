const { connectToDatabase } = require("../index");
const { ObjectId } = require("mongodb");

async function getSprintResult(eventId) {
    console.log(eventId);
  const db = await connectToDatabase();
  const col = db.collection("temporarySprintResult");

  const filter = {};
  if (eventId) filter.eventId = eventId;  
  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  console.log(docs,"DATA EVENT");
  return docs;
}

module.exports = { getSprintResult };