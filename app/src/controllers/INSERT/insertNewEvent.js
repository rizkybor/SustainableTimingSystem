const { connectToDatabase } = require("../index");

// Insert new event
async function insertNewEvent(payload) {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("eventsCollection");
    
    // CLEAR ID CAT EVENT 
    payload.categoriesEvent.forEach(e => {
      delete e._id;
    });

    // CLEAR ID CAT DIVISION 
    payload.categoriesDivision.forEach(e => {
      delete e._id;
    });

    // CLEAR ID CAT RACE
    payload.categoriesRace.forEach(e => {
      delete e._id;
    });

    // CLEAR ID CAT INITIAL 
    payload.categoriesInitial.forEach(e => {
      delete e._id;
    });

    const result = await collection.insertOne(payload);
    return result.insertedId;
  } catch (error) {
    console.error("Error inserting event:", error);
    return null;
  }
}

module.exports = {
    insertNewEvent,
};
