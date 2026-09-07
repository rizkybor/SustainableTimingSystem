const { getDb } = require("../index");

// Daftar koleksi yang dihapus oleh fitur "Reset Data" di Event Detail, TANPA
// menyentuh master data tim (teamsCollection) maupun pengaturan event
// (raceSettings, userJudgeAssignments, eventsCollection).
// `byBucket: true` berarti eventId disimpan di dalam field `bucket.eventId`
// (skema H2H/RX), selain itu eventId ada di field top-level `eventId`.
const RESET_COLLECTIONS = [
  { name: "temporaryOverallEventResults", label: "Event Overall Result", byBucket: false },
  { name: "temporarySprintResult", label: "Sprint", byBucket: false },
  { name: "temporarySlalomResult", label: "Slalom", byBucket: false },
  { name: "temporaryDrrResult", label: "Down River Race", byBucket: false },
  { name: "h2h_brackets", label: "Head to Head (bracket)", byBucket: true },
  { name: "h2h_results", label: "Head to Head (hasil per-babak)", byBucket: true },
  { name: "h2h_overall", label: "Head to Head (overall)", byBucket: true },
  { name: "rx_brackets", label: "Rafting Cross (bracket)", byBucket: true },
  { name: "rx_results", label: "Rafting Cross (hasil per-babak)", byBucket: true },
  { name: "rx_overall", label: "Rafting Cross (overall)", byBucket: true },
  // Assignment tim ke bucket (divisi/race/initial/kategori) pada event ini —
  // BUKAN profil tim itu sendiri (masih aman di teamsCollection), cuma
  // status "sudah di-assign/terdaftar utk kategori X" yang direset.
  { name: "teamsRegisteredCollection", label: "Registered Teams (semua kategori)", byBucket: false },
];

async function deleteOneCollectionForEvent(eventId, collectionName) {
  const id = String(eventId || "");
  const cfg = RESET_COLLECTIONS.find((c) => c.name === collectionName);
  if (!id || !cfg) {
    return { ok: false, error: "eventId atau nama koleksi tidak valid" };
  }

  const db = await getDb();
  const filter = cfg.byBucket ? { "bucket.eventId": id } : { eventId: id };
  const res = await db.collection(cfg.name).deleteMany(filter);
  return { ok: true, collection: cfg.name, deletedCount: res.deletedCount || 0 };
}

// Hapus SEMUA koleksi sekaligus (dipakai kalau tidak butuh progress bertahap).
async function resetEventData(eventId) {
  const id = String(eventId || "");
  if (!id) return { ok: false, error: "eventId kosong" };

  const deletedCounts = {};
  for (const cfg of RESET_COLLECTIONS) {
    const r = await deleteOneCollectionForEvent(id, cfg.name);
    deletedCounts[cfg.name] = r.ok ? r.deletedCount : 0;
  }
  return { ok: true, deletedCounts };
}

module.exports = {
  RESET_COLLECTIONS,
  deleteOneCollectionForEvent,
  resetEventData,
};
