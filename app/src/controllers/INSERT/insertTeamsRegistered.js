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

module.exports = {
  getTeamsRegistered,
  upsertTeamsRegistered,
  deleteTeamInBucket,
};