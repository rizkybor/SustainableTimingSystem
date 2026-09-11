// src/utils/overallCategoryMeta.js
//
// Metadata kolom kategori (Sprint/H2H/Slalom/DRR/RX) utk tabel Overall Score
// — dipakai bersama oleh EventOverallResult.vue, event-overall-pdfResult.vue,
// PrintOverallModal.vue, dan by-alltime.vue supaya kolom yang ditampilkan
// selalu konsisten satu sama lain dan mengikuti Event Categories yang
// benar-benar dipilih untuk event tsb (bukan selalu 5 kolom tetap).

export const ALL_CATEGORY_META = [
  {
    key: "SPRINT",
    label: "Sprint",
    cssClass: "sprint",
    scoreField: "sprintScore",
    rankField: "sprintRank",
  },
  {
    key: "HEAD2HEAD",
    label: "H2H",
    cssClass: "h2h",
    scoreField: "h2hScore",
    rankField: "h2hRank",
  },
  {
    key: "SLALOM",
    label: "Slalom",
    cssClass: "slalom",
    scoreField: "slalomScore",
    rankField: "slalomRank",
  },
  {
    key: "DRR",
    label: "DRR",
    cssClass: "drr",
    scoreField: "drrScore",
    rankField: "drrRank",
  },
  {
    key: "RX",
    label: "Rafting Cross",
    cssClass: "rx",
    scoreField: "rxScore",
    rankField: "rxRank",
  },
];

// `enabledCategoryKeys`: Set kategori yang aktif utk event ini, atau null/
// undefined kalau belum diketahui/gagal dimuat -> fail-open (semua kategori
// ditampilkan) supaya kegagalan fetch tidak diam-diam menyembunyikan kolom
// yang seharusnya valid.
export function getVisibleCategoryMeta(enabledCategoryKeys) {
  if (!enabledCategoryKeys) return ALL_CATEGORY_META;
  return ALL_CATEGORY_META.filter((c) => enabledCategoryKeys.has(c.key));
}
