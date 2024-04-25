const { connectToDatabase } = require("../index");

// get Option Level
async function getOptionLevel() {
  try {
    const database = await connectToDatabase();
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
    const database = await connectToDatabase();
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
    const database = await connectToDatabase();
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
    const database = await connectToDatabase();
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
    const database = await connectToDatabase();
    const collection = database.collection("optionCategoriesRace");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Option Penalties
async function getOptionPenalties() {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("optionPenalties");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Option Ranked
async function getOptionRanked() {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("optionRanked");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

module.exports = {
  getOptionLevel,
  getOptionCategoriesEvent,
  getOptionCategoriesDivision,
  getOptionCategoriesInitial,
  getOptionCategoriesRace,
  getOptionPenalties,
  getOptionRanked
};
