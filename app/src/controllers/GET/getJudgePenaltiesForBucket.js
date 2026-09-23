const { getDb } = require("../index");

// Ambil SEMUA riwayat penalty juri yang SUKSES tersimpan (`judgereportdetails`,
// status "success") utk satu bucket (kategori) — dipakai fitur "catch-up"
// begitu socket realtime reconnect setelah sempat putus: penalty yang
// dikirim juri SAAT koneksi timing-system terputus tidak pernah sampai
// lewat socket (silently lost — lihat catatan di src/services/socket.js),
// tapi TETAP tersimpan aman di koleksi ini (jurysystem menulis langsung ke
// DB, terlepas dari status socket timing-system). Fungsi ini yang
// dipakai utk "mengejar ketinggalan" itu, direplay ke fungsi
// applyPenaltyFromSocket*() yang sudah ada lewat pesan hasil rekonstruksi.
//
// Sengaja TIDAK filter by waktu ("sejak kapan terputus") — re-apply
// SEMUA record yang match filter itu idempotent & aman (applyPenaltyFromSocket*
// cuma menimpa field result dgn nilai yang SAMA persis dgn yang
// tersimpan di DB, bukan menambah/mengalikan), jadi lebih simpel & aman
// drpd melacak timestamp terakhir yang precise per kategori/tim.
const CATEGORY_TO_EVENT_TYPE = {
  sprint: "SPRINT",
  slalom: "SLALOM",
  drr: "DRR",
  h2h: "H2H",
  rx: "RX",
};

async function getJudgePenaltiesForBucket(filter) {
  const f = filter || {};
  const category = String(f.category || "").toLowerCase();
  const eventType = CATEGORY_TO_EVENT_TYPE[category];
  const eventId = String(f.eventId || "");

  if (!eventType) {
    return { ok: false, error: "category tidak dikenal: " + f.category, items: [] };
  }
  if (!eventId) {
    return { ok: false, error: "eventId wajib diisi", items: [] };
  }

  const db = await getDb();

  const query = { eventId, eventType, status: { $ne: "failed" } };
  if (f.raceId) query.raceId = String(f.raceId);
  if (f.divisionId) query.divisionId = String(f.divisionId);
  if (f.initialId) query.initialId = String(f.initialId);
  if (category === "h2h" && f.roundId) {
    query.roundId = String(f.roundId);
  }
  if (category === "slalom" && f.runNumber != null && f.runNumber !== "") {
    query.runNumber = Number(f.runNumber);
  }

  const items = await db.collection("judgereportdetails").find(query).toArray();
  items.forEach((it) => {
    it._id = String(it._id);
  });

  return { ok: true, items };
}

module.exports = { getJudgePenaltiesForBucket };
