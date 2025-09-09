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
      throw new Error("insertSprintResult: payload must be an array");
    }
    if (payload.length === 0) {
      return { ok: true, upsertedCount: 0 };
    }

    // Kelompokkan per meta (eventId, initialId, raceId, divisionId)
    const groups = new Map(); // key -> { meta, teams[] }

    for (var i = 0; i < payload.length; i++) {
      var it = payload[i];
      if (!it || typeof it !== "object") continue;

      var meta = {
        eventId: String(it.eventId || ""),
        initialId: String(it.initialId || ""),
        raceId: String(it.raceId || ""),
        divisionId: String(it.divisionId || ""),
        eventName: String(it.eventName || ""),
        initialName: String(it.initialName || ""),
        raceName: String(it.raceName || ""),
        divisionName: String(it.divisionName || "")
      };

      var metaKey = [
        meta.eventId,
        meta.initialId,
        meta.raceId,
        meta.divisionId
      ].join("|");

      // Normalisasi 1 tim (masuk array "result")
      var clean = JSON.parse(JSON.stringify(it));
      if (clean && clean._id) delete clean._id;

      var teamEntry = {
        nameTeam: String(clean.nameTeam || ""),
        bibTeam: String(clean.bibTeam || ""),
        startOrder: String(clean.startOrder || ""),
        praStart: String(clean.praStart || ""),
        intervalRace: String(clean.intervalRace || ""),
        statusId: Number.isFinite(clean.statusId) ? Number(clean.statusId) : 0,
        result: {
          startTime: clean && clean.result && clean.result.startTime ? String(clean.result.startTime) : "",
          finishTime: clean && clean.result && clean.result.finishTime ? String(clean.result.finishTime) : "",
          raceTime: clean && clean.result && clean.result.raceTime ? String(clean.result.raceTime) : "",
          penaltyTime: clean && clean.result && clean.result.penaltyTime ? String(clean.result.penaltyTime) : "00:00:00.000",
          penalty: (clean && clean.result && typeof clean.result.penalty === "number") ? clean.result.penalty : 0,
          totalTime: (clean && clean.result && clean.result.totalTime)
            ? String(clean.result.totalTime)
            : (clean && clean.result && clean.result.raceTime) ? String(clean.result.raceTime) : "",
          ranked: (clean && clean.result && typeof clean.result.ranked === "number") ? clean.result.ranked : 0,
          score: (clean && clean.result && typeof clean.result.score === "number") ? clean.result.score : 0
        },
        otr: (clean && clean.otr) || {
          startTime: "",
          finishTime: "",
          raceTime: "",
          penaltyTime: "",
          penalty: "",
          totalTime: "",
          ranked: "",
          score: ""
        }
      };

      if (!groups.has(metaKey)) {
        groups.set(metaKey, { meta: meta, teams: [teamEntry] });
      } else {
        groups.get(metaKey).teams.push(teamEntry);
      }
    }

    var now = new Date();
    var upsertedCount = 0;

    // Proses tiap group: MERGE semua dokumen existing lalu upsert 1 dokumen final
    var values = Array.from(groups.values());
    for (var gi = 0; gi < values.length; gi++) {
      var g = values[gi];
      var meta = g.meta;
      var teams = g.teams;

      var filter = {
        eventId: meta.eventId,
        initialId: meta.initialId,
        raceId: meta.raceId,
        divisionId: meta.divisionId
      };

      // Ambil SEMUA dokumen existing yang match meta (jika ada duplikat)
      var existingDocs = await col.find(filter, { projection: { result: 1, _id: 0 } }).toArray();

      // Merge result dari semua dokumen existing + tim baru, dedup per bibTeam
      var mergedByBib = new Map();

      // from existing docs
      for (var edx = 0; edx < existingDocs.length; edx++) {
        var ex = existingDocs[edx];
        if (ex && Array.isArray(ex.result)) {
          for (var ei = 0; ei < ex.result.length; ei++) {
            var t = ex.result[ei];
            if (!t) continue;
            var ebib = String(t.bibTeam || "");
            if (!mergedByBib.has(ebib)) mergedByBib.set(ebib, t);
          }
        }
      }

      // overwrite with new teams
      for (var ti = 0; ti < teams.length; ti++) {
        var nt = teams[ti];
        var nbib = String(nt && nt.bibTeam ? nt.bibTeam : "");
        mergedByBib.set(nbib, nt);
      }

      // to array & sort by ranked (0/undefined => paling belakang)
      var mergedArray = Array.from(mergedByBib.values()).sort(function(a, b) {
        var ra = (a && a.result && typeof a.result.ranked === "number") ? a.result.ranked : 999999;
        var rb = (b && b.result && typeof b.result.ranked === "number") ? b.result.ranked : 999999;
        return ra - rb;
      });

      // Jika ada >1 dokumen existing, bersihkan dulu supaya tinggal 1
      if (existingDocs.length > 1) {
        await col.deleteMany(filter);
      }

      // Upsert dokumen final (satu dokumen per meta)
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
          result: mergedArray,
          updatedAt: now
        },
        $setOnInsert: { createdAt: now }
      };

      var res = await col.updateOne(filter, update, { upsert: true });
      if (res && res.upsertedCount) upsertedCount += res.upsertedCount;
    }

    return { ok: true, upsertedCount: upsertedCount };
  } catch (err) {
    console.error("Error insertSprintResult:", err);
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
    console.log("[DAO] connected to DB:", db.databaseName);
    const col = db.collection("temporarySlalomResult");
    console.log("[DAO] use collection:", col.collectionName);

    if (!Array.isArray(payload)) {
      throw new Error("insertSlalomResult: payload must be an array");
    }
    if (payload.length === 0) {
      return { ok: true, upsertedCount: 0 };
    }

    // --- helpers ---
    function hmsToMs(str) {
      var parts = String(str || "").split(":");
      var h = parts[0] || "0";
      var m = parts[1] || "0";
      var sMs = parts[2] || "0.000";
      var sParts = String(sMs).split(".");
      var s = sParts[0] || "0";
      var ms = sParts[1] || "0";
      return (+h || 0) * 3600000 + (+m || 0) * 60000 + (+s || 0) * 1000 + (+ms || 0);
    }

    function normRun(r) {
      r = r || {};
      return {
        startTime: r.startTime ? String(r.startTime) : "",
        finishTime: r.finishTime ? String(r.finishTime) : "",
        raceTime: r.raceTime ? String(r.raceTime) : "",
        penaltyTime: r.penaltyTime ? String(r.penaltyTime) : "00:00:00.000",
        penalty: Number.isFinite(r.penalty) ? r.penalty : Number(r.penalty) || 0,
        totalTime: r.totalTime ? String(r.totalTime) : (r.raceTime ? String(r.raceTime) : ""),
        ranked: Number.isFinite(r.ranked) ? r.ranked : Number(r.ranked) || 0,
        score: Number.isFinite(r.score) ? r.score : Number(r.score) || 0,
      };
    }

    function normTeam(clean) {
      clean = clean || {};
      var penaltiesSrc =
        clean &&
        clean.meta &&
        clean.meta.slalom &&
        Array.isArray(clean.meta.slalom.penalties)
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

      return {
        nameTeam: String(clean.nameTeam || ""),
        bibTeam: String(clean.bibTeam || ""),
        startOrder: String(clean.startOrder || ""),
        praStart: String(clean.praStart || ""),
        intervalRace: String(clean.intervalRace || ""),
        statusId: Number.isFinite(clean.statusId) ? Number(clean.statusId) : 0,

        // array of runs
        result: Array.isArray(clean.result) ? clean.result.map(normRun) : [],

        // best time string (opsional)
        bestTime: clean.bestTime ? String(clean.bestTime) : "",

        // meta slalom per team
        meta: {
          slalom: {
            penalties: mappedPenalties,
            gatesCount: gatesCount,
            penaltyValueToMs: penaltyValueToMs,
          },
        },

        // OTR fallback
        otr:
          clean.otr ||
          {
            startTime: "",
            finishTime: "",
            raceTime: "",
            penaltyTime: "",
            penalty: "",
            totalTime: "",
            ranked: "",
            score: "",
          },
      };
    }

    // --- group by meta ---
    var groups = new Map(); // key -> { meta, teams[] }

    for (var i = 0; i < payload.length; i++) {
      var raw = payload[i];
      if (!raw || typeof raw !== "object") continue;

      var meta = {
        eventId: String(raw.eventId || ""),
        initialId: String(raw.initialId || ""),
        raceId: String(raw.raceId || ""),
        divisionId: String(raw.divisionId || ""),
        eventName: String(raw.eventName || ""),
        initialName: String(raw.initialName || ""),
        raceName: String(raw.raceName || ""),
        divisionName: String(raw.divisionName || ""),
      };

      if (!meta.eventId || !meta.initialId || !meta.raceId || !meta.divisionId) {
        console.warn("[DAO] Skip item karena meta tidak lengkap:", meta);
        continue;
      }

      var metaKey = [meta.eventId, meta.initialId, meta.raceId, meta.divisionId].join("|");

      var clean = JSON.parse(JSON.stringify(raw));
      if (clean && clean._id) delete clean._id;

      var teamEntry = normTeam(clean);

      if (!groups.has(metaKey)) {
        groups.set(metaKey, { meta: meta, teams: [teamEntry] });
      } else {
        groups.get(metaKey).teams.push(teamEntry);
      }
    }

    if (groups.size === 0) {
      console.warn("[DAO] Tidak ada group valid (filter meta kosong).");
      return { ok: false, error: "Meta bucket kosong di payload" };
    }

    var now = new Date();
    var upsertedCount = 0;

    // --- process each group ---
    var iter = groups.values();
    var step = iter.next();
    while (!step.done) {
      var group = step.value;
      var meta2 = group.meta;
      var teams = group.teams;

      var filter = {
        eventId: meta2.eventId,
        initialId: meta2.initialId,
        raceId: meta2.raceId,
        divisionId: meta2.divisionId,
      };

      var existingDocs = await col
        .find(filter, { projection: { result: 1, _id: 0 } })
        .toArray();

      var mergedByBib = new Map();

      // existing first
      for (var ei = 0; ei < existingDocs.length; ei++) {
        var ex = existingDocs[ei];
        if (ex && Array.isArray(ex.result)) {
          for (var ti = 0; ti < ex.result.length; ti++) {
            var t = ex.result[ti];
            if (!t) continue;
            var ebib = String(t.bibTeam || "");
            if (!mergedByBib.has(ebib)) mergedByBib.set(ebib, t);
          }
        }
      }

      // overwrite with new teams
      for (var nti = 0; nti < teams.length; nti++) {
        var nt = teams[nti];
        var nbib = String(nt.bibTeam || "");
        mergedByBib.set(nbib, nt);
      }

      var mergedArray = Array.from(mergedByBib.values()).sort(function (a, b) {
        var am = a && a.bestTime ? hmsToMs(a.bestTime) : Number.POSITIVE_INFINITY;
        var bm = b && b.bestTime ? hmsToMs(b.bestTime) : Number.POSITIVE_INFINITY;
        return am - bm;
      });

      if (existingDocs.length > 1) {
        console.warn("[DAO] Found >1 doc untuk filter, cleanup dulu:", filter);
        await col.deleteMany(filter);
      }

      var update = {
        $set: {
          eventId: meta2.eventId,
          initialId: meta2.initialId,
          raceId: meta2.raceId,
          divisionId: meta2.divisionId,
          eventName: meta2.eventName,
          initialName: meta2.initialName,
          raceName: meta2.raceName,
          divisionName: meta2.divisionName,
          result: mergedArray, // array of team entries
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      };

      var res = await col.updateOne(filter, update, { upsert: true });
      console.log(
        "[DAO] updateOne result:",
        (res && res.matchedCount) || 0,
        (res && res.modifiedCount) || 0,
        (res && res.upsertedCount) || 0
      );
      if (res && res.upsertedCount) upsertedCount += res.upsertedCount;

      step = iter.next();
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
