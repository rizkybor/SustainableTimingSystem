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
        <b-button class="btn-race-settings mr-2" @click="openEventSettings">
          Event Settings
        </b-button>

        <b-button class="btn-race-settings mr-2" @click="openJudgeSettings">
          Judges Settings
        </b-button>

        <b-button class="btn-race-settings" @click="openRaceSettings">
          Race Settings
        </b-button>
      </div>

      <!-- CATEGORIES (klik untuk ganti eventName: SPRINT/H2H/SLALOM/DRR) -->
      <h5 class="font-weight-bold mb-3">Race Categories</h5>
      <b-row>
        <b-col
          cols="12"
          md="3"
          v-for="c in raceCategories"
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
        v-if="showPanel('R4', 'MEN')"
        class="mt-2"
        title="Team R4 Men's"
        :division="'R4'"
        :race="'MEN'"
        :event-name="raceActive.selected.name"
        :initial-name="initialActive.selected.name"
        :rows="teamsMenR4"
        :teams-available="availableFor('R4', 'MEN')"
        :draft="draftMap['R4_MEN']"
        @add-draft="addDraft('R4', 'MEN')"
        @draft-change="onDraftChange('R4', 'MEN', $event)"
        @draft-save="saveDraft('R4', 'MEN')"
        @draft-cancel="cancelDraft('R4', 'MEN')"
        @delete-row="deleteRow('R4', 'MEN', $event)"
        @start-race="handleStartRace"
        @show-result="showResult('R4', 'MEN')"
      />

      <team-panel
        v-if="showPanel('R4', 'WOMEN')"
        class="mt-4"
        title="Team R4 Women’s"
        :division="'R4'"
        :race="'WOMEN'"
        :event-name="raceActive.selected.name"
        :initial-name="initialActive.selected.name"
        :rows="teamsWomenR4"
        :teams-available="availableFor('R4', 'WOMEN')"
        :draft="draftMap['R4_WOMEN']"
        @add-draft="addDraft('R4', 'WOMEN')"
        @draft-change="onDraftChange('R4', 'WOMEN', $event)"
        @draft-save="saveDraft('R4', 'WOMEN')"
        @draft-cancel="cancelDraft('R4', 'WOMEN')"
        @delete-row="deleteRow('R4', 'WOMEN', $event)"
        @start-race="handleStartRace"
        @show-result="showResult('R4', 'WOMEN')"
      />

      <team-panel
        v-if="showPanel('R6', 'MEN')"
        class="mt-4"
        title="Team R6 Men's"
        :division="'R6'"
        :race="'MEN'"
        :event-name="raceActive.selected.name"
        :initial-name="initialActive.selected.name"
        :rows="teamsMenR6"
        :teams-available="availableFor('R6', 'MEN')"
        :draft="draftMap['R6_MEN']"
        @add-draft="addDraft('R6', 'MEN')"
        @draft-change="onDraftChange('R6', 'MEN', $event)"
        @draft-save="saveDraft('R6', 'MEN')"
        @draft-cancel="cancelDraft('R6', 'MEN')"
        @delete-row="deleteRow('R6', 'MEN', $event)"
        @start-race="handleStartRace"
        @show-result="showResult('R6', 'MEN')"
      />

      <team-panel
        v-if="showPanel('R6', 'WOMEN')"
        class="mt-4"
        title="Team R6 Women’s"
        :division="'R6'"
        :race="'WOMEN'"
        :event-name="raceActive.selected.name"
        :initial-name="initialActive.selected.name"
        :rows="teamsWomenR6"
        :teams-available="availableFor('R6', 'WOMEN')"
        :draft="draftMap['R6_WOMEN']"
        @add-draft="addDraft('R6', 'WOMEN')"
        @draft-change="onDraftChange('R6', 'WOMEN', $event)"
        @draft-save="saveDraft('R6', 'WOMEN')"
        @draft-cancel="cancelDraft('R6', 'WOMEN')"
        @delete-row="deleteRow('R6', 'WOMEN', $event)"
        @start-race="handleStartRace"
        @show-result="showResult('R6', 'WOMEN')"
      />

      <div v-if="!anyPanelShown" class="text-center text-muted py-5">
        Belum ada konfigurasi divisi/race untuk event ini.
      </div>

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
      @update-settings="handleUpdateSettings"
    />
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
var CLOUD_NAME = "kikiaka";
var UPLOAD_PRESET = "stiming-preset"; 
var FOLDER_EVENT_LOGO = "sustainable-js/event-logo";
var FOLDER_EVENT_SPONSOR = "sustainable-js/event-sponsorship";

function _toCloudMeta(json) {
  return {
    public_id: json && json.public_id ? String(json.public_id) : "",
    secure_url:
      json && (json.secure_url || json.url)
        ? String(json.secure_url || json.url)
        : "",
    url:
      json && (json.secure_url || json.url)
        ? String(json.secure_url || json.url)
        : "",
    width: typeof (json && json.width) === "number" ? json.width : null,
    height: typeof (json && json.height) === "number" ? json.height : null,
    format: json && json.format ? String(json.format) : "",
    bytes: typeof (json && json.bytes) === "number" ? json.bytes : 0,
    resource_type:
      json && json.resource_type ? String(json.resource_type) : "image",
    original_filename:
      json && json.original_filename ? String(json.original_filename) : "",
  };
}

async function _uploadOne(fileObj, folder) {
  if (!fileObj) return { ok: false, error: "no-file" };

  // A) lewat bridge Electron kalau ada
  if (window.cloud && typeof window.cloud.uploadFile === "function") {
    try {
      var up = await window.cloud.uploadFile(fileObj, { folder: folder });
      if (up && up.ok === true && up.result) {
        return { ok: true, result: _toCloudMeta(up.result) };
      }
      return {
        ok: false,
        error: up && up.error ? String(up.error) : "upload-failed",
      };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  }

  // B) fallback unsigned upload
  try {
    var fd = new FormData();
    fd.append("file", fileObj);
    fd.append("upload_preset", UPLOAD_PRESET);
    if (folder) fd.append("folder", folder);

    var url = "https://api.cloudinary.com/v1_1/" + CLOUD_NAME + "/image/upload";
    var res = await fetch(url, { method: "POST", body: fd });
    var json = null;
    try {
      json = await res.json();
    } catch (_e) {
      json = null;
    }

    if (!res.ok || !json || !(json.secure_url || json.url)) {
      var det =
        json && json.error && json.error.message
          ? json.error.message
          : "upload-failed";
      return { ok: false, error: det, raw: json };
    }
    return { ok: true, result: _toCloudMeta(json) };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

async function _uploadMany(list, folder) {
  var out = [];
  if (!list || typeof list.length !== "number") return out;

  for (var i = 0; i < list.length; i++) {
    var f = list[i];

    // kalau yang datang path string (drag&drop), minta bridge bikin File-like
    if (
      typeof f === "string" &&
      window.cloud &&
      typeof window.cloud.pathToFile === "function"
    ) {
      try {
        var created = await window.cloud.pathToFile(f);
        if (created) f = created;
      } catch (_e) {}
    }

    var up = await _uploadOne(f, folder);
    if (up && up.ok && up.result) out.push(up.result);
  }
  return out;
}

import sprintPng from "@/assets/images/Rectangle-3.png";
import slalomPng from "@/assets/images/Rectangle-4-1.png";
import drrPng from "@/assets/images/Rectangle-4-2.png";
import h2hPng from "@/assets/images/Rectangle-4.png";
import { ipcRenderer } from "electron";
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
      lastToken: "",
      showRaceSettings: false,
      showEventSettings: false,
      MAX_GATE: 14,
      MAX_SECTION: 6,
      raceSettings: {
        h2h: { R1: true, R2: true, L1: true, L2: true },
        slalom: { totalGate: 14 },
        drr: { totalSection: 5 },
      },
      showJudgeSettings: false,
      judgeSettings: {
        // ← nilai awal (boleh kosong; modal akan merge default)
        h2h: { R1: true, R2: true, L1: true, L2: true },
        slalom: { totalGate: 14 },
        drr: { totalSection: 5 },
      },
      // kategori UI
      raceCategories: [
        {
          key: "SPRINT",
          title: "Sprint",
          icon: sprintPng,
          desc: "Short-distance race against the clock  on grade II-III rapids",
        },
        {
          key: "HEAD2HEAD",
          title: "Head to Head",
          icon: h2hPng,
          desc: "Direct competition between two teams  on parallel courses",
        },
        {
          key: "SLALOM",
          title: "Slalom",
          icon: slalomPng,
          desc: "Technical course navigation through  gates on whitewater",
        },
        {
          key: "DRR",
          title: "Down River",
          icon: drrPng,
          desc: "Long-distance endurance race through  varied river conditions",
        },
      ],

      // state
      raceActive: { selected: { name: "SPRINT" } },
      initialActive: { selected: { name: "Silakan Pilih Initial" } },

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
    // ambil rows berdasar kombinasi & initial aktif
    teamsMenR4() {
      return this.getTeamsBy("R4", "MEN", this.raceActive.selected.name);
    },
    teamsWomenR4() {
      return this.getTeamsBy("R4", "WOMEN", this.raceActive.selected.name);
    },
    teamsMenR6() {
      return this.getTeamsBy("R6", "MEN", this.raceActive.selected.name);
    },
    teamsWomenR6() {
      return this.getTeamsBy("R6", "WOMEN", this.raceActive.selected.name);
    },

    anyPanelShown() {
      return (
        this.showPanel("R4", "MEN") ||
        this.showPanel("R4", "WOMEN") ||
        this.showPanel("R6", "MEN") ||
        this.showPanel("R6", "WOMEN")
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
      };

      // preview sederhana ke console
      console.log(
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

        // ===== 4) UPDATE DB ASSETS (URL saja) =====
        this._setLoading(true, "Memperbarui aset di database…", 85);
        const assetsDoc = {
          _id: eventId,
          eventFiles: finalEventUrls,
          sponsorFiles: finalSponsorUrls,
        };
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
        this._setLoading(true, "Selesai ✔", 100);
        ipcRenderer.send("get-alert-saved", {
          type: "info",
          message: "Event updated",
          detail: "Signature & files berhasil disimpan",
        });

        // Log ringkas hasil final
        var preview = {
          eventId: eventId,
          signature: safePayload.signature,
          eventFiles: eventUrls,
          sponsorFiles: sponsorUrls,
        };
        console.log("UPDATED:\n" + JSON.stringify(preview, null, 2));
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

    onUpdateRaceSettings(payload) {
      if (payload && payload.settings) this.raceSettings = payload.settings;

      if (typeof window !== "undefined" && window.ipcRenderer) {
        window.ipcRenderer.send("race-settings:upsert", payload);

        // sekali saja, tunggu reply lalu lepas listener
        const handler = (_event, res) => {
          if (res && res.ok) {
            logger.info("✅ Race settings updated in DB:", res);
          } else {
            logger.warn("❌ Failed to update race settings:", res && res.error);
          }
          window.ipcRenderer.removeListener(
            "race-settings:upsert-reply",
            handler
          );
        };
        window.ipcRenderer.on("race-settings:upsert-reply", handler);
      }
    },

    onUpdateJudgeSettings(payload) {
      logger.info("✅ Data payload:", payload);
    },

    async selectCategory(c) {
      this.raceActive.selected = { name: c.key };
      await this.refreshVisibleBuckets();
    },

    async selectInitial(i) {
      this.initialActive.selected = i;
      await this.refreshVisibleBuckets();
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

    _mapRaceToPath(evName) {
      const e = this._toUpperSafe(evName);
      if (e === "SPRINT") return "sprint-race";
      if (e === "SLALOM") return "slalom-race";
      if (e === "DRR") return "drr-race";
      if (e === "HEAD2HEAD") return "head2head-race";
      return e.toLowerCase(); // fallback
    },

    /* =========================================================
     * IDENTITY BUILDERS (event/initial/division/race)
     * =======================================================*/
    _buildIdentity(div, race) {
      // pakai computed eventId; fallback ke route param
      const eventId = this.eventId || this.$route.params.id || "";
      const eventName = this._safeSelectedName(this.raceActive);
      const initialName = this._safeSelectedName(this.initialActive);

      return {
        eventId,
        initialId: this._matchId(this.events.categoriesInitial, initialName),
        raceId: this._matchId(this.events.categoriesRace, race),
        divisionId: this._matchId(this.events.categoriesDivision, div),
        eventName: String(eventName).toUpperCase(),
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
      this.persistParticipants();

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
        }
      });
    },

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

      const pathMap = {
        SPRINT: "sprint-result",
        DRR: "drr-result",
        SLALOM: "slalom-result",
        HEAD2HEAD: "headtohead-result",
      };
      const path = pathMap[idt.eventName] || "";

      this.$router.push({
        path: `/event-detail/${this.$route.params.id}/${path}`,
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

      // Token untuk menangkal balasan telat (race condition)
      const token = [
        identity.eventName,
        identity.initialName,
        identity.divisionName,
        identity.raceName,
        Date.now(),
      ].join("|");
      this.lastToken = token;

      return await new Promise((resolve) => {
        const onReply = (_e, bucket) => {
          if (this.lastToken !== token) return resolve(); // abaikan balasan usang
          if (bucket && Array.isArray(bucket.teams)) {
            this._mergeBucketIntoState(bucket);
            resolve({ div, race, ok: true });
          } else {
            this._clearBucketInState(identity);
            resolve({ div, race, ok: false, reason: "empty" });
          }
        };

        ipcRenderer.send("get-teams-registered", identity);
        ipcRenderer.once("get-teams-registered-reply", onReply);

        // hard-timeout supaya listener tak menggantung
        setTimeout(() => {
          ipcRenderer.off("get-teams-registered-reply", onReply);
          resolve({ div, race, ok: false, reason: "timeout" });
        }, 3000);
      });
    },

    async refreshVisibleBuckets() {
      await this.$nextTick();
      const jobs = [];
      if (this.showPanel("R4", "MEN"))
        jobs.push(this.loadTeamsRegistered("R4", "MEN"));
      if (this.showPanel("R4", "WOMEN"))
        jobs.push(this.loadTeamsRegistered("R4", "WOMEN"));
      if (this.showPanel("R6", "MEN"))
        jobs.push(this.loadTeamsRegistered("R6", "MEN"));
      if (this.showPanel("R6", "WOMEN"))
        jobs.push(this.loadTeamsRegistered("R6", "WOMEN"));
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

            this.availableTeams = items.map((t) => ({
              id:
                t && t._id && t._id.$oid
                  ? t._id.$oid
                  : String((t && t._id) || ""),
              nameTeam: t && t.nameTeam ? t.nameTeam : "",
              bibTeam: (t && t.bibTeam) || "",
            }));

            if (!this.availableTeams.length) {
              this.availableTeams = this.dummyTeams.slice();
            }
            resolve();
          });
        });
      } catch {
        this.availableTeams = this.dummyTeams.slice();
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
      this.persistParticipants();
      this.syncBucketToDB(bucket); // sinkron ke DB
    },

    /* =========================================================
     * PERSISTENCE (DB & local state)
     * =======================================================*/
    syncBucketToDB(bucket) {
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
            this.dataTeams = Array.isArray(ev.participant)
              ? ev.participant
              : [];
            resolve();
          });
        });
      } catch {
        this.events = {};
        this.dataTeams = [];
      }
    },

    persistParticipants() {
      try {
        ipcRenderer.send("events-update-participant", {
          eventId: this.$route.params.id,
          participant: this.dataTeams,
        });
      } catch {
        // no-op; state lokal tetap dipakai
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
