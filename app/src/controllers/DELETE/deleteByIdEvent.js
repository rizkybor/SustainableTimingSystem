const { getDb } = require("../index");

// Delete event by ID
async function deleteEventById(id) {
    try {
      const database = await getDb();
      const collection = database.collection("eventsCollection");
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  }

module.exports = {
    deleteEventById
}