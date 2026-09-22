<template>
  <div class="page">
    <header class="head">
      <div class="trademark">@STiming.System.424.Timestamp {{ timestamp }} #-</div>

      <div class="band">
        <strong>TEAM ROSTER</strong>
        <span class="dot">•</span>
        <span>{{ today }}</span>
      </div>

      <div
        class="mid-image-row"
        v-if="eventInfo && eventInfo.eventFiles && eventInfo.eventFiles.length > 0"
      >
        <div
          v-for="(url, index) in eventInfo.eventFiles"
          :key="index"
          class="mid-image py-2"
        >
          <img :src="url" alt="Event Poster" />
        </div>
      </div>

      <div class="event">
        <div class="event-name">{{ (eventInfo && eventInfo.eventName) || "-" }}</div>
        <div class="event-meta">
          Kp/Ds. {{ (eventInfo && eventInfo.addressVillage) || "-" }}, Kel.
          {{ (eventInfo && eventInfo.addressDistrict) || "-" }}, Kec.
          {{ (eventInfo && eventInfo.addressSubDistrict) || "-" }}, Kota
          {{ (eventInfo && eventInfo.addressCity) || "-" }},
          {{ (eventInfo && eventInfo.addressProvince) || "-" }} –
          {{ (eventInfo && eventInfo.addressState) || "-" }}
          ({{ (eventInfo && eventInfo.addressZipCode) || "-" }}) •
          {{ (eventInfo && eventInfo.riverName) || "-" }}
        </div>
      </div>

      <div class="summary-row">
        <div class="summary-chip">
          <div class="summary-chip__value">{{ totalAssignments }}</div>
          <div class="summary-chip__label">Total Tim</div>
        </div>
        <div class="summary-chip">
          <div class="summary-chip__value">{{ categoryCount }}</div>
          <div class="summary-chip__label">Kategori</div>
        </div>
      </div>
    </header>

    <section>
      <table class="roster-table">
        <thead>
          <tr>
            <th class="text-center" style="width: 6%">No</th>
            <th style="width: 26%">Team Name</th>
            <th class="text-center" style="width: 10%">BIB</th>
            <th class="text-center" style="width: 14%">Type</th>
            <th>Terdaftar di (Kategori / Initial / Divisi / Race)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, idx) in teams" :key="t.teamId || t.nameTeam + t.bibTeam">
            <td class="text-center">{{ idx + 1 }}</td>
            <td class="text-strong">
              {{ t.nameTeam }}
              <CountryFlag v-if="t.countryCode" :code="t.countryCode" />
            </td>
            <td class="text-center">
              {{ (t.bibList && t.bibList.length ? t.bibList.join(", ") : t.bibTeam) || "-" }}
            </td>
            <td class="text-center">{{ t.typeTeam || "-" }}</td>
            <td>
              <span v-for="(a, ai) in t.assignments" :key="ai" class="assign-chip">
                {{ categoryLabel(a.raceCategory) }}
                <template v-if="a.initialName || a.divisionName || a.raceName">
                  ({{ [a.initialName, a.divisionName, a.raceName].filter(Boolean).join(" / ") }})
                </template>
                <template v-if="a.bibTeam"> — BIB {{ a.bibTeam }}</template>
              </span>
            </td>
          </tr>
          <tr v-if="!teams.length">
            <td colspan="5" class="empty">Belum ada tim yang terdaftar.</td>
          </tr>
        </tbody>
      </table>
    </section>

    <footer class="foot">
      Dicetak otomatis oleh STiming System 424 — {{ today }}
    </footer>
  </div>
</template>

<script>
import CountryFlag from "@/components/common/CountryFlag.vue";

const CATEGORY_LABELS = {
  SPRINT: "Sprint",
  HEAD2HEAD: "Head to Head",
  HEADTOHEAD: "Head to Head",
  SLALOM: "Slalom",
  DRR: "Down River Race",
  RX: "Rafting Cross",
};

export default {
  name: "TeamRosterPdf",
  components: { CountryFlag },
  props: {
    eventInfo: { type: Object, default: () => ({}) },
    teams: { type: Array, default: () => [] },
  },
  computed: {
    totalAssignments() {
      return this.teams.reduce(
        (sum, t) => sum + (Array.isArray(t.assignments) ? t.assignments.length : 0),
        0
      );
    },
    categoryCount() {
      const set = new Set();
      this.teams.forEach((t) =>
        (t.assignments || []).forEach((a) => set.add(String(a.raceCategory).toUpperCase()))
      );
      return set.size;
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
      const pad = (n) => String(n).padStart(2, "0");
      return `${this.today} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },
  },
  methods: {
    categoryLabel(cat) {
      return CATEGORY_LABELS[String(cat || "").toUpperCase()] || cat || "-";
    },
  },
};
</script>

<style scoped>
/* === LAYOUT CETAK PORTRAIT A4 === */
@page {
  size: A4 portrait;
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
  min-height: calc(297mm - 16mm);
  padding: 5mm 8mm 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 12px;
  color: #17202a;
}

.trademark {
  font-size: 7px;
  color: #b8c2cc;
  text-align: right;
  margin-bottom: 2mm;
}

.band {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  background: rgb(24, 116, 165);
  color: white;
  padding: 5px 12px;
  border-radius: 8px;
  margin-bottom: 4mm;
  font-weight: 700;
}
.band .dot {
  opacity: 0.9;
}

.mid-image-row {
  display: flex;
  justify-content: center;
  margin-bottom: 2mm;
}
.mid-image img {
  max-height: 22mm;
  object-fit: contain;
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

.summary-row {
  display: flex;
  justify-content: center;
  gap: 8mm;
  margin-bottom: 5mm;
}
.summary-chip {
  text-align: center;
}
.summary-chip__value {
  font-size: 18px;
  font-weight: 800;
  color: rgb(24, 116, 165);
}
.summary-chip__label {
  font-size: 8.5px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* ==== TABLE ==== */
.roster-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #dde6ee;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6mm;
}
.roster-table th,
.roster-table td {
  border-bottom: 1px solid #f1f4f8;
  padding: 5px 7px;
  vertical-align: top;
}
.roster-table thead th {
  background: rgb(240, 250, 255);
  text-transform: uppercase;
  font-size: 9.5px;
  font-weight: 800;
  text-align: left;
}
.roster-table tbody td {
  font-size: 10.5px;
}
.roster-table tbody tr:nth-child(odd) {
  background: #fafcff;
}
.text-center { text-align: center; }
.text-strong { font-weight: 700; }
.empty {
  text-align: center;
  color: #94a3b8;
  padding: 12px 0;
}

.assign-chip {
  display: inline-block;
  font-size: 9px;
  font-weight: 600;
  color: #1c4c7a;
  background: #eef4fb;
  border-radius: 5px;
  padding: 1px 6px;
  margin: 1px 3px 1px 0;
}

.foot {
  margin-top: auto;
  padding: 3mm 0 1mm;
  text-align: center;
  font-size: 8px;
  color: #94a3b8;
}
</style>
