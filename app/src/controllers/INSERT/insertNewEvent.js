const { connectToDatabase } = require("../index");

// Insert new event
async function insertNewEvent(payload) {
  try {
    const database = await connectToDatabase();
    const collection = database.collection("eventsCollection");

    // CLEAR ID CAT EVENT
    payload.categoriesEvent.forEach((e) => {
      delete e._id;
    });

    // CLEAR ID CAT DIVISION
    payload.categoriesDivision.forEach((e) => {
      delete e._id;
    });

    // CLEAR ID CAT RACE
    payload.categoriesRace.forEach((e) => {
      delete e._id;
    });

    // CLEAR ID CAT INITIAL
    payload.categoriesInitial.forEach((e) => {
      delete e._id;
    });

    const result = await collection.insertOne(payload);
    return result.insertedId;
  } catch (error) {
    console.error("Error inserting event:", error);
    return null;
  }
}

async function insertSprintResult(payload) {
  try {
    const db = await connectToDatabase();
    if (!db || typeof db.collection !== 'function') {
      throw new Error('connectToDatabase() did not return a Db instance');
    }

    const collection = db.collection("temporarySprintResult");

    if (!Array.isArray(payload)) {
      throw new Error('insertSprintResult: payload must be an array');
    }
    if (payload.length === 0) {
      return { ok: true, insertedCount: 0, insertedIds: [] };
    }

    const now = new Date();
    const docs = payload.map((it, idx) => {
      // pastikan plain object
      if (!it || typeof it !== 'object' || Array.isArray(it)) {
        throw new Error(`Document at index ${idx} is not a plain object`);
      }
      // deep clone untuk hilangkan Proxy/fungsi
      const clean = JSON.parse(JSON.stringify(it));
      if (!clean || typeof clean !== 'object' || Array.isArray(clean)) {
        throw new Error(`Document at index ${idx} became invalid after clone`);
      }
      if (clean._id) delete clean._id;
      clean.createdAt = now;
      clean.updatedAt = now;
      return clean;
    });

    const result = await collection.insertMany(docs, { ordered: true });
    return {
      ok: true,
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds),
    };
  } catch (error) {
    console.error('Error inserting sprint result:', error);
    return { ok: false, error: error.message };
  }
}

async function insertDrrResult(payload) {
  try {
    const db = await connectToDatabase();
    if (!db || typeof db.collection !== 'function') {
      throw new Error('connectToDatabase() did not return a Db instance');
    }

    const collection = db.collection("temporaryDrrResult");

    if (!Array.isArray(payload)) {
      throw new Error('insertDrrResult: payload must be an array');
    }
    if (payload.length === 0) {
      return { ok: true, insertedCount: 0, insertedIds: [] };
    }

    const now = new Date();
    const docs = payload.map((it, idx) => {
      // pastikan plain object
      if (!it || typeof it !== 'object' || Array.isArray(it)) {
        throw new Error(`Document at index ${idx} is not a plain object`);
      }
      // deep clone untuk hilangkan Proxy/fungsi
      const clean = JSON.parse(JSON.stringify(it));
      if (!clean || typeof clean !== 'object' || Array.isArray(clean)) {
        throw new Error(`Document at index ${idx} became invalid after clone`);
      }
      if (clean._id) delete clean._id;
      clean.createdAt = now;
      clean.updatedAt = now;
      return clean;
    });

    const result = await collection.insertMany(docs, { ordered: true });
    return {
      ok: true,
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds),
    };
  } catch (error) {
    console.error('Error inserting sprint result:', error);
    return { ok: false, error: error.message };
  }
}



module.exports = {
  insertNewEvent,
  insertSprintResult,
  insertDrrResult
};
