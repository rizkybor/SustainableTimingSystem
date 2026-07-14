// src/utils/localBucketCache.js
// Generic per-bucket localStorage cache, schema-agnostic. Used to protect
// in-progress (not-yet-saved-to-DB) timing data from being wiped out when the
// user switches "Switch Category" bucket and back, for pages whose result
// shape doesn't fit localStoreSprint.js's Sprint-specific slimmed schema
// (Slalom's per-run sessions array, RX's rounds/heats bracket tree, etc.).

function getStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch (e) {
    /* noop */
  }
  const mem = new Map();
  return {
    getItem: (key) => (mem.has(key) ? mem.get(key) : null),
    setItem: (key, value) => mem.set(key, value),
    removeItem: (key) => mem.delete(key),
  };
}

const storage = getStorage();

function isEmptyLeaf(v) {
  return (
    v === "" ||
    v === null ||
    v === undefined ||
    (typeof v === "number" && Number.isNaN(v))
  );
}

// Deep-overlay: prefer `cached`'s leaf values over `base`'s, recursing into
// arrays (matched by index) and plain objects (matched by key), but only
// where the cached leaf is non-empty. Falls back to `base` wherever cached
// has nothing to offer, so freshly-fetched DB fields not present in an older
// cache entry are preserved.
function deepOverlayNonEmpty(base, cached) {
  if (cached === undefined) return base;

  if (Array.isArray(base) && Array.isArray(cached)) {
    const len = Math.max(base.length, cached.length);
    const out = [];
    for (let i = 0; i < len; i++) {
      out.push(deepOverlayNonEmpty(base[i], cached[i]));
    }
    return out;
  }

  if (
    base &&
    typeof base === "object" &&
    cached &&
    typeof cached === "object" &&
    !Array.isArray(base) &&
    !Array.isArray(cached)
  ) {
    const out = { ...base };
    Object.keys(cached).forEach((k) => {
      out[k] = deepOverlayNonEmpty(base[k], cached[k]);
    });
    return out;
  }

  if (base === undefined) return cached;
  return isEmptyLeaf(cached) ? base : cached;
}

export function createBucketCache(namespace) {
  const prefix = String(namespace || "bucket") + ":";
  const keyFor = (bucketKey) => prefix + bucketKey;

  function save(bucketKey, data) {
    if (!bucketKey) return;
    try {
      storage.setItem(keyFor(bucketKey), JSON.stringify({ ts: Date.now(), data: data || [] }));
    } catch (e) {
      /* noop */
    }
  }

  function load(bucketKey) {
    if (!bucketKey) return null;
    try {
      const raw = storage.getItem(keyFor(bucketKey));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && "data" in parsed ? parsed.data : null;
    } catch (e) {
      return null;
    }
  }

  function clear(bucketKey) {
    if (!bucketKey) return;
    storage.removeItem(keyFor(bucketKey));
  }

  function merge(baseData, cachedData) {
    if (cachedData === null || cachedData === undefined) return baseData;
    return deepOverlayNonEmpty(baseData, cachedData);
  }

  return { save, load, clear, merge };
}
