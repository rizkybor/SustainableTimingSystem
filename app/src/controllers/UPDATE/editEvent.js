const { getDb } = require("../index");

// Update event by ID
  async function updateEventById(id, updatedEvent) {
    try {
      const database = await getDb();
      const collection = database.collection("eventsCollection");
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedEvent }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating event:", error);
      return false;
    }
  }

  module.exports = {
    updateEventById
  }