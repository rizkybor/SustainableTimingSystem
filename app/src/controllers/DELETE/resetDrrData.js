const { getDb } = require("../index");

// "Reset All" di halaman DRR Details — menghapus SEMUA waktu yang sudah
// bertanding di DRR (Start, Section, Finish, penalty, skor) untuk SELURUH
// kategori DRR (kombinasi divisi/race/initial) pada satu event, mengembalikan
// tim ke kondisi belum bertanding. Kategori lain (Sprint/H2H/Slalom/RX) TIDAK
// tersentuh, termasuk kontribusi mereka di dokumen Overall bersama — sama
// pola dgn resetSlalomDataForEvent().
async function resetDrrDataForEvent(eventId) {
  const id = String(eventId || "");
  if (!id) return { ok: false, error: "eventId kosong" };

  const db = await getDb();

  const drrRes = await db
    .collection("temporaryDrrResult")
    .deleteMany({ eventId: id });

  // BUG FIX: "Reset All" sebelumnya cuma menghapus temporaryDrrResult
  // (hasil tersimpan) — Riwayat Judge (judgeActionLogs) TIDAK ikut
  // terhapus, jadi entri penalty lama dari juri (termasuk nilai
  // penaltynya) masih tetap tampil di modal "Riwayat Judge" walau
  // tabelnya sendiri sudah kosong, terlihat seperti "data penalty belum
  // terhapus". Scope ke raceCategory "drr" saja spy tidak menyentuh
  // riwayat kategori lain.
  const judgeLogsRes = await db
    .collection("judgeActionLogs")
    .deleteMany({ eventId: id, raceCategory: "drr" });

  // BUG FIX (root cause "Reset All tidak bersih", sama kelas bug dgn
  // resetSlalomDataForEvent): teamsRegisteredCollection (roster) JUGA
  // menyimpan salinan `result` (start/finish/section penalty, judgesBy,
  // judgesTime) langsung di tiap tim — terbukti lewat inspeksi data
  // langsung, walau temporaryDrrResult sudah 0 dokumen, tim tertentu
  // masih punya penalty tersimpan di sini. Karena roster-lah yang dibaca
  // ulang tiap kali bucket dimuat, penalty lama selalu "hidup lagi" walau
  // tabel hasil sudah kosong. Nolkan `result` tiap tim kembali ke bentuk
  // default kosong (sama persis dgn _buildTeamRecord() DRR di
  // Details/index.vue).
  const registeredCol = db.collection("teamsRegisteredCollection");
  const registeredDocs = await registeredCol
    .find({ eventId: id, eventName: "DRR" })
    .toArray();
  let registeredDocsTouched = 0;
  const defaultDrrResult = () => [
    {
      startTime: "",
      finishTime: "",
      raceTime: "",
      startPenalty: null,
      finishPenalty: null,
      sectionPenalty: null,
      totalPenalty: null,
      startPenaltyTime: "",
      finishPenaltyTime: "",
      sectionPenaltyTime: [],
      totalPenaltyTime: "",
      totalTime: "",
      ranked: null,
      score: null,
      judgesBy: "",
      judgesTime: "",
    },
  ];
  for (const doc of registeredDocs) {
    const teams = Array.isArray(doc.teams) ? doc.teams : [];
    const nextTeams = teams.map((t) => ({
      ...t,
      result: defaultDrrResult(),
    }));
    registeredDocsTouched++;
    await registeredCol.updateOne(
      { _id: doc._id },
      { $set: { teams: nextTeams } }
    );
  }

  // temporaryOverallEventResults dipakai BERSAMA oleh semua kategori
  // (Sprint/H2H/Slalom/DRR/RX) untuk kombinasi eventId/initialId/raceId/
  // divisionId yang sama — jadi di sini HANYA entri kategori "DRR" di
  // dalam array `categories` tiap tim yang dibuang, bukan dokumennya.
  const overallCol = db.collection("temporaryOverallEventResults");
  const docs = await overallCol.find({ eventId: id }).toArray();
  let overallDocsTouched = 0;

  for (const doc of docs) {
    const eventResult = Array.isArray(doc.eventResult) ? doc.eventResult : [];
    let changed = false;

    const nextEventResult = eventResult
      .map((team) => {
        const cats = Array.isArray(team && team.categories) ? team.categories : [];
        const hadDrr = cats.some(
          (c) => String((c && c.name) || "").toUpperCase() === "DRR"
        );
        if (!hadDrr) return team;

        changed = true;
        const remainingCats = cats.filter(
          (c) => String((c && c.name) || "").toUpperCase() !== "DRR"
        );
        return {
          ...team,
          categories: remainingCats,
          // totalRanked/totalScore sebelumnya diisi dari kategori terakhir
          // yang menyimpan (bukan sum asli) — reset ke kosong, kategori
          // lain akan mengisinya ulang sendiri saat mereka save berikutnya.
          totalRanked: null,
          totalScore: 0,
        };
      })
      // buang tim yang jadi tidak punya kategori sama sekali (dulunya cuma ikut DRR)
      .filter(
        (team) => Array.isArray(team && team.categories) && team.categories.length > 0
      );

    if (changed) {
      overallDocsTouched++;
      await overallCol.updateOne(
        { _id: doc._id },
        { $set: { eventResult: nextEventResult, updatedAt: new Date() } }
      );
    }
  }

  // BUG FIX (2026-09-28): "Reset All" sebelumnya HANYA membersihkan data
  // milik sts-timingsystem sendiri (temporaryDrrResult, roster,
  // judgeActionLogs lokal, Overall) — tapi TIDAK PERNAH menyentuh riwayat
  // aktivitas juri di sts-jurysystem (judgereportdetails/judgereports),
  // maupun flag "tim sudah Start" (drrteamstatuses). Akibatnya, walau
  // tabel Output Racetime sudah kosong sepenuhnya pasca Reset All,
  // validasi anti-duplikat & anti-belum-Start di sts-jurysystem tetap
  // menganggap SEMUA tim "sudah pernah diberi penalty ini" / "sudah
  // Start" — juri jadi TIDAK BISA assign ulang penalty utk tim mana pun
  // sampai riwayat ini ikut dibersihkan. Sama fix pattern dgn
  // deleteJudgeReportsForRow.js (dipakai Reset per-baris), cuma di sini
  // di-scope ke SELURUH tim DRR event ini (bukan 1 tim) krn Reset All
  // memang menyasar semua kategori DRR pada event ini sekaligus.
  const reportDetailIds = await db
    .collection("judgereportdetails")
    .find({ eventId: id, eventType: "DRR" }, { projection: { _id: 1 } })
    .toArray();
  const idsToClear = reportDetailIds.map((d) => d._id);

  let deletedJudgeReportDetails = 0;
  let updatedJudgeReports = 0;
  if (idsToClear.length) {
    const delDetailRes = await db
      .collection("judgereportdetails")
      .deleteMany({ _id: { $in: idsToClear } });
    deletedJudgeReportDetails = delDetailRes.deletedCount || 0;

    // Cabut referensi id yg baru dihapus dari array per-juri (JANGAN
    // hapus dokumen juri — array `reportDrr` dipakai bersama utk semua
    // kategori/tim yg pernah dipegang juri itu, cukup keluarkan id yg
    // sudah tidak valid).
    const pullRes = await db
      .collection("judgereports")
      .updateMany(
        { reportDrr: { $in: idsToClear } },
        { $pull: { reportDrr: { $in: idsToClear } } }
      );
    updatedJudgeReports = pullRes.modifiedCount || 0;
  }

  // Flag "team sudah Start" (drrteamstatuses, dipakai jurysystem menolak
  // submit penalty Finish/Section sebelum team benar2 mulai) — event-wide
  // spy tim mana pun bisa di-Start ulang stlh Reset All.
  const teamStatusRes = await db
    .collection("drrteamstatuses")
    .deleteMany({ eventId: id });

  return {
    ok: true,
    deletedCounts: {
      temporaryDrrResult: drrRes.deletedCount || 0,
      judgeActionLogs: judgeLogsRes.deletedCount || 0,
      judgeReportDetails: deletedJudgeReportDetails,
      drrTeamStatuses: teamStatusRes.deletedCount || 0,
    },
    updatedJudgeReports,
    overallDocsTouched,
    registeredDocsTouched,
  };
}

module.exports = { resetDrrDataForEvent };
