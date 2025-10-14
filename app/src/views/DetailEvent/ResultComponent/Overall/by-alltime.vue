<!-- src/components/result/OverallPdf.vue -->
<template>
  <div class="pdf-wrap">
    <!-- PAGES: 10 baris per halaman -->
    <div
      v-for="(pageRows, pidx) in pageChunks"
      :key="'p' + pidx"
      class="page-block"
    >
      <!-- HERO per halaman -->
      <section class="detail-hero" :class="{ compact: pidx > 0 }">
        <div class="hero-bg" :style="heroBgStyle"></div>
        <div class="hero-inner">
          <div class="hero-row">
            <div class="hero-logo" :class="{ compact: pidx > 0 }">
              <img
                v-if="logoUrl"
                :src="logoUrl"
                alt="Event Logo"
                class="event-logo-img"
              />
              <img
                v-else
                :src="defaultImg"
                alt="Event Logo"
                class="event-logo-img"
              />
            </div>

            <div class="hero-text">
              <h2 class="title" :class="{ compact: pidx > 0 }">
                {{ safe(dataEvent.eventName) }}
              </h2>
              <div class="meta" :class="{ compact: pidx > 0 }">
                <span
                  ><strong>Location</strong>:
                  {{ safe(dataEvent.addressCity) }}</span
                >
                <span
                  ><strong>River</strong>: {{ safe(dataEvent.riverName) }}</span
                >
                <span
                  ><strong>Level</strong>: {{ safe(dataEvent.levelName) }}</span
                >
              </div>
            </div>

            <div class="stamp" :class="{ official: isOfficial }">
              {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
            </div>
          </div>
        </div>
      </section>

      <!-- SUBHEADER per halaman -->
      <div class="block-head">
        <div class="head-left">
          <div class="muted">
            RANK RESULT OVERALL • {{ sprintCats.initial }} •
            {{ sprintCats.division }} • {{ sprintCats.race }}
          </div>
        </div>
        <div class="head-right">
          <div class="muted">
            {{ todayStr }}
            <span v-if="pageChunks.length > 1">
              • Page {{ pidx + 1 }} / {{ pageChunks.length }}</span
            >
          </div>
        </div>
      </div>

      <!-- TABLE per halaman -->
      <div class="table-card">
        <table class="table table-ranking">
          <thead>
            <tr>
              <th rowspan="2" class="small w-60">No</th>
              <th rowspan="2" class="team-col">Team Name</th>
              <th rowspan="2" class="w-70 text-center">BIB</th>

              <th colspan="2" class="group sprint text-center">Sprint</th>
              <th colspan="2" class="group h2h text-center">H2H</th>
              <th colspan="2" class="group slalom text-center">Slalom</th>
              <th colspan="2" class="group drr text-center">DRR</th>

              <th rowspan="2" class="w-110 text-center">Total Score</th>
              <th rowspan="2" class="w-110 text-center">Rank Overall</th>
            </tr>
            <tr>
              <th class="sub">Score</th>
              <th class="sub">Ranked</th>
              <th class="sub">Score</th>
              <th class="sub">Ranked</th>
              <th class="sub">Score</th>
              <th class="sub">Ranked</th>
              <th class="sub">Score</th>
              <th class="sub">Ranked</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="r in pageRows" :key="r.rank">
              <td class="text-center">{{ r.rank }}</td>
              <td>{{ r.teamName }}</td>
              <td class="text-center">{{ r.bib }}</td>

              <td class="text-center">{{ r.sprintScore }}</td>
              <td class="text-center">{{ r.sprintRank }}</td>

              <td class="text-center">{{ r.h2hScore }}</td>
              <td class="text-center">{{ r.h2hRank }}</td>

              <td class="text-center">{{ r.slalomScore }}</td>
              <td class="text-center">{{ r.slalomRank }}</td>

              <td class="text-center">{{ r.drrScore }}</td>
              <td class="text-center">{{ r.drrRank }}</td>

              <td class="text-center bold">{{ r.totalScore }}</td>
              <td class="text-center bold">{{ r.rank }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGE BREAK (kecuali terakhir) -->
      <div v-if="pidx < pageChunks.length - 1" class="page-break"></div>
    </div>

    <!-- FOOTER (opsional) di halaman terakhir -->
    <div class="pdf-footer">
      <div class="col">
        <div class="label">Chief Judge</div>
        <div class="signature">{{ safe(dataEvent.chiefJudge) }}</div>
      </div>
      <div class="col text-right">
        <div class="label">Printed</div>
        <div class="signature">{{ todayStr }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import defaultImg from "@/assets/images/default-second.jpeg";

export default {
  name: "OverallResult",
  props: {
    dataEvent: { type: Object, default: () => ({}) },
    rows: { type: Array, default: () => [] },
    sprintCats: {
      type: Object,
      default: () => ({ initial: "-", division: "-", race: "-" }),
    },
    isOfficial: { type: Boolean, default: false },
    heroImage: { type: String, default: "" },
  },
  data() {
    return { defaultImg, pageSize: 10 };
  },
  computed: {
    logoUrl() {
      const logos = this.dataEvent && this.dataEvent.event_logo;
      if (Array.isArray(logos) && logos.length) {
        const first = logos[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && typeof first.url === "string")
          return first.url;
      }
      return "";
    },
    todayStr() {
      const d = new Date();
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },
    heroBgStyle() {
      const url =
        this.heroImage ||
        "https://images.unsplash.com/photo-1709810953776-ee6027ff8104?q=80&w=2070&auto=format&fit=crop";
      return { backgroundImage: "url('" + url + "')" };
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
        const total = Number.isFinite(Number(r.totalScore))
          ? Number(r.totalScore)
          : sprint + h2h + slalom + drr;

        return {
          teamName: String(r.teamName || ""),
          bib: String(r.bib || ""),
          sprintScore: sprint,
          sprintRank: toNum(r.sprintRank),
          h2hScore: h2h,
          h2hRank: toNum(r.h2hRank),
          slalomScore: slalom,
          slalomRank: toNum(r.slalomRank),
          drrScore: drr,
          drrRank: toNum(r.drrRank),
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
/* -------- Base -------- */
.pdf-wrap {
  padding: 18px 22px;
  font-size: 12px;
  color: #1d2433;
}

/* -------- HERO -------- */
.detail-hero {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
}
.detail-hero .hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: saturate(1.1);
}
.detail-hero .hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45));
}
.detail-hero .hero-inner {
  position: relative;
  z-index: 1;
  padding: 16px 18px;
}
.hero-row {
  display: grid;
  grid-template-columns: 120px 1fr 140px;
  grid-gap: 12px;
  align-items: center;
}

.hero-logo {
  width: 110px;
  height: 110px;
  border-radius: 16px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
.hero-logo.compact {
  width: 80px;
  height: 80px;
}
.event-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

/* Judul + meta */
.hero-text .title {
  color: #fff;
  font-weight: 800;
  font-size: 24px;
  margin: 0 0 4px;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.35);
}
.hero-text .title.compact {
  font-size: 18px;
}
.hero-text .meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 600;
}
.hero-text .meta.compact {
  gap: 10px;
  font-size: 11px;
}

/* Stamp */
.stamp {
  justify-self: end;
  color: #d9534f;
  border: 2px solid #d9534f;
  border-radius: 6px;
  padding: 4px 8px;
  font-weight: 800;
  letter-spacing: 0.6px;
  transform: rotate(4deg);
  background: rgba(255, 255, 255, 0.1);
}
.stamp.official {
  color: #148a3b;
  border-color: #148a3b;
  transform: none;
  background: rgba(20, 138, 59, 0.12);
}

/* -------- Subheader -------- */
.block-head {
  margin: 10px 2px 8px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.muted {
  color: #6a707c;
  font-weight: 700;
}

/* -------- Table -------- */
.table-card {
  border: 1px solid #e9edf3;
  border-radius: 10px;
  overflow: hidden;
}
.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
}
.table thead th,
.table tbody td {
  border: 1px solid #e6e9ef;
  padding: 8px 8px;
}

/* Header 2 baris */
.table thead th {
  background: #f4f6f9;
  font-weight: 800;
}
.table thead th.group {
  font-size: 13px;
}
.table thead th.group.sprint {
  background: #d9e8ff;
}
.table thead th.group.h2h {
  background: #ffe0c7;
}
.table thead th.group.slalom {
  background: #fff2b8;
}
.table thead th.group.drr {
  background: #ccf7d9;
}
.table thead th.sub {
  background: #ffffff;
  font-weight: 700;
}

/* Body */
.table tbody tr:nth-child(even) {
  background: #fafbfc;
}
.bold {
  font-weight: 800;
}
.text-center {
  text-align: center;
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
}

/* -------- Footer -------- */
.pdf-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 10px;
}
.pdf-footer .label {
  font-weight: 600;
  margin-bottom: 38px;
}
.pdf-footer .signature {
  font-weight: 800;
}

/* -------- Page break -------- */
.page-break {
  page-break-after: always;
  break-after: page;
}
.page-block {
  margin-bottom: 6px;
}

/* -------- Print tweaks -------- */
@media print {
  .pdf-wrap {
    padding: 14px 16px;
  }
  .hero-text .title {
    font-size: 22px;
  }
}
</style>
