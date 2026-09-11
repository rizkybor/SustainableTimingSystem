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
        v-if="data && data.eventFiles && data.eventFiles.length > 0"
      >
        <div
          v-for="(url, index) in data.eventFiles"
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
            <th
              class="pen-head section"
              v-for="n in maxSections"
              :key="'sec-h-' + n"
            >
              S{{ n }}
            </th>
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
              <CountryFlag :code="row && row.countryCode" />
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

            <td
              class="text-center"
              v-for="n in maxSections"
              :key="'sec-' + i + '-' + n"
            >
              {{ sectionValueAt(row, n - 1) }}
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
            <td class="empty" :colspan="13 + maxSections">No data</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- SIGNATURE -->
    <footer class="sign">
      <!-- Technical Delegate / Chief Judge / Race Director — masing2 bisa
           di-on/off-kan per kategori lewat Race Settings (showTechnicalDelegate/
           showChiefJudge/showRaceDirector, default tampil kalau tidak diatur);
           nama default "—" kalau datanya belum diisi di Event Detail. -->
      <div class="sign-col" v-if="data && data.showTechnicalDelegate !== false">
        <div class="sign-title">Technical Delegate</div>
        <img
          v-if="data && data.technicalDelegateSignature && data.technicalDelegateSignature.secure_url"
          :src="data.technicalDelegateSignature.secure_url"
          class="sign-img"
          alt="Technical Delegate signature"
        />
        <div v-else class="sign-line"></div>
        <div class="sign-name">
          {{ data && data.technicalDelegate ? data.technicalDelegate : "—" }}
        </div>
      </div>
      <div class="sign-col" v-if="data && data.showChiefJudge !== false">
        <div class="sign-title">Chief Judge</div>
        <img
          v-if="data && data.chiefJudgeSignature && data.chiefJudgeSignature.secure_url"
          :src="data.chiefJudgeSignature.secure_url"
          class="sign-img"
          alt="Chief Judge signature"
        />
        <div v-else class="sign-line"></div>
        <div class="sign-name">
          {{ data && data.chiefJudge ? data.chiefJudge : "—" }}
        </div>
      </div>
      <div class="sign-col" v-if="data && data.showRaceDirector !== false">
        <div class="sign-title">Race Director</div>
        <img
          v-if="data && data.raceDirectorSignature && data.raceDirectorSignature.secure_url"
          :src="data.raceDirectorSignature.secure_url"
          class="sign-img"
          alt="Race Director signature"
        />
        <div v-else class="sign-line"></div>
        <div class="sign-name">
          {{ data && data.raceDirector ? data.raceDirector : "—" }}
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
      v-if="data && data.sponsorFiles && data.sponsorFiles.length > 0"
    >
      <div
        v-for="(url, index) in data.sponsorFiles"
        :key="index"
        class="mid-image-sponsor py-4"
      >
        <img :src="url" alt="Event Sponsor" />
      </div>
    </div>
  </div>
</template>

<script>
import CountryFlag from "@/components/common/CountryFlag.vue";

export default {
  name: "DrrPdfResult",
  components: { CountryFlag },
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
    // Jumlah kolom Section (S1..SN) — dulu semua section digepeng jadi
    // SATU kolom "Pen. Section" berisi daftar time string bertumpuk, tidak
    // ada rincian per-section yg jelas (beda dgn Slalom PDF yg py 1 kolom
    // per Gate). Sekarang tiap section dapat kolom sendiri, nilainya
    // numerik (bukan string waktu) — konsisten dgn tabel/modal di
    // DrrResult.vue.
    maxSections() {
      let max = 0;
      this.rows.forEach((row) => {
        const a = row && row.result && row.result.sectionPenaltyTime;
        if (Array.isArray(a) && a.length > max) max = a.length;
      });
      return max;
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
    // "±HH:MM:SS.mmm" -> angka detik bertanda (boleh minus, bonus dari
    // Pilihan Pen. Section) — sama pola dgn timeToPenaltyValue() di
    // DrrResult.vue/DownRiverRace.vue.
    timeToPenaltyValue(timeStr) {
      const p = String(timeStr || "");
      const neg = p.startsWith("-");
      const t = p.replace("-", "");
      const [hh = "0", mm = "0", ssms = "0"] = t.split(":");
      const ss = parseFloat(ssms) || 0;
      const hhNum = parseFloat(hh) || 0;
      const mmNum = parseFloat(mm) || 0;
      const val = hhNum * 3600 + mmNum * 60 + ss;
      const rounded = Math.round(val);
      return Number.isFinite(rounded) ? (neg ? -1 : 1) * rounded : 0;
    },
    // Nilai numerik Section ke-`idx` (0-based) utk satu baris — kosong ("")
    // kalau section itu tidak ada sama sekali utk tim ini (Total Section
    // event ini < maxSections), bukan "0" (biar tidak kebaca seolah tim itu
    // memang punya penalty 0 di section yg sebenarnya tidak berlaku).
    sectionValueAt(row, idx) {
      const a = row && row.result && row.result.sectionPenaltyTime;
      if (!Array.isArray(a) || idx >= a.length) return "";
      return this.timeToPenaltyValue(a[idx]);
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
  /* dulu width:30% tetap (pas cuma 2 kolom: Chief Judge + stamp) — sekarang
     Technical Delegate & Race Director bisa ikut tampil (on/off lewat Race
     Settings), jadi jumlah kolom yg kebentuk bisa 2-4. flex:1 supaya
     lebarnya selalu menyesuaikan berapa pun yg sedang tampil, drpd overflow
     saat 4 kolom @30% (120%) sekaligus muncul. */
  flex: 1;
  min-width: 0;
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
.sign-img {
  height: 50px;
  max-width: 75%;
  object-fit: contain;
  margin: 10px auto 6px;
  display: block;
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
  /* BUG FIX: dulu width+height sama2 di-fix (80x80, kotak) — html2canvas
     (dipakai vue-html2pdf) tidak selalu menghormati object-fit:contain,
     jadi logo non-persegi ke-stretch paksa jadi kotak (gepeng). Samakan
     dgn sprint-pdfResult.vue: cuma height yg di-fix, width auto ikut
     rasio asli gambar — proporsional apapun bentuk logonya.
  */
  height: 70px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}
.mid-image-sponsor-row {
  margin-top: auto;
  margin-bottom: 0;
}
.mid-image-sponsor img {
  height: 35px;
  width: auto;
  max-width: 100%;
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

.pen-head.section {
  font-size: 11px;
}
</style>
