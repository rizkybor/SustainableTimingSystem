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
                {{ events.location || events.addressCity || "–" }}</span>
              <span class="mr-3"><strong class="text-white">River</strong> :
                {{ events.riverName || "–" }}</span>
              <span class="mr-3"><strong class="text-white">Level</strong> :
                {{ events.levelName || "–" }}</span>
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

      <!-- INITIAL CHIPS (pilih usia/kelas) -->
<h5 class="font-weight-bold mb-3 mt-4">Initial Categories</h5>
<b-row v-if="(events.categoriesInitial||[]).length">
  <b-col
    cols="12"
    md="3"
    v-for="i in events.categoriesInitial"
    :key="i.name"
    class="mb-3"
  >
    <div
      class="race-card"
      :class="{ active: initialActive.selected && initialActive.selected.name===i.name }"
      @click="selectInitial(i)"
    >
      <div class="h6 font-weight-bold mb-1 text-center">{{ i.name }}</div>
    </div>
  </b-col>
</b-row>

      <!-- 3) REGISTERED TEAMS – sesuai race aktif -->
      <div class="d-flex align-items-center justify-content-between mt-4 mb-2">
        <h5 class="font-weight-bold mb-0">
          Registered Teams – {{ (raceActive.selected && raceActive.selected.name) || "SPRINT" }} Category
        </h5>
      </div>

      <!-- R4 MEN -->
      <section class="panel-box" v-if="showPanel('R4','MEN')">
        <div class="panel-head">
          <div class="font-weight-bold">Team R4 Men's – {{ (raceActive.selected && raceActive.selected.name) || "SPRINT" }}</div>
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
          :teamTitle="'R4 Men – ' + ((raceActive.selected && raceActive.selected.name) || 'SPRINT')"
          :data="teamsMenR4"
          :fields="headersTable"
          @open-modal="openModal && openModal(formEvent ? formEvent.participant : null)"
        />
      </section>

      <!-- R4 WOMEN -->
      <section class="panel-box mt-4" v-if="showPanel('R4','WOMEN')">
        <div class="panel-head">
          <div class="font-weight-bold">Team R4 Women’s – {{ (raceActive.selected && raceActive.selected.name) || "SPRINT" }}</div>
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
          :teamTitle="'R4 Women – ' + ((raceActive.selected && raceActive.selected.name) || 'SPRINT')"
          :data="teamsWomenR4"
          :fields="headersTable"
          @open-modal="openModal && openModal(formEvent ? formEvent.participant : null)"
        />
      </section>

      <!-- R6 MEN -->
      <section class="panel-box mt-4" v-if="showPanel('R6','MEN')">
        <div class="panel-head">
          <div class="font-weight-bold">Team R6 Men's – {{ (raceActive.selected && raceActive.selected.name) || "SPRINT" }}</div>
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
          :teamTitle="'R6 Men – ' + ((raceActive.selected && raceActive.selected.name) || 'SPRINT')"
          :data="teamsMenR6"
          :fields="headersTable"
          @open-modal="openModal && openModal(formEvent ? formEvent.participant : null)"
        />
      </section>

      <!-- R6 WOMEN -->
      <section class="panel-box mt-4" v-if="showPanel('R6','WOMEN')">
        <div class="panel-head">
          <div class="font-weight-bold">Team R6 Women’s – {{ (raceActive.selected && raceActive.selected.name) || 'SPRINT' }}</div>
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
          :teamTitle="'R6 Women – ' + ((raceActive.selected && raceActive.selected.name) || 'SPRINT')"
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
      useDummyTeams: true, // set true untuk pakai dummy
dummyTeams: [
  { id: "t101", nameTeam: "FAJI Jakarta Pusat",  bibTeam: "001" },
  { id: "t102", nameTeam: "FAJI Jakarta Utara",  bibTeam: "002" },
  { id: "t103", nameTeam: "FAJI Jakarta Barat",  bibTeam: "003" },
  { id: "t104", nameTeam: "FAJI Jakarta Timur",  bibTeam: "004" },
  { id: "t105", nameTeam: "FAJI Jakarta Selatan",bibTeam: "005" },
  { id: "t106", nameTeam: "FAJI Bekasi",          bibTeam: "006" },
  { id: "t107", nameTeam: "FAJI Depok",           bibTeam: "007" },
  { id: "t108", nameTeam: "FAJI Bogor",           bibTeam: "008" },
  { id: "t109", nameTeam: "FAJI Tangerang",       bibTeam: "009" },
  { id: "t110", nameTeam: "FAJI Bandung",         bibTeam: "010" },
  { id: "t111", nameTeam: "FAJI Cirebon",         bibTeam: "011" },
  { id: "t112", nameTeam: "FAJI Serang",          bibTeam: "012" }
],
      availableTeams: [],
      selectedToAdd: { R4_MEN: null, R4_WOMEN: null, R6_MEN: null, R6_WOMEN: null },

      raceActive: { selected: { name: "SPRINT" }, show: true, actived: true },
      initialActive: { selected: {}, show: false, actived: false },

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

      isActivated: "",

      raceCategories: [
        { key: "SPRINT",    title: "Sprint",      icon: "mdi:flash",           desc: "Short-distance race against the clock on grade II-III rapids" },
        { key: "HEAD2HEAD", title: "Head to Head",icon: "mdi:swap-horizontal", desc: "Direct competition between two teams on parallel courses" },
        { key: "SLALOM",    title: "Slalom",      icon: "mdi:gate",            desc: "Technical navigation through gates on whitewater" },
        { key: "DRR",       title: "Down River",  icon: "mdi:waves",           desc: "Long-distance endurance race with varied river conditions" },
      ],
    };
  },
  computed: {
    // data per panel
    teamsMenR4()   { return this.getTeamsBy("R4","MEN",   this.raceActive.selected && this.raceActive.selected.name); },
    teamsWomenR4() { return this.getTeamsBy("R4","WOMEN", this.raceActive.selected && this.raceActive.selected.name); },
    teamsMenR6()   { return this.getTeamsBy("R6","MEN",   this.raceActive.selected && this.raceActive.selected.name); },
    teamsWomenR6() { return this.getTeamsBy("R6","WOMEN", this.raceActive.selected && this.raceActive.selected.name); },

    // apakah ada panel yang tampil
    anyPanelShown() {
      return this.showPanel("R4","MEN") || this.showPanel("R4","WOMEN") ||
             this.showPanel("R6","MEN") || this.showPanel("R6","WOMEN");
    },

    // existing (result modal)
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
    // set initial default = item pertama jika ada
    if ((this.events.categoriesInitial||[]).length && !this.initialActive.selected.name){
      this.initialActive = { selected: this.events.categoriesInitial[0], show: true, actived: true };
    }
  },
  methods: {
   /* ===== UI ===== */
  selectCategory(c) {
    this.isActivated = c.key;
    this.raceActive = { selected: { name: c.key }, show: true, actived: true };
  },
  selectInitial(init) {
    this.initialActive = { selected: init, show: true, actived: true };
  },

  /* ===== Panel visibility by config ===== */
  hasDivision(divName) {
    const divs = (this.events && this.events.categoriesDivision) ? this.events.categoriesDivision : [];
    return divs.some(function (d) {
      return String(d.name).toUpperCase() === String(divName).toUpperCase();
    });
  },
  hasRace(name) {
    const races = (this.events && this.events.categoriesRace) ? this.events.categoriesRace : [];
    return races.some(function (r) {
      return String(r.name).toUpperCase() === String(name).toUpperCase();
    });
  },
  showPanel(divName, raceName) {
    return this.hasDivision(divName) && this.hasRace(raceName);
  },

  /* ===== Dropdown registry ===== */
  loadAvailableTeams(eventId) {
      // Jika ingin pakai dummy (dev/demo), skip IPC dan isi langsung
  if (this.useDummyTeams) {
    this.availableTeams = this.dummyTeams.slice();
    return;
  }
    try {
      ipcRenderer.send("get-teams-available", { eventId });
      ipcRenderer.once("get-teams-available-reply", (_e, res) => {
        this.availableTeams = (Array.isArray(res) && res.length) ? res : [
          { id: "t1", nameTeam: "FAJI DKI Jakarta", bibTeam: "001" },
          { id: "t2", nameTeam: "FAJI Banten",       bibTeam: "002" },
          { id: "t3", nameTeam: "FAJI DIY",          bibTeam: "003" },
          { id: "t4", nameTeam: "FAJI Jawa Barat",   bibTeam: "004" }
        ];
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
    const ev = (this.raceActive.selected && this.raceActive.selected.name)
      ? String(this.raceActive.selected.name).toUpperCase() : "SPRINT";
    const initName = (this.initialActive.selected && this.initialActive.selected.name)
      ? this.initialActive.selected.name : "";
    const bucket = this._getBucket(ev, divisionName, raceName, initName);
    const used = new Set(((bucket && bucket.teams) ? bucket.teams : []).map(t => String(t.bibTeam).trim()));
    const list = this.availableTeams || [];
    return list.filter(t => !used.has(String(t.bibTeam).trim()));
  },

  /* ===== Add team via dropdown ===== */
  onPickTeam(divisionName, raceName, teamObj) {
    if (!teamObj) return;

    const evName = (this.raceActive.selected && this.raceActive.selected.name) ? this.raceActive.selected.name : "SPRINT";
    const initSel = (this.initialActive.selected && this.initialActive.selected.name) ? this.initialActive.selected.name : "";
    if (!initSel) {
      ipcRenderer && ipcRenderer.send && ipcRenderer.send("get-alert", { type:"warning", message:"Pilih Initial", detail:"Silakan pilih initial terlebih dahulu." });
      return;
    }

    const bucket = this._ensureBucket(evName, divisionName, raceName, initSel);

    if (bucket.teams.some(t => String(t.bibTeam).trim() === String(teamObj.bibTeam).trim())) {
      ipcRenderer && ipcRenderer.send && ipcRenderer.send("get-alert", { type:"warning", message:"Duplicate BIB", detail:`BIB ${teamObj.bibTeam} sudah ada pada kombinasi ini.` });
      return;
    }

    const record = this._buildTeamRecord(evName, teamObj);
    bucket.teams.push(record);
    this.dataTeams = this.dataTeams.slice();

    const k = (String(divisionName).toUpperCase() + "_" + String(raceName).toUpperCase());
    if (this.selectedToAdd[k] !== undefined) this.selectedToAdd[k] = null;

    this._persistParticipants();
  },

  _buildTeamRecord(eventName, teamObj) {
    const ev = String(eventName||"").toUpperCase();
    const base = {
      nameTeam: teamObj.nameTeam,
      bibTeam: teamObj.bibTeam,
      startOrder: "", praStart: "", intervalRace: "", statusId: 0,
    };
    if (ev === "HEAD2HEAD") {
      return { ...base, result: [{ startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"", bracket:16 }] };
    }
    if (ev === "SLALOM") {
      return { ...base, result: [
        { startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"" },
        { startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"" },
      ]};
    }
    return {
      ...base,
      result: { startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"" },
      otr:    { startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"" }
    };
  },

  /* ===== Buckets ===== */
  _getBucket(eventName, divisionName, raceName, initialName) {
    const ev = String(eventName||"").toUpperCase();
    const div= String(divisionName||"").toUpperCase();
    const rac= String(raceName||"").toUpperCase();
    const ini= String(initialName||"").toUpperCase();
    const arr = this.dataTeams || [];
    for (let i=0;i<arr.length;i++){
      const p = arr[i];
      if (String(p.eventName).toUpperCase()===ev &&
          String(p.divisionName).toUpperCase()===div &&
          String(p.raceName).toUpperCase()===rac &&
          String(p.initialName).toUpperCase()===ini) {
        if (!Array.isArray(p.teams)) p.teams = [];
        return p;
      }
    }
    return null;
  },
  _ensureBucket(eventName, divisionName, raceName, initialName) {
    const exist = this._getBucket(eventName, divisionName, raceName, initialName);
    if (exist) return exist;

    const ev  = String(eventName).toUpperCase();
    const div = String(divisionName).toUpperCase();
    const rac = String(raceName).toUpperCase();
    const ini = String(initialName).toUpperCase();

    const evCfg  = (this.events && this.events.categoriesEvent)   ? this.events.categoriesEvent.find(x => String(x.name).toUpperCase() === ev)  : null;
    const iniCfg = (this.events && this.events.categoriesInitial) ? this.events.categoriesInitial.find(x => String(x.name).toUpperCase() === ini): null;
    const racCfg = (this.events && this.events.categoriesRace)    ? this.events.categoriesRace.find(x => String(x.name).toUpperCase() === rac) : null;
    const divCfg = (this.events && this.events.categoriesDivision)? this.events.categoriesDivision.find(x => String(x.name).toUpperCase() === div): null;

    const bucket = {
      eventId:    evCfg  ? String(evCfg.value)  : "",
      initialId:  iniCfg ? String(iniCfg.value) : "",
      raceId:     racCfg ? String(racCfg.value) : "",
      divisionId: divCfg ? String(divCfg.value) : "",
      eventName:   ev,
      initialName: ini,
      raceName:    rac,
      divisionName:div,
      teams: []
    };
    if (!Array.isArray(this.dataTeams)) this.dataTeams = [];
    this.dataTeams.push(bucket);
    return bucket;
  },
  _persistParticipants() {
    try {
      const payload = { eventId: this.$route.params.id, participant: this.dataTeams };
      ipcRenderer && ipcRenderer.send && ipcRenderer.send("events-update-participant", payload);
    } catch(e) {}
  },

    /* ===== Filter & result normalize ===== */
    getTeamsBy(divisionName, raceName, eventName) {
      if (!Array.isArray(this.dataTeams)) return [];
      const evName = String(eventName || "").toUpperCase();
      const div = String(divisionName || "").toUpperCase();
      const race = String(raceName || "").toUpperCase();
      const ini = (this.initialActive.selected && this.initialActive.selected.name)
                  ? String(this.initialActive.selected.name).toUpperCase() : "";

      const buckets = this.dataTeams.filter(p =>
        String(p.eventName).toUpperCase() === evName &&
        String(p.divisionName).toUpperCase() === div &&
        String(p.raceName).toUpperCase() === race &&
        (!ini || String(p.initialName).toUpperCase() === ini)
      );

      const out = [];
      buckets.forEach(b => {
        (b.teams || []).forEach(t => {
          const row = { ...t, _eventName: evName, _divisionName: div, _raceName: race };
          row.resultDisplay = this.pickBestResult(row, evName);
          out.push(row);
        });
      });
      return out;
    },
    pickBestResult(team, evName) {
      const name = String(evName || "").toUpperCase();
      if (name === "SPRINT" || name === "DRR") return team && team.result ? team.result : {};
      if (name === "HEAD2HEAD") {
        const arr = (team && team.result && Array.isArray(team.result)) ? team.result.slice() : [];
        if (!arr.length) return {};
        arr.sort((a,b)=>{
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
        runs = runs.filter(r => r && (r.totalTime || r.raceTime));
        if (!runs.length) return {};
        const toMs = (t) => {
          if (!t) return Number.POSITIVE_INFINITY;
          const s = String(t).trim().replace("\r", "");
          const parts = s.split(":");
          if (parts.length < 3) return Number.POSITIVE_INFINITY;
          const hh = parseInt(parts[0], 10) || 0, mm = parseInt(parts[1], 10) || 0;
          const secMs = parts[2].split(".");
          const ss = parseInt(secMs[0], 10) || 0, ms = parseInt(secMs[1], 10) || 0;
          return ((hh * 60 + mm) * 60 + ss) * 1000 + ms;
        };
        runs.sort((a,b)=> toMs(a.totalTime || a.raceTime) - toMs(b.totalTime || b.raceTime));
        return runs[0] || {};
      }
      return {};
    },

    /* ===== IPC: load event & results ===== */
    async loadData(id) {
      this.loading = true;
      setTimeout(() => {
        ipcRenderer.send("get-events-byid", id);
        ipcRenderer.once("get-events-byid-reply", (_e, data) => {
          if (data) {
            this.events = data;
            this.dataTeams = Array.isArray(data.participant) ? data.participant : [];
            localStorage.setItem("eventDetails", JSON.stringify(data));
          }
          this.loading = false;
        });
      }, 300);
    },

    // existing
    cleanTime(t) { return t ? String(t).trim().replace("\r", "") : ""; },
    fmtDate(d)   { try { return new Date(d).toLocaleString(); } catch (e) { return "-"; } },
    showResultCategories() {
      this.resultsLoading = true;
      this.sprintResults = [];
      const q = { eventId: this.$route.params.id };
      ipcRenderer.send("get-sprint-result", q);
      ipcRenderer.once("get-sprint-result-reply", (_e, res) => {
        this.resultsLoading = false;
        if (!(res && res.ok)) {
          ipcRenderer.send("get-alert", {
            type: "warning",
            detail: res && res.error ? res.error : "Cannot load results",
            message: "Failed",
          });
          this.$bvModal.show("bv-modal-result");
          return;
        }
        this.sprintResults = Array.isArray(res.items) ? res.items : [];
        this.$bvModal.show("bv-modal-result");
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
  padding:0;
  /* overflow:hidden;  <-- HAPUS baris ini */
  overflow: visible;     /* tambahkan ini */
  position: relative;    /* biar z-index bekerja */
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