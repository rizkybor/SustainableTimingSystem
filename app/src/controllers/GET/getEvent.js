const { getDb } = require("../index");
const { ObjectId } = require('mongodb');


// get All Events
async function getAllEvents() {
  try {
    const database = await getDb();
    const collection = database.collection("eventsCollection");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Events By Id
async function getEventById(payload) {
  try {
    const database = await getDb();
    const collection = database.collection("eventsCollection");
    const result = await collection.findOne({ _id: ObjectId(payload) });
    return result;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

module.exports = {
  getAllEvents,
  getEventById
};
