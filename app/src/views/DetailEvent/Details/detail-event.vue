<template>
  <div class="sts-detail">
    <b-container class="mt-3">
      <div class="text-muted small mb-2">
        Events / <span class="text-body">{{ events.eventName || "Event" }}</span>
      </div>
    </b-container>

    <!-- HERO -->
    <section class="detail-hero">
      <div class="hero-bg"></div>
      <b-container class="hero-inner">
        <b-row>
          <b-col cols="12" md="8" class="py-4 text-shadow">
            <h2 class="h1 font-weight-bold mb-2 text-white">
              {{ events.eventName || "Kejuraan Arung Jeram" }}
            </h2>
            <div class="meta text-white-50">
              <span class="mr-3"><strong class="text-white">Location</strong> : {{ events.location || events.addressCity || "-" }}</span>
              <span class="mr-3"><strong class="text-white">River</strong> : {{ events.riverName || "-" }}</span>
              <span class="mr-3"><strong class="text-white">Level</strong> : {{ events.levelName || "-" }}</span>
            </div>
          </b-col>
          <b-col cols="12" md="4" class="d-flex align-items-center justify-content-center">
            <div class="hero-logo placeholder d-flex align-items-center justify-content-center">
              <Icon icon="mdi:shield-crown" width="56" height="56" />
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>

    <b-container class="mt-4 mb-5">
      <!-- CATEGORIES (klik untuk ganti eventName: SPRINT/H2H/SLALOM/DRR) -->
      <h5 class="font-weight-bold mb-3">Race Categories</h5>
      <b-row>
        <b-col cols="12" md="3" v-for="c in raceCategories" :key="c.key" class="mb-3">
          <div class="race-card" :class="{ active: raceActive.selected.name === c.key }" @click="selectCategory(c)">
            <div class="race-icon"><Icon :icon="c.icon" width="28" height="28" /></div>
            <div class="h6 font-weight-bold mb-1 text-center">{{ c.title }}</div>
            <small class="text-muted d-block text-center">{{ c.desc }}</small>
          </div>
        </b-col>
      </b-row>

      <!-- INITIAL TABS (Youth/Junior/Open dlsb) -->
      <h5 class="font-weight-bold mb-3 mt-4">Initials Category</h5>
      <div class="init-tabs" v-if="(events.categoriesInitial || []).length">
        <button
          v-for="i in events.categoriesInitial"
          :key="i.name"
          type="button"
          class="init-tab"
          :class="{ active: initialActive.selected.name === i.name }"
          @click="selectInitial(i)"
        >
          {{ i.name }}
        </button>
      </div>

      <!-- TITLE -->
      <div class="d-flex align-items-center justify-content-between mt-5 mb-2">
        <h5 class="font-weight-bold mb-0">
          Registered Teams – {{ raceActive.selected.name }} Category
        </h5>
      </div>

      <!-- PANELS -->
      <team-panel
        v-if="showPanel('R4','MEN')"
        class="mt-2"
        title="Team R4 Men's"
        :division="'R4'"
        :race="'MEN'"
        :event-name="raceActive.selected.name"
        :initial-name="initialActive.selected.name"
        :rows="teamsMenR4"
        :teams-available="availableFor('R4','MEN')"
        :draft="draftMap['R4_MEN']"
        @add-draft="addDraft('R4','MEN')"
        @draft-change="onDraftChange('R4','MEN', $event)"
        @draft-save="saveDraft('R4','MEN')"
        @draft-cancel="cancelDraft('R4','MEN')"
        @delete-row="deleteRow('R4','MEN', $event)"
      />

      <team-panel
        v-if="showPanel('R4','WOMEN')"
        class="mt-4"
        title="Team R4 Women’s"
        :division="'R4'"
        :race="'WOMEN'"
        :event-name="raceActive.selected.name"
        :initial-name="initialActive.selected.name"
        :rows="teamsWomenR4"
        :teams-available="availableFor('R4','WOMEN')"
        :draft="draftMap['R4_WOMEN']"
        @add-draft="addDraft('R4','WOMEN')"
        @draft-change="onDraftChange('R4','WOMEN', $event)"
        @draft-save="saveDraft('R4','WOMEN')"
        @draft-cancel="cancelDraft('R4','WOMEN')"
        @delete-row="deleteRow('R4','WOMEN', $event)"
      />

      <team-panel
        v-if="showPanel('R6','MEN')"
        class="mt-4"
        title="Team R6 Men's"
        :division="'R6'"
        :race="'MEN'"
        :event-name="raceActive.selected.name"
        :initial-name="initialActive.selected.name"
        :rows="teamsMenR6"
        :teams-available="availableFor('R6','MEN')"
        :draft="draftMap['R6_MEN']"
        @add-draft="addDraft('R6','MEN')"
        @draft-change="onDraftChange('R6','MEN', $event)"
        @draft-save="saveDraft('R6','MEN')"
        @draft-cancel="cancelDraft('R6','MEN')"
        @delete-row="deleteRow('R6','MEN', $event)"
      />

      <team-panel
        v-if="showPanel('R6','WOMEN')"
        class="mt-4"
        title="Team R6 Women’s"
        :division="'R6'"
        :race="'WOMEN'"
        :event-name="raceActive.selected.name"
        :initial-name="initialActive.selected.name"
        :rows="teamsWomenR6"
        :teams-available="availableFor('R6','WOMEN')"
        :draft="draftMap['R6_WOMEN']"
        @add-draft="addDraft('R6','WOMEN')"
        @draft-change="onDraftChange('R6','WOMEN', $event)"
        @draft-save="saveDraft('R6','WOMEN')"
        @draft-cancel="cancelDraft('R6','WOMEN')"
        @delete-row="deleteRow('R6','WOMEN', $event)"
      />

      <div v-if="!anyPanelShown" class="text-center text-muted py-5">
        Belum ada konfigurasi divisi/race untuk event ini.
      </div>
    </b-container>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { ipcRenderer } from "electron";
import TeamPanel from "./../components/TeamPanel.vue";

export default {
  name: "SustainableTimingSystemRaftingDetails",
  components: { Icon, TeamPanel },
  data() {
    return {
      // kategori UI
      raceCategories: [
        { key: "SPRINT",    title: "Sprint",      icon: "mdi:flash",           desc: "Short-distance time trial" },
        { key: "HEAD2HEAD", title: "Head to Head",icon: "mdi:swap-horizontal", desc: "Duel parallel course" },
        { key: "SLALOM",    title: "Slalom",      icon: "mdi:gate",            desc: "Gate navigation on whitewater" },
        { key: "DRR",       title: "Down River",  icon: "mdi:waves",           desc: "Long distance river race" },
      ],

      // state
      raceActive: { selected: { name: "SPRINT" } },
      initialActive: { selected: { name: "YOUTH" } },

      // data
      events: {},            // { categoriesDivision, categoriesRace, categoriesInitial, participant: [...] }
      dataTeams: [],         // alias events.participant
      availableTeams: [],    // sumber dropdown (opsional dari IPC)
      useDummyTeams: true,
      dummyTeams: [
        { id: "t101", nameTeam: "JAKARTA PUSAT",   bibTeam: "001" },
        { id: "t102", nameTeam: "JAKARTA SELATAN", bibTeam: "002" },
        { id: "t103", nameTeam: "JAKARTA TIMUR",   bibTeam: "003" },
        { id: "t104", nameTeam: "JAKARTA BARAT",   bibTeam: "004" },
      ],

      // draft baris input per kombinasi
      draftMap: { R4_MEN:null, R4_WOMEN:null, R6_MEN:null, R6_WOMEN:null },
    };
  },

  computed: {
    // ambil rows berdasar kombinasi & initial aktif
    teamsMenR4()   { return this.getTeamsBy("R4","MEN",   this.raceActive.selected.name); },
    teamsWomenR4() { return this.getTeamsBy("R4","WOMEN", this.raceActive.selected.name); },
    teamsMenR6()   { return this.getTeamsBy("R6","MEN",   this.raceActive.selected.name); },
    teamsWomenR6() { return this.getTeamsBy("R6","WOMEN", this.raceActive.selected.name); },

    anyPanelShown() {
      return this.showPanel("R4","MEN") || this.showPanel("R4","WOMEN") ||
             this.showPanel("R6","MEN") || this.showPanel("R6","WOMEN");
    },
  },

  async created() {
    const id = this.$route.params.id;
    await this.loadEvent(id);             // isi this.events + this.dataTeams
    await this.loadAvailableTeams(id);    // isi dropdown

    // set initial pertama bila belum
    if ((this.events.categoriesInitial||[]).length && !this.initialActive.selected.name) {
      this.initialActive.selected = this.events.categoriesInitial[0];
    }
  },

  methods: {
    /* ------------ UI ------------- */
    selectCategory(c){ this.raceActive.selected = { name: c.key }; }
    ,
    selectInitial(i){ this.initialActive.selected = i; },

    /* ------------ visibility panel ------------ */
    hasDivision(name){
      return (this.events.categoriesDivision||[]).some(
        d => String(d.name).toUpperCase() === String(name).toUpperCase()
      );
    },
    hasRace(name){
      return (this.events.categoriesRace||[]).some(
        r => String(r.name).toUpperCase() === String(name).toUpperCase()
      );
    },
    showPanel(div, race){ return this.hasDivision(div) && this.hasRace(race); },

    /* ------------ sumber dropdown ------------ */
    loadAvailableTeams(eventId){
      if (this.useDummyTeams) { this.availableTeams = this.dummyTeams.slice(); return; }
      try {
        ipcRenderer.send("get-teams-available", { eventId });
        ipcRenderer.once("get-teams-available-reply", (_e, res) => {
          this.availableTeams = Array.isArray(res) && res.length ? res : this.dummyTeams.slice();
        });
      } catch { this.availableTeams = this.dummyTeams.slice(); }
    },
    availableFor(divisionName, raceName){
      const ev   = this.raceActive.selected.name.toUpperCase();
      const init = (this.initialActive.selected && this.initialActive.selected.name || "").toUpperCase();
      const bucket = this._getBucket(ev, divisionName, raceName, init);
      const usedBibs = new Set(((bucket && bucket.teams) ? bucket.teams : []).map(t => String(t.bibTeam).trim()));
      return (this.availableTeams||[]).filter(t => !usedBibs.has(String(t.bibTeam).trim()));
    },

    /* ------------ akses data participant ------------ */
    getTeamsBy(divisionName, raceName, eventName){
      if (!Array.isArray(this.dataTeams)) return [];
      const ev  = String(eventName||"").toUpperCase();
      const div = String(divisionName||"").toUpperCase();
      const rac = String(raceName||"").toUpperCase();
      const ini = (this.initialActive.selected && this.initialActive.selected.name)
                  ? String(this.initialActive.selected.name).toUpperCase() : "";
      const buckets = this.dataTeams.filter(p =>
        String(p.eventName).toUpperCase()   === ev  &&
        String(p.divisionName).toUpperCase()=== div &&
        String(p.raceName).toUpperCase()    === rac &&
        (!ini || String(p.initialName).toUpperCase() === ini)
      );
      const out = [];
      buckets.forEach(b => (b.teams||[]).forEach(t => out.push({ ...t })));
      return out;
    },

    _getBucket(eventName, divisionName, raceName, initialName){
      const ev  = String(eventName||"").toUpperCase();
      const div = String(divisionName||"").toUpperCase();
      const rac = String(raceName||"").toUpperCase();
      const ini = String(initialName||"").toUpperCase();
      const arr = this.dataTeams || [];
      const found = arr.find(p =>
        String(p.eventName).toUpperCase()   === ev  &&
        String(p.divisionName).toUpperCase()=== div &&
        String(p.raceName).toUpperCase()    === rac &&
        String(p.initialName).toUpperCase() === ini
      );
      if (found) { if (!Array.isArray(found.teams)) found.teams = []; return found; }
      return null;
    },
    _ensureBucket(eventName, divisionName, raceName, initialName){
      const exist = this._getBucket(eventName, divisionName, raceName, initialName);
      if (exist) return exist;

      const ev  = String(eventName).toUpperCase();
      const div = String(divisionName).toUpperCase();
      const rac = String(raceName).toUpperCase();
      const ini = String(initialName).toUpperCase();

      const evCfg  = (this.events.categoriesEvent||[]).find(x => String(x.name).toUpperCase() === ev);
      const iniCfg = (this.events.categoriesInitial||[]).find(x => String(x.name).toUpperCase() === ini);
      const racCfg = (this.events.categoriesRace||[]).find(x => String(x.name).toUpperCase() === rac);
      const divCfg = (this.events.categoriesDivision||[]).find(x => String(x.name).toUpperCase() === div);

      const bucket = {
        eventId:    evCfg  ? String(evCfg.value)  : "",
        initialId:  iniCfg ? String(iniCfg.value) : "",
        raceId:     racCfg ? String(racCfg.value) : "",
        divisionId: divCfg ? String(divCfg.value) : "",
        eventName: ev, initialName: ini, raceName: rac, divisionName: div,
        teams: []
      };
      if (!Array.isArray(this.dataTeams)) this.dataTeams = [];
      this.dataTeams.push(bucket);
      return bucket;
    },

    _buildTeamRecord(eventName, teamObj){
      const ev = String(eventName||"").toUpperCase();
      const base = {
        nameTeam: teamObj.nameTeam,
        bibTeam: String(teamObj.bibTeam||"").trim(),
        startOrder:"", praStart:"", intervalRace:"", statusId:0,
      };
      if (ev === "HEAD2HEAD") {
        return { ...base, result:[{ startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"", bracket:16 }] };
      }
      if (ev === "SLALOM") {
        return { ...base, result:[
          { startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"" },
          { startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"" },
        ]};
      }
      // SPRINT / DRR
      return {
        ...base,
        result:{ startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"" },
        otr:   { startTime:"", finishTime:"", raceTime:"", penaltyTime:"", penalty:"", totalTime:"", ranked:"", score:"" }
      };
    },

    /* ------------ Draft handlers ------------ */
    keyOf(div, race){ return `${String(div).toUpperCase()}_${String(race).toUpperCase()}`; },
    addDraft(div, race){
      const k = this.keyOf(div, race);
      if (!this.draftMap[k]) this.$set(this.draftMap, k, { teamId:"", bib:"" });
    },
    cancelDraft(div, race){ this.$set(this.draftMap, this.keyOf(div, race), null); },
    onDraftChange(div, race, draft){ this.$set(this.draftMap, this.keyOf(div, race), draft); },

    saveDraft(div, race){
      const k = this.keyOf(div, race);
      const d = this.draftMap[k];
      if (!d || !d.teamId || !d.bib) return;

      const evName = this.raceActive.selected.name;
      const init   = this.initialActive.selected && this.initialActive.selected.name || "";
      const bucket = this._ensureBucket(evName, div, race, init);

      // Cek duplicate BIB
      if (bucket.teams.some(t => String(t.bibTeam).trim() === String(d.bib).trim())) return;

      const srcTeam = (this.availableTeams||[]).find(t => String(t.id) === String(d.teamId));
      if (!srcTeam) return;

      bucket.teams.push(this._buildTeamRecord(evName, { ...srcTeam, bibTeam: d.bib }));
      this.dataTeams = this.dataTeams.slice();      // trigger reactive update
      this.$set(this.draftMap, k, null);
      this.persistParticipants();
    },

    deleteRow(div, race, bib){
      const evName = this.raceActive.selected.name;
      const init   = this.initialActive.selected && this.initialActive.selected.name || "";
      const bucket = this._getBucket(evName, div, race, init);
      if (!bucket) return;
      bucket.teams = (bucket.teams||[]).filter(t => String(t.bibTeam).trim() !== String(bib).trim());
      this.dataTeams = this.dataTeams.slice();
      this.persistParticipants();
    },

    /* ------------ load & persist ------------ */
    async loadEvent(id){
      // Ambil event + participant dari IPC (atau fallback localStorage)
      try {
        ipcRenderer.send("get-events-byid", id);
        await new Promise(resolve => {
          ipcRenderer.once("get-events-byid-reply", (_e, data) => {
            this.events = data || {};
            this.dataTeams = Array.isArray(this.events.participant) ? this.events.participant : [];
            resolve();
          });
        });
      } catch { this.events = {}; this.dataTeams = []; }
    },
    persistParticipants(){
      try {
        ipcRenderer.send("events-update-participant", { eventId: this.$route.params.id, participant: this.dataTeams });
      } catch {}
    },
  },
};
</script>

<style scoped>
:root { --blue:#1f6fa3; }

/* HERO */
.detail-hero{ position: relative; min-height: 220px; }
.detail-hero .hero-bg{
  position:absolute; inset:0;
  background-image: url('https://images.unsplash.com/photo-1520981825232-ece5fae45120?q=80&w=1600&auto=format&fit=crop');
  background-size: cover; background-position: center; filter: brightness(0.55);
}
.detail-hero .hero-inner{ position:relative; z-index:1; }
.text-shadow{ text-shadow: 0 2px 10px rgba(0,0,0,.35); }
.hero-logo{
  width:80px; height:80px; border-radius:18px; background: rgba(255,255,255,.2);
  color:#fff; border:1px solid rgba(255,255,255,.35); box-shadow:0 8px 22px rgba(0,0,0,.25);
}

/* CARDS */
.race-card{ border:1px solid #e6ebf4; border-radius:16px; background:#fff; padding:16px; height:100%;
  box-shadow:0 12px 26px rgba(31,56,104,.08); transition:transform .12s, box-shadow .12s, border-color .12s; cursor:pointer; }
.race-card.active{ border-color: var(--blue); box-shadow:0 14px 30px rgba(31,111,163,.16); }
.race-icon{ width:56px; height:56px; border-radius:12px; margin:0 auto 8px; background:#eef6ff; color:var(--blue);
  display:flex; align-items:center; justify-content:center; }

/* INITIAL TABS */
.init-tabs{ display:flex; gap:12px; background:#f1f3f7; padding:6px; border-radius:10px; }
.init-tab{ border:0; background:transparent; color:#2b3445; font-weight:700; padding:10px 18px; border-radius:8px; }
.init-tab.active{ background:var(--blue); color:#fff; box-shadow:0 6px 16px rgba(31,111,163,.24); }

/* TABLE & BUTTONS - class dipakai juga di TeamPanel.vue */
.panel-box{ border:1px solid #e6ebf4; border-radius:16px; background:#fff; box-shadow:0 12px 26px rgba(31,56,104,.08); }
.panel-head{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px;
  border-bottom:1px solid #edf2f7; background:#f9fbff; border-top-left-radius:16px; border-top-right-radius:16px; }
.btn-start{ border:1px solid #d0d9e8 !important; background:#f4f7fb !important; color:#56627a !important;
  border-radius:10px; padding:6px 12px; font-weight:700; }
.panel-body{ padding:10px 16px 4px; }
.panel-footer{ padding:8px 16px 14px; border-top:1px solid #f0f3f9; }
.btn-add{ background:#ffffff; border:1px solid #cfd8e6; color:#1c4c7a; font-weight:700; border-radius:10px; padding:8px 14px; }

.team-table{ width:100%; border-collapse:separate; border-spacing:0 10px; }
.team-table thead th{ background:#eef1f6; color:#1f2940; font-weight:700; font-size:12px; letter-spacing:.3px;
  padding:10px 12px; border-top-left-radius:10px; border-top-right-radius:10px; }
.team-table tbody .row-card{ background:#fff; border:1px solid #e7ecf6; border-radius:10px; box-shadow:0 6px 18px rgba(31,56,104,.06); }
.team-table tbody td{ padding:10px 12px; vertical-align:middle; }
.team-table tbody td.muted{ color:#73809a; width:64px; }

.field{ position:relative; }
.input{ width:100%; height:38px; border-radius:10px; border:1px solid #e6ebf4; background:#f7f9fc; padding:6px 34px 6px 10px; outline:none; }
.input:focus{ background:#fff; border-color:#9ec5ff; box-shadow:0 0 0 4px rgba(42,104,196,.15); }
.suffix{ position:absolute; right:10px; top:50%; transform:translateY(-50%); pointer-events:none; color:#7b8aa6; }

.btn-ghost{ border:1px solid #d5deec; background:#eef3fb; color:#325a8f; border-radius:10px; height:34px; width:34px;
  display:inline-flex; align-items:center; justify-content:center; }
.btn-ghost.ok{ background:#e6f7ff; border-color:#c6e9ff; color:#0d789d; }
.btn-ghost.danger{ background:#fef2f2; color:#a11d1d; border-color:#f1d1d1; }
.ml-2{ margin-left:8px; }

.placeholder{ color:#8793b5; }
</style>