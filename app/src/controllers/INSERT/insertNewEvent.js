const { connectToDatabase } = require("../index");

// Insert new event
async function insertNewEvent(event) {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("eventsCollection");
    const result = await collection.insertOne(event);
    return result.insertedId;
  } catch (error) {
    console.error("Error inserting event:", error);
    return null;
  }
}

module.exports = {
    insertNewEvent,
};
