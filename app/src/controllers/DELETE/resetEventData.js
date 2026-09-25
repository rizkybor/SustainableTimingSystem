const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

// Daftar koleksi/reset yang dijalankan oleh fitur "Reset Data" di Event
// Detail. TIDAK menyentuh master data tim (teamsCollection) maupun
// eventsCollection — tapi SEKARANG juga mereset Race Settings & Judges
// Settings kembali ke default (lihat mode: "deleteOneDoc" / "pullJudgesArray"
// di bawah), riwayat judge (judgeActionLogs), chat widget (chatMessages),
// Fouls Report H2H (h2hFoulsReports), status Start Team Slalom
// (slalomteamstatuses), dan state live sisi juri (sprintlivepreviews,
// h2hactiverounds) — beberapa di antaranya cuma ada di database sts-
// jurysystem (koleksi bersama, model Mongoose-nya ada di repo itu, bukan
// di repo ini), jadi tidak akan ketemu lewat grep di sini kalau dicari.
// `byBucket: true` berarti eventId disimpan di dalam field `bucket.eventId`
// (skema H2H/RX), selain itu eventId ada di field top-level `eventId`.
// `mode` (opsional) menandai entry yang butuh strategi reset khusus,
// bukan deleteMany({eventId}) generik — lihat deleteOneCollectionForEvent.
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
  // BUG FIX: sts-jurysystem menyimpan riwayat penalty yang sudah disubmit
  // per team di koleksi ini (eventId disimpan sbg STRING di sana, lihat
  // models/JudgeReportDetail.js) — dipakai buat menolak submit ganda
  // ("Team X sudah memiliki Start dan Finish"). Reset Data sebelumnya
  // tidak pernah menghapus koleksi ini, jadi walau tim sudah di-reset di
  // sini (teamsRegisteredCollection ikut terhapus di atas), riwayat lama
  // itu tetap ada dan PERMANEN memblokir submit baru utk team id yang
  // sama — bahkan setelah Reset Data "berhasil".
  { name: "judgereportdetails", label: "Riwayat Penalty Juri (detail)", byBucket: false },
  // Dokumen induk per (event, juri) yang isinya referensi ke detail di
  // atas — eventId di sini disimpan sbg ObjectId (bukan string), jadi
  // butuh konversi filter tersendiri (lihat eventIdType di bawah).
  { name: "judgereports", label: "Riwayat Penalty Juri (rekap per-juri)", byBucket: false, eventIdType: "objectId" },
  // BUG FIX: flag "team sudah Start" (dipakai jurysystem utk menolak
  // submit penalty Start/Finish sebelum team benar-benar mulai) tersimpan
  // permanen di sini (eventId sbg STRING, lihat
  // models/SprintTeamStatus.js di jurysystem) dan sebelumnya TIDAK
  // pernah ikut dihapus Reset Data. Akibatnya, team yang pernah "Start"
  // di sesi testing/race SEBELUMNYA tetap tampak sudah Start selamanya
  // walau race sudah di-reset — jurysystem salah meloloskan submit utk
  // team itu padahal race yang baru belum benar-benar mulai.
  { name: "sprintteamstatuses", label: "Status Start Team (Sprint)", byBucket: false },
  // BUG FIX: kelas bug yang SAMA persis dgn sprintteamstatuses di atas,
  // cuma utk Slalom — models/SlalomTeamStatus.js di sts-jurysystem (flag
  // "team sudah Start" PER RUN, dipakai jurysystem utk validasi submit
  // penalty). eventId disimpan sbg STRING. Ketinggalan sebelumnya karena
  // baru ketahuan saat audit lanjutan — dikonfirmasi lewat inspeksi
  // langsung nama koleksi di database (`slalomteamstatuses`).
  { name: "slalomteamstatuses", label: "Status Start Team (Slalom)", byBucket: false },
  // Kelas bug yang SAMA persis dgn sprintteamstatuses/slalomteamstatuses
  // di atas, utk DRR — models/DRRTeamStatus.js di sts-jurysystem (flag
  // "team sudah Start", diimplementasikan 2026-09-23 sekalian dgn
  // direct-write, lihat MEMORY-DRR.md). eventId disimpan sbg STRING.
  { name: "drrteamstatuses", label: "Status Start Team (DRR)", byBucket: false },
  // Fouls Report H2H (laporan pelanggaran fisik dari juri, murni
  // informasi — lihat MEMORY-H2H.md) — eventId disimpan sbg STRING
  // top-level (lihat insertH2HFoulsReport.js). Reset All per-kategori
  // H2H (resetH2HData.js) SUDAH menghapus ini, tapi Reset Data Event yg
  // lebih besar ini sebelumnya TIDAK — terkonfirmasi lewat inspeksi
  // langsung koleksi di database.
  { name: "h2hFoulsReports", label: "Fouls Report (Head to Head)", byBucket: false },
  // Field Notes (2026-09-22) — versi ringan Fouls Report tanpa Pen
  // Position/Detail/Unfouls Team, dipakai Sprint/Slalom/DRR/RX (lihat
  // insertFieldNotesReport.js). eventId STRING top-level, sama pola dgn
  // h2hFoulsReports di atas.
  { name: "judgeFieldNotes", label: "Field Notes (Sprint/Slalom/DRR/RX)", byBucket: false },
  // Live preview hasil Sprint SEBELUM operator klik "Save Result" —
  // models/SprintLivePreview.js di sts-jurysystem, diisi lewat relay
  // socket dari juri yang online. eventId disimpan sbg STRING. Kalau
  // tidak dihapus, juri masih bisa melihat preview hasil SESI LAMA
  // (sebelum reset) sampai ada tim baru yang genuinely Start+Finish lagi.
  { name: "sprintlivepreviews", label: "Live Preview (Sprint, sisi juri)", byBucket: false },
  // Babak H2H yang sedang aktif/dibuka operator — models/H2HActiveRound.js
  // di sts-jurysystem, diisi lewat relay socket "h2h:round-active".
  // eventId disimpan sbg STRING. Kalau tidak dihapus, dropdown Team &
  // label babak di sisi juri masih menunjuk ke babak/heat LAMA (sebelum
  // reset) sampai operator pindah babak lagi di layar H2H.
  { name: "h2hactiverounds", label: "Babak Aktif H2H (sisi juri)", byBucket: false },
  // Riwayat Judge (History) per kategori — ditampilkan di JudgeActionHistoryModal.
  // eventId disimpan sbg STRING top-level (lihat insertJudgeActionLog.js).
  { name: "judgeActionLogs", label: "Riwayat Judge (History)", byBucket: false },
  // Pesan chat widget event — eventId disimpan sbg STRING top-level
  // (lihat insertChatMessage.js).
  { name: "chatMessages", label: "Chat Widget (pesan)", byBucket: false },
  // Judges Settings: SATU dokumen per USER (keyed by email) dengan field
  // `judges` array berisi assignment per-event yg pernah dia pegang.
  // TIDAK BOLEH deleteMany dokumen (akan menghapus assignment user itu utk
  // event LAIN juga) — harus $pull entry yg eventId-nya cocok saja.
  { name: "userJudgeAssignments", label: "Judges Settings (assignment juri)", mode: "pullJudgesArray" },
  // Race Settings: SATU dokumen per event — reset ke default = hapus
  // dokumennya, komponen sudah otomatis fallback ke DEFAULT_SETTINGS lewat
  // mergeWithDefaults({}) yang sudah ada.
  { name: "raceSettings", label: "Race Settings", mode: "deleteOneDoc" },
];

// Filter identitas event standar (dipakai Reset Data, Backup, dan Restore
// supaya ketiganya selalu menunjuk ke dokumen yang SAMA persis — dipisah
// jadi fungsi sendiri biar tidak ada drift antara reset/backup/restore).
// Mengembalikan `null` utk koleksi bermode khusus (pullJudgesArray/
// deleteOneDoc) yang tidak pakai deleteMany/find filter generik ini.
function buildEventFilter(eventId, cfg) {
  const id = String(eventId || "");
  if (cfg.byBucket) return { "bucket.eventId": id };
  if (cfg.eventIdType === "objectId") {
    if (!ObjectId.isValid(id)) return null;
    return { eventId: new ObjectId(id) };
  }
  return { eventId: id };
}

async function deleteOneCollectionForEvent(eventId, collectionName) {
  const id = String(eventId || "");
  const cfg = RESET_COLLECTIONS.find((c) => c.name === collectionName);
  if (!id || !cfg) {
    return { ok: false, error: "eventId atau nama koleksi tidak valid" };
  }

  const db = await getDb();

  if (cfg.mode === "pullJudgesArray") {
    const res = await db
      .collection(cfg.name)
      .updateMany({ "judges.eventId": id }, { $pull: { judges: { eventId: id } } });
    return { ok: true, collection: cfg.name, deletedCount: res.modifiedCount || 0 };
  }

  if (cfg.mode === "deleteOneDoc") {
    const res = await db.collection(cfg.name).deleteOne({ eventId: id });
    return { ok: true, collection: cfg.name, deletedCount: res.deletedCount || 0 };
  }

  const filter = buildEventFilter(id, cfg);
  if (!filter) return { ok: true, collection: cfg.name, deletedCount: 0 };
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
  buildEventFilter,
  deleteOneCollectionForEvent,
  resetEventData,
};
