// ../Controllers/insert/upsertHeadToHead.js
const { getDb } = require("../index");
const { ObjectId } = require("mongodb");
const { notifyResultsUpdated } = require("../socketBroadcast");

// --- Nama koleksi (silakan samain dengan konvensi kamu)
const COL_BRACKETS = "h2h_brackets";
const COL_RESULTS  = "h2h_results";
const COL_OVERALL  = "h2h_overall";

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
    .createIndex({ key: 1, roundId: 1, nameTeam: 1, bibTeam: 1 }, { unique: true });

  await db.collection(COL_OVERALL)
    .createIndex({ key: 1 }, { unique: true });
}

/** =========================================
 *  BRACKET
 *  - upsertBracket(bucket, rounds, { showBronze, settings })
 *  - getBracket(bucket)
 *  ========================================= */
async function upsertBracket(bucket, rounds, { showBronze = true, settings = {} } = {}) {
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
      eventName: String(bucket.eventName || "HEAD2HEAD"),
      initialName: String(bucket.initialName || ""),
      raceName: String(bucket.raceName || ""),
      divisionName: String(bucket.divisionName || "")
    },
    rounds: Array.isArray(rounds) ? rounds : [],
    showBronze: !!showBronze,
    settings: settings || {},
    updatedAt: new Date()
  };

  await db.collection(COL_BRACKETS).updateOne(
    { key },
    { $set: doc },
    { upsert: true }
  );

  // BUG FIX (2026-09-25): sebelumnya perubahan bracket (assign tim, ubah
  // Heat, buat babak baru) TIDAK PERNAH memberi tahu sts-jurysystem —
  // Live Result publik cuma refresh saat `upsertOverall()` (hasil akhir
  // H2H) tersimpan, jadi Bracket H2H publik (baru dibangun) hanya update
  // setelah SELURUH pertandingan selesai, bukan live per-babak. Reuse
  // event `results:updated` yang SUDAH didengarkan LiveEventDetail.jsx —
  // tidak perlu tipe event baru, cukup category "H2H" match.
  notifyResultsUpdated({
    eventId: doc.bucket.eventId,
    category: "H2H",
    initialId: doc.bucket.initialId,
    divisionId: doc.bucket.divisionId,
    raceId: doc.bucket.raceId,
  });

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
 *  RESULTS (PER ROUND & ALL ROUNDS)
 *  - upsertRoundRows(bucket, roundId, roundName, rows)
 *  - upsertAllRounds(bucket, roundsSheets)
 *  rows = output dari buildRoundRows(r)
 *  roundsSheets = output dari buildAllRoundsPackage()
 *  ========================================= */
async function upsertRoundRows(bucket, roundId, roundName, rows = []) {
  const db = await getDb();
  await ensureIndexes(db);

  const key = makeKey(bucket);
  const col = db.collection(COL_RESULTS);

  const ops = (rows || []).map((r) => ({
    updateOne: {
      filter: {
        key,
        roundId: String(roundId),
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
          nameTeam: String(r.team || ""),
          bibTeam: String(r.bib || ""),
          result: {
            startTime: r.start || "",
            finishTime: r.finish || "",
            raceTime: r.race || "",
            totalTime: r.total || (r.race || ""),
            penaltyTime: r.penaltyTime || "00:00:00.000",
            penalty: Number(r.penaltySum || 0),
            ranked: r.ranked || null,
            winLose: r.winLose || null,
            heat: r.heat != null ? r.heat : null,
            penalties: r.penalties || {},
            // BUG FIX: dulu field ini tidak pernah ditulis ke DB — row dari
            // buildRoundRows() di HeadToHead.vue SUDAH menyertakan flag
            // (DNF/DNS/DSQ, di-set via markFlag()), tapi hilang di sini
            // sebelum masuk ke $set, jadi Result page (yang baca dari DB
            // lewat h2h:results:getAll) selalu melihat flag: null walau
            // operator sudah menandai tim itu DNF/DNS/DSQ dan menyimpannya.
            flag: r.flag || null
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

  // Sama pola dgn upsertBracket() — laporkan hasil per-babak (waktu,
  // Win/Lose) supaya Bracket H2H publik ikut refresh live per-match,
  // bukan cuma menunggu upsertOverall() di akhir seluruh pertandingan.
  if (ops.length) {
    notifyResultsUpdated({
      eventId: String(bucket.eventId || ""),
      category: "H2H",
      initialId: String(bucket.initialId || ""),
      divisionId: String(bucket.divisionId || ""),
      raceId: String(bucket.raceId || ""),
    });
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
    (R.rows || []).forEach((r) => {
      ops.push({
        updateOne: {
          filter: {
            key,
            roundId,
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
              nameTeam: String(r.team || ""),
              bibTeam: String(r.bib || ""),
              result: {
                startTime: r.start || "",
                finishTime: r.finish || "",
                raceTime: r.race || "",
                totalTime: r.total || (r.race || ""),
                penaltyTime: r.penaltyTime || "00:00:00.000",
                penalty: Number(r.penaltySum || 0),
                ranked: r.ranked || null,
                winLose: r.winLose || null,
                heat: r.heat != null ? r.heat : null,
                penalties: r.penalties || {},
                // BUG FIX: sama seperti upsertRoundRows() di atas — flag
                // (DNF/DNS/DSQ) dari buildRoundRows() hilang sebelum sampai
                // ke DB lewat "Save All Rounds".
                flag: r.flag || null
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

  // Sama pola dgn upsertRoundRows() di atas.
  if (ops.length) {
    notifyResultsUpdated({
      eventId: String(bucket.eventId || ""),
      category: "H2H",
      initialId: String(bucket.initialId || ""),
      divisionId: String(bucket.divisionId || ""),
      raceId: String(bucket.raceId || ""),
    });
  }

  return { ok: true, count: ops.length };
}

/** =========================================
 *  OVERALL
 *  - upsertOverall(bucket, overallPkg)
 *  overallPkg = buildOverallPackage()
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
      divisionId: String(bucket.divisionId || ""),
      eventName: String(bucket.eventName || "HEAD2HEAD"),
      initialName: String(bucket.initialName || ""),
      raceName: String(bucket.raceName || ""),
      divisionName: String(bucket.divisionName || "")
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

  notifyResultsUpdated({
    eventId: doc.bucket.eventId,
    category: "H2H",
    initialId: doc.bucket.initialId,
    divisionId: doc.bucket.divisionId,
    raceId: doc.bucket.raceId,
  });

  return { ok: true };
}

async function getOverall(bucket) {
  const db = await getDb();
  await ensureIndexes(db);

  const key = makeKey(bucket);
  const item = await db.collection(COL_OVERALL).findOne({ key });
  return { ok: true, item };
}

// Ambil SEMUA baris hasil (semua round, semua tim) utk satu bucket — dipakai
// Registered Teams (Details/index.vue) utk menentukan status per tim
// (Belum Bertanding / Bertanding di Round X / Sudah Selesai Bertanding),
// bukan cuma satu round seperti upsertRoundRows/upsertAllRounds.
async function getAllResults(bucket) {
  const db = await getDb();
  await ensureIndexes(db);

  const key = makeKey(bucket);
  const items = await db.collection(COL_RESULTS).find({ key }).toArray();
  return { ok: true, items };
}

module.exports = {
  upsertBracket,
  getBracket,
  upsertRoundRows,
  upsertAllRounds,
  upsertOverall,
  getOverall,
  getAllResults
};