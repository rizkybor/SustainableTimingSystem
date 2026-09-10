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

  return {
    ok: true,
    deletedCounts: {
      temporaryDrrResult: drrRes.deletedCount || 0,
    },
    overallDocsTouched,
  };
}

module.exports = { resetDrrDataForEvent };
