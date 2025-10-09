<template>
  <div class="page">
    <!-- HEADER -->
    <header class="head">


    <!-- TRADEMARK -->
    <div class="trademark">@STiming.System.424.Timestamp {{ timestamp }} #-</div>
      <div class="band">
        <div class="band-left">
          <strong>SCORE BOARD</strong>
          <span class="dot">•</span>
          <span class="cat">{{ categories || "SPRINT" }}</span>
          <span class="dot">•</span>
          <span class="cat">
            {{ data && data.levelName ? data.levelName : "Classification" }}
          </span>
        </div>
        <div class="band-right">
          <strong>{{ sprintCats.initial }} -
            {{ sprintCats.division }} {{ sprintCats.race }}</strong>
          <span class="dot">•</span>
          <span>{{ today }}</span>
        </div>
      </div>

      <!-- IMAGE DI ATAS EVENT NAME -->
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
          Kp/Ds.
          {{ data && data.addressVillage ? data.addressVillage : "-" }}, Kel.
          {{ data && data.addressDistrict ? data.addressDistrict : "-" }}, Kec.
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
            <th>Penalties</th>
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
              {{
                row && row.result && row.result.startTime
                  ? row.result.startTime
                  : "-"
              }}
            </td>
            <td class="mono">
              {{
                row && row.result && row.result.finishTime
                  ? row.result.finishTime
                  : "-"
              }}
            </td>
            <td class="mono">
              {{
                row && row.result && row.result.raceTime
                  ? row.result.raceTime
                  : "-"
              }}
            </td>
            <td class="text-center">
              {{
                row && row.result && row.result.penalty ? row.result.penalty : 0
              }}
            </td>
            <td class="mono">
              {{
                row && row.result && row.result.penaltyTime
                  ? row.result.penaltyTime
                  : "-"
              }}
            </td>
            <td class="mono text-strong">
              {{
                row && row.result && row.result.totalTime
                  ? row.result.totalTime
                  : "-"
              }}
            </td>
            <td class="text-center">
              {{
                row && row.result && row.result.ranked ? row.result.ranked : "-"
              }}
            </td>
            <td class="text-center">
              {{ row && row.result && row.result.score ? row.result.score : 0 }}
            </td>
          </tr>
          <tr v-if="rows.length === 0">
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
  name: "SprintPdfResult",
  props: {
    data: { type: Object, required: true },
    dataParticipant: { type: Array, required: true },
    categories: { type: String, default: "" },
    isOfficial: { type: Boolean, default: false },
    sprintCats: { type: Object, required: true },
  },
  computed: {
    rows() {
      if (Array.isArray(this.dataParticipant)) {
        return this.dataParticipant;
      }
      return [];
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

/* ===== PAGE AS FLEX COLUMN (baru) ===== */
.page {
  position: relative;
  display: flex;                 /* NEW */
  flex-direction: column;        /* NEW */
  /* tinggi area konten = tinggi A4 (210mm) - margin @page atas+bawah (8+8) */
  min-height: calc(210mm - 16mm);/* NEW: menahan sponsor di dasar halaman */
  padding: 5mm 8mm;
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 12px;
  line-height: 1.35;
  color: #17202a;
}

/* biarkan area tabel jadi pengisi ruang tengah fleksibel (baru) */
.table-wrap {                    /* NEW */
  flex: 1 1 auto;
  min-height: 0;
}

.mid-image-row { margin-bottom: 2mm !important; }
.band { margin-bottom: 1mm !important; }
header { margin-bottom: 0 !important; }

/* ===== HEADER ===== */
.band {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgb(24, 116, 165);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  margin-bottom: 6mm; /* akan tertimpa oleh !important di atas → tetap hemat */
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
.text-center { text-align: center; }
.text-strong { font-weight: 700; }
.mono { font-family: monospace; }
.empty {
  text-align: center;
  color: #999;
  padding: 10px 0;
}

/* ===== SIGNATURE ===== */
.sign {
  display: flex;
  justify-content: space-between;
  grid-template-columns: 1fr 1fr 1fr;
  margin-top: 8mm;
  margin-bottom: 2mm;            /* NEW: beri ruang untuk sponsor */
  text-align: center;
  gap: 8mm;
}
.sign-col { width: 30%; }
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
.mid-image-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 2mm;
  margin: 2mm 0;
}
.mid-image {
  margin: 0;
  flex: 0 1 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}
.mid-image img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

/* ===== SPONSOR LOGOS (bottom) ===== */
.mid-image-sponsor-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 2mm;
  margin-top: auto;              /* NEW: tempel ke bawah halaman */
  margin-bottom: 0;              /* NEW */
}
.mid-image-sponsor {
  margin: 0;
  flex: 0 1 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}
.mid-image-sponsor img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

/* perbaikan selektor: pastikan dua baris ini tidak dipecah */
header, .band, .mid-image-row, .mid-image-sponsor-row {   /* FIXED */
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
</style>
