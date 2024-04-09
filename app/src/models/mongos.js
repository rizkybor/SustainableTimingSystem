const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// connectToDatabase();
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}

// get All Events
async function getAllEvents() {
  try {
    await connectToDatabase();
    const database = client.db("sustainabledb");
    const collection = database.collection("eventsCollection");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Option Level
async function getOptionLevel() {
  try {
    await connectToDatabase();
    const database = client.db("sustainabledb");
    const collection = database.collection("optionLevelEvent");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Option Event Categories
async function getOptionCategoriesEvent() {
  try {
    await connectToDatabase();
    const database = client.db("sustainabledb");
    const collection = database.collection("optionCategoriesEvent");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Option Division Categories
async function getOptionCategoriesDivision() {
  try {
    await connectToDatabase();
    const database = client.db("sustainabledb");
    const collection = database.collection("optionCategoriesDivision");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Option Initial Categories
async function getOptionCategoriesInitial() {
  try {
    await connectToDatabase();
    const database = client.db("sustainabledb");
    const collection = database.collection("optionCategoriesInitial");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Option Race Categories
async function getOptionCategoriesRace() {
  try {
    await connectToDatabase();
    const database = client.db("sustainabledb");
    const collection = database.collection("optionCategoriesRace");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

module.exports = {
  getAllEvents,
  getOptionLevel,
  getOptionCategoriesEvent,
  getOptionCategoriesDivision,
  getOptionCategoriesInitial,
  getOptionCategoriesRace,
};
