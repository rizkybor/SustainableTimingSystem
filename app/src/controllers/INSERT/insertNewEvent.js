const { getDb } = require("../index");

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

async function insertSprintResult(payload) {
  try {
    const db = await getDb();
    const col = db.collection("temporarySprintResult");

    if (!Array.isArray(payload)) {
      return {
        ok: false,
        error: "insertSprintResult: payload must be an array",
      };
    }
    if (payload.length === 0) {
      return { ok: true, upsertedCount: 0 };
    }

    // ------- helpers -------
    const toInt = (v, d = 0) => (Number.isFinite(v) ? Number(v) : d);
    const toStr = (v, d = "") => String(v == null ? d : v);

    function normalizeResultObj(r = {}) {
      // dukung format lama (array) -> ambil elemen pertama
      if (Array.isArray(r)) r = r[0] || {};

      // field default sesuai schema baru
      const out = {
        startTime: toStr(r.startTime, ""),
        finishTime: toStr(r.finishTime, ""),
        raceTime: toStr(r.raceTime, ""),

        // penalti aktif (start & finish)
        startPenalty: toInt(r.startPenalty, 0),
        finishPenalty: toInt(r.finishPenalty, 0),

        // legacy middle penalty selalu 0
        penalty: 0,

        // turunan & waktu penalti
        totalPenalty: Number.isFinite(r.totalPenalty)
          ? Number(r.totalPenalty)
          : toInt(r.startPenalty, 0) + toInt(r.finishPenalty, 0),

        startPenaltyTime: toStr(r.startPenaltyTime, "00:00:00.000"),
        finishPenaltyTime: toStr(r.finishPenaltyTime, "00:00:00.000"),
        totalPenaltyTime: toStr(
          r.totalPenaltyTime != null ? r.totalPenaltyTime : r.penaltyTime,
          "00:00:00.000"
        ),

        // sinkron legacy
        penaltyTime: toStr(
          r.penaltyTime != null ? r.penaltyTime : r.totalPenaltyTime,
          "00:00:00.000"
        ),

        totalTime: toStr(r.totalTime != null ? r.totalTime : r.raceTime, ""),
        ranked: Number.isFinite(r.ranked) ? Number(r.ranked) : 0,
        score: Number.isFinite(r.score) ? Number(r.score) : 0,
      };

      // jika totalPenaltyTime kosong tapi ada start/finishPenaltyTime → jumlahkan string tak mudah;
      // biarkan FE yang sudah menghitung (sesuai kode Anda). Backend cukup menerima.

      return out;
    }

    function normalizeOtrObj(otr = {}) {
      // untuk konsistensi, samakan struktur dengan result (meski jarang dipakai di Sprint)
      const base = {
        startTime: "",
        finishTime: "",
        raceTime: "",
        startPenalty: 0,
        finishPenalty: 0,
        penalty: 0,
        totalPenalty: 0,
        startPenaltyTime: "00:00:00.000",
        finishPenaltyTime: "00:00:00.000",
        totalPenaltyTime: "00:00:00.000",
        penaltyTime: "00:00:00.000",
        totalTime: "",
        ranked: 0,
        score: 0,
      };
      return { ...base, ...normalizeResultObj(otr) };
    }

    function normalizeTeamDoc(it = {}) {
      const clean = JSON.parse(JSON.stringify(it || {}));
      if (clean && clean._id) delete clean._id;

      return {
        nameTeam: toStr(clean.nameTeam, ""),
        bibTeam: toStr(clean.bibTeam, ""),
        startOrder: toStr(clean.startOrder, ""),
        praStart: toStr(clean.praStart, ""),
        intervalRace: toStr(clean.intervalRace, ""),
        statusId: toInt(clean.statusId, 0),

        result: normalizeResultObj(clean.result),
        otr: normalizeOtrObj(clean.otr),
      };
    }

    // ------- kelompokkan per meta -------
    const groups = new Map(); // key -> { meta, teams[] }

    for (let i = 0; i < payload.length; i++) {
      const it = payload[i];
      if (!it || typeof it !== "object") continue;

      const meta = {
        eventId: toStr(it.eventId, ""),
        initialId: toStr(it.initialId, ""),
        raceId: toStr(it.raceId, ""),
        divisionId: toStr(it.divisionId, ""),
        eventName: toStr(it.eventName, ""),
        initialName: toStr(it.initialName, ""),
        raceName: toStr(it.raceName, ""),
        divisionName: toStr(it.divisionName, ""),
      };

      const metaKey = [
        meta.eventId,
        meta.initialId,
        meta.raceId,
        meta.divisionId,
      ].join("|");
      const teamEntry = normalizeTeamDoc(it);

      if (!groups.has(metaKey)) {
        groups.set(metaKey, { meta, teams: [teamEntry] });
      } else {
        groups.get(metaKey).teams.push(teamEntry);
      }
    }

    const now = new Date();
    let upsertedCount = 0;

    // ------- proses tiap group & upsert satu dokumen per meta -------
    for (const { meta, teams } of groups.values()) {
      const filter = {
        eventId: meta.eventId,
        initialId: meta.initialId,
        raceId: meta.raceId,
        divisionId: meta.divisionId,
      };

      // Ambil semua existing untuk meta ini (jika ada duplikat historis)
      const existingDocs = await col
        .find(filter, { projection: { result: 1, _id: 0 } })
        .toArray();

      // Merge per BIB
      const mergedByBib = new Map();

      // from existing docs (normalisasi agar kompatibel)
      for (const ex of existingDocs) {
        const arr = Array.isArray(ex && ex.result) ? ex.result : [];
        for (const t of arr) {
          if (!t) continue;
          const ebib = toStr(t.bibTeam, "");
          if (!mergedByBib.has(ebib)) {
            mergedByBib.set(ebib, normalizeTeamDoc(t));
          }
        }
      }

      // overwrite dengan input baru
      for (const nt of teams) {
        const nbib = toStr(nt && nt.bibTeam, "");
        mergedByBib.set(nbib, normalizeTeamDoc(nt));
      }

      // ke array & urut by ranked (0 → paling belakang)
      const mergedArray = Array.from(mergedByBib.values()).sort((a, b) => {
        const ra =
          a && a.result && Number.isFinite(a.result.ranked)
            ? a.result.ranked
            : 999999;
        const rb =
          b && b.result && Number.isFinite(b.result.ranked)
            ? b.result.ranked
            : 999999;
        return ra - rb;
      });

      // jika ada >1 dokumen existing, bersihkan dulu supaya tinggal satu
      if (existingDocs.length > 1) {
        await col.deleteMany(filter);
      }

      const update = {
        $set: {
          eventId: meta.eventId,
          initialId: meta.initialId,
          raceId: meta.raceId,
          divisionId: meta.divisionId,
          eventName: meta.eventName,
          initialName: meta.initialName,
          raceName: meta.raceName,
          divisionName: meta.divisionName,
          result: mergedArray,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      };

      const res = await col.updateOne(filter, update, { upsert: true });
      if (res && res.upsertedCount) upsertedCount += res.upsertedCount;
    }

    return { ok: true, upsertedCount };
  } catch (err) {
    // tanpa console.* agar lolos ESLint
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

async function insertSlalomResult(payload) {
  try {
    console.log("[DAO] insertSlalomResult called", {
      isArray: Array.isArray(payload),
      length: (payload && payload.length) || 0,
    });

    const db = await getDb();
    const col = db.collection("temporarySlalomResult");

    // Unique index per bucket
    try {
      await col.createIndex(
        { eventId: 1, initialId: 1, raceId: 1, divisionId: 1 },
        { unique: true, name: "uniq_bucket" }
      );
    } catch (e) {
      if (e && e.codeName !== "IndexOptionsConflict") {
        console.warn("[DAO] createIndex warning:", e.message || String(e));
      }
    }

    if (!Array.isArray(payload)) {
      return { ok: false, error: "insertSlalomResult: payload must be an array" };
    }
    if (payload.length === 0) {
      return { ok: true, upsertedCount: 0 };
    }

    // ===== helpers =====
    function hmsToMs(str) {
      var parts = String(str || "").split(":");
      var h = +parts[0] || 0;
      var m = +parts[1] || 0;
      var sMs = parts[2] || "0.000";
      var sParts = String(sMs).split(".");
      var s = +sParts[0] || 0;
      var ms = +sParts[1] || 0;
      return h * 3600000 + m * 60000 + s * 1000 + ms;
    }
    function msToHMSms(ms) {
      if (!Number.isFinite(ms)) return "";
      var hr = Math.floor(ms / 3600000);
      var rem1 = ms % 3600000;
      var min = Math.floor(rem1 / 60000);
      var rem2 = rem1 % 60000;
      var sec = Math.floor(rem2 / 1000);
      var mss = rem2 % 1000;
      var pad = function (n, w) { return String(n).padStart(w, "0"); };
      return pad(hr, 2) + ":" + pad(min, 2) + ":" + pad(sec, 2) + "." + pad(mss, 3);
    }
    var SCORE_TABLE = [
      350, 322, 301, 287, 277, 266, 256, 245, 235, 224,
      214, 203, 193, 182, 172, 161, 151, 140, 133, 126,
      119, 112, 105,  98,  91,  84,  77,  70,  63,  56,
       49,  42
    ];
    function scoreForRank(rank) { return SCORE_TABLE[rank - 1] || 0; }
    function toStr(v, d) { return String(v == null ? (d || "") : v); }
    function toInt(v, d) { return Number.isFinite(v) ? Number(v) : (Number(v) || (d || 0)); }

    function normRun(r) {
      r = r || {};
      return {
        startTime: r.startTime ? String(r.startTime) : "",
        finishTime: r.finishTime ? String(r.finishTime) : "",
        raceTime: r.raceTime ? String(r.raceTime) : "",
        penaltyTime: r.penaltyTime ? String(r.penaltyTime) : "00:00:00.000",
        penalty: Number.isFinite(r.penalty) ? r.penalty : (Number(r.penalty) || 0),
        totalTime: r.totalTime ? String(r.totalTime) : (r.raceTime ? String(r.raceTime) : ""),
        ranked: Number.isFinite(r.ranked) ? r.ranked : (Number(r.ranked) || 0),
        score: Number.isFinite(r.score) ? r.score : (Number(r.score) || 0),
      };
    }

    function normTeam(raw) {
      var clean = JSON.parse(JSON.stringify(raw || {}));
      if (clean && clean._id) delete clean._id;

      var resultArr = Array.isArray(clean.result) ? clean.result.map(normRun) : [];

      // bestTime fallback dari result.totalTime
      var bestTime = clean.bestTime ? String(clean.bestTime) : "";
      if (!bestTime && resultArr.length) {
        var vals = resultArr
          .map(function (x) { return x && x.totalTime ? hmsToMs(x.totalTime) : Infinity; })
          .filter(function (ms) { return Number.isFinite(ms); });
        if (vals.length) bestTime = msToHMSms(Math.min.apply(Math, vals));
      }

      // meta slalom (opsional)
      var penaltiesSrc =
        clean && clean.meta && clean.meta.slalom && Array.isArray(clean.meta.slalom.penalties)
          ? clean.meta.slalom.penalties
          : [];
      var mappedPenalties = penaltiesSrc.map(function (arr) {
        if (!Array.isArray(arr)) return [];
        return arr.map(function (v) { return Number(v) || 0; });
      });
      var gatesCount =
        clean && clean.meta && clean.meta.slalom && Number.isFinite(clean.meta.slalom.gatesCount)
          ? Number(clean.meta.slalom.gatesCount)
          : undefined;
      var penaltyValueToMs =
        clean && clean.meta && clean.meta.slalom && typeof clean.meta.slalom.penaltyValueToMs === "object"
          ? clean.meta.slalom.penaltyValueToMs
          : undefined;

      var metaObj = {};
      if (penaltiesSrc.length || gatesCount !== undefined || penaltyValueToMs !== undefined) {
        metaObj.slalom = {
          penalties: mappedPenalties,
          gatesCount: gatesCount,
          penaltyValueToMs: penaltyValueToMs,
        };
      }

      return {
        nameTeam: toStr(clean.nameTeam, ""),
        bibTeam: toStr(clean.bibTeam, ""),
        startOrder: toStr(clean.startOrder, ""),
        praStart: toStr(clean.praStart, ""),
        intervalRace: toStr(clean.intervalRace, ""),
        statusId: toInt(clean.statusId, 0),

        // array of runs
        result: resultArr,

        // best time & rank/score di level tim
        bestTime: bestTime || "",
        ranked: Number.isFinite(clean.ranked) ? Number(clean.ranked) : 0,
        score: Number.isFinite(clean.score) ? Number(clean.score) : 0,

        meta: metaObj,

        // OTR fallback
        otr: clean.otr || {
          startTime: "", finishTime: "", raceTime: "",
          penaltyTime: "", penalty: "", totalTime: "",
          ranked: "", score: ""
        },
      };
    }

    // ===== group payload by bucket =====
    var groups = new Map(); // key -> { meta, teams[] }
    for (var i = 0; i < payload.length; i++) {
      var it = payload[i];
      if (!it || typeof it !== "object") continue;

      var meta = {
        eventId: toStr(it.eventId, ""),
        initialId: toStr(it.initialId, ""),
        raceId: toStr(it.raceId, ""),
        divisionId: toStr(it.divisionId, ""),
        eventName: toStr(it.eventName, ""),
        initialName: toStr(it.initialName, ""),
        raceName: toStr(it.raceName, ""),
        divisionName: toStr(it.divisionName, ""),
      };

      if (!meta.eventId || !meta.initialId || !meta.raceId || !meta.divisionId) {
        console.warn("[DAO] Skip item karena meta tidak lengkap:", meta);
        continue;
      }

      var key = [meta.eventId, meta.initialId, meta.raceId, meta.divisionId].join("|");
      var teamEntry = normTeam(it);

      if (!groups.has(key)) groups.set(key, { meta: meta, teams: [teamEntry] });
      else groups.get(key).teams.push(teamEntry);
    }

    if (groups.size === 0) {
      return { ok: false, error: "Meta bucket kosong di payload: pastikan eventId, initialId, raceId, divisionId terisi" };
    }

    var now = new Date();
    var upsertedCount = 0;

    // ===== process per bucket =====
    for (const { meta, teams } of groups.values()) {
      var filter = {
        eventId: meta.eventId,
        initialId: meta.initialId,
        raceId: meta.raceId,
        divisionId: meta.divisionId,
      };

      // Ambil doc existing
      var existingDocs = await col.find(filter).toArray();

      // Cleanup jika ada lebih dari 1
      if (existingDocs.length > 1) {
        console.warn("[DAO] Found >1 doc untuk filter, cleanup dulu:", filter);
        await col.deleteMany(filter);
        existingDocs = [];
      }

      // Merge by (bibTeam|nameTeam)
      var mergedByKey = new Map();

      if (existingDocs.length === 1) {
        var ex = existingDocs[0];
        var exTeams = ex && Array.isArray(ex.teams) ? ex.teams : []; // <== teams di level doc
        for (var t of exTeams) {
          if (!t) continue;
          var k = (toStr(t.bibTeam, "").trim() || "NO-BIB") + "|" + toStr(t.nameTeam, "").trim();
          if (!mergedByKey.has(k)) mergedByKey.set(k, t);
        }
      }

      for (var nt of teams) {
        var nbib = toStr(nt.bibTeam, "").trim();
        var nname = toStr(nt.nameTeam, "").trim();
        var key2 = (nbib || "NO-BIB") + "|" + nname;
        mergedByKey.set(key2, nt);
      }

      var mergedArray = Array.from(mergedByKey.values());

      // Hitung bestTime bila kosong
      mergedArray.forEach(function (tm) {
        if (!tm.bestTime) {
          var vals = (Array.isArray(tm.result) ? tm.result : [])
            .map(function (x) { return x && x.totalTime ? hmsToMs(x.totalTime) : Infinity; })
            .filter(function (ms) { return Number.isFinite(ms); });
          if (vals.length) tm.bestTime = msToHMSms(Math.min.apply(Math, vals));
        }
      });

      // Sort berdasarkan bestTime ascending
      mergedArray.sort(function (a, b) {
        var am = a && a.bestTime ? hmsToMs(a.bestTime) : Number.POSITIVE_INFINITY;
        var bm = b && b.bestTime ? hmsToMs(b.bestTime) : Number.POSITIVE_INFINITY;
        return am - bm;
      });

      // Assign ranked & score (level tim)
      var rankCounter = 1;
      for (var t of mergedArray) {
        var best = t && t.bestTime ? hmsToMs(t.bestTime) : Infinity;
        if (!Number.isFinite(best)) {
          t.ranked = 0;
          t.score = 0;
        } else {
          t.ranked = rankCounter;
          t.score = scoreForRank(rankCounter);
          rankCounter += 1;
        }
      }

      var update = {
        $set: {
          eventId: meta.eventId,
          initialId: meta.initialId,
          raceId: meta.raceId,
          divisionId: meta.divisionId,
          eventName: meta.eventName,
          initialName: meta.initialName,
          raceName: meta.raceName,
          divisionName: meta.divisionName,
          teams: mergedArray,     // <== simpan di TEAMS
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      };

      var res = await col.updateOne(filter, update, { upsert: true });
      if (res && res.upsertedCount) upsertedCount += res.upsertedCount;
      console.log("[DAO] upsert bucket:", filter, "-> matched:", res.matchedCount, "modified:", res.modifiedCount, "upserted:", res.upsertedCount || 0);
    }

    return { ok: true, upsertedCount: upsertedCount };
  } catch (err) {
    console.error("Error insertSlalomResult:", err && err.stack ? err.stack : err);
    return { ok: false, error: (err && err.message) ? err.message : String(err) };
  }
}

async function insertDrrResult(payload) {
  try {
    const db = await getDb();
    if (!db || typeof db.collection !== "function") {
      throw new Error("getDb() did not return a Db instance");
    }

    const collection = db.collection("temporaryDrrResult");

    if (!Array.isArray(payload)) {
      throw new Error("insertDrrResult: payload must be an array");
    }
    if (payload.length === 0) {
      return { ok: true, insertedCount: 0, insertedIds: [] };
    }

    const now = new Date();
    const docs = payload.map((it, idx) => {
      // pastikan plain object
      if (!it || typeof it !== "object" || Array.isArray(it)) {
        throw new Error(`Document at index ${idx} is not a plain object`);
      }
      // deep clone untuk hilangkan Proxy/fungsi
      const clean = JSON.parse(JSON.stringify(it));
      if (!clean || typeof clean !== "object" || Array.isArray(clean)) {
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
    console.error("Error inserting sprint result:", error);
    return { ok: false, error: error.message };
  }
}

module.exports = {
  insertNewEvent,
  insertSprintResult,
  insertSlalomResult,
  insertDrrResult,
};
