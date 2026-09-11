// controllers/INSERT/teams.js
const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

/** Konversi aman ke ObjectId dari berbagai bentuk (_id string, { $oid }, ObjectId, dst.) */
function asObjectId(val) {
  let s = val;
  if (s && typeof s === "object" && s.$oid) s = s.$oid;        // dari BSON plain
  if (s && typeof s === "object" && s._id) s = s._id;          // nested
  if (s && typeof s === "object" && s.toHexString) s = s.toHexString();

  s = String(s || "").trim();
  if (!s) throw new Error("Invalid _id");

  // Validasi kasar 24 hex
  if (!/^[a-fA-F0-9]{24}$/.test(s)) throw new Error("Invalid ObjectId format");
  return new ObjectId(s);
}

/** Normalisasi dokumen tim untuk INSERT */
function sanitizeTeam(t = {}) {
  const n = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

  return {
    typeTeam:      String(t.typeTeam || "").trim(),
    nameTeam:      String(t.nameTeam || "").trim().toUpperCase(),
    bibTeam:       String(t.bibTeam || "").trim(),
    startOrder:    String(t.startOrder || "").trim(),
    praStart:      String(t.praStart || "").trim(),
    intervalRace:  String(t.intervalRace || "").trim(),
    statusId:      n(t.statusId),
    countryCode:   String(t.countryCode || "").trim().toUpperCase(),
    createdAt:     new Date(),
    updatedAt:     new Date(),
  };
}

/** INSERT */
async function insertNewTeam(payload = {}) {
  const db = await getDb();
  const coll = db.collection("teamsCollection");

  const doc = sanitizeTeam(payload);

  if (!doc.typeTeam) throw new Error("typeTeam is required");
  if (!doc.nameTeam) throw new Error("nameTeam is required");

  // Unique index (nameTeam + bibTeam) dibuat sekali per koneksi DB lewat
  // ensureIndexes() di controllers/index.js — E11000 di bawah ini adalah
  // hasil pelanggaran index itu.
  try {
    const result = await coll.insertOne(doc);
    return { insertedId: result.insertedId };
  } catch (e) {
    if (e && e.code === 11000) {
      throw new Error("Team with the same name & bib already exists");
    }
    throw e;
  }
}

/**
 * Bulk INSERT (dipakai fitur "Import from Excel") — insert banyak tim
 * sekaligus, tapi tim yang bentrok (nameTeam+bibTeam sudah ada, lihat unique
 * index) di-SKIP saja (bukan gagal total), supaya import ribuan baris tetap
 * jalan walau sebagian sudah pernah diimport sebelumnya.
 */
async function insertManyTeams(payloads = []) {
  const db = await getDb();
  const coll = db.collection("teamsCollection");

  const docs = (Array.isArray(payloads) ? payloads : [])
    .map(sanitizeTeam)
    .filter((d) => d.typeTeam && d.nameTeam);

  if (!docs.length) {
    return { insertedCount: 0, skippedCount: 0, skipped: [] };
  }

  try {
    const result = await coll.insertMany(docs, { ordered: false });
    return {
      insertedCount: result.insertedCount || 0,
      skippedCount: 0,
      skipped: [],
    };
  } catch (e) {
    // insertMany dengan ordered:false tetap masukkan semua doc yang VALID,
    // dan melempar BulkWriteError berisi daftar error per-doc (mis. E11000
    // duplikat) — hitung ulang mana yang sukses vs gagal dari sini.
    const writeErrors = (e && e.writeErrors) || [];
    const duplicateIndexes = new Set(writeErrors.map((we) => we.index));
    const insertedCount = docs.length - duplicateIndexes.size;
    const skipped = writeErrors.map((we) => ({
      nameTeam: docs[we.index] ? docs[we.index].nameTeam : "",
      reason:
        we.code === 11000 ? "Sudah ada (duplikat)" : we.errmsg || "Gagal",
    }));

    // error selain duplikat (E11000) tetap dianggap kegagalan asli, bukan
    // sekadar "sudah ada" — lempar supaya caller tahu ada masalah lain
    const nonDuplicateErrors = writeErrors.filter((we) => we.code !== 11000);
    if (nonDuplicateErrors.length === writeErrors.length && writeErrors.length) {
      throw e;
    }

    return { insertedCount, skippedCount: skipped.length, skipped };
  }
}

/** READ all (terbaru dulu) */
async function getAllTeams() {
  const db = await getDb();
  const coll = db.collection("teamsCollection");

  const items = await coll.find({}).sort({ createdAt: -1 }).toArray();
  return Array.isArray(items) ? items : [];
}

/** UPDATE by _id (hanya field yang dikirim) */
async function updateTeamById(payload = {}) {
  const { _id } = payload;
  if (!_id) throw new Error("_id is required");

  const oid = asObjectId(_id);

  const n = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

  const $set = { updatedAt: new Date() };
  if (payload.typeTeam !== undefined) $set.typeTeam = String(payload.typeTeam || "").trim();
  if (payload.nameTeam !== undefined) $set.nameTeam = String(payload.nameTeam || "").trim().toUpperCase();
  if (payload.bibTeam  !== undefined) $set.bibTeam  = String(payload.bibTeam  || "").trim();
  if (payload.statusId!== undefined) $set.statusId = n(payload.statusId);
  if (payload.countryCode !== undefined) $set.countryCode = String(payload.countryCode || "").trim().toUpperCase();

  const result = await collUpdateOneSafe(oid, $set);
  return result;
}

/** DELETE by _id */
async function deleteTeamById(id) {
  const oid = asObjectId(id);
  const db = await getDb();
  const coll = db.collection("teamsCollection");
  const r = await coll.deleteOne({ _id: oid });
  return r.deletedCount > 0;
}

/** Options untuk select Team Type */
async function getOptionTeamTypes() {
  // Bisa diganti read dari DB bila perlu
  return [
        { value: "club", name: "Club" },
        { value: "pengcab", name: "Pengcab" },
        { value: "pengprov", name: "Pengprov" },
        { value: "wilayah", name: "Wilayah" },
        { value: "negara", name: "Negara" },
      ];
}

/** Helper: updateOne dengan guard */
async function collUpdateOneSafe(oid, setDoc) {
  const db = await getDb();
  const coll = db.collection("teamsCollection");

  try {
    // Kalau cuma updatedAt saja, tetap jalankan — tidak dianggap error
    const r = await coll.updateOne({ _id: oid }, { $set: setDoc });
    // matchedCount > 0 dianggap sukses walaupun modifiedCount bisa 0 (data sama)
    return r.matchedCount > 0;
  } catch (e) {
    if (e && e.code === 11000) {
      throw new Error("Team with the same name & bib already exists");
    }
    throw e;
  }
}

module.exports = {
  insertNewTeam,
  insertManyTeams,
  getAllTeams,
  updateTeamById,
  deleteTeamById,
  getOptionTeamTypes,
};