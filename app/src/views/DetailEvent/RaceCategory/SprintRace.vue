<template>
  <div>
    <div class="card-wrapper p-3 mb-2 mt-5 mx-5">
      <!-- TOP BAR (breadcrumb + datetime) -->
      <div
        class="d-flex align-items-center justify-content-between text-muted small"
      >
        <b-breadcrumb class="mb-0">
          <b-breadcrumb-item to="/">
            <Icon icon="mdi:home-outline" class="mr-1" />
            Dashboard
          </b-breadcrumb-item>
          <b-breadcrumb-item
            :to="{ name: 'detail-event', params: { id: $route.params.id } }"
          >
            {{ dataEventSafe.eventName }}
          </b-breadcrumb-item>
          <b-breadcrumb-item active>
            {{ "Sprint Race" }}
          </b-breadcrumb-item>
        </b-breadcrumb>
        <div>{{ currentDateTime }}</div>
      </div>
    </div>

    <!-- HERO -->
    <section class="detail-hero">
      <div class="hero-bg"></div>
      <b-container class="hero-inner">
        <b-row class="align-items-center">
          <b-col cols="auto" class="pr-0">
            <div
              class="hero-logo d-flex align-items-center justify-content-center"
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

          <b-col>
            <h2 class="h1 font-weight-bold mb-1 text-white">
              {{ dataEventSafe.eventName || "NO DATA" }}
            </h2>
            <div class="meta text-white-50">
              <span class="mr-3">
                <strong class="text-white">Location</strong> :
                {{ dataEventSafe.addressCity || "-" }}
              </span>
              <span class="mr-3"
                ><strong class="text-white">River</strong> :
                {{ dataEventSafe.riverName || "-" }}</span
              >
              <span class="mr-3"
                ><strong class="text-white">Level</strong> :
                {{ dataEventSafe.levelName || "-" }}</span
              >
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>

    <div class="px-5">
      <div class="card-body">
        <b-row>
          <b-col>
            <div class="meta-panel">
              <div class="meta-row">
                <span class="meta-label">Nomor Lomba</span>
                <span class="meta-value">
                  <span class="badge-chip badge-chip--blue">Sprint</span>
                </span>
              </div>

              <div class="meta-row">
                <span class="meta-label">Categories</span>
                <span
                  class="meta-value badge-chip badge-chip--blue"
                  :title="titleCategories || '-'"
                >
                  {{ titleCategories || "-" }}
                </span>
              </div>

              <div class="meta-row">
                <!-- Select category -->
                <b-form-group
                  label="Switch Sprint Category:"
                  label-for="sprintBucketSelect"
                  class="mb-0 sprint-actionbar__select"
                >
                  <b-form-select
                    id="sprintBucketSelect"
                    :options="sprintBucketOptions"
                    v-model="selectedSprintKey"
                    @change="onSelectSprintBucket"
                  />
                </b-form-group>
              </div>
            </div>
          </b-col>

          <b-col>
            <div
              class="d-flex flex-wrap justify-content-end align-items-center controls-bar"
            >
              <!-- selector baud -->
              <div class="btn-baud-group mr-2 mb-2">
                <span class="mr-2 text-muted">Baud Rate :</span>
                <div class="d-inline-flex">
                  <button
                    v-for="br in baudOptions"
                    :key="'baud-' + br"
                    type="button"
                    class="btn-action"
                    :class="
                      baudRate === br ? 'btn-success' : 'btn-outline-secondary'
                    "
                    @click="setBaud(br)"
                    :disabled="isPortConnected"
                    style="margin-right: 6px"
                  >
                    {{ br }}
                  </button>
                </div>
              </div>

              <!-- connect -->
              <button
                type="button"
                :class="{
                  'btn-danger': isPortConnected,
                  'btn-success': !isPortConnected,
                }"
                class="btn-action mb-2"
                @click="connectPort"
              >
                <Icon icon="ic:baseline-sync" />
                {{ isPortConnected ? "Disconnect" : "Connect Racetime" }}
              </button>

              <span
                class="status-indicator mb-2 ml-2"
                :class="{
                  connected: isPortConnected,
                  disconnected: !isPortConnected,
                }"
              ></span>

              <!-- break line -->
              <div class="w-100"></div>

              <!-- path pill -->
              <div class="mb-1">
                <span
                  class="path-pill"
                  :class="{ 'path-pill--empty': !selectPath }"
                  :title="selectPath || 'No device selected'"
                >
                  <Icon
                    icon="mdi:usb-port"
                    width="16"
                    height="16"
                    class="mr-1"
                  />
                  <span class="truncate">{{
                    selectPath || "No device selected"
                  }}</span>
                </span>
              </div>
            </div>
          </b-col>
        </b-row>
      </div>
    </div>

    <!-- OPERATION TIME -->
    <OperationTimePanel
      v-if="participantArr && participantArr.length"
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="participantArr"
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />

    <!-- RACETIME OUTPUT -->
    <div class="px-4 mt-2">
      <div class="card-body">
        <div class="d-flex justify-content-between mb-2">
          <div class="racetime-header">
            <h4>Output Racetime :</h4>
            <small class="text-muted">
              Category active: {{ titleCategories || "-" }}
            </small>
          </div>
          <div v-if="participantArr && participantArr.length">
            <!-- <button
              type="button"
              class="btn-action btn-secondary mr-2"
              @click="sendRealtimeMessage"
            >
              <Icon icon="icon-park-outline:save" /> Send to Judges
            </button>

            <button
              type="button"
              class="btn-action btn-secondary mr-2"
              @click="previewResult"
            >
              <Icon icon="icon-park-outline:save" /> Preview JSON
            </button> -->

              <button
              type="button"
              class="btn-action btn-secondary"
              @click="fetchEventResultsAggregate"
            >
              <Icon icon="icon-park-outline:save" /> View Aggregate
            </button>

            <button
              type="button"
              class="btn-action btn-info mr-2"
              @click="toggleSortRanked"
            >
              <Icon icon="icon-park-outline:ranking" /> Sort Ranked
            </button>

            <button
              type="button"
              class="btn-action btn-secondary"
              @click="saveResult"
            >
              <Icon icon="icon-park-outline:save" /> Save Result
            </button>
          </div>
        </div>

        <b-row>
          <b-col>
            <div
              v-if="isLoading"
              class="bracket-loading d-flex align-items-center justify-content-center py-5"
            >
              <div class="text-center">
                <b-spinner label="Loading" class="mb-2"></b-spinner>
                <div class="text-muted">Loading bracket & teams…</div>
              </div>
            </div>
            <table
              v-else-if="participantArr && participantArr.length"
              class="table"
            >
              <thead>
                <tr>
                  <th class="text-center">No</th>
                  <th class="text-left">Team Name</th>
                  <th class="text-center">BIB Number</th>
                  <th class="text-center">Start Time</th>
                  <th class="text-center">Pen. Start (PS)</th>
                  <th class="text-center">Pen. Finish (PF)</th>
                  <th class="text-center">Penalty Total</th>
                  <th class="text-center">Finish Time</th>
                  <th class="text-center">Race Time</th>
                  <th class="text-center">Penalty Time</th>
                  <th class="text-center">Result</th>
                  <th class="text-center">Ranked</th>
                  <th class="text-center">Scored</th>
                  <th v-if="endGame">Action</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(item, index) in participantArr" :key="index">
                  <td class="text-center">{{ index + 1 }}</td>

                  <!-- TEAM NAME  -->
                  <td
                    style="text-align: start"
                    class="large-bold text-strong max-char"
                  >
                    {{ item.nameTeam }}
                  </td>

                  <!-- BIB NUMBER  -->
                  <td class="text-center">{{ item.bibTeam }}</td>

                  <!-- START TIME  -->
                  <td class="text-center text-monospace">
                    {{ item.result.startTime }}
                  </td>

                  <!-- PENALTY START -->
                  <td class="text-center">
                    <b-select
                      v-if="item.result.startTime"
                      v-model.number="item.result.startPenalty"
                      @change="updateStartPenalty(item)"
                      style="border-radius: 12px"
                      class="small-select"
                    >
                      <option
                        v-for="p in dataPenalties"
                        :key="'sp' + p.value"
                        :value="p.value"
                      >
                        {{ p.label }}
                      </option>
                    </b-select>
                  </td>

                  <!-- PENALTY FINISH -->
                  <td class="text-center">
                    <b-select
                      v-if="item.result.startTime"
                      v-model.number="item.result.finishPenalty"
                      @change="updateFinishPenalty(item)"
                      style="border-radius: 12px"
                      class="small-select"
                    >
                      <option
                        v-for="p in dataPenalties"
                        :key="'fp' + p.value"
                        :value="p.value"
                      >
                        {{ p.value }}
                      </option>
                    </b-select>
                  </td>

                  <!-- PENALTY TOTAL -->
                  <td class="text-center penalty-char">
                    {{ item.result.totalPenalty }}
                  </td>

                  <!-- FINISH TIME  -->
                  <td class="text-center text-monospace">
                    {{ item.result.finishTime }}
                  </td>

                  <!-- RACE TIME  -->
                  <td class="text-center large-bold text-monospace">
                    {{ item.result.raceTime }}
                  </td>

                  <!-- PENALTY TOTAL TIME -->
                  <td
                    class="text-center large-bold penalty-char text-monospace"
                  >
                    {{ item.result.penaltyTime }}
                  </td>

                  <!-- RESULT TIME  -->
                  <td class="text-center large-bold result-char text-monospace">
                    {{
                      item.result.penaltyTime
                        ? item.result.totalTime
                        : item.result.raceTime
                    }}
                  </td>

                  <!-- RANKED  -->
                  <td class="text-center large-bold">
                    {{ item.result.ranked }}
                  </td>

                  <!-- SCORED  -->
                  <td class="text-center large-bold">
                    {{ getScoreByRanked(item.result.ranked) }}
                  </td>
                  <td v-if="endGame">
                    <button
                      type="button"
                      class="btn-action btn-danger"
                      @click="resetRow(item)"
                    >
                      Reset
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- EMPTY STATE -->
            <EmptyCard v-else />
            <br />
          </b-col>
        </b-row>
        <b-button
          @click="goTo()"
          variant="outline-secondary"
          class="btn-action"
        >
          <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
        </b-button>
      </div>
    </div>

     <!-- MODAL KOMPONEN -->
    <PrintOverallModal
      centered
      :dataEvent="dataEventSafe"
      :show="showOverallModal"
      :aggregate="dataAggregate"
      @close="showOverallModal = false"
    />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { createSerialReader, listPorts } from "@/utils/serialConnection.js";
import OperationTimePanel from "@/components/race/OperationTeamPanel.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import EmptyCard from "@/components/cards/card-empty.vue";
import PrintOverallModal from "@/components/result/PrintOverallModal.vue";

import { getSocket } from "@/services/socket";
import { logger } from "@/utils/logger";
import { Icon } from "@iconify/vue2";
import {
  saveLocalResults,
  loadLocalResults,
  mergeTeamsWithCache,
  debounce,
} from "@/utils/localStoreSprint";

/** ===== helpers: baca payload baru dari localStorage ===== */
const RACE_PAYLOAD_KEY = "raceStartPayload";
function getBucket() {
  try {
    const raw = localStorage.getItem(RACE_PAYLOAD_KEY);
    const obj = JSON.parse(raw || "{}");
    const b = obj.bucket || {};
    return {
      eventId: String(b.eventId || ""),
      initialId: String(b.initialId || ""),
      raceId: String(b.raceId || ""),
      divisionId: String(b.divisionId || ""),
      eventName: String(b.eventName || "").toUpperCase(),
      initialName: String(b.initialName || "").toUpperCase(),
      raceName: String(b.raceName || "").toUpperCase(),
      divisionName: String(b.divisionName || "").toUpperCase(),
    };
  } catch {
    return {
      eventId: "",
      initialId: "",
      raceId: "",
      divisionId: "",
      eventName: "",
      initialName: "",
      raceName: "",
      divisionName: "",
    };
  }
}

/** builder dokumen yang akan disimpan */
function buildResultDocs(participantArr, bucket) {
  const now = new Date();
  return participantArr.map((t) => {
    const team = {
      nameTeam: String(t.nameTeam || ""),
      bibTeam: String(t.bibTeam || ""),
      startOrder: String(t.startOrder || ""),
      praStart: String(t.praStart || ""),
      intervalRace: String(t.intervalRace || ""),
      statusId: Number.isFinite(t.statusId) ? Number(t.statusId) : 0,
    };
    const result = { ...(t.result || {}) };
    const otr = { ...(t.otr || {}) };

    result.startTime = String(result.startTime || "");
    result.finishTime = String(result.finishTime || "");
    result.raceTime = String(result.raceTime || "");

    result.startPenalty = Number.isFinite(result.startPenalty)
      ? Number(result.startPenalty)
      : 0;
    result.finishPenalty = Number.isFinite(result.finishPenalty)
      ? Number(result.finishPenalty)
      : 0;

    result.penalty = 0;

    result.totalPenalty = Number.isFinite(result.totalPenalty)
      ? Number(result.totalPenalty)
      : result.startPenalty + result.finishPenalty;

    result.startPenaltyTime = String(result.startPenaltyTime || "00:00:00.000");
    result.finishPenaltyTime = String(
      result.finishPenaltyTime || "00:00:00.000"
    );
    result.totalPenaltyTime = String(
      result.totalPenaltyTime || result.penaltyTime || "00:00:00.000"
    );

    result.penaltyTime = String(
      result.totalPenaltyTime || result.penaltyTime || "00:00:00.000"
    );

    result.totalTime = String(result.totalTime || result.raceTime || "");
    result.ranked = Number.isFinite(result.ranked)
      ? result.ranked
      : result.ranked
      ? Number(result.ranked)
      : 0;
    result.score = Number.isFinite(result.score)
      ? result.score
      : result.score
      ? Number(result.score)
      : 0;

    return {
      eventId: bucket.eventId,
      initialId: bucket.initialId,
      raceId: bucket.raceId,
      divisionId: bucket.divisionId,
      eventName: bucket.eventName,
      initialName: bucket.initialName,
      raceName: bucket.raceName,
      divisionName: bucket.divisionName,
      ...team,
      result,
      otr,
      createdAt: now,
      updatedAt: now,
    };
  });
}

function normalizeTeamForSprint(t = {}) {
  const base = {
    teamId: String(t.teamId || ""),
    nameTeam: String(t.nameTeam || ""),
    bibTeam: String(t.bibTeam || ""),
    startOrder: String(t.startOrder || ""),
    praStart: String(t.praStart || ""),
    intervalRace: String(t.intervalRace || ""),
    statusId: Number.isFinite(t.statusId) ? Number(t.statusId) : 0,
  };

  const emptyRes = {
    startTime: "",
    finishTime: "",
    raceTime: "",

    startPenalty: 0,
    finishPenalty: 0,

    penalty: 0,

    startPenaltyTime: "00:00:00.000",
    finishPenaltyTime: "00:00:00.000",
    totalPenalty: 0,
    totalPenaltyTime: "00:00:00.000",

    penaltyTime: "",
    totalTime: "",
    ranked: "",
    score: "",
  };

  let result = t.result;
  if (Array.isArray(result)) result = result[0] || {};
  if (!result || typeof result !== "object") result = {};
  result = { ...emptyRes, ...result };

  return { ...base, result };
}

function loadRaceStartPayloadForSprint() {
  let obj = {};
  try {
    obj = JSON.parse(localStorage.getItem(RACE_PAYLOAD_KEY) || "{}");
  } catch {
    obj = {};
  }
  const b = obj.bucket || {};
  const bucket = {
    eventId: String(b.eventId || ""),
    initialId: String(b.initialId || ""),
    raceId: String(b.raceId || ""),
    divisionId: String(b.divisionId || ""),
    eventName: String(b.eventName || "").toUpperCase(),
    initialName: String(b.initialName || "").toUpperCase(),
    raceName: String(b.raceName || "").toUpperCase(),
    divisionName: String(b.divisionName || "").toUpperCase(),
    teams: Array.isArray(b.teams) ? b.teams.map(normalizeTeamForSprint) : [],
  };
  return { bucket };
}

export default {
  name: "SustainableTimingSystemSprintRace",
  components: { OperationTimePanel, EmptyCard, PrintOverallModal, Icon },

  data() {
    return {
       showOverallModal: false,
    dataAggregate: {
      header: { title: "", subTitle: "", dateStr: "", official: false, chiefJudge: "" },
      rows: []
    },
      isLoading: false,
      defaultImg,
      sprintBucketOptions: [],
      sprintBucketMap: Object.create(null),
      selectedSprintKey: "",
      selfSocketId: null,
      selectPath: "",
      baudRate: 9600,
      baudOptions: [1200, 2400, 9600],
      serialCtrl: null,
      endGame: false,
      isScrolled: false,
      port: null,
      isPortConnected: false,
      digitId: [],
      digitTime: [],
      penTeam: "",
      dataPenalties: [],
      dataScore: [],
      digitTimeStart: null,
      digitTimeFinish: null,
      currentPort: "",
      isRankedDescending: false,
      participant: [],
      dataEvent: {},
      titleCategories: "",
    };
  },

  watch: {
    participant: {
      deep: true,
      handler: debounce(function () {
        if (this.selectedSprintKey) {
          saveLocalResults(this.selectedSprintKey, this.participantArr);
        }
      }, 250),
    },
  },

  computed: {
    // === SPRINT BUCKET ===
    currentEventId() {
      let fromEvent = "";
      if (
        this.dataEventSafe &&
        (this.dataEventSafe._id || this.dataEventSafe.id)
      ) {
        fromEvent = String(this.dataEventSafe._id || this.dataEventSafe.id);
      }
      let fromRoute = "";
      if (this.$route && this.$route.params && this.$route.params.id) {
        fromRoute = String(this.$route.params.id);
      }
      let fromBucket = "";
      const bucket = getBucket();
      if (bucket && bucket.eventId) fromBucket = String(bucket.eventId);

      return fromEvent || fromRoute || fromBucket || "";
    },

    divisions() {
      if (
        this.dataEventSafe &&
        Array.isArray(this.dataEventSafe.categoriesDivision)
      ) {
        return this.dataEventSafe.categoriesDivision.map((d) => ({
          id: String(d.value),
          name: String(d.name),
        }));
      }
      return [];
    },

    races() {
      if (
        this.dataEventSafe &&
        Array.isArray(this.dataEventSafe.categoriesRace)
      ) {
        return this.dataEventSafe.categoriesRace.map((r) => ({
          id: String(r.value),
          name: String(r.name),
        }));
      }
      return [];
    },

    initials() {
      if (
        this.dataEventSafe &&
        Array.isArray(this.dataEventSafe.categoriesInitial)
      ) {
        return this.dataEventSafe.categoriesInitial.map((i) => ({
          id: String(i.value),
          name: String(i.name),
        }));
      }
      return [];
    },
    currentDateTime() {
      const d = new Date();
      return (
        d.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " | " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
    },
    participantArr() {
      return Array.isArray(this.participant)
        ? this.participant
        : Object.values(this.participant || {});
    },
    dataEventSafe() {
      return this.dataEvent && typeof this.dataEvent === "object"
        ? this.dataEvent
        : {};
    },
    hasEventLogo() {
      var ev = this.dataEventSafe || {};
      var logos = ev.event_logo;
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
      var ev = this.dataEventSafe || {};
      var logos = ev.event_logo;
      if (Array.isArray(logos) && logos.length > 0) {
        var first = logos[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && typeof first.url === "string")
          return first.url;
      }
      return "";
    },
  },

  async mounted() {
    const socket = getSocket();

    const onConnect = () => {
      this.selfSocketId = socket.id || null;
    };
    socket.on("connect", onConnect);

    const onMessage = async (msg = {}) => {
      // abaikan echo dari diri sendiri
      if (
        msg &&
        msg.senderId &&
        this.selfSocketId &&
        msg.senderId === this.selfSocketId
      )
        return;

      // tampilkan toast (opsional)
      if (this.$bvToast) {
        this.$bvToast.toast(`${msg.from || "Realtime"}: ${msg.text || ""}`, {
          title: "Pesan Realtime",
          variant: "success",
          solid: true,
        });
      }

      // === mapping pesan Judges Dashboard ===
      // type: 'Start' | 'Finish', teamId: string, value: number
      if (
        msg &&
        msg.teamId &&
        (msg.type === "Start" || msg.type === "Finish")
      ) {
        await this.applyPenaltyFromSocket(msg);
        return;
      }

      // fallback lain (abaikan / logic lainmu)
    };

    socket.on("custom:event", onMessage);

    this.$once("hook:beforeDestroy", () => {
      socket.off("connect", onConnect);
      socket.off("custom:event", onMessage);
    });

    try {
      const events = localStorage.getItem("eventDetails");
      this.dataEvent = events ? JSON.parse(events) : {};
    } catch {
      this.dataEvent = {};
    }

    await this.loadDataScore("SPRINT");
    await this.loadDataPenalties("SPRINT");
    const ok = this.loadFromRaceStartPayload();
    if (!ok) await this.checkValueStorage();

    this.buildStaticSprintOptions();

    if (this.sprintBucketOptions.length) {
      const savedKey = localStorage.getItem("currentSprintBucketKey");
      this.selectedSprintKey =
        savedKey && this.sprintBucketMap[savedKey]
          ? savedKey
          : this.sprintBucketOptions[0].value;

      await this.fetchSprintBucketTeamsByKey(this.selectedSprintKey);
    } else {
      this.loadAllSprintBucketsFromEvent();
    }
  },

  beforeRouteLeave(to, from, next) {
    localStorage.removeItem("raceStartPayload");
    localStorage.removeItem("participantByCategories");
    localStorage.removeItem("currentCategories");

    next();
  },

  methods: {
    // ===== AGG BUILDER (safe, no optional chaining)
  buildAggregateFromDoc: function (doc, dataEventSafe) {
    var headerTitle = "";
    if (doc && typeof doc.eventName === "string") headerTitle = doc.eventName;
    if (!headerTitle && dataEventSafe && typeof dataEventSafe.eventName === "string") {
      headerTitle = dataEventSafe.eventName;
    }

    var sub = "";
    if (doc && typeof doc.divisionName === "string" && doc.divisionName) {
      sub = String(doc.divisionName);
    }
    if (doc && typeof doc.initialName === "string" && doc.initialName) {
      sub = sub ? sub + " • " + String(doc.initialName) : String(doc.initialName);
    }

    var d = new Date();
    var dateStr = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    var chief = "";
    if (dataEventSafe && typeof dataEventSafe.chiefJudge === "string") {
      chief = dataEventSafe.chiefJudge;
    }

    var header = {
      title: headerTitle || "—",
      subTitle: sub || "—",
      dateStr: dateStr,
      official: false,
      chiefJudge: chief || ""
    };

    // rows
    var rows = [];
    var arr = (doc && Array.isArray(doc.eventResult)) ? doc.eventResult : [];
    for (var i = 0; i < arr.length; i++) {
      var t = arr[i] || {};

      var teamName = (t && typeof t.teamName === "string") ? t.teamName : "";
      var bib = (t && typeof t.bib === "string") ? t.bib : "";
      var cats = (t && Array.isArray(t.categories)) ? t.categories : [];

      // default nilai
      var sprintScore = 0, sprintRank = 0;
      var h2hScore = 0, h2hRank = 0;
      var slalomScore = 0, slalomRank = 0;
      var drrScore = 0, drrRank = 0;

      for (var j = 0; j < cats.length; j++) {
        var c = cats[j] || {};
        var nm = (c && typeof c.name === "string") ? c.name.toUpperCase() : "";
        var sc = 0;
        var rk = 0;

        if (c && c.scored != null) {
          sc = Number(c.scored);
          if (!Number.isFinite(sc)) sc = Number(c.scored) || 0;
        }
        if (c && c.rankedByCats != null) {
          rk = Number(c.rankedByCats);
          if (!Number.isFinite(rk)) rk = Number(c.rankedByCats) || 0;
        }

        if (nm === "SPRINT") { sprintScore = sc; sprintRank = rk; }
        else if (nm === "HEADTOHEAD" || nm === "HEAD TO HEAD" || nm === "H2H") { h2hScore = sc; h2hRank = rk; }
        else if (nm === "SLALOM") { slalomScore = sc; slalomRank = rk; }
        else if (nm === "DRR" || nm === "DOWN RIVER RACE") { drrScore = sc; drrRank = rk; }
      }

      var totalScore = 0;
      if (t && t.totalScore != null) {
        totalScore = Number(t.totalScore);
        if (!Number.isFinite(totalScore)) totalScore = Number(t.totalScore) || 0;
      } else {
        totalScore = sprintScore + h2hScore + slalomScore + drrScore;
      }

      rows.push({
        no: i + 1,
        teamName: teamName,
        bib: bib,
        sprintScore: sprintScore,
        sprintRank: sprintRank,
        h2hScore: h2hScore,
        h2hRank: h2hRank,
        slalomScore: slalomScore,
        slalomRank: slalomRank,
        drrScore: drrScore,
        drrRank: drrRank,
        totalScore: totalScore
      });
    }

    // urutkan totalScore desc, lalu refresh nomor
    rows.sort(function (a, b) { return b.totalScore - a.totalScore; });
    for (var k = 0; k < rows.length; k++) rows[k].no = k + 1;

    return { header: header, rows: rows };
  },

  // ===== FETCH (pakai eventId + initialId + divisionId)
  fetchEventResultsAggregate: function () {
    var bucket = getBucket();
    var f = {
      eventId: bucket.eventId,
      initialId: bucket.initialId,
      divisionId: bucket.divisionId
    };
    console.log(f,'<< tes')
    var self = this;
    ipcRenderer.send("event-results:get", f);
    ipcRenderer.once("event-results:get-reply", function (_e, res) {
      console.log(res,'<<< cek')
      if (res && res.ok && res.doc) {
        var agg = self.buildAggregateFromDoc(res.doc, self.dataEventSafe);
        self.dataAggregate = agg;
        self.showOverallModal = true;
      } else {
        var det = (res && res.error) ? res.error : "Tidak ada data aggregate.";
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "Load Overall",
          detail: det
        });
      }
    });
  },
    // === SERIAL CONNECTION ===
    async connectPort() {
      if (!this.isPortConnected) {
        const PREFERRED_PATH = "/dev/tty.usbserial-120";
        const ports = await listPorts();
        this.currentPort = ports;
        const portIndex = ports.findIndex(
          (p) => String(p.path) === PREFERRED_PATH
        );

        if (portIndex === -1) {
          this.notify(
            "warning",
            `Preferred port not found: ${PREFERRED_PATH}`,
            "Device"
          );
          alert("Preferred port not found");
          return;
        }

        this.selectPath = ports[portIndex].path;

        this.serialCtrl = createSerialReader({
          baudRate: this.baudRate,
          portIndex: portIndex,
          onNotify: (type, detail, message) =>
            this.notify(type, detail, message),
          onData: (a, b) => {
            this.digitId.unshift(a);
            this.digitTime.unshift(b);
          },
          onStart: (formatted /*, a, b*/) => {
            this.digitTimeStart = formatted;
          },
          onFinish: (formatted /*, a, b*/) => {
            this.digitTimeFinish = formatted;
          },
        });

        const res = await this.serialCtrl.connect();
        if (res.ok) {
          this.isPortConnected = true;
          this.port = this.serialCtrl.port; // kalau perlu akses instance
          alert("Connected");
        } else {
          this.isPortConnected = false;
          alert("No valid serial port found / failed to open.");
        }
      } else {
        await this.disconnected();
        this.isPortConnected = false;
        alert("Disconnected");
      }
    },

    async disconnected() {
      try {
        if (this.serialCtrl) await this.serialCtrl.disconnect();
      } finally {
        this.port = null;
        this.serialCtrl = null;
        this.isPortConnected = false;
        this.selectPath = null;
      }
    },

    setBaud(br) {
      this.baudRate = br;
    },
    // === END CONNECTION ===

    // === NOTIFY ===
    notify(type, detail, message = "Info") {
      if (this.$ipc || (window && window.ipcRenderer)) {
        const ir = this.$ipc || window.ipcRenderer;
        ir.send && ir.send("get-alert", { type, detail, message });
      }
      // bisa juga set state:
      this.lastErrorMessage = `${message}: ${detail}`;
    },

    notifyError(err, message = "Error") {
      const detail =
        (err && (err.message || err.toString())) || "Unknown error";
      this.notify("error", detail, message);
    },
    // ======

    /* =========================================================
     * SOCKET / IPC (opsional)
     * =======================================================*/
    // sendRealtimeMessage() {
    //   const socket = getSocket();
    //   socket.emit(
    //     "custom:event",
    //     {
    //       senderId: socket.id,
    //       from: "Sustainable Timing System",
    //       text: "Terima kasih, udah gue teerima beks nilai penaltynya",
    //       ts: new Date().toISOString(),
    //     },
    //     (ok) => {
    //       if (!ok) {
    //         ipcRenderer.send("get-alert", {
    //           type: "error",
    //           message: "Gagal mengirim pesan realtime",
    //           detail: "Silakan cek koneksi broker/socket.",
    //         });
    //       }
    //     }
    //   );
    // },

    async applyPenaltyFromSocket(payload = {}) {
      const teamId = String(payload.teamId || "");
      if (!teamId) return;

      // cari tim lokal
      const items = this.participantArr;
      const idx = items.findIndex((t) => String(t.teamId || "") === teamId);
      if (idx === -1) return;

      const local = items[idx];

      // tentukan field target dari msg.type
      const kind = String(payload.type || "").toLowerCase(); // 'start' | 'finish'
      const field =
        kind === "start"
          ? "startPenalty"
          : kind === "finish"
          ? "finishPenalty"
          : null;

      if (!field) return;

      // normalisasi angka
      const numVal =
        payload.value === "" || payload.value == null
          ? 0
          : Number(payload.value);

      // set nilai penalty → ini otomatis mengikat dengan v-model.number di <b-select>
      this.$set(local.result, field, numVal);

      // hitung ulang penalty utk baris ini
      await this.recalcPenalties(local);

      // tulis balik agar reaktif
      if (Array.isArray(this.participant)) {
        this.$set(this.participant, idx, { ...local });
      }

      // refresh ranking bila totalTime berubah
      await this.assignRanks(this.participantArr);
    },
    /* =========================================================*/

    // === LOAD PAYLOAD ===
    loadFromRaceStartPayload() {
      const { bucket } = loadRaceStartPayloadForSprint();
      if (!bucket || !Array.isArray(bucket.teams) || bucket.teams.length === 0)
        return false;

      this.participant = bucket.teams.slice();
      this.titleCategories =
        `${bucket.divisionName} ${bucket.raceName} – ${bucket.initialName}`.trim();

      try {
        const events = localStorage.getItem("eventDetails");
        this.dataEvent = events ? JSON.parse(events) : {};
      } catch {
        this.dataEvent = {};
      }
      return true;
    },

    async checkValueStorage() {
      let dataStorage = null,
        events = null;
      try {
        dataStorage = localStorage.getItem("participantByCategories");
        events = localStorage.getItem("eventDetails");
      } catch (e) {
        // fallback aman bila storage tidak tersedia / rusak
        dataStorage = null;
        events = null;
      }

      this.dataEvent = events ? JSON.parse(events) : {};

      const raw = dataStorage ? JSON.parse(dataStorage) : [];
      const arr = Array.isArray(raw) ? raw : Object.values(raw || {});
      arr.sort((a, b) =>
        String(a.praStart || "").localeCompare(String(b.praStart || ""))
      );

      this.participant = arr;
      this.titleCategories = String(
        localStorage.getItem("currentCategories") || ""
      ).trim();
    },

    async loadDataScore(type) {
      try {
        ipcRenderer.send("option-ranked", type);
        ipcRenderer.once("option-ranked-reply", (_e, payload) => {
          if (payload) {
            this.dataScore = payload[0].data;
          } else {
            this.dataScore = [];
          }
        });
      } catch (error) {
        this.dataScore = [];
      }
    },

    async loadDataPenalties(type) {
      try {
        ipcRenderer.send("option-penalties", type);
        ipcRenderer.once("option-penalties-reply", (_e, payload) => {
          if (payload) {
            this.dataPenalties = payload[0].data;
          } else {
            this.dataPenalties = [];
          }
        });
      } catch (error) {
        this.dataPenalties = [];
      }
    },

    loadAllSprintBucketsFromEvent() {
      try {
        const raw = localStorage.getItem("eventDetails");
        const ev = raw ? JSON.parse(raw) : {};
        const participant = Array.isArray(ev.participant) ? ev.participant : [];
        const sprintBuckets = participant.filter(
          (b) => String(b.eventName || "").toUpperCase() === "SPRINT"
        );

        const map = Object.create(null);
        const opts = [];

        sprintBuckets.forEach((b) => {
          const key = this._sprintBucketKey(b);
          const label = this._sprintBucketLabel(b);
          const normalizedTeams = Array.isArray(b.teams)
            ? b.teams.map(normalizeTeamForSprint)
            : [];

          map[key] = { ...b, teams: normalizedTeams };
          opts.push({ value: key, text: label });
        });

        this.sprintBucketMap = map;
        this.sprintBucketOptions = opts;

        const savedKey = localStorage.getItem("currentSprintBucketKey");
        if (savedKey && map[savedKey]) {
          this._useSprintBucket(savedKey);
          this.selectedSprintKey = savedKey;
        } else if (opts.length) {
          this._useSprintBucket(opts[0].value);
          this.selectedSprintKey = opts[0].value;
        }
      } catch {
        /* noop */
      }
    },
    // ======

    // === ON SELECT LOAD PAYLOAD ===
    async onSelectSprintBucket(key) {
      await this.fetchSprintBucketTeamsByKey(key);
    },

    // --- fetch teams via IPC (khusus Sprint) ---
    async fetchSprintBucketTeamsByKey(key) {
      try {
        this.isLoading = true;

        if (
          !key ||
          !this.sprintBucketMap[key] ||
          typeof ipcRenderer === "undefined"
        )
          return;

        const b = this.sprintBucketMap[key];
        const filters = {
          eventId: String(b.eventId),
          initialId: String(b.initialId),
          raceId: String(b.raceId),
          divisionId: String(b.divisionId),
        };

        this.selectedSprintKey = key;
        localStorage.setItem("currentSprintBucketKey", key);
        const res = await new Promise((resolve) => {
          ipcRenderer.once(
            "teams-sprint-registered:find-reply",
            (_e, payload) => resolve(payload)
          );
          ipcRenderer.send("teams-sprint-registered:find", filters);
        });

        if (!res || !res.ok) {
          this.participant = [];
          this._useSprintBucket(key);
          return;
        }

        const doc = Array.isArray(res.items) ? res.items[0] : res.items;
        const teams =
          doc && Array.isArray(doc.teams)
            ? doc.teams.map(normalizeTeamForSprint)
            : [];
        this.sprintBucketMap[key] = { ...b, teams };
        this._useSprintBucket(key);
      } catch {
        this._useSprintBucket(key);
      }
      this.isLoading = false;
    },

    // ======

    _sprintBucketKey(b) {
      const ei = b && b.eventId ? String(b.eventId) : "";
      const ii = b && b.initialId ? String(b.initialId) : "";
      const ri = b && b.raceId ? String(b.raceId) : "";
      const di = b && b.divisionId ? String(b.divisionId) : "";
      return [ei, ii, ri, di].join("|");
    },
    _sprintBucketLabel(b) {
      const div = (
        b && b.divisionName ? String(b.divisionName) : ""
      ).toUpperCase();
      const rac = (b && b.raceName ? String(b.raceName) : "").toUpperCase();
      const ini = (
        b && b.initialName ? String(b.initialName) : ""
      ).toUpperCase();
      return `${div} ${rac} – ${ini}`;
    },
    _useSprintBucket(key) {
      const b = this.sprintBucketMap[key];
      if (!b) return;
      this.participant = (b.teams || []).map((t) => ({ ...t }));

      const cached = loadLocalResults(key);
      if (cached.length) {
        this.participant = mergeTeamsWithCache(this.participant, cached);
      }
      this.titleCategories = this._sprintBucketLabel(b);
      localStorage.setItem("currentSprintBucketKey", key);
      try {
        const raw = localStorage.getItem("raceStartPayload") || "{}";
        const obj = JSON.parse(raw || "{}") || {};
        obj.bucket =
          obj.bucket && typeof obj.bucket === "object" ? obj.bucket : {};
        obj.bucket.eventId = String(b.eventId || "");
        obj.bucket.initialId = String(b.initialId || "");
        obj.bucket.raceId = String(b.raceId || "");
        obj.bucket.divisionId = String(b.divisionId || "");
        obj.bucket.eventName = "SPRINT";
        obj.bucket.initialName = String(b.initialName || "");
        obj.bucket.raceName = String(b.raceName || "");
        obj.bucket.divisionName = String(b.divisionName || "");
        localStorage.setItem("raceStartPayload", JSON.stringify(obj));
      } catch (err) {
        logger.warn("❌ Failed to update race settings:", err);
      }
      this.assignRanks(this.participantArr);
    },

    buildStaticSprintOptions() {
      const eventId = this.currentEventId || "";
      if (!eventId) {
        this.sprintBucketOptions = [];
        this.sprintBucketMap = {};
        return;
      }

      const divs = this.divisions.length
        ? this.divisions
        : [
            { id: "1", name: "R4" },
            { id: "2", name: "R6" },
          ];
      const races = this.races.length
        ? this.races
        : [
            { id: "1", name: "MEN" },
            { id: "2", name: "WOMEN" },
          ];
      const inits = this.initials.length
        ? this.initials
        : [
            { id: "1", name: "YOUTH" },
            { id: "2", name: "JUNIOR" },
            { id: "3", name: "OPEN" },
          ];

      const opts = [];
      const map = Object.create(null);

      divs.forEach((div) => {
        races.forEach((race) => {
          inits.forEach((init) => {
            const key = [eventId, init.id, race.id, div.id]
              .map(String)
              .join("|");
            const label = `${div.name} ${race.name} – ${init.name}`;
            opts.push({ value: key, text: label });
            map[key] = {
              eventId,
              initialId: String(init.id),
              raceId: String(race.id),
              divisionId: String(div.id),
              eventName: "SPRINT",
              initialName: String(init.name),
              raceName: String(race.name),
              divisionName: String(div.name),
              teams: [],
            };
          });
        });
      });

      this.sprintBucketOptions = opts;
      this.sprintBucketMap = map;
    },

    resetRow(item) {
      item.result.startTime = "";
      item.result.finishTime = "";
      item.result.raceTime = "";
      item.result.startPenalty = 0;
      item.result.finishPenalty = 0;
      item.result.totalPenalty = 0;
      item.result.penaltyTime = "";
      item.result.totalTime = "";
      item.result.ranked = "";
      item.result.score = "";
      this.assignRanks(this.participantArr);

      this.$forceUpdate();
    },

    parsesTime(timeStr) {
      const [hours, minutes, seconds] = String(timeStr || "0:0:0")
        .split(":")
        .map(parseFloat);
      return hours * 3600 * 1000 + minutes * 60 * 1000 + seconds * 1000;
    },

    async recalcPenalties(item) {
      const sp = this.findPenalty(item.result.startPenalty);
      const fp = this.findPenalty(item.result.finishPenalty);

      item.result.startPenaltyTime = sp.timePen;
      item.result.finishPenaltyTime = fp.timePen;

      item.result.totalPenalty = Number(sp.value) + Number(fp.value);

      const totalPenaltyTime = await this.tambahWaktu(sp.timePen, fp.timePen);
      item.result.totalPenaltyTime = totalPenaltyTime;

      item.result.penaltyTime = totalPenaltyTime;
      if (item.result.raceTime) {
        item.result.totalTime = await this.tambahWaktu(
          item.result.raceTime,
          totalPenaltyTime
        );
      }

      this.endGame = true;
      await this.assignRanks(this.participant);
    },

    findPenalty(val) {
      return (
        this.dataPenalties.find((p) => Number(p.value) === Number(val)) || {
          value: 0,
          timePen: "00:00:00.000",
        }
      );
    },

    async updateStartPenalty(item) {
      await this.recalcPenalties(item);
    },

    async updateFinishPenalty(item) {
      await this.recalcPenalties(item);
    },

    async assignRanks(items) {
      const itemsWithTimeResult = items.filter((item) => item.result.totalTime);
      itemsWithTimeResult.sort(
        (a, b) =>
          this.parsesTime(a.result.totalTime) -
          this.parsesTime(b.result.totalTime)
      );
      itemsWithTimeResult.forEach((item, index) => {
        item.result.ranked = index + 1;
      });
    },

    getScoreByRanked(ranked) {
      const m = this.dataScore.find((d) => d.ranking === ranked);
      return m ? m.score : null;
    },

    toggleSortRanked() {
      this.isRankedDescending = !this.isRankedDescending;
      const arr = this.participantArr.slice();
      arr.sort((a, b) =>
        this.isRankedDescending
          ? b.result.ranked - a.result.ranked
          : a.result.ranked - b.result.ranked
      );
      this.participant = arr;
    },

    async updateTime(val, id, title) {
      if (!Array.isArray(this.participant) || !this.participant[id]) return;
      const row = this.participant[id];

      if (title === "start") row.result.startTime = val;
      if (title === "finish") {
        row.result.finishTime = val;
      }

      if (row.result.startTime && row.result.finishTime) {
        row.result.raceTime = await this.hitungSelisihWaktu(
          row.result.startTime,
          row.result.finishTime
        );

        await this.recalcPenalties(row);
      }
    },

    async hitungSelisihWaktu(waktuAwal, waktuAkhir) {
      const [h1, m1, s1] = String(waktuAwal).split(":");
      const [h2, m2, s2] = String(waktuAkhir).split(":");

      const d1 = new Date(0);
      d1.setUTCHours(
        +h1 || 0,
        +m1 || 0,
        parseInt((s1 || "0").split(".")[0]) || 0,
        parseInt((s1 || "0").split(".")[1]) || 0
      );
      const d2 = new Date(0);
      d2.setUTCHours(
        +h2 || 0,
        +m2 || 0,
        parseInt((s2 || "0").split(".")[0]) || 0,
        parseInt((s2 || "0").split(".")[1]) || 0
      );

      const diff = d2 - d1;
      const ms = diff % 1000;
      const sec = Math.floor((diff / 1000) % 60);
      const min = Math.floor((diff / (1000 * 60)) % 60);
      const hr = Math.floor(diff / (1000 * 60 * 60));

      const pad2 = (n) => String(n).padStart(2, "0");
      const pad3 = (n) => String(n).padStart(3, "0");
      return `${pad2(hr)}:${pad2(min)}:${pad2(sec)}.${pad3(ms)}`;
    },

    async tambahWaktu(waktuA, waktuB) {
      const psA = String(waktuA).split(":");
      const psB = String(waktuB).split(":");
      const msA =
        (+psA[0] || 0) * 3600000 +
        (+psA[1] || 0) * 60000 +
        (parseFloat(psA[2]) || 0) * 1000;
      const msB =
        (+psB[0] || 0) * 3600000 +
        (+psB[1] || 0) * 60000 +
        (parseFloat(psB[2]) || 0) * 1000;
      const total = msA + msB;
      const hr = Math.floor(total / 3600000);
      const rem = total % 3600000;
      const min = Math.floor(rem / 60000);
      const rem2 = rem % 60000;
      const sec = Math.floor(rem2 / 1000);
      const ms = rem2 % 1000;
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
    },

    // saveResult() {
    //   const clean = JSON.parse(JSON.stringify(this.participantArr || []));
    //   if (!Array.isArray(clean) || clean.length === 0) {
    //     ipcRenderer.send("get-alert", {
    //       type: "warning",
    //       detail: "Belum ada data yang bisa disimpan.",
    //       message: "Ups Sorry",
    //     });
    //     return;
    //   }

    //   const bucket = getBucket();
    //   const must = ["eventId", "initialId", "raceId", "divisionId"];
    //   const missing = must.filter((k) => !bucket[k]);
    //   if (missing.length) {
    //     ipcRenderer.send("get-alert", {
    //       type: "error",
    //       detail: `Bucket fields missing: ${missing.join(", ")}`,
    //       message: "Failed",
    //     });
    //     return;
    //   }

    //   const docs = buildResultDocs(clean, bucket);
    //   ipcRenderer.send("insert-sprint-result", docs);
    //   ipcRenderer.once("insert-sprint-result-reply", (_e, res) => {
    //     if (res && res.ok) {
    //       ipcRenderer.send("get-alert-saved", {
    //         type: "question",
    //         detail: "Result data has been successfully saved",
    //         message: "Successfully",
    //       });
    //     } else {
    //       ipcRenderer.send("get-alert", {
    //         type: "error",
    //         detail: (res && res.error) || "Save failed",
    //         message: "Failed",
    //       });
    //     }
    //   });
    // },

    // === tambahkan di methods: ===
    async saveResult() {
      // 1) clone aman
      var clean;
      try {
        clean = JSON.parse(JSON.stringify(this.participantArr || []));
      } catch (e) {
        clean = [];
      }
      if (!Array.isArray(clean) || clean.length === 0) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail: "Belum ada data yang bisa disimpan.",
          message: "Ups Sorry",
        });
        return;
      }

      // 2) validasi bucket
      var bucket = getBucket();
      var must = ["eventId", "initialId", "raceId", "divisionId"];
      var missing = [];
      for (var i = 0; i < must.length; i++) {
        var k = must[i];
        if (!bucket[k]) missing.push(k);
      }
      if (missing.length > 0) {
        ipcRenderer.send("get-alert", {
          type: "error",
          detail: "Bucket fields missing: " + missing.join(", "),
          message: "Failed",
        });
        return;
      }

      // 3) simpan hasil SPRINT
      var docs = buildResultDocs(clean, bucket);
      ipcRenderer.send("insert-sprint-result", docs);

      var self = this;
      ipcRenderer.once("insert-sprint-result-reply", function (_e, res) {
        var ok = res && res.ok ? true : false;
        if (ok) {
          ipcRenderer.send("get-alert-saved", {
            type: "question",
            detail: "Result data has been successfully saved",
            message: "Successfully",
          });

          // 4) lanjut upsert dokumen rekap eventResult
          if (self && typeof self.upsertEventResults === "function") {
            self.upsertEventResults(bucket, clean);
          }
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            detail: res && res.error ? res.error : "Save failed",
            message: "Failed",
          });
        }
      });
    },

    // // === dipanggil setelah insert-sprint-result sukses ===
    upsertEventResults(bucket, participantArr) {
      var payload = {
        eventId: bucket.eventId,
        initialId: bucket.initialId,
        raceId: bucket.raceId,
        divisionId: bucket.divisionId,
        eventName: bucket.eventName,
        initialName: bucket.initialName,
        raceName: bucket.raceName,
        divisionName: bucket.divisionName,
        eventResult: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // isi eventResult per tim (tanpa optional-chaining)
      for (var i = 0; i < participantArr.length; i++) {
        var t = participantArr[i];

        var teamData = {
          teamId: t && t.teamId ? t.teamId : "",
          teamName: t && t.nameTeam ? t.nameTeam : "",
          bib: t && t.bibTeam ? t.bibTeam : "",
          categories: [],
          totalScore: t && t.result && t.result.score ? t.result.score : "",
          totalRanked: t && t.result && t.result.ranked ? t.result.ranked : "",
        };

        var cat1 = { name: "SPRINT", scored: "", rankedByCats: "" };
        if (t && t.result) {
          cat1.scored = t.result.score ? t.result.score : "";
          cat1.rankedByCats = t.result.ranked ? t.result.ranked : "";
        }
        var cat2 = { name: "HEADTOHEAD", scored: "", rankedByCats: "" };
        var cat3 = { name: "SLALOM", scored: "", rankedByCats: "" };
        var cat4 = { name: "DRR", scored: "", rankedByCats: "" };

        teamData.categories.push(cat1);
        teamData.categories.push(cat2);
        teamData.categories.push(cat3);
        teamData.categories.push(cat4);

        payload.eventResult.push(teamData);
      }

      // kirim upsert
      ipcRenderer.send("event-results:upsert", payload);

      ipcRenderer.once("event-results:upsert-reply", function (_e, res) {
        var ok = res && res.ok ? true : false;
        if (ok) {
          ipcRenderer.send("get-alert-saved", {
            type: "info",
            message: "Event Results Updated",
            detail: "Successfully upserted event result document",
          });
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Upsert failed",
            detail: res && res.error ? res.error : "Unknown error",
          });
        }
      });
    },

    goTo() {
      localStorage.removeItem("raceStartPayload");
      localStorage.removeItem("participantByCategories");
      localStorage.removeItem("currentCategories");

      this.participant = [];
      this.titleCategories = "";
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },
  },
};
</script>

<style scoped>
.racetime-header {
  display: flex;
  flex-direction: column; /* susun vertikal */
  align-items: flex-start; /* rata kiri */
  gap: 2px; /* jarak kecil antara h4 dan small */
}

.racetime-header h4 {
  margin: 0;
  font-weight: 700;
  color: #1c4c7a;
}

.racetime-header small {
  color: #6c757d;
  font-size: 0.875rem;
}
/* ---- Styling utk Switch DRR Category select ---- */
.sprint-actionbar__select {
  min-width: 260px;
  flex: 1 1 260px;
}

.sprint-actionbar__select #sprintBucketSelect {
  border-radius: 12px;
  cursor: pointer;
}

#sprintBucketSelect {
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
}

#sprintBucketSelect:hover {
  border-color: rgb(0, 180, 255);
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
}
/* ---- End styling utk Switch DRR Category select ---- */

/* ---- Styling utk penalty section select ---- */
.small-select {
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-bottom: 6px;
}

.small-select:hover {
  border-color: rgb(0, 180, 255);
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
}

/* ===== STYLING FONT RACETIME ===== */
.large-bold {
  font-size: 1.2rem;
  font-weight: bold;
}
.max-char {
  max-width: 260px;
  word-wrap: break-word;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}
.text-strong {
  color: #000;
}
.penalty-char {
  color: red;
}
.result-char {
  color: green;
}
.text-monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

/* ===== HERO / BANNER ===== */
.detail-hero {
  position: relative;
  overflow: hidden;
}
.detail-hero .hero-bg {
  position: absolute;
  inset: 0;
  background-image: url("https://images.unsplash.com/photo-1709810953776-ee6027ff8104?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
  background-size: cover;
  background-position: center;
}
.detail-hero .hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45));
}
.detail-hero .hero-inner {
  position: relative;
  z-index: 1;
  padding: 50px;
}
.detail-hero h2 {
  color: #fff;
  font-weight: 800;
  font-size: clamp(26px, 4.2vw, 46px);
  line-height: 1.05;
  margin-bottom: 6px !important;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
  letter-spacing: 0.2px;
}
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

/* ===== TABLE ===== */
table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 12px;
  overflow: hidden;
}
thead {
  background: #383838;
  color: #fff;
  font-weight: 600;
}
thead th {
  padding: 12px 15px;
  text-align: left;
  font-size: 14px;
  border-bottom: 2px solid #f1f1f1;
}
tbody tr:nth-child(odd) {
  background: #f9f9f9;
}
tbody tr:nth-child(even) {
  background: #f2f2f2;
}
th,
td {
  border: none;
}

/* ===== PORT ===== */
.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 0;
  transition: background-color 0.3s;
}
.connected {
  background: rgb(0, 255, 0);
}
.disconnected {
  background: red;
}

/* ===== Buttons ===== */
.btn-action {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
}

/* PATH  */
.controls-bar {
  gap: 10px;
}

/* Pill path */
.path-pill {
  display: inline-flex;
  align-items: center;
  max-width: 520px;
  background: #fff;
  color: #0f172a;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  padding: 6px 12px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  font-weight: 600;
  font-size: 0.9rem;
}
.path-pill--empty {
  color: #64748b;
  background: #f8fafc;
  border-color: #e5e7eb;
}
.path-pill .truncate {
  display: inline-block;
  max-width: 460px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Meta Panel  */
.meta-panel {
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 6px 16px rgba(16, 24, 40, 0.04);
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #eef2f7;
}
.meta-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.meta-label {
  min-width: 120px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #334155;
  font-style: italic;
}
.meta-value {
  font-weight: 600;
  color: #0f172a;
}
.badge-chip {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.85rem;
  border: 1px solid transparent;
}
.badge-chip--blue {
  background: #eef6ff;
  color: rgb(0, 180, 255);
  border-color: #dbeafe;
}

/* Responsif: di layar kecil, label di atas value */
@media (max-width: 575.98px) {
  .meta-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 0;
  }
  .meta-label {
    min-width: auto;
  }
  .meta-panel {
    padding: 12px;
  }
}
</style>
