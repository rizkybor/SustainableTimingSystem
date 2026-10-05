<template>
  <div class="rts" role="status" aria-live="polite" aria-label="Memuat hasil">
    <!-- Podium (H2H / Rafting Cross) -->
    <div v-if="podium" class="rts-podium">
      <div v-for="n in 3" :key="'pod-' + n" class="rts-podium__item" :class="'rts-podium__item--' + n">
        <span class="rts-block rts-circle"></span>
        <span class="rts-block rts-line rts-line--md"></span>
        <span class="rts-block rts-line rts-line--sm"></span>
      </div>
    </div>

    <!-- Satu atau beberapa tabel (Event Overall = beberapa bucket) -->
    <div v-for="t in tables" :key="'tbl-' + t" class="rts-table">
      <div v-if="tables > 1" class="rts-table__title">
        <span class="rts-block rts-line rts-line--title"></span>
      </div>
      <div class="rts-head">
        <span
          v-for="c in cols"
          :key="'h-' + c"
          class="rts-cell"
          :class="{ 'rts-cell--team': c === 2 }"
        >
          <span class="rts-block rts-line rts-line--head"></span>
        </span>
      </div>
      <div v-for="r in rows" :key="'r-' + r" class="rts-row">
        <span
          v-for="c in cols"
          :key="'c-' + r + '-' + c"
          class="rts-cell"
          :class="{ 'rts-cell--team': c === 2 }"
        >
          <span
            class="rts-block rts-line"
            :class="c === 2 ? 'rts-line--team' : c === 1 ? 'rts-line--xs' : 'rts-line--cell'"
            :style="{ animationDelay: (r * 0.06).toFixed(2) + 's' }"
          ></span>
        </span>
      </div>
    </div>
    <span class="sr-only">Memuat hasil…</span>
  </div>
</template>

<script>
// Skeleton loader utk halaman Result (Sprint/Slalom/DRR/H2H/Rafting Cross/
// Event Overall) selama data hasil di-fetch — menggantikan spinner
// "Loading results..." supaya layout tidak loncat saat tabel muncul.
export default {
  name: "ResultTableSkeleton",
  props: {
    rows: { type: Number, default: 6 },
    cols: { type: Number, default: 8 },
    // Tampilkan kerangka podium juara 1-3 (H2H / Rafting Cross)
    podium: { type: Boolean, default: false },
    // Jumlah tabel (Event Overall menampilkan beberapa bucket sekaligus)
    tables: { type: Number, default: 1 },
  },
};
</script>

<style scoped>
.rts {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 8px;
}

/* Blok shimmer dasar */
.rts-block {
  display: block;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef2f7 0%, #f8fafc 40%, #eef2f7 80%);
  background-size: 200% 100%;
  animation: rts-shimmer 1.3s ease-in-out infinite;
}
@keyframes rts-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .rts-block {
    animation: none;
  }
}

.rts-line {
  height: 12px;
}
.rts-line--xs {
  width: 22px;
}
.rts-line--sm {
  width: 50%;
  height: 10px;
}
.rts-line--md {
  width: 70%;
}
.rts-line--cell {
  width: 72%;
  margin: 0 auto;
}
.rts-line--team {
  width: 85%;
  height: 13px;
}
.rts-line--title {
  width: 220px;
  height: 16px;
}
.rts-line--head {
  width: 60%;
  height: 10px;
  margin: 0 auto;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.34) 40%, rgba(255, 255, 255, 0.18) 80%);
  background-size: 200% 100%;
}
.rts-circle {
  width: 46px;
  height: 46px;
  border-radius: 50%;
}

/* Podium */
.rts-podium {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
}
.rts-podium__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid #e6edf6;
  border-radius: 14px;
  background: #ffffff;
}
.rts-podium__item--1 {
  order: 2;
  padding-top: 26px;
}
.rts-podium__item--2 {
  order: 1;
}
.rts-podium__item--3 {
  order: 3;
}

/* Tabel */
.rts-table {
  border: 1px solid #e6edf6;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}
.rts-table__title {
  padding: 14px 16px 6px;
}
.rts-head,
.rts-row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  align-items: center;
}
.rts-head {
  background: linear-gradient(180deg, #1f527f 0%, #1a456c 100%);
  min-height: 42px;
}
.rts-row {
  min-height: 50px;
  border-top: 1px solid #edf2f7;
}
.rts-row:nth-child(even) {
  background: #fbfdff;
}
.rts-cell {
  padding: 0 12px;
}
/* Kolom nama tim lebih lebar */
.rts-head .rts-cell--team,
.rts-row .rts-cell--team {
  grid-column: span 2;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
