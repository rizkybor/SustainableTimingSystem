<template>
  <div class="page">
    <div class="trademark">Sustainable Timing System · Jendela Kode</div>

    <!-- HEADER -->
    <div class="event">
      <div class="event-name">{{ data.eventName || "Event Name" }}</div>
      <div class="event-meta">
        {{ data.addressCity || "-" }} · {{ data.riverName || "-" }} · Level:
        {{ data.levelName || "-" }}
      </div>
    </div>

    <!-- CATEGORY & STATUS -->
    <div class="band">
      <div>{{ categories || "SLALOM CATEGORY" }}</div>
      <div :class="[isOfficial ? 'official-stamp' : 'unofficial-stamp']">
        {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
      </div>
    </div>

    <!-- TABLE -->
    <div class="table-wrap">
      <table class="score-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Team Name</th>
            <th>BIB</th>
            <th>Start Pen.</th>
            <th>Finish Pen.</th>
            <th>Gate Pen.</th>
            <th>Total Pen.</th>
            <th>Race Time</th>
            <th>Penalty Time</th>
            <th>Total / Result</th>
            <th>Rank</th>
            <th>Score</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="dataParticipant.length === 0">
            <td colspan="12" class="empty">No data available</td>
          </tr>

          <tr v-for="(row, i) in dataParticipant" :key="i">
            <td class="text-center">{{ i + 1 }}</td>
            <td>{{ row.nameTeam || "-" }}</td>
            <td class="text-center">{{ row.bibTeam || "-" }}</td>

            <td class="text-center">{{ numVal(row, "startPenalty") }}</td>
            <td class="text-center">{{ numVal(row, "finishPenalty") }}</td>
            <td class="text-center">{{ numVal(row, "sectionPenalty") }}</td>
            <td class="text-center text-strong">{{ totalPenaltyRow(row) }}</td>

            <td class="mono text-center">{{ timeVal(row, "raceTime") }}</td>
            <td class="mono text-center">{{ timeVal(row, "penaltyTime") }}</td>
            <td class="mono text-center text-strong">
              {{ time(val(row, "totalTime") || val(row, "raceTime")) }}
            </td>

            <td class="text-center text-strong">
              {{ rank(val(row, "ranked")) }}
            </td>
            <td class="text-center">{{ num(val(row, "score")) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SECTION PENALTY TIMES -->
    <div v-if="hasSectionTimes" class="section-times">
      <h4>Section Penalty Times</h4>
      <table class="score-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Team</th>
            <th>BIB</th>
            <th v-for="(n, i) in maxSections" :key="i">Section {{ i + 1 }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in dataParticipant" :key="'st-' + i">
            <td class="text-center">{{ i + 1 }}</td>
            <td>{{ row.nameTeam || "-" }}</td>
            <td class="text-center">{{ row.bibTeam || "-" }}</td>
            <td
              v-for="(st, j) in sectionTimes(row)"
              :key="'stc-' + i + '-' + j"
              class="mono text-center subtime"
            >
              {{ time(st) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SIGN -->
    <div class="sign">
      <div class="sign-col">
        <div class="sign-title">RACE DIRECTOR</div>
        <div class="sign-line"></div>
        <div class="sign-name">{{ data.raceDirector || "-" }}</div>
      </div>
      <div class="sign-col">
        <div class="sign-title">CHIEF JUDGE</div>
        <div class="sign-line"></div>
        <div class="sign-name">{{ data.chiefJudge || "-" }}</div>
      </div>
      <div class="sign-col">
        <div class="sign-title">TECHNICAL DELEGATE</div>
        <div class="sign-line"></div>
        <div class="sign-name">_________________</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SlalomPdfResult",
  props: {
    data: { type: Object, required: true },
    dataParticipant: { type: Array, required: true },
    categories: { type: String, default: "" },
    isOfficial: { type: Boolean, default: false },
  },
  computed: {
    hasSectionTimes() {
      var i = 0;
      while (i < this.dataParticipant.length) {
        var r = this.dataParticipant[i];
        var rr = r && r.result ? r.result : {};
        var a = rr.sectionPenaltyTime;
        if (Array.isArray(a) && a.length > 0) return true;
        i++;
      }
      return false;
    },
    maxSections() {
      var max = 0;
      var i = 0;
      while (i < this.dataParticipant.length) {
        var r = this.dataParticipant[i];
        var rr = r && r.result ? r.result : {};
        var a = rr.sectionPenaltyTime;
        if (Array.isArray(a) && a.length > max) max = a.length;
        i++;
      }
      var arr = [];
      var j = 0;
      while (j < max) {
        arr.push(j);
        j++;
      }
      return arr;
    },
  },
  methods: {
    // ambil field dari row.result tanpa optional chaining
    val(row, field) {
      var rr = row && row.result ? row.result : {};
      return rr[field];
    },
    timeVal(row, field) {
      return this.time(this.val(row, field));
    },
    numVal(row, field) {
      return this.num(this.val(row, field));
    },
    totalPenaltyRow(row) {
      return (
        this.numVal(row, "startPenalty") +
        this.numVal(row, "finishPenalty") +
        this.numVal(row, "sectionPenalty")
      );
    },

    time(v) {
      var s = String(v || "").trim();
      return s ? s : "00:00:00.000";
    },
    num(v) {
      var n = Number(v);
      return Number.isFinite(n) ? n : 0;
    },
    rank(v) {
      var n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : "-";
    },
    sectionTimes(row) {
      var rr = row && row.result ? row.result : {};
      var a = rr.sectionPenaltyTime;
      if (!Array.isArray(a)) return [];
      var out = [];
      var i = 0;
      while (i < a.length) {
        var val = String(a[i] || "").trim();
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
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  margin-bottom: 6mm;
  font-weight: 700;
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
  transform: rotate(0);
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(20, 138, 59, 0.12) inset;
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
  margin-top: 8mm;
}
.subtime {
  font-size: 11px;
  line-height: 1.15;
}
</style>
