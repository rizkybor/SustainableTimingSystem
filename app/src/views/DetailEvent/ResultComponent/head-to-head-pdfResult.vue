<template>
  <div class="page">
    <!-- HEADER -->
    <header class="head">
      <!-- TRADEMARK -->
      <div class="trademark">
        @STiming.System.424.Timestamp {{ timestamp }} #-
      </div>

      <div class="band">
        <div class="band-left">
          <strong>RACETIME RESULT</strong>
          <span class="dot">•</span>
          <span class="cat">HEAD TO HEAD</span>
          <span class="dot">•</span>
          <span class="cat">
            {{
              eventData && eventData.levelName
                ? eventData.levelName
                : "Classification"
            }}
          </span>
        </div>
        <div class="band-right">
          <strong
            >{{ headToHeadCats.initial || "H2H" }} -
            {{ headToHeadCats.division || "DIV" }}
            {{ headToHeadCats.race || "RACE" }}</strong
          >
          <span class="dot">•</span>
          <span>{{ today }}</span>
        </div>
      </div>

      <!-- IMAGE DI ATAS EVENT NAME -->
      <div
        class="mid-image-row"
        v-if="
          eventData && eventData.event_logo && eventData.event_logo.length > 0
        "
      >
        <div
          v-for="(url, index) in eventData.event_logo"
          :key="index"
          class="mid-image py-4"
        >
          <img :src="url" alt="Event Poster" />
        </div>
      </div>

      <!-- EVENT INFO -->
      <div class="event">
        <div class="event-name">
          {{ eventData && eventData.eventName ? eventData.eventName : "-" }}
        </div>
        <div class="event-meta">
          Kp/Ds.
          {{
            eventData && eventData.addressVillage
              ? eventData.addressVillage
              : "-"
          }}, Kel.
          {{
            eventData && eventData.addressDistrict
              ? eventData.addressDistrict
              : "-"
          }}, Kec.
          {{
            eventData && eventData.addressSubDistrict
              ? eventData.addressSubDistrict
              : "-"
          }}, Kota
          {{
            eventData && eventData.addressCity ? eventData.addressCity : "-"
          }},
          {{
            eventData && eventData.addressProvince
              ? eventData.addressProvince
              : "-"
          }}
          –
          {{
            eventData && eventData.addressState ? eventData.addressState : "-"
          }}
          ({{
            eventData && eventData.addressZipCode
              ? eventData.addressZipCode
              : "-"
          }}) •
          {{ eventData && eventData.riverName ? eventData.riverName : "-" }}
        </div>
      </div>
    </header>

    <!-- CONTENT (ROUND / OVERALL) -->
    <section class="table-wrap">
      <!-- MODE ROUND -->
      <div v-if="pdfMode === 'round'">
        <h3 class="sheet-title">
          {{ pdfRound && (pdfRound.bronze ? "Final B" : pdfRound.name) }} —
          Result
        </h3>

        <table class="score-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Team</th>
              <th>BIB</th>
              <th>Heat</th>
              <th>Start</th>
              <th>Finish</th>
              <th>Race</th>
              <th>Penalty Sum</th>
              <th>Penalty Time</th>
              <th>Total</th>
              <th>W/L</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in pdfRoundRows || []" :key="r.no">
              <td class="text-center">{{ r.no }}</td>
              <td class="text-strong">
                {{ r.team }}
                <span v-if="r.flag" class="flag-badge">{{ r.flag }}</span>
              </td>
              <td class="text-center">{{ r.bib }}</td>
              <td class="text-center">{{ r.heat || "" }}</td>
              <td class="mono">{{ r.start }}</td>
              <td class="mono">{{ r.finish }}</td>
              <td class="mono">{{ r.race }}</td>
              <td class="text-center">{{ r.penaltySum }}</td>
              <td class="mono">{{ r.penaltyTime }}</td>
              <td class="mono text-strong">{{ r.total }}</td>
              <td class="text-center">{{ r.winLose || "" }}</td>
              <td class="text-center">{{ r.ranked || "" }}</td>
            </tr>
            <tr v-if="!pdfRoundRows || pdfRoundRows.length === 0">
              <td class="empty" colspan="12">No data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- MODE OVERALL -->
      <div v-else>
        <h3 class="sheet-title">Overall Result</h3>

        <!-- Podium -->
        <table
          v-if="
            pdfOverallPkg &&
            pdfOverallPkg.placements &&
            pdfOverallPkg.placements.length
          "
          class="score-table"
          style="margin-bottom: 10px"
        >
          <thead>
            <tr>
              <th>Place</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pdfOverallPkg.placements" :key="'pl-' + p.place">
              <td class="text-center">{{ p.place }}</td>
              <td class="text-strong">{{ p.team }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Sheet per round -->
        <div
          v-for="(R, idx) in pdfOverallPkg ? pdfOverallPkg.rounds : []"
          :key="'sheet-' + idx"
        >
          <div v-if="idx > 0" style="page-break-before: always"></div>
          <h3 class="sheet-title">{{ R.roundName }} — Result</h3>

          <table class="score-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Team</th>
                <th>BIB</th>
                <th>Heat</th>
                <th>Race</th>
                <th>Penalty Time</th>
                <th>Total</th>
                <th>W/L</th>
                <th>Rank</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in R.rows" :key="row.no">
                <td class="text-center">{{ row.no }}</td>
                <td class="text-strong">{{ row.team }}</td>
                <td class="text-center">{{ row.bib }}</td>
                <td class="text-center">{{ row.heat || "" }}</td>
                <td class="mono">{{ row.race }}</td>
                <td class="mono">{{ row.penaltyTime }}</td>
                <td class="mono text-strong">{{ row.total }}</td>
                <td class="text-center">{{ row.winLose || "" }}</td>
                <td class="text-center">{{ row.ranked || "" }}</td>
              </tr>
              <tr v-if="!R.rows || R.rows.length === 0">
                <td class="empty" colspan="9">No data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- SIGNATURE -->
    <footer class="sign">
      <div class="sign-col">
        <div class="sign-title">Chief Judge</div>
        <div class="sign-line"></div>
        <div class="sign-name">
          {{ eventData && eventData.chiefJudge ? eventData.chiefJudge : "—" }}
        </div>
      </div>
      <div class="sign-col stamp-col">
        <span
          class="unofficial-stamp"
          :class="{ 'official-stamp': isOfficial }"
        >
          {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
        </span>
      </div>
    </footer>

    <!-- SPONSOR LOGOS (bottom) -->
    <div
      class="mid-image-sponsor-row"
      v-if="
        eventData && eventData.event_logo && eventData.event_logo.length > 0
      "
    >
      <div
        v-for="(url, index) in eventData.event_logo"
        :key="'sponsor-' + index"
        class="mid-image-sponsor py-4"
      >
        <img :src="url" alt="Event Sponsor" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HeadToHeadPdfResult",
  props: {
    data: { type: Object, default: null },
    dataEventSafe: { type: Object, default: null },
    pdfMode: { type: String, default: "round" }, // 'round' | 'overall'
    pdfRound: { type: Object, default: null },
    pdfRoundRows: { type: Array, default: () => [] },
    pdfOverallPkg: { type: Object, default: null },
    categories: { type: String, default: "" },
    titleCategories: { type: String, default: "" },
    isOfficial: { type: Boolean, default: false },
    headToHeadCats: { type: Object, default: () => ({}) },
  },
  computed: {
    eventData() {
      return this.data || this.dataEventSafe || {};
    },
    today() {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return dd + "/" + mm + "/" + yyyy;
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
  },
};
</script>

<style scoped>
@page {
  size: A4 landscape;
  margin: 8mm;
}

* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* ===== PAGE AS FLEX COLUMN ===== */
.page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(210mm - 16mm);
  padding: 5mm 8mm;
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  font-size: 12px;
  line-height: 1.35;
  color: #17202a;
}
.table-wrap {
  flex: 1 1 auto;
  min-height: 0;
}
.mid-image-row {
  margin-bottom: 2mm !important;
}
.band {
  margin-bottom: 1mm !important;
}
header {
  margin-bottom: 0 !important;
}

/* ===== HEADER ===== */
.band {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgb(24, 116, 165);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  margin-bottom: 6mm;
  font-weight: 700;
}
.band .dot {
  margin: 0 4px;
  opacity: 0.9;
}

.event {
  text-align: center;
  margin-bottom: 4mm;
}
.event-name {
  font-weight: 800;
  font-size: 16px;
  color: rgb(24, 116, 165);
  margin-bottom: 3px;
}
.event-meta {
  font-size: 9.5px;
  color: rgb(24, 116, 165);
}

/* ===== SECTION TITLE ===== */
.sheet-title {
  margin: 8px 0 6px 0;
  font-size: 14px;
  font-weight: 800;
  color: #1f3b57;
}

/* ===== TABLE ===== */
.score-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #dde6ee;
  border-radius: 8px;
  overflow: hidden;
}
.score-table th,
.score-table td {
  border-bottom: 1px solid #f1f4f8;
  padding: 6px 8px;
}
.score-table thead th {
  background: rgb(240, 250, 255);
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 800;
  text-align: start;
}
.score-table tbody td {
  font-size: 12px;
}
.score-table tbody tr:nth-child(odd) {
  background: #fafcff;
}
.text-center {
  text-align: center;
}
.text-strong {
  font-weight: 700;
}
.mono {
  font-family: monospace;
}
.empty {
  text-align: center;
  color: #999;
  padding: 10px 0;
}

.flag-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid #ddd;
  margin-left: 6px;
  font-size: 11px;
}

/* ===== SIGNATURE ===== */
.sign {
  display: flex;
  justify-content: space-between;
  margin-top: 8mm;
  margin-bottom: 2mm;
  text-align: center;
  gap: 8mm;
}
.sign-col {
  width: 30%;
}
.sign-title {
  color: #8a95a3;
  font-size: 9px;
  margin-bottom: 5vh;
}
.sign-line {
  height: 2px;
  background: rgb(24, 116, 165);
  width: 75%;
  margin: 20px auto 6px;
  border-radius: 2px;
}
.sign-name {
  font-weight: 800;
  font-size: 12px;
  color: #1f2937;
}

/* ===== STAMP ===== */
.unofficial-stamp {
  color: #d9534f;
  font-weight: bold;
  text-transform: uppercase;
  border: 2px solid #d9534f;
  padding: 5px 12px;
  border-radius: 5px;
  transform: rotate(5deg);
  opacity: 0.9;
  font-size: 1rem;
  display: inline-block;
  letter-spacing: 0.8px;
}
.official-stamp {
  color: #148a3b;
  border-color: #148a3b;
  transform: rotate(0deg);
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(20, 138, 59, 0.12) inset;
}

/* ===== TOP LOGOS ===== */
.mid-image-row,
.mid-image-sponsor-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 2mm;
}
.mid-image {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.mid-image img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

/* ===== SPONSOR (bottom) ===== */
.mid-image-sponsor-row {
  margin-top: auto;
  margin-bottom: 0;
}
.mid-image-sponsor {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
.mid-image-sponsor img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

/* Hindari pecah di tengah blok */
header,
.band,
.mid-image-row,
.mid-image-sponsor-row {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Trademark */
.trademark {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(-9mm, 2mm);
  font-family: monospace;
  font-size: 8px;
  color: #8b8b8b;
  opacity: 0.7;
  letter-spacing: 0.5px;
}
</style>
