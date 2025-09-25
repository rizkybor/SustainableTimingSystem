// controllers/GET/getRaceSettings.js
const { getDb } = require("../index");

/**
 * Ambil race settings berdasar eventId (string).
 * Koleksi: raceSettingsCollection
 * Dokumen: { eventId: "<eventId>", settings: {...}, updatedAt: Date }
 */
async function getRaceSettingsByEventId(eventId) {
  if (!eventId || typeof eventId !== "string") {
    throw new Error("eventId is required (string)");
  }

  try {
    const db = await getDb();
    const col = db.collection("raceSettings");

    const doc = await col.findOne({ eventId: eventId });
    // kalau belum ada, balikin null biar FE bisa pakai default
    return doc || null;
  } catch (err) {
    console.error("getRaceSettingsByEventId error:", err);
    throw err;
  }
}

module.exports = {
  getRaceSettingsByEventId,
};