const { getDb } = require("../index");

// "Reset All" di halaman Head to Head — menghapus SEMUA data kompetisi H2H
// (bracket, hasil per-babak, overall H2H) untuk SELURUH kategori H2H
// (kombinasi divisi/race/initial) pada satu event, mengembalikan tim ke
// pool Round 1 tanpa Heat. Kategori lain (Sprint/Slalom/DRR/RX) TIDAK
// tersentuh, termasuk kontribusi mereka di dokumen Overall bersama.
async function resetH2HDataForEvent(eventId) {
  const id = String(eventId || "");
  if (!id) return { ok: false, error: "eventId kosong" };

  const db = await getDb();

  const [bracketsRes, resultsRes, overallRes] = await Promise.all([
    db.collection("h2h_brackets").deleteMany({ "bucket.eventId": id }),
    db.collection("h2h_results").deleteMany({ "bucket.eventId": id }),
    db.collection("h2h_overall").deleteMany({ "bucket.eventId": id }),
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
    },
    overallDocsTouched,
  };
}

module.exports = { resetH2HDataForEvent };
