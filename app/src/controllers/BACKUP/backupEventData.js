const { getDb } = require("../index");
const { ObjectId } = require("mongodb");
const { RESET_COLLECTIONS, buildEventFilter } = require("../DELETE/resetEventData");

// Fitur Backup Data Event: snapshot SEMUA koleksi yang terhubung ke satu
// event (dasarnya sama persis dengan RESET_COLLECTIONS di resetEventData.js
// — supaya cakupannya selalu sinkron dengan apa yang Reset Data hapus),
// DITAMBAH dua koleksi yang SENGAJA tidak disentuh Reset Data:
//   - eventsCollection: dokumen event itu sendiri (nama, poster, settings
//     kategori, dsb)
//   - teamsCollection: profil master tim (nama, bib, negara, dsb) yang
//     TERDAFTAR di event ini — supaya file backup self-contained walau
//     teamsCollection (data global, dipakai lintas event) berubah/hilang
//     di kemudian hari.
const BACKUP_STEPS = [
  { name: "eventsCollection", label: "Event Info" },
  ...RESET_COLLECTIONS.map((c) => ({ name: c.name, label: c.label })),
  { name: "teamsCollection", label: "Profil Tim Terdaftar" },
];

function getBackupSteps() {
  return BACKUP_STEPS;
}

async function backupEventDoc(eventId) {
  if (!ObjectId.isValid(eventId)) return [];
  const db = await getDb();
  const doc = await db.collection("eventsCollection").findOne({ _id: new ObjectId(eventId) });
  return doc ? [doc] : [];
}

// Kumpulkan pasangan (nameTeam, bibTeam) dari SEMUA bucket
// teamsRegisteredCollection milik event ini, lalu cari profil master-nya
// di teamsCollection. Match by nameTeam+bibTeam karena itulah satu-satunya
// hubungan yang ada (teamsCollection tidak punya field eventId — lihat
// catatan di insertTeamsRegistered.js/insertTeams.js).
async function backupReferencedTeams(eventId) {
  const db = await getDb();
  const buckets = await db
    .collection("teamsRegisteredCollection")
    .find({ eventId: String(eventId || "") })
    .toArray();

  const pairs = new Map();
  buckets.forEach((b) => {
    (Array.isArray(b.teams) ? b.teams : []).forEach((t) => {
      const name = String((t && t.nameTeam) || "").trim().toUpperCase();
      const bib = String((t && t.bibTeam) || "").trim();
      if (!name) return;
      pairs.set(name + "|" + bib, { nameTeam: name, bibTeam: bib });
    });
  });

  if (pairs.size === 0) return [];

  const or = [...pairs.values()].map((p) => ({ nameTeam: p.nameTeam, bibTeam: p.bibTeam }));
  return db.collection("teamsCollection").find({ $or: or }).toArray();
}

// Backup satu "step" (dipakai renderer utk progress bar bertahap, sama pola
// dengan event:reset-data:step).
async function backupOneCollectionForEvent(eventId, collectionName) {
  const id = String(eventId || "");
  if (!id) return { ok: false, error: "eventId kosong" };

  if (collectionName === "eventsCollection") {
    const docs = await backupEventDoc(id);
    return { ok: true, collection: collectionName, docs, count: docs.length };
  }

  if (collectionName === "teamsCollection") {
    const docs = await backupReferencedTeams(id);
    return { ok: true, collection: collectionName, docs, count: docs.length };
  }

  const cfg = RESET_COLLECTIONS.find((c) => c.name === collectionName);
  if (!cfg) return { ok: false, error: "Koleksi tidak dikenal: " + collectionName };

  const db = await getDb();

  if (cfg.mode === "pullJudgesArray") {
    // Simpan HANYA entry judges[] milik event ini per user (bukan seluruh
    // dokumen user — dokumen itu dipakai bersama utk event lain juga).
    const users = await db
      .collection(cfg.name)
      .find({ "judges.eventId": id })
      .toArray();
    const docs = users.map((u) => ({
      email: u.email,
      username: u.username,
      id: u.id,
      judges: (Array.isArray(u.judges) ? u.judges : []).filter(
        (j) => String((j && j.eventId) || "") === id
      ),
    }));
    return { ok: true, collection: cfg.name, docs, count: docs.length };
  }

  if (cfg.mode === "deleteOneDoc") {
    const doc = await db.collection(cfg.name).findOne({ eventId: id });
    const docs = doc ? [doc] : [];
    return { ok: true, collection: cfg.name, docs, count: docs.length };
  }

  const filter = buildEventFilter(id, cfg);
  if (!filter) return { ok: true, collection: cfg.name, docs: [], count: 0 };
  const docs = await db.collection(cfg.name).find(filter).toArray();
  return { ok: true, collection: cfg.name, docs, count: docs.length };
}

module.exports = {
  BACKUP_STEPS,
  getBackupSteps,
  backupOneCollectionForEvent,
};
