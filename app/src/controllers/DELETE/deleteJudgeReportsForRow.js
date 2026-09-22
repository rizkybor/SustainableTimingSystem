const { getDb } = require("../index");

// Hapus riwayat submit judge (sts-jurysystem, koleksi `judgereportdetails`)
// + audit log lokal (sts-timingsystem, koleksi `judgeActionLogs`) utk SATU
// baris/tim saja — dipakai tombol "Reset" per-row/heat/run di
// SprintRace/HeadToHead/SlalomRace/DownRiverRace.vue. Sebelumnya Reset
// cuma menyentuh state lokal `item.result`, tidak pernah menghapus
// riwayat penalty juri — akibatnya validasi duplikat di sts-jurysystem
// ("sudah pernah diberi penalty ...") tetap memblokir juri submit ulang
// walau operator sudah reset waktunya. Beda dari deleteJudgeActionHistory.js
// yg menghapus SELURUH kategori: ini scoped ke satu tim (+ round utk H2H,
// + run utk Slalom) supaya reset baris lain / babak lain / run lain TIDAK
// ikut kehapus datanya.
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

async function deleteJudgeReportsForRow(filter) {
  const f = filter || {};
  const category = String(f.category || "").toLowerCase();
  const eventType = CATEGORY_TO_EVENT_TYPE[category];
  const arrayField = REPORT_ARRAY_FIELD[category];
  const eventId = String(f.eventId || "");
  const teamId = String(f.teamId || "");

  if (!eventType || !arrayField) {
    return { ok: false, error: "category tidak dikenal: " + f.category };
  }
  if (!eventId || !teamId) {
    return { ok: false, error: "eventId dan teamId wajib diisi" };
  }

  const db = await getDb();

  // 1) Riwayat submit penalty juri (sts-jurysystem). eventId di koleksi
  //    ini disimpan sbg STRING (lihat models/JudgeReportDetail.js).
  const detailQuery = { eventId, eventType, team: teamId };
  if (f.raceId) detailQuery.raceId = String(f.raceId);
  if (f.divisionId) detailQuery.divisionId = String(f.divisionId);
  if (f.initialId) detailQuery.initialId = String(f.initialId);
  // H2H: scoped ke babak aktif saja, jangan sampai reset Final A ikut
  // menghapus riwayat Semifinal tim yg sama (konsisten dgn proteksi
  // cross-round bleed yg sudah ada di HeadToHead.vue).
  if (category === "h2h" && f.roundId) {
    detailQuery.roundId = String(f.roundId);
  }
  // Slalom: scoped ke Run aktif saja, jangan sampai reset Run 1 ikut
  // menghapus riwayat Run 2 tim yg sama.
  if (category === "slalom" && f.runNumber != null && f.runNumber !== "") {
    detailQuery.runNumber = Number(f.runNumber);
  }

  const toDelete = await db
    .collection("judgereportdetails")
    .find(detailQuery, { projection: { _id: 1 } })
    .toArray();
  const ids = toDelete.map((d) => d._id);

  let deletedDetails = 0;
  let updatedReports = 0;
  if (ids.length) {
    const delRes = await db
      .collection("judgereportdetails")
      .deleteMany({ _id: { $in: ids } });
    deletedDetails = delRes.deletedCount || 0;

    // Cabut referensi id yg baru dihapus dari array per-juri (JANGAN
    // clear seluruh array — array itu dipakai bersama utk SEMUA baris/
    // babak/run kategori ini punya juri yg sama).
    const pullRes = await db
      .collection("judgereports")
      .updateMany(
        { [arrayField]: { $in: ids } },
        { $pull: { [arrayField]: { $in: ids } } }
      );
    updatedReports = pullRes.modifiedCount || 0;
  }

  // 2) Audit log lokal (sts-timingsystem) — skemanya tidak punya
  //    roundId/runNumber, jadi utk H2H/Slalom ikut kehapus SEMUA babak/
  //    run tim itu di log lokal ini (bukan krusial: log ini cuma riwayat
  //    tampilan, bukan sumber validasi seperti judgereportdetails).
  const logQuery = { eventId, raceCategory: category, teamId };
  if (f.raceId) logQuery.raceId = String(f.raceId);
  if (f.divisionId) logQuery.divisionId = String(f.divisionId);
  if (f.initialId) logQuery.initialId = String(f.initialId);
  const logRes = await db.collection("judgeActionLogs").deleteMany(logQuery);

  return {
    ok: true,
    deletedDetails,
    updatedReports,
    deletedLogs: logRes.deletedCount || 0,
  };
}

module.exports = { deleteJudgeReportsForRow };
