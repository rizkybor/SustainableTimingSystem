const { getDb } = require("../index");

// ambil teamsRegisteredCollection DRR
async function getRegistered(filters = {}) {
  try {
    const db = await getDb();
    const col = db.collection("teamsRegisteredCollection");

    // query dasar (wajib DRR)
    const q = { eventName: "DRR" };

    if (!filters.eventId) {
      return { ok: false, error: "eventId is required" };
    }

    // normalisasi ke string biar match sama datanya
    q.eventId = String(filters.eventId);
    if (filters.initialId) q.initialId = String(filters.initialId);
    if (filters.raceId) q.raceId = String(filters.raceId);
    if (filters.divisionId) q.divisionId = String(filters.divisionId);

    // ambil data dengan projection
    const projection = {
      eventId: 1,
      initialId: 1,
      raceId: 1,
      divisionId: 1,
      eventName: 1,
      initialName: 1,
      raceName: 1,
      divisionName: 1,
      teams: 1,
    };

    const items = await col.find(q, { projection }).toArray();

    // rapikan _id jadi string
    const mapped = items.map((d) => ({
      ...d,
      _id: d._id.toString(),
    }));

    return { ok: true, items: mapped };
  } catch (err) {
    console.error("Error getRegistered:", err);
    return { ok: false, error: err.message || "getRegistered failed" };
  }
}

async function getRegisteredH2H(filters = {}) {
  try {
    const db = await getDb();
    const col = db.collection("teamsRegisteredCollection");

    // query dasar (wajib DRR)
    const q = { eventName: "HEAD2HEAD" };

    if (!filters.eventId) {
      return { ok: false, error: "eventId is required" };
    }

    // normalisasi ke string biar match sama datanya
    q.eventId = String(filters.eventId);
    if (filters.initialId) q.initialId = String(filters.initialId);
    if (filters.raceId) q.raceId = String(filters.raceId);
    if (filters.divisionId) q.divisionId = String(filters.divisionId);

    // ambil data dengan projection
    const projection = {
      eventId: 1,
      initialId: 1,
      raceId: 1,
      divisionId: 1,
      eventName: 1,
      initialName: 1,
      raceName: 1,
      divisionName: 1,
      teams: 1,
    };

    const items = await col.find(q, { projection }).toArray();

    // rapikan _id jadi string
    const mapped = items.map((d) => ({
      ...d,
      _id: d._id.toString(),
    }));

    return { ok: true, items: mapped };
  } catch (err) {
    console.error("Error getRegistered:", err);
    return { ok: false, error: err.message || "getRegistered failed" };
  }
}

async function getRegisteredSprint(filters = {}) {
  try {
    const db = await getDb();
    const col = db.collection("teamsRegisteredCollection");

    // query dasar (wajib DRR)
    const q = { eventName: "SPRINT" };

    if (!filters.eventId) {
      return { ok: false, error: "eventId is required" };
    }

    // normalisasi ke string biar match sama datanya
    q.eventId = String(filters.eventId);
    if (filters.initialId) q.initialId = String(filters.initialId);
    if (filters.raceId) q.raceId = String(filters.raceId);
    if (filters.divisionId) q.divisionId = String(filters.divisionId);

    // ambil data dengan projection
    const projection = {
      eventId: 1,
      initialId: 1,
      raceId: 1,
      divisionId: 1,
      eventName: 1,
      initialName: 1,
      raceName: 1,
      divisionName: 1,
      teams: 1,
    };

    const items = await col.find(q, { projection }).toArray();

    // rapikan _id jadi string
    const mapped = items.map((d) => ({
      ...d,
      _id: d._id.toString(),
    }));

    return { ok: true, items: mapped };
  } catch (err) {
    console.error("Error getRegistered:", err);
    return { ok: false, error: err.message || "getRegistered failed" };
  }
}

async function getRegisteredSlalom(filters = {}) {
  try {
    const db = await getDb();
    const col = db.collection("teamsRegisteredCollection");

    // query dasar (wajib DRR)
    const q = { eventName: "SLALOM" };

    if (!filters.eventId) {
      return { ok: false, error: "eventId is required" };
    }

    // normalisasi ke string biar match sama datanya
    q.eventId = String(filters.eventId);
    if (filters.initialId) q.initialId = String(filters.initialId);
    if (filters.raceId) q.raceId = String(filters.raceId);
    if (filters.divisionId) q.divisionId = String(filters.divisionId);

    // ambil data dengan projection
    const projection = {
      eventId: 1,
      initialId: 1,
      raceId: 1,
      divisionId: 1,
      eventName: 1,
      initialName: 1,
      raceName: 1,
      divisionName: 1,
      teams: 1,
    };

    const items = await col.find(q, { projection }).toArray();

    // rapikan _id jadi string
    const mapped = items.map((d) => ({
      ...d,
      _id: d._id.toString(),
    }));

    return { ok: true, items: mapped };
  } catch (err) {
    console.error("Error getRegistered:", err);
    return { ok: false, error: err.message || "getRegistered failed" };
  }
}
module.exports = {
  getRegistered,
  getRegisteredH2H,
  getRegisteredSlalom,
  getRegisteredSprint,
};
