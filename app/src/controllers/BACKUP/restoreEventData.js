const { getDb } = require("../index");
const { ObjectId } = require("mongodb");
const { RESET_COLLECTIONS, buildEventFilter } = require("../DELETE/resetEventData");

// Kebalikan dari backupEventData.js — menulis balik satu "step" koleksi
// dari file backup ke database. Restore MENIMPA (replace) data event yang
// sedang berjalan, sama seperti Reset Data, KECUALI utk teamsCollection
// (data global lintas event) yang di-upsert per-dokumen, tidak pernah
// di-deleteMany, supaya tidak menghapus tim yang juga dipakai event lain.
async function restoreOneCollectionForEvent(eventId, collectionName, docs) {
  const id = String(eventId || "");
  const rows = Array.isArray(docs) ? docs : [];
  if (!id) return { ok: false, error: "eventId kosong" };

  const db = await getDb();

  if (collectionName === "eventsCollection") {
    if (!ObjectId.isValid(id)) {
      return { ok: false, collection: collectionName, error: "eventId tidak valid" };
    }
    if (rows.length === 0) return { ok: true, collection: collectionName, restoredCount: 0 };
    const doc = { ...rows[0], _id: new ObjectId(id) };
    await db
      .collection("eventsCollection")
      .replaceOne({ _id: new ObjectId(id) }, doc, { upsert: true });
    return { ok: true, collection: collectionName, restoredCount: 1 };
  }

  if (collectionName === "teamsCollection") {
    let n = 0;
    for (const doc of rows) {
      if (!doc || !doc._id) continue;
      await db
        .collection("teamsCollection")
        .replaceOne({ _id: doc._id }, doc, { upsert: true });
      n++;
    }
    return { ok: true, collection: collectionName, restoredCount: n };
  }

  const cfg = RESET_COLLECTIONS.find((c) => c.name === collectionName);
  if (!cfg) return { ok: false, error: "Koleksi tidak dikenal: " + collectionName };

  if (cfg.mode === "pullJudgesArray") {
    let n = 0;
    for (const entry of rows) {
      const email = entry && entry.email ? String(entry.email) : "";
      if (!email) continue;
      const now = new Date();
      await db.collection(cfg.name).updateOne(
        { email },
        {
          $setOnInsert: { createdAt: now },
          $set: {
            username: entry.username || email,
            id: entry.id || "",
            updatedAt: now,
          },
        },
        { upsert: true }
      );
      await db.collection(cfg.name).updateOne({ email }, { $pull: { judges: { eventId: id } } });
      const judges = Array.isArray(entry.judges) ? entry.judges : [];
      if (judges.length > 0) {
        await db
          .collection(cfg.name)
          .updateOne({ email }, { $push: { judges: { $each: judges } } });
      }
      n++;
    }
    return { ok: true, collection: cfg.name, restoredCount: n };
  }

  if (cfg.mode === "deleteOneDoc") {
    await db.collection(cfg.name).deleteOne({ eventId: id });
    if (rows.length > 0) {
      await db.collection(cfg.name).insertOne(rows[0]);
    }
    return { ok: true, collection: cfg.name, restoredCount: rows.length > 0 ? 1 : 0 };
  }

  const filter = buildEventFilter(id, cfg);
  if (!filter) return { ok: true, collection: cfg.name, restoredCount: 0 };
  await db.collection(cfg.name).deleteMany(filter);
  if (rows.length > 0) {
    await db.collection(cfg.name).insertMany(rows);
  }
  return { ok: true, collection: cfg.name, restoredCount: rows.length };
}

module.exports = {
  restoreOneCollectionForEvent,
};
