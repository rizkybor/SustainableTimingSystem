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

  // allowNegative: KHUSUS Pilihan Pen. Section DRR — section boleh punya
  // nilai minus (mis. -10) sbg bonus/pengurang waktu, beda dari penalty
  // kategori/bagian lain yg selalu >= 0.
  const cleanPenaltyList = (raw, fallback, max, allowNegative) => {
    const arr = Array.isArray(raw) ? raw : fallback;
    const min = allowNegative ? -600 : 0;
    const clean = arr.slice(0, max || MAX_SPRINT_PENALTIES).map((p) => {
      const value = Math.max(min, Math.min(600, parseInt(p && p.value, 10) || 0));
      const label =
        String((p && p.label) || "").trim().slice(0, 40) || String(value);
      return { label, value };
    });
    return clean.length > 0 ? clean : fallback;
  };

  // Default TAMPIL (true) kalau field belum pernah diatur — dibedakan dari
  // "eksplisit dimatikan" (false) via cek undefined/null, BUKAN `!!raw`.
  const boolOrDefault = (raw, fallback) =>
    raw === undefined || raw === null ? fallback : !!raw;
  const signatureToggles = (catSrc) => ({
    showTechnicalDelegate: boolOrDefault(
      catSrc && catSrc.showTechnicalDelegate,
      true
    ),
    showChiefJudge: boolOrDefault(catSrc && catSrc.showChiefJudge, true),
    showRaceDirector: boolOrDefault(catSrc && catSrc.showRaceDirector, true),
  });

  // Default H2H PS/CL/PF sesuai nilai yang sebelumnya dipakai bersama
  // (0/5/10/50 detik) — sekarang masing-masing bisa diatur independen.
  const DEFAULT_H2H_PENALTIES = [
    { label: "0", value: 0 },
    { label: "5", value: 5 },
    { label: "10", value: 10 },
    { label: "50", value: 50 },
  ];

  // Default Pilihan Pen. Start (PS) / Pen. Finish (PF) / Pen. Gates (PG)
  // Slalom — sebelumnya hardcoded & tidak bisa dikustomisasi (PS/PF berbagi
  // {0,10,50}, Gate {0,5,50}) langsung di kode SlalomRace.vue. Sekarang
  // masing-masing independen per-event, pola sama dgn DEFAULT_H2H_PENALTIES.
  const DEFAULT_SLALOM_START_PENALTIES = [
    { label: "0", value: 0 },
    { label: "10", value: 10 },
    { label: "50", value: 50 },
  ];
  const DEFAULT_SLALOM_FINISH_PENALTIES = [
    { label: "0", value: 0 },
    { label: "10", value: 10 },
    { label: "50", value: 50 },
  ];
  const DEFAULT_SLALOM_GATE_PENALTIES = [
    { label: "0", value: 0 },
    { label: "5", value: 5 },
    { label: "50", value: 50 },
  ];

  // Default Pilihan Pen. Start (PS) / Pen. Finish (PF) / Pen. Section DRR —
  // sebelumnya hardcoded & tidak bisa dikustomisasi (PS/PF whitelist
  // {0,10,50}, Section pakai daftar optionPenalties global tanpa filter)
  // langsung di kode DownRiverRace.vue. Sekarang masing-masing independen
  // per-event, pola sama dgn DEFAULT_SLALOM_*_PENALTIES.
  const DEFAULT_DRR_START_PENALTIES = [
    { label: "0", value: 0 },
    { label: "10", value: 10 },
    { label: "50", value: 50 },
  ];
  const DEFAULT_DRR_FINISH_PENALTIES = [
    { label: "0", value: 0 },
    { label: "10", value: 10 },
    { label: "50", value: 50 },
  ];
  const DEFAULT_DRR_SECTION_PENALTIES = [
    { label: "0", value: 0 },
    { label: "5", value: 5 },
    { label: "10", value: 10 },
    { label: "50", value: 50 },
  ];

  // Default Pilihan Pen. Gate 1 (G1) / Pen. Gate 2 (G2) Rafting Cross —
  // sebelumnya kedua gate berbagi SATU daftar optionPenalties GLOBAL yang
  // sama (tidak bisa dikustomisasi per-event). Sekarang masing2 independen
  // per-event, pola sama dgn DEFAULT_SLALOM_*_PENALTIES.
  const DEFAULT_RX_GATE1_PENALTIES = [
    { label: "0", value: 0 },
    { label: "10", value: 10 },
    { label: "50", value: 50 },
  ];
  const DEFAULT_RX_GATE2_PENALTIES = [
    { label: "0", value: 0 },
    { label: "10", value: 10 },
    { label: "50", value: 50 },
  ];

  // Default tabel Rank -> Score H2H, sama persis dgn optionRanked type
  // "HEADTOHEAD" yang sebelumnya hardcoded/global — sekarang bisa
  // dikustomisasi per-event lewat Race Settings (pola sama dgn Sprint).
  const DEFAULT_H2H_SCORE_BY_RANK = [
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

  // Default tabel Rank -> Score Slalom & DRR, sama persis dgn optionRanked
  // type "SLALOM" (dan tabel hardcoded DRR) yang sebelumnya
  // hardcoded/global — sekarang bisa dikustomisasi per-event.
  const DEFAULT_SLALOM_SCORE_BY_RANK = [
    { ranking: 1, score: 350 },
    { ranking: 2, score: 322 },
    { ranking: 3, score: 301 },
    { ranking: 4, score: 287 },
    { ranking: 5, score: 277 },
    { ranking: 6, score: 266 },
    { ranking: 7, score: 256 },
    { ranking: 8, score: 245 },
    { ranking: 9, score: 235 },
    { ranking: 10, score: 224 },
    { ranking: 11, score: 214 },
    { ranking: 12, score: 203 },
    { ranking: 13, score: 193 },
    { ranking: 14, score: 182 },
    { ranking: 15, score: 172 },
    { ranking: 16, score: 161 },
    { ranking: 17, score: 151 },
    { ranking: 18, score: 140 },
    { ranking: 19, score: 133 },
    { ranking: 20, score: 126 },
    { ranking: 21, score: 119 },
    { ranking: 22, score: 112 },
    { ranking: 23, score: 105 },
    { ranking: 24, score: 98 },
    { ranking: 25, score: 91 },
    { ranking: 26, score: 84 },
    { ranking: 27, score: 77 },
    { ranking: 28, score: 70 },
    { ranking: 29, score: 63 },
    { ranking: 30, score: 56 },
    { ranking: 31, score: 49 },
    { ranking: 32, score: 42 },
  ];
  const DEFAULT_DRR_SCORE_BY_RANK = DEFAULT_SLALOM_SCORE_BY_RANK.map((p) => ({
    ...p,
  }));

  // RX belum punya kurva sendiri — dibuat mirip Sprint dulu sesuai
  // permintaan (bisa dikustomisasi belakangan per-event).
  const DEFAULT_RX_SCORE_BY_RANK = DEFAULT_SPRINT_SCORE_BY_RANK.map((p) => ({
    ...p,
  }));

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
      ...signatureToggles(incoming.sprint),
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
      scoreByRank: cleanScoreByRank(
        incoming.h2h && incoming.h2h.scoreByRank,
        DEFAULT_H2H_SCORE_BY_RANK
      ),
      // score utk rank di luar daftar scoreByRank (mis. list cuma Rank 1-4,
      // Rank 5 dst semua dapat score ini). 0 = tidak dapat score.
      defaultScoreBeyondRank: Math.max(
        0,
        Math.min(
          1000,
          parseInt(
            incoming.h2h && incoming.h2h.defaultScoreBeyondRank,
            10
          ) || 0
        )
      ),
      ...signatureToggles(incoming.h2h),
    },
    slalom: {
      totalGate: Math.max(
        1,
        Math.min(14, parseInt(incoming.slalom && incoming.slalom.totalGate, 10) || 14)
      ),
      startPenalties: cleanPenaltyList(
        incoming.slalom && incoming.slalom.startPenalties,
        DEFAULT_SLALOM_START_PENALTIES
      ),
      finishPenalties: cleanPenaltyList(
        incoming.slalom && incoming.slalom.finishPenalties,
        DEFAULT_SLALOM_FINISH_PENALTIES
      ),
      gatePenalties: cleanPenaltyList(
        incoming.slalom && incoming.slalom.gatePenalties,
        DEFAULT_SLALOM_GATE_PENALTIES
      ),
      scoreByRank: cleanScoreByRank(
        incoming.slalom && incoming.slalom.scoreByRank,
        DEFAULT_SLALOM_SCORE_BY_RANK
      ),
      defaultScoreBeyondRank: Math.max(
        0,
        Math.min(
          1000,
          parseInt(
            incoming.slalom && incoming.slalom.defaultScoreBeyondRank,
            10
          ) || 0
        )
      ),
      ...signatureToggles(incoming.slalom),
    },
    drr: {
      // Minimal 2 Section — konsep "per-section" cuma berarti kalau ada
      // minimal 2 section (Race Settings UI juga mengunci spinbutton Total
      // Section ke minimum yg sama sebelum Pilihan Pen. Section bisa diisi).
      totalSection: Math.max(
        2,
        Math.min(6, parseInt(incoming.drr && incoming.drr.totalSection, 10) || 5)
      ),
      startPenalties: cleanPenaltyList(
        incoming.drr && incoming.drr.startPenalties,
        DEFAULT_DRR_START_PENALTIES
      ),
      finishPenalties: cleanPenaltyList(
        incoming.drr && incoming.drr.finishPenalties,
        DEFAULT_DRR_FINISH_PENALTIES
      ),
      sectionPenalties: cleanPenaltyList(
        incoming.drr && incoming.drr.sectionPenalties,
        DEFAULT_DRR_SECTION_PENALTIES,
        MAX_SPRINT_PENALTIES,
        true
      ),
      scoreByRank: cleanScoreByRank(
        incoming.drr && incoming.drr.scoreByRank,
        DEFAULT_DRR_SCORE_BY_RANK
      ),
      defaultScoreBeyondRank: Math.max(
        0,
        Math.min(
          1000,
          parseInt(
            incoming.drr && incoming.drr.defaultScoreBeyondRank,
            10
          ) || 0
        )
      ),
      ...signatureToggles(incoming.drr),
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
        gate1Penalties: cleanPenaltyList(
          incoming.rx && incoming.rx.gate1Penalties,
          DEFAULT_RX_GATE1_PENALTIES
        ),
        gate2Penalties: cleanPenaltyList(
          incoming.rx && incoming.rx.gate2Penalties,
          DEFAULT_RX_GATE2_PENALTIES
        ),
        scoreByRank: cleanScoreByRank(
          incoming.rx && incoming.rx.scoreByRank,
          DEFAULT_RX_SCORE_BY_RANK
        ),
        defaultScoreBeyondRank: Math.max(
          0,
          Math.min(
            1000,
            parseInt(
              incoming.rx && incoming.rx.defaultScoreBeyondRank,
              10
            ) || 0
          )
        ),
        ...signatureToggles(incoming.rx),
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