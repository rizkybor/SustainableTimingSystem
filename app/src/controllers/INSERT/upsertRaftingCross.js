// ../Controllers/insert/upsertRaftingCross.js
const { getDb } = require("../index");

// --- Nama koleksi
const COL_BRACKETS = "rx_brackets";
const COL_RESULTS  = "rx_results";
const COL_OVERALL  = "rx_overall";

// --- Helper: bikin key unik per bucket
function makeKey(bucket = {}) {
  const e = String(bucket.eventId || "");
  const i = String(bucket.initialId || "");
  const r = String(bucket.raceId || "");
  const d = String(bucket.divisionId || "");
  if (!e || !i || !r || !d) {
    throw new Error("Bucket fields missing (eventId, initialId, raceId, divisionId)!");
  }
  return [e, i, r, d].join("|");
}

async function ensureIndexes(db) {
  await db.collection(COL_BRACKETS)
    .createIndex({ key: 1 }, { unique: true });

  await db.collection(COL_RESULTS)
    .createIndex({ key: 1, roundId: 1, heatId: 1, nameTeam: 1, bibTeam: 1 }, { unique: true });

  await db.collection(COL_OVERALL)
    .createIndex({ key: 1 }, { unique: true });
}

/** =========================================
 *  BRACKET
 *  - upsertBracket(bucket, rounds, { settings })
 *  - getBracket(bucket)
 *  rounds[] = { id, name, heats: [{ id, bronze, bye, teams:[...], results:[...] }] }
 *  ========================================= */
async function upsertBracket(bucket, rounds, { settings = {} } = {}) {
  const db = await getDb();
  await ensureIndexes(db);

  const key = makeKey(bucket);
  const doc = {
    key,
    bucket: {
      eventId: String(bucket.eventId || ""),
      initialId: String(bucket.initialId || ""),
      raceId: String(bucket.raceId || ""),
      divisionId: String(bucket.divisionId || ""),
      eventName: String(bucket.eventName || "RX"),
      initialName: String(bucket.initialName || ""),
      raceName: String(bucket.raceName || ""),
      divisionName: String(bucket.divisionName || "")
    },
    rounds: Array.isArray(rounds) ? rounds : [],
    settings: settings || {},
    updatedAt: new Date()
  };

  await db.collection(COL_BRACKETS).updateOne(
    { key },
    { $set: doc },
    { upsert: true }
  );
  return { ok: true };
}

async function getBracket(bucket) {
  const db = await getDb();
  await ensureIndexes(db);

  const key = makeKey(bucket);
  const item = await db.collection(COL_BRACKETS).findOne({ key });
  return { ok: true, item };
}

/** =========================================
 *  RESULTS (PER HEAT & ALL ROUNDS)
 *  - upsertHeatRows(bucket, roundId, roundName, heatId, rows)
 *  - upsertAllRounds(bucket, roundsSheets)
 *  rows = [{ team, bib, start, finish, race, total, penaltyTime, penaltySum,
 *            penalties:{gate1,gate2}, finishPosition, qualified }]
 *  roundsSheets = [{ roundId, roundName, heatId, rows }]
 *  ========================================= */
async function upsertHeatRows(bucket, roundId, roundName, heatId, rows = []) {
  const db = await getDb();
  await ensureIndexes(db);

  const key = makeKey(bucket);
  const col = db.collection(COL_RESULTS);

  const ops = (rows || []).map((r) => ({
    updateOne: {
      filter: {
        key,
        roundId: String(roundId),
        heatId: String(heatId),
        nameTeam: String(r.team || ""),
        bibTeam: String(r.bib || "")
      },
      update: {
        $set: {
          key,
          bucket: {
            eventId: String(bucket.eventId || ""),
            initialId: String(bucket.initialId || ""),
            raceId: String(bucket.raceId || ""),
            divisionId: String(bucket.divisionId || "")
          },
          roundId: String(roundId),
          roundName: String(roundName || ""),
          heatId: String(heatId),
          nameTeam: String(r.team || ""),
          bibTeam: String(r.bib || ""),
          result: {
            startTime: r.start || "",
            finishTime: r.finish || "",
            raceTime: r.race || "",
            totalTime: r.total || (r.race || ""),
            penaltyTime: r.penaltyTime || "00:00:00.000",
            penalty: Number(r.penaltySum || 0),
            penalties: r.penalties || { gate1: null, gate2: null },
            finishPosition: r.finishPosition != null ? r.finishPosition : null,
            qualified: r.qualified != null ? !!r.qualified : null,
            ranked: r.ranked || null,
            heat: r.heat != null ? r.heat : null
          },
          updatedAt: new Date()
        }
      },
      upsert: true
    }
  }));

  if (ops.length) {
    await col.bulkWrite(ops, { ordered: false });
  }
  return { ok: true, count: ops.length };
}

async function upsertAllRounds(bucket, roundsSheets = []) {
  const db = await getDb();
  await ensureIndexes(db);

  const key = makeKey(bucket);
  const col = db.collection(COL_RESULTS);
  const ops = [];

  (roundsSheets || []).forEach((R) => {
    const roundId = String(R.roundId || "");
    const roundName = String(R.roundName || "");
    const heatId = String(R.heatId || "");
    (R.rows || []).forEach((r) => {
      ops.push({
        updateOne: {
          filter: {
            key,
            roundId,
            heatId,
            nameTeam: String(r.team || ""),
            bibTeam: String(r.bib || "")
          },
          update: {
            $set: {
              key,
              bucket: {
                eventId: String(bucket.eventId || ""),
                initialId: String(bucket.initialId || ""),
                raceId: String(bucket.raceId || ""),
                divisionId: String(bucket.divisionId || "")
              },
              roundId,
              roundName,
              heatId,
              nameTeam: String(r.team || ""),
              bibTeam: String(r.bib || ""),
              result: {
                startTime: r.start || "",
                finishTime: r.finish || "",
                raceTime: r.race || "",
                totalTime: r.total || (r.race || ""),
                penaltyTime: r.penaltyTime || "00:00:00.000",
                penalty: Number(r.penaltySum || 0),
                penalties: r.penalties || { gate1: null, gate2: null },
                finishPosition: r.finishPosition != null ? r.finishPosition : null,
                qualified: r.qualified != null ? !!r.qualified : null,
                ranked: r.ranked || null,
                heat: r.heat != null ? r.heat : null
              },
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      });
    });
  });

  if (ops.length) {
    await col.bulkWrite(ops, { ordered: false });
  }
  return { ok: true, count: ops.length };
}

/** =========================================
 *  OVERALL
 *  - upsertOverall(bucket, overallPkg)
 *  overallPkg = { placements, finalRows, rounds, overallRows }
 *  ========================================= */
async function upsertOverall(bucket, overallPkg = {}) {
  const db = await getDb();
  await ensureIndexes(db);

  const key = makeKey(bucket);
  const doc = {
    key,
    bucket: {
      eventId: String(bucket.eventId || ""),
      initialId: String(bucket.initialId || ""),
      raceId: String(bucket.raceId || ""),
      divisionId: String(bucket.divisionId || "")
    },
    placements: Array.isArray(overallPkg.placements) ? overallPkg.placements : [],
    finalRows: Array.isArray(overallPkg.finalRows) ? overallPkg.finalRows : [],
    rounds: Array.isArray(overallPkg.rounds) ? overallPkg.rounds : [],
    overallRows: Array.isArray(overallPkg.overallRows) ? overallPkg.overallRows : [],
    savedAt: new Date()
  };

  await db.collection(COL_OVERALL).updateOne(
    { key },
    { $set: doc },
    { upsert: true }
  );
  return { ok: true };
}

async function getOverall(bucket) {
  const db = await getDb();
  await ensureIndexes(db);

  const key = makeKey(bucket);
  const item = await db.collection(COL_OVERALL).findOne({ key });
  return { ok: true, item };
}

module.exports = {
  upsertBracket,
  getBracket,
  upsertHeatRows,
  upsertAllRounds,
  upsertOverall,
  getOverall
};
