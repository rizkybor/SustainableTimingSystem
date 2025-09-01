<template>
  <div class="sts-detail">
    <!-- Breadcrumb -->
    <b-container class="mt-3">
      <div class="text-muted small mb-2">
        Events / <span class="text-body">{{ events.eventName || "Event" }}</span>
      </div>
    </b-container>

    <!-- 1) JUMBOTRON DETAIL -->
    <section class="detail-hero">
      <b-container>
        <b-row>
          <b-col cols="12" md="8" class="py-4">
            <h2 class="h1 font-weight-bold mb-2 text-white">
              {{ events.eventName || "World Rafting Championship 2028" }}
            </h2>
            <div class="meta text-white-50">
              <span class="mr-3"><strong class="text-white">Location</strong> :
                {{ events.location || "Colorado, USA" }}</span>
              <span class="mr-3"><strong class="text-white">River</strong> :
                {{ events.riverName || "Dirty Devil River" }}</span>
              <span class="mr-3"><strong class="text-white">Level</strong> :
                {{ events.levelName || "Classification - A" }}</span>
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
          <div class="race-card" :class="{ active: isActivated === c.key }" @click="selectCategory(c)">
            <div class="race-icon"><Icon :icon="c.icon" width="28" height="28" /></div>
            <div class="h6 font-weight-bold mb-1 text-center">{{ c.title }}</div>
            <small class="text-muted d-block text-center">{{ c.desc }}</small>
            <b-button size="sm" variant="secondary" class="rounded-pill w-100 mt-3">Select</b-button>
          </div>
        </b-col>
      </b-row>

      <!-- 3) REGISTERED TEAMS – sesuai race aktif -->
      <div class="d-flex align-items-center justify-content-between mt-4 mb-2">
        <h5 class="font-weight-bold mb-0">
          Registered Teams – {{ (raceActive.selected && raceActive.selected.name) || "Sprint" }} Category
        </h5>
      </div>

      <!-- R4 MEN -->
      <section class="panel-box" v-if="showPanel('R4','MEN')">
        <div class="panel-head">
          <div class="font-weight-bold">Team R4 Men's – {{ (raceActive.selected && raceActive.selected.name) || "Sprint" }}</div>
          <div class="d-flex align-items-center">
            <multiselect
              v-model="selectedToAdd.R4_MEN"
              :options="availableFor('R4','MEN')"
              :searchable="true"
              :close-on-select="true"
              :clear-on-select="true"
              :show-labels="false"
              track-by="id"
              label="nameTeam"
              placeholder="Select team"
              class="mr-2 minw-220"
              @input="onPickTeam('R4','MEN', $event)"
            />
            <b-button size="sm" variant="secondary" class="rounded-pill">Start Race</b-button>
          </div>
        </div>
        <teamParticipantVue
          :teamTitle="'R4 Men – ' + ((raceActive.selected && raceActive.selected.name) || 'Sprint')"
          :data="teamsMenR4"
          :fields="headersTable"
          @open-modal="openModal && openModal(formEvent ? formEvent.participant : null)"
        />
      </section>

      <!-- R4 WOMEN -->
      <section class="panel-box mt-4" v-if="showPanel('R4','WOMEN')">
        <div class="panel-head">
          <div class="font-weight-bold">Team R4 Women’s – {{ (raceActive.selected && raceActive.selected.name) || "Sprint" }}</div>
          <div class="d-flex align-items-center">
            <multiselect
              v-model="selectedToAdd.R4_WOMEN"
              :options="availableFor('R4','WOMEN')"
              :searchable="true"
              :close-on-select="true"
              :clear-on-select="true"
              :show-labels="false"
              track-by="id"
              label="nameTeam"
              placeholder="Select team"
              class="mr-2 minw-220"
              @input="onPickTeam('R4','WOMEN', $event)"
            />
            <b-button size="sm" variant="secondary" class="rounded-pill">Start Race</b-button>
          </div>
        </div>
        <teamParticipantVue
          :teamTitle="'R4 Women – ' + ((raceActive.selected && raceActive.selected.name) || 'Sprint')"
          :data="teamsWomenR4"
          :fields="headersTable"
          @open-modal="openModal && openModal(formEvent ? formEvent.participant : null)"
        />
      </section>

      <!-- R6 MEN -->
      <section class="panel-box mt-4" v-if="showPanel('R6','MEN')">
        <div class="panel-head">
          <div class="font-weight-bold">Team R6 Men's – {{ (raceActive.selected && raceActive.selected.name) || "Sprint" }}</div>
          <div class="d-flex align-items-center">
            <multiselect
              v-model="selectedToAdd.R6_MEN"
              :options="availableFor('R6','MEN')"
              :searchable="true"
              :close-on-select="true"
              :clear-on-select="true"
              :show-labels="false"
              track-by="id"
              label="nameTeam"
              placeholder="Select team"
              class="mr-2 minw-220"
              @input="onPickTeam('R6','MEN', $event)"
            />
            <b-button size="sm" variant="secondary" class="rounded-pill">Start Race</b-button>
          </div>
        </div>
        <teamParticipantVue
          :teamTitle="'R6 Men – ' + ((raceActive.selected && raceActive.selected.name) || 'Sprint')"
          :data="teamsMenR6"
          :fields="headersTable"
          @open-modal="openModal && openModal(formEvent ? formEvent.participant : null)"
        />
      </section>

      <!-- R6 WOMEN -->
      <section class="panel-box mt-4" v-if="showPanel('R6','WOMEN')">
        <div class="panel-head">
          <div class="font-weight-bold">Team R6 Women’s – {{ (raceActive.selected && raceActive.selected.name) || "Sprint" }}</div>
          <div class="d-flex align-items-center">
            <multiselect
              v-model="selectedToAdd.R6_WOMEN"
              :options="availableFor('R6','WOMEN')"
              :searchable="true"
              :close-on-select="true"
              :clear-on-select="true"
              :show-labels="false"
              track-by="id"
              label="nameTeam"
              placeholder="Select team"
              class="mr-2 minw-220"
              @input="onPickTeam('R6','WOMEN', $event)"
            />
            <b-button size="sm" variant="secondary" class="rounded-pill">Start Race</b-button>
          </div>
        </div>
        <teamParticipantVue
          :teamTitle="'R6 Women – ' + ((raceActive.selected && raceActive.selected.name) || 'Sprint')"
          :data="teamsWomenR6"
          :fields="headersTable"
          @open-modal="openModal && openModal(formEvent ? formEvent.participant : null)"
        />
      </section>

      <!-- Jika tidak ada satupun panel eligible -->
      <div v-if="!anyPanelShown" class="text-center text-muted py-5">
        Belum ada konfigurasi divisi/race untuk event ini.
      </div>
    </b-container>

    <!-- MODAL RESULT (existing) -->
    <b-modal id="bv-modal-result" title="Sprint Results" size="xl" hide-footer>
      <div v-if="resultsLoading" class="text-center py-4">Loading...</div>
      <div v-else>
        <table class="table table-striped table-sm mb-0">
          <thead>
            <tr>
              <th style="width: 50px">#</th>
              <th>Team</th>
              <th style="width: 90px">BIB</th>
              <th style="width: 90px">Rank</th>
              <th style="width: 140px">Race</th>
              <th style="width: 140px">Penalty</th>
              <th style="width: 140px">Total</th>
              <th style="width: 190px">Saved At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in sprintResultsSorted" :key="r._id || idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ r.nameTeam }}</td>
              <td>{{ r.bibTeam }}</td>
              <td>{{ r.result && r.result.ranked }}</td>
              <td>{{ r.result ? cleanTime(r.result.raceTime) : "" }}</td>
              <td>{{ r.result ? cleanTime(r.result.penaltyTime) : "" }}</td>
              <td>{{ r.result ? cleanTime(r.result.totalTime || r.result.raceTime) : "" }}</td>
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
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.min.css";

import teamParticipantVue from "./cards/team-participant.vue";
import cardEmptyVue from "@/components/cards/card-must-filled.vue";

export default {
  name: "SustainableTimingSystemRaftingDetails",
  components: { Icon, teamParticipantVue, cardEmptyVue, Multiselect },
  data() {
    return {
      // registry tim global untuk event ini (dropdown)
      availableTeams: [],
      selectedToAdd: { R4_MEN: null, R4_WOMEN: null, R6_MEN: null, R6_WOMEN: null },

      // template tim ketika dimasukkan ke participant
      teamTemplate: {
        nameTeam: "", bibTeam: "", startOrder: "", praStart: "", intervalRace: "", statusId: 0,
        result: { startTime: "", finishTime: "", raceTime: "", penaltyTime: "", penalty: "", totalTime: "", ranked: "", score: "" },
        otr:    { startTime: "", finishTime: "", raceTime: "", penaltyTime: "", penalty: "", totalTime: "", ranked: "", score: "" }
      },

      raceActive: { selected: { name: "SPRINT" }, show: true, actived: true },
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

      // UI state
      isActivated: "",
      eventActive: { selected: {}, show: false, actived: false },
      initialActive: { selected: {}, show: false, actived: false },
      divisionActive: { selected: {}, show: false, actived: false },

      // kartu kategori (ikon + deskripsi)
      raceCategories: [
        { key: "SPRINT",    title: "Sprint",      icon: "mdi:flash",            desc: "Short-distance race against the clock on grade II-III rapids" },
        { key: "HEAD2HEAD", title: "Head to Head",icon: "mdi:swap-horizontal",  desc: "Direct competition between two teams on parallel courses" },
        { key: "SLALOM",    title: "Slalom",      icon: "mdi:gate",             desc: "Technical navigation through gates on whitewater" },
        { key: "DRR",       title: "Down River",  icon: "mdi:waves",            desc: "Long-distance endurance race with varied river conditions" },
      ],
    };
  },
  computed: {
    // panel data
    teamsMenR4()   { return this.getTeamsBy("R4","MEN",   this.raceActive.selected && this.raceActive.selected.name); },
    teamsWomenR4() { return this.getTeamsBy("R4","WOMEN", this.raceActive.selected && this.raceActive.selected.name); },
    teamsMenR6()   { return this.getTeamsBy("R6","MEN",   this.raceActive.selected && this.raceActive.selected.name); },
    teamsWomenR6() { return this.getTeamsBy("R6","WOMEN", this.raceActive.selected && this.raceActive.selected.name); },

    // penentu ada panel yang tampil sama sekali
    anyPanelShown() {
      return this.showPanel("R4","MEN") || this.showPanel("R4","WOMEN") ||
             this.showPanel("R6","MEN") || this.showPanel("R6","WOMEN");
    },

    // existing
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
    await this.loadAvailableTeams(eventId);
  },
  methods: {
    // ====== PANELS VISIBILITY based on event config (NOT participant) ======
    hasDivision(divName) {
      const divs = this.events && this.events.categoriesDivision ? this.events.categoriesDivision : [];
      for (let i=0;i<divs.length;i++){
        if (String(divs[i].name).toUpperCase() === String(divName).toUpperCase()) return true;
      }
      return false;
    },
    hasRace(name) {
      const races = this.events && this.events.categoriesRace ? this.events.categoriesRace : [];
      for (let i=0;i<races.length;i++){
        if (String(races[i].name).toUpperCase() === String(name).toUpperCase()) return true;
      }
      return false;
    },
    showPanel(divName, raceName) {
      // panel terlihat jika diset di konfigurasi event (agar bisa tambah tim meski participant kosong)
      return this.hasDivision(divName) && this.hasRace(raceName);
    },

    // ====== DROPDOWN REGISTRY ======
    loadAvailableTeams(eventId) {
      try {
        ipcRenderer.send("get-teams-available", { eventId });
        ipcRenderer.once("get-teams-available-reply", (_e, res) => {
          if (Array.isArray(res) && res.length) {
            this.availableTeams = res;
          } else {
            // fallback contoh
            this.availableTeams = [
              { id: "t1", nameTeam: "FAJI DKI Jakarta", bibTeam: "001" },
              { id: "t2", nameTeam: "FAJI Banten",       bibTeam: "002" },
              { id: "t3", nameTeam: "FAJI DIY",          bibTeam: "003" },
              { id: "t4", nameTeam: "FAJI Jawa Barat",   bibTeam: "004" }
            ];
          }
        });
      } catch (e) {
        this.availableTeams = [
          { id: "t1", nameTeam: "FAJI DKI Jakarta", bibTeam: "001" },
          { id: "t2", nameTeam: "FAJI Banten",       bibTeam: "002" },
          { id: "t3", nameTeam: "FAJI DIY",          bibTeam: "003" },
          { id: "t4", nameTeam: "FAJI Jawa Barat",   bibTeam: "004" }
        ];
      }
    },
    availableFor(divisionName, raceName) {
      const ev = (this.raceActive && this.raceActive.selected && this.raceActive.selected.name)
                 ? String(this.raceActive.selected.name).toUpperCase() : "SPRINT";
      const bucket = this._getBucket(ev, divisionName, raceName);
      const used = {};
      if (bucket && Array.isArray(bucket.teams)) {
        for (let i=0;i<bucket.teams.length;i++) used[String(bucket.teams[i].bibTeam).trim()] = true;
      }
      const list = this.availableTeams || [];
      return list.filter(function(t){ return !used[String(t.bibTeam).trim()]; });
    },
    onPickTeam(divisionName, raceName, teamObj) {
      if (!teamObj) return;
      const ev = (this.raceActive && this.raceActive.selected && this.raceActive.selected.name)
                 ? String(this.raceActive.selected.name).toUpperCase() : "SPRINT";
      const bucket = this._ensureBucket(ev, divisionName, raceName);

      // cek duplikat BIB
      const exists = bucket.teams.some(function(t){ return String(t.bibTeam).trim() === String(teamObj.bibTeam).trim(); });
      if (exists) {
        ipcRenderer && ipcRenderer.send && ipcRenderer.send("get-alert", {
          type: "warning", message: "Duplicate BIB", detail: "BIB sudah dipakai pada panel ini."
        });
        return;
      }

      // map ke template
      const newTeam = JSON.parse(JSON.stringify(this.teamTemplate));
      newTeam.nameTeam = teamObj.nameTeam;
      newTeam.bibTeam  = teamObj.bibTeam;

      bucket.teams.push(newTeam);
      this.dataTeams = this.dataTeams.slice(); // trigger reactivity

      // reset dropdown
      const key = (String(divisionName).toUpperCase() + "_" + String(raceName).toUpperCase());
      if (this.selectedToAdd[key] !== undefined) this.selectedToAdd[key] = null;

      // persist
      this._persistParticipants();
    },
    _getBucket(eventName, divisionName, raceName) {
      const ev = String(eventName).toUpperCase();
      const div = String(divisionName).toUpperCase();
      const race = String(raceName).toUpperCase();
      const arr = this.dataTeams || [];
      for (let i=0;i<arr.length;i++){
        const p = arr[i];
        if (String(p.eventName).toUpperCase()===ev &&
            String(p.divisionName).toUpperCase()===div &&
            String(p.raceName).toUpperCase()===race) {
          if (!Array.isArray(p.teams)) p.teams = [];
          return p;
        }
      }
      return null;
    },
    _ensureBucket(eventName, divisionName, raceName) {
      const existing = this._getBucket(eventName, divisionName, raceName);
      if (existing) return existing;

      const ev = String(eventName).toUpperCase();
      const div = String(divisionName).toUpperCase();
      const race = String(raceName).toUpperCase();

      const bucket = {
        eventId:   this.events && this.events._id ? this.events._id : null,
        initialId: (this.initialActive && this.initialActive.selected && this.initialActive.selected.value) || "1",
        raceId:    null,
        divisionId:null,
        eventName: ev,
        initialName: (this.initialActive && this.initialActive.selected && this.initialActive.selected.name) || "YOUTH",
        raceName: race,
        divisionName: div,
        teams: []
      };
      if (!Array.isArray(this.dataTeams)) this.dataTeams = [];
      this.dataTeams.push(bucket);
      return bucket;
    },
    _persistParticipants() {
      try {
        if (!ipcRenderer || !ipcRenderer.send) return;
        const payload = { eventId: this.$route.params.id, participant: this.dataTeams };
        ipcRenderer.send('events-update-participant', payload);
        // optional feedback:
        // ipcRenderer.once('events-update-participant-reply', (_e,res)=>{});
      } catch(e) { /* ignore */ }
    },

    // ====== FILTER TIM & NORMALISASI RESULT ======
    getTeamsBy(divisionName, raceName, eventName) {
      if (!Array.isArray(this.dataTeams)) return [];
      const evName = String(eventName || "").toUpperCase();
      const div = String(divisionName || "").toUpperCase();
      const race = String(raceName || "").toUpperCase();

      const buckets = this.dataTeams.filter(function (p) {
        return String(p.eventName).toUpperCase() === evName &&
               String(p.divisionName).toUpperCase() === div &&
               String(p.raceName).toUpperCase() === race;
      });

      const out = [];
      for (let i=0;i<buckets.length;i++){
        const tms = buckets[i] && buckets[i].teams ? buckets[i].teams : [];
        for (let j=0;j<tms.length;j++){
          const t = Object.assign({}, tms[j]);
          t._eventName = evName; t._divisionName = div; t._raceName = race;
          t.resultDisplay = this.pickBestResult(t, evName);
          out.push(t);
        }
      }
      return out;
    },
    pickBestResult(team, evName) {
      const name = String(evName || "").toUpperCase();
      if (name === "SPRINT" || name === "DRR") return team && team.result ? team.result : {};
      if (name === "HEAD2HEAD") {
        const arr = (team && team.result && Array.isArray(team.result)) ? team.result.slice() : [];
        if (!arr.length) return {};
        arr.sort(function(a,b){
          const ba = typeof a.bracket === "number" ? a.bracket : -1;
          const bb = typeof b.bracket === "number" ? b.bracket : -1;
          if (bb !== ba) return bb - ba;
          return ((a.totalTime || a.raceTime || "") > (b.totalTime || b.raceTime || "")) ? 1 : -1;
        });
        return arr[0] || {};
      }
      if (name === "SLALOM") {
        let runs = (team && team.result && Array.isArray(team.result)) ? team.result : [];
        if (!runs.length) return {};
        const self = this;
        runs = runs.filter(function(r){ return r && (r.totalTime || r.raceTime); });
        if (!runs.length) return {};
        runs.sort(function(a,b){
          return self._toMs(a.totalTime || a.raceTime) - self._toMs(b.totalTime || b.raceTime);
        });
        return runs[0] || {};
      }
      return {};
    },
    _toMs(t) {
      if (!t) return Number.POSITIVE_INFINITY;
      const s = String(t).trim().replace("\r", "");
      const parts = s.split(":");
      if (parts.length < 3) return Number.POSITIVE_INFINITY;
      const hh = parseInt(parts[0], 10) || 0, mm = parseInt(parts[1], 10) || 0;
      const secMs = parts[2].split(".");
      const ss = parseInt(secMs[0], 10) || 0, ms = parseInt(secMs[1], 10) || 0;
      return ((hh * 60 + mm) * 60 + ss) * 1000 + ms;
    },

    // ====== UI ======
    selectCategory(c) {
      this.isActivated = c.key;
      this.raceActive = { selected: { name: c.key }, show: true, actived: true };
    },
    cleanTime(t) { return t ? String(t).trim().replace("\r", "") : ""; },
    fmtDate(d) { try { return new Date(d).toLocaleString(); } catch (e) { return "-"; } },

    // ====== IPC EVENT DATA ======
    async loadData(id) {
      this.loading = true;
      const self = this;
      setTimeout(function () {
        ipcRenderer.send("get-events-byid", id);
        ipcRenderer.once("get-events-byid-reply", function (_e, data) {
          if (data) {
            self.events = data;
            self.dataTeams = (data && data.participant) ? data.participant : [];
            localStorage.setItem("eventDetails", JSON.stringify(data));
          } else {
            console.error("Failed to retrieve data from events table");
          }
          self.loading = false;
        });
      }, 300);
    },

    // Navigation (opsional)
    goTo(val) { this.$router.push("/event-detail/" + this.$route.params.id + "/" + val); },
    back(val) { this.$router.push(val); },
    formatDate(inputDate) {
      if (!inputDate) return "-";
      const parts = inputDate.split("-");
      const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10) - 1, d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
      return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
    },

    // Modal Result (existing)
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
            detail: (res && res.error) ? res.error : "Cannot load results",
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
:root { --sts-blue:#2c5cff; --sts-muted:#8793b5; }

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
.minw-220{ min-width:220px; }
.panel-head .multiselect{ width:240px; }
.panel-head .multiselect__tags{ border-radius:999px; padding:2px 8px; }

/* tabel */
.panel-box .table{ margin-bottom:0; border-collapse:separate; border-spacing:0 8px; }
.panel-box .table thead th{ border:0; background:transparent; color:#2c3e50; font-weight:700; }
.panel-box .table tbody tr{ background:#fff; border:1px solid #eef0f6; }

/* Utility */
.placeholder{ color:#e5ebff; }
</style>