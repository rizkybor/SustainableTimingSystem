<template>
  <div v-if="settingsLoading.active" class="upload-hud">
    <div class="upload-box">
      <b-spinner class="mb-2" label="Uploading"></b-spinner>
      <div class="font-weight-bold">{{ settingsLoading.stage }}</div>
      <small class="text-muted">{{ settingsLoading.percent }}%</small>
    </div>
  </div>
  <div v-else class="sts-detail">
    <b-container class="mt-3">
      <div class="text-muted small mb-2">
        Events /
        <span class="text-body">{{ events.eventName || "Event" }}</span>
      </div>
    </b-container>

    <!-- HERO -->
    <section class="detail-hero">
      <div class="hero-bg"></div>
      <b-container class="hero-inner">
        <b-row class="align-items-center mt-3">
          <!-- logo -->
          <b-col cols="auto" class="pr-0">
            <div
              class="hero-logo mr-2 d-flex align-items-center justify-content-center"
            >
              <template v-if="hasEventLogo">
                <img
                  :src="eventLogoUrl"
                  alt="Event Logo"
                  class="event-logo-img"
                />
              </template>
              <template v-else>
                <img
                  :src="defaultImg"
                  alt="Event Logo"
                  class="event-logo-img"
                />
              </template>
            </div>
          </b-col>

          <!-- judul + meta -->
          <b-col>
            <h2 class="h1 font-weight-bold mb-1 text-white">
              {{ events.eventName || "-" }}
            </h2>
            <div class="meta">
              <span class="mr-3" style="font-size: 18px"
                ><strong class="text-white">River</strong> :
                {{ events.riverName || "-" }}</span
              >
              <span class="mr-3" style="font-size: 18px"
                ><strong class="text-white">Level</strong> :
                {{ events.levelName || "-" }}</span
              >
            </div>
            <div class="meta">
              <span class="mr-3" style="font-size: 18px"
                ><strong class="text-white">Location</strong> :
                {{ events.addressCity || "-" }},
                {{ events.addressProvince || "-" }} -
                {{ events.addressState || "-" }}</span
              >
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>

    <b-container class="mt-4 mb-5">
      <div class="mb-2 d-flex justify-content-md-end">
        <b-button
          class="btn-race-settings mr-2"
          @click="goToEventOverallResult"
        >
          <Icon icon="mdi:trophy-outline" class="mr-1" />
          Event Overall Result
        </b-button>

        <b-button class="btn-race-settings mr-2" @click="openEventSettings">
          Event Settings
        </b-button>

        <b-button class="btn-race-settings mr-2" @click="openJudgeSettings">
          Judges Settings
        </b-button>

        <b-button class="btn-race-settings mr-2" @click="openRaceSettings">
          Race Settings
        </b-button>

        <b-button variant="outline-danger" class="btn-race-reset" @click="openResetDataModal">
          Reset Data
        </b-button>
      </div>

      <!-- CATEGORIES (klik untuk ganti eventName: SPRINT/H2H/SLALOM/DRR/RAFTINGCROSS) -->
      <h5 class="font-weight-bold mb-3">Race Categories</h5>
      <b-row>
        <b-col
          cols="12"
          md="3"
          v-for="c in availableRaceCategories"
          :key="c.key"
          class="mb-3"
        >
          <div
            class="race-card"
            :class="{ active: raceActive.selected.name === c.key }"
            @click="selectCategory(c)"
          >
            <div class="race-icon">
              <!-- <Icon :icon="c.icon" width="28" height="28" /> -->
              <img class="icon-event" :src="c.icon" width="60" height="60" />
            </div>
            <div class="h6 font-weight-bold mb-1 text-center">
              {{ c.title }}
            </div>
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
        v-for="(combo, comboIdx) in visibleDivisionRaceCombos"
        :key="combo.panelKey"
        :class="comboIdx === 0 ? 'mt-2' : 'mt-4'"
        :title="combo.title"
        :division="combo.division"
        :race="combo.race"
        :event-name="raceActive.selected.name"
        :initial-name="initialActive.selected.name"
        :default-collapsed="comboIdx !== 0"
        :rows="getTeamsBy(combo.division, combo.race, raceActive.selected.name)"
        :teams-available="availableFor(combo.division, combo.race)"
        :competed-set="competedSetFor(combo.panelKey)"
        :draft="draftMap[combo.panelKey]"
        :loading="loadingByPanel[combo.panelKey]"
        @add-draft="addDraft(combo.division, combo.race)"
        @draft-change="onDraftChange(combo.division, combo.race, $event)"
        @draft-save="saveDraft(combo.division, combo.race)"
        @draft-cancel="cancelDraft(combo.division, combo.race)"
        @delete-row="deleteRow(combo.division, combo.race, $event)"
        @start-race="handleStartRace"
        @show-result="showResult(combo.division, combo.race)"
      />

      <div v-if="!visibleDivisionRaceCombos.length" class="text-center text-muted py-5">
        Belum ada konfigurasi divisi/race untuk event ini.
      </div>

      <!-- Peringatan: H2H butuh minimal 3 tim terdaftar sebelum di-start -->
      <b-alert
        :show="showH2HMinTeamsWarning"
        variant="danger"
        class="mt-4 mb-0 d-flex align-items-center"
      >
        <Icon icon="mdi:alert-octagon-outline" width="20" height="20" class="mr-2" />
        <span>
          Minimal <strong>3 tim</strong> harus ter-assign di tabel Registered
          Teams – HEAD2HEAD Category sebelum memulai race. Saat ini baru
          <strong>{{ totalRegisteredTeamsForActiveCategory }} tim</strong>
          terdaftar.
        </span>
      </b-alert>

      <div class="d-flex align-items-center justify-content-end mt-5 mb-2">
        <b-button
          variant="primary"
          class="btn-add"
          @click="handleStartRaceAll()"
        >
          <Icon icon="mdi:flag-variant" class="mr-2" />
          START {{ this.raceActive.selected.name }} RACE
        </b-button>
      </div>
    </b-container>

    <race-settings-modal
      v-model="showRaceSettings"
      :settings="raceSettings"
      :max-gate="MAX_GATE"
      :max-section="MAX_SECTION"
      :event-id="eventId"
      :event-name="safeEventName"
      @update-settings="onUpdateRaceSettings"
    />

    <judge-settings-modal
      v-model="showJudgeSettings"
      :id="'judge-settings-modal'"
      :settings="judgeSettings"
      :event-id="eventId"
      :event-name="safeEventName"
      @update-judges="onUpdateJudgeSettings"
    />

    <event-settings-modal
      v-model="showEventSettings"
      :id="'event-settings-modal'"
      :event-id="eventId"
      :event-name="safeEventName"
      :saving="settingsLoading.active"
      @update-settings="handleUpdateSettings"
    />


    <!-- MODAL: konfirmasi Reset Data -->
    <b-modal
      v-model="showResetDataModal"
      title="Reset Data Event"
      centered
      no-close-on-backdrop
      :no-close-on-esc="resetInProgress"
      hide-footer
      @hidden="onResetModalHidden"
    >
      <p class="mb-2">
        Tindakan ini akan <strong>menghapus semua hasil & data kompetisi</strong>
        (Sprint, Head to Head, Slalom, DRR, Rafting Cross) pada event
        <strong>{{ events.eventName || "-" }}</strong> ini — termasuk waktu,
        penalti, bracket, dan Heat yang sudah tersimpan.
      </p>
      <p class="mb-2">
        <strong>Registered Teams di SEMUA kategori</strong> (assignment tim
        ke divisi/race/initial) juga ikut dikosongkan — tim harus di-assign
        ulang dari awal. Profil tim itu sendiri (nama, bib, dsb.) tidak ikut
        terhapus dan tetap tersedia untuk didaftarkan lagi.
      </p>
      <p class="mb-3">
        Pengaturan event (Race/Judges/Event Settings)
        <strong>tidak</strong> ikut terhapus. Tindakan ini
        <strong>tidak dapat dibatalkan</strong>.
      </p>

      <b-form-group v-if="!resetInProgress">
        <label class="small text-muted mb-1">
          Ketik <strong>MAKOPLANET</strong> untuk konfirmasi:
        </label>
        <b-form-input
          v-model="resetConfirmText"
          placeholder="MAKOPLANET"
          autocomplete="off"
          @keyup.enter="confirmResetData"
        />
      </b-form-group>

      <div v-else class="mb-3">
        <b-progress
          :value="resetProgressPercent"
          :max="100"
          show-progress
          animated
          variant="danger"
          class="mb-2"
        />
        <div class="small text-muted">
          {{ resetProgressLabel }} — {{ resetProgressPercent }}%
        </div>
      </div>

      <div class="d-flex justify-content-end" style="gap: 8px">
        <b-button
          variant="outline-secondary"
          :disabled="resetInProgress"
          @click="showResetDataModal = false"
        >
          Batal
        </b-button>
        <b-button
          variant="danger"
          :disabled="resetConfirmText !== RESET_CONFIRM_PHRASE || resetInProgress"
          @click="confirmResetData"
        >
          <b-spinner small v-if="resetInProgress" class="mr-1" />
          {{ resetInProgress ? "Mereset..." : "Reset Data" }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
const LEVEL_SCOPE_MAP = {
  A: ["negara"],
  B: ["negara", "wilayah"],
  C: ["negara", "club"],
  D: ["pengprov"],
  E: ["pengprov"],
  F: ["pengprov", "pengcab", "club"],
  G: ["pengcab"],
  H: ["pengcab", "club"],
  I: ["club"],
};

// ===== Cloudinary config (ISI sesuai punyamu) =====
var FOLDER_EVENT_LOGO = "sustainable-js/event-logo";
var FOLDER_EVENT_SPONSOR = "sustainable-js/event-sponsorship";
var FOLDER_COMMITTEE_SIGNATURE = "sustainable-js/committee-signature";
var FOLDER_EVENT_POSTER = "sustainable-js/event-poster";

import { uploadOne as _uploadOne, uploadMany as _uploadMany } from "@/utils/cloudinaryUpload";
import sprintPng from "@/assets/images/Rectangle-3.png";
import slalomPng from "@/assets/images/Rectangle-4-1.png";
import drrPng from "@/assets/images/Rectangle-4-2.png";
import h2hPng from "@/assets/images/Rectangle-4.png";
import rxPng from "@/assets/images/Rectangle-5.png";
import { ipcRenderer } from "electron";
import { clearAllForEvent } from "@/utils/localStoreSprint";
import TeamPanel from "@/components/race/TeamPanel.vue";
import RaceSettingsModal from "@/components/race/RaceSettings.vue";
import JudgeSettingsModal from "@/components/race/JudgesSettings.vue";
import EventSettingsModal from "@/components/race/EventSettings.vue";
import defaultImg from "@/assets/images/default-second.jpeg";

import { logger } from "@/utils/logger";

export default {
  name: "SustainableTimingSystemRaftingDetails",
  components: {
    TeamPanel,
    RaceSettingsModal,
    JudgeSettingsModal,
    EventSettingsModal,
  },
  data() {
    return {
      settingsLoading: { active: false, stage: "", percent: 0 },
      defaultImg,
      resultAvailMap: {
        R4_MEN: false,
        R4_WOMEN: false,
        R6_MEN: false,
        R6_WOMEN: false,
      },
      // per-panel (div_race) token, bukan satu field bersama — supaya refresh
      // beberapa panel yang berjalan bersamaan tidak saling menimpa token guard
      lastTokenByPanel: {},
      // per-panel: Set berisi teamId/bib tim yang SUDAH punya hasil
      // tersimpan (rankedByCats/scored terisi) utk kategori race yang
      // sedang aktif (raceActive.selected.name) — dipakai buat flag
      // "sudah bertanding" / "belum bertanding" di daftar Registered Teams.
      competedTeamsByPanel: {},
      lastResultsTokenByPanel: {},
      loadingByPanel: {
        R4_MEN: false,
        R4_WOMEN: false,
        R6_MEN: false,
        R6_WOMEN: false,
      },
      showRaceSettings: false,
      showEventSettings: false,
      showResetDataModal: false,
      resetConfirmText: "",
      resetInProgress: false,
      resetProgressPercent: 0,
      resetProgressLabel: "",
      RESET_CONFIRM_PHRASE: "MAKOPLANET",
      MAX_GATE: 14,
      MAX_SECTION: 6,
      raceSettings: {
        h2h: { R1: true, R2: true, L1: true, L2: true },
        slalom: { totalGate: 14 },
        drr: { totalSection: 5 },
        rx: {
          teamsPerHeat: 4,
          qualifiersPerHeat: 2,
          gate1: { enabled: true },
          gate2: { enabled: true },
        },
      },
      showJudgeSettings: false,
      judgeSettings: {
        // ← nilai awal (boleh kosong; modal akan merge default)
        h2h: { R1: true, R2: true, L1: true, L2: true },
        slalom: { totalGate: 14 },
        drr: { totalSection: 5 },
        rx: {
          teamsPerHeat: 4,
          qualifiersPerHeat: 2,
          gate1: { enabled: true },
          gate2: { enabled: true },
        },
      },
      // kategori UI
      // Satu-satunya sumber kebenaran utk tiap Race Category: key (dipakai
      // sbg identity, cocok dgn nilai yg tersimpan di DB), plus rute race
      // (live-timing) & result-nya masing-masing. Menambah kategori baru
      // cukup menambah satu entry di sini — tidak perlu sentuh pathMap lain.
      raceCategories: [
        {
          key: "SPRINT",
          title: "Sprint",
          icon: sprintPng,
          desc: "Short-distance race against the clock  on grade II-III rapids",
          racePath: "sprint-race",
          resultPath: "sprint-result",
        },
        {
          key: "HEAD2HEAD",
          title: "Head to Head",
          icon: h2hPng,
          desc: "Direct competition between two teams  on parallel courses",
          racePath: "head2head-race",
          resultPath: "headtohead-result",
        },
        {
          key: "SLALOM",
          title: "Slalom",
          icon: slalomPng,
          desc: "Technical course navigation through  gates on whitewater",
          racePath: "slalom-race",
          resultPath: "slalom-result",
        },
        {
          key: "DRR",
          title: "Down River",
          icon: drrPng,
          desc: "Long-distance endurance race through  varied river conditions",
          racePath: "drr-race",
          resultPath: "drr-result",
        },
        {
          key: "RX",
          title: "Rafting Cross",
          icon: rxPng,
          desc: "Multi-team knockout heats racing side-by-side  through gates to qualify",
          racePath: "rx-race",
          resultPath: "rx-result",
        },
      ],

      // Satu-satunya sumber kebenaran utk kombinasi Division x Race yang
      // tersedia (dulu 4 blok <team-panel> di template masing-masing
      // hardcode 'R4'/'MEN' dkk berulang di ~8 tempat — menambah kombinasi
      // baru berarti copy-paste seluruh blok). panelKey harus tetap format
      // "DIVISI_RACE" karena dipakai sbg key di draftMap/loadingByPanel.
      DIVISION_RACE_COMBOS: [
        { panelKey: "R4_MEN", division: "R4", race: "MEN", title: "Team R4 Men's" },
        { panelKey: "R4_WOMEN", division: "R4", race: "WOMEN", title: "Team R4 Women's" },
        { panelKey: "R6_MEN", division: "R6", race: "MEN", title: "Team R6 Men's" },
        { panelKey: "R6_WOMEN", division: "R6", race: "WOMEN", title: "Team R6 Women's" },
      ],

      // state
      raceActive: { selected: { name: "SPRINT" } },
      // name kosong (bukan placeholder) supaya guard "belum ada yang dipilih"
      // di created() (!initialActive.selected.name) benar-benar bisa true dan
      // auto-select initial category pertama berjalan seperti seharusnya.
      initialActive: { selected: { name: "" } },

      // data
      events: {}, // { categoriesDivision, categoriesRace, categoriesInitial, participant: [...] }
      dataTeams: [], // alias events.participant
      availableTeams: [], // sumber dropdown (opsional dari IPC)
      // draft baris input per kombinasi
      draftMap: { R4_MEN: null, R4_WOMEN: null, R6_MEN: null, R6_WOMEN: null },
    };
  },
  computed: {
    eventId() {
      let id = this.events && this.events._id;
      if (!id) {
        id = this.$route.params.id;
      }
      return typeof id === "string" ? id : "";
    },

    safeEventName() {
      return this.events && this.events.eventName ? this.events.eventName : "";
    },

    // hanya tampilkan kartu kategori yang aktif di categoriesEvent event ini
    availableRaceCategories() {
      const enabled = Array.isArray(this.events && this.events.categoriesEvent)
        ? this.events.categoriesEvent
        : [];
      const enabledKeys = new Set(
        enabled.map((e) => String((e && e.name) || "").toUpperCase())
      );
      if (!enabledKeys.size) return this.raceCategories;
      return this.raceCategories.filter((c) => enabledKeys.has(c.key));
    },
    // Kombinasi Division/Race yang aktif utk event ini (dari
    // DIVISION_RACE_COMBOS, difilter oleh showPanel) — satu-satunya sumber
    // dipakai template utk me-render panel tim secara dinamis (v-for),
    // menggantikan 4 blok <team-panel> yang dulu di-hardcode manual.
    visibleDivisionRaceCombos() {
      return this.DIVISION_RACE_COMBOS.filter((c) =>
        this.showPanel(c.division, c.race)
      );
    },
    // Total tim yang sudah ter-assign di SEMUA panel Registered Teams utk
    // kategori (raceActive) yang sedang aktif — dijumlah lintas kombinasi
    // divisi/race yang tampil, bukan cuma satu panel.
    totalRegisteredTeamsForActiveCategory() {
      const evName = this.raceActive.selected.name;
      return (this.visibleDivisionRaceCombos || []).reduce((sum, combo) => {
        return sum + this.getTeamsBy(combo.division, combo.race, evName).length;
      }, 0);
    },
    // Peringatan merah: H2H butuh minimal 3 tim terdaftar sebelum operator
    // klik "START HEAD2HEAD RACE" (bracket 1v1 tidak masuk akal dgn <3 tim).
    showH2HMinTeamsWarning() {
      return (
        String(this.raceActive.selected.name).toUpperCase() === "HEAD2HEAD" &&
        this.totalRegisteredTeamsForActiveCategory < 3
      );
    },
    hasEventLogo() {
      var ev = this.events || {};
      var logos = ev.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        // string URL langsung atau objek { url: '...' }
        var first = logos[0];
        if (typeof first === "string" && first) return true;
        if (
          first &&
          typeof first === "object" &&
          typeof first.url === "string" &&
          first.url
        )
          return true;
      }
      return false;
    },
    eventLogoUrl() {
      var ev = this.events || {};
      var logos = ev.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        var first = logos[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && typeof first.url === "string")
          return first.url;
      }
      return "";
    },
  },

  async created() {
    const idFromRoute = this.$route.params.id;
    await this.loadEvent(idFromRoute);
    await this.loadAvailableTeams("C - D");
    if (
      (this.events.categoriesInitial || []).length &&
      !this.initialActive.selected.name
    ) {
      this.initialActive.selected = this.events.categoriesInitial[0];
    }
    this._ensureValidRaceSelection();
    await this.$nextTick();
    this.refreshVisibleBuckets();
  },

  methods: {
    _setLoading: function (on, stage, pct) {
      this.settingsLoading.active = !!on;
      if (typeof stage === "string") this.settingsLoading.stage = stage;
      if (typeof pct === "number")
        this.settingsLoading.percent = Math.max(
          0,
          Math.min(100, Math.round(pct))
        );
    },

    handleUpdateSettings: async function (payload) {
      // === 0) Ambil & normalisasi dari payload ===
      var eventId = "";
      var eventName = "";
      var signature = {};
      var evFiles = [];
      var spFiles = [];

      if (payload && payload.eventId) eventId = String(payload.eventId);
      if (payload && payload.eventName) eventName = String(payload.eventName);

      if (
        payload &&
        payload.signature &&
        typeof payload.signature === "object"
      ) {
        signature = payload.signature;
      }

      if (
        payload &&
        payload.eventFiles &&
        typeof payload.eventFiles.length === "number"
      ) {
        evFiles = payload.eventFiles;
      }
      if (
        payload &&
        payload.sponsorFiles &&
        typeof payload.sponsorFiles.length === "number"
      ) {
        spFiles = payload.sponsorFiles;
      }

      var safePayload = {
        eventId: eventId,
        eventName: eventName,
        signature: {
          technicalDelegate:
            signature && signature.technicalDelegate === true ? true : false,
          chiefJudge: signature && signature.chiefJudge === true ? true : false,
          raceDirector:
            signature && signature.raceDirector === true ? true : false,
        },
        eventFiles: [],
        sponsorFiles: [],
        levelName: payload && payload.levelName ? String(payload.levelName) : "",
        riverName: payload && payload.riverName ? String(payload.riverName) : "",
        addressDistrict:
          payload && payload.addressDistrict ? String(payload.addressDistrict) : "",
        addressSubDistrict:
          payload && payload.addressSubDistrict
            ? String(payload.addressSubDistrict)
            : "",
        addressVillage:
          payload && payload.addressVillage ? String(payload.addressVillage) : "",
        addressCity:
          payload && payload.addressCity ? String(payload.addressCity) : "",
        addressProvince:
          payload && payload.addressProvince ? String(payload.addressProvince) : "",
        addressZipCode:
          payload && payload.addressZipCode ? String(payload.addressZipCode) : "",
        addressState:
          payload && payload.addressState ? String(payload.addressState) : "",
        startDateEvent:
          payload && payload.startDateEvent ? String(payload.startDateEvent) : "",
        endDateEvent:
          payload && payload.endDateEvent ? String(payload.endDateEvent) : "",
        categoriesEvent:
          payload && Array.isArray(payload.categoriesEvent)
            ? payload.categoriesEvent
            : [],
        categoriesDivision:
          payload && Array.isArray(payload.categoriesDivision)
            ? payload.categoriesDivision
            : [],
        categoriesRace:
          payload && Array.isArray(payload.categoriesRace)
            ? payload.categoriesRace
            : [],
        categoriesInitial:
          payload && Array.isArray(payload.categoriesInitial)
            ? payload.categoriesInitial
            : [],
        technicalDelegate:
          payload && payload.technicalDelegate
            ? String(payload.technicalDelegate)
            : "",
        chiefJudge:
          payload && payload.chiefJudge ? String(payload.chiefJudge) : "",
        raceDirector:
          payload && payload.raceDirector ? String(payload.raceDirector) : "",
      };

      // preview sederhana ke console
      logger.info(
        "READY PAYLOAD:\n" +
          JSON.stringify(
            {
              eventId: safePayload.eventId,
              eventName: safePayload.eventName,
              signature: safePayload.signature,
              eventFilesCount: evFiles.length,
              sponsorFilesCount: spFiles.length,
            },
            null,
            2
          )
      );

      if (!eventId) {
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "Update gagal",
          detail: "eventId kosong",
        });
        return;
      }

      try {
        // === 1) UPDATE DB BASIC ===
        this._setLoading(true, "Menyimpan data dasar…", 10);

        var basicDoc = {
          _id: eventId,
          eventName: eventName,
          signature: safePayload.signature,
          levelName: safePayload.levelName,
          riverName: safePayload.riverName,
          addressDistrict: safePayload.addressDistrict,
          addressSubDistrict: safePayload.addressSubDistrict,
          addressVillage: safePayload.addressVillage,
          addressCity: safePayload.addressCity,
          addressProvince: safePayload.addressProvince,
          addressZipCode: safePayload.addressZipCode,
          addressState: safePayload.addressState,
          startDateEvent: safePayload.startDateEvent,
          endDateEvent: safePayload.endDateEvent,
          categoriesEvent: safePayload.categoriesEvent,
          categoriesDivision: safePayload.categoriesDivision,
          categoriesRace: safePayload.categoriesRace,
          categoriesInitial: safePayload.categoriesInitial,
          technicalDelegate: safePayload.technicalDelegate,
          chiefJudge: safePayload.chiefJudge,
          raceDirector: safePayload.raceDirector,
        };
        ipcRenderer.send("services:update:event-basic", basicDoc);

        var step1 = await new Promise(function (resolve) {
          ipcRenderer.once(
            "services:update:event-basic:reply",
            function (_e, resp) {
              resolve(resp);
            }
          );
        });

        var ok1 = step1 && step1.ok === true;
        if (!ok1) {
          var d1 = step1 && step1.error ? step1.error : "unknown-error";
          this._setLoading(false, "", 0);
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "DB Update (basic) gagal",
            detail: d1,
          });
          return;
        }

        // // === 2) UPLOAD EVENT FILES (Cloudinary) ===
        // this._setLoading(true, "Mengunggah logo event…", 40);
        // var eventUrls = await _uploadManyToUrlsPreferBridge(
        //   evFiles,
        //   FOLDER_EVENT_LOGO
        // );

        // // === 3) UPLOAD SPONSOR FILES (Cloudinary) ===
        // this._setLoading(true, "Mengunggah logo sponsor…", 70);
        // var sponsorUrls = await _uploadManyToUrlsPreferBridge(
        //   spFiles,
        //   FOLDER_EVENT_SPONSOR
        // );

        // // === 4) UPDATE DB ASSETS (hasil upload) ===
        // this._setLoading(true, "Memperbarui aset di database…", 85);

        // var assetsDoc = { _id: eventId };
        // if (eventUrls && eventUrls.length > 0) {
        //   assetsDoc.eventFiles = eventUrls; // array of string URL
        // }
        // if (sponsorUrls && sponsorUrls.length > 0) {
        //   assetsDoc.sponsorFiles = sponsorUrls; // atau sponsorshipFiles, sesuaikan schema
        // }

        // console.log("ASSETS DOC TO SAVE:", assetsDoc);
        // ipcRenderer.send("services:update:event-assets", assetsDoc);

        // ===== 2) UPLOAD EVENT FILES =====
        this._setLoading(true, "Mengunggah logo event…", 40);
        const uploadedEvent = await _uploadMany(evFiles, FOLDER_EVENT_LOGO);

        // ===== 3) UPLOAD SPONSOR FILES =====
        this._setLoading(true, "Mengunggah logo sponsor…", 70);
        const uploadedSponsor = await _uploadMany(
          spFiles,
          FOLDER_EVENT_SPONSOR
        );

        // Kumpulkan URL baru
        const newEventUrls = (uploadedEvent || [])
          .map((u) => u.secure_url || u.url)
          .filter(Boolean);
        const newSponsorUrls = (uploadedSponsor || [])
          .map((u) => u.secure_url || u.url)
          .filter(Boolean);

        // Ambil URL lama yang masih dipertahankan dari payload (dari modal)
        const keepEventUrls = Array.isArray(payload.keepEventUrls)
          ? payload.keepEventUrls
          : [];
        const keepSponsorUrls = Array.isArray(payload.keepSponsorUrls)
          ? payload.keepSponsorUrls
          : [];

        // FINAL: gabungan lama + baru (unik)
        const finalEventUrls = Array.from(
          new Set([...keepEventUrls, ...newEventUrls])
        );
        const finalSponsorUrls = Array.from(
          new Set([...keepSponsorUrls, ...newSponsorUrls])
        );

        // ===== 3.5) UPLOAD SIGNATURE COMITTE (opsional, PNG tunggal per role) =====
        this._setLoading(true, "Mengunggah signature komite…", 80);
        const newTdSignature = payload.technicalDelegateSignatureFile
          ? await _uploadOne(
              payload.technicalDelegateSignatureFile,
              FOLDER_COMMITTEE_SIGNATURE
            )
          : null;
        const newCjSignature = payload.chiefJudgeSignatureFile
          ? await _uploadOne(
              payload.chiefJudgeSignatureFile,
              FOLDER_COMMITTEE_SIGNATURE
            )
          : null;
        const newRdSignature = payload.raceDirectorSignatureFile
          ? await _uploadOne(
              payload.raceDirectorSignatureFile,
              FOLDER_COMMITTEE_SIGNATURE
            )
          : null;

        // ===== 3.6) UPLOAD POSTER EVENT (opsional, gambar tunggal) =====
        const newPoster = payload.posterFile
          ? await _uploadOne(payload.posterFile, FOLDER_EVENT_POSTER)
          : null;

        // ===== 4) UPDATE DB ASSETS (URL saja) =====
        this._setLoading(true, "Memperbarui aset di database…", 85);
        const assetsDoc = {
          _id: eventId,
          eventFiles: finalEventUrls,
          sponsorFiles: finalSponsorUrls,
        };

        // signature baru diupload → pakai itu; kalau tidak, dan user minta
        // hapus signature lama → set null; kalau tidak dua-duanya, jangan
        // dikirim sama sekali supaya nilai lama di DB tidak tersentuh
        if (newTdSignature && newTdSignature.ok) {
          assetsDoc.technicalDelegateSignature = newTdSignature.result;
        } else if (payload.removeTechnicalDelegateSignature) {
          assetsDoc.technicalDelegateSignature = null;
        }
        if (newCjSignature && newCjSignature.ok) {
          assetsDoc.chiefJudgeSignature = newCjSignature.result;
        } else if (payload.removeChiefJudgeSignature) {
          assetsDoc.chiefJudgeSignature = null;
        }
        if (newRdSignature && newRdSignature.ok) {
          assetsDoc.raceDirectorSignature = newRdSignature.result;
        } else if (payload.removeRaceDirectorSignature) {
          assetsDoc.raceDirectorSignature = null;
        }

        if (newPoster && newPoster.ok) {
          assetsDoc.poster = newPoster.result;
        } else if (payload.removePoster) {
          assetsDoc.poster = null;
        }

        ipcRenderer.send("services:update:event-assets", assetsDoc);

        var step2 = await new Promise(function (resolve) {
          ipcRenderer.once(
            "services:update:event-assets:reply",
            function (_e, resp) {
              resolve(resp);
            }
          );
        });

        var ok2 = step2 && step2.ok === true;
        if (!ok2) {
          var d2 = step2 && step2.error ? step2.error : "unknown-error";
          this._setLoading(false, "", 0);
          ipcRenderer.send("get-alert", {
            type: "warning",
            message: "Upload sukses, tapi update DB assets gagal",
            detail: d2,
          });
          return;
        }

        // === DONE ===
        this._setLoading(true, "Memuat ulang data event…", 95);
        await this.loadEvent(eventId);
        this._ensureValidRaceSelection();
        this._ensureValidInitialSelection();

        this._setLoading(true, "Selesai ✔", 100);
        ipcRenderer.send("get-alert-saved", {
          type: "info",
          message: "Event updated",
          detail: "Signature & files berhasil disimpan",
        });
      } catch (err) {
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "Unexpected error",
          detail: err && err.message ? err.message : String(err),
        });
      } finally {
        var self = this;
        setTimeout(function () {
          self._setLoading(false, "", 0);
        }, 600);
      }
    },
    /* =========================================================
     * UI ACTIONS
     * =======================================================*/
    openEventSettings() {
      this.showEventSettings = true;
    },

    openRaceSettings() {
      this.showRaceSettings = true;
    },

    openJudgeSettings() {
      this.showJudgeSettings = true;
    },

    openResetDataModal() {
      this.resetConfirmText = "";
      this.showResetDataModal = true;
    },

    onResetModalHidden() {
      if (!this.resetInProgress) this.resetConfirmText = "";
    },

    // Bersihkan cache localStorage per-event punya Sprint (`sprintLocal:`)
    // & H2H (`h2hRoundResults:`) — satu-satunya 2 kategori yang punya cache
    // hasil di localStorage renderer ini; Slalom/DRR/RX murni server-side.
    _clearLocalCachesForEvent(eventId) {
      try {
        clearAllForEvent(eventId);
      } catch (e) {
        /* noop */
      }
      try {
        const prefix = "h2hRoundResults:" + String(eventId) + "|";
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.indexOf(prefix) === 0) toRemove.push(key);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        /* noop */
      }
    },

    // ambil daftar koleksi yang akan dihapus dari backend (1 sumber
    // kebenaran, sinkron dengan RESET_COLLECTIONS di resetEventData.js)
    // supaya progress bar tahu berapa total step & label tiap step.
    _fetchResetCollectionsList() {
      return new Promise((resolve) => {
        ipcRenderer.once("event:reset-data:collections-reply", (_e, list) =>
          resolve(Array.isArray(list) ? list : [])
        );
        ipcRenderer.send("event:reset-data:collections");
      });
    },

    _resetOneCollection(eventId, collection) {
      return new Promise((resolve) => {
        ipcRenderer.once("event:reset-data:step-reply", (_e, r) => resolve(r));
        ipcRenderer.send("event:reset-data:step", { eventId, collection });
      });
    },

    async confirmResetData() {
      if (this.resetConfirmText !== this.RESET_CONFIRM_PHRASE) return;
      const eventId = this.eventId || this.$route.params.id || "";
      if (!eventId) return;

      this.resetInProgress = true;
      this.resetProgressPercent = 0;
      this.resetProgressLabel = "Menyiapkan...";
      try {
        const collections = await this._fetchResetCollectionsList();
        const total = collections.length || 1;

        for (let i = 0; i < collections.length; i++) {
          const { name, label } = collections[i];
          this.resetProgressLabel = `Menghapus ${label}... (${i + 1}/${
            collections.length
          })`;
          const r = await this._resetOneCollection(eventId, name);
          if (!r || !r.ok) {
            throw new Error(
              (r && r.error) || `Gagal menghapus koleksi ${name}`
            );
          }
          this.resetProgressPercent = Math.round(((i + 1) / total) * 100);
        }

        this.resetProgressLabel = "Membersihkan cache lokal...";
        this._clearLocalCachesForEvent(eventId);
        this.competedTeamsByPanel = {};
        this.resultAvailMap = {
          R4_MEN: false,
          R4_WOMEN: false,
          R6_MEN: false,
          R6_WOMEN: false,
        };
        this.resetProgressPercent = 100;

        this.showResetDataModal = false;
        ipcRenderer.send("get-alert-saved", {
          type: "info",
          message: "Reset Data berhasil",
          detail: "Semua hasil kompetisi event ini sudah dikosongkan.",
        });
        await this.refreshVisibleBuckets();
      } catch (err) {
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "Reset Data gagal",
          detail: err && err.message ? err.message : String(err),
        });
      } finally {
        this.resetInProgress = false;
        this.resetProgressPercent = 0;
        this.resetProgressLabel = "";
      }
    },

    onUpdateRaceSettings(payload) {
      // RaceSettingsModal sudah menyimpan (upsert) sendiri dan baru meng-emit
      // event ini SETELAH balasan sukses diterima — jadi di sini cukup
      // sinkronkan state lokal, tidak perlu kirim ulang race-settings:upsert
      // (kalau dikirim lagi, jadinya double-write ke DB untuk data yang sama).
      if (payload && payload.settings) this.raceSettings = payload.settings;
    },

    onUpdateJudgeSettings(payload) {
      logger.info("✅ Data payload:", payload);
    },

    async selectCategory(c) {
      this.raceActive.selected = { name: c.key };
      await this.refreshVisibleBuckets();
    },

    // pastikan kategori yang sedang aktif masih ada di availableRaceCategories;
    // kalau tidak (mis. dihapus dari categoriesEvent lewat Event Settings), pindah ke yang pertama tersedia
    _ensureValidRaceSelection() {
      const list = this.availableRaceCategories;
      if (!list.length) return;
      const current = this._safeSelectedName(this.raceActive).toUpperCase();
      const stillValid = list.some((c) => c.key === current);
      if (!stillValid) {
        this.raceActive.selected = { name: list[0].key };
      }
    },

    async selectInitial(i) {
      this.initialActive.selected = i;
      await this.refreshVisibleBuckets();
    },

    // pastikan initial category yang sedang aktif masih ada di categoriesInitial;
    // kalau tidak (mis. dihapus/diubah lewat Event Settings), pindah ke yang pertama tersedia
    _ensureValidInitialSelection() {
      const list = this.events.categoriesInitial || [];
      if (!list.length) return;
      const current = (
        (this.initialActive.selected && this.initialActive.selected.name) ||
        ""
      ).toUpperCase();
      const stillValid = list.some(
        (i) => String(i.name).toUpperCase() === current
      );
      if (!stillValid) {
        this.initialActive.selected = list[0];
      }
    },

    /* =========================================================
     * HELPERS: string/id normalizers, safe getters
     * =======================================================*/
    _safeSelectedName(obj) {
      return obj && obj.selected && obj.selected.name
        ? String(obj.selected.name)
        : "";
    },

    _matchId(list, name) {
      const n = String(name || "").toUpperCase();
      const f = (list || []).find((x) => String(x.name).toUpperCase() === n);
      return f ? String(f.value) : "";
    },

    _idToString(raw) {
      if (typeof raw === "string") return raw;
      if (raw && typeof raw.$oid === "string") return raw.$oid; // { $oid: "..." }
      if (raw && raw._bsontype === "ObjectID") {
        if (typeof raw.toHexString === "function") return raw.toHexString();
        if (raw.id)
          return Array.from(raw.id)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
      }
      return "";
    },

    _toUpperSafe(v) {
      return String(v || "").toUpperCase();
    },

    // Cari definisi Race Category by key (SPRINT/HEAD2HEAD/SLALOM/DRR/RX).
    // NB: field ini di banyak tempat lain (identity, DB) disebut "eventName"
    // — penamaan lama yang sebenarnya berarti Race Category, bukan judul
    // event. Di sini sengaja dipakai nama yang jelas (raceCategoryKey).
    _findRaceCategory(raceCategoryKey) {
      const k = this._toUpperSafe(raceCategoryKey);
      return this.raceCategories.find((c) => c.key === k) || null;
    },

    _mapRaceToPath(raceCategoryKey) {
      const cat = this._findRaceCategory(raceCategoryKey);
      return cat ? cat.racePath : this._toUpperSafe(raceCategoryKey).toLowerCase();
    },

    /* =========================================================
     * IDENTITY BUILDERS (event/initial/division/race)
     * =======================================================*/
    _buildIdentity(div, race) {
      return this._buildIdentityForCategory(
        div,
        race,
        this._safeSelectedName(this.raceActive)
      );
    },

    // Sama seperti _buildIdentity, tapi eventName (race category) bisa
    // ditentukan eksplisit — dipakai autoFillFromPreviousCategory() utk
    // membangun identity kategori SEBELUMNYA (bukan yang sedang aktif).
    _buildIdentityForCategory(div, race, categoryName) {
      const eventId = this.eventId || this.$route.params.id || "";
      const initialName = this._safeSelectedName(this.initialActive);

      return {
        eventId,
        initialId: this._matchId(this.events.categoriesInitial, initialName),
        raceId: this._matchId(this.events.categoriesRace, race),
        divisionId: this._matchId(this.events.categoriesDivision, div),
        eventName: String(categoryName || "").toUpperCase(),
        initialName: String(initialName).toUpperCase(),
        raceName: String(race).toUpperCase(),
        divisionName: String(div).toUpperCase(),
      };
    },

    deleteRow(div, race, row) {
      const evName = this.raceActive.selected.name;
      const init =
        (this.initialActive.selected && this.initialActive.selected.name) || "";

      // 1) Hapus dari state lokal
      const bucket = this._getBucket(evName, div, race, init);
      if (!bucket) return;
      bucket.teams = (bucket.teams || []).filter(
        (t) =>
          String(t.bibTeam).trim() !== String(row.bibTeam).trim() ||
          String(t.nameTeam).trim().toUpperCase() !==
            String(row.nameTeam).trim().toUpperCase()
      );
      this.dataTeams = this.dataTeams.slice();

      // 2) Hapus di DB
      ipcRenderer.send("delete-team-in-bucket", {
        identity: {
          eventId: bucket.eventId,
          initialId: bucket.initialId,
          raceId: bucket.raceId,
          divisionId: bucket.divisionId,
          eventName: bucket.eventName,
          initialName: bucket.initialName,
          raceName: bucket.raceName,
          divisionName: bucket.divisionName,
        },
        team: {
          nameTeam: row.nameTeam,
          bibTeam: row.bibTeam,
        },
      });

      ipcRenderer.once("delete-team-in-bucket-reply", (_e, res) => {
        if (res && res.ok) {
          // optional toast
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            detail: (res && res.error) || "Gagal menghapus team di database.",
            message: "Failed",
          });
          // rollback: DB gagal hapus tapi state lokal sudah terlanjur
          // dihilangkan → resync panel ini dari DB supaya UI tidak "bohong"
          this.loadTeamsRegistered(div, race);
        }
      });
    },

    goToEventOverallResult() {
      this.$router.push(
        `/event-detail/${this.$route.params.id}/event-overall-result`
      );
    },

    // Handler "Show Result" — dinamis berdasar 3 parameter yg lagi aktif:
    // Race Category (raceActive), Initials Category (initialActive), dan
    // Division/Race dari tabel yang diklik (div, race datang dari panel
    // yang memicu event ini). Kombinasi ketiganya di-resolve jadi satu
    // identity (_buildIdentity) lalu diarahkan ke halaman Result yang
    // sesuai utk Race Category tsb (raceCategories[].resultPath).
    showResult(div, race) {
      const idt = this._buildIdentity(div, race);
      if (!idt.eventId || !idt.initialId || !idt.raceId || !idt.divisionId) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Data belum lengkap",
          detail: "Pilih Initials Category / kategori yang valid.",
        });
        return;
      }

      const cat = this._findRaceCategory(idt.eventName);
      if (!cat || !cat.resultPath) {
        // dulu ini diam-diam nyasar ke path kosong (halaman event) — sekarang
        // ditolak eksplisit dgn pesan yg jelas
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "Race Category tidak dikenali",
          detail: `Belum ada halaman Result untuk kategori "${idt.eventName}".`,
        });
        return;
      }

      this.$router.push({
        path: `/event-detail/${this.$route.params.id}/${cat.resultPath}`,
        query: {
          eventId: idt.eventId,
          initialId: idt.initialId,
          raceId: idt.raceId,
          divisionId: idt.divisionId,
          eventName: idt.eventName,
          initialName: idt.initialName,
          raceName: idt.raceName,
          divisionName: idt.divisionName,
        },
      });
    },

    /* =========================================================
     * BUCKET READ/WRITE (dataTeams) + VISIBILITY
     * =======================================================*/
    _clearBucketInState(identity) {
      const ev = String(identity.eventName).toUpperCase();
      const ini = String(identity.initialName).toUpperCase();
      const rac = String(identity.raceName).toUpperCase();
      const div = String(identity.divisionName).toUpperCase();

      this.dataTeams = (this.dataTeams || []).filter(
        (b) =>
          !(
            String(b.eventName).toUpperCase() === ev &&
            String(b.initialName).toUpperCase() === ini &&
            String(b.raceName).toUpperCase() === rac &&
            String(b.divisionName).toUpperCase() === div
          )
      );
    },

    _mergeBucketIntoState(bucket) {
      if (!bucket) return;
      if (!Array.isArray(this.dataTeams)) this.dataTeams = [];
      const idx = this.dataTeams.findIndex(
        (b) =>
          String(b.eventName).toUpperCase() ===
            String(bucket.eventName).toUpperCase() &&
          String(b.initialName).toUpperCase() ===
            String(bucket.initialName).toUpperCase() &&
          String(b.raceName).toUpperCase() ===
            String(bucket.raceName).toUpperCase() &&
          String(b.divisionName).toUpperCase() ===
            String(bucket.divisionName).toUpperCase()
      );
      if (idx >= 0) this.$set(this.dataTeams, idx, bucket);
      else this.dataTeams.push(bucket);
    },

    hasDivision(name) {
      return (this.events.categoriesDivision || []).some(
        (d) => String(d.name).toUpperCase() === String(name).toUpperCase()
      );
    },

    hasRace(name) {
      return (this.events.categoriesRace || []).some(
        (r) => String(r.name).toUpperCase() === String(name).toUpperCase()
      );
    },

    showPanel(div, race) {
      return this.hasDivision(div) && this.hasRace(race);
    },

    async loadTeamsRegistered(div, race) {
      const identity = this._buildIdentity(div, race);

      // Jangan fetch kalau identity belum lengkap → kosongkan tabel kombinasi tsb
      if (
        !identity.eventId ||
        !identity.initialId ||
        !identity.raceId ||
        !identity.divisionId
      ) {
        this._clearBucketInState(identity);
        return { div, race, ok: false, reason: "identity-incomplete" };
      }

      // Token untuk menangkal balasan telat (race condition antar panggilan
      // berurutan utk panel yang sama)
      const token = [
        identity.eventName,
        identity.initialName,
        identity.divisionName,
        identity.raceName,
        Date.now(),
      ].join("|");
      const panelKey = div + "_" + race;
      this.lastTokenByPanel[panelKey] = token;
      this.$set(this.loadingByPanel, panelKey, true);

      // reqId untuk mencocokkan balasan ke request INI secara spesifik.
      // refreshVisibleBuckets() menembak 4 request (R4/R6 x MEN/WOMEN)
      // BERSAMAAN lewat channel IPC yang sama ("get-teams-registered-reply")
      // — pakai ipcRenderer.once() polos di sini akan salah menangkap
      // balasan milik panel lain (siapa pun yang baru pertama tiba), bukan
      // punya diri sendiri. reqId + ipcRenderer.on (bukan once) + filter
      // manual memastikan tiap request cuma memproses balasannya sendiri.
      const reqId = panelKey + "|" + token + "|" + Math.random();

      return await new Promise((resolve) => {
        let settled = false;

        const onReply = (_e, bucket) => {
          if (!bucket || bucket.__reqId !== reqId) return; // bukan balasan utk request ini
          ipcRenderer.removeListener("get-teams-registered-reply", onReply);
          if (settled) return;
          settled = true;

          if (this.lastTokenByPanel[panelKey] !== token) return resolve(); // abaikan balasan usang
          this.$set(this.loadingByPanel, panelKey, false);
          if (Array.isArray(bucket.teams)) {
            this._mergeBucketIntoState(bucket);
            resolve({ div, race, ok: true });
          } else {
            this._clearBucketInState(identity);
            resolve({ div, race, ok: false, reason: "empty" });
          }
        };

        ipcRenderer.on("get-teams-registered-reply", onReply);
        ipcRenderer.send("get-teams-registered", { ...identity, __reqId: reqId });

        // hard-timeout supaya listener tak menggantung
        setTimeout(() => {
          if (settled) return;
          settled = true;
          ipcRenderer.removeListener("get-teams-registered-reply", onReply);
          // hanya matikan loading kalau tidak ada request lebih baru untuk panel ini
          if (this.lastTokenByPanel[panelKey] === token) {
            this.$set(this.loadingByPanel, panelKey, false);
          }
          resolve({ div, race, ok: false, reason: "timeout" });
        }, 3000);
      });
    },

    // Nama kategori (raceCategories[].key, dipakai sbg raceActive.selected.name)
    // tidak selalu sama persis dengan nama yang ditulis ke
    // eventResult.categories[].name saat hasil disimpan dari masing-masing
    // halaman race (lihat konstanta K di Sprint/H2H/Slalom/DRR/RX Race.vue).
    _resultCategoryName(raceKey) {
      const map = {
        SPRINT: "SPRINT",
        HEAD2HEAD: "HEADTOHEAD",
        SLALOM: "SLALOM",
        DRR: "DRR",
        RX: "RX",
      };
      return map[String(raceKey || "").toUpperCase()] || String(raceKey || "").toUpperCase();
    },

    // Ambil daftar tim yang SUDAH punya hasil tersimpan (utk kategori race
    // aktif) pada kombinasi divisi/race ini, lalu simpan sbg Set di
    // competedTeamsByPanel[panelKey] supaya TeamPanel bisa menampilkan flag
    // "sudah/belum bertanding".
    async loadEventResultsForPanel(div, race) {
      const identity = this._buildIdentity(div, race);
      if (
        !identity.eventId ||
        !identity.initialId ||
        !identity.raceId ||
        !identity.divisionId
      ) {
        return;
      }

      const panelKey = div + "_" + race;
      const token = Date.now() + "|" + Math.random();
      this.lastResultsTokenByPanel[panelKey] = token;

      const categoryName = this._resultCategoryName(identity.eventName);
      const reqId = "results|" + panelKey + "|" + token;

      await new Promise((resolve) => {
        let settled = false;

        const onReply = (_e, res) => {
          if (!res || res.__reqId !== reqId) return;
          ipcRenderer.removeListener("event-results:get-reply", onReply);
          if (settled) return;
          settled = true;

          if (this.lastResultsTokenByPanel[panelKey] !== token) return resolve();

          const eventResult =
            res && res.ok && res.doc && Array.isArray(res.doc.eventResult)
              ? res.doc.eventResult
              : [];

          const competed = new Set();
          eventResult.forEach((entry) => {
            const cat = (entry.categories || []).find(
              (c) => String(c.name || "").toUpperCase() === categoryName
            );
            const hasResult =
              cat &&
              ((cat.rankedByCats !== "" && cat.rankedByCats != null) ||
                (cat.scored !== "" && cat.scored != null));
            if (hasResult) {
              const key = String(entry.teamId || entry.bib || "");
              if (key) competed.add(key);
            }
          });

          this.$set(this.competedTeamsByPanel, panelKey, competed);
          resolve();
        };

        ipcRenderer.on("event-results:get-reply", onReply);
        ipcRenderer.send("event-results:get", { ...identity, __reqId: reqId });

        setTimeout(() => {
          if (settled) return;
          settled = true;
          ipcRenderer.removeListener("event-results:get-reply", onReply);
          resolve();
        }, 3000);
      });
    },

    // Set tim yang sudah bertanding utk panel ini — dipakai template lewat
    // prop competed-set di <team-panel>.
    competedSetFor(panelKey) {
      return this.competedTeamsByPanel[panelKey] || new Set();
    },

    // Fetch satu kali (reqId-safe, aman dipanggil bersamaan dgn request lain
    // di channel yang sama) — dipakai autoFillFromPreviousCategory() utk
    // mengintip bucket/hasil kategori LAIN (bukan yg sedang ditampilkan di
    // panel), jadi tidak numpang di state loadingByPanel/lastTokenByPanel.
    _fetchOnce(channel, payload, reqId) {
      return new Promise((resolve) => {
        let settled = false;
        const replyChannel = channel + "-reply";
        const onReply = (_e, res) => {
          if (!res || res.__reqId !== reqId) return;
          ipcRenderer.removeListener(replyChannel, onReply);
          if (settled) return;
          settled = true;
          resolve(res);
        };
        ipcRenderer.on(replyChannel, onReply);
        ipcRenderer.send(channel, { ...payload, __reqId: reqId });
        setTimeout(() => {
          if (settled) return;
          settled = true;
          ipcRenderer.removeListener(replyChannel, onReply);
          resolve(null);
        }, 4000);
      });
    },

    // Nama kategori tepat SEBELUM `categoryName`, mengikuti urutan
    // categoriesEvent SESUAI EVENT INI (bukan urutan tetap kartu Race
    // Category) — null kalau categoryName adalah yang pertama / tidak
    // ditemukan.
    _previousCategoryName(categoryName) {
      const list = Array.isArray(this.events.categoriesEvent)
        ? this.events.categoriesEvent
        : [];
      const names = list.map((c) => String((c && c.name) || "").toUpperCase());
      const idx = names.indexOf(String(categoryName || "").toUpperCase());
      if (idx <= 0) return null;
      return names[idx - 1];
    },

    // Kalau panel (div/race) kategori yang SEDANG dibuka masih kosong,
    // otomatis isi dengan tim yang SUDAH BERTANDING (bukan cuma terdaftar)
    // di kategori sebelumnya (urutan categoriesEvent event ini) utk
    // kombinasi divisi/race/initial yang sama. Tim yang pernah dihapus
    // manual dari kategori ini (tercatat di excludedTeams) TIDAK ikut
    // ditambahkan lagi. Add Team manual tetap berjalan seperti biasa —
    // fitur ini cuma pre-fill sekali saat panel masih kosong.
    async autoFillFromPreviousCategory(div, race) {
      const currentName = this._safeSelectedName(this.raceActive);
      const prevName = this._previousCategoryName(currentName);
      if (!prevName) return;

      // Panel sekarang sudah ada isinya (baik dari DB maupun auto-fill
      // sebelumnya) -> jangan timpa/duplikasi.
      const already = this.getTeamsBy(div, race, currentName);
      if (already.length) return;

      const currentIdentity = this._buildIdentityForCategory(
        div,
        race,
        currentName
      );
      if (
        !currentIdentity.eventId ||
        !currentIdentity.initialId ||
        !currentIdentity.raceId ||
        !currentIdentity.divisionId
      ) {
        return;
      }

      const reqBase = [
        currentIdentity.eventId,
        currentIdentity.initialId,
        currentIdentity.raceId,
        currentIdentity.divisionId,
        div,
        race,
        Date.now(),
        Math.random(),
      ].join("|");

      // ambil bucket kategori ini sendiri -> cek excludedTeams (tombstone
      // penghapusan manual)
      const currentDocRes = await this._fetchOnce(
        "get-teams-registered",
        currentIdentity,
        "autofill-cur|" + reqBase
      );
      const currentDoc = currentDocRes || {};
      const excluded = new Set(
        (Array.isArray(currentDoc.excludedTeams)
          ? currentDoc.excludedTeams
          : []
        ).map(
          (t) =>
            String((t && t.nameTeam) || "").toUpperCase() +
            "|" +
            String((t && t.bibTeam) || "")
        )
      );

      // ambil roster kategori SEBELUMNYA utk kombinasi yang sama
      const prevIdentity = this._buildIdentityForCategory(div, race, prevName);
      const prevDocRes = await this._fetchOnce(
        "get-teams-registered",
        prevIdentity,
        "autofill-prev|" + reqBase
      );
      const prevTeams =
        prevDocRes && Array.isArray(prevDocRes.teams) ? prevDocRes.teams : [];
      if (!prevTeams.length) return;

      // ambil dokumen hasil (dipakai bersama lintas kategori) utk tahu
      // siapa yang SUDAH BERTANDING (bukan cuma terdaftar) di kategori
      // sebelumnya
      const resultsRes = await this._fetchOnce(
        "event-results:get",
        currentIdentity,
        "autofill-res|" + reqBase
      );
      const eventResult =
        resultsRes && resultsRes.ok && resultsRes.doc && Array.isArray(resultsRes.doc.eventResult)
          ? resultsRes.doc.eventResult
          : [];

      const competedKeys = new Set();
      eventResult.forEach((entry) => {
        const cat = (entry.categories || []).find(
          (c) => this._resultCategoryName(prevName) === String((c && c.name) || "").toUpperCase()
        );
        const hasResult =
          cat &&
          ((cat.rankedByCats !== "" && cat.rankedByCats != null) ||
            (cat.scored !== "" && cat.scored != null));
        if (hasResult) {
          const key = String((entry && entry.teamId) || (entry && entry.bib) || "");
          if (key) competedKeys.add(key);
        }
      });
      if (!competedKeys.size) return;

      const teamsToAdd = prevTeams.filter((t) => {
        const idKey = String((t && t.teamId) || (t && t.bibTeam) || "");
        const exKey =
          String((t && t.nameTeam) || "").toUpperCase() +
          "|" +
          String((t && t.bibTeam) || "");
        return competedKeys.has(idKey) && !excluded.has(exKey);
      });
      if (!teamsToAdd.length) return;

      await this._fetchOnce(
        "upsert-teams-registered",
        { ...currentIdentity, teams: teamsToAdd },
        "autofill-add|" + reqBase
      );

      await this.loadTeamsRegistered(div, race);
    },

    async refreshVisibleBuckets() {
      await this.$nextTick();
      const jobs = [];
      const combos = [];
      if (this.showPanel("R4", "MEN")) combos.push(["R4", "MEN"]);
      if (this.showPanel("R4", "WOMEN")) combos.push(["R4", "WOMEN"]);
      if (this.showPanel("R6", "MEN")) combos.push(["R6", "MEN"]);
      if (this.showPanel("R6", "WOMEN")) combos.push(["R6", "WOMEN"]);

      combos.forEach(([div, race]) => {
        jobs.push(
          this.loadTeamsRegistered(div, race).then(() =>
            this.autoFillFromPreviousCategory(div, race)
          )
        );
        jobs.push(this.loadEventResultsForPanel(div, race));
      });
      await Promise.all(jobs);
    },

    /* =========================================================
     * AVAILABLE TEAMS (dropdown sumber)
     * =======================================================*/

    // ✅ Kembalikan ARRAY kode yang diizinkan
    _allowedTypeForLevel(levelName) {
      const lv = String(levelName || "")
        .trim()
        .toUpperCase();
      // Ambil huruf level (A–I) setelah "CLASSIFICATION - "
      const m = lv.match(/CLASSIFICATION\s*-\s*([A-I])/);
      const key = m ? m[1] : null;
      if (!key || !LEVEL_SCOPE_MAP[key]) return null;
      return LEVEL_SCOPE_MAP[key];
    },

    // ✅ Loader teams yang support multi-type & typeTeam array/string
    async loadAvailableTeams() {
      try {
        ipcRenderer.send("teams:get-all");
        await new Promise((resolve) => {
          ipcRenderer.once("teams:get-all-reply", (_e, res) => {
            let items =
              res && res.ok && Array.isArray(res.items) ? res.items : [];

            // ⚠️ Pakai sumber levelName yang benar
            const levelName =
              (this.events && this.events.levelName) || // jika memang ada this.events
              (this.formEvent && this.formEvent.levelName) || // fallback umum di file kamu
              null;

            const allow = this._allowedTypeForLevel(levelName); // → array atau null

            if (Array.isArray(allow) && allow.length) {
              const allowSet = new Set(
                allow.map((s) => String(s).toLowerCase())
              );

              items = items.filter((t) => {
                const tt = t && t.typeTeam;
                if (Array.isArray(tt)) {
                  // jika typeTeam disimpan array di DB
                  return tt.some((v) => allowSet.has(String(v).toLowerCase()));
                }
                // jika typeTeam string tunggal
                return allowSet.has(String(tt || "").toLowerCase());
              });
            }

            // Jangan tampilkan tim yang statusnya Inactive (statusId !== 0)
            // di dropdown "Pilih Tim" Registered Teams — hanya tim Active
            // yang boleh di-assign ke kategori/bucket manapun.
            items = items.filter((t) => Number((t && t.statusId) || 0) === 0);

            this.availableTeams = items.map((t) => ({
              id:
                t && t._id && t._id.$oid
                  ? t._id.$oid
                  : String((t && t._id) || ""),
              nameTeam: t && t.nameTeam ? t.nameTeam : "",
              bibTeam: (t && t.bibTeam) || "",
              typeTeam: (t && t.typeTeam) || "",
              countryCode: (t && t.countryCode) || "",
            }));

            resolve();
          });
        });
      } catch {
        this.availableTeams = [];
      }
    },

    availableFor(divisionName, raceName) {
      const ev = this.raceActive.selected.name.toUpperCase();
      const init = (
        (this.initialActive.selected && this.initialActive.selected.name) ||
        ""
      ).toUpperCase();
      const bucket = this._getBucket(ev, divisionName, raceName, init);

      const teamsInBucket = bucket && bucket.teams ? bucket.teams : [];
      const usedIds = new Set(
        teamsInBucket
          .map((t) => (t.teamId ? String(t.teamId) : ""))
          .filter(Boolean)
      );
      const usedNames = new Set(
        teamsInBucket.map((t) =>
          String(t.nameTeam || "")
            .trim()
            .toUpperCase()
        )
      );
      const usedBibs = new Set(
        teamsInBucket.map((t) => String(t.bibTeam || "").trim())
      );

      return (this.availableTeams || []).map((t) => {
        const id = String(t.id || "");
        const nm = String(t.nameTeam || "")
          .trim()
          .toUpperCase();
        const alreadyUsed = (id && usedIds.has(id)) || usedNames.has(nm);
        return {
          ...t,
          disabled: alreadyUsed,
          bibConflict: usedBibs.has(String(t.bibTeam || "").trim()),
        };
      });
    },

    /* =========================================================
     * ACCESSORS (membaca dataTeams)
     * =======================================================*/
    getTeamsBy(divisionName, raceName, eventName) {
      if (!Array.isArray(this.dataTeams)) return [];
      const ev = String(eventName || "").toUpperCase();
      const div = String(divisionName || "").toUpperCase();
      const rac = String(raceName || "").toUpperCase();
      const ini =
        this.initialActive.selected && this.initialActive.selected.name
          ? String(this.initialActive.selected.name).toUpperCase()
          : "";

      const buckets = this.dataTeams.filter(
        (p) =>
          String(p.eventName).toUpperCase() === ev &&
          String(p.divisionName).toUpperCase() === div &&
          String(p.raceName).toUpperCase() === rac &&
          (!ini || String(p.initialName).toUpperCase() === ini)
      );

      const out = [];
      buckets.forEach((b) =>
        (b.teams || []).forEach((t) => out.push({ ...t }))
      );
      return out;
    },

    _getBucket(eventName, divisionName, raceName, initialName) {
      const ev = String(eventName || "").toUpperCase();
      const div = String(divisionName || "").toUpperCase();
      const rac = String(raceName || "").toUpperCase();
      const ini = String(initialName || "").toUpperCase();
      const arr = this.dataTeams || [];
      const found = arr.find(
        (p) =>
          String(p.eventName).toUpperCase() === ev &&
          String(p.divisionName).toUpperCase() === div &&
          String(p.raceName).toUpperCase() === rac &&
          String(p.initialName).toUpperCase() === ini
      );
      if (found) {
        if (!Array.isArray(found.teams)) found.teams = [];
        return found;
      }
      return null;
    },

    _ensureBucket(eventName, divisionName, raceName, initialName) {
      const exist = this._getBucket(
        eventName,
        divisionName,
        raceName,
        initialName
      );
      if (exist) return exist;

      const ev = String(eventName).toUpperCase();
      const div = String(divisionName).toUpperCase();
      const rac = String(raceName).toUpperCase();
      const ini = String(initialName).toUpperCase();

      const evCfg = (this.events.categoriesEvent || []).find(
        (x) => String(x.name).toUpperCase() === ev
      );
      const iniCfg = (this.events.categoriesInitial || []).find(
        (x) => String(x.name).toUpperCase() === ini
      );
      const racCfg = (this.events.categoriesRace || []).find(
        (x) => String(x.name).toUpperCase() === rac
      );
      const divCfg = (this.events.categoriesDivision || []).find(
        (x) => String(x.name).toUpperCase() === div
      );

      const bucket = {
        // 🔧 DITAMBAH
        eventId:
          this.$route && this.$route.params && this.$route.params.id
            ? String(this.$route.params.id)
            : evCfg
            ? String(evCfg.value)
            : "",
        // 🔧 sampai sini

        initialId: iniCfg ? String(iniCfg.value) : "",
        raceId: racCfg ? String(racCfg.value) : "",
        divisionId: divCfg ? String(divCfg.value) : "",
        eventName: ev,
        initialName: ini,
        raceName: rac,
        divisionName: div,
        teams: [],
      };

      if (!bucket.initialId) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Ups Sorry",
          detail:
            "Gagal Simpan, silakan pilih Initials Category terlebih dahulu.",
        });
        return null;
      }

      if (!Array.isArray(this.dataTeams)) this.dataTeams = [];
      this.dataTeams.push(bucket);
      return bucket;
    },

    /* =========================================================
     * DRAFT HANDLERS (panel add/edit)
     * =======================================================*/
    keyOf(div, race) {
      return `${String(div).toUpperCase()}_${String(race).toUpperCase()}`;
    },

    addDraft(div, race) {
      const k = this.keyOf(div, race);
      if (!this.draftMap[k])
        this.$set(this.draftMap, k, { teamId: "", bib: "" });
    },

    cancelDraft(div, race) {
      this.$set(this.draftMap, this.keyOf(div, race), null);
    },

    onDraftChange(div, race, draft) {
      this.$set(this.draftMap, this.keyOf(div, race), draft);
    },

    _buildTeamRecord(eventName, teamObj) {
      const ev = String(eventName || "").toUpperCase();
      const base = {
        teamId: teamObj.id ? String(teamObj.id) : "",
        nameTeam: teamObj.nameTeam,
        bibTeam: String(teamObj.bibTeam || "").trim(),
        startOrder: "",
        praStart: "",
        intervalRace: "",
        statusId: 0,
      };
      if (ev === "HEAD2HEAD") {
        return {
          ...base,
          result: [
            {
              startTime: "",
              finishTime: "",
              raceTime: "",
              penaltyTime: "",
              penaltyTotal: null,
              penalties: {},
            },
          ],
          roundId: "",
          roundName: "",
          totalTime: "",
          ranked: "",
          score: "",
          winLose: "",
          heat: null,
          judgesBy: "",
          judgesTime: "",
        };
      }
      if (ev === "RX") {
        return {
          ...base,
          result: [
            {
              startTime: "",
              finishTime: "",
              raceTime: "",
              penaltyTime: "",
              penaltyTotal: null,
              penalties: { gate1: null, gate2: null },
            },
          ],
          roundId: "",
          roundName: "",
          heatId: "",
          totalTime: "",
          finishPosition: null,
          ranked: "",
          score: "",
          qualified: null,
          heat: null,
          judgesBy: "",
          judgesTime: "",
        };
      }
      if (ev === "SLALOM") {
        return {
          ...base,
          result: [
            {
              session: "",
              startTime: "",
              finishTime: "",
              raceTime: "",
              penaltyTime: "",
              penaltyTotal: {
                start: null,
                finish: null,
                gates: [],
              },
              totalTime: "",
              ranked: null,
              score: null,
              judgesBy: "",
              judgesTime: "",
            },
            {
              session: "",
              startTime: "",
              finishTime: "",
              raceTime: "",
              penaltyTime: "",
              penaltyTotal: {
                start: null,
                finish: null,
                gates: [],
              },
              totalTime: "",
              ranked: null,
              score: null,
              judgesBy: "",
              judgesTime: "",
            },
          ],
        };
      }

      // DRR
      if (ev === "DRR") {
        return {
          ...base,
          result: [
            {
              startTime: "",
              finishTime: "",
              raceTime: "",
              startPenalty: null,
              finishPenalty: null,
              sectionPenalty: null,
              totalPenalty: null,
              startPenaltyTime: "",
              finishPenaltyTime: "",
              sectionPenaltyTime: [],
              totalPenaltyTime: "",
              totalTime: "",
              ranked: null,
              score: null,
              judgesBy: "",
              judgesTime: "",
            },
          ],
        };
      }

      // SPRINT
      return {
        ...base,
        result: {
          startTime: "",
          finishTime: "",
          raceTime: "",
          startPenalty: "",
          finishPenalty: "",
          penaltyTime: "",
          penalty: "",
          totalTime: "",
          ranked: "",
          score: "",
          judgesBy: "",
          judgesTime: "",
        },
      };
    },

    saveDraft(div, race) {
      const k = this.keyOf(div, race);
      const d = this.draftMap[k];
      if (!d || !d.teamId || !d.bib) return;

      // ✅ Ambil eventId dari route params
      // const eventId = String(this.$route.params.id || "");

      const evName = this.raceActive.selected.name;
      const init =
        (this.initialActive.selected && this.initialActive.selected.name) || "";
      const bucket = this._ensureBucket(evName, div, race, init);
      if (!bucket) return;

      const srcTeam = (this.availableTeams || []).find(
        (t) => String(t.id) === String(d.teamId)
      );
      if (!srcTeam) return;

      // hindari duplikasi team & bib di panel yang sama
      const willDuplicateTeam =
        bucket.teams.some(
          (t) => t.teamId && String(t.teamId) === String(srcTeam.id)
        ) ||
        bucket.teams.some(
          (t) =>
            String(t.nameTeam || "")
              .trim()
              .toUpperCase() ===
            String(srcTeam.nameTeam || "")
              .trim()
              .toUpperCase()
        );
      if (willDuplicateTeam) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Tim sudah terdaftar di panel ini",
          detail: `${srcTeam.nameTeam} sudah ada pada ${div}/${race} – ${
            this.raceActive.selected.name
          } (${init || "-"})`,
        });
        return;
      }

      if (
        bucket.teams.some(
          (t) => String(t.bibTeam).trim() === String(d.bib).trim()
        )
      ) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "BIB sudah dipakai",
          detail: `Nomor BIB ${d.bib} sudah digunakan di panel ini.`,
        });
        return;
      }

      bucket.teams.push(
        this._buildTeamRecord(evName, { ...srcTeam, bibTeam: d.bib })
      );
      this.dataTeams = this.dataTeams.slice(); // trigger reactive update
      this.$set(this.draftMap, k, null);
      this.syncBucketToDB(bucket, div, race); // sinkron ke DB
    },

    /* =========================================================
     * PERSISTENCE (DB & local state)
     * =======================================================*/
    syncBucketToDB(bucket, div, race) {
      ipcRenderer.send("upsert-teams-registered", bucket);
      ipcRenderer.once("upsert-teams-registered-reply", (_e, res) => {
        if (!res || !res.ok) {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Failed",
            detail:
              (res && res.error) ||
              "Gagal menyimpan perubahan tim ke database.",
          });
          // rollback: DB gagal simpan tapi state lokal sudah terlanjur
          // menambahkan tim → resync panel ini dari DB supaya UI tidak "bohong"
          if (div && race) this.loadTeamsRegistered(div, race);
        }
      });
    },

    async loadEvent(id) {
      try {
        ipcRenderer.send("get-events-byid", id);
        await new Promise((resolve) => {
          ipcRenderer.once("get-events-byid-reply", (_e, data) => {
            const ev = data || {};
            ev._id = this._idToString(ev._id); // normalisasi id → string
            this.events = ev;
            // dataTeams (bucket per divisi/race/initial) selalu di-refresh
            // dari teamsRegisteredCollection lewat refreshVisibleBuckets(),
            // jadi mulai dari kosong di sini — eventsCollection tidak
            // pernah menyimpan salinan registrasi tim (lihat catatan di
            // Featured.md soal eventsCollection.participant yang mati).
            this.dataTeams = [];
            resolve();
          });
        });
      } catch {
        this.events = {};
        this.dataTeams = [];
      }
    },

    /* =========================================================
     * START RACE / NAVIGATION
     * =======================================================*/
    handleStartRace(payload) {
      const { division, race, eventName, initialName } = payload;

      const bucket = this._getBucket(
        this._toUpperSafe(eventName),
        this._toUpperSafe(division),
        this._toUpperSafe(race),
        this._toUpperSafe(initialName)
      ) || {
        eventId: "",
        initialId: "",
        raceId: "",
        divisionId: "",
        eventName: this._toUpperSafe(eventName),
        initialName: this._toUpperSafe(initialName),
        raceName: this._toUpperSafe(race),
        divisionName: this._toUpperSafe(division),
        teams: [],
      };

      const startData = {
        event: this.events || {},
        context: {
          eventName: bucket.eventName,
          initialName: bucket.initialName,
          divisionName: bucket.divisionName,
          raceName: bucket.raceName,
        },
        bucket,
        allBuckets: Array.isArray(this.dataTeams) ? this.dataTeams : [],
      };

      try {
        // 1) simpan payload start
        localStorage.setItem("raceStartPayload", JSON.stringify(startData));

        // 2) bangun currentEvent (pastikan participant terbaru)
        const currentEvent = {
          ...(this.events || {}),
          participant: Array.isArray(this.dataTeams)
            ? this.dataTeams
            : (this.events && this.events.participant) || [],
        };

        // 3) gunakan _id yang sudah dinormalisasi (string) atau fallback
        const eventId =
          (currentEvent && currentEvent._id
            ? String(
                typeof currentEvent._id === "object" && currentEvent._id.$oid
                  ? currentEvent._id.$oid
                  : currentEvent._id
              )
            : "") ||
          String(currentEvent.id || "") ||
          String(currentEvent.eventName || "default");

        // 4) simpan eventDetails (mendukung single-object atau dictionary multi-event)
        const raw = localStorage.getItem("eventDetails");
        let payload;
        if (!raw) {
          payload = currentEvent;
        } else {
          let prev;
          try {
            prev = JSON.parse(raw);
          } catch {
            prev = null;
          }
          const looksLikeDict =
            prev &&
            typeof prev === "object" &&
            !Array.isArray(prev) &&
            !(prev._id || prev.eventName || prev.categoriesInitial);

          if (looksLikeDict && eventId) {
            payload = { ...prev, [eventId]: currentEvent };
          } else {
            payload = currentEvent; // timpa mode single-object
          }
        }
        localStorage.setItem("eventDetails", JSON.stringify(payload));
      } catch (e) {
        // swallow error: tetap lanjut navigasi
      }

      // notifikasi opsional
      ipcRenderer &&
        ipcRenderer.send &&
        ipcRenderer.send("get-alert-saved", {
          type: "info",
          message: "Start Race",
          detail: `${bucket.eventName} – ${bucket.divisionName}/${bucket.raceName} (${bucket.initialName})`,
        });

      // navigasi ke halaman race
      const path = this._mapRaceToPath(eventName);
      this.$router.push(`/event-detail/${this.$route.params.id}/${path}`);
    },

    handleStartRaceAll() {
      let eventName = "";
      if (
        this.raceActive &&
        this.raceActive.selected &&
        this.raceActive.selected.name
      ) {
        eventName = this.raceActive.selected.name;
      } else if (this.race && this.race.name) {
        eventName = this.race.name;
      } else {
        eventName = "SPRINT"; // default
      }

      // Siapkan bucket dasar (bisa kamu ganti dengan state lain seperti selectedSprintKey)
      const bucket = {
        eventName: this._toUpperSafe(this.eventName || "SPRINT"),
        divisionName: this._toUpperSafe(this.division || "GENERAL"),
        raceName: this._toUpperSafe(eventName),
        initialName: this._toUpperSafe(this.initialName || "DEFAULT"),
        teams: Array.isArray(this.dataTeams) ? this.dataTeams : [],
      };

      const startData = {
        event: this.events || {},
        context: {
          eventName: bucket.eventName,
          initialName: bucket.initialName,
          divisionName: bucket.divisionName,
          raceName: bucket.raceName,
        },
        bucket: bucket,
        allBuckets: Array.isArray(this.dataTeams) ? this.dataTeams : [],
      };

      try {
        localStorage.setItem("raceStartPayload", JSON.stringify(startData));

        const currentEvent = {
          ...(this.events || {}),
          participant: Array.isArray(this.dataTeams)
            ? this.dataTeams
            : (this.events && this.events.participant) || [],
        };

        let eventId = "";
        if (currentEvent && currentEvent._id) {
          if (typeof currentEvent._id === "object" && currentEvent._id.$oid) {
            eventId = String(currentEvent._id.$oid);
          } else {
            eventId = String(currentEvent._id);
          }
        } else if (currentEvent.id) {
          eventId = String(currentEvent.id);
        } else if (currentEvent.eventName) {
          eventId = String(currentEvent.eventName);
        } else {
          eventId = "default";
        }

        const raw = localStorage.getItem("eventDetails");
        let payload;
        if (!raw) {
          payload = currentEvent;
        } else {
          let prev = null;
          try {
            prev = JSON.parse(raw);
          } catch (err) {
            prev = null;
          }

          const looksLikeDict =
            prev &&
            typeof prev === "object" &&
            !Array.isArray(prev) &&
            !(prev._id || prev.eventName || prev.categoriesInitial);

          if (looksLikeDict && eventId) {
            payload = Object.assign({}, prev, { [eventId]: currentEvent });
          } else {
            payload = currentEvent;
          }
        }
        localStorage.setItem("eventDetails", JSON.stringify(payload));
      } catch (e) {
        logger.warn("❌ Error saving start payload", e);
      }

      // notifikasi tanpa chaining
      if (ipcRenderer && ipcRenderer.send) {
        ipcRenderer.send("get-alert-saved", {
          type: "info",
          message: "Start Race",
          detail:
            bucket.eventName +
            " – " +
            bucket.divisionName +
            "/" +
            bucket.raceName +
            " (" +
            bucket.initialName +
            ")",
        });
      }

      const path = this._mapRaceToPath(this.raceActive.selected.name);
      this.$router.push("/event-detail/" + this.$route.params.id + "/" + path);
    },
  },
};
</script>

<style scoped>
:root {
  --blue: #1f6fa3;
}

.icon-event {
  transition: transform 0.4s ease;
}

.icon-event:hover {
  transform: scale(2.5);
}

/* ===== HERO / BANNER ===== */
.detail-hero {
  position: relative;
  min-height: 230px;
  overflow: hidden;
}

/* Foto background */
.detail-hero .hero-bg {
  position: absolute;
  inset: 0;
  background-image: url("https://images.unsplash.com/photo-1709810953776-ee6027ff8104?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
  background-size: cover;
  background-position: center;
}

/* Overlay gelap halus (ganti brightness filter) */
.detail-hero .hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45));
}

/* Konten di atas background */
.detail-hero .hero-inner {
  position: relative;
  z-index: 1;
  padding: 22px 22px;
  /* beri ruang kiri-kanan */
}

/* Judul besar putih + shadow kuat */
.detail-hero h2 {
  color: #fff;
  font-weight: 800;
  font-size: clamp(26px, 4.2vw, 46px);
  line-height: 1.05;
  margin-bottom: 6px !important;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
  letter-spacing: 0.2px;
}

/* Sub-info (lokasi, sungai, level) */
.detail-hero .meta {
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(12px, 1.6vw, 16px);
}

.hero-logo {
  width: 150px;
  height: 150px;
  margin-right: 10px;
  border-radius: 30px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 0 20px rgba(0, 128, 255, 0.6);
}

.event-logo-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  border-radius: 10px;
}

/* Responsif kecil: logo di atas, teks di bawah */
@media (max-width: 767px) {
  .detail-hero .hero-inner {
    padding: 18px 14px;
  }

  .hero-logo {
    margin-bottom: 12px;
  }
}

/* CARDS */
.race-card {
  border: 1px solid #e6ebf4;
  border-radius: 16px;
  background: #fff;
  padding: 16px;
  height: 100%;
  box-shadow: 0 12px 26px rgba(31, 56, 104, 0.08);
  transition: transform 0.12s, box-shadow 0.12s, border-color 0.12s;
  cursor: pointer;
}

.race-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 16px 32px rgba(31, 56, 104, 0.15);
  border-color: #cdd9f0;
}

.race-card.active {
  border-color: rgb(0, 180, 255);
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
}

.race-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  margin: 0 auto 8px;
  background: #eef6ff;
  color: var(--blue);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* INITIAL TABS */
.init-tabs {
  display: flex;
  gap: 12px;
  background: #f1f3f7;
  padding: 6px;
  border-radius: 10px;
}

.init-tab {
  border: none;
  background: transparent;
  color: #2b3445;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 8px;
  transition: all 0.25s ease;
}

/* Hover state */
.init-tab:hover {
  background: #dbeafe; /* biru muda */
  color: #1e3a8a; /* biru navy */
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.4);
}

/* Active state */
.init-tab.active {
  background: rgb(54, 142, 180);
  color: #fff;
  border-color: rgb(0, 180, 255);
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
}

/* TABLE & BUTTONS - class dipakai juga di TeamPanel.vue */
.panel-box {
  border: 1px solid #e6ebf4;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 26px rgba(31, 56, 104, 0.08);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  background: #f9fbff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.btn-start {
  border: 1px solid #d0d9e8 !important;
  background: #f4f7fb !important;
  color: #56627a !important;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
}

.panel-body {
  padding: 10px 16px 4px;
}

.panel-footer {
  padding: 8px 16px 14px;
  border-top: 1px solid #f0f3f9;
}

.btn-add {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 15px;
  padding: 18px 44px;
}

/* Hover effect */
.btn-add:hover {
  background: #f0f8ff; /* biru muda lembut */
  border-color: #1c4c7a;
  color: #0d2f4f;
  box-shadow: 0 0 12px rgba(0, 180, 255, 0.5);
  cursor: pointer;
}

.team-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
}

.team-table thead th {
  background: #eef1f6;
  color: #1f2940;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.3px;
  padding: 10px 12px;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.team-table tbody .row-card {
  background: #fff;
  border: 1px solid #e7ecf6;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(31, 56, 104, 0.06);
}

.team-table tbody td {
  padding: 10px 12px;
  vertical-align: middle;
}

.team-table tbody td.muted {
  color: #73809a;
  width: 64px;
}

.field {
  position: relative;
}

.input {
  width: 100%;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e6ebf4;
  background: #f7f9fc;
  padding: 6px 34px 6px 10px;
  outline: none;
}

.input:focus {
  background: #fff;
  border-color: #9ec5ff;
  box-shadow: 0 0 0 4px rgba(42, 104, 196, 0.15);
}

.suffix {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #7b8aa6;
}

.btn-ghost {
  border: 1px solid #d5deec;
  background: #eef3fb;
  color: #325a8f;
  border-radius: 10px;
  height: 34px;
  width: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-ghost.ok {
  background: #e6f7ff;
  border-color: #c6e9ff;
  color: #0d789d;
}

.btn-ghost.danger {
  background: #fef2f2;
  color: #a11d1d;
  border-color: #f1d1d1;
}

.ml-2 {
  margin-left: 8px;
}

.placeholder {
  color: #8793b5;
}

.btn-race-settings {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
  transition: all 0.25s ease;
}

/* Hover effect */
.btn-race-settings:hover {
  background: #f0f8ff; /* biru muda lembut */
  border-color: #1c4c7a;
  color: #0d2f4f;
  box-shadow: 0 0 12px rgba(0, 180, 255, 0.5);
  cursor: pointer;
}

/* Aksi destruktif (hapus semua hasil kompetisi event) — sengaja dibuat
   solid merah & menonjol, BUKAN gaya netral seperti tombol settings
   lainnya, supaya operator langsung sadar ini aksi berisiko sebelum klik. */
.btn-race-reset {
  background: #dc2626;
  border: 1px solid #dc2626;
  color: #ffffff;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
  transition: all 0.25s ease;
}
.btn-race-reset:hover {
  background: #b91c1c;
  border-color: #b91c1c;
  color: #ffffff;
  box-shadow: 0 0 12px rgba(220, 38, 38, 0.45);
}

.upload-hud {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.upload-box {
  background: #fff;
  border-radius: 14px;
  padding: 18px 24px;
  min-width: 240px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  text-align: center;
}
</style>
