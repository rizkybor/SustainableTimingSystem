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
            <th rowspan="2">No</th>
            <th rowspan="2">Team</th>
            <th rowspan="2">1st Run Rank</th>

            <th rowspan="2">BIB</th>

            <th :colspan="maxGates + 2" class="pen-group text-center py-2">
              Penalties
            </th>

            <th rowspan="2" class="col-total-penalty text-center">Total</th>
            <th rowspan="2">Penalty Time</th>
            <th rowspan="2">Start Time</th>
            <th rowspan="2">Finish Time</th>
            <th rowspan="2">Race Time</th>
            <th rowspan="2">Total Time</th>
          </tr>
          <tr>
            <th class="pen-head start">S</th>
            <th class="pen-head section" v-for="n in maxGates" :key="'gh' + n">
              {{ n }}
            </th>
            <th class="pen-head finish">F</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(p, i) in pdfParticipantsSession1" :key="i">
            <td class="text-center">{{ i + 1 }}</td>
            <td class="text-strong">{{ p.nameTeam || "-" }}</td>
            <td class="center">
              {{
                p && p.result && p.result[0] && p.result[0].ranked
                  ? p.result[0].ranked
                  : p.ranked || "-"
              }}
            </td>
            <td class="text-center">{{ p.bibTeam || "-" }}</td>

            <!-- Start -->
            <td class="right">
              {{ hasGates(p) ? toNum(p.result[0].penaltyTotal.start) : 0 }}
            </td>

            <!-- Gates 1..maxGates -->
            <td
              class="right"
              v-for="(v, idx) in padToMaxGates(getGates(p), maxGates)"
              :key="'gv' + i + '-' + idx"
            >
              {{ toNum(v) }}
            </td>

            <!-- Finish -->
            <td class="right">
              {{ hasGates(p) ? toNum(p.result[0].penaltyTotal.finish) : 0 }}
            </td>

            <!-- Total Penalty -->
            <td class="col-total-penalty right text-center">
              {{
                hasGates(p)
                  ? toNum(p.result[0].penaltyTotal.start) +
                    padToMaxGates(getGates(p), maxGates).reduce(function (
                      a,
                      v
                    ) {
                      return a + toNum(v);
                    },
                    0) +
                    toNum(p.result[0].penaltyTotal.finish)
                  : 0
              }}
            </td>

            <td class="center">
              {{
                p && p.result && p.result[0] && p.result[0].penaltyTime
                  ? p.result[0].penaltyTime
                  : "00:00:00.000"
              }}
            </td>

            <td class="text-center">{{ p.result[0].startTime || "-" }}</td>

            <td class="text-center">{{ p.result[0].finishTime || "-" }}</td>

            <!-- Race / Penalty / Total / Rank -->
            <td class="center">
              {{
                p && p.result && p.result[0] && p.result[0].raceTime
                  ? p.result[0].raceTime
                  : "00:00:00.000"
              }}
            </td>

            <td class="center text-strong">
              {{
                p && p.result && p.result[0] && p.result[0].totalTime
                  ? p.result[0].totalTime
                  : "00:00:00.000"
              }}
            </td>
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
        <span class="unofficial-stamp"> "UNOFFICIAL" </span>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: "SlalomSession1PdfResult",
  props: {
    data: {
      type: Object,
      default: function () {
        return {};
      },
    },
    pdfParticipantsSession1: { type: Array, required: true },
    titleCategories: { type: String, default: "" },
    isOfficial: { type: Boolean, default: false },
  },
  computed: {
    maxGates() {
      var max = 1;
      var arr = this.pdfParticipantsSession1 || [];
      for (var i = 0; i < arr.length; i++) {
        var p = arr[i];
        if (
          p &&
          p.result &&
          Array.isArray(p.result) &&
          p.result.length &&
          p.result[0] &&
          p.result[0].penaltyTotal &&
          Array.isArray(p.result[0].penaltyTotal.gates)
        ) {
          var len = p.result[0].penaltyTotal.gates.length;
          if (len > max) max = len;
        }
      }
      return max; // minimal 1 gate
    },
    today() {
      var d = new Date();
      var dd = String(d.getDate()).padStart(2, "0");
      var mm = String(d.getMonth() + 1).padStart(2, "0");
      var yyyy = d.getFullYear();
      return dd + "/" + mm + "/" + yyyy;
    },
    timestamp() {
      var d = new Date();
      var pad = function (x) {
        return String(x).padStart(2, "0");
      };
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
  methods: {
    toNum(v) {
      var n = Number(v);
      return isNaN(n) ? 0 : n;
    },
    hasGates(p) {
      return (
        p &&
        p.result &&
        Array.isArray(p.result) &&
        p.result.length &&
        p.result[0] &&
        p.result[0].penaltyTotal &&
        Array.isArray(p.result[0].penaltyTotal.gates)
      );
    },
    getGates(p) {
      return this.hasGates(p) ? p.result[0].penaltyTotal.gates : [];
    },
    padToMaxGates(arr, max) {
      var out = Array.isArray(arr) ? arr.slice(0, max) : [];
      while (out.length < max) out.push(0);
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
  overflow-x: auto;
  width: 100%;
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

/* === Mini Table di kolom Gates (Detail) === */
.mini-penalty {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  background: #fff;
}
.mini-penalty th,
.mini-penalty td {
  border: 0.6px solid #dde6ee;
  text-align: center;
  padding: 3px 4px;
  line-height: 1.2;
}
.mini-penalty .mini-title {
  background: rgb(240, 250, 255);
  color: #173f5f;
  font-weight: 800;
  text-transform: uppercase;
}
.mini-penalty .mini-head {
  background: #f7fafd;
  color: #111;
  font-weight: 700;
  font-size: 9px;
}
.mini-penalty .mini-val {
  font-weight: 700;
  color: #111;
  background: #fff;
}

/* --- table sizing umum --- */
.score-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* kolom proporsional */
  border: 0.6px solid #dde6ee;
  border-radius: 6px;
  overflow: hidden;
  box-sizing: border-box;
}

.score-table th,
.score-table td {
  border: 0.6px solid #e0e6eb;
  padding: 3px 4px; /* lebih kecil */
  font-size: 9.5px; /* kecilkan keseluruhan */
  line-height: 1.15; /* rapat biar gak “tumpah” */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* cegah teks keluar border */
}

/* --- header (thead) lebih kecil lagi --- */
.score-table thead th {
  background: rgb(240, 250, 255);
  text-transform: uppercase;
  font-size: 8.8px; /* kecilkan header */
  font-weight: 800;
  text-align: center;
  padding: 2px 3px; /* header padding kecil */
}

/* --- kolom penting diberi lebar agar stabil --- */
.score-table th:nth-child(1),
.score-table td:nth-child(1) {
  width: 28px;
} /* No */

.score-table th:nth-child(2),
.score-table td:nth-child(2) {
  width: 100px;
} /* Team */

.score-table th:nth-child(3),
.score-table td:nth-child(3) {
  width: 80px;
} /* 1st Run Rank */

.score-table th:nth-child(4),
.score-table td:nth-child(4) {
  width: 44px;
} /* BIB */

/* kolom-kolom di ujung */
.score-table th:nth-last-child(6),
.score-table td:nth-last-child(6) {
  width: 80px;
} /* Total Penalty */

.score-table th:nth-child(7),
.score-table td:nth-child(7) {
  width: 80px;
} /* Start Time */

.score-table th:nth-last-child(4),
.score-table td:nth-last-child(4) {
  width: 80px;
} /* Penalty Time */
.score-table th:nth-last-child(3),
.score-table td:nth-last-child(3) {
  width: 80px;
} /* Finish Time */
.score-table th:nth-last-child(2),
.score-table td:nth-last-child(2) {
  width: 80px;
} /* Race Time */
.score-table th:nth-last-child(1),
.score-table td:nth-last-child(1) {
  width: 80px;
} /* Total (waktu) */

/* --- heading untuk grup penalties & cell gates lebih rapat --- */
.pen-group {
  font-size: 9.5px;
  padding: 2px 0;
}
.pen-head {
  background: #f2f6fb;
  font-size: 8px;
  padding: 2px 0;
}

/* --- gaya angka gates (start, gates v-for, finish) --- */
.gate-cell {
  font-size: 9.5px;
  padding: 2px 2px; /* super rapat agar muat */
  text-align: center; /* angka di tengah */
}

/* cetak: perkecil sedikit biar aman di A4 landscape */
@media print {
  .score-table,
  .score-table th,
  .score-table td,
  .mini-penalty th,
  .mini-penalty td {
    border-width: 0.35pt; /* ~0.47px, tipis & konsisten di PDF */
  }
}

/* ==== Total Penalty column width ==== */
.score-table th.col-total-penalty,
.score-table td.col-total-penalty {
  width: 50px; /* atur sesuai selera: 110–140px */
  min-width: 120px;
  max-width: 140px; /* cegah melebar berlebihan */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* kalau mau sedikit lebih lega saat print */
@media print {
  .score-table th.col-total-penalty,
  .score-table td.col-total-penalty {
    width: 130px;
    min-width: 130px;
  }
}
</style>
