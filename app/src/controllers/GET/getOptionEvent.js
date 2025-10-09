const { getDb } = require("../index");

// get Option Level
async function getOptionLevel() {
  try {
    const database = await getDb();
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
    const database = await getDb();
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
    const database = await getDb();
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
    const database = await getDb();
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
    const database = await getDb();
    const collection = database.collection("optionCategoriesRace");
    const data = await collection.find({}).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Option Penalties
async function getOptionPenalties(type) {
  try {
    const database = await getDb();
    const collection = database.collection("optionPenalties");

    let query = {};
    if (type) {
      query = { type: type };
    }
    const data = await collection.find(query).toArray();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// get Option Ranked (dinamis)
async function getOptionRanked(type) {
  try {
    const database = await getDb();
    const collection = database.collection("optionRanked");

    let query = {};
    if (type) {
      query = { type: type };
    }
    const data = await collection.find(query).toArray();
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
