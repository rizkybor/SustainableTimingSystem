const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

// Hapus "Riwayat Judge" utk SATU kategori race saja (sprint/slalom/drr/
// h2h/rx), tidak menyentuh kategori lain punya event yang sama — dipakai
// tombol "Hapus Riwayat" di JudgeActionHistoryModal.vue. Sengaja
// dipisah dari resetEventData.js: Reset Data menghapus SEMUA data hasil
// kompetisi sekaligus, sedangkan ini murni riwayat/log tindakan judge per
// kategori, dan tombolnya dipasang satu-satu per kategori (Sprint dulu,
// menyusul Slalom/DRR/H2H/RX).
//
// Menghapus dari DUA sumber:
// 1. `judgeActionLogs` — audit trail lokal milik sts-timingsystem sendiri
//    ("Riwayat Judge" yang tampil di modal ini).
// 2. `judgereportdetails` — riwayat submit penalty milik sts-jurysystem
//    (SEMUA judge, bukan cuma satu), plus mengosongkan array referensi
//    kategori ini di `judgereports` (TIDAK menghapus dokumennya, karena
//    dokumen itu dipakai bersama oleh kategori lain punya juri yang sama).
//
// Ini akses langsung ke database jurysystem lewat cluster MongoDB yang
// sama (pola yang sudah dipakai resetEventData.js) — bukan lewat HTTP API
// — supaya konsisten dan tidak perlu endpoint baru yang berisiko dipanggil
// dari luar.
const CATEGORY_TO_EVENT_TYPE = {
  sprint: "SPRINT",
  slalom: "SLALOM",
  drr: "DRR",
  h2h: "H2H",
  rx: "RX",
};

const REPORT_ARRAY_FIELD = {
  sprint: "reportSprint",
  slalom: "reportSlalom",
  drr: "reportDrr",
  h2h: "reportHeadToHead",
  rx: "reportRaftingCross",
};

async function deleteJudgeActionHistory(eventId, raceCategory) {
  const id = String(eventId || "");
  const category = String(raceCategory || "").toLowerCase();
  const eventType = CATEGORY_TO_EVENT_TYPE[category];
  const arrayField = REPORT_ARRAY_FIELD[category];

  if (!id) return { ok: false, error: "eventId is required" };
  if (!eventType) {
    return {
      ok: false,
      error:
        "raceCategory tidak dikenal: " +
        raceCategory +
        " (harus salah satu dari: " +
        Object.keys(CATEGORY_TO_EVENT_TYPE).join(", ") +
        ")",
    };
  }

  const db = await getDb();

  // 1) Riwayat Judge lokal (sts-timingsystem) — hanya kategori ini.
  const logRes = await db.collection("judgeActionLogs").deleteMany({
    eventId: id,
    raceCategory: category,
  });

  // 2) Riwayat penalty juri (sts-jurysystem) — SEMUA judge, hanya
  //    eventType kategori ini. eventId di koleksi ini disimpan sbg
  //    STRING (lihat models/JudgeReportDetail.js di jurysystem).
  const detailRes = await db.collection("judgereportdetails").deleteMany({
    eventId: id,
    eventType: eventType,
  });

  // 3) Kosongkan array referensi kategori ini di dokumen JudgeReport
  //    (per juri) — TIDAK menghapus dokumennya, karena masih dipakai
  //    kategori lain punya juri yang sama. eventId di sini ObjectId.
  let updatedReports = 0;
  if (ObjectId.isValid(id)) {
    const reportRes = await db.collection("judgereports").updateMany(
      { eventId: new ObjectId(id) },
      { $set: { [arrayField]: [] } }
    );
    updatedReports = reportRes.modifiedCount || 0;
  }

  return {
    ok: true,
    deletedLogs: logRes.deletedCount || 0,
    deletedDetails: detailRes.deletedCount || 0,
    updatedReports,
  };
}

module.exports = { deleteJudgeActionHistory };
