<template>
  <div class="page">
    <div class="trademark">
      @STiming.System.424.Timestamp {{ timestamp }} #-
    </div>
    <div class="band">
      <div class="band-left">
        <strong>SCORE BOARD</strong>
        <span class="dot">•</span>
        <span class="cat">{{ categories || "RAFTING CROSS" }}</span>
        <span class="dot">•</span>
        <span class="cat">
          {{ data && data.levelName ? data.levelName : "Classification" }}
        </span>
      </div>
      <div class="band-right">
        <strong
          >{{ rxCats.initial }} - {{ rxCats.division }}
          {{ rxCats.race }}</strong
        >
        <span class="dot">•</span>
        <span>{{ today }}</span>
      </div>
    </div>

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

    <section>
      <table class="score-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Team</th>
            <th>BIB</th>
            <th>Race Time</th>
            <th>Penalty Time</th>
            <th>Total Time</th>
            <th>Rank</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows" :key="i">
            <td class="text-center">{{ i + 1 }}</td>
            <td class="text-strong">{{ row.nameTeam || "-" }}</td>
            <td class="text-center">{{ row.bibTeam || "-" }}</td>
            <td class="mono">{{ row.raceTime || "-" }}</td>
            <td class="mono">{{ row.penaltyTime || "-" }}</td>
            <td class="mono text-strong">{{ row.totalTime || "-" }}</td>
            <td class="text-center">{{ row.ranked || "-" }}</td>
            <td class="text-center">{{ row.score || 0 }}</td>
          </tr>
          <tr v-if="rows.length === 0">
            <td class="empty" colspan="8">No data</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div class="sign sign-two">
      <div class="sign-left">
        <div
          class="sig-card"
          v-if="data.signature && data.signature.technicalDelegate"
        >
          <div class="sign-title">Technical Delegate</div>
          <div class="sign-line"></div>
          <div class="sign-name">{{ data.technicalDelegate || "—" }}</div>
        </div>

        <div class="sig-card" v-if="data.signature && data.signature.chiefJudge">
          <div class="sign-title">Chief Judge</div>
          <div class="sign-line"></div>
          <div class="sign-name">{{ data.chiefJudge || "—" }}</div>
        </div>

        <div
          class="sig-card"
          v-if="data.signature && data.signature.raceDirector"
        >
          <div class="sign-title">Race Director</div>
          <div class="sign-line"></div>
          <div class="sign-name">{{ data.raceDirector || "—" }}</div>
        </div>
      </div>

      <div class="sign-right">
        <span class="unofficial-stamp" :class="{ 'official-stamp': isOfficial }">
          <div style="font-size: 14px; display: flex; justify-content: center">
            {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
          </div>
          <small v-if="!isOfficial" style="font-size: 8px"
            >Protest Time : 00:00:05.000 min</small
          >
        </span>
      </div>
    </div>

    <div
      class="mid-image-sponsor-row"
      v-if="data && data.sponsorFiles && data.sponsorFiles.length > 0"
    >
      <div
        v-for="(url, index) in data.sponsorFiles"
        :key="index"
        class="mid-image-sponsor pt-5"
      >
        <img :src="url" alt="Event Sponsor" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "RaftingCrossPdfResult",
  props: {
    data: { type: Object, required: true },
    dataParticipant: { type: Array, required: true },
    categories: { type: String, default: "" },
    isOfficial: { type: Boolean, default: false },
    rxCats: { type: Object, required: true },
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

.page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(210mm - 16mm);
  padding: 5mm 8mm 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  font-size: 12px;
  color: #17202a;
}

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

.score-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #dde6ee;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6mm;
}
.score-table th,
.score-table td {
  border-bottom: 1px solid #f1f4f8;
  padding: 5px 7px;
}
.score-table thead th {
  background: rgb(240, 250, 255);
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
}
.score-table tbody td {
  font-size: 11.5px;
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

.sign.sign-two {
  display: grid;
  grid-template-columns: 70% 30%;
  align-items: end;
  margin-top: 2mm;
  padding-inline: 4mm;
  page-break-inside: avoid;
}

.sign-left {
  display: grid;
  grid-template-columns: repeat(3, minmax(28mm, 1fr));
  justify-items: start;
  align-items: end;
  column-gap: 2.5mm;
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
  width: 100%;
  margin: 14mm 0 2mm;
  border-radius: 2px;
}
.sign-name {
  font-weight: 700;
  font-size: 10.8px;
  color: #1f2937;
}

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
}
.official-stamp {
  color: #148a3b;
  border-color: #148a3b;
}

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
  object-fit: contain;
}
.mid-image-sponsor img {
  height: 35px;
  object-fit: contain;
}
.mid-image-sponsor-row {
  margin-top: auto;
}

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
</style>
