// src/controllers/orienteering.js
//
// Modul Orienteering (mandiri, terpisah total dari event rafting):
//   orienteeringEvents       { name, image (poster) & logo: { url, publicId } | null, startDate, endDate (YYYY-MM-DD), date (= startDate, kompat. lama), location,
//                              races:   [{ id, name, location }]       jenis: Sprint Distance (Jakarta), Middle Distance (Bandung), ...
//                              types:   [{ id, name, raceIds }]        National Event, World Ranking Event, ...
//                                                                      raceIds = jenis tempat type dipertandingkan ([] = semua)
//                              classes: [{ id, name, typeId,           kategori, mis. "M21E"; 1 type = banyak kategori
//                                          courses: { raceId: [kode pos] },  course PER JENIS
//                                          controls }] }               (lama, cadangan courseOf())
//   orienteeringParticipants { eventId, raceId, name, classId, siCard (Number|null), startNo, bib, iofId,
//                              iofRanking, club, nationality, scheduledStart, manualStatus,
//                              resultOverride? (Edit Hasil: koreksi operator, kartu mentah tetap) }
//   orienteeringReadouts     { eventId, raceId, siCard, participantId, card (mentah), readAt }
//
// Start list, SI Card, readout & hasil terpisah PER JENIS (raceId) — orang
// yang ikut Sprint & Middle muncul di 2 start list. SI Card unik per jenis
// (boleh kosong: banyak peserta baru dapat kartu sewaan belakangan).
//
// Hasil SELALU dihitung ulang dari kartu mentah + course jenis tsb SAAT INI.
// Semua _id dikirim ke renderer sbg STRING (ObjectId tidak bertahan lewat IPC).
const { ObjectId } = require("mongodb");
const { getDb } = require("./index");
const {
  rankClass,
  courseOf,
  participantMatchKeys,
  typeNameForCategory,
  buildLiveSnapshot,
  categoryKey,
  participantBreakdown,
  classAppliesToRace,
  classesForRace,
  normalizeTypeRaceIds,
  evaluateWithOverride,
  normalizeResultOverride,
  STATUS,
} = require("../lib/orienteering");
const { notifyOrienteeringUpdated } = require("./socketBroadcast");

const COL_EVENTS = "orienteeringEvents";
const COL_PARTICIPANTS = "orienteeringParticipants";
const COL_READOUTS = "orienteeringReadouts";
// Snapshot hasil per jenis utk Live Result di sts-jurysystem (DB yang sama,
// jurysystem HANYA membaca). Ditulis ulang otomatis setiap ada perubahan.
const COL_LIVE = "orienteeringLiveResults";
const SI_INDEX = "eventId_1_raceId_1_siCard_1";

let indexesReady = false;
async function db() {
  const d = await getDb();
  if (!indexesReady) {
    try {
      const col = d.collection(COL_PARTICIPANTS);
      // Index versi awal (unik eventId+siCard, TANPA jenis & tanpa partial)
      // menolak banyak peserta tanpa SI Card -> dibuang kalau masih ada.
      const existing = await col.indexes().catch(() => []);
      if (existing.some((ix) => ix.name === "eventId_1_siCard_1")) {
        await col.dropIndex("eventId_1_siCard_1").catch(() => {});
      }
      await col.createIndex(
        { eventId: 1, raceId: 1, siCard: 1 },
        { name: SI_INDEX, unique: true, partialFilterExpression: { siCard: { $type: "number" } } }
      );
      await d.collection(COL_READOUTS).createIndex({ eventId: 1, raceId: 1, siCard: 1, readAt: -1 });
      indexesReady = true;
    } catch (_) {
      /* non-fatal (data lama dobel) — validasi di saveParticipant tetap jalan */
    }
  }
  return d;
}

const oid = (id) => (ObjectId.isValid(String(id || "")) ? new ObjectId(String(id)) : null);
const plain = (doc) => (doc ? { ...doc, _id: String(doc._id) } : null);
const clean = (v) => String(v === undefined || v === null ? "" : v).trim();
const toInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const controlsOf = (arr) =>
  (Array.isArray(arr) ? arr : []).map(Number).filter((n) => Number.isInteger(n) && n > 0);

function cleanImage(img) {
  if (!img || !/^https?:\/\//.test(clean(img.url))) return null;
  return {
    url: clean(img.url),
    publicId: clean(img.publicId),
    width: Number(img.width) || null,
    height: Number(img.height) || null,
  };
}

function normalizeNamed(list, prefix) {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((t, i) => ({
      id: clean(t && t.id) || `${prefix}${Date.now().toString(36)}${i}`,
      name: clean(t && t.name),
    }))
    .filter((t) => {
      const k = t.name.toUpperCase();
      if (!t.name || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

// typeIds/raceIds: id yang valid — typeId tak dikenal -> "" ("Tanpa Type"),
// course utk jenis yang sudah dihapus dibuang.
function normalizeClasses(classes, typeIds, raceIds) {
  return (Array.isArray(classes) ? classes : [])
    .map((c, i) => {
      const typeId = clean(c && c.typeId);
      const courses = {};
      const src = c && c.courses && typeof c.courses === "object" ? c.courses : {};
      Object.keys(src).forEach((rid) => {
        if (!raceIds || raceIds.has(rid)) courses[rid] = controlsOf(src[rid]);
      });
      return {
        id: clean(c && c.id) || `C${Date.now().toString(36)}${i}`,
        name: clean(c && c.name),
        typeId: typeIds && !typeIds.has(typeId) ? "" : typeId,
        courses,
        controls: controlsOf(c && c.controls),
      };
    })
    .filter((c) => c.name);
}

// Filter peserta/readout per jenis. Event lama (tanpa jenis) memakai raceId ""
// dan datanya mungkin tidak punya field raceId sama sekali.
const raceFilter = (raceId) => (raceId ? { raceId } : { raceId: { $in: ["", null] } });

/* ============================ EVENTS ============================ */

async function listEvents() {
  const d = await db();
  const events = await d
    .collection(COL_EVENTS)
    .find({})
    .sort({ startDate: -1, date: -1, createdAt: -1 })
    .toArray();
  const ids = events.map((e) => String(e._id));
  const ps = await d
    .collection(COL_PARTICIPANTS)
    .find({ eventId: { $in: ids } }, { projection: { eventId: 1, raceId: 1, classId: 1, iofId: 1, bib: 1, name: 1 } })
    .toArray();
  const byEvent = new Map();
  ps.forEach((p) => {
    if (!byEvent.has(p.eventId)) byEvent.set(p.eventId, []);
    byEvent.get(p.eventId).push(p);
  });
  // participantCount = ORANG unik (yang ikut Sprint & Middle dihitung 1x),
  // breakdown = per Type Event + kategori (kartu List Event)
  return events.map((e) => {
    const breakdown = participantBreakdown(e, byEvent.get(String(e._id)) || []);
    return { ...plain(e), participantCount: breakdown.total, breakdown };
  });
}

async function getEvent(id) {
  const _id = oid(id);
  if (!_id) return null;
  const d = await db();
  return plain(await d.collection(COL_EVENTS).findOne({ _id }));
}

async function saveEvent(payload) {
  const p = payload || {};
  const name = clean(p.name);
  if (!name) throw new Error("Nama event wajib diisi");
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const startDate = clean(p.startDate || p.date);
  let endDate = clean(p.endDate);
  if (!DATE.test(startDate)) throw new Error("Start Date wajib diisi");
  if (endDate && !DATE.test(endDate)) throw new Error("End Date tidak valid");
  if (!endDate) endDate = startDate; // event 1 hari
  if (endDate < startDate) throw new Error("End Date tidak boleh sebelum Start Date");
  // jenis + lokasi masing2 (mis. Sprint di Jakarta, Middle di Bandung)
  const raceLoc = new Map((Array.isArray(p.races) ? p.races : []).map((r) => [clean(r && r.name).toUpperCase(), clean(r && r.location)]));
  const races = normalizeNamed(p.races, "R").map((r) => ({ ...r, location: raceLoc.get(r.name.toUpperCase()) || "" }));
  // raceIds per type (mis. World Ranking Event hanya Middle) — [] = semua jenis
  const raceIdsIn = new Map((Array.isArray(p.types) ? p.types : []).map((t) => [clean(t && t.id), t && t.raceIds]));
  const allRaceIds = races.map((r) => r.id);
  const types = normalizeNamed(p.types, "T").map((t) => ({
    ...t,
    raceIds: normalizeTypeRaceIds(raceIdsIn.get(t.id), allRaceIds),
  }));
  const doc = {
    name,
    startDate,
    endDate,
    date: startDate, // kompatibilitas data/urutan lama
    location: clean(p.location),
    // poster (cover kartu) & logo (badge kartu + header halaman event) — Cloudinary
    image: cleanImage(p.image),
    logo: cleanImage(p.logo),
    races,
    types,
    classes: normalizeClasses(p.classes, new Set(types.map((t) => t.id)), new Set(races.map((r) => r.id))),
    // tampil di Live Result sts-jurysystem (default ya)
    liveVisible: p.liveVisible !== false,
    updatedAt: new Date(),
  };
  const d = await db();
  const _id = oid(p._id);
  if (_id) {
    // Type dicabut dari suatu jenis padahal masih ada peserta kategori type
    // tsb di jenis itu -> tolak (peserta "hilang" dari start list/hasil).
    const blocked = [];
    for (const t of types) {
      if (!t.raceIds.length) continue;
      const classIds = doc.classes.filter((c) => c.typeId === t.id).map((c) => c.id);
      if (!classIds.length) continue;
      for (const r of races.filter((x) => !t.raceIds.includes(x.id))) {
        const n = await d.collection(COL_PARTICIPANTS).countDocuments({ eventId: String(_id), raceId: r.id, classId: { $in: classIds } });
        if (n) blocked.push(`${t.name} masih punya ${n} peserta di ${r.name}`);
      }
    }
    if (blocked.length) {
      throw new Error(`${blocked.join("; ")}. Hapus/pindahkan peserta tersebut dulu (Reset Peserta per kategori), atau centang lagi jenisnya.`);
    }
    await d.collection(COL_EVENTS).updateOne({ _id }, { $set: doc });
    scheduleLivePublish(String(_id));
    return getEvent(String(_id));
  }
  const res = await d.collection(COL_EVENTS).insertOne({ ...doc, createdAt: new Date() });
  scheduleLivePublish(String(res.insertedId));
  return getEvent(String(res.insertedId));
}

// Simpan kategori (+ course per jenis). Type & jenis event tidak diubah.
async function saveClasses(eventId, classes) {
  const _id = oid(eventId);
  if (!_id) throw new Error("Event tidak valid");
  const d = await db();
  const ev = await d.collection(COL_EVENTS).findOne({ _id }, { projection: { types: 1, races: 1 } });
  if (!ev) throw new Error("Event tidak ditemukan");
  const typeIds = new Set((ev.types || []).map((t) => t.id));
  const raceIds = new Set((ev.races || []).map((r) => r.id));
  await d.collection(COL_EVENTS).updateOne(
    { _id },
    { $set: { classes: normalizeClasses(classes, typeIds, raceIds), updatedAt: new Date() } }
  );
  scheduleLivePublish(String(_id));
  return getEvent(eventId);
}

// Duplikat event BESERTA seluruh isinya: info event, poster/logo, jenis,
// Type, kategori + course, peserta (semua jenis, termasuk SI Card) & hasil
// baca kartu. Salinan TIDAK tampil di Live Result sampai diaktifkan.
async function duplicateEvent(id) {
  const _id = oid(id);
  if (!_id) throw new Error("Event tidak valid");
  const d = await db();
  const src = await d.collection(COL_EVENTS).findOne({ _id });
  if (!src) throw new Error("Event tidak ditemukan");
  const srcId = String(_id);

  // nama unik: "X (Salinan)", "X (Salinan 2)", ...
  const base = `${src.name} (Salinan`;
  const taken = new Set(
    (await d.collection(COL_EVENTS).find({}, { projection: { name: 1 } }).toArray()).map((e) => e.name)
  );
  let name = `${base})`;
  for (let i = 2; taken.has(name); i++) name = `${base} ${i})`;

  const now = new Date();
  const rest = { ...src };
  delete rest._id;
  delete rest.createdAt;
  delete rest.updatedAt;
  const res = await d
    .collection(COL_EVENTS)
    .insertOne({ ...rest, name, liveVisible: false, duplicatedFrom: srcId, createdAt: now, updatedAt: now });
  const newId = String(res.insertedId);

  try {
    const idMap = new Map();
    const participants = await d.collection(COL_PARTICIPANTS).find({ eventId: srcId }).toArray();
    if (participants.length) {
      const docs = participants.map((p) => {
        const nid = new ObjectId();
        idMap.set(String(p._id), String(nid));
        return { ...p, _id: nid, eventId: newId, createdAt: now, updatedAt: now };
      });
      await d.collection(COL_PARTICIPANTS).insertMany(docs, { ordered: true });
    }
    const readouts = await d.collection(COL_READOUTS).find({ eventId: srcId }).toArray();
    if (readouts.length) {
      await d.collection(COL_READOUTS).insertMany(
        readouts.map((r) => {
          const rr = { ...r, eventId: newId, participantId: idMap.get(String(r.participantId)) || "" };
          delete rr._id;
          return rr;
        }),
        { ordered: true }
      );
    }
    scheduleLivePublish(newId);
    return { event: await getEvent(newId), participants: participants.length, readouts: readouts.length };
  } catch (err) {
    // jangan tinggalkan salinan setengah jadi
    await d.collection(COL_READOUTS).deleteMany({ eventId: newId });
    await d.collection(COL_PARTICIPANTS).deleteMany({ eventId: newId });
    await d.collection(COL_EVENTS).deleteOne({ _id: res.insertedId });
    throw err;
  }
}

async function deleteEvent(id) {
  const _id = oid(id);
  if (!_id) throw new Error("Event tidak valid");
  const d = await db();
  const eventId = String(_id);
  await d.collection(COL_READOUTS).deleteMany({ eventId });
  await d.collection(COL_PARTICIPANTS).deleteMany({ eventId });
  await d.collection(COL_EVENTS).deleteOne({ _id });
  cancelLivePublish(eventId);
  await d.collection(COL_LIVE).deleteMany({ eventId });
  notifyOrienteeringUpdated({ eventId, deleted: true });
  return { ok: true };
}

/* ========================= PARTICIPANTS ========================= */

async function listParticipants(eventId, raceId) {
  const d = await db();
  const rows = await d
    .collection(COL_PARTICIPANTS)
    .find({ eventId: String(eventId), ...raceFilter(clean(raceId)) })
    .sort({ classId: 1, startNo: 1, name: 1 })
    .toArray();
  return rows.map(plain);
}

function participantDoc(p) {
  return {
    name: clean(p.name),
    classId: clean(p.classId),
    siCard: toInt(p.siCard),
    startNo: toInt(p.startNo),
    bib: clean(p.bib),
    iofId: clean(p.iofId),
    iofRanking: toInt(p.iofRanking),
    club: clean(p.club),
    nationality: clean(p.nationality),
    scheduledStart: clean(p.scheduledStart),
    manualStatus: [STATUS.DSQ, STATUS.DNS].includes(p.manualStatus) ? p.manualStatus : "",
  };
}

async function saveParticipant(payload) {
  const p = payload || {};
  const eventId = clean(p.eventId);
  const raceId = clean(p.raceId);
  if (!eventId) throw new Error("Event tidak valid");
  const doc = participantDoc(p);
  if (!doc.name) throw new Error("Nama peserta wajib diisi");
  if (!doc.classId) throw new Error("Kategori wajib dipilih");
  if (clean(p.siCard) && !doc.siCard) throw new Error("Nomor SI Card tidak valid");
  const ev = await getEvent(eventId);
  const cls = ev && (ev.classes || []).find((c) => c.id === doc.classId);
  if (ev && cls && !classAppliesToRace(ev, cls, raceId)) {
    const t = (ev.types || []).find((x) => x.id === cls.typeId);
    const r = (ev.races || []).find((x) => x.id === raceId);
    throw new Error(`Kategori ${cls.name} (${t ? t.name : "-"}) tidak dipertandingkan di ${r ? r.name : "jenis ini"}`);
  }

  const d = await db();
  const _id = oid(p._id);
  // 1 nomor SI Card = 1 peserta per jenis
  if (doc.siCard) {
    const clash = await d
      .collection(COL_PARTICIPANTS)
      .findOne({ eventId, ...raceFilter(raceId), siCard: doc.siCard, ...(_id ? { _id: { $ne: _id } } : {}) });
    if (clash) throw new Error(`SI Card ${doc.siCard} sudah dipakai oleh ${clash.name}`);
  }
  const full = { ...doc, eventId, raceId, updatedAt: new Date() };
  scheduleLivePublish(eventId);
  if (_id) {
    await d.collection(COL_PARTICIPANTS).updateOne({ _id }, { $set: full });
    return plain(await d.collection(COL_PARTICIPANTS).findOne({ _id }));
  }
  const res = await d.collection(COL_PARTICIPANTS).insertOne({ ...full, createdAt: new Date() });
  return plain(await d.collection(COL_PARTICIPANTS).findOne({ _id: res.insertedId }));
}

async function deleteParticipant(id) {
  const _id = oid(id);
  if (!_id) throw new Error("Peserta tidak valid");
  const d = await db();
  const gone = await d.collection(COL_PARTICIPANTS).findOneAndDelete({ _id });
  const doc = gone && (gone.value !== undefined ? gone.value : gone);
  if (doc && doc.eventId) scheduleLivePublish(doc.eventId);
  return { ok: true };
}

// Impor Start List (sudah dinormalisasi di renderer lewat
// normalizeImportRows()). Kategori yang belum ada dibuat otomatis & Type
// Event-nya ditentukan dari nama (typeNameForCategory: "W21E" -> World
// Ranking Event, lainnya National Event; Type dibuat kalau belum ada).
// Peserta yang sudah ada (cocok BIB -> IOF ID -> nama+kategori) DIPERBARUI,
// bukan dibuat dobel.
// eslint-disable-next-line no-unused-vars
async function importParticipants(eventId, raceId, rows, opts = {}) {
  const event = await getEvent(eventId);
  if (!event) throw new Error("Event tidak ditemukan");
  const rid = clean(raceId);
  if ((event.races || []).length && !(event.races || []).some((r) => r.id === rid)) {
    throw new Error("Jenis Orienteering tidak valid");
  }
  const list = Array.isArray(rows) ? rows : [];
  const d = await db();

  // 1) kategori baru + Type Event otomatis dari nama kategori
  const types = (event.types || []).map((t) => ({ ...t }));
  const createdTypes = [];
  const typeIdFor = (categoryName) => {
    const wanted = typeNameForCategory(categoryName);
    let t = types.find((x) => x.name.trim().toUpperCase() === wanted.toUpperCase());
    if (!t) {
      t = { id: `T${Date.now().toString(36)}${types.length}`, name: wanted };
      types.push(t);
      createdTypes.push(wanted);
    }
    return t.id;
  };
  const classes = (event.classes || []).map((c) => ({ ...c }));
  // kunci kategori: "M21 Novice" == "M21N" (lihat categoryKey) -> tidak membuat kategori dobel
  const classByName = new Map(classes.map((c) => [categoryKey(c.name), c]));
  const createdCategories = [];
  let classesChanged = false;
  list.forEach((r) => {
    const key = categoryKey(r.category);
    if (!key) return;
    const existingCls = classByName.get(key);
    if (!existingCls) {
      const cls = {
        id: `C${Date.now().toString(36)}${classes.length}`,
        name: clean(r.category),
        typeId: typeIdFor(r.category),
        courses: {},
        controls: [],
      };
      classes.push(cls);
      classByName.set(key, cls);
      createdCategories.push(cls.name);
      classesChanged = true;
    } else if (!existingCls.typeId) {
      existingCls.typeId = typeIdFor(existingCls.name); // kategori lama tanpa Type
      classesChanged = true;
    }
  });
  if (classesChanged || createdTypes.length) {
    await d.collection(COL_EVENTS).updateOne(
      { _id: new ObjectId(event._id) },
      { $set: { classes, types, updatedAt: new Date() } }
    );
  }
  const classNameById = new Map(classes.map((c) => [c.id, c.name]));

  // 2) peserta: cocokkan dgn yang sudah ada
  const existing = await listParticipants(eventId, rid);
  const byKey = new Map();
  existing.forEach((p) =>
    participantMatchKeys(p, classNameById.get(p.classId)).forEach((k) => {
      if (!byKey.has(k)) byKey.set(k, p);
    })
  );
  const siOwner = new Map(existing.filter((p) => p.siCard).map((p) => [p.siCard, p]));

  let inserted = 0;
  let updated = 0;
  const errors = [];
  const now = new Date();
  for (const r of list) {
    const cls = classByName.get(categoryKey(r.category));
    const doc = participantDoc({ ...r, classId: cls ? cls.id : "" });
    if (!doc.name || !doc.classId) {
      errors.push({ rowNo: r.rowNo, name: r.name, message: "Nama/kategori kosong" });
      continue;
    }
    if (!classAppliesToRace({ types }, cls, rid)) {
      const t = types.find((x) => x.id === cls.typeId);
      errors.push({
        rowNo: r.rowNo,
        name: doc.name,
        message: `Kategori ${cls.name} (${t ? t.name : "-"}) tidak dipertandingkan di jenis ini`,
      });
      continue;
    }
    const match = participantMatchKeys(doc, cls.name).map((k) => byKey.get(k)).find(Boolean);
    if (doc.siCard) {
      const owner = siOwner.get(doc.siCard);
      if (owner && (!match || owner._id !== match._id)) {
        errors.push({ rowNo: r.rowNo, name: doc.name, message: `SI Card ${doc.siCard} sudah dipakai ${owner.name}` });
        continue;
      }
    }
    try {
      if (match) {
        await d
          .collection(COL_PARTICIPANTS)
          .updateOne({ _id: new ObjectId(match._id) }, { $set: { ...doc, eventId, raceId: rid, updatedAt: now } });
        if (match.siCard && match.siCard !== doc.siCard) siOwner.delete(match.siCard);
        if (doc.siCard) siOwner.set(doc.siCard, match);
        updated++;
      } else {
        const res = await d
          .collection(COL_PARTICIPANTS)
          .insertOne({ ...doc, eventId, raceId: rid, createdAt: now, updatedAt: now });
        const created = { ...doc, _id: String(res.insertedId) };
        participantMatchKeys(created, cls.name).forEach((k) => byKey.set(k, created));
        if (doc.siCard) siOwner.set(doc.siCard, created);
        inserted++;
      }
    } catch (err) {
      errors.push({ rowNo: r.rowNo, name: doc.name, message: err && err.message ? err.message : String(err) });
    }
  }
  scheduleLivePublish(String(eventId));
  return { inserted, updated, errors, createdCategories, createdTypes, event: await getEvent(eventId) };
}

// Import SI Card (SPORTident) utk 1 jenis. items (hasil pratinjau yg sudah
// dikonfirmasi operator, lib planSiAssign + siApplyPayload):
//   { participantId, siCard }        pasang / ganti SI Card
//   { participantId, siCard: null }  lepas SI Card (dikosongkan di file)
//   { create: {name,classId,bib,iofId,club,nationality}, siCard|null }  peserta baru
// Divalidasi ulang di sini: peserta milik event & jenis ini, kategori peserta
// baru dipertandingkan di jenis ini, dan 1 SI Card = 1 peserta per jenis
// SETELAH semua perubahan (pindah/tukar kartu dlm 1 file boleh). Disimpan
// bertahap (lepas -> pasang -> buat baru) supaya unique index
// eventId+raceId+siCard tidak bentrok di tengah jalan.
async function assignSiCards(eventId, raceId, items) {
  const id = clean(eventId);
  if (!oid(id)) throw new Error("Event tidak valid");
  const rid = clean(raceId);
  const event = await getEvent(id);
  if (!event) throw new Error("Event tidak ditemukan");
  const d = await db();
  const ps = await listParticipants(id, rid);
  const byId = new Map(ps.map((p) => [p._id, p]));
  const errors = [];
  const want = new Map(); // participantId -> siCard | null
  const creates = []; // { doc, siCard }
  (Array.isArray(items) ? items : []).forEach((it) => {
    const raw = it && it.siCard;
    const n = raw === null || raw === undefined || raw === "" ? null : Number(raw);
    if (n !== null && (!Number.isInteger(n) || n <= 0)) {
      errors.push({ name: (it.create && it.create.name) || "", message: "Nomor SI Card tidak valid" });
      return;
    }
    if (it && it.create) {
      const doc = participantDoc({ ...it.create, siCard: n });
      const cls = (event.classes || []).find((c) => c.id === doc.classId);
      if (!doc.name || !cls) return errors.push({ name: doc.name, message: "Nama / kategori tidak valid" });
      if (!classAppliesToRace(event, cls, rid)) return errors.push({ name: doc.name, message: `Kategori ${cls.name} tidak dipertandingkan di jenis ini` });
      creates.push({ doc, siCard: n });
      return;
    }
    const p = byId.get(clean(it && it.participantId));
    if (!p) return errors.push({ participantId: it && it.participantId, message: "Peserta tidak ditemukan di jenis ini" });
    want.set(p._id, n);
  });

  // keadaan akhir: kartu -> pemilik (peserta lama + peserta baru)
  const finalOwner = new Map();
  ps.forEach((p) => {
    const card = want.has(p._id) ? want.get(p._id) : p.siCard ? Number(p.siCard) : null;
    if (!card) return;
    if (finalOwner.has(card)) {
      const other = byId.get(finalOwner.get(card));
      const who = want.has(p._id) ? p : other;
      errors.push({ participantId: who._id, name: who.name, message: `SI Card ${card} juga dipakai ${who === p ? other.name : p.name}` });
      want.delete(who._id);
      return;
    }
    finalOwner.set(card, p._id);
  });
  const okCreates = creates.filter((c) => {
    if (!c.siCard) return true;
    if (finalOwner.has(c.siCard)) {
      errors.push({ name: c.doc.name, message: `SI Card ${c.siCard} sudah dipakai ${byId.get(finalOwner.get(c.siCard)).name}` });
      return false;
    }
    finalOwner.set(c.siCard, `new:${c.doc.name}`);
    return true;
  });

  const changes = [...want.entries()].filter(([pid, card]) => (byId.get(pid).siCard ? Number(byId.get(pid).siCard) : null) !== card);
  const now = new Date();
  if (changes.length) {
    // tahap 1: lepas kartu lama (+ koreksi hasil yg merujuk kartu lama)
    await d.collection(COL_PARTICIPANTS).updateMany(
      { _id: { $in: changes.map(([pid]) => oid(pid)) } },
      { $set: { siCard: null, updatedAt: now }, $unset: { resultOverride: "" } }
    );
    // tahap 2: pasang kartu baru
    for (const [pid, card] of changes) {
      if (!card) continue;
      try {
        await d.collection(COL_PARTICIPANTS).updateOne({ _id: oid(pid) }, { $set: { siCard: card, updatedAt: now } });
      } catch (err) {
        errors.push({ participantId: pid, name: byId.get(pid).name, message: (err && err.message) || "Gagal menyimpan" });
      }
    }
  }
  // tahap 3: peserta baru
  let created = 0;
  for (const c of okCreates) {
    try {
      await d.collection(COL_PARTICIPANTS).insertOne({ ...c.doc, eventId: id, raceId: rid, createdAt: now, updatedAt: now });
      created++;
    } catch (err) {
      errors.push({ name: c.doc.name, message: (err && err.message) || "Gagal menambah peserta" });
    }
  }
  scheduleLivePublish(id);
  return {
    assigned: changes.filter(([pid, card]) => card && !byId.get(pid).siCard).length,
    changed: changes.filter(([pid, card]) => card && byId.get(pid).siCard).length,
    removed: changes.filter(([, card]) => !card).length,
    created,
    unchanged: want.size - changes.length,
    errors,
  };
}

/* =========================== READOUTS =========================== */

// Hasil satu peserta dari kartu terakhirnya (+ status manual operator).
function resultFor(participant, cls, readout, raceId) {
  const base = {
    participantId: participant._id,
    name: participant.name,
    club: participant.club || "",
    bib: participant.bib || "",
    nationality: participant.nationality || "",
    startNo: participant.startNo || null,
    siCard: participant.siCard || null,
    classId: participant.classId,
    className: cls ? cls.name : "-",
    manualStatus: participant.manualStatus || "",
    scheduledStart: participant.scheduledStart || "",
    readAt: readout ? readout.readAt : null,
  };
  const ov = participant.resultOverride || null;
  const card = readout ? readout.card : null;
  const overrideInfo = {
    override: ov,
    editNote: ov ? ov.note || "" : "",
    editedAt: ov ? ov.editedAt || null : null,
    // punch ASLI kartu (sebelum koreksi) — ditampilkan di modal Edit Hasil
    cardStart: (card && card.start) || null,
    cardFinish: (card && card.finish) || null,
  };
  // waktu dari SI Card (jadwal start tidak dipakai) + koreksi operator kalau ada
  const ev = evaluateWithOverride(readout ? readout.card : null, ov, { controls: courseOf(cls, raceId) });
  if (!ev) {
    return { ...base, ...overrideInfo, edited: false, status: participant.manualStatus || STATUS.DNS, timeSec: null, time: "-", missing: [], splits: [] };
  }
  return {
    ...base,
    ...ev,
    ...overrideInfo,
    // status koreksi operator > DSQ manual > hasil hitungan
    status: ov && ov.status ? ev.status : participant.manualStatus === STATUS.DSQ ? STATUS.DSQ : ev.status,
  };
}

// Edit Hasil: simpan / hapus koreksi operator utk 1 peserta (per jenis).
// override null / kosong = hapus koreksi (kembali ke hasil SI Card murni).
// Hasil & peringkat dihitung ulang otomatis (getResults selalu re-rank)
// lalu Live Result dipublikasikan ulang.
async function saveResultOverride(participantId, input) {
  const _id = oid(participantId);
  if (!_id) throw new Error("Peserta tidak valid");
  const d = await db();
  const p = await d.collection(COL_PARTICIPANTS).findOne({ _id });
  if (!p) throw new Error("Peserta tidak ditemukan");
  const ov = input === null ? null : normalizeResultOverride(input);
  if (!ov) {
    await d.collection(COL_PARTICIPANTS).updateOne({ _id }, { $unset: { resultOverride: "" }, $set: { updatedAt: new Date() } });
  } else {
    // paksa OK hanya boleh kalau ada waktu (start & finish dari kartu / koreksi)
    if (ov.status === STATUS.OK) {
      const ev = await getEvent(p.eventId);
      const cls = ev && (ev.classes || []).find((c) => c.id === p.classId);
      const readout = p.siCard
        ? await d
            .collection(COL_READOUTS)
            .find({ eventId: p.eventId, ...raceFilter(p.raceId || ""), siCard: p.siCard })
            .sort({ readAt: -1 })
            .limit(1)
            .next()
        : null;
      const check = evaluateWithOverride(readout ? readout.card : null, { ...ov, status: "" }, { controls: courseOf(cls, p.raceId || "") });
      if (!check || !Number.isFinite(check.timeSec)) {
        throw new Error("Status OK butuh waktu Start & Finish — isi koreksi Start/Finish dulu");
      }
    }
    await d
      .collection(COL_PARTICIPANTS)
      .updateOne({ _id }, { $set: { resultOverride: { ...ov, editedAt: new Date() }, updatedAt: new Date() } });
  }
  scheduleLivePublish(p.eventId);
  return { ok: true, override: ov };
}

// Simpan 1 hasil baca kartu ke jenis `raceId`, cocokkan ke peserta jenis itu
// lewat nomor SI Card, lalu kembalikan hasil terhitung.
async function saveReadout(eventId, raceId, card) {
  const event = await getEvent(eventId);
  if (!event) throw new Error("Event tidak ditemukan");
  const rid = clean(raceId);
  const siCard = Number(card && card.card_number);
  if (!Number.isInteger(siCard) || siCard <= 0) throw new Error("Nomor kartu tidak terbaca");
  const d = await db();
  const participant = plain(
    await d.collection(COL_PARTICIPANTS).findOne({ eventId: String(eventId), ...raceFilter(rid), siCard })
  );
  const doc = {
    eventId: String(eventId),
    raceId: rid,
    siCard,
    participantId: participant ? participant._id : "",
    card: {
      cardType: card.cardType || "",
      card_number: siCard,
      start: card.start || null,
      finish: card.finish || null,
      check: card.check || null,
      clear: card.clear || null,
      punches: Array.isArray(card.punches)
        ? card.punches.map((p) => ({ station: Number(p.station), time: String(p.time || "") }))
        : [],
    },
    readAt: new Date(),
  };
  const res = await d.collection(COL_READOUTS).insertOne(doc);
  const readout = { ...doc, _id: String(res.insertedId) };
  scheduleLivePublish(String(eventId));
  if (!participant) return { ok: true, known: false, siCard, readout };
  const cls = (event.classes || []).find((c) => c.id === participant.classId) || null;
  return { ok: true, known: true, siCard, readout, participant, result: resultFor(participant, cls, readout, rid) };
}

// Hasil per kategori utk satu jenis: kartu TERAKHIR tiap peserta, dihitung
// ulang dgn course kategori di jenis itu, lalu diperingkat.
async function getResults(eventId, raceId) {
  const event = await getEvent(eventId);
  if (!event) throw new Error("Event tidak ditemukan");
  const rid = clean(raceId);
  const d = await db();
  const participants = await listParticipants(eventId, rid);
  const latest = await d
    .collection(COL_READOUTS)
    .aggregate([
      { $match: { eventId: String(eventId), ...raceFilter(rid) } },
      { $sort: { readAt: -1 } },
      { $group: { _id: "$siCard", doc: { $first: "$$ROOT" } } },
    ])
    .toArray();
  const bySi = new Map(latest.map((x) => [Number(x._id), x.doc]));
  const classes = classesForRace(event, rid); // Type yg tidak dipertandingkan di jenis ini tidak tampil
  const typeName = new Map((event.types || []).map((t) => [t.id, t.name]));
  const byClass = classes.map((cls) => {
    const rows = participants
      .filter((p) => p.classId === cls.id)
      .map((p) => resultFor(p, cls, p.siCard ? bySi.get(Number(p.siCard)) : null, rid));
    return {
      classId: cls.id,
      className: cls.name,
      typeId: cls.typeId || "",
      typeName: typeName.get(cls.typeId) || "",
      controls: courseOf(cls, rid),
      results: rankClass(rows),
    };
  });
  const unknownCards = latest
    .filter((x) => !participants.some((p) => Number(p.siCard) === Number(x._id)))
    .map((x) => ({ siCard: Number(x._id), readAt: x.doc.readAt }));
  return { event, raceId: rid, classes: byClass, unknownCards };
}

/* ============================ RESET ============================ */

// Jumlah data yang akan terhapus oleh Reset Event (ditampilkan di modal).
async function resetSummary(eventId) {
  const id = clean(eventId);
  const d = await db();
  const [participants, readouts, withSi] = await Promise.all([
    d.collection(COL_PARTICIPANTS).countDocuments({ eventId: id }),
    d.collection(COL_READOUTS).countDocuments({ eventId: id }),
    d.collection(COL_PARTICIPANTS).countDocuments({ eventId: id, siCard: { $type: "number" } }),
  ]);
  return { participants, readouts, siCards: withSi };
}

// Reset Event: hapus SEMUA peserta, SI Card, hasil baca kartu & hasil di
// semua jenis. Data event (nama, tanggal, jenis, type) tetap; kategori &
// course ikut dikosongkan hanya kalau clearClasses.
async function resetEvent(eventId, opts = {}) {
  const _id = oid(eventId);
  if (!_id) throw new Error("Event tidak valid");
  const d = await db();
  const ev = await d.collection(COL_EVENTS).findOne({ _id }, { projection: { _id: 1 } });
  if (!ev) throw new Error("Event tidak ditemukan");
  const id = String(_id);
  const participants = (await d.collection(COL_PARTICIPANTS).deleteMany({ eventId: id })).deletedCount || 0;
  const readouts = (await d.collection(COL_READOUTS).deleteMany({ eventId: id })).deletedCount || 0;
  if (opts.clearClasses) {
    await d.collection(COL_EVENTS).updateOne({ _id }, { $set: { classes: [], updatedAt: new Date() } });
  }
  scheduleLivePublish(id);
  return { participants, readouts, clearedClasses: !!opts.clearClasses, event: await getEvent(id) };
}

// Reset Peserta & SI Card utk SATU jenis — satu kategori (classId) atau
// semua kategori (classId kosong).
//   mode "delete": hapus peserta + hasil baca kartunya
//   mode "si"    : peserta tetap, nomor SI Card dikosongkan + hasil baca
//                  kartu lama dihapus (supaya kartu yg dipinjamkan ulang
//                  tidak membawa hasil peserta sebelumnya)
// "Semua kategori" + delete juga membersihkan kartu tak dikenal di jenis tsb.
async function resetParticipants(eventId, raceId, opts = {}) {
  const id = clean(eventId);
  if (!oid(id)) throw new Error("Event tidak valid");
  const rid = clean(raceId);
  const classId = clean(opts.classId);
  const mode = opts.mode === "si" ? "si" : "delete";
  const d = await db();
  const filter = { eventId: id, ...raceFilter(rid), ...(classId ? { classId } : {}) };
  const rows = await d.collection(COL_PARTICIPANTS).find(filter, { projection: { _id: 1, siCard: 1 } }).toArray();
  const ids = rows.map((r) => r._id);
  const siCards = rows.map((r) => r.siCard).filter((n) => Number.isInteger(n) && n > 0);

  let participants = 0;
  if (mode === "delete") {
    participants = ids.length ? (await d.collection(COL_PARTICIPANTS).deleteMany({ _id: { $in: ids } })).deletedCount || 0 : 0;
  } else if (siCards.length) {
    participants = (
      await d
        .collection(COL_PARTICIPANTS)
        .updateMany(
          { _id: { $in: ids }, siCard: { $in: siCards } },
          { $set: { siCard: null, updatedAt: new Date() }, $unset: { resultOverride: "" } }
        )
    ).modifiedCount || 0;
  }

  const readoutFilter =
    mode === "delete" && !classId
      ? { eventId: id, ...raceFilter(rid) }
      : { eventId: id, ...raceFilter(rid), $or: [{ siCard: { $in: siCards } }, { participantId: { $in: ids.map(String) } }] };
  const readouts = (await d.collection(COL_READOUTS).deleteMany(readoutFilter)).deletedCount || 0;

  scheduleLivePublish(id);
  return { mode, participants, siCards: siCards.length, readouts };
}

/* ====================== LIVE RESULT (jurysystem) ====================== */

// Tulis ulang snapshot hasil SEMUA jenis satu event ke COL_LIVE, lalu
// broadcast "orienteering:updated" supaya Live Result langsung refetch.
// Selalu dihitung ulang dari kartu mentah -> otomatis "latest wins".
async function publishLive(eventId) {
  const event = await getEvent(eventId);
  const d = await db();
  if (!event) {
    await d.collection(COL_LIVE).deleteMany({ eventId: String(eventId) });
    return { ok: true, races: 0 };
  }
  const raceIds = (event.races || []).length ? event.races.map((r) => r.id) : [""];
  const now = new Date();
  for (const rid of raceIds) {
    const snap = buildLiveSnapshot(await getResults(event._id, rid));
    await d
      .collection(COL_LIVE)
      .updateOne(
        { eventId: event._id, raceId: rid },
        { $set: { eventId: event._id, raceId: rid, ...snap, updatedAt: now } },
        { upsert: true }
      );
  }
  // snapshot jenis yang sudah dihapus dari event
  await d.collection(COL_LIVE).deleteMany({ eventId: event._id, raceId: { $nin: raceIds } });
  notifyOrienteeringUpdated({ eventId: event._id });
  return { ok: true, races: raceIds.length };
}

// Debounce per event (impor/edit beruntun cukup 1x publish). Gagal (mis.
// jaringan putus) -> dicoba lagi 15 dtk kemudian; perubahan berikutnya
// tetap menjadwalkan ulang, jadi data terakhir yang menang.
const LIVE_DEBOUNCE_MS = 1200;
const LIVE_RETRY_MS = 15000;
const liveTimers = new Map();
function scheduleLivePublish(eventId, delay = LIVE_DEBOUNCE_MS) {
  const key = String(eventId || "");
  if (!key) return;
  clearTimeout(liveTimers.get(key));
  liveTimers.set(
    key,
    setTimeout(() => {
      liveTimers.delete(key);
      publishLive(key).catch(async (err) => {
        // event dihapus saat publish berjalan -> bersihkan sisa snapshot, jangan coba lagi
        const stillThere = await getEvent(key).catch(() => true);
        if (!stillThere) {
          await publishLive(key).catch(() => {});
          return;
        }
        // eslint-disable-next-line no-console
        console.warn("[orienteering] publish live gagal, coba lagi:", err && err.message);
        scheduleLivePublish(key, LIVE_RETRY_MS);
      });
    }, delay)
  );
}
function cancelLivePublish(eventId) {
  const key = String(eventId || "");
  clearTimeout(liveTimers.get(key));
  liveTimers.delete(key);
}

module.exports = {
  publishLive,
  resetEvent,
  resetParticipants,
  assignSiCards,
  saveResultOverride,
  duplicateEvent,
  resetSummary,
  listEvents,
  getEvent,
  saveEvent,
  saveClasses,
  deleteEvent,
  listParticipants,
  saveParticipant,
  deleteParticipant,
  importParticipants,
  saveReadout,
  getResults,
};
