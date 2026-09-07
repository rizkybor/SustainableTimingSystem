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

  // Default sesuai Pasal 37 & 43 Peraturan Kompetisi Arung Jeram FAJI. PS
  // (Pen. Start) dan PF (Pen. Finish) punya daftar pilihan independen:
  // PS = 0 (tidak ada), 50 (kesalahan start).
  // PF = 0 (tidak ada), 10 (pelanggaran elektronik finish).
  const DEFAULT_START_PENALTIES = [
    { label: "0", value: 0 },
    { label: "50", value: 50 },
  ];
  const DEFAULT_FINISH_PENALTIES = [
    { label: "0", value: 0 },
    { label: "10", value: 10 },
  ];
  const MAX_SPRINT_PENALTIES = 8;
  const MAX_H2H_PENALTIES = 8;
  const MAX_SPRINT_SCORE_ROWS = 64;

  // Default tabel Rank -> Score Sprint, dulunya global/hardcoded lewat
  // koleksi optionRanked (type "SPRINT") — sekarang bisa dikustomisasi
  // per-event lewat Race Settings.
  const DEFAULT_SPRINT_SCORE_BY_RANK = [
    { ranking: 1, score: 100 },
    { ranking: 2, score: 92 },
    { ranking: 3, score: 86 },
    { ranking: 4, score: 82 },
    { ranking: 5, score: 79 },
    { ranking: 6, score: 76 },
    { ranking: 7, score: 73 },
    { ranking: 8, score: 70 },
    { ranking: 9, score: 67 },
    { ranking: 10, score: 64 },
    { ranking: 11, score: 61 },
    { ranking: 12, score: 58 },
    { ranking: 13, score: 55 },
    { ranking: 14, score: 52 },
    { ranking: 15, score: 49 },
    { ranking: 16, score: 46 },
    { ranking: 17, score: 43 },
    { ranking: 18, score: 40 },
    { ranking: 19, score: 38 },
    { ranking: 20, score: 36 },
    { ranking: 21, score: 34 },
    { ranking: 22, score: 32 },
    { ranking: 23, score: 30 },
    { ranking: 24, score: 28 },
    { ranking: 25, score: 26 },
    { ranking: 26, score: 24 },
    { ranking: 27, score: 22 },
    { ranking: 28, score: 20 },
    { ranking: 29, score: 18 },
    { ranking: 30, score: 16 },
    { ranking: 31, score: 14 },
    { ranking: 32, score: 12 },
  ];

  // Rank selalu dinormalisasi berurutan 1..N sesuai urutan array yang
  // dikirim (bukan nilai `ranking` dari client) — mencegah rank ganda/bolong.
  const cleanScoreByRank = (raw, fallback) => {
    const arr = Array.isArray(raw) && raw.length > 0 ? raw : fallback;
    const clean = arr.slice(0, MAX_SPRINT_SCORE_ROWS).map((p, idx) => ({
      ranking: idx + 1,
      score: Math.max(0, Math.min(1000, parseInt(p && p.score, 10) || 0)),
    }));
    return clean.length > 0 ? clean : fallback;
  };

  const cleanPenaltyList = (raw, fallback, max) => {
    const arr = Array.isArray(raw) ? raw : fallback;
    const clean = arr.slice(0, max || MAX_SPRINT_PENALTIES).map((p) => {
      const value = Math.max(0, Math.min(600, parseInt(p && p.value, 10) || 0));
      const label =
        String((p && p.label) || "").trim().slice(0, 40) || String(value);
      return { label, value };
    });
    return clean.length > 0 ? clean : fallback;
  };

  // Default H2H PS/CL/PF sesuai nilai yang sebelumnya dipakai bersama
  // (0/5/10/50 detik) — sekarang masing-masing bisa diatur independen.
  const DEFAULT_H2H_PENALTIES = [
    { label: "0", value: 0 },
    { label: "5", value: 5 },
    { label: "10", value: 10 },
    { label: "50", value: 50 },
  ];

  const cleanSettings = {
    sprint: {
      startPenalties: cleanPenaltyList(
        incoming.sprint && incoming.sprint.startPenalties,
        DEFAULT_START_PENALTIES
      ),
      finishPenalties: cleanPenaltyList(
        incoming.sprint && incoming.sprint.finishPenalties,
        DEFAULT_FINISH_PENALTIES
      ),
      scoreByRank: cleanScoreByRank(
        incoming.sprint && incoming.sprint.scoreByRank,
        DEFAULT_SPRINT_SCORE_BY_RANK
      ),
      // score utk rank di luar daftar scoreByRank (mis. list cuma Rank 1-5,
      // Rank 6 dst semua dapat score ini). 0 = tidak dapat score.
      defaultScoreBeyondRank: Math.max(
        0,
        Math.min(
          1000,
          parseInt(
            incoming.sprint && incoming.sprint.defaultScoreBeyondRank,
            10
          ) || 0
        )
      ),
    },
    h2h: {
      R1: !!(incoming.h2h && incoming.h2h.R1),
      R2: !!(incoming.h2h && incoming.h2h.R2),
      L1: !!(incoming.h2h && incoming.h2h.L1),
      L2: !!(incoming.h2h && incoming.h2h.L2),
      startPenalties: cleanPenaltyList(
        incoming.h2h && incoming.h2h.startPenalties,
        DEFAULT_H2H_PENALTIES,
        MAX_H2H_PENALTIES
      ),
      cutLinePenalties: cleanPenaltyList(
        incoming.h2h && incoming.h2h.cutLinePenalties,
        DEFAULT_H2H_PENALTIES,
        MAX_H2H_PENALTIES
      ),
      finishPenalties: cleanPenaltyList(
        incoming.h2h && incoming.h2h.finishPenalties,
        DEFAULT_H2H_PENALTIES,
        MAX_H2H_PENALTIES
      ),
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