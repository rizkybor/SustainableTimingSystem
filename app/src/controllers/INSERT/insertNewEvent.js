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
        eventFiles: [],
        sponsorFiles: [],
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

function toObjectId(x) {
  try {
    return new ObjectId(String(x));
  } catch (e) {
    return null;
  }
}

function cleanCategoryArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((e) => {
    const c = e && typeof e === "object" ? { ...e } : {};
    delete c._id;
    return c;
  });
}

async function updateBasic(payload) {
  const id = payload && payload._id ? toObjectId(payload._id) : null;
  if (!id) return { ok: false, error: "invalid _id" };

  const sig = payload && payload.signature ? payload.signature : {};
  const eventName =
    payload && payload.eventName ? String(payload.eventName) : "";

  const set = {
    eventName: eventName,
    signature: {
      technicalDelegate: sig && sig.technicalDelegate === true ? true : false,
      chiefJudge: sig && sig.chiefJudge === true ? true : false,
      raceDirector: sig && sig.raceDirector === true ? true : false,
    },
    updatedAt: new Date(),
  };

  // Comitte (nama, bukan flag tampil/tidaknya di hasil cetak)
  if (payload && payload.technicalDelegate != null)
    set.technicalDelegate = String(payload.technicalDelegate);
  if (payload && payload.chiefJudge != null)
    set.chiefJudge = String(payload.chiefJudge);
  if (payload && payload.raceDirector != null)
    set.raceDirector = String(payload.raceDirector);

  if (payload && payload.levelName != null)
    set.levelName = String(payload.levelName);
  if (payload && payload.riverName != null)
    set.riverName = String(payload.riverName);
  if (payload && payload.addressDistrict != null)
    set.addressDistrict = String(payload.addressDistrict);
  if (payload && payload.addressSubDistrict != null)
    set.addressSubDistrict = String(payload.addressSubDistrict);
  if (payload && payload.addressVillage != null)
    set.addressVillage = String(payload.addressVillage);
  if (payload && payload.addressCity != null)
    set.addressCity = String(payload.addressCity);
  if (payload && payload.addressProvince != null)
    set.addressProvince = String(payload.addressProvince);
  if (payload && payload.addressZipCode != null)
    set.addressZipCode = String(payload.addressZipCode);
  if (payload && payload.addressState != null)
    set.addressState = String(payload.addressState);
  if (payload && payload.startDateEvent != null)
    set.startDateEvent = String(payload.startDateEvent);
  if (payload && payload.endDateEvent != null)
    set.endDateEvent = String(payload.endDateEvent);
  if (payload && Array.isArray(payload.categoriesEvent))
    set.categoriesEvent = cleanCategoryArray(payload.categoriesEvent);
  if (payload && Array.isArray(payload.categoriesDivision))
    set.categoriesDivision = cleanCategoryArray(payload.categoriesDivision);
  if (payload && Array.isArray(payload.categoriesRace))
    set.categoriesRace = cleanCategoryArray(payload.categoriesRace);
  if (payload && Array.isArray(payload.categoriesInitial))
    set.categoriesInitial = cleanCategoryArray(payload.categoriesInitial);

  const update = { $set: set };

  var db = await getDb();
  const coll = db.collection("eventsCollection");
  const resp = await coll.updateOne({ _id: id }, update, { upsert: false });
  return {
    ok: true,
    matchedCount: resp.matchedCount,
    modifiedCount: resp.modifiedCount,
  };
}

async function updateAssets(payload) {
  const id = payload && payload._id ? toObjectId(payload._id) : null;
  if (!id) return { ok: false, error: "invalid _id" };

  const ev =
    payload && Array.isArray(payload.eventFiles) ? payload.eventFiles : [];
  const sp =
    payload && Array.isArray(payload.sponsorFiles) ? payload.sponsorFiles : [];

  const set = {
    eventFiles: ev,
    sponsorFiles: sp,
    updatedAt: new Date(),
  };

  // Signature Comitte (opsional, PNG tunggal per role). Kalau field-nya
  // dikirim eksplisit (termasuk null utk hapus), baru di-set; kalau tidak
  // dikirim sama sekali, nilai lama di DB dibiarkan apa adanya.
  if (payload && Object.prototype.hasOwnProperty.call(payload, "technicalDelegateSignature")) {
    set.technicalDelegateSignature = payload.technicalDelegateSignature || null;
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload, "chiefJudgeSignature")) {
    set.chiefJudgeSignature = payload.chiefJudgeSignature || null;
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload, "raceDirectorSignature")) {
    set.raceDirectorSignature = payload.raceDirectorSignature || null;
  }

  const update = { $set: set };

  var db = await getDb();
  const coll = db.collection("eventsCollection");
  const resp = await coll.updateOne({ _id: id }, update, { upsert: false });
  return {
    ok: true,
    matchedCount: resp.matchedCount,
    modifiedCount: resp.modifiedCount,
  };
}

async function setResultsOfficial(eventId, value) {
  const id = toObjectId(eventId);
  if (!id) return { ok: false, error: "invalid eventId" };

  var db = await getDb();
  const coll = db.collection("eventsCollection");
  const resp = await coll.updateOne(
    { _id: id },
    { $set: { resultsOfficial: !!value, updatedAt: new Date() } },
    { upsert: false }
  );
  return {
    ok: true,
    matchedCount: resp.matchedCount,
    modifiedCount: resp.modifiedCount,
  };
}

module.exports = {
  insertNewEvent,
  updateEventPoster,
  updateBasic,
  updateAssets,
  setResultsOfficial,
};
