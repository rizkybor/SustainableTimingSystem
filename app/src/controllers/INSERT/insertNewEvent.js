const { connectToDatabase } = require("../index");

// Insert new event
async function insertNewEvent(payload) {
  try {
    const database = await connectToDatabase();
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
    const db = await connectToDatabase();
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

// async function insertSprintResult(payload) {
//   try {
//     const db = await connectToDatabase();
//     const col = db.collection("temporarySprintResult");

//     if (!Array.isArray(payload)) {
//       throw new Error("insertSprintResult: payload must be an array");
//     }
//     if (payload.length === 0) {
//       return { ok: true, upsertedCount: 0 };
//     }

//     // Kelompokkan per meta key (antisipasi payload campur)
//     const groups = new Map(); // key -> { meta, teams[] }

//     for (let i = 0; i < payload.length; i++) {
//       const it = payload[i];
//       if (!it || typeof it !== "object") continue;

//       const meta = {
//         eventId: String(it.eventId || ""),
//         initialId: String(it.initialId || ""),
//         raceId: String(it.raceId || ""),
//         divisionId: String(it.divisionId || ""),
//         eventName: String(it.eventName || ""),
//         initialName: String(it.initialName || ""),
//         raceName: String(it.raceName || ""),
//         divisionName: String(it.divisionName || ""),
//       };
//       const metaKey =
//         meta.eventId + "|" + meta.initialId + "|" + meta.raceId + "|" + meta.divisionId;

//       // deep-clone untuk buang Proxy/fungsi
//       const clean = JSON.parse(JSON.stringify(it));
//       if (clean && clean._id) delete clean._id;

//       // Normalisasi satu tim
//       const r = clean && clean.result ? clean.result : {};
//       const teamEntry = {
//         nameTeam: String(clean.nameTeam || ""),
//         bibTeam: String(clean.bibTeam || ""),
//         startOrder: String(clean.startOrder || ""),
//         praStart: String(clean.praStart || ""),
//         intervalRace: String(clean.intervalRace || ""),
//         statusId: Number.isFinite(clean.statusId) ? Number(clean.statusId) : 0,
//         result: {
//           startTime: String(r && r.startTime ? r.startTime : ""),
//           finishTime: String(r && r.finishTime ? r.finishTime : ""),
//           raceTime: String(r && r.raceTime ? r.raceTime : ""),
//           penaltyTime: String(r && r.penaltyTime ? r.penaltyTime : "00:00:00.000"),
//           penalty: typeof (r && r.penalty) === "number" ? r.penalty : 0,
//           totalTime: String(
//             r && r.totalTime
//               ? r.totalTime
//               : r && r.raceTime
//               ? r.raceTime
//               : ""
//           ),
//           ranked: typeof (r && r.ranked) === "number" ? r.ranked : 0,
//           score: typeof (r && r.score) === "number" ? r.score : 0,
//         },
//         otr:
//           clean && clean.otr
//             ? clean.otr
//             : {
//                 startTime: "",
//                 finishTime: "",
//                 raceTime: "",
//                 penaltyTime: "",
//                 penalty: "",
//                 totalTime: "",
//                 ranked: "",
//                 score: "",
//               },
//       };

//       if (!groups.has(metaKey)) {
//         groups.set(metaKey, { meta: meta, teams: [teamEntry] });
//       } else {
//         groups.get(metaKey).teams.push(teamEntry);
//       }
//     }

//     // Helper rank
//     function rankOf(x) {
//       if (!x || !x.result) return 999999;
//       const rk = x.result.ranked;
//       return typeof rk === "number" && rk > 0 ? rk : 999999;
//     }

//     const now = new Date();
//     let upsertedCount = 0;

//     // Proses tiap group
//     const itGroups = groups.values();
//     let cursor = itGroups.next();
//     while (!cursor.done) {
//       const group = cursor.value;
//       const meta = group.meta;
//       const teams = group.teams;

//       const filter = {
//         eventId: meta.eventId,
//         initialId: meta.initialId,
//         raceId: meta.raceId,
//         divisionId: meta.divisionId,
//       };

//       // Ambil existing agar bisa merge per bibTeam
//       const existing = await col.findOne(filter, { projection: { result: 1 } });
//       const mergedByBib = new Map();

//       // Muat existing.result lebih dulu
//       if (existing && Array.isArray(existing.result)) {
//         for (let i = 0; i < existing.result.length; i++) {
//           const t = existing.result[i];
//           if (!t) continue;
//           mergedByBib.set(String(t.bibTeam || ""), t);
//         }
//       }

//       // Overwrite dengan data baru berdasarkan bibTeam
//       for (let i = 0; i < teams.length; i++) {
//         const t = teams[i];
//         mergedByBib.set(String(t.bibTeam || ""), t);
//       }

//       // Ke array + sort by ranked (0/kosong di belakang)
//       const mergedArray = Array.from(mergedByBib.values()).sort(function (a, b) {
//         const ra = rankOf(a);
//         const rb = rankOf(b);
//         return ra - rb;
//       });

//       const update = {
//         $set: Object.assign({}, meta, {
//           result: mergedArray,
//           updatedAt: now,
//         }),
//         $setOnInsert: { createdAt: now },
//       };

//       const res = await col.updateOne(filter, update, { upsert: true });
//       if (res && res.upsertedCount) upsertedCount += res.upsertedCount;

//       cursor = itGroups.next();
//     }

//     return { ok: true, upsertedCount: upsertedCount };
//   } catch (err) {
//     console.error("Error insertSprintResult:", err);
//     return { ok: false, error: err.message };
//   }
// }

async function insertDrrResult(payload) {
  try {
    const db = await connectToDatabase();
    if (!db || typeof db.collection !== "function") {
      throw new Error("connectToDatabase() did not return a Db instance");
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
  insertDrrResult,
};
