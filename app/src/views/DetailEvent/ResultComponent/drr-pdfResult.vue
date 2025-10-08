<template>
  <div class="page">
    <!-- HEADER -->
    <header class="head">
      <div class="trademark">
        @STiming.System.424.Timestamp {{ timestamp }} #-
      </div>
      <div class="band">
        <div class="band-left">
          <strong>SCORE BOARD</strong>
          <span class="dot">•</span>
          <span class="cat">{{ categories || "DRR" }}</span>
          <span class="dot">•</span>
          <span class="cat">
            {{ data && data.levelName ? data.levelName : "Classification" }}
          </span>
        </div>
        <div class="band-right">
          <strong
            >{{ drrCats.initial }} - {{ drrCats.division }}
            {{ drrCats.race }}</strong
          >
          <span class="dot">•</span>
          <span>{{ today }}</span>
        </div>
      </div>

      <!-- TOP LOGO(S) -->
      <div
        class="mid-image-row"
        v-if="data && data.event_logo && data.event_logo.length > 0"
      >
        <div
          v-for="(url, index) in data.event_logo"
          :key="index"
          class="mid-image py-4"
        >
          <img :src="url" alt="Event Poster" />
        </div>
      </div>

      <!-- EVENT INFO -->
      <div class="event">
        <div class="event-name">
          {{ data && data.eventName ? data.eventName : "-" }}
        </div>
        <div class="event-meta">
          Kp/Ds. {{ data && data.addressVillage ? data.addressVillage : "-" }},
          Kel. {{ data && data.addressDistrict ? data.addressDistrict : "-" }},
          Kec.
          {{ data && data.addressSubDistrict ? data.addressSubDistrict : "-" }},
          Kota {{ data && data.addressCity ? data.addressCity : "-" }},
          {{ data && data.addressProvince ? data.addressProvince : "-" }} –
          {{ data && data.addressState ? data.addressState : "-" }}
          ({{ data && data.addressZipCode ? data.addressZipCode : "-" }}) •
          {{ data && data.riverName ? data.riverName : "-" }}
        </div>
      </div>
    </header>

    <!-- TABLE -->
    <section class="table-wrap">
      <table class="score-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Team</th>
            <th>BIB</th>
            <th>Start</th>
            <th>Finish</th>
            <th>Race Time</th>
            <th>Pen. Start</th>
            <th>Pen. Section</th>
            <th>Pen. Finish</th>
            <th>Pen. Total</th>
            <th>Penalty Time</th>
            <th>Result</th>
            <th>Rank</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, i) in rows" :key="i">
            <td class="text-center">{{ i + 1 }}</td>

            <td class="text-strong">
              {{ row && row.nameTeam ? row.nameTeam : "-" }}
            </td>
            <td class="text-center">
              {{ row && row.bibTeam ? row.bibTeam : "-" }}
            </td>

            <td class="mono">
              {{ time(row && row.result ? row.result.startTime : "") }}
            </td>
            <td class="mono">
              {{ time(row && row.result ? row.result.finishTime : "") }}
            </td>
            <td class="mono">
              {{ time(row && row.result ? row.result.raceTime : "") }}
            </td>

            <td class="text-center">
              {{ num(row && row.result ? row.result.startPenalty : 0) }}
            </td>

            <td class="text-center">
              <div v-if="sectionTimes(row).length" class="section-times">
                <div
                  v-for="(t, idx) in sectionTimes(row)"
                  :key="idx"
                  class="mono subtime"
                >
                  {{ time(t) }}
                </div>
              </div>
            </td>

            <td class="text-center">
              {{ num(row && row.result ? row.result.finishPenalty : 0) }}
            </td>
            <td class="text-center">
              {{ num(row && row.result ? row.result.totalPenalty : 0) }}
            </td>

            <td class="mono">
              {{
                time(
                  row && row.result
                    ? row.result.totalPenaltyTime || row.result.penaltyTime
                    : ""
                )
              }}
            </td>

            <td class="mono text-strong">
              {{
                time(
                  row && row.result
                    ? row.result.totalTime || row.result.raceTime
                    : ""
                )
              }}
            </td>

            <td class="text-center">
              {{ rank(row && row.result ? row.result.ranked : 0) }}
            </td>
            <td class="text-center">
              {{ num(row && row.result ? row.result.score : 0) }}
            </td>
          </tr>

          <tr v-if="rows.length === 0">
            <td class="empty" colspan="14">No data</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SIGNATURE -->
    <footer class="sign">
      <div class="sign-col">
        <div class="sign-title">Chief Judge</div>
        <div class="sign-line"></div>
        <div class="sign-name">
          {{ data && data.chiefJudge ? data.chiefJudge : "—" }}
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

    <!-- SPONSOR LOGO(S) -->
    <div
      class="mid-image-sponsor-row"
      v-if="data && data.event_logo && data.event_logo.length > 0"
    >
      <div
        v-for="(url, index) in data.event_logo"
        :key="index"
        class="mid-image-sponsor py-4"
      >
        <img :src="url" alt="Event Sponsor" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DrrPdfResult",
  props: {
    data: { type: Object, required: true },
    dataParticipant: { type: Array, required: true },
    categories: { type: String, default: "" },
    isOfficial: { type: Boolean, default: false },
    drrCats: { type: Object, required: true },
  },
  computed: {
    rows() {
      return Array.isArray(this.dataParticipant) ? this.dataParticipant : [];
    },
    today() {
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
  },
  methods: {
    time(v) {
      const s = String(v || "").trim();
      return s ? s : "00:00:00.000";
    },
    num(v) {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    },
    rank(v) {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : "-";
    },
    sectionTimes(row) {
      const r = row && row.result ? row.result : {};
      const a = r.sectionPenaltyTime;
      if (!Array.isArray(a)) return [];
      const out = [];
      let i = 0;
      while (i < a.length) {
        const val = String(a[i] || "").trim();
        if (val) out.push(val);
        i++;
      }
      return out;
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
.muted {
  color: #7e8aa0;
  font-size: 10px;
}
.empty {
  text-align: center;
  color: #999;
  padding: 10px 0;
}

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

.mid-image-row,
.mid-image-sponsor-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 2mm;
  margin: 2mm 0;
}
.mid-image img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}
.mid-image-sponsor-row {
  margin-top: auto;
  margin-bottom: 0;
}
.mid-image-sponsor img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

header,
.band,
.mid-image-row,
.mid-image-sponsor-row {
  page-break-inside: avoid;
  break-inside: avoid;
}

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

.section-times {
  margin-top: 2px;
}
.subtime {
  font-size: 11px;
  line-height: 1.15;
}
</style>
