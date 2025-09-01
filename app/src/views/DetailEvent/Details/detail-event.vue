<template>
  <div class="sts-detail">
    <!-- NAV BAR halamanmu tetap dari layout global -->

    <!-- Breadcrumb -->
    <b-container class="mt-3">
      <div class="text-muted small mb-2">
        Events / <span class="text-body">{{ events.eventName || 'Event' }}</span>
      </div>
    </b-container>

    <!-- 1) JUMBOTRON DETAIL -->
    <section class="detail-hero">
      <b-container>
        <b-row>
          <b-col cols="12" md="8" class="py-4">
            <h2 class="h1 font-weight-bold mb-2 text-white">
              {{ events.eventName || 'World Rafting Championship 2028' }}
            </h2>

            <div class="meta text-white-50">
              <span class="mr-3"><strong class="text-white">Location</strong> :
                {{ events.location || 'Colorado, USA' }}</span>
              <span class="mr-3"><strong class="text-white">River</strong> :
                {{ events.riverName || 'Dirty Devil River' }}</span>
              <span class="mr-3"><strong class="text-white">Level</strong> :
                {{ events.levelName || 'Classification - A' }}</span>
            </div>
          </b-col>

          <b-col cols="12" md="4" class="d-flex align-items-center justify-content-center">
            <div class="hero-image placeholder d-flex align-items-center justify-content-center">
              <Icon icon="mdi:image" width="64" height="64" />
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>

    <b-container class="mt-4 mb-5">
      <!-- 2) RACE CATEGORIES -->
      <h5 class="font-weight-bold mb-3">Race Categories</h5>
      <b-row>
        <b-col cols="12" md="3" v-for="c in raceCategories" :key="c.key" class="mb-3">
          <div
            class="race-card"
            :class="{ active: isActivated === c.key }"
            @click="selectCategory(c)"
          >
            <div class="race-icon">
              <Icon :icon="c.icon" width="28" height="28" />
            </div>
            <div class="h6 font-weight-bold mb-1 text-center">{{ c.title }}</div>
            <small class="text-muted d-block text-center">{{ c.desc }}</small>

            <b-button
              size="sm"
              variant="secondary"
              class="rounded-pill w-100 mt-3"
            >
              Select
            </b-button>
          </div>
        </b-col>
      </b-row>

      <!-- 3) REGISTERED TEAMS – SPRINT -->
      <div class="d-flex align-items-center justify-content-between mt-4 mb-2">
        <h5 class="font-weight-bold mb-0">Registered Teams – Sprint Category</h5>
      </div>

      <!-- Panel MEN -->
      <section class="panel-box">
        <div class="panel-head">
          <div class="font-weight-bold">Team R4 Men's – Sprint</div>
          <b-button size="sm" variant="secondary" class="rounded-pill">Start Race</b-button>
        </div>

        <!-- gunakan komponen tabel tim milikmu -->
        <teamParticipantVue
          :teamTitle="'R4 Men – Sprint'"
          :data="dataTeams"
          :filterEvent="eventActive.selected"
          :filterInitial="initialActive.selected"
          :filterRace="raceActive.selected"
          :filterDivision="{ name: 'R4 MEN' }"
          :fields="headersTable"
          @open-modal="openModal(formEvent && formEvent.participant)"
        />
      </section>

      <!-- Panel WOMEN -->
      <section class="panel-box mt-4">
        <div class="panel-head">
          <div class="font-weight-bold">Team R4 Women’s – Sprint</div>
          <b-button size="sm" variant="secondary" class="rounded-pill">Start Race</b-button>
        </div>

        <teamParticipantVue
          :teamTitle="'R4 Women – Sprint'"
          :data="dataTeams"
          :filterEvent="eventActive.selected"
          :filterInitial="initialActive.selected"
          :filterRace="raceActive.selected"
          :filterDivision="{ name: 'R4 WOMEN' }"
          :fields="headersTable"
          @open-modal="openModal(formEvent && formEvent.participant)"
        />
      </section>
    </b-container>

    <!-- FOOTER ringan -->
    <footer class="sts-footer text-center text-muted py-3">
      © {{ new Date().getFullYear() }} Sustainable Timing System. All rights reserved.
    </footer>

    <!-- MODAL RESULT (existing) -->
    <b-modal id="bv-modal-result" title="Sprint Results" size="xl" hide-footer>
      <div v-if="resultsLoading" class="text-center py-4">Loading...</div>
      <div v-else>
        <table class="table table-striped table-sm mb-0">
          <thead>
            <tr>
              <th style="width:50px">#</th>
              <th>Team</th>
              <th style="width:90px">BIB</th>
              <th style="width:90px">Rank</th>
              <th style="width:140px">Race</th>
              <th style="width:140px">Penalty</th>
              <th style="width:140px">Total</th>
              <th style="width:190px">Saved At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in sprintResultsSorted" :key="r._id || idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ r.nameTeam }}</td>
              <td>{{ r.bibTeam }}</td>
              <td>{{ r.result && r.result.ranked }}</td>
              <td>{{ r.result ? cleanTime(r.result.raceTime) : '' }}</td>
              <td>{{ r.result ? cleanTime(r.result.penaltyTime) : '' }}</td>
              <td>{{ r.result ? cleanTime(r.result.totalTime || r.result.raceTime) : '' }}</td>
              <td>{{ fmtDate(r.createdAt) }}</td>
            </tr>
            <tr v-if="!sprintResultsSorted.length">
              <td colspan="8" class="text-center text-muted py-4">Belum ada data tersimpan.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import teamParticipantVue from "./cards/team-participant.vue";
import cardEmptyVue from "@/components/cards/card-must-filled.vue";

export default {
  name: "SustainableTimingSystemRaftingDetails",
  components: { Icon, teamParticipantVue, cardEmptyVue },
  data() {
    return {
      resultsLoading: false,
      sprintResults: [],
      loading: false,
      events: {},
      headersTable: [
        { key: "No", label: "NO" },
        { key: "nameTeam", label: "TEAM NAME" },
        { key: "bibTeam", label: "BIB" },
        { key: "startingTime", label: "STARTING TIME" },
        { key: "interval", label: "INTERVAL" },
        { key: "Action", label: "ACTION", class: "text-right" },
      ],
      dataTeams: [],
      // state filter yg sudah ada di kodenya
      isActivated: "",
      eventActive: { selected: {}, show: false, actived: false },
      initialActive: { selected: {}, show: false, actived: false },
      raceActive: { selected: { name: "SPRINT" }, show: true, actived: true }, // default SPRINT agar sesuai mockup
      divisionActive: { selected: {}, show: false, actived: false },

      // kartu kategori (ikon + deskripsi)
      raceCategories: [
        {
          key: "SPRINT",
          title: "Sprint",
          icon: "mdi:flash",
          desc: "Short-distance race against the clock on grade II-III rapids",
        },
        {
          key: "HEAD2HEAD",
          title: "Head to Head",
          icon: "mdi:swap-horizontal",
          desc: "Direct competition between two teams on parallel courses",
        },
        {
          key: "SLALOM",
          title: "Slalom",
          icon: "mdi:gate",
          desc: "Technical navigation through gates on whitewater",
        },
        {
          key: "DRR",
          title: "Down River Race",
          icon: "mdi:waves",
          desc: "Long-distance endurance race with varied river conditions",
        },
      ],
    };
  },
  computed: {
    sprintResultsSorted() {
      const list = Array.isArray(this.sprintResults) ? this.sprintResults.slice() : [];
      const toMs = function (t) {
        if (!t) return Number.POSITIVE_INFINITY;
        const s = String(t).trim().replace("\r", "");
        const parts = s.split(":");
        if (parts.length < 3) return Number.POSITIVE_INFINITY;
        const hh = parseInt(parts[0], 10) || 0;
        const mm = parseInt(parts[1], 10) || 0;
        const secMs = parts[2].split(".");
        const ss = parseInt(secMs[0], 10) || 0;
        const ms = parseInt(secMs[1], 10) || 0;
        return ((hh * 60 + mm) * 60 + ss) * 1000 + ms;
      };
      return list.sort(function (a, b) {
        const ra = a && a.result ? a.result.ranked : undefined;
        const rb = b && b.result ? b.result.ranked : undefined;
        if (typeof ra === "number" && typeof rb === "number") return ra - rb;
        if (typeof ra === "number") return -1;
        if (typeof rb === "number") return 1;
        const ta = a && a.result ? a.result.totalTime || a.result.raceTime : "";
        const tb = b && b.result ? b.result.totalTime || b.result.raceTime : "";
        return toMs(ta) - toMs(tb);
      });
    },
  },
  async created() {
    const eventId = this.$route.params.id;
    await this.loadData(eventId);
  },
  methods: {
    // === UI handlers ===
    selectCategory(c) {
      this.isActivated = c.key;
      this.raceActive = { selected: { name: c.key }, show: true, actived: true };
    },

    // === time helpers ===
    cleanTime(t) { return t ? String(t).trim().replace("\r", "") : ""; },
    fmtDate(d) { try { return new Date(d).toLocaleString(); } catch (e) { return "-"; } },

    // === IPC ===
    async loadData(id) {
      this.loading = true;
      const self = this;
      setTimeout(function () {
        ipcRenderer.send("get-events-byid", id);
        ipcRenderer.once("get-events-byid-reply", function (_e, data) {
          if (data) {
            self.events = data;
            self.dataTeams = data && data.participant ? data.participant : [];
            localStorage.setItem("eventDetails", JSON.stringify(data));
          } else {
            console.error("Failed to retrieve data from events table");
          }
          self.loading = false;
        });
      }, 300);
    },

    // === Navigation ===
    goTo(val) { this.$router.push("/event-detail/" + this.$route.params.id + "/" + val); },
    back(val) { this.$router.push(val); },

    // === formatting ===
    formatDate(inputDate) {
      if (!inputDate) return "-";
      const parts = inputDate.split("-");
      const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10) - 1, d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
      return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
    },

    // === Result modal ===
    showResultCategories() {
      this.resultsLoading = true;
      this.sprintResults = [];
      const q = { eventId: this.$route.params.id };
      ipcRenderer.send("get-sprint-result", q);
      const self = this;
      ipcRenderer.once("get-sprint-result-reply", function (_e, res) {
        self.resultsLoading = false;
        if (!(res && res.ok)) {
          ipcRenderer.send("get-alert", {
            type: "warning",
            detail: res && res.error ? res.error : "Cannot load results",
            message: "Failed",
          });
          self.$bvModal.show("bv-modal-result");
          return;
        }
        self.sprintResults = Array.isArray(res.items) ? res.items : [];
        self.$bvModal.show("bv-modal-result");
      });
    },
  },
};
</script>

<style scoped>
:root{ --sts-blue:#2c5cff; --sts-muted:#8793b5; }

/* HERO */
.detail-hero{
  background: linear-gradient(180deg,#b8c6e6 0%, #92a3d1 60%, #8ea1d1 100%);
  border-bottom:1px solid rgba(255,255,255,.25);
}
.detail-hero .h1{ text-shadow: 0 2px 12px rgba(0,0,0,.12); }
.detail-hero .hero-image{
  width:320px; max-width:100%; height:180px; border-radius:16px;
  background: rgba(255,255,255,.25);
  box-shadow:0 8px 24px rgba(0,0,0,.12);
}

/* RACE CATEGORY CARDS */
.race-card{
  border:1px solid #dfe5f2; border-radius:12px; background:#fff;
  padding:16px; height:100%;
  box-shadow:0 6px 18px rgba(44,92,255,.06);
  transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
  cursor:pointer;
}
.race-card:hover{ transform: translateY(-2px); box-shadow:0 10px 22px rgba(44,92,255,.10); }
.race-card.active{ border-color: #2c5cff; }
.race-icon{
  width:56px; height:56px; border-radius:12px; margin: 0 auto 6px auto;
  background:#eff3ff; color:#2c5cff;
  display:flex; align-items:center; justify-content:center;
}

/* PANEL REGISTERED TEAMS */
.panel-box{
  border:1px solid #dfe5f2; border-radius:12px; background:#fff;
  box-shadow:0 6px 18px rgba(44,92,255,.06);
  padding:0; overflow:hidden;
}
.panel-head{
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px;
  background: #f6f8fc; border-bottom:1px solid #e7ecf6;
}

/* tabel dalam panel agar mirip mockup */
.panel-box .table{
  margin-bottom:0;
  border-collapse:separate; border-spacing:0 8px;
}
.panel-box .table thead th{
  border:0; background:transparent; color:#2c3e50; font-weight:700;
}
.panel-box .table tbody tr{
  background:#fff; border:1px solid #eef0f6;
}
.panel-box .btn.btn-sm.rounded-pill{ border-radius:999px; }

/* FOOTER */
.sts-footer{
  border-top:1px solid #e6eaf2; background:#eef3f7;
}

/* Utility */
.placeholder{ color:#e5ebff; }
</style>