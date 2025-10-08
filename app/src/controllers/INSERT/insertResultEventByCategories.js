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
    const db = await getDb();
    const col = db.collection("temporarySlalomResult");

    // === Ambil SCORE_TABLE dari optionRanked (SLALOM) ===
    var SCORE_TABLE = [];
    try {
      const optCol = db.collection("optionRanked");
      const slalomDoc = await optCol.findOne({ name: "SLALOM" });
      if (slalomDoc && typeof slalomDoc === "object") {
        const dataObj = slalomDoc.data;
        if (dataObj && Array.isArray(dataObj.score)) {
          const arr = [];
          for (let i = 0; i < dataObj.score.length; i++) {
            const v = Number(dataObj.score[i]);
            if (Number.isFinite(v)) arr.push(v);
          }
          SCORE_TABLE = arr;
        }
      }
    } catch (eFetch) {
      const msg = eFetch && eFetch.message ? eFetch.message : String(eFetch);
      console.error("[DAO] optionRanked fetch failed (SLALOM):", msg);
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
      if (idx < 0 || idx >= SCORE_TABLE.length) return 0;
      return SCORE_TABLE[idx];
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

    // === NORMALISASI RUN: simpan semua field yang kamu minta ===
    function normRun(r) {
      const run = r || {};

      // penaltyTotal
      var ptRaw = run.penaltyTotal && typeof run.penaltyTotal === "object" ? run.penaltyTotal : {};
      var gatesRaw = Array.isArray(ptRaw.gates) ? ptRaw.gates : [];
      var gates = [];
      for (var gi = 0; gi < gatesRaw.length; gi++) {
        gates.push(Number(gatesRaw[gi]) || 0);
      }
      var pt = {
        start: Number(ptRaw.start) || 0,
        gates: gates,
        finish: Number(ptRaw.finish) || 0,
      };

      // jumlah penalty numeric (optional)
      var penaltySum = pt.start + pt.finish;
      for (var pi = 0; pi < pt.gates.length; pi++) penaltySum += pt.gates[pi];
      var penaltyNum = Number.isFinite(run.penalty) ? Number(run.penalty) : penaltySum;

      // JANGAN dipruning supaya kosong "" tetap tersimpan (sesuai contohmu)
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
        score: Number.isFinite(run.score) ? Number(run.score) : Number(run.score) || 0,
        judgesBy: String(run.judgesBy || ""),
        judgesTime: String(run.judgesTime || ""),
      };
    }

    // Tim (payload flat)
    function normTeamFromFlat(clean) {
      const arr = Array.isArray(clean.result) ? clean.result : [];
      const resultArr = [];
      for (let i = 0; i < arr.length; i++) resultArr.push(normRun(arr[i]));

      let bestTime = "";
      if (typeof clean.bestTime === "string" && clean.bestTime.trim() !== "") {
        bestTime = clean.bestTime;
      } else if (resultArr.length > 0) {
        const vals = [];
        for (let j = 0; j < resultArr.length; j++) {
          const rt = resultArr[j];
          if (rt && rt.totalTime) {
            const ms = hmsToMs(rt.totalTime);
            if (Number.isFinite(ms)) vals.push(ms);
          }
        }
        if (vals.length > 0) bestTime = msToHMSms(Math.min.apply(Math, vals));
      }

      // Boleh prune field kosong DI LEVEL TIM (bukan di level run)
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
        otr: pruneEmpty(clean.otr || {}),
      });
    }

    // Tim (payload bucket: item.teams[])
    function normTeamFromBucketTeam(t) {
      const clean = t || {};
      const arr = Array.isArray(clean.result) ? clean.result : [];
      const resultArr = [];
      for (let i = 0; i < arr.length; i++) resultArr.push(normRun(arr[i]));

      let bestTime = "";
      if (typeof clean.bestTime === "string" && clean.bestTime.trim() !== "") {
        bestTime = clean.bestTime;
      } else if (resultArr.length > 0) {
        const vals = [];
        for (let j = 0; j < resultArr.length; j++) {
          const rt = resultArr[j];
          if (rt && rt.totalTime) {
            const ms = hmsToMs(rt.totalTime);
            if (Number.isFinite(ms)) vals.push(ms);
          }
        }
        if (vals.length > 0) bestTime = msToHMSms(Math.min.apply(Math, vals));
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
        otr: pruneEmpty(clean.otr || {}),
      });
    }

    // === Group payload per bucket; dukung bentuk BUCKET & FLAT ===
    const groups = new Map();
    for (let i = 0; i < payload.length; i++) {
      const item = payload[i];
      if (!item || typeof item !== "object") continue;

      if (Array.isArray(item.teams)) {
        // BUCKET
        const meta = {
          eventId: toStr(item.eventId, ""),
          initialId: toStr(item.initialId, ""),
          raceId: toStr(item.raceId, ""),
          divisionId: toStr(item.divisionId, ""),
          eventName: toStr(item.eventName, ""),
          initialName: toStr(item.initialName, ""),
          raceName: toStr(item.raceName, ""),
          divisionName: toStr(item.divisionName, ""),
        };
        if (!meta.eventId || !meta.initialId || !meta.raceId || !meta.divisionId) {
          console.warn("[DAO] Skip bucket, meta tidak lengkap:", meta);
          continue;
        }
        const key = meta.eventId + "|" + meta.initialId + "|" + meta.raceId + "|" + meta.divisionId;

        const teamsArr = [];
        for (let j = 0; j < item.teams.length; j++) teamsArr.push(normTeamFromBucketTeam(item.teams[j]));

        if (!groups.has(key)) groups.set(key, { meta: meta, teams: teamsArr });
        else {
          const ex = groups.get(key);
          ex.teams = ex.teams.concat(teamsArr);
        }
      } else {
        // FLAT
        const meta = {
          eventId: toStr(item.eventId, ""),
          initialId: toStr(item.initialId, ""),
          raceId: toStr(item.raceId, ""),
          divisionId: toStr(item.divisionId, ""),
          eventName: toStr(item.eventName, ""),
          initialName: toStr(item.initialName, ""),
          raceName: toStr(item.raceName, ""),
          divisionName: toStr(item.divisionName, ""),
        };
        if (!meta.eventId || !meta.initialId || !meta.raceId || !meta.divisionId) {
          console.warn("[DAO] Skip flat item, meta tidak lengkap:", meta);
          continue;
        }
        const key = meta.eventId + "|" + meta.initialId + "|" + meta.raceId + "|" + meta.divisionId;

        const cleanJson = JSON.stringify(item);
        const clean = JSON.parse(cleanJson);
        if (clean && clean._id) delete clean._id;

        const teamEntry = normTeamFromFlat(clean);

        if (!groups.has(key)) groups.set(key, { meta: meta, teams: [teamEntry] });
        else groups.get(key).teams.push(teamEntry);
      }
    }

    if (groups.size === 0) {
      return { ok: false, error: "Meta bucket kosong di payload" };
    }

    // === Ambil existing per semua bucket ===
    const filterOr = [];
    const vals = Array.from(groups.values());
    for (let i = 0; i < vals.length; i++) {
      const m = vals[i].meta;
      filterOr.push({
        eventId: m.eventId,
        initialId: m.initialId,
        raceId: m.raceId,
        divisionId: m.divisionId,
      });
    }
    const existingDocs = await col.find({ $or: filterOr }).toArray();
    const existingMap = new Map();
    for (let i = 0; i < existingDocs.length; i++) {
      const ex = existingDocs[i];
      const k = ex.eventId + "|" + ex.initialId + "|" + ex.raceId + "|" + ex.divisionId;
      existingMap.set(k, ex);
    }

    // === Proses per bucket ===
    const now = new Date();
    let upsertedCount = 0;

    for (const entry of groups.entries()) {
      const bucketKey = entry[0];
      const meta = entry[1].meta;
      const incomingTeams = entry[1].teams;

      const filter = {
        eventId: meta.eventId,
        initialId: meta.initialId,
        raceId: meta.raceId,
        divisionId: meta.divisionId,
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

      // Merge by (bibTeam|nameTeam)
      const mergedByKey = new Map();

      if (existing && Array.isArray(existing.teams)) {
        for (let i = 0; i < existing.teams.length; i++) {
          const t = existing.teams[i];
          if (!t) continue;
          const k = (toStr(t.bibTeam, "").trim() || "NO-BIB") + "|" + toStr(t.nameTeam, "").trim();
          if (!mergedByKey.has(k)) mergedByKey.set(k, t);
        }
      }

      for (let i = 0; i < incomingTeams.length; i++) {
        const nt = incomingTeams[i];
        const nbib = toStr(nt.bibTeam, "").trim();
        const nname = toStr(nt.nameTeam, "").trim();
        const k = (nbib || "NO-BIB") + "|" + nname;
        mergedByKey.set(k, nt);
      }

      const mergedArray = Array.from(mergedByKey.values());

      // Lengkapi bestTime bila kosong
      for (let i = 0; i < mergedArray.length; i++) {
        const tm = mergedArray[i];
        if (!tm.bestTime) {
          const valsMs = [];
          const resArr = Array.isArray(tm.result) ? tm.result : [];
          for (let j = 0; j < resArr.length; j++) {
            const x = resArr[j];
            if (x && x.totalTime) {
              const ms = hmsToMs(x.totalTime);
              if (Number.isFinite(ms)) valsMs.push(ms);
            }
          }
          if (valsMs.length > 0) tm.bestTime = msToHMSms(Math.min.apply(Math, valsMs));
        }
      }

      // Sort & ranking kompetisi
      mergedArray.sort(function (a, b) {
        const am = a && a.bestTime ? hmsToMs(a.bestTime) : Infinity;
        const bm = b && b.bestTime ? hmsToMs(b.bestTime) : Infinity;
        return am - bm;
      });

      let rankCounter = 0;
      let lastTime = null;
      let rankDisplay = 0;
      for (let i = 0; i < mergedArray.length; i++) {
        const t = mergedArray[i];
        const best = t && t.bestTime ? hmsToMs(t.bestTime) : Infinity;
        rankCounter++;
        if (!Number.isFinite(best)) {
          t.ranked = 0;
          t.score = 0;
        } else {
          if (lastTime === null || best !== lastTime) rankDisplay = rankCounter;
          lastTime = best;
          t.ranked = rankDisplay;
          t.score = scoreForRank(rankDisplay);
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
          _lastRevision: now.getTime(),
        },
        $setOnInsert: { createdAt: now },
      };

      const res = await col.updateOne(filter, update, { upsert: true });
      if (res && res.upsertedCount) upsertedCount += res.upsertedCount;
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
