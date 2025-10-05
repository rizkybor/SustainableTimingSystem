// src/utils/localStoreSprint.js
// Util simpan/muat hasil Sprint per-bucket di localStorage (renderer)

const LOCAL_PREFIX = "sprintLocal:"; // namespace prefix

// -------------------------------------------------------------
// Utils dasar
// -------------------------------------------------------------
export function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, wait);
  };
}

export function localKeyFromBucketKey(bucketKey) {
  return LOCAL_PREFIX + bucketKey;
}

// fallback storage (kalau localStorage tidak tersedia)
function getStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch (e) {
    /* noop */
  }

  // fallback sederhana in-memory
  const mem = new Map();
  const stubStorage = {
    getItem: function (key) {
      if (mem.has(key)) {
        return mem.get(key);
      }
      return null;
    },
    setItem: function (key, value) {
      mem.set(key, value);
    },
    removeItem: function (key) {
      mem.delete(key);
    },
    key: function (index) {
      const keys = Array.from(mem.keys());
      return keys[index] || null;
    },
    get length() {
      return mem.size;
    },
  };
  return stubStorage;
}

const storage = getStorage();

// -------------------------------------------------------------
// Struktur data dan util bantu
// -------------------------------------------------------------
export function slimTeam(team = {}) {
  const base = {
    nameTeam: String(team.nameTeam || ""),
    bibTeam: String(team.bibTeam || ""),
    startOrder: String(team.startOrder || ""),
    praStart: String(team.praStart || ""),
    intervalRace: String(team.intervalRace || ""),
    statusId: Number.isFinite(team.statusId) ? Number(team.statusId) : 0,
  };

  const resultObj = team.result || {};

  const result = {
    startTime: String(resultObj.startTime || ""),
    finishTime: String(resultObj.finishTime || ""),
    raceTime: String(resultObj.raceTime || ""),
    startPenalty: Number(resultObj.startPenalty || 0),
    finishPenalty: Number(resultObj.finishPenalty || 0),
    totalPenalty: Number(resultObj.totalPenalty || 0),
    startPenaltyTime: String(resultObj.startPenaltyTime || "00:00:00.000"),
    finishPenaltyTime: String(resultObj.finishPenaltyTime || "00:00:00.000"),
    totalPenaltyTime: String(resultObj.totalPenaltyTime || "00:00:00.000"),
    penaltyTime: String(resultObj.penaltyTime || "00:00:00.000"),
    totalTime: String(resultObj.totalTime || ""),
    ranked: Number.isFinite(resultObj.ranked)
      ? Number(resultObj.ranked)
      : resultObj.ranked
      ? Number(resultObj.ranked)
      : 0,
    score: Number.isFinite(resultObj.score)
      ? Number(resultObj.score)
      : resultObj.score
      ? Number(resultObj.score)
      : 0,
  };

  const merged = {};
  for (const k in base) {
    merged[k] = base[k];
  }
  merged.result = result;

  return merged;
}

// -------------------------------------------------------------
// API utama
// -------------------------------------------------------------
export function saveLocalResults(bucketKey, participantArr = []) {
  if (!bucketKey) {
    return;
  }

  const key = localKeyFromBucketKey(bucketKey);
  const slimArray = [];

  for (let i = 0; i < participantArr.length; i++) {
    const item = slimTeam(participantArr[i]);
    slimArray.push(item);
  }

  const payload = {
    ts: Date.now(),
    teams: slimArray,
  };

  storage.setItem(key, JSON.stringify(payload));
}

export function loadLocalResults(bucketKey) {
  if (!bucketKey) {
    return [];
  }

  const key = localKeyFromBucketKey(bucketKey);
  const raw = storage.getItem(key);

  if (!raw) {
    return [];
  }

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return [];
  }

  if (parsed && Array.isArray(parsed.teams)) {
    return parsed.teams;
  }

  return [];
}

export function clearLocalResults(bucketKey) {
  if (!bucketKey) {
    return;
  }
  const key = localKeyFromBucketKey(bucketKey);
  storage.removeItem(key);
}

// -------------------------------------------------------------
// Merge hasil DB/payload dengan cache lokal berdasarkan BIB (fallback nama)
// -------------------------------------------------------------
export function mergeTeamsWithCache(baseTeams = [], cachedTeams = []) {
  const mapCached = new Map();

  for (let i = 0; i < cachedTeams.length; i++) {
    const t = cachedTeams[i];
    const id = String(t.bibTeam || t.nameTeam || "");
    mapCached.set(id, t);
  }

  const mergedTeams = [];

  for (let j = 0; j < baseTeams.length; j++) {
    const team = baseTeams[j];
    const id = String(team.bibTeam || team.nameTeam || "");
    const cached = mapCached.get(id);

    if (!cached) {
      mergedTeams.push(team);
      continue;
    }

    const resultOriginal = team.result || {};
    const resultCached = cached.result || {};
    const mergedResult = {};

    // copy dari original dulu
    for (const k in resultOriginal) {
      mergedResult[k] = resultOriginal[k];
    }

    // overwrite kalau cached punya nilai
    const keysCached = Object.keys(resultCached);
    for (let k = 0; k < keysCached.length; k++) {
      const key = keysCached[k];
      const val = resultCached[key];
      const isEmpty =
        val === "" ||
        val === null ||
        val === undefined ||
        (typeof val === "number" && Number.isNaN(val));
      if (!isEmpty) {
        mergedResult[key] = val;
      }
    }

    const newTeam = {};
    for (const k in team) {
      newTeam[k] = team[k];
    }
    newTeam.result = mergedResult;

    mergedTeams.push(newTeam);
  }

  return mergedTeams;
}

// -------------------------------------------------------------
// Bersihkan semua cache untuk satu eventId
// -------------------------------------------------------------
export function clearAllForEvent(eventId) {
  if (!eventId) {
    return 0;
  }

  let count = 0;

  if (typeof window !== "undefined" && storage === window.localStorage) {
    const total = storage.length;
    for (let i = total - 1; i >= 0; i--) {
      const key = storage.key(i);
      if (!key) {
        continue;
      }

      if (key.startsWith(LOCAL_PREFIX)) {
        const rawKey = key.substring(LOCAL_PREFIX.length);
        const parts = rawKey.split("|");
        const evId = parts[0];
        if (String(evId) === String(eventId)) {
          storage.removeItem(key);
          count++;
        }
      }
    }
  }

  return count;
}