<!-- src/components/result/OverallPdf.vue -->
<template>
  <div class="pdf-wrap">
    <!-- PAGES: 10 baris per halaman -->
    <div
      v-for="(pageRows, pidx) in pageChunks"
      :key="'p' + pidx"
      class="page"
    >
      <!-- HEADER (sama pola dgn sprint-pdfResult.vue: trademark + band +
           logo + event info, bukan hero image spt sebelumnya) -->
      <header class="head">
        <div class="trademark">
          @STiming.System.424.Timestamp {{ timestamp }} #-
        </div>

        <div class="band">
          <div class="band-left">
            <strong>SCORE BOARD</strong>
            <span class="dot">•</span>
            <span class="cat">OVERALL</span>
            <span class="dot">•</span>
            <span class="cat">
              {{ dataEvent && dataEvent.levelName ? dataEvent.levelName : "Classification" }}
            </span>
          </div>
          <div class="band-right">
            <strong>
              {{ raceCats.initial || "-" }} - {{ raceCats.division || "-" }}
              {{ raceCats.race || "-" }}
            </strong>
            <span class="dot">•</span>
            <span>{{ todayStr }}</span>
            <span v-if="pageChunks.length > 1">
              • Page {{ pidx + 1 }} / {{ pageChunks.length }}</span
            >
          </div>
        </div>

        <!-- LOGO ATAS -->
        <div
          class="mid-image-row"
          v-if="dataEvent && dataEvent.eventFiles && dataEvent.eventFiles.length > 0"
        >
          <div
            v-for="(url, i2) in dataEvent.eventFiles"
            :key="'logo-' + pidx + '-' + i2"
            class="mid-image py-4"
          >
            <img :src="url" alt="Event Poster" />
          </div>
        </div>

        <!-- EVENT INFO -->
        <div class="event">
          <div class="event-name">{{ safe(dataEvent.eventName) }}</div>
          <div class="event-meta">
            Kp/Ds. {{ safe(dataEvent.addressVillage) }}, Kel.
            {{ safe(dataEvent.addressDistrict) }}, Kec.
            {{ safe(dataEvent.addressSubDistrict) }}, Kota
            {{ safe(dataEvent.addressCity) }}, {{ safe(dataEvent.addressProvince) }}
            – {{ safe(dataEvent.addressState) }} ({{ safe(dataEvent.addressZipCode) }})
            • {{ safe(dataEvent.riverName) }}
          </div>
        </div>
      </header>

      <!-- TABLE -->
      <section>
        <table class="score-table">
          <thead>
            <tr>
              <th rowspan="2" class="w-60">No</th>
              <th rowspan="2" class="team-col">Team Name</th>
              <th rowspan="2" class="w-70">BIB</th>

              <th
                v-for="cat in categories"
                :key="cat.key"
                colspan="2"
                class="group"
                :class="cat.cssClass"
              >
                {{ cat.label }}
              </th>

              <th rowspan="2" class="w-110">Total Score</th>
              <th rowspan="2" class="w-110">Rank Overall</th>
            </tr>
            <tr>
              <template v-for="cat in categories">
                <th class="sub" :key="cat.key + '-score'">Score</th>
                <th class="sub" :key="cat.key + '-rank'">Ranked</th>
              </template>
            </tr>
          </thead>

          <tbody>
            <tr v-for="r in pageRows" :key="r.rank">
              <td class="text-center">{{ r.rank }}</td>
              <td class="text-strong">
                {{ r.teamName }}
                <CountryFlag :code="r.countryCode" />
              </td>
              <td class="text-center">{{ r.bib }}</td>

              <template v-for="cat in categories">
                <td class="text-center" :key="cat.key + '-score'">
                  {{ r[cat.scoreField] }}
                </td>
                <td class="text-center" :key="cat.key + '-rank'">
                  {{ r[cat.rankField] }}
                </td>
              </template>

              <td class="text-center text-strong total-time-green">
                {{ r.totalScore }}
              </td>
              <td class="text-center text-strong">{{ r.rank }}</td>
            </tr>
            <tr v-if="!pageRows || pageRows.length === 0">
              <td class="empty" :colspan="3 + categories.length * 2 + 2">
                No data
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- SIGNATURE -->
      <div class="sign sign-two">
        <div class="sign-left">
          <div class="sig-card">
            <div class="sign-title">Chief Judge</div>
            <img
              v-if="dataEvent.chiefJudgeSignature && dataEvent.chiefJudgeSignature.secure_url"
              :src="dataEvent.chiefJudgeSignature.secure_url"
              class="sign-img"
              alt="Chief Judge signature"
            />
            <div v-else class="sign-line"></div>
            <div class="sign-name">{{ safe(dataEvent.chiefJudge) }}</div>
          </div>
        </div>

        <div class="sign-right">
          <span class="unofficial-stamp" :class="{ 'official-stamp': isOfficial }">
            {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
          </span>
        </div>
      </div>

      <!-- SPONSOR -->
      <div
        class="mid-image-sponsor-row"
        v-if="dataEvent && dataEvent.sponsorFiles && dataEvent.sponsorFiles.length > 0"
      >
        <div
          v-for="(url, i3) in dataEvent.sponsorFiles"
          :key="'sponsor-' + pidx + '-' + i3"
          class="mid-image-sponsor pt-5"
        >
          <img :src="url" alt="Event Sponsor" />
        </div>
      </div>

      <!-- PAGE BREAK (kecuali halaman terakhir) -->
      <div v-if="pidx < pageChunks.length - 1" class="page-break"></div>
    </div>
  </div>
</template>

<script>
import CountryFlag from "@/components/common/CountryFlag.vue";
import { ALL_CATEGORY_META } from "@/utils/overallCategoryMeta";

export default {
  name: "OverallResult",
  components: { CountryFlag },
  props: {
    dataEvent: { type: Object, default: () => ({}) },
    rows: { type: Array, default: () => [] },
    raceCats: {
      type: Object,
      default: () => ({ initial: "-", division: "-", race: "-" }),
    },
    categories: { type: Array, default: () => ALL_CATEGORY_META },
    isOfficial: { type: Boolean, default: false },
  },
  data() {
    return { pageSize: 10 };
  },
  computed: {
    todayStr() {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    },
    timestamp() {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
    },
    processedRows() {
      const toNum = function (v) {
        return Number.isFinite(Number(v)) ? Number(v) : 0;
      };
      const src = Array.isArray(this.rows) ? this.rows.slice() : [];
      const withTotals = src.map(function (r) {
        const sprint = toNum(r.sprintScore);
        const h2h = toNum(r.h2hScore);
        const slalom = toNum(r.slalomScore);
        const drr = toNum(r.drrScore);
        const rx = toNum(r.rxScore);
        const total = Number.isFinite(Number(r.totalScore))
          ? Number(r.totalScore)
          : sprint + h2h + slalom + drr + rx;

        return {
          teamName: String(r.teamName || ""),
          bib: String(r.bib || ""),
          countryCode: r.countryCode || "",
          sprintScore: sprint,
          sprintRank: toNum(r.sprintRank),
          h2hScore: h2h,
          h2hRank: toNum(r.h2hRank),
          slalomScore: slalom,
          slalomRank: toNum(r.slalomRank),
          drrScore: drr,
          drrRank: toNum(r.drrRank),
          rxScore: rx,
          rxRank: toNum(r.rxRank),
          totalScore: total,
        };
      });

      withTotals.sort(function (a, b) {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        const aBest = Math.min(
          a.sprintRank || Infinity,
          a.h2hRank || Infinity,
          a.slalomRank || Infinity,
          a.drrRank || Infinity
        );
        const bBest = Math.min(
          b.sprintRank || Infinity,
          b.h2hRank || Infinity,
          b.slalomRank || Infinity,
          b.drrRank || Infinity
        );
        if (aBest !== bBest) return aBest - bBest;
        return String(a.teamName).localeCompare(String(b.teamName));
      });

      return withTotals.map(function (r, i) {
        const out = Object.assign({}, r);
        out.rank = i + 1;
        return out;
      });
    },
    pageChunks() {
      const ps = this.pageSize || 10;
      const arr = this.processedRows;
      const pages = [];
      for (let i = 0; i < arr.length; i += ps) {
        pages.push(arr.slice(i, i + ps));
      }
      return pages.length ? pages : [[]];
    },
  },
  methods: {
    safe(v) {
      return v ? String(v) : "-";
    },
  },
};
</script>

<style scoped>
/* === LAYOUT CETAK LANDSCAPE A4 (sama pola dgn sprint-pdfResult.vue) === */
@page {
  size: A4 landscape;
  margin: 8mm;
}

* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.pdf-wrap {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}

/* ==== PAGE CONTAINER ==== */
.page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(210mm - 16mm);
  padding: 5mm 8mm 0;
  font-size: 12px;
  color: #17202a;
  background: #fff;
}

/* ==== HEADER ==== */
.band {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgb(24, 116, 165);
  color: white;
  padding: 5px 12px;
  border-radius: 8px;
  margin-bottom: 4mm;
  font-weight: 700;
}
.band .dot {
  margin: 0 4px;
  opacity: 0.9;
}
.event {
  text-align: center;
  margin-bottom: 3mm;
}
.event-name {
  font-weight: 800;
  font-size: 16px;
  color: rgb(24, 116, 165);
  margin-bottom: 2px;
}
.event-meta {
  font-size: 9.5px;
  color: rgb(24, 116, 165);
}

/* ==== TABLE ==== */
.score-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #dde6ee;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6mm;
  table-layout: fixed;
}
.score-table th,
.score-table td {
  border-bottom: 1px solid #f1f4f8;
  padding: 5px 7px;
  text-align: center;
}
.score-table thead th {
  background: rgb(240, 250, 255);
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 800;
}
.score-table thead th.group.sprint {
  background: #d9e8ff;
}
.score-table thead th.group.h2h {
  background: #ffe0c7;
}
.score-table thead th.group.slalom {
  background: #fff2b8;
}
.score-table thead th.group.drr {
  background: #ccf7d9;
}
.score-table thead th.group.rx {
  background: #e3d9ff;
}
.score-table thead th.sub {
  background: #ffffff;
  font-weight: 700;
}
.score-table tbody td {
  font-size: 11.5px;
}
.score-table tbody tr:nth-child(odd) {
  background: #fafcff;
}
.score-table td.empty {
  padding: 14px;
  color: #8a95a3;
  font-style: italic;
}
.text-center {
  text-align: center;
}
.text-strong {
  font-weight: 700;
}
.total-time-green {
  color: #148a3b;
}

/* Kolom width */
.w-60 {
  width: 60px;
}
.w-70 {
  width: 70px;
}
.w-110 {
  width: 110px;
}
.team-col {
  width: 210px;
  text-align: left !important;
}

/* ==== FOOTER: SIGNATURE (70% - 30%) ==== */
.sign.sign-two {
  display: grid;
  grid-template-columns: 70% 30%;
  align-items: end;
  margin-top: 2mm;
  padding-inline: 4mm;
  page-break-inside: avoid;
}
.sign-left {
  display: flex;
  justify-items: start;
  align-items: end;
}
.sig-card {
  text-align: left;
  min-height: 16mm;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.sign-title {
  color: #8a95a3;
  font-size: 9px;
  margin: 0 0 3mm 0;
}
.sign-line {
  height: 1.8px;
  background: rgb(24, 116, 165);
  width: 60mm;
  margin: 14mm 0 2mm;
  border-radius: 2px;
}
.sign-img {
  height: 14mm;
  max-width: 60mm;
  object-fit: contain;
  margin: 2mm 0 2mm;
}
.sign-name {
  font-weight: 700;
  font-size: 10.8px;
  color: #1f2937;
}

/* ==== KOLOM KANAN (STAMP) ==== */
.sign-right {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  text-align: right;
}
.unofficial-stamp {
  color: #d9534f;
  text-transform: uppercase;
  border: 1.5px solid #d9534f;
  padding: 5px 10px 6px;
  border-radius: 4px;
  letter-spacing: 0.6px;
  display: inline-block;
  opacity: 0.9;
  font-weight: 800;
  font-size: 14px;
}
.official-stamp {
  color: #148a3b;
  border-color: #148a3b;
}

/* ==== LOGO ATAS & SPONSOR ==== */
.mid-image-row,
.mid-image-sponsor-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2mm;
  margin: 2mm 0;
}
.mid-image img {
  height: 70px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}
.mid-image-sponsor img {
  height: 35px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}
.mid-image-sponsor-row {
  margin-top: auto;
}

/* ==== WATERMARK / TRADEMARK ==== */
.trademark {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(-8mm, 2mm);
  font-family: monospace;
  font-size: 8px;
  color: #8b8b8b;
  opacity: 0.7;
}

/* -------- Page break -------- */
.page-break {
  page-break-after: always;
  break-after: page;
}

/* -------- Print tweaks -------- */
@media print {
  .pdf-wrap {
    padding: 0;
  }
}
</style>
