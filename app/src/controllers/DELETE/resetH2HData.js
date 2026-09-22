const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

// "Reset All" di halaman Head to Head — menghapus SEMUA data kompetisi H2H
// (bracket, hasil per-babak, overall H2H) untuk SELURUH kategori H2H
// (kombinasi divisi/race/initial) pada satu event, mengembalikan tim ke
// pool Round 1 tanpa Heat. Kategori lain (Sprint/Slalom/DRR/RX) TIDAK
// tersentuh, termasuk kontribusi mereka di dokumen Overall bersama.
//
// BUG FIX (2026-09-22): sebelumnya tombol ini TIDAK menghapus riwayat
// aktivitas juri H2H (judgereportdetails/judgereports — dipakai jurysystem
// utk validasi anti-duplikat "1x submit per tipe penalty per babak", lihat
// judge-reports/detail/route.js) maupun h2hactiverounds (Babak Aktif sisi
// juri, dipakai filter dropdown Team per Heat). Operator yang pakai tombol
// "Reset All" H2H ini (BUKAN "Reset Data" event-wide yang sudah menghapus
// semuanya) akan mendapati juri masih diblokir submit ulang ("sudah pernah
// diberi penalty...") walau bracket/babak sudah kosong lagi — krn riwayat
// lama itu tetap ada. Scope tetap H2H-only (eventType: "H2H"), TIDAK
// menyentuh riwayat Sprint/Slalom/DRR/RX punya event yang sama.
async function resetH2HDataForEvent(eventId) {
  const id = String(eventId || "");
  if (!id) return { ok: false, error: "eventId kosong" };

  const db = await getDb();

  const judgeReportDetailsCol = db.collection("judgereportdetails");
  const judgeReportsCol = db.collection("judgereports");

  // judgereports.eventId disimpan sbg ObjectId (beda dari kebanyakan
  // koleksi lain di reset ini yang pakai String) — lihat catatan yang
  // sama di resetEventData.js. Field `judges` array-nya sendiri BUKAN
  // dipakai di sini (itu utk userJudgeAssignments) — dokumen
  // JudgeReport di jurysystem SATU per (event, juri), array
  // `reportHeadToHead` isinya referensi id ke judgereportdetails, jadi
  // yang perlu di-reset cukup array itu ($set: []), bukan hapus
  // dokumennya (dokumen tetap dipakai kategori lain milik juri yang sama).
  const judgeReportsFilter = ObjectId.isValid(id)
    ? { eventId: new ObjectId(id) }
    : { eventId: id };

  const [
    bracketsRes,
    resultsRes,
    overallRes,
    foulsRes,
    judgeDetailsRes,
    judgeReportsPullRes,
    activeRoundsRes,
  ] = await Promise.all([
    db.collection("h2h_brackets").deleteMany({ "bucket.eventId": id }),
    db.collection("h2h_results").deleteMany({ "bucket.eventId": id }),
    db.collection("h2h_overall").deleteMany({ "bucket.eventId": id }),
    // Fouls Report (lihat MEMORY-H2H.md) — murni informasi juri, tapi
    // tetap terikat ke bracket/babak H2H yang baru saja dihapus di atas,
    // jadi ikut dibersihkan supaya tidak ada laporan "nyasar" merujuk ke
    // babak/tim yang sudah tidak ada lagi. Field-nya eventId LANGSUNG
    // (bukan bucket.eventId — lihat insertH2HFoulsReport.js), scope
    // SELURUH kategori H2H event ini, sama dgn 3 koleksi di atas.
    db.collection("h2hFoulsReports").deleteMany({ eventId: id }),
    // Riwayat penalty H2H per-team (dipakai validasi anti-duplikat) —
    // eventType: "H2H" supaya TIDAK ikut menghapus riwayat kategori lain
    // punya event yang sama.
    judgeReportDetailsCol.deleteMany({ eventId: id, eventType: "H2H" }),
    // Kosongkan array referensi `reportHeadToHead` di tiap dokumen
    // JudgeReport milik event ini — dokumennya sendiri TIDAK dihapus
    // (masih dipakai kategori lain punya juri yang sama).
    judgeReportsCol.updateMany(judgeReportsFilter, {
      $set: { reportHeadToHead: [] },
    }),
    // Babak Aktif H2H sisi juri (filter dropdown Team per Heat) —
    // eventId String top-level, lihat models/H2HActiveRound.js.
    db.collection("h2hactiverounds").deleteMany({ eventId: id }),
  ]);

  // temporaryOverallEventResults dipakai BERSAMA oleh semua kategori
  // (Sprint/H2H/Slalom/DRR/RX) untuk kombinasi eventId/initialId/raceId/
  // divisionId yang sama — jadi di sini HANYA entri kategori "HEADTOHEAD"
  // di dalam array `categories` tiap tim yang dibuang, bukan dokumennya.
  const overallCol = db.collection("temporaryOverallEventResults");
  const docs = await overallCol.find({ eventId: id }).toArray();
  let overallDocsTouched = 0;

  for (const doc of docs) {
    const eventResult = Array.isArray(doc.eventResult) ? doc.eventResult : [];
    let changed = false;

    const nextEventResult = eventResult
      .map((team) => {
        const cats = Array.isArray(team && team.categories) ? team.categories : [];
        const hadH2H = cats.some(
          (c) => String((c && c.name) || "").toUpperCase() === "HEADTOHEAD"
        );
        if (!hadH2H) return team;

        changed = true;
        const remainingCats = cats.filter(
          (c) => String((c && c.name) || "").toUpperCase() !== "HEADTOHEAD"
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
      // buang tim yang jadi tidak punya kategori sama sekali (dulunya cuma ikut H2H)
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

  return {
    ok: true,
    deletedCounts: {
      h2h_brackets: bracketsRes.deletedCount || 0,
      h2h_results: resultsRes.deletedCount || 0,
      h2h_overall: overallRes.deletedCount || 0,
      h2hFoulsReports: foulsRes.deletedCount || 0,
      judgereportdetails: judgeDetailsRes.deletedCount || 0,
      judgereports: judgeReportsPullRes.modifiedCount || 0,
      h2hactiverounds: activeRoundsRes.deletedCount || 0,
    },
    overallDocsTouched,
  };
}

module.exports = { resetH2HDataForEvent };
