// controllers/UPDATE/editRaceSettings.js
const { getDb } = require("../index");

async function upsertRaceSettingsByEventId(eventId, settings) {
  if (!eventId || typeof eventId !== "string") {
    throw new Error("eventId is required (string)");
  }

  const safeEventId = String(eventId).trim();
  const safe = (obj) => (obj && typeof obj === "object" ? obj : {});

  // Sanitasi minimal (biar selalu konsisten)
  const incoming = safe(settings);
  const cleanSettings = {
    h2h: {
      R1: !!(incoming.h2h && incoming.h2h.R1),
      R2: !!(incoming.h2h && incoming.h2h.R2),
      L1: !!(incoming.h2h && incoming.h2h.L1),
      L2: !!(incoming.h2h && incoming.h2h.L2),
    },
    slalom: {
      totalGate: Math.max(
        1,
        Math.min(14, parseInt(incoming.slalom && incoming.slalom.totalGate, 10) || 14)
      ),
    },
    drr: {
      totalSection: Math.max(
        1,
        Math.min(6, parseInt(incoming.drr && incoming.drr.totalSection, 10) || 5)
      ),
    },
    rx: (() => {
      const teamsPerHeat = Math.max(
        3,
        Math.min(8, parseInt(incoming.rx && incoming.rx.teamsPerHeat, 10) || 4)
      );
      const qualifiersPerHeat = Math.max(
        1,
        Math.min(
          teamsPerHeat - 1,
          parseInt(incoming.rx && incoming.rx.qualifiersPerHeat, 10) || 2
        )
      );
      const gate1Enabled =
        incoming.rx && incoming.rx.gate1 && incoming.rx.gate1.enabled !== undefined
          ? !!incoming.rx.gate1.enabled
          : true;
      const gate2Enabled =
        incoming.rx && incoming.rx.gate2 && incoming.rx.gate2.enabled !== undefined
          ? !!incoming.rx.gate2.enabled
          : true;
      return {
        teamsPerHeat,
        qualifiersPerHeat,
        gate1: { enabled: gate1Enabled },
        gate2: { enabled: gate2Enabled },
      };
    })(),
  };

  const db = await getDb();
  const col = db.collection("raceSettings");

  const now = new Date();

  // upsert aman untuk driver v3/v4
  const res = await col.updateOne(
    { eventId: safeEventId },
    {
      $set: {
        eventId: safeEventId,
        settings: cleanSettings,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  // Ambil dokumen terbaru dari DB
  const doc = await col.findOne({ eventId: safeEventId });
  return doc || { eventId: safeEventId, settings: cleanSettings, updatedAt: now };
}

module.exports = { upsertRaceSettingsByEventId };