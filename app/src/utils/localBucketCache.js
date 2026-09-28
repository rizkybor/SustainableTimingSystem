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

// BUG FIX (2026-09-28): angka 0 dan string waktu-nol "00:00:00.000" dulu
// TIDAK dianggap kosong — akibatnya cache LAMA (tersimpan sblm sebuah
// penalty/waktu masuk, saat field itu masih default 0/"00:00:00.000")
// menimpa BALIK nilai fresh yang baru saja dihitung ulang dari DB (mis.
// totalPenalty/penaltyTime DRR jadi balik ke 0 stlh operator Switch
// Category, walau juri baru saja kirim penalty via sts-jurysystem — lihat
// hydratePenaltiesFromRegistered() di DownRiverRace.vue). Cache ini murni
// utk melindungi input yg BELUM ke-save, jadi kalau nilainya masih
// default/nol tidak ada apa2 yg perlu dilindungi — aman dianggap kosong.
function isEmptyLeaf(v) {
  return (
    v === "" ||
    v === null ||
    v === undefined ||
    v === 0 ||
    v === "00:00:00.000" ||
    (typeof v === "number" && Number.isNaN(v))
  );
}

// BUG FIX (2026-09-28): array TIM (this.participant) dulu ikut di-merge
// by INDEX sama seperti array primitif (mis. penaltySection). Itu benar
// utk penaltySection (index = nomor section, stabil), tapi FATAL utk daftar
// tim: kalau ada tim ditambah/dihapus dari Registered Teams SETELAH cache
// lokal tersimpan, index seluruh tim setelahnya ikut geser — field cache
// tim LAMA (mis. nameTeam/bibTeam/startTime) bisa "menempel" ke tim LAIN
// yang kebetulan menempati index yang sama di array fresh, membuat BIB yg
// tampil di Operation Panel/Output Racetime tidak sesuai lagi dgn Registered
// Teams walau data DB-nya sendiri benar. Sekarang: array berisi OBJECT ber-
// identitas (teamId/_id/bibTeam) di-merge berdasarkan identitas itu, bukan
// index — array primitif (string/number, spt penaltySection) tetap by index
// spt semula.
function arrayIdentityKey(item) {
  if (!item || typeof item !== "object") return null;
  if (item.teamId != null && item.teamId !== "") return "teamId:" + item.teamId;
  if (item._id != null && item._id !== "") return "_id:" + item._id;
  if (item.bibTeam != null && item.bibTeam !== "") return "bib:" + item.bibTeam;
  return null;
}

// Deep-overlay: prefer `cached`'s leaf values over `base`'s, recursing into
// arrays (matched by index, or by identity key for object arrays — lihat
// arrayIdentityKey()) and plain objects (matched by key), but only where the
// cached leaf is non-empty. Falls back to `base` wherever cached has nothing
// to offer, so freshly-fetched DB fields not present in an older cache entry
// are preserved.
function deepOverlayNonEmpty(base, cached) {
  if (cached === undefined) return base;

  if (Array.isArray(base) && Array.isArray(cached)) {
    const hasIdentity =
      base.some((b) => arrayIdentityKey(b)) ||
      cached.some((c) => arrayIdentityKey(c));

    if (hasIdentity) {
      const cachedByKey = {};
      cached.forEach((c) => {
        const k = arrayIdentityKey(c);
        if (k) cachedByKey[k] = c;
      });
      // base (fresh dari DB) yang menentukan KEANGGOTAAN & URUTAN — tim
      // yang sudah dihapus dari DB tidak akan "hidup lagi" cuma krn masih
      // ada di cache lama; cache HANYA menyumbang field draft utk tim yang
      // memang masih ada.
      return base.map((b) => {
        const k = arrayIdentityKey(b);
        const c = k && Object.prototype.hasOwnProperty.call(cachedByKey, k)
          ? cachedByKey[k]
          : undefined;
        return deepOverlayNonEmpty(b, c);
      });
    }

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
