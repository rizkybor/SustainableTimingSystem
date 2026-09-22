// Format timestamp kapan status result suatu kategori terakhir di-set
// (ISO string UTC, dari eventsCollection.resultsOfficialSetAt.<cat> —
// lihat setResultsStatus() di insertNewEvent.js) jadi teks WIB
// (Asia/Jakarta) yang dicetak di bawah stempel PDF Print Result. Dipakai
// bareng oleh semua *-pdfResult.vue (Sprint/Slalom/DRR/H2H/RX/Overall)
// supaya format & zona waktunya konsisten satu sama lain, dan konsisten
// dengan badge Live Result di sts-jurysystem (LiveEventDetail.jsx pakai
// format id-ID + timeZone Asia/Jakarta yang sama persis).
export function formatOfficialSetAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return (
    d.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}

// 3 status result yg valid, urut dari paling "belum final" ke paling
// final — dipakai jg utk urutan opsi dropdown OfficialStampToggle.
export const RESULT_STATUSES = ["provisional", "unofficial", "official"];

export const RESULT_STATUS_LABELS = {
  provisional: "PROVISIONAL",
  unofficial: "UNOFFICIAL",
  official: "OFFICIAL",
};

// Turunkan status 3-pilihan dari eventInfo suatu event, dgn fallback ke
// data lama (sebelum field resultsStatusByCategory ada):
// - Kalau resultsStatusByCategory.<cat> sudah eksplisit tersimpan, pakai itu.
// - Kalau belum (event lama) TAPI resultsOfficialByCategory.<cat> === true
//   (pernah eksplisit di-Official-kan lewat UI lama), tetap "official" —
//   supaya keputusan final yg sudah dibuat operator tidak "mundur" jadi
//   Provisional gara-gara migrasi field.
// - Selain itu (belum pernah disentuh sama sekali, ATAU dulu ditoggle jadi
//   "false"/Unofficial di UI lama — boolean lama tidak bisa membedakan dua
//   kasus ini) → default BARU "provisional" (bukan lagi "unofficial").
export function deriveResultStatus(eventInfo, categoryKey) {
  const explicit =
    eventInfo &&
    eventInfo.resultsStatusByCategory &&
    eventInfo.resultsStatusByCategory[categoryKey];
  if (explicit && RESULT_STATUSES.includes(explicit)) return explicit;
  const wasOfficial =
    eventInfo &&
    eventInfo.resultsOfficialByCategory &&
    eventInfo.resultsOfficialByCategory[categoryKey];
  return wasOfficial ? "official" : "provisional";
}
