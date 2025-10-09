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
            <th rowspan="2" class="text-center">No</th>
            <th rowspan="2">TEAM</th>
            <th rowspan="2" class="wrap-title">1st Run Rank</th>
            <th rowspan="2" class="text-center">BIB</th>
            <th rowspan="2" class="text-center">RUN</th>

            <th :colspan="maxGates + 2" class="pen-group text-center">
              PENALTIES
            </th>

            <th rowspan="2" class="col-total-penalty text-center wrap-title">
              TOTAL PENALTY
            </th>
            <th rowspan="2" class="text-center">TIME PENALTY</th>
            <th rowspan="2" class="text-center">START TIME</th>
            <th rowspan="2" class="text-center">FINISH TIME</th>
            <th rowspan="2" class="text-center">RACE TIME</th>
            <th rowspan="2" class="text-center">TOTAL TIME</th>
            <th rowspan="2" class="text-center">BEST TIME</th>
            <th rowspan="2" class="text-center">RANK</th>
          </tr>
          <tr>
            <th class="pen-head start">S</th>
            <th class="pen-head section" v-for="n in maxGates" :key="'h' + n">
              {{ n }}
            </th>
            <th class="pen-head finish">F</th>
          </tr>
        </thead>

        <!-- Satu <tbody> per tim (boleh banyak tbody di dalam table) -->
        <tbody
          v-for="(t, i) in pdfParticipantsSession1"
          :key="t && t.bibTeam ? 'team-' + t.bibTeam : 'idx-' + i"
        >
          <!-- RUN 1 -->
          <tr>
            <td class="center" :rowspan="2">{{ i + 1 }}</td>
            <td class="text-strong" :rowspan="2">{{ teamName(t) }}</td>
            <td class="center" :rowspan="2">{{ firstRunRank(t) }}</td>
            <td class="center" :rowspan="2">{{ bib(t) }}</td>

            <td class="center">1</td>

            <td class="right">{{ startAt(t, 0) }}</td>
            <td
              class="right"
              v-for="(v, gi) in gatesAtPadded(t, 0)"
              :key="'r1g' + gi"
            >
              {{ v }}
            </td>
            <td class="right">{{ finishAt(t, 0) }}</td>

            <td class="center col-total-penalty">{{ totalPenaltyAt(t, 0) }}</td>
            <td class="center">{{ timeAt(t, 0, "penaltyTime") }}</td>
            <td class="center">{{ timeAt(t, 0, "startTime") }}</td>
            <td class="center">{{ timeAt(t, 0, "finishTime") }}</td>
            <td class="center">{{ timeAt(t, 0, "raceTime") }}</td>
            <td class="center text-strong">{{ timeAt(t, 0, "totalTime") }}</td>

            <td class="center" :rowspan="2">{{ bestTime(t) }}</td>
            <td class="center" :rowspan="2">{{ teamRank(t) }}</td>
          </tr>

          <!-- RUN 2 -->
          <tr>
            <td class="center">2</td>

            <td class="right">{{ startAt(t, 1) }}</td>
            <td
              class="right"
              v-for="(v, gi) in gatesAtPadded(t, 1)"
              :key="'r2g' + gi"
            >
              {{ v }}
            </td>
            <td class="right">{{ finishAt(t, 1) }}</td>

            <td class="center col-total-penalty">{{ totalPenaltyAt(t, 1) }}</td>
            <td class="center">{{ timeAt(t, 1, "penaltyTime") }}</td>
            <td class="center">{{ timeAt(t, 1, "startTime") }}</td>
            <td class="center">{{ timeAt(t, 1, "finishTime") }}</td>
            <td class="center">{{ timeAt(t, 1, "raceTime") }}</td>
            <td class="center text-strong">{{ timeAt(t, 1, "totalTime") }}</td>
          </tr>
        </tbody>

        <!-- Tampil bila tidak ada data -->
        <tbody
          v-if="!pdfParticipantsSession1 || !pdfParticipantsSession1.length"
        >
          <tr>
            <td class="empty" colspan="999">No data</td>
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
      let m = 1,
        arr = this.pdfParticipantsSession1 || [];
      for (const t of arr) {
        const r0 = this.run(t, 0),
          r1 = this.run(t, 1);
        const g0 =
          r0 && r0.penaltyTotal && Array.isArray(r0.penaltyTotal.gates)
            ? r0.penaltyTotal.gates.length
            : 0;
        const g1 =
          r1 && r1.penaltyTotal && Array.isArray(r1.penaltyTotal.gates)
            ? r1.penaltyTotal.gates.length
            : 0;
        m = Math.max(m, g0, g1);
      }
      return m;
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
    num(v) {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    },

    // --- akses aman level team/run ---
    teamName(t) {
      return (t && t.nameTeam) || "-";
    },
    bib(t) {
      return (t && t.bibTeam) || "-";
    },
    bestTime(t) {
      if (this.pdfParticipantsSession1.length == 0) {
        return (t && t.bestTime) || "00:00:00.000";
      } else {
        return "00:00:00.000";
      }
    },
    teamRank(t) {
      if (this.pdfParticipantsSession1.length == 0) {
        return (t && t.ranked) || "-";
      } else {
        return "-"
      }
    },

    run(t, idx) {
      if (!t || !Array.isArray(t.result)) return null;
      return t.result[idx] || null;
    },

    firstRunRank(t) {
      const r = this.run(t, 0);
      return r && r.ranked ? r.ranked : "-";
    },

    // --- penalties ---
    penaltyTotal(t, idx) {
      const r = this.run(t, idx);
      return r && r.penaltyTotal
        ? r.penaltyTotal
        : { start: 0, gates: [], finish: 0 };
    },
    startAt(t, idx) {
      return this.num(this.penaltyTotal(t, idx).start);
    },
    finishAt(t, idx) {
      return this.num(this.penaltyTotal(t, idx).finish);
    },
    gatesAt(t, idx) {
      const g = this.penaltyTotal(t, idx).gates;
      return Array.isArray(g) ? g : [];
    },
    gatesAtPadded(t, idx) {
      const g = this.gatesAt(t, idx).slice(0, this.maxGates);
      while (g.length < this.maxGates) g.push(0);
      return g.map(this.num);
    },
    totalPenaltyAt(t, idx) {
      const pt = this.penaltyTotal(t, idx);
      const sumG = this.gatesAtPadded(t, idx).reduce(
        (a, b) => a + this.num(b),
        0
      );
      return this.num(pt.start) + sumG + this.num(pt.finish);
    },

    // --- times ---
    timeAt(t, idx, key) {
      const r = this.run(t, idx);
      const v = r && r[key];
      return v || (key === "penaltyTime" ? "00:00:00.000" : "-");
    },
  },
};
</script>

<style scoped>
/* --- Header yang bisa wrap text --- */
.wrap-title {
  white-space: normal !important; /* izinkan teks turun ke baris berikutnya */
  word-wrap: break-word; /* potong kata panjang kalau perlu */
  overflow-wrap: anywhere; /* modern support */
  text-align: center; /* teks tetap di tengah */
  vertical-align: middle; /* sejajarkan vertikal */
  line-height: 1.2; /* jarak antar baris pas */
  padding: 2px 4px; /* ruang di sekitar teks */
  max-width: 70px; /* batasi lebar kolom agar wrap terjadi */
  background: rgb(240, 250, 255); /* biar konsisten dengan header */
  font-weight: 800;
  font-size: 8.8px;
}
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
  /* text-align: end; */
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
  width: 44px;
} /* 1st Run Rank */

.score-table th:nth-child(4),
.score-table td:nth-child(4) {
  width: 30px;
} /* BIB */

.score-table th:nth-child(5),
.score-table td:nth-child(5) {
  width: 30px;
} /* RUN */

/* kolom-kolom di ujung */
.score-table th:nth-last-child(6),
.score-table td:nth-last-child(6) {
  width: 80px;
} /* Total Penalty */

.score-table th:nth-child(7),
.score-table td:nth-child(7) {
  width: 80px;
} /* Time Penalty */

.score-table th:nth-child(8),
.score-table td:nth-child(8) {
  width: 80px;
} /* Start Time */

.score-table th:nth-child(10),
.score-table td:nth-child(10) {
  width: 80px;
} /* Finish Time */

.score-table th:nth-child(11),
.score-table td:nth-child(11) {
  width: 80px;
} /* Race Time */

.score-table th:nth-child(12),
.score-table td:nth-child(12) {
  width: 80px;
} /* Total Time */

.score-table th:nth-child(13),
.score-table td:nth-child(13) {
  width: 80px;
} /* Best Time */

.score-table th:nth-child(14),
.score-table td:nth-child(14) {
  width: 35px;
} /* Rank */

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
  width: 55px; /* atur sesuai selera: 110–140px */
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

.wrap-title {
  white-space: normal; 
  word-wrap: break-word; 
  overflow-wrap: anywhere; 
  max-width: 80px;
  text-align: center; 
  vertical-align: middle; 
  line-height: 1.2; 
  padding: 2px 4px; 
}
</style>
