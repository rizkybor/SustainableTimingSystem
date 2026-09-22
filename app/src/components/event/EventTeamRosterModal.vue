<template>
  <b-modal
    :visible="show"
    size="xl"
    hide-footer
    centered
    title="Team Roster"
    body-class="p-0"
    @change="$emit('update:show', $event)"
  >
    <div class="etr-wrap">
      <!-- SUMMARY -->
      <div class="etr-summary">
        <div class="etr-stat">
          <div class="etr-stat__value">{{ totalTeams }}</div>
          <div class="etr-stat__label">Total Tim Terdaftar</div>
        </div>
        <div class="etr-stat">
          <div class="etr-stat__value">{{ totalAssignments }}</div>
          <div class="etr-stat__label">Total Baris Registrasi (lintas kategori)</div>
        </div>
        <div class="etr-stat">
          <div class="etr-stat__value">{{ categoryCount }}</div>
          <div class="etr-stat__label">Kategori Diikuti</div>
        </div>
        <button
          type="button"
          class="etr-print-btn"
          :disabled="!teams.length || printing"
          @click="printPdf"
        >
          <b-spinner v-if="printing" small />
          <Icon v-else icon="mdi:printer-outline" width="16" height="16" />
          Print PDF
        </button>
      </div>

      <!-- SEARCH -->
      <div class="etr-search">
        <Icon icon="mdi:magnify" width="16" height="16" />
        <input
          v-model="query"
          type="text"
          placeholder="Cari nama tim, BIB, atau kategori..."
        />
      </div>

      <!-- LIST -->
      <div class="etr-list-wrap">
        <div v-if="loading" class="etr-empty">
          <b-spinner small class="mr-2" />Memuat data tim…
        </div>
        <div v-else-if="!filteredTeams.length" class="etr-empty">
          <Icon icon="mdi:account-search-outline" width="26" height="26" class="mb-2" />
          <div>{{ teams.length ? "Tidak ada tim yang cocok dengan pencarian." : "Belum ada tim yang terdaftar di event ini." }}</div>
        </div>
        <div v-else class="etr-table-wrap">
          <table class="etr-table">
            <thead>
              <tr>
                <th class="etr-col-no">No</th>
                <th>Tim</th>
                <th>BIB</th>
                <th>Type</th>
                <th>Terdaftar di</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(t, idx) in filteredTeams" :key="t.teamId || t.nameTeam + t.bibTeam">
                <td class="etr-col-no">{{ idx + 1 }}</td>
                <td>
                  <span class="etr-team-name">
                    <CountryFlag v-if="t.countryCode" :code="t.countryCode" />
                    {{ t.nameTeam }}
                  </span>
                </td>
                <td>{{ t.bibTeam || "-" }}</td>
                <td>{{ t.typeTeam || "-" }}</td>
                <td>
                  <div class="etr-assign-list">
                    <span
                      v-for="(a, ai) in t.assignments"
                      :key="ai"
                      class="etr-badge"
                      :class="'etr-badge--' + categoryClass(a.raceCategory)"
                      :title="[a.initialName, a.divisionName, a.raceName].filter(Boolean).join(' - ')"
                    >
                      {{ categoryLabel(a.raceCategory) }}
                      <small v-if="a.initialName || a.divisionName || a.raceName">
                        &middot; {{ [a.initialName, a.divisionName, a.raceName].filter(Boolean).join(" / ") }}
                      </small>
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

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
      totalTeams: 0,
      query: "",
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
    filteredTeams() {
      const q = String(this.query || "").trim().toLowerCase();
      if (!q) return this.teams;
      return this.teams.filter((t) => {
        const hay = [
          t.nameTeam,
          t.bibTeam,
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
          this.totalTeams = res.totalTeams || this.teams.length;
        } else {
          this.teams = [];
          this.totalTeams = 0;
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
    categoryClass(cat) {
      const up = String(cat || "").toUpperCase();
      if (up === "HEAD2HEAD" || up === "HEADTOHEAD") return "h2h";
      return up.toLowerCase();
    },
  },
};
</script>

<style scoped>
.etr-wrap {
  padding: 18px 20px 22px;
}
.etr-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 10px;
  margin-bottom: 14px;
}
.etr-stat {
  flex: 1 1 150px;
  background: #f8fafc;
  border: 1px solid #e6ebf1;
  border-radius: 12px;
  padding: 12px 14px;
  text-align: center;
}
.etr-print-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1c4c7a;
  color: #fff;
  border: none;
  font-size: 13px;
  font-weight: 700;
  padding: 0 18px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}
.etr-print-btn:hover:not(:disabled) {
  background: #163e66;
}
.etr-print-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.etr-stat__value {
  font-size: 20px;
  font-weight: 800;
  color: #1c4c7a;
}
.etr-stat__label {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}
.etr-search {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #dde3ea;
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 12px;
  color: #94a3b8;
}
.etr-search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13.5px;
  color: #0f172a;
}
.etr-list-wrap {
  border: 1px solid #e6ebf1;
  border-radius: 12px;
  overflow: hidden;
}
.etr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
.etr-table-wrap {
  max-height: 55vh;
  overflow: auto;
}
.etr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.etr-table thead th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  text-align: left;
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
  padding: 10px 12px;
  border-bottom: 1px solid #e6ebf1;
  z-index: 1;
}
.etr-table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #eef1f5;
  vertical-align: top;
  color: #1e293b;
}
.etr-table tbody tr:last-child td {
  border-bottom: none;
}
.etr-table tbody tr:hover td {
  background: #f8fafc;
}
.etr-col-no {
  width: 40px;
  color: #94a3b8;
}
.etr-team-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #0f172a;
}
.etr-assign-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.etr-badge {
  display: inline-flex;
  flex-direction: column;
  gap: 1px;
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  line-height: 1.3;
}
.etr-badge small {
  font-weight: 500;
  opacity: 0.85;
}
.etr-badge--sprint { background: #e8f1fa; color: #1c4c7a; }
.etr-badge--h2h { background: #eef0fe; color: #6366f1; }
.etr-badge--slalom { background: #e3f6fe; color: #0ea5e9; }
.etr-badge--drr { background: #fdf1de; color: #d9860f; }
.etr-badge--rx { background: #fde7ec; color: #e11d48; }
</style>
