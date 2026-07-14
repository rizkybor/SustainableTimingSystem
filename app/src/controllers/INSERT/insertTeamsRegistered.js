// controllers/INSERT/insertTeamsRegistered.js
const { getDb } = require("../index");

// --- helpers ---
function sanitizeBucket(b) {
  const clean = { ...b };
  delete clean._id;
  if (!Array.isArray(clean.teams)) clean.teams = [];
  return clean;
}

function normIdentity(x = {}) {
  return {
    eventId: String(x.eventId || ""),
    initialId: String(x.initialId || ""),
    raceId: String(x.raceId || ""),
    divisionId: String(x.divisionId || ""),
    eventName: String(x.eventName || "").toUpperCase(),
    initialName: String(x.initialName || "").toUpperCase(),
    raceName: String(x.raceName || "").toUpperCase(),
    divisionName: String(x.divisionName || "").toUpperCase(),
  };
}

function normTeam(t = {}) {
  return {
    nameTeam: String(t.nameTeam || "").trim().toUpperCase(),
    bibTeam: String(t.bibTeam || "").trim(),
  };
}

// --- READ one bucket by identity ---
async function getTeamsRegistered(identityInput) {
  const db = await getDb();
  const coll = db.collection("teamsRegisteredCollection");
  const identity = normIdentity(identityInput);
  const bucket = await coll.findOne(identity);
  return bucket || null;
}

// --- UPSERT bucket: update teams jika identity sama, else insert baru ---
async function upsertTeamsRegistered(bucketInput) {
  const db = await getDb();
  const coll = db.collection("teamsRegisteredCollection");

  const bucket = sanitizeBucket(bucketInput);
  const identity = normIdentity(bucket);

  const existing = await coll.findOne(identity);
  if (existing) {
    const result = await coll.updateOne(identity, { $set: { teams: bucket.teams } });
    return { updated: true, modifiedCount: result.modifiedCount };
  } else {
    const newDoc = { ...identity, teams: bucket.teams };
    const result = await coll.insertOne(newDoc);
    return { inserted: true, insertedId: result.insertedId };
  }
}

// --- DELETE one team (match by nameTeam + bibTeam, case/space-insensitive) ---
async function deleteTeamInBucket({ identity, team }) {
  const db = await getDb();
  const coll = db.collection("teamsRegisteredCollection");

  const iden = normIdentity(identity);
  const { nameTeam, bibTeam } = normTeam(team);

  // Update pipeline (MongoDB >= 4.2)
  const result = await coll.updateOne(
    iden,
    [
      {
        $set: {
          teams: {
            $filter: {
              input: "$teams",
              as: "t",
              cond: {
                $not: {
                  $and: [
                    {
                      $eq: [
                        { $toUpper: { $trim: { input: "$$t.nameTeam" } } },
                        nameTeam,
                      ],
                    },
                    {
                      $eq: [
                        { $trim: { input: "$$t.bibTeam" } },
                        bibTeam,
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    ]
  );

  return { ok: result.modifiedCount > 0 };
}

// --- FIND all bucket entries (across every event/race) for a given team name ---
async function findRegisteredEntriesByTeamName(nameTeam) {
  const nm = String(nameTeam || "").trim().toUpperCase();
  if (!nm) return [];

  const db = await getDb();
  const coll = db.collection("teamsRegisteredCollection");

  const docs = await coll.find({ "teams.nameTeam": nm }).toArray();

  const out = [];
  docs.forEach((doc) => {
    const matched = Array.isArray(doc.teams)
      ? doc.teams.filter((t) => String(t && t.nameTeam || "").toUpperCase() === nm)
      : [];
    matched.forEach((t) => {
      out.push({
        eventId: String(doc.eventId || ""),
        initialId: String(doc.initialId || ""),
        raceId: String(doc.raceId || ""),
        divisionId: String(doc.divisionId || ""),
        // NB: field ini bernama "eventName" di teamsRegisteredCollection,
        // tapi isinya sebenarnya RACE CATEGORY/discipline (SPRINT/HEAD2HEAD/
        // SLALOM/DRR/RX) — bukan judul event. Judul event asli ada di
        // eventsCollection, di-lookup terpisah lewat eventId.
        raceCategory: String(doc.eventName || ""),
        initialName: String(doc.initialName || ""),
        raceName: String(doc.raceName || ""),
        divisionName: String(doc.divisionName || ""),
        bibTeam: String((t && t.bibTeam) || ""),
      });
    });
  });
  return out;
}

// --- FIND semua bucket registrasi utk satu event, lintas race category
// (dipakai utk cross-check "apakah tim ini masih benar-benar terdaftar di
// discipline X" saat menampilkan rekap Overall — hasil lama yang tersimpan
// di temporaryOverallEventResults bisa jadi basi kalau registrasinya sudah
// diubah/dihapus setelah race dijalankan) ---
async function findRegisteredBucketsByEventId(eventId) {
  const id = String(eventId || "");
  if (!id) return [];

  const db = await getDb();
  const coll = db.collection("teamsRegisteredCollection");

  const docs = await coll.find({ eventId: id }).toArray();
  return docs.map((doc) => ({
    // NB: sama seperti findRegisteredEntriesByTeamName — "eventName" di
    // collection ini sebenarnya berarti RACE CATEGORY/discipline.
    raceCategory: String(doc.eventName || ""),
    initialName: String(doc.initialName || ""),
    raceName: String(doc.raceName || ""),
    divisionName: String(doc.divisionName || ""),
    teamNames: Array.isArray(doc.teams)
      ? doc.teams
          .map((t) => String((t && t.nameTeam) || "").trim().toUpperCase())
          .filter(Boolean)
      : [],
  }));
}

module.exports = {
  getTeamsRegistered,
  upsertTeamsRegistered,
  findRegisteredBucketsByEventId,
  deleteTeamInBucket,
  findRegisteredEntriesByTeamName,
};