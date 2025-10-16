const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

// Insert new event
async function insertNewEvent(payload) {
  try {
    const database = await getDb();
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

async function updateEventPoster(payload) {
  try {
    if (payload === null || payload === undefined) {
      return { ok: false, error: "updateEventPoster: payload is required" };
    }
    if (payload._id === null || payload._id === undefined) {
      return { ok: false, error: "updateEventPoster: _id is required" };
    }
    if (payload.poster === null || payload.poster === undefined) {
      return {
        ok: false,
        error: "updateEventPoster: poster object is required",
      };
    }

    var idStr = String(payload._id).trim();
    var oidPattern = /^[a-f0-9]{24}$/i;
    if (!oidPattern.test(idStr)) {
      return { ok: false, error: "invalid ObjectId string: " + idStr };
    }
    var oid = new ObjectId(idStr);

    var p = payload.poster;
    var posterDoc = {
      public_id: "",
      secure_url: "",
      url: "",
      folder: "",
      width: null,
      height: null,
      bytes: null,
      format: "",
      version: null,
      created_at: "",
    };

    if (p !== null && p !== undefined) {
      if (p.public_id !== null && p.public_id !== undefined) {
        posterDoc.public_id = String(p.public_id);
      }
      if (p.secure_url !== null && p.secure_url !== undefined) {
        posterDoc.secure_url = String(p.secure_url);
      }
      if (p.url !== null && p.url !== undefined) {
        posterDoc.url = String(p.url);
      }
      if (p.folder !== null && p.folder !== undefined) {
        posterDoc.folder = String(p.folder);
      }
      if (
        p.width !== null &&
        p.width !== undefined &&
        Number.isFinite(p.width)
      ) {
        posterDoc.width = Number(p.width);
      }
      if (
        p.height !== null &&
        p.height !== undefined &&
        Number.isFinite(p.height)
      ) {
        posterDoc.height = Number(p.height);
      }
      if (
        p.bytes !== null &&
        p.bytes !== undefined &&
        Number.isFinite(p.bytes)
      ) {
        posterDoc.bytes = Number(p.bytes);
      }
      if (p.format !== null && p.format !== undefined) {
        posterDoc.format = String(p.format);
      }
      if (p.version !== null && p.version !== undefined) {
        posterDoc.version = p.version;
      }
      if (p.created_at !== null && p.created_at !== undefined) {
        posterDoc.created_at = String(p.created_at);
      }
    }

    var db = await getDb();
    var col = db.collection("eventsCollection");

    var updateDoc = {
      $set: {
        poster: posterDoc,
        poster_url: posterDoc.secure_url,
        sponsor_logo_url: [],
        updatedAt: new Date(),
      },
    };

    var res = await col.updateOne({ _id: oid }, updateDoc);

    var matched = 0;
    var modified = 0;
    if (res !== null && res !== undefined) {
      if (typeof res.matchedCount === "number") matched = res.matchedCount;
      if (typeof res.modifiedCount === "number") modified = res.modifiedCount;
    }

    return {
      ok: true,
      matchedCount: matched,
      modifiedCount: modified,
      poster_url: posterDoc.secure_url,
    };
  } catch (error) {
    var msg = "Unknown error";
    if (error !== null && error !== undefined) {
      if (typeof error.message === "string") msg = error.message;
    }
    return { ok: false, error: msg };
  }
}

module.exports = {
  insertNewEvent,
  updateEventPoster,
};
