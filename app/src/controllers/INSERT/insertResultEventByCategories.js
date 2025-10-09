const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

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
        judgesBy: toStr(r.judgesBy, ""),
        judgesTime: toStr(r.judgesTime, ""),
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
        judgesBy: toStr(r.judgesBy, ""),
        judgesTime: toStr(r.judgesTime, ""),
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

// async function insertSlalomResult(payload) {
//   try {
//     const db = await getDb();
//     const col = db.collection("temporarySlalomResult");

//     // === Ambil SCORE_TABLE dari optionRanked (SLALOM) ===
//     var SCORE_TABLE = [];
//     try {
//       const optCol = db.collection("optionRanked");
//       const slalomDoc = await optCol.findOne({ type: "SLALOM" });
//       if (slalomDoc && typeof slalomDoc === "object") {
//         const dataObj = slalomDoc.data;
//         if (dataObj && Array.isArray(dataObj.score)) {
//           var arr = [];
//           var si = 0;
//           for (si = 0; si < dataObj.score.length; si++) {
//             var v = Number(dataObj.score[si]);
//             if (Number.isFinite(v)) arr.push(v);
//           }
//           SCORE_TABLE = arr;
//         }
//       }
//     } catch (eFetch) {
//       var msg = eFetch && eFetch.message ? eFetch.message : String(eFetch);
//       console.error("[DAO] optionRanked fetch failed (SLALOM):", msg);
//     }

//     // Fallback jika kosong
//     if (!Array.isArray(SCORE_TABLE) || SCORE_TABLE.length === 0) {
//       console.warn("[DAO] SCORE_TABLE empty; using default fallback.");
//       SCORE_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
//     }

//     // === Unique index per bucket ===
//     if (!insertSlalomResult.__indexCreated) {
//       try {
//         await col.createIndex(
//           { eventId: 1, initialId: 1, raceId: 1, divisionId: 1 },
//           { unique: true, name: "uniq_bucket" }
//         );
//       } catch (eIdx) {
//         var codeName = eIdx && eIdx.codeName ? eIdx.codeName : "";
//         var message = eIdx && eIdx.message ? eIdx.message : String(eIdx);
//         if (!eIdx || codeName !== "IndexOptionsConflict") {
//           console.warn("[DAO] createIndex warning:", message);
//         }
//       }
//       insertSlalomResult.__indexCreated = true;
//     }

//     // === Validasi payload ===
//     if (!Array.isArray(payload)) {
//       return { ok: false, error: "insertSlalomResult: payload must be an array" };
//     }
//     if (payload.length === 0) {
//       return { ok: true, upsertedCount: 0 };
//     }

//     // === Helpers ===
//     function scoreForRank(rank) {
//       if (!Array.isArray(SCORE_TABLE) || SCORE_TABLE.length === 0) return 0;
//       var idx = rank - 1;
//       if (idx < 0) return 0;
//       var v = SCORE_TABLE[idx];
//       return Number(v) || 0;
//     }
//     function toStr(v, d) {
//       if (v === null || v === undefined) return String(d || "");
//       return String(v);
//     }
//     function toInt(v, d) {
//       if (Number.isFinite(v)) return Number(v);
//       var n = Number(v);
//       if (Number.isFinite(n)) return n;
//       return d || 0;
//     }
//     function hmsToMs(str) {
//       var txt = String(str || "");
//       var parts = txt.split(":");
//       var h = parts.length > 0 ? Number(parts[0]) || 0 : 0;
//       var m = parts.length > 1 ? Number(parts[1]) || 0 : 0;
//       var sMs = parts.length > 2 ? parts[2] : "0.000";
//       var sSplit = String(sMs).split(".");
//       var s = sSplit.length > 0 ? Number(sSplit[0]) || 0 : 0;
//       var ms = sSplit.length > 1 ? Number(sSplit[1]) || 0 : 0;
//       return h * 3600000 + m * 60000 + s * 1000 + ms;
//     }
//     function msToHMSms(ms) {
//       if (!Number.isFinite(ms)) return "";
//       var hr = Math.floor(ms / 3600000);
//       var rem1 = ms % 3600000;
//       var min = Math.floor(rem1 / 60000);
//       var rem2 = rem1 % 60000;
//       var sec = Math.floor(rem2 / 1000);
//       var mss = rem2 % 1000;
//       function pad(n, w) { return String(n).padStart(w, "0"); }
//       return pad(hr, 2) + ":" + pad(min, 2) + ":" + pad(sec, 2) + "." + pad(mss, 3);
//     }
//     function pruneEmpty(obj) {
//       if (!obj || typeof obj !== "object") return obj;
//       var keys = Object.keys(obj);
//       var i = 0;
//       for (i = 0; i < keys.length; i++) {
//         var k = keys[i];
//         var v = obj[k];
//         if (v === "" || v === null) delete obj[k];
//       }
//       return obj;
//     }

//     // === Normalisasi Run (tanpa "score" di run) ===
//     function normRun(r) {
//       var run = r || {};

//       var ptRaw = (run.penaltyTotal && typeof run.penaltyTotal === "object")
//         ? run.penaltyTotal
//         : {};
//       var gatesRaw = Array.isArray(ptRaw.gates) ? ptRaw.gates : [];
//       var gates = [];
//       var gi = 0;
//       for (gi = 0; gi < gatesRaw.length; gi++) {
//         gates.push(Number(gatesRaw[gi]) || 0);
//       }
//       var pt = {
//         start: Number(ptRaw.start) || 0,
//         gates: gates,
//         finish: Number(ptRaw.finish) || 0
//       };

//       var penaltySum = pt.start + pt.finish;
//       var pi = 0;
//       for (pi = 0; pi < pt.gates.length; pi++) {
//         penaltySum += pt.gates[pi];
//       }
//       var penaltyNum = Number.isFinite(run.penalty) ? Number(run.penalty) : penaltySum;

//       return {
//         session: String(run.session || ""),
//         startTime: String(run.startTime || ""),
//         finishTime: String(run.finishTime || ""),
//         raceTime: String(run.raceTime || ""),
//         penaltyTime: String(run.penaltyTime || "00:00:00.000"),
//         penaltyTotal: pt,
//         penalty: penaltyNum,
//         totalTime: String(run.totalTime || run.raceTime || ""),
//         ranked: Number.isFinite(run.ranked) ? Number(run.ranked) : Number(run.ranked) || 0,
//         judgesBy: String(run.judgesBy || ""),
//         judgesTime: String(run.judgesTime || "")
//       };
//     }

//     function normTeamFromFlat(clean) {
//       var arr = Array.isArray(clean.result) ? clean.result : [];
//       var resultArr = [];
//       var i = 0;
//       for (i = 0; i < arr.length; i++) resultArr.push(normRun(arr[i]));

//       var bestTime = "";
//       if (typeof clean.bestTime === "string" && clean.bestTime.trim() !== "") {
//         bestTime = clean.bestTime;
//       }

//       return pruneEmpty({
//         nameTeam: toStr(clean.nameTeam, ""),
//         bibTeam: toStr(clean.bibTeam, ""),
//         startOrder: toStr(clean.startOrder, ""),
//         praStart: toStr(clean.praStart, ""),
//         intervalRace: toStr(clean.intervalRace, ""),
//         statusId: toInt(clean.statusId, 0),
//         result: resultArr,
//         bestTime: bestTime,
//         ranked: Number.isFinite(clean.ranked) ? Number(clean.ranked) : 0,
//         score: Number.isFinite(clean.score) ? Number(clean.score) : 0,
//         meta: pruneEmpty(clean.meta || {}),
//         otr: pruneEmpty(clean.otr || {})
//       });
//     }

//     function normTeamFromBucketTeam(t) {
//       var clean = t || {};
//       var arr = Array.isArray(clean.result) ? clean.result : [];
//       var resultArr = [];
//       var i = 0;
//       for (i = 0; i < arr.length; i++) resultArr.push(normRun(arr[i]));

//       var bestTime = "";
//       if (typeof clean.bestTime === "string" && clean.bestTime.trim() !== "") {
//         bestTime = clean.bestTime;
//       }

//       return pruneEmpty({
//         nameTeam: toStr(clean.nameTeam, ""),
//         bibTeam: toStr(clean.bibTeam || clean.bibNumber, ""),
//         startOrder: toStr(clean.startOrder, ""),
//         praStart: toStr(clean.praStart, ""),
//         intervalRace: toStr(clean.intervalRace, ""),
//         statusId: toInt(clean.statusId, 0),
//         result: resultArr,
//         bestTime: bestTime,
//         ranked: Number.isFinite(clean.ranked) ? Number(clean.ranked) : 0,
//         score: Number.isFinite(clean.score) ? Number(clean.score) : 0,
//         meta: pruneEmpty(clean.meta || {}),
//         otr: pruneEmpty(clean.otr || {})
//       });
//     }

//     // === Group payload per bucket ===
//     var groups = new Map();
//     var pIdx = 0;
//     for (pIdx = 0; pIdx < payload.length; pIdx++) {
//       var item = payload[pIdx];
//       if (!item || typeof item !== "object") continue;

//       if (Array.isArray(item.teams)) {
//         var metaB = {
//           eventId: toStr(item.eventId, ""),
//           initialId: toStr(item.initialId, ""),
//           raceId: toStr(item.raceId, ""),
//           divisionId: toStr(item.divisionId, ""),
//           eventName: toStr(item.eventName, ""),
//           initialName: toStr(item.initialName, ""),
//           raceName: toStr(item.raceName, ""),
//           divisionName: toStr(item.divisionName, "")
//         };
//         if (!metaB.eventId || !metaB.initialId || !metaB.raceId || !metaB.divisionId) {
//           console.warn("[DAO] Skip bucket, meta tidak lengkap:", metaB);
//           continue;
//         }
//         var keyB = metaB.eventId + "|" + metaB.initialId + "|" + metaB.raceId + "|" + metaB.divisionId;

//         var teamsArrB = [];
//         var tb = 0;
//         for (tb = 0; tb < item.teams.length; tb++) {
//           teamsArrB.push(normTeamFromBucketTeam(item.teams[tb]));
//         }

//         if (!groups.has(keyB)) {
//           groups.set(keyB, { meta: metaB, teams: teamsArrB });
//         } else {
//           var exB = groups.get(keyB);
//           var ca = exB.teams;
//           var kx = 0;
//           for (kx = 0; kx < teamsArrB.length; kx++) ca.push(teamsArrB[kx]);
//           exB.teams = ca;
//         }
//       } else {
//         var metaF = {
//           eventId: toStr(item.eventId, ""),
//           initialId: toStr(item.initialId, ""),
//           raceId: toStr(item.raceId, ""),
//           divisionId: toStr(item.divisionId, ""),
//           eventName: toStr(item.eventName, ""),
//           initialName: toStr(item.initialName, ""),
//           raceName: toStr(item.raceName, ""),
//           divisionName: toStr(item.divisionName, "")
//         };
//         if (!metaF.eventId || !metaF.initialId || !metaF.raceId || !metaF.divisionId) {
//           console.warn("[DAO] Skip flat item, meta tidak lengkap:", metaF);
//           continue;
//         }
//         var keyF = metaF.eventId + "|" + metaF.initialId + "|" + metaF.raceId + "|" + metaF.divisionId;

//         var cleanJson = JSON.stringify(item);
//         var cleanAny = JSON.parse(cleanJson);
//         if (cleanAny && cleanAny._id) delete cleanAny._id;

//         var teamEntry = normTeamFromFlat(cleanAny);

//         if (!groups.has(keyF)) {
//           groups.set(keyF, { meta: metaF, teams: [teamEntry] });
//         } else {
//           groups.get(keyF).teams.push(teamEntry);
//         }
//       }
//     }

//     if (groups.size === 0) {
//       return { ok: false, error: "Meta bucket kosong di payload" };
//     }

//     // === Ambil existing per semua bucket ===
//     var filterOr = [];
//     var vals = Array.from(groups.values());
//     var vi = 0;
//     for (vi = 0; vi < vals.length; vi++) {
//       var m = vals[vi].meta;
//       filterOr.push({
//         eventId: m.eventId,
//         initialId: m.initialId,
//         raceId: m.raceId,
//         divisionId: m.divisionId
//       });
//     }
//     var existingDocs = await col.find({ $or: filterOr }).toArray();
//     var existingMap = new Map();
//     var ei = 0;
//     for (ei = 0; ei < existingDocs.length; ei++) {
//       var exDoc = existingDocs[ei];
//       var ek = exDoc.eventId + "|" + exDoc.initialId + "|" + exDoc.raceId + "|" + exDoc.divisionId;
//       existingMap.set(ek, exDoc);
//     }

//     // === Proses per bucket ===
//     var now = new Date();
//     var upsertedCount = 0;

//     var ge = groups.entries();
//     var step = ge.next();
//     while (!step.done) {
//       var bucketKey = step.value[0];
//       var entryObj = step.value[1];

//       var meta = entryObj.meta;
//       var incomingTeams = entryObj.teams;

//       var filter = {
//         eventId: meta.eventId,
//         initialId: meta.initialId,
//         raceId: meta.raceId,
//         divisionId: meta.divisionId
//       };

//       var existing = existingMap.get(bucketKey);
//       if (existing) {
//         var dup = await col.countDocuments(filter);
//         if (dup > 1) {
//           console.warn("[DAO] Found >1 doc, cleanup:", filter);
//           await col.deleteMany(filter);
//           existing = null;
//         }
//       }

//       // Merge by (bibTeam|nameTeam) DENGAN MERGE PER-RUN
//       var mergedByKey = new Map();

//       // Seed dari existing
//       if (existing && Array.isArray(existing.teams)) {
//         var st = 0;
//         for (st = 0; st < existing.teams.length; st++) {
//           var tSeed = existing.teams[st];
//           if (!tSeed) continue;
//           var kSeed = (toStr(tSeed.bibTeam, "").trim() || "NO-BIB") + "|" + toStr(tSeed.nameTeam, "").trim();
//           if (!mergedByKey.has(kSeed)) {
//             // deep copy sederhana
//             mergedByKey.set(kSeed, JSON.parse(JSON.stringify(tSeed)));
//           }
//         }
//       }

//       // Merge dengan incoming
//       var it = 0;
//       for (it = 0; it < incomingTeams.length; it++) {
//         var nt = incomingTeams[it];
//         var nbib = toStr(nt.bibTeam, "").trim();
//         var nname = toStr(nt.nameTeam, "").trim();
//         var kIn = (nbib || "NO-BIB") + "|" + nname;

//         var exTeam = mergedByKey.get(kIn); // bisa undefined

//         if (!exTeam) {
//           mergedByKey.set(kIn, JSON.parse(JSON.stringify(nt)));
//         } else {
//           var exRes = Array.isArray(exTeam.result) ? exTeam.result.slice() : [];
//           var ntRes = Array.isArray(nt.result) ? nt.result : [];

//           // outRes: pertahankan run-1 lama; gunakan run-2 dari nt jika ada
//           var outRes = [];
//           if (exRes[0]) outRes[0] = exRes[0];
//           else if (ntRes[0]) outRes[0] = ntRes[0];

//           if (ntRes[1]) outRes[1] = ntRes[1];
//           else if (exRes[1]) outRes[1] = exRes[1];

//           // build mergedTeam (tanpa spread)
//           var mergedTeam = {};
//           // copy semua field exTeam
//           var exKeys = Object.keys(exTeam);
//           var exi = 0;
//           for (exi = 0; exi < exKeys.length; exi++) {
//             mergedTeam[exKeys[exi]] = exTeam[exKeys[exi]];
//           }
//           // override dengan nt
//           var ntKeys = Object.keys(nt);
//           var nti = 0;
//           for (nti = 0; nti < ntKeys.length; nti++) {
//             mergedTeam[ntKeys[nti]] = nt[ntKeys[nti]];
//           }
//           mergedTeam.nameTeam = toStr(nname, exTeam.nameTeam);
//           mergedTeam.bibTeam = toStr(nbib, exTeam.bibTeam);

//           // norm run hasil gabung
//           var resOutFinal = [];
//           var rfi = 0;
//           for (rfi = 0; rfi < outRes.length; rfi++) {
//             resOutFinal.push(normRun(outRes[rfi]));
//           }
//           mergedTeam.result = resOutFinal;

//           // Jika data baru belum lengkap (<2 run), jangan timpa bestTime/ranked/score lama
//           var newRuns = outRes.length;
//           if (newRuns < 2) {
//             if (!(typeof mergedTeam.bestTime === "string" && mergedTeam.bestTime.trim() !== "")) {
//               mergedTeam.bestTime = exTeam.bestTime;
//             }
//             if (!Number.isFinite(mergedTeam.ranked)) mergedTeam.ranked = exTeam.ranked;
//             if (!Number.isFinite(mergedTeam.score)) mergedTeam.score = exTeam.score;
//           }

//           mergedByKey.set(kIn, mergedTeam);
//         }
//       }

//       var mergedArray = Array.from(mergedByKey.values());

//       // ====== RUN-LEVEL RANKING ======
//       var maxRuns = 0;
//       var mri = 0;
//       for (mri = 0; mri < mergedArray.length; mri++) {
//         var rr = Array.isArray(mergedArray[mri].result) ? mergedArray[mri].result : [];
//         if (rr.length > maxRuns) maxRuns = rr.length;
//       }

//       function rankPerSession(sessionIdx) {
//         var candidates = [];
//         var ci = 0;
//         for (ci = 0; ci < mergedArray.length; ci++) {
//           var t = mergedArray[ci];
//           var r = Array.isArray(t.result) ? t.result[sessionIdx] : null;
//           var ms = r && r.totalTime ? hmsToMs(r.totalTime) : Infinity;
//           if (Number.isFinite(ms)) {
//             candidates.push({ t: t, r: r, ms: ms });
//           }
//         }
//         // sort by ms asc
//         candidates.sort(function (a, b) { return a.ms - b.ms; });
//         var rankCounter = 0;
//         var last = null;
//         var disp = 0;
//         var cj = 0;
//         for (cj = 0; cj < candidates.length; cj++) {
//           var item = candidates[cj];
//           rankCounter++;
//           if (last === null || item.ms !== last) disp = rankCounter;
//           last = item.ms;
//           if (Array.isArray(item.t.result) && item.t.result[sessionIdx]) {
//             item.t.result[sessionIdx].ranked = disp;
//           }
//         }
//       }

//       if (maxRuns === 1) {
//         rankPerSession(0);
//       } else if (maxRuns >= 2) {
//         rankPerSession(0);
//         rankPerSession(1);
//       }

//       // ====== TEAM-LEVEL (≥2 run valid) ======
//       var eligibleTeams = [];
//       var et = 0;
//       for (et = 0; et < mergedArray.length; et++) {
//         var tm = mergedArray[et];
//         var resArr = Array.isArray(tm.result) ? tm.result : [];
//         if (resArr.length >= 2) {
//           var valsMs = [];
//           var vj = 0;
//           for (vj = 0; vj < resArr.length; vj++) {
//             var x = resArr[vj];
//             if (x && typeof x.totalTime === "string" && x.totalTime.trim() !== "") {
//               var ms = hmsToMs(x.totalTime);
//               if (Number.isFinite(ms)) valsMs.push(ms);
//             }
//           }
//           if (valsMs.length > 0) {
//             // cari min manual
//             var minMs = valsMs[0];
//             var mi = 1;
//             for (mi = 1; mi < valsMs.length; mi++) {
//               if (valsMs[mi] < minMs) minMs = valsMs[mi];
//             }
//             tm.bestTime = msToHMSms(minMs);
//             eligibleTeams.push(tm);
//           }
//         }
//       }

//       if (eligibleTeams.length > 0) {
//         // sort eligible by bestTime asc
//         eligibleTeams.sort(function (a, b) {
//           var am = a && a.bestTime ? hmsToMs(a.bestTime) : Infinity;
//           var bm = b && b.bestTime ? hmsToMs(b.bestTime) : Infinity;
//           return am - bm;
//         });
//         var rc = 0;
//         var lastBest = null;
//         var dispBest = 0;
//         var ei2 = 0;
//         for (ei2 = 0; ei2 < eligibleTeams.length; ei2++) {
//           var tt = eligibleTeams[ei2];
//           var best = tt && tt.bestTime ? hmsToMs(tt.bestTime) : Infinity;
//           rc++;
//           if (!Number.isFinite(best)) {
//             tt.ranked = 0;
//             tt.score = 0;
//           } else {
//             if (lastBest === null || best !== lastBest) dispBest = rc;
//             lastBest = best;
//             tt.ranked = dispBest;
//             tt.score = scoreForRank(dispBest); // ← skor dari table/fallback
//           }
//         }
//       }

//       var update = {
//         $set: {
//           eventId: meta.eventId,
//           initialId: meta.initialId,
//           raceId: meta.raceId,
//           divisionId: meta.divisionId,
//           eventName: meta.eventName,
//           initialName: meta.initialName,
//           raceName: meta.raceName,
//           divisionName: meta.divisionName,
//           teams: mergedArray,
//           updatedAt: now,
//           _lastRevision: now.getTime()
//         },
//         $setOnInsert: { createdAt: now }
//       };

//       var res = await col.updateOne(filter, update, { upsert: true });
//       if (res && res.upsertedCount) upsertedCount += res.upsertedCount;

//       step = ge.next();
//     }

//     return { ok: true, upsertedCount: upsertedCount };
//   } catch (err) {
//     var message = err && err.message ? err.message : String(err);
//     console.error("Error insertSlalomResult:", message);
//     return { ok: false, error: message };
//   }
// }

async function insertSlalomResult(payload) {
  try {
    const db = await getDb();
    const col = db.collection("temporarySlalomResult");

    // === Ambil SCORE_TABLE dari optionRanked (SLALOM) ===
    let SCORE_TABLE = [];
    try {
      const optCol = db.collection("optionRanked");

      // dukung dua skema dokumen
      const slalomDoc =
        (await optCol.findOne({ type: "SLALOM" })) ||
        (await optCol.findOne({ name: "SLALOM" }));

      if (slalomDoc && typeof slalomDoc === "object") {
        const d = slalomDoc.data;

        if (Array.isArray(d)) {
          // skema baru: data: [{ranking, score}]
          const cleaned = d
            .filter(function (x) {
              return (
                x &&
                Number.isFinite(Number(x.ranking)) &&
                Number.isFinite(Number(x.score))
              );
            })
            .map(function (x) {
              return { ranking: Number(x.ranking), score: Number(x.score) };
            })
            .sort(function (a, b) {
              return a.ranking - b.ranking;
            });

          if (cleaned.length > 0) {
            const maxRank = cleaned[cleaned.length - 1].ranking;
            const table = new Array(maxRank);
            for (let i = 0; i < table.length; i++) table[i] = 0;
            for (let i = 0; i < cleaned.length; i++) {
              const r = cleaned[i].ranking;
              const s = cleaned[i].score;
              table[r - 1] = s; // 1-based -> 0-based
            }
            SCORE_TABLE = table;
          }
        } else if (d && Array.isArray(d.score)) {
          // skema lama: data.score = [..]
          const arr = [];
          for (let i = 0; i < d.score.length; i++) {
            const n = Number(d.score[i]);
            if (Number.isFinite(n)) arr.push(n);
          }
          SCORE_TABLE = arr;
        } else if (Array.isArray(slalomDoc.score)) {
          const arr = [];
          for (let i = 0; i < slalomDoc.score.length; i++) {
            const n = Number(slalomDoc.score[i]);
            if (Number.isFinite(n)) arr.push(n);
          }
          SCORE_TABLE = arr;
        }
      }
    } catch (eFetch) {
      const msg = eFetch && eFetch.message ? eFetch.message : String(eFetch);
      console.error("[DAO] optionRanked fetch failed (SLALOM):", msg);
    }

    // Fallback jika kosong
    if (!Array.isArray(SCORE_TABLE) || SCORE_TABLE.length === 0) {
      console.warn("[DAO] SCORE_TABLE empty; using default fallback.");
      SCORE_TABLE = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    }

    // === Unique index per bucket ===
    if (!insertSlalomResult.__indexCreated) {
      try {
        await col.createIndex(
          { eventId: 1, initialId: 1, raceId: 1, divisionId: 1 },
          { unique: true, name: "uniq_bucket" }
        );
      } catch (eIdx) {
        const codeName = eIdx && eIdx.codeName ? eIdx.codeName : "";
        const message = eIdx && eIdx.message ? eIdx.message : String(eIdx);
        if (!eIdx || codeName !== "IndexOptionsConflict") {
          console.warn("[DAO] createIndex warning:", message);
        }
      }
      insertSlalomResult.__indexCreated = true;
    }

    // === Validasi payload ===
    if (!Array.isArray(payload)) {
      return { ok: false, error: "insertSlalomResult: payload must be an array" };
    }
    if (payload.length === 0) {
      return { ok: true, upsertedCount: 0 };
    }

    // === Helpers ===
    function scoreForRank(rank) {
      if (!Array.isArray(SCORE_TABLE) || SCORE_TABLE.length === 0) return 0;
      const idx = rank - 1;
      if (idx < 0) return 0;
      const v = SCORE_TABLE[idx];
      return Number(v) || 0;
    }
    function toStr(v, d) {
      if (v === null || v === undefined) return String(d || "");
      return String(v);
    }
    function toInt(v, d) {
      if (Number.isFinite(v)) return Number(v);
      const n = Number(v);
      if (Number.isFinite(n)) return n;
      return d || 0;
    }
    function hmsToMs(str) {
      const txt = String(str || "");
      const parts = txt.split(":");
      const h = parts.length > 0 ? Number(parts[0]) || 0 : 0;
      const m = parts.length > 1 ? Number(parts[1]) || 0 : 0;
      const sMs = parts.length > 2 ? parts[2] : "0.000";
      const sSplit = String(sMs).split(".");
      const s = sSplit.length > 0 ? Number(sSplit[0]) || 0 : 0;
      const ms = sSplit.length > 1 ? Number(sSplit[1]) || 0 : 0;
      return h * 3600000 + m * 60000 + s * 1000 + ms;
    }
    function msToHMSms(ms) {
      if (!Number.isFinite(ms)) return "";
      const hr = Math.floor(ms / 3600000);
      const rem1 = ms % 3600000;
      const min = Math.floor(rem1 / 60000);
      const rem2 = rem1 % 60000;
      const sec = Math.floor(rem2 / 1000);
      const mss = rem2 % 1000;
      function pad(n, w) { return String(n).padStart(w, "0"); }
      return pad(hr, 2) + ":" + pad(min, 2) + ":" + pad(sec, 2) + "." + pad(mss, 3);
    }
    function pruneEmpty(obj) {
      if (!obj || typeof obj !== "object") return obj;
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const v = obj[k];
        if (v === "" || v === null) delete obj[k];
      }
      return obj;
    }

    // === Normalisasi Run (tanpa "score" di run) ===
    function normRun(r) {
      const run = r || {};

      const ptRaw = run.penaltyTotal && typeof run.penaltyTotal === "object" ? run.penaltyTotal : {};
      const gatesRaw = Array.isArray(ptRaw.gates) ? ptRaw.gates : [];
      const gates = [];
      for (let gi = 0; gi < gatesRaw.length; gi++) gates.push(Number(gatesRaw[gi]) || 0);

      const pt = {
        start: Number(ptRaw.start) || 0,
        gates: gates,
        finish: Number(ptRaw.finish) || 0
      };

      let penaltySum = pt.start + pt.finish;
      for (let pi = 0; pi < pt.gates.length; pi++) penaltySum += pt.gates[pi];
      const penaltyNum = Number.isFinite(run.penalty) ? Number(run.penalty) : penaltySum;

      return {
        session: String(run.session || ""),
        startTime: String(run.startTime || ""),
        finishTime: String(run.finishTime || ""),
        raceTime: String(run.raceTime || ""),
        penaltyTime: String(run.penaltyTime || "00:00:00.000"),
        penaltyTotal: pt,
        penalty: penaltyNum,
        totalTime: String(run.totalTime || run.raceTime || ""),
        ranked: Number.isFinite(run.ranked) ? Number(run.ranked) : Number(run.ranked) || 0,
        judgesBy: String(run.judgesBy || ""),
        judgesTime: String(run.judgesTime || "")
      };
    }

    function normTeamFromFlat(clean) {
      const arr = Array.isArray(clean.result) ? clean.result : [];
      const resultArr = [];
      for (let i = 0; i < arr.length; i++) resultArr.push(normRun(arr[i]));

      let bestTime = "";
      if (typeof clean.bestTime === "string" && clean.bestTime.trim() !== "") {
        bestTime = clean.bestTime;
      }

      return pruneEmpty({
        nameTeam: toStr(clean.nameTeam, ""),
        bibTeam: toStr(clean.bibTeam, ""),
        startOrder: toStr(clean.startOrder, ""),
        praStart: toStr(clean.praStart, ""),
        intervalRace: toStr(clean.intervalRace, ""),
        statusId: toInt(clean.statusId, 0),
        result: resultArr,
        bestTime: bestTime,
        ranked: Number.isFinite(clean.ranked) ? Number(clean.ranked) : 0,
        score: Number.isFinite(clean.score) ? Number(clean.score) : 0,
        meta: pruneEmpty(clean.meta || {}),
        otr: pruneEmpty(clean.otr || {})
      });
    }

    function normTeamFromBucketTeam(t) {
      const clean = t || {};
      const arr = Array.isArray(clean.result) ? clean.result : [];
      const resultArr = [];
      for (let i = 0; i < arr.length; i++) resultArr.push(normRun(arr[i]));

      let bestTime = "";
      if (typeof clean.bestTime === "string" && clean.bestTime.trim() !== "") {
        bestTime = clean.bestTime;
      }

      return pruneEmpty({
        nameTeam: toStr(clean.nameTeam, ""),
        bibTeam: toStr(clean.bibTeam || clean.bibNumber, ""),
        startOrder: toStr(clean.startOrder, ""),
        praStart: toStr(clean.praStart, ""),
        intervalRace: toStr(clean.intervalRace, ""),
        statusId: toInt(clean.statusId, 0),
        result: resultArr,
        bestTime: bestTime,
        ranked: Number.isFinite(clean.ranked) ? Number(clean.ranked) : 0,
        score: Number.isFinite(clean.score) ? Number(clean.score) : 0,
        meta: pruneEmpty(clean.meta || {}),
        otr: pruneEmpty(clean.otr || {})
      });
    }

    // === Group payload per bucket ===
    const groups = new Map();
    for (let pIdx = 0; pIdx < payload.length; pIdx++) {
      const item = payload[pIdx];
      if (!item || typeof item !== "object") continue;

      if (Array.isArray(item.teams)) {
        const metaB = {
          eventId: toStr(item.eventId, ""),
          initialId: toStr(item.initialId, ""),
          raceId: toStr(item.raceId, ""),
          divisionId: toStr(item.divisionId, ""),
          eventName: toStr(item.eventName, ""),
          initialName: toStr(item.initialName, ""),
          raceName: toStr(item.raceName, ""),
          divisionName: toStr(item.divisionName, "")
        };
        if (!metaB.eventId || !metaB.initialId || !metaB.raceId || !metaB.divisionId) {
          console.warn("[DAO] Skip bucket, meta tidak lengkap:", metaB);
          continue;
        }
        const keyB = metaB.eventId + "|" + metaB.initialId + "|" + metaB.raceId + "|" + metaB.divisionId;

        const teamsArrB = [];
        for (let tb = 0; tb < item.teams.length; tb++) {
          teamsArrB.push(normTeamFromBucketTeam(item.teams[tb]));
        }

        if (!groups.has(keyB)) {
          groups.set(keyB, { meta: metaB, teams: teamsArrB });
        } else {
          const exB = groups.get(keyB);
          // hindari spread (kompat ES5)
          for (let i = 0; i < teamsArrB.length; i++) exB.teams.push(teamsArrB[i]);
        }
      } else {
        const metaF = {
          eventId: toStr(item.eventId, ""),
          initialId: toStr(item.initialId, ""),
          raceId: toStr(item.raceId, ""),
          divisionId: toStr(item.divisionId, ""),
          eventName: toStr(item.eventName, ""),
          initialName: toStr(item.initialName, ""),
          raceName: toStr(item.raceName, ""),
          divisionName: toStr(item.divisionName, "")
        };
        if (!metaF.eventId || !metaF.initialId || !metaF.raceId || !metaF.divisionId) {
          console.warn("[DAO] Skip flat item, meta tidak lengkap:", metaF);
          continue;
        }
        const keyF = metaF.eventId + "|" + metaF.initialId + "|" + metaF.raceId + "|" + metaF.divisionId;

        const cleanJson = JSON.stringify(item);
        const cleanAny = JSON.parse(cleanJson);
        if (cleanAny && cleanAny._id) delete cleanAny._id;

        const teamEntry = normTeamFromFlat(cleanAny);

        if (!groups.has(keyF)) {
          groups.set(keyF, { meta: metaF, teams: [teamEntry] });
        } else {
          groups.get(keyF).teams.push(teamEntry);
        }
      }
    }

    if (groups.size === 0) {
      return { ok: false, error: "Meta bucket kosong di payload" };
    }

    // === Ambil existing per semua bucket ===
    const filterOr = [];
    const vals = Array.from(groups.values());
    for (let vi = 0; vi < vals.length; vi++) {
      const m = vals[vi].meta;
      filterOr.push({
        eventId: m.eventId,
        initialId: m.initialId,
        raceId: m.raceId,
        divisionId: m.divisionId
      });
    }
    const existingDocs = await col.find({ $or: filterOr }).toArray();
    const existingMap = new Map();
    for (let ei = 0; ei < existingDocs.length; ei++) {
      const exDoc = existingDocs[ei];
      const ek = exDoc.eventId + "|" + exDoc.initialId + "|" + exDoc.raceId + "|" + exDoc.divisionId;
      existingMap.set(ek, exDoc);
    }

    // === Proses per bucket ===
    const now = new Date();
    let upsertedCount = 0;

    const ge = groups.entries();
    let step = ge.next();
    while (!step.done) {
      const bucketKey = step.value[0];
      const entryObj = step.value[1];

      const meta = entryObj.meta;
      const incomingTeams = entryObj.teams;

      const filter = {
        eventId: meta.eventId,
        initialId: meta.initialId,
        raceId: meta.raceId,
        divisionId: meta.divisionId
      };

      let existing = existingMap.get(bucketKey);
      if (existing) {
        const dup = await col.countDocuments(filter);
        if (dup > 1) {
          console.warn("[DAO] Found >1 doc, cleanup:", filter);
          await col.deleteMany(filter);
          existing = null;
        }
      }

      // Merge by (bibTeam|nameTeam) DENGAN MERGE PER-RUN
      const mergedByKey = new Map();

      // Seed dari existing
      if (existing && Array.isArray(existing.teams)) {
        for (let st = 0; st < existing.teams.length; st++) {
          const tSeed = existing.teams[st];
          if (!tSeed) continue;
          const kSeed =
            (toStr(tSeed.bibTeam, "").trim() || "NO-BIB") +
            "|" +
            toStr(tSeed.nameTeam, "").trim();
          if (!mergedByKey.has(kSeed)) {
            mergedByKey.set(kSeed, JSON.parse(JSON.stringify(tSeed)));
          }
        }
      }

      // Merge dengan incoming
      for (let it = 0; it < incomingTeams.length; it++) {
        const nt = incomingTeams[it];
        const nbib = toStr(nt.bibTeam, "").trim();
        const nname = toStr(nt.nameTeam, "").trim();
        const kIn = (nbib || "NO-BIB") + "|" + nname;

        const exTeam = mergedByKey.get(kIn); // bisa undefined

        if (!exTeam) {
          mergedByKey.set(kIn, JSON.parse(JSON.stringify(nt)));
        } else {
          const exRes = Array.isArray(exTeam.result) ? exTeam.result.slice() : [];
          const ntRes = Array.isArray(nt.result) ? nt.result : [];

          // outRes: pertahankan run-1 lama; gunakan run-2 dari nt jika ada
          const outRes = [];
          if (exRes[0]) outRes[0] = exRes[0];
          else if (ntRes[0]) outRes[0] = ntRes[0];

          if (ntRes[1]) outRes[1] = ntRes[1];
          else if (exRes[1]) outRes[1] = exRes[1];

          // build mergedTeam
          const mergedTeam = {};
          const exKeys = Object.keys(exTeam);
          for (let exi = 0; exi < exKeys.length; exi++) {
            mergedTeam[exKeys[exi]] = exTeam[exi];
          }
          for (let exi = 0; exi < exKeys.length; exi++) {
            const k = exKeys[exi];
            mergedTeam[k] = exTeam[k];
          }
          const ntKeys = Object.keys(nt);
          for (let nti = 0; nti < ntKeys.length; nti++) {
            const k = ntKeys[nti];
            mergedTeam[k] = nt[k];
          }
          mergedTeam.nameTeam = toStr(nname, exTeam.nameTeam);
          mergedTeam.bibTeam = toStr(nbib, exTeam.bibTeam);

          // norm run hasil gabung
          const resOutFinal = [];
          for (let rfi = 0; rfi < outRes.length; rfi++) {
            resOutFinal.push(normRun(outRes[rfi]));
          }
          mergedTeam.result = resOutFinal;

          // Jika data baru belum lengkap (<2 run), jangan timpa bestTime/ranked/score lama
          const newRuns = outRes.length;
          if (newRuns < 2) {
            if (!(typeof mergedTeam.bestTime === "string" && mergedTeam.bestTime.trim() !== "")) {
              mergedTeam.bestTime = exTeam.bestTime;
            }
            if (!Number.isFinite(mergedTeam.ranked)) mergedTeam.ranked = exTeam.ranked;
            if (!Number.isFinite(mergedTeam.score)) mergedTeam.score = exTeam.score;
          }

          mergedByKey.set(kIn, mergedTeam);
        }
      }

      const mergedArray = Array.from(mergedByKey.values());

      // ====== RUN-LEVEL RANKING ======
      let maxRuns = 0;
      for (let mri = 0; mri < mergedArray.length; mri++) {
        const rr = Array.isArray(mergedArray[mri].result) ? mergedArray[mri].result : [];
        if (rr.length > maxRuns) maxRuns = rr.length;
      }

      function rankPerSession(sessionIdx) {
        const candidates = [];
        for (let ci = 0; ci < mergedArray.length; ci++) {
          const t = mergedArray[ci];
          const r = Array.isArray(t.result) ? t.result[sessionIdx] : null;
          const ms = r && r.totalTime ? hmsToMs(r.totalTime) : Infinity;
          if (Number.isFinite(ms)) {
            candidates.push({ t: t, r: r, ms: ms });
          }
        }
        candidates.sort(function (a, b) { return a.ms - b.ms; });
        let rankCounter = 0;
        let last = null;
        let disp = 0;
        for (let cj = 0; cj < candidates.length; cj++) {
          const item = candidates[cj];
          rankCounter++;
          if (last === null || item.ms !== last) disp = rankCounter;
          last = item.ms;
          if (Array.isArray(item.t.result) && item.t.result[sessionIdx]) {
            item.t.result[sessionIdx].ranked = disp;
          }
        }
      }

      if (maxRuns === 1) {
        rankPerSession(0);
      } else if (maxRuns >= 2) {
        rankPerSession(0);
        rankPerSession(1);
      }

      // ====== TEAM-LEVEL (≥2 run valid) ======
      const eligibleTeams = [];
      for (let et = 0; et < mergedArray.length; et++) {
        const tm = mergedArray[et];
        const resArr = Array.isArray(tm.result) ? tm.result : [];
        if (resArr.length >= 2) {
          const valsMs = [];
          for (let vj = 0; vj < resArr.length; vj++) {
            const x = resArr[vj];
            if (x && typeof x.totalTime === "string" && x.totalTime.trim() !== "") {
              const ms = hmsToMs(x.totalTime);
              if (Number.isFinite(ms)) valsMs.push(ms);
            }
          }
          if (valsMs.length > 0) {
            let minMs = valsMs[0];
            for (let mi = 1; mi < valsMs.length; mi++) {
              if (valsMs[mi] < minMs) minMs = valsMs[mi];
            }
            tm.bestTime = msToHMSms(minMs);
            eligibleTeams.push(tm);
          }
        }
      }

      if (eligibleTeams.length > 0) {
        eligibleTeams.sort(function (a, b) {
          const am = a && a.bestTime ? hmsToMs(a.bestTime) : Infinity;
          const bm = b && b.bestTime ? hmsToMs(b.bestTime) : Infinity;
          return am - bm;
        });
        let rc = 0;
        let lastBest = null;
        let dispBest = 0;
        for (let ei2 = 0; ei2 < eligibleTeams.length; ei2++) {
          const tt = eligibleTeams[ei2];
          const best = tt && tt.bestTime ? hmsToMs(tt.bestTime) : Infinity;
          rc++;
          if (!Number.isFinite(best)) {
            tt.ranked = 0;
            tt.score = 0;
          } else {
            if (lastBest === null || best !== lastBest) dispBest = rc;
            lastBest = best;
            tt.ranked = dispBest;
            tt.score = scoreForRank(dispBest);
          }
        }
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
          teams: mergedArray,
          updatedAt: now,
          _lastRevision: now.getTime()
        },
        $setOnInsert: { createdAt: now }
      };

      const res = await col.updateOne(filter, update, { upsert: true });
      if (res && res.upsertedCount) upsertedCount += res.upsertedCount;

      step = ge.next();
    }

    return { ok: true, upsertedCount: upsertedCount };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    console.error("Error insertSlalomResult:", message);
    return { ok: false, error: message };
  }
}

async function insertDrrResult(payload) {
  try {
    const db = await getDb();
    const col = db.collection("temporaryDrrResult");

    // --- pastikan index unik (tanpa chaining) ---
    try {
      await col.createIndex(
        { eventId: 1, initialId: 1, raceId: 1, divisionId: 1 },
        { unique: true, name: "uniq_bucket_drr" }
      );
    } catch (e) {
      if (!e || e.codeName !== "IndexOptionsConflict") {
        console.log("[DRR] createIndex warn:", e.message || String(e));
      }
    }

    // --- validasi payload ---
    let arr = null;
    if (Array.isArray(payload)) arr = payload;
    else if (payload && Array.isArray(payload.docs)) arr = payload.docs;

    if (!arr) {
      return { ok: false, error: "Payload must be array or {docs:[...]}" };
    }
    if (arr.length === 0) {
      return { ok: true, upsertedCount: 0 };
    }

    // --- helpers ---
    const SCORE_TABLE = [
      350, 322, 301, 287, 277, 266, 256, 245, 235, 224, 214, 203, 193, 182, 172,
      161, 151, 140, 133, 126, 119, 112, 105, 98, 91, 84, 77, 70, 63, 56, 49,
      42,
    ];
    function scoreForRank(rank) {
      if (rank <= 0) return 0;
      return SCORE_TABLE[rank - 1] || 0;
    }
    function toStr(v, d) {
      return String(v == null ? d || "" : v);
    }
    function toInt(v, d) {
      if (Number.isFinite(v)) return Number(v);
      const n = Number(v);
      return Number.isNaN(n) ? d || 0 : n;
    }
    function hmsToMs(str) {
      const s = String(str || "");
      const p = s.split(":");
      const h = +p[0] || 0;
      const m = +p[1] || 0;
      const sm = p[2] || "0.000";
      const sp = sm.split(".");
      const sec = +sp[0] || 0;
      const ms = +sp[1] || 0;
      return h * 3600000 + m * 60000 + sec * 1000 + ms;
    }
    function msToHMSms(ms) {
      if (!Number.isFinite(ms)) return "";
      const pad = (n, w) => String(n).padStart(w, "0");
      const hr = Math.floor(ms / 3600000);
      const rem1 = ms % 3600000;
      const min = Math.floor(rem1 / 60000);
      const rem2 = rem1 % 60000;
      const sec = Math.floor(rem2 / 1000);
      const mss = rem2 % 1000;
      return (
        pad(hr, 2) + ":" + pad(min, 2) + ":" + pad(sec, 2) + "." + pad(mss, 3)
      );
    }

    // --- normalizers ---
    function normalizeResult(r) {
      if (!r) r = {};
      const sectionTime = Array.isArray(r.sectionPenaltyTime)
        ? r.sectionPenaltyTime
        : ["00:00:00.000", "00:00:00.000", "00:00:00.000"];

      const res = {
        startTime: toStr(r.startTime, ""),
        finishTime: toStr(r.finishTime, ""),
        raceTime: toStr(r.raceTime, ""),
        startPenalty: toInt(r.startPenalty, 0),
        finishPenalty: toInt(r.finishPenalty, 0),
        sectionPenalty: toInt(r.sectionPenalty, 0),
        totalPenalty: toInt(r.totalPenalty, 0),
        startPenaltyTime: toStr(r.startPenaltyTime, "00:00:00.000"),
        finishPenaltyTime: toStr(r.finishPenaltyTime, "00:00:00.000"),
        sectionPenaltyTime: sectionTime,
        totalPenaltyTime: toStr(r.totalPenaltyTime, "00:00:00.000"),
        totalTime: toStr(r.totalTime, ""),
        ranked: toInt(r.ranked, 0),
        score: toInt(r.score, 0),
        judgesBy: toStr(r.judgesBy, ""),
        judgesTime: toStr(r.judgesTime, ""),
      };
      return res;
    }

    function normalizeOtr(o) {
      if (!o) o = {};
      const base = {
        startTime: "",
        finishTime: "",
        raceTime: "",
        penaltyStartTime: "",
        penaltyFinishTime: "",
        penaltySection: ["", "", ""],
        penaltyTime: "",
        totalTime: "",
        ranked: "",
        score: "",
        penalty: "",
      };
      for (const k in o) base[k] = o[k];
      return base;
    }

    function normalizeTeam(t) {
      if (!t) t = {};
      const clean = JSON.parse(JSON.stringify(t));
      delete clean._id;
      const out = {
        nameTeam: toStr(clean.nameTeam, ""),
        bibTeam: toStr(clean.bibTeam, ""),
        startOrder: toStr(clean.startOrder, ""),
        praStart: toStr(clean.praStart, ""),
        intervalRace: toStr(clean.intervalRace, ""),
        statusId: toInt(clean.statusId, 0),
        result: normalizeResult(clean.result),
        otr: normalizeOtr(clean.otr),
      };
      return out;
    }

    // --- group by meta ---
    const groups = new Map();
    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
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
      if (!meta.eventId || !meta.initialId || !meta.raceId || !meta.divisionId)
        continue;
      const key =
        meta.eventId +
        "|" +
        meta.initialId +
        "|" +
        meta.raceId +
        "|" +
        meta.divisionId;
      const team = normalizeTeam(it);
      if (!groups.has(key)) groups.set(key, { meta: meta, teams: [team] });
      else groups.get(key).teams.push(team);
    }

    const now = new Date();
    let upsertedCount = 0;

    // --- process tiap bucket ---
    const iterator = groups.values();
    for (const item of iterator) {
      const meta = item.meta;
      const teams = item.teams;
      const filter = {
        eventId: meta.eventId,
        initialId: meta.initialId,
        raceId: meta.raceId,
        divisionId: meta.divisionId,
      };

      let existingDocs = await col.find(filter).toArray();
      if (existingDocs.length > 1) {
        await col.deleteMany(filter);
        existingDocs = [];
      }

      const mergedByKey = new Map();
      if (existingDocs.length === 1) {
        const ex = existingDocs[0];
        const exTeams = Array.isArray(ex.teams) ? ex.teams : [];
        for (let j = 0; j < exTeams.length; j++) {
          const t = exTeams[j];
          const k = toStr(t.bibTeam, "") + "|" + toStr(t.nameTeam, "");
          mergedByKey.set(k, t);
        }
      }
      for (let j = 0; j < teams.length; j++) {
        const nt = teams[j];
        const k = toStr(nt.bibTeam, "") + "|" + toStr(nt.nameTeam, "");
        mergedByKey.set(k, nt);
      }

      const mergedArray = Array.from(mergedByKey.values());
      mergedArray.sort(function (a, b) {
        const am =
          a.result && a.result.totalTime
            ? hmsToMs(a.result.totalTime)
            : Infinity;
        const bm =
          b.result && b.result.totalTime
            ? hmsToMs(b.result.totalTime)
            : Infinity;
        return am - bm;
      });

      let rank = 1;
      for (let j = 0; j < mergedArray.length; j++) {
        const t = mergedArray[j];
        const ms =
          t.result && t.result.totalTime
            ? hmsToMs(t.result.totalTime)
            : Infinity;
        if (Number.isFinite(ms)) {
          t.result.ranked = rank;
          t.result.score = scoreForRank(rank);
          rank++;
        } else {
          if (!t.result.ranked) t.result.ranked = 0;
          if (!t.result.score) t.result.score = 0;
        }
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
      if (res.upsertedCount) upsertedCount += res.upsertedCount;
    }

    return { ok: true, upsertedCount: upsertedCount };
  } catch (err) {
    console.error("insertDrrResult error:", err);
    return { ok: false, error: err.message || String(err) };
  }
}

module.exports = {
  insertSprintResult,
  insertSlalomResult,
  insertDrrResult,
};
