<template>
  <b-modal
    :visible="show"
    size="xl"
    centered
    scrollable
    body-class="p-0 etr-body"
    header-class="p-0 border-0"
    footer-class="etr-footer"
    content-class="etr-content"
    @change="$emit('update:show', $event)"
  >
    <!-- Header -->
    <template #modal-header="{ close }">
      <div class="etr-head">
        <div class="etr-head__bg"></div>
        <button type="button" class="etr-close" aria-label="Close" @click="close()">
          <Icon icon="mdi:close" />
        </button>
        <div class="etr-head__inner">
          <span class="etr-head__icon"><Icon icon="mdi:account-group-outline" /></span>
          <div class="etr-head__text">
            <span class="etr-eyebrow">Team Roster</span>
            <h5 class="etr-title">{{ (eventInfo && eventInfo.eventName) || "Daftar Tim Event" }}</h5>
            <p class="etr-sub">Semua tim yang terdaftar beserta BIB & nomor lomba yang diikuti.</p>
          </div>
        </div>
        <div class="etr-stats">
          <div class="etr-stat">
            <span class="etr-stat__value">{{ teams.length }}</span>
            <span class="etr-stat__label">Tim</span>
          </div>
          <div class="etr-stat">
            <span class="etr-stat__value">{{ totalAssignments }}</span>
            <span class="etr-stat__label">Total Registrasi</span>
          </div>
          <div class="etr-stat">
            <span class="etr-stat__value">{{ categoryCount }}</span>
            <span class="etr-stat__label">Kategori Diikuti</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Toolbar -->
    <div class="etr-toolbar">
      <div class="etr-search">
        <Icon icon="mdi:magnify" class="etr-search__icon" />
        <input
          v-model="query"
          type="text"
          placeholder="Cari nama tim, BIB, type, atau kategori…"
        />
        <button v-if="query" type="button" class="etr-search__clear" @click="query = ''">
          <Icon icon="mdi:close" />
        </button>
      </div>
      <button
        type="button"
        class="etr-print-btn"
        :disabled="!teams.length || printing"
        @click="printPdf"
      >
        <b-spinner v-if="printing" small />
        <Icon v-else icon="mdi:printer-outline" />
        {{ printing ? "Menyiapkan PDF…" : "Print PDF" }}
      </button>
    </div>
    <div v-if="categoryChips.length > 1" class="etr-chips">
      <button
        v-for="c in categoryChips"
        :key="c.key"
        type="button"
        class="etr-chip"
        :class="[{ active: catFilter === c.key }, c.key !== 'ALL' ? 'etr-chip--' + categoryClass(c.key) : '']"
        @click="catFilter = c.key"
      >
        {{ c.label }}
        <span class="etr-chip__count">{{ c.count }}</span>
      </button>
    </div>

    <!-- List -->
    <div class="etr-list-wrap">
      <div v-if="loading" class="etr-empty">
        <b-spinner small class="mr-2" />Memuat data tim…
      </div>
      <div v-else-if="!filteredTeams.length" class="etr-empty">
        <Icon icon="mdi:account-search-outline" width="34" height="34" />
        <div>{{ teams.length ? "Tidak ada tim yang cocok dengan pencarian/filter." : "Belum ada tim yang terdaftar di event ini." }}</div>
      </div>
      <div v-else class="etr-table-wrap">
        <table class="etr-table">
          <thead>
            <tr>
              <th class="etr-col-no">No</th>
              <th>Tim</th>
              <th>BIB</th>
              <th>Terdaftar di</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, idx) in filteredTeams" :key="t.teamId || t.nameTeam + t.bibTeam">
              <td class="etr-col-no">{{ idx + 1 }}</td>
              <td>
                <div class="etr-team">
                  <span class="etr-team__avatar" :style="{ background: avatarColor(t.nameTeam) }">
                    {{ initials(t.nameTeam) }}
                  </span>
                  <div class="etr-team__text">
                    <span class="etr-team-name">
                      {{ t.nameTeam }}
                      <CountryFlag v-if="t.countryCode" :code="t.countryCode" />
                    </span>
                    <span v-if="t.typeTeam" class="etr-type">{{ t.typeTeam }}</span>
                  </div>
                </div>
              </td>
              <td class="etr-bib-list">
                <span v-if="!(t.bibList && t.bibList.length)" class="etr-muted">-</span>
                <span v-for="(b, bi) in t.bibList" :key="bi" class="etr-bib-chip">{{ b }}</span>
              </td>
              <td>
                <div class="etr-assign-list">
                  <span
                    v-for="(a, ai) in t.assignments"
                    :key="ai"
                    class="etr-badge"
                    :class="'etr-badge--' + categoryClass(a.raceCategory)"
                    :title="[a.initialName, a.divisionName, a.raceName].filter(Boolean).join(' - ')"
                  >
                    <strong>{{ categoryLabel(a.raceCategory) }}</strong>
                    <small v-if="a.initialName || a.divisionName || a.raceName">
                      {{ [a.initialName, a.divisionName, a.raceName].filter(Boolean).join(" / ") }}
                    </small>
                    <small v-if="a.bibTeam" class="etr-badge__bib">BIB {{ a.bibTeam }}</small>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <template #modal-footer="{ close }">
      <div class="etr-foot">
        <span class="etr-foot__count">
          Menampilkan <strong>{{ filteredTeams.length }}</strong> dari {{ teams.length }} tim
        </span>
        <button type="button" class="etr-btn" @click="close()">Tutup</button>
      </div>
    </template>

    <!-- vue-html2pdf: sama pola dgn *Result.vue (Sprint/DRR/dst) — render
         off-screen, generatePdf() dipanggil manual via ref, TIDAK dipakai
         utk apa pun selain trigger download. -->
    <vue-html2pdf
      v-if="showPdf"
      ref="html2Pdf"
      :show-layout="false"
      :float-layout="false"
      :enable-download="true"
      :preview-modal="false"
      :manual-pagination="true"
      :pdf-quality="2"
      :filename="pdfFilename"
      pdf-format="a4"
      pdf-orientation="portrait"
      pdf-content-width="100%"
      style="
        position: absolute;
        left: -99999px;
        top: 0;
        width: 0;
        height: 0;
        overflow: hidden;
      "
      @pdfGenerated="onPdfGenerated"
    >
      <section slot="pdf-content">
        <TeamRosterPdf :event-info="eventInfo" :teams="teams" />
      </section>
    </vue-html2pdf>
  </b-modal>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import VueHtml2pdf from "vue-html2pdf";
import CountryFlag from "@/components/common/CountryFlag.vue";
import TeamRosterPdf from "@/components/event/TeamRosterPdf.vue";

const CATEGORY_LABELS = {
  SPRINT: "Sprint",
  HEAD2HEAD: "Head to Head",
  HEADTOHEAD: "Head to Head",
  SLALOM: "Slalom",
  DRR: "Down River Race",
  RX: "Rafting Cross",
};

export default {
  name: "EventTeamRosterModal",
  components: { Icon, CountryFlag, VueHtml2pdf, TeamRosterPdf },
  props: {
    show: { type: Boolean, default: false },
    eventId: { type: String, default: "" },
    // Dokumen event mentah (eventsCollection) — dipakai utk header PDF
    // (nama/alamat/poster event). Diteruskan dari Details/index.vue
    // (this.events), bukan di-fetch ulang lewat IPC.
    eventInfo: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      loading: false,
      teams: [],
      query: "",
      catFilter: "ALL", // ALL | kode raceCategory (filter chip)
      loadedForEventId: "",
      showPdf: false,
      printing: false,
    };
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
    // Chip filter per nomor lomba (+ jumlah tim yg terdaftar di sana).
    categoryChips() {
      const counts = {};
      const order = [];
      this.teams.forEach((t) => {
        const seen = new Set();
        (t.assignments || []).forEach((a) => {
          const key = this.categoryKey(a.raceCategory);
          if (!key || seen.has(key)) return;
          seen.add(key);
          if (!(key in counts)) {
            counts[key] = 0;
            order.push(key);
          }
          counts[key] += 1;
        });
      });
      return [{ key: "ALL", label: "Semua", count: this.teams.length }].concat(
        order.map((k) => ({ key: k, label: this.categoryLabel(k), count: counts[k] }))
      );
    },
    filteredTeams() {
      const q = String(this.query || "").trim().toLowerCase();
      const cat = this.catFilter;
      const byCat =
        cat === "ALL"
          ? this.teams
          : this.teams.filter((t) =>
              (t.assignments || []).some((a) => this.categoryKey(a.raceCategory) === cat)
            );
      if (!q) return byCat;
      return byCat.filter((t) => {
        const hay = [
          t.nameTeam,
          t.bibTeam,
          ...(t.bibList || []),
          t.typeTeam,
          ...(t.assignments || []).map((a) => this.categoryLabel(a.raceCategory)),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    },
    pdfFilename() {
      const name = (this.eventInfo && this.eventInfo.eventName) || "Event";
      const safe = String(name).replace(/[^\w-]+/g, "_");
      return `Team-Roster-${safe}`;
    },
  },
  watch: {
    show(val) {
      // Muat data cuma sekali per eventId (bukan tiap kali modal dibuka) —
      // cache ringan di loadedForEventId, biar buka-tutup modal berulang
      // tidak spam IPC. Refresh manual belum diperlukan (data registrasi
      // jarang berubah selagi modal ini terbuka).
      if (val && this.eventId && this.loadedForEventId !== this.eventId) {
        this.fetchTeams();
      }
    },
  },
  methods: {
    fetchTeams() {
      if (typeof ipcRenderer === "undefined" || !this.eventId) return;
      this.loading = true;
      this.loadedForEventId = this.eventId;
      ipcRenderer.removeAllListeners("teams-registered:detail-by-event-reply");
      ipcRenderer.once("teams-registered:detail-by-event-reply", (_e, res) => {
        this.loading = false;
        if (res && res.ok) {
          this.teams = Array.isArray(res.teams) ? res.teams : [];
        } else {
          this.teams = [];
          this.loadedForEventId = "";
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Gagal memuat Team Roster",
            detail: (res && res.error) || "Terjadi kesalahan.",
          });
        }
      });
      ipcRenderer.send("teams-registered:detail-by-event", this.eventId);
    },
    async printPdf() {
      if (!this.teams.length || this.printing) return;
      try {
        this.printing = true;
        this.showPdf = true;
        await this.$nextTick();
        const inst = this.$refs.html2Pdf;
        if (!inst) {
          this.printing = false;
          this.showPdf = false;
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
        await inst.generatePdf();
      } catch (e) {
        this.printing = false;
        this.showPdf = false;
        if (typeof ipcRenderer !== "undefined") {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Gagal membuat PDF",
            detail: (e && e.message) || "Terjadi kesalahan.",
          });
        }
      }
    },
    onPdfGenerated() {
      this.showPdf = false;
      this.printing = false;
    },
    categoryLabel(cat) {
      return CATEGORY_LABELS[String(cat || "").toUpperCase()] || cat || "-";
    },
    // HEAD2HEAD & HEADTOHEAD = satu kategori yg sama (beda ejaan antar koleksi).
    categoryKey(cat) {
      const up = String(cat || "").toUpperCase();
      return up === "HEADTOHEAD" ? "HEAD2HEAD" : up;
    },
    initials(name) {
      const words = String(name || "?").trim().split(/\s+/);
      return ((words[0] || "?").charAt(0) + (words[1] ? words[1].charAt(0) : "")).toUpperCase();
    },
    // Warna avatar stabil per nama tim (sama dgn Home / All Teams).
    avatarColor(name) {
      const palette = [
        "linear-gradient(135deg,#1c4c7a,#25b0eb)",
        "linear-gradient(135deg,#0f766e,#2dd4bf)",
        "linear-gradient(135deg,#7c3aed,#a78bfa)",
        "linear-gradient(135deg,#c2410c,#fb923c)",
        "linear-gradient(135deg,#be123c,#fb7185)",
        "linear-gradient(135deg,#1d4ed8,#60a5fa)",
      ];
      let h = 0;
      const str = String(name || "");
      for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
      return palette[h % palette.length];
    },
    categoryClass(cat) {
      const up = String(cat || "").toUpperCase();
      if (up === "HEAD2HEAD" || up === "HEADTOHEAD") return "h2h";
      return up.toLowerCase();
    },
  },
};
</script>

<style>
/* Pembungkus modal (dibuat BootstrapVue & dirender di <body>) — global,
   kelas berawalan etr-. */
.etr-content {
  border: none;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
}
.etr-body {
  background: #f5f8fc;
}
.etr-footer {
  padding: 0;
  border-top: 1px solid #e6edf6;
  background: #ffffff;
}
</style>

<style scoped>
/* ---------- Header ---------- */
.etr-head {
  position: relative;
  width: 100%;
  color: #fff;
}
.etr-head__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(520px 200px at 88% 0%, rgba(37, 176, 235, 0.45), transparent 70%),
    linear-gradient(110deg, #0f2f52 0%, #1c4c7a 55%, #1d7fb8 100%);
}
.etr-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
}
.etr-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
.etr-head__inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 64px 14px 26px;
}
.etr-head__icon {
  flex: none;
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #bae6fd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.etr-head__text {
  min-width: 0;
}
.etr-eyebrow {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #bae6fd;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.etr-title {
  margin: 5px 0 0;
  font-size: 20px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.etr-sub {
  margin: 2px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}
.etr-stats {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 0 26px 20px;
}
.etr-stat {
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
}
.etr-stat__value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.etr-stat__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}

/* ---------- Toolbar ---------- */
.etr-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 22px 10px;
}
.etr-search {
  position: relative;
  flex: 1;
}
.etr-search__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 18px;
}
.etr-search input {
  width: 100%;
  height: 40px;
  padding: 0 34px 0 38px;
  border-radius: 11px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.etr-search input:focus {
  border-color: #25b0eb;
  box-shadow: 0 0 0 3px rgba(37, 176, 235, 0.15);
}
.etr-search__clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.etr-search__clear:hover {
  background: #eef2f7;
}
.etr-print-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 11px;
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(28, 76, 122, 0.25);
}
.etr-print-btn:hover:not(:disabled) {
  filter: brightness(1.07);
}
.etr-print-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.etr-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 22px 12px;
}
.etr-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.etr-chip:hover {
  border-color: #b9d7f0;
}
.etr-chip.active {
  background: #1c4c7a;
  border-color: #1c4c7a;
  color: #ffffff;
}
.etr-chip__count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
.etr-chip.active .etr-chip__count {
  background: rgba(255, 255, 255, 0.2);
}

/* ---------- Tabel ---------- */
.etr-list-wrap {
  padding: 0 22px 18px;
}
.etr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 44px 16px;
  border: 1px dashed #dbe3ee;
  border-radius: 16px;
  background: #ffffff;
  color: #94a3b8;
  text-align: center;
}
.etr-table-wrap {
  background: #ffffff;
  border: 1px solid #e6edf6;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(15, 42, 67, 0.05);
}
.etr-table {
  width: 100%;
  border-collapse: collapse;
}
.etr-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 11px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2f7;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
}
.etr-table tbody td {
  padding: 11px 14px;
  border-top: 1px solid #f1f5f9;
  vertical-align: middle;
  font-size: 13px;
  color: #0f172a;
}
.etr-table tbody tr:first-child td {
  border-top: none;
}
.etr-table tbody tr:hover td {
  background: #f7fbff;
}
.etr-col-no {
  width: 48px;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}
.etr-muted {
  color: #94a3b8;
}

.etr-team {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}
.etr-team__avatar {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  color: #fff;
  font-size: 12.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.etr-team__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.etr-team-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
}
.etr-type {
  align-self: flex-start;
  padding: 0 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
}
.etr-bib-list {
  white-space: nowrap;
}
.etr-bib-chip {
  display: inline-block;
  margin: 2px 4px 2px 0;
  padding: 2px 9px;
  border-radius: 8px;
  background: #eef6ff;
  border: 1px solid #d6e8fb;
  color: #1c4c7a;
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.etr-assign-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.etr-badge {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 9px;
  border: 1px solid transparent;
  font-size: 12px;
}
.etr-badge strong {
  font-weight: 800;
}
.etr-badge small {
  font-size: 11px;
  opacity: 0.85;
}
.etr-badge__bib {
  padding: 0 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.7);
  font-weight: 700;
}
.etr-badge--sprint { background: #e8f1fa; color: #1c4c7a; border-color: #d3e3f3; }
.etr-badge--h2h { background: #eef0fe; color: #4f46e5; border-color: #dfe2fd; }
.etr-badge--slalom { background: #e3f6fe; color: #0284c7; border-color: #cdeefd; }
.etr-badge--drr { background: #fdf1de; color: #b45309; border-color: #fbe2bb; }
.etr-badge--rx { background: #fde7ec; color: #be123c; border-color: #fbd0da; }

/* Warna chip filter per kategori saat aktif */
.etr-chip--sprint.active { background: #1c4c7a; border-color: #1c4c7a; }
.etr-chip--h2h.active { background: #4f46e5; border-color: #4f46e5; }
.etr-chip--slalom.active { background: #0284c7; border-color: #0284c7; }
.etr-chip--drr.active { background: #b45309; border-color: #b45309; }
.etr-chip--rx.active { background: #be123c; border-color: #be123c; }

/* ---------- Footer ---------- */
.etr-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 14px 22px;
}
.etr-foot__count {
  font-size: 12.5px;
  color: #64748b;
}
.etr-btn {
  height: 40px;
  padding: 0 22px;
  border-radius: 11px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.etr-btn:hover {
  background: #f8fafc;
}

@media (max-width: 767.98px) {
  .etr-toolbar {
    flex-wrap: wrap;
  }
  .etr-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 0 16px 16px;
  }
}
</style>
