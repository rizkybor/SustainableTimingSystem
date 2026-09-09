// src/utils/resultCategories.js
//
// Daftar Race Category (SPRINT/HEAD2HEAD/SLALOM/DRR/RX) beserta route path
// halaman Result masing-masing — satu-satunya sumber kebenaran dipakai oleh
// tombol "Switch Category" di semua halaman Result (Sprint/H2H/Slalom/DRR/
// RX) supaya user bisa pindah antar kategori Result tanpa balik ke Dashboard,
// tetap membawa bucket (eventId/initialId/raceId/divisionId) yang sama.
//
// key harus sama persis dgn key di src/utils/overallCategoryMeta.js dan
// dgn value `enabledCategoryKeys` dari loadEnabledCategoryKeys() (categoriesEvent
// di dokumen event) supaya filter kategori aktif konsisten di semua tempat.

export const RESULT_CATEGORIES = [
  { key: "SPRINT", label: "Sprint", resultPath: "sprint-result" },
  { key: "HEAD2HEAD", label: "Head to Head", resultPath: "headtohead-result" },
  { key: "SLALOM", label: "Slalom", resultPath: "slalom-result" },
  { key: "DRR", label: "Down River Race", resultPath: "drr-result" },
  { key: "RX", label: "Rafting Cross", resultPath: "rx-result" },
];

// enabledCategoryKeys: Set kategori aktif utk event ini, atau null/undefined
// kalau belum diketahui/gagal dimuat -> fail-open (semua kategori lain
// ditampilkan sbg opsi switch).
export function getSwitchCategoryOptions(currentKey, enabledCategoryKeys) {
  return RESULT_CATEGORIES.filter((c) => c.key !== currentKey).filter(
    (c) => !enabledCategoryKeys || enabledCategoryKeys.has(c.key)
  );
}
