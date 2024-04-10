const { connectToDatabase } = require("../index");

// get All Events
async function getAllEvents() {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("eventsCollection");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

module.exports = {
  getAllEvents,
};
