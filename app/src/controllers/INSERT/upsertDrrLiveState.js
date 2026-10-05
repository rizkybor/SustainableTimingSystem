const { getDb } = require("../index");

// Live Result DRR — kondisi PER TIM yang diperbarui di SETIAP langkah input
// operator (Start Time, Pen. Start, penalty Section 1..N, Pen. Finish,
// Finish Time, flag DNF/DNS/DSQ, Reset), bukan cuma saat Save Result. Pola
// sama persis dgn upsertSprintLiveState.js.
//
// Ditulis LANGSUNG ke koleksi `drrlivepreviews` (skema = models/
// DrrLivePreview.js di sts-jurysystem, satu cluster Atlas yang sama). Baris
// kosong (tanpa start, finish, & flag) = hasil Reset -> dokumen dihapus.
async function upsertDrrLiveState(payload) {
  const p = payload || {};
  const b = p.bucket || {};
  const eventId = b.eventId ? String(b.eventId) : "";
  const initialId = b.initialId ? String(b.initialId) : "";
  const divisionId = b.divisionId ? String(b.divisionId) : "";
  const raceId = b.raceId ? String(b.raceId) : "";
  if (!eventId || !initialId || !divisionId || !raceId) {
    throw new Error("bucket eventId/initialId/divisionId/raceId wajib diisi");
  }

  const rows = Array.isArray(p.rows) ? p.rows : [];
  if (!rows.length) return { written: 0 };

  const db = await getDb();
  const col = db.collection("drrlivepreviews");
  const now = new Date();
  const str = (v) => (v === null || v === undefined ? "" : String(v));
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  const ops = [];
  rows.forEach((r) => {
    const teamId = str(r && r.teamId);
    if (!teamId) return;
    const filter = { eventId, initialId, divisionId, raceId, teamId };
    const isEmpty = !r.startTime && !r.finishTime && !r.flag;
    if (isEmpty) {
      ops.push({ deleteOne: { filter } });
      return;
    }
    ops.push({
      updateOne: {
        filter,
        update: {
          $set: {
            bibTeam: str(r.bibTeam),
            nameTeam: str(r.nameTeam),
            startTime: str(r.startTime),
            finishTime: str(r.finishTime),
            raceTime: str(r.raceTime),
            startPenalty: num(r.startPenalty),
            finishPenalty: num(r.finishPenalty),
            // mentah (string waktu, bisa "-" = bonus) + detik per section
            sectionPenaltyTime: Array.isArray(r.sectionPenaltyTime)
              ? r.sectionPenaltyTime.map(str)
              : [],
            sectionPenalties: Array.isArray(r.sectionPenalties)
              ? r.sectionPenalties.map(num)
              : [],
            sectionPenalty: num(r.sectionPenalty),
            totalPenalty: num(r.totalPenalty),
            penaltyTime: str(r.penaltyTime),
            totalTime: str(r.totalTime),
            flag: r.flag ? String(r.flag) : null,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    });
  });

  if (!ops.length) return { written: 0 };
  await col.bulkWrite(ops, { ordered: false });
  return { written: ops.length };
}

module.exports = { upsertDrrLiveState };
