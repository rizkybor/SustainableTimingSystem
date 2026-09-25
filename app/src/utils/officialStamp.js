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

// BUG FIX (2026-09-25): status Provisional/Unofficial/Official dulu
// disimpan FLAT per tipe kategori saja (mis. resultsStatusByCategory.sprint)
// — jadi mengubah status di satu bucket (mis. SENIOR R4 MEN) ikut mengubah
// SEMUA bucket lain di kategori yang sama (mis. SENIOR R4 WOMEN), karena
// semuanya baca/tulis key yang sama persis. Sekarang key-nya menyertakan
// identitas bucket (Division+Race+Initial) supaya tiap kombinasi berdiri
// sendiri. Dipakai bareng oleh Sprint/H2H/Slalom/DRR/RaftingCross Result.vue
// — Overall SENGAJA tetap event-wide (tidak per-bucket), karena halamannya
// memang menggabungkan seluruh kategori, bukan satu Division/Race/Initial.
export function buildCategoryStatusKey(categoryType, bucket) {
  const b = bucket || {};
  const divisionId = String(b.divisionId || "");
  const raceId = String(b.raceId || "");
  const initialId = String(b.initialId || "");
  return `${categoryType}__${divisionId}__${raceId}__${initialId}`;
}

// Turunkan status 3-pilihan dari eventInfo suatu event, dgn fallback ke
// data lama:
// - Kalau resultsStatusByCategory.<categoryKey> (composite, per-bucket)
//   sudah eksplisit tersimpan, pakai itu.
// - Kalau belum ADA TAPI `fallbackKey` (key FLAT lama, sebelum migrasi
//   bucket-granular) diberikan dan eksplisit tersimpan di sana, pakai itu
//   — supaya event lama yg sudah pernah di-Official-kan sebelum fix ini
//   tidak "mundur" jadi Provisional untuk SEMUA bucket-nya.
// - Kalau masih belum ketemu juga, cek resultsOfficialByCategory boolean
//   lama (categoryKey lalu fallbackKey) demi kompatibilitas data yg lebih
//   lama lagi (sebelum resultsStatusByCategory ada sama sekali).
// - Selain itu → default "provisional".
export function deriveResultStatus(eventInfo, categoryKey, fallbackKey) {
  const statusMap = (eventInfo && eventInfo.resultsStatusByCategory) || {};
  const officialMap = (eventInfo && eventInfo.resultsOfficialByCategory) || {};

  const explicit = statusMap[categoryKey];
  if (explicit && RESULT_STATUSES.includes(explicit)) return explicit;

  if (fallbackKey) {
    const explicitFlat = statusMap[fallbackKey];
    if (explicitFlat && RESULT_STATUSES.includes(explicitFlat)) return explicitFlat;
  }

  if (officialMap[categoryKey]) return "official";
  if (fallbackKey && officialMap[fallbackKey]) return "official";

  return "provisional";
}
