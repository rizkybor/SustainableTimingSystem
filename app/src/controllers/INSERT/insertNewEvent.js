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

  // Poster Event (opsional, gambar tunggal) — dipakai kartu event di Home
  // (Events List). Sama seperti signature: hanya di-set kalau dikirim
  // eksplisit (termasuk null utk hapus); kalau tidak dikirim, nilai lama
  // di DB dibiarkan apa adanya.
  if (payload && Object.prototype.hasOwnProperty.call(payload, "poster")) {
    set.poster = payload.poster || null;
    set.poster_url = (payload.poster && payload.poster.secure_url) || "";
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

// Kategori valid utk status Provisional/Unofficial/Official per-kategori.
// "overall" = Event Overall Result (bukan bagian dari race category manapun,
// SENGAJA tetap event-wide/flat, bukan per-bucket).
const OFFICIAL_CATEGORIES = ["sprint", "h2h", "slalom", "drr", "raftingcross", "overall"];

// BUG FIX (2026-09-25): Sprint/H2H/Slalom/DRR/RaftingCross sekarang kirim
// key KOMPOSIT per-bucket (mis. "sprint__<divisionId>__<raceId>__<initialId>"
// — lihat buildCategoryStatusKey() di utils/officialStamp.js) supaya status
// tiap kombinasi Division/Race/Initial berdiri sendiri, bukan berbagi satu
// status per tipe kategori. Validasi di sini cuma cek PREFIX-nya (sebelum
// "__") termasuk kategori yang dikenal — "overall" tidak pernah punya
// suffix bucket (tetap flat), jadi otomatis tetap valid via cek prefix ini.
function isValidCategoryKey(category) {
  const base = String(category || "").split("__")[0];
  return OFFICIAL_CATEGORIES.includes(base);
}

// 3 status result yg valid. "provisional" = default (hasil masih berjalan/
// sementara, belum ada keputusan), "unofficial" = draft/belum final,
// "official" = final & terkunci.
const RESULT_STATUSES = ["provisional", "unofficial", "official"];

// Status aktif/tidaknya EVENT itu sendiri (`statusEvent`, dibaca All
// Events -> AllEvent.vue). Sebelumnya field ini HANYA ditulis sekali saat
// event dibuat (selalu "Activated", lihat CreateEvent.vue), tidak pernah
// ada UI untuk mengubahnya lagi — status "Inactive" ditampilkan sbg pill
// read-only tapi TIDAK PERNAH bisa benar2 dicapai lewat aplikasi. Fungsi
// ini menambahkan cara mengubahnya, toggle sederhana Active <-> Inactive
// dari kolom Action di All Events, sama pola dgn setResultsStatus() di
// bawah (validasi + $set + updatedAt).
const EVENT_STATUSES = ["Activated", "Inactive"];

async function setEventStatus(eventId, status) {
  const id = toObjectId(eventId);
  if (!id) return { ok: false, error: "invalid eventId" };
  if (!EVENT_STATUSES.includes(status)) {
    return { ok: false, error: "invalid status" };
  }

  var db = await getDb();
  const coll = db.collection("eventsCollection");
  const resp = await coll.updateOne(
    { _id: id },
    { $set: { statusEvent: status, updatedAt: new Date() } },
    { upsert: false }
  );
  return {
    ok: true,
    matchedCount: resp.matchedCount,
    modifiedCount: resp.modifiedCount,
    status,
  };
}

// BUG FIX: sebelumnya SEMUA kategori (Sprint/H2H/Slalom/DRR/RaftingCross/
// Overall) berbagi satu field `resultsOfficial` di eventsCollection —
// meng-Official-kan Sprint otomatis ikut meng-Official-kan kategori lain.
// Sekarang disimpan per-kategori di `resultsOfficialByCategory.<category>`,
// field lama `resultsOfficial` dibiarkan (dead data) demi kompatibilitas
// data lama, tidak dipakai lagi oleh renderer.
//
// `resultsOfficialByCategory.<category>` SENGAJA tetap boolean polos
// (BUKAN diubah jadi object {value,setAt}) — sts-jurysystem's
// LiveEventDetail.jsx sudah membaca field ini LANGSUNG sbg boolean
// (poll + socket "official:changed") utk badge Live Result & gating lock
// edit di banyak halaman Result timingsystem; mengubah bentuknya jadi
// object akan mematahkan semua truthy-check itu. Status 3-pilihan
// (Provisional/Unofficial/Official) disimpan di field BARU
// `resultsStatusByCategory.<category>` (string) — boolean lama tetap
// ditulis SELARAS (true hanya kalau status === "official") supaya semua
// konsumen lama (lock-edit di Result pages, badge boolean di jurysystem)
// tetap jalan tanpa perubahan. Timestamp kapan status terakhir diset
// (otomatis = waktu submit, atau override manual operator) tetap di
// `resultsOfficialSetAt.<category>` (ISO string UTC), sekarang berlaku
// utk perubahan ke status manapun (bukan cuma ke Official).
async function setResultsStatus(eventId, category, status, timestamp) {
  const id = toObjectId(eventId);
  if (!id) return { ok: false, error: "invalid eventId" };
  if (!isValidCategoryKey(category)) {
    return { ok: false, error: "invalid category" };
  }
  if (!RESULT_STATUSES.includes(status)) {
    return { ok: false, error: "invalid status" };
  }

  // Terima timestamp manual (ISO string dari operator, sudah dikonversi
  // dari WIB ke UTC di sisi renderer) kalau valid; kalau tidak
  // dikirim/tidak valid, pakai waktu server SEKARANG (otomatis).
  let setAt = new Date();
  if (timestamp) {
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) setAt = parsed;
  }

  var db = await getDb();
  const coll = db.collection("eventsCollection");
  const resp = await coll.updateOne(
    { _id: id },
    {
      $set: {
        [`resultsStatusByCategory.${category}`]: status,
        [`resultsOfficialByCategory.${category}`]: status === "official",
        [`resultsOfficialSetAt.${category}`]: setAt,
        updatedAt: new Date(),
      },
    },
    { upsert: false }
  );
  return {
    ok: true,
    matchedCount: resp.matchedCount,
    modifiedCount: resp.modifiedCount,
    status,
    setAt: setAt.toISOString(),
  };
}

module.exports = {
  insertNewEvent,
  updateEventPoster,
  updateBasic,
  updateAssets,
  setResultsStatus,
  setEventStatus,
};
