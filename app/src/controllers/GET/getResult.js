const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

// controllers/getResult.js
async function getSprintResult(identity = {}) {
  const db = await getDb();
  const col = db.collection("temporarySprintResult");

  const filter = {};
  if (identity.eventId) filter.eventId = String(identity.eventId);
  if (identity.initialId) filter.initialId = String(identity.initialId);
  if (identity.raceId) filter.raceId = String(identity.raceId);
  if (identity.divisionId) filter.divisionId = String(identity.divisionId);

  if (identity.raceName)
    filter.raceName = String(identity.raceName).toUpperCase();
  if (identity.divisionName)
    filter.divisionName = String(identity.divisionName).toUpperCase();

  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return docs;
}

async function getDrrResult(identity = {}) {
  const db = await getDb();
  const col = db.collection("temporaryDrrResult");

  const filter = {};
  if (identity.eventId) filter.eventId = String(identity.eventId);
  if (identity.initialId) filter.initialId = String(identity.initialId);
  if (identity.raceId) filter.raceId = String(identity.raceId);
  if (identity.divisionId) filter.divisionId = String(identity.divisionId);

  if (identity.raceName)
    filter.raceName = String(identity.raceName).toUpperCase();
  if (identity.divisionName)
    filter.divisionName = String(identity.divisionName).toUpperCase();

  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return docs;
}

async function getSlalomResult(identity = {}) {
  const db = await getDb();
  const col = db.collection("temporarySlalomResult");

  const filter = {};
  if (identity.eventId) filter.eventId = String(identity.eventId);
  if (identity.initialId) filter.initialId = String(identity.initialId);
  if (identity.raceId) filter.raceId = String(identity.raceId);
  if (identity.divisionId) filter.divisionId = String(identity.divisionId);

  if (identity.raceName)
    filter.raceName = String(identity.raceName).toUpperCase();
  if (identity.divisionName)
    filter.divisionName = String(identity.divisionName).toUpperCase();

  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray();
  return docs;
}


// --- cari hasil MENTAH (per-run) satu tim, untuk Sprint/Slalom/DRR saja ---
// H2H & RX belum ada endpoint baca per-tim dari koleksi hasilnya
// (h2h_results/rx_results) — dikembalikan null (tidak didukung) untuk itu.
function findTeamInArray(docs, fieldName, nameUpper) {
  for (let i = 0; i < (docs || []).length; i++) {
    const doc = docs[i] || {};
    const arr = Array.isArray(doc[fieldName]) ? doc[fieldName] : [];
    for (let j = 0; j < arr.length; j++) {
      const t = arr[j];
      if (t && String(t.nameTeam || "").trim().toUpperCase() === nameUpper) {
        return t;
      }
    }
  }
  return null;
}

async function getRaceCategoryResultForTeam(identity = {}) {
  const cat = String(identity.raceCategory || "").trim().toUpperCase();
  const nameUpper = String(identity.nameTeam || "").trim().toUpperCase();
  if (!nameUpper) return null;

  if (cat === "SPRINT") {
    const docs = await getSprintResult(identity);
    return findTeamInArray(docs, "result", nameUpper);
  }
  if (cat === "SLALOM") {
    const docs = await getSlalomResult(identity);
    return findTeamInArray(docs, "teams", nameUpper);
  }
  if (cat === "DRR") {
    const docs = await getDrrResult(identity);
    return findTeamInArray(docs, "result", nameUpper);
  }
  return null;
}

module.exports = {
  getSprintResult,
  getDrrResult,
  getSlalomResult,
  getRaceCategoryResultForTeam,
};
