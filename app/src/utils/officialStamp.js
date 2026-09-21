// Format timestamp kapan status Official/Unofficial suatu kategori
// di-set (ISO string UTC, dari eventsCollection.resultsOfficialSetAt.<cat>
// — lihat setResultsOfficial() di insertNewEvent.js) jadi teks WIB
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
