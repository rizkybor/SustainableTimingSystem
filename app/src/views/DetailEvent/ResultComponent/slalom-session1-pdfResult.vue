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
          <span class="cat">{{ titleCategories || "SLALOM" }}</span>
          <span class="dot">•</span>
          <span class="cat">Session 1</span>
        </div>
        <div class="band-right">
          <strong>Slalom Session 1 Result</strong>
          <span class="dot">•</span>
          <span>{{ today }}</span>
        </div>
      </div>

      <!-- EVENT INFO -->
      <div class="event">
        <div class="event-name">
          {{ data && data.eventName ? data.eventName : "—" }}
        </div>
        <div class="event-meta">
          {{ data && data.addressCity ? data.addressCity : "-" }},
          {{ data && data.addressProvince ? data.addressProvince : "-" }}
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
            <th>Gates (Detail)</th>
            <th>Finish</th>
            <th>Total Penalty</th>
            <th>Race</th>
            <th>Penalty</th>
            <th>Total</th>
            <th>Rank</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(p, i) in pdfParticipantsSession1" :key="i">
            <td class="text-center">{{ i + 1 }}</td>
            <td class="text-strong">{{ p.nameTeam || "-" }}</td>
            <td class="text-center">{{ p.bibTeam || "-" }}</td>

            <!-- Start -->
            <td class="right">
              {{ p.result && p.result.penaltyTotal ? p.result.penaltyTotal.start : 0 }}
            </td>

            <!-- Gates list -->
            <td class="right">
              <div
                v-if="
                  p.result &&
                  p.result.penaltyTotal &&
                  Array.isArray(p.result.penaltyTotal.gates) &&
                  p.result.penaltyTotal.gates.length
                "
              >
                <ul class="penalty-list">
                  <li
                    v-for="(pen, idx) in p.result.penaltyTotal.gates"
                    :key="idx"
                  >
                    Gate {{ idx + 1 }}: <strong>{{ pen }}</strong>
                  </li>
                </ul>
                <div class="penalty-sum">
                  Σ Gates =
                  <strong>
                    {{
                      p.result.penaltyTotal.gates.reduce(function (a, v) {
                        return a + Number(v || 0);
                      }, 0)
                    }}
                  </strong>
                </div>
              </div>
              <div v-else>0</div>
            </td>

            <!-- Finish -->
            <td class="right">
              {{ p.result && p.result.penaltyTotal ? p.result.penaltyTotal.finish : 0 }}
            </td>

            <!-- Total Penalty (Start + Gates + Finish) -->
            <td class="right">
              {{
                p.result && p.result.penaltyTotal
                  ? Number(p.result.penaltyTotal.start || 0) +
                    p.result.penaltyTotal.gates.reduce(function (a, v) {
                      return a + Number(v || 0);
                    }, 0) +
                    Number(p.result.penaltyTotal.finish || 0)
                  : 0
              }}
            </td>

            <!-- Race / Penalty / Total / Rank -->
            <td class="center">{{ p.result ? p.result.raceTime : "00:00:00.000" }}</td>
            <td class="center">{{ p.result ? p.result.penaltyTime : "00:00:00.000" }}</td>
            <td class="center text-strong">{{ p.result ? p.result.totalTime : "00:00:00.000" }}</td>
            <td class="center">{{ p.result ? p.result.ranked : "-" }}</td>
          </tr>

          <tr v-if="pdfParticipantsSession1.length === 0">
            <td class="empty" colspan="11">No data</td>
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
  </div>
</template>

<script>
export default {
  name: "SlalomSession1PdfResult",
  props: {
    data: { type: Object, default: function () { return {}; } },
    pdfParticipantsSession1: { type: Array, required: true },
    titleCategories: { type: String, default: "" },
    isOfficial: { type: Boolean, default: false },
  },
  computed: {
    today() {
      var d = new Date();
      var dd = String(d.getDate()).padStart(2, "0");
      var mm = String(d.getMonth() + 1).padStart(2, "0");
      var yyyy = d.getFullYear();
      return dd + "/" + mm + "/" + yyyy;
    },
    timestamp() {
      var d = new Date();
      var pad = function (x) { return String(x).padStart(2, "0"); };
      return (
        pad(d.getDate()) +
        "/" +
        pad(d.getMonth() + 1) +
        "/" +
        d.getFullYear() +
        " " +
        pad(d.getHours()) +
        ":" +
        pad(d.getMinutes()) +
        ":" +
        pad(d.getSeconds())
      );
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
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  margin-bottom: 5mm;
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
  font-size: 11px;
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
.right {
  text-align: right;
}
.center {
  text-align: center;
}
.empty {
  text-align: center;
  color: #999;
  padding: 10px 0;
}
.penalty-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 11px;
  line-height: 1.2;
}
.penalty-list li {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #e0e6eb;
  padding: 2px 0;
}
.penalty-sum {
  text-align: right;
  font-size: 11px;
  font-weight: 700;
  margin-top: 2px;
  color: #174a72;
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