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
              <Icon icon="mdi:shield-crown" width="56" height="56" />
            </div>
          </b-col>

          <b-col>
            <h2 class="h1 font-weight-bold mb-1 text-white">
              {{
                dataEventSafe.eventName ||
                "Kejurnas Arung Jeram DKI Jakarta 2025"
              }}
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
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="participantArr"
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />

    <!-- LIST RESULT -->
    <div class="px-4 mt-2">
      <div class="card-body">
        <div class="d-flex justify-content-between mb-2">
          <!-- <div > -->
            <h4>Output Racetime :</h4>
          <!-- </div> -->
          <div>
            <button
              type="button"
              class="btn-action btn-secondary mr-2"
              @click="saveResult"
            >
              <Icon icon="icon-park-outline:save" /> Save Result
            </button>

            <button
              type="button"
              class="btn-action btn-info"
              @click="toggleSortRanked"
            >
              <Icon icon="icon-park-outline:ranking" /> Sort Ranked
            </button>
          </div>
        </div>
        <b-row>
          <b-col>
            <table class="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Team Name</th>
                  <th>BIB Number</th>
                  <th>Start Time</th>
                  <th>Finish Time</th>
                  <th>Race Time</th>

                  <!-- urutan baru -->
                  <th>Start Penalties</th>
                  <!-- REMOVED: Penalties (legacy/middle) column -->
                  <th>Finish Penalties</th>
                  <th>Total Penalties</th>
                  <th>Penalty Time</th>

                  <th>Result</th>
                  <th>Ranked</th>
                  <th>Score</th>
                  <th v-if="editResult">Action</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(item, index) in participantArr" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.nameTeam }}</td>
                  <td>{{ item.bibTeam }}</td>
                  <td>{{ item.result.startTime }}</td>
                  <td>{{ item.result.finishTime }}</td>
                  <td>{{ item.result.raceTime }}</td>

                  <!-- Start Penalties -->
                  <td>
                    <b-select
                      v-if="item.result.startTime"
                      v-model.number="item.result.startPenalty"
                      @change="updateStartPenalty(item)"
                    >
                      <option
                        v-for="p in dataPenalties"
                        :key="'sp' + p.value"
                        :value="p.value"
                      >
                        {{ p.value }}
                      </option>
                    </b-select>
                  </td>

                  <!-- REMOVED: Penalties (legacy / middle) select -->

                  <!-- Finish Penalties -->
                  <td>
                    <b-select
                      v-if="item.result.finishTime"
                      v-model.number="item.result.finishPenalty"
                      @change="updateFinishPenalty(item)"
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

                  <!-- Total Penalties (detik) -->
                  <td>{{ item.result.totalPenalty }}</td>

                  <!-- Penalty Time total (format waktu) -->
                  <td>{{ item.result.penaltyTime }}</td>

                  <td>
                    {{
                      item.result.penaltyTime
                        ? item.result.totalTime
                        : item.result.raceTime
                    }}
                  </td>
                  <td>{{ item.result.ranked }}</td>
                  <td>{{ getScoreByRanked(item.result.ranked) }}</td>
                  <td v-if="editResult">
                    <button
                      type="button"
                      class="btn-action btn-warning"
                      @click="openModal(item, 'R4men')"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <br />
          </b-col>
        </b-row>
        <b-button @click="goTo()" variant="outline-secondary" class="btn-action">
          <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
        </b-button>
      </div>

    </div>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { createSerialReader, listPorts } from "@/utils/serialConnection.js";
import OperationTimePanel from "@/components/race/OperationTeamPanel.vue";
import { Icon } from "@iconify/vue2";

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

    // pastikan string/angka aman
    result.startTime = String(result.startTime || "");
    result.finishTime = String(result.finishTime || "");
    result.raceTime = String(result.raceTime || "");

    // normalisasi penalti (HANYA start & finish)
    result.startPenalty = Number.isFinite(result.startPenalty)
      ? Number(result.startPenalty)
      : 0;
    result.finishPenalty = Number.isFinite(result.finishPenalty)
      ? Number(result.finishPenalty)
      : 0;

    // legacy middle penalty di-nolkan dan tidak digunakan
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

    // sinkronisasi legacy
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
      // === KUNCI RELASI (HARUS SAMA DGN TEAMS REGISTERED) ===
      eventId: bucket.eventId,
      initialId: bucket.initialId,
      raceId: bucket.raceId,
      divisionId: bucket.divisionId,
      eventName: bucket.eventName,
      initialName: bucket.initialName,
      raceName: bucket.raceName,
      divisionName: bucket.divisionName,

      // === DATA TIM + HASIL ===
      ...team,
      result,
      otr,

      // meta optional
      createdAt: now,
      updatedAt: now,
    };
  });
}

function normalizeTeamForSprint(t = {}) {
  const base = {
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

    // hanya 2 penalti aktif (start & finish)
    startPenalty: 0,
    finishPenalty: 0,

    // legacy, dibiarkan ada tapi tidak dipakai
    penalty: 0,

    startPenaltyTime: "00:00:00.000",
    finishPenaltyTime: "00:00:00.000",
    totalPenalty: 0, // angka detik (akumulasi)
    totalPenaltyTime: "00:00:00.000",

    penaltyTime: "", // legacy (diset = totalPenaltyTime)
    totalTime: "",
    ranked: "",
    score: "",
  };

  // dukung format lama (array result)
  let result = t.result;
  if (Array.isArray(result)) result = result[0] || {};
  if (!result || typeof result !== "object") result = {};
  result = { ...emptyRes, ...result };

  let otr = t.otr;
  if (!otr || typeof otr !== "object") otr = {};
  otr = { ...emptyRes, ...otr };

  return { ...base, result, otr };
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
  components: { OperationTimePanel, Icon },

  data() {
    return {
      selectPath: "",
      baudRate: 9600,
      baudOptions: [1200, 2400, 9600],
      serialCtrl: null,
      editForm: "",
      editResult: false,
      isScrolled: false,
      port: null,
      isPortConnected: false,
      digitId: [],
      digitTime: [],
      penTeam: "",
      dataPenalties: [
        { label: "clear", value: 0, timePen: "00:00:00.000" },
        { label: "pen 1", value: 5, timePen: "00:00:05.000" },
        { label: "pen 2", value: 50, timePen: "00:00:50.000" },
      ],
      dataScore: [
        { ranking: 1, score: 100 },
        { ranking: 2, score: 92 },
        { ranking: 3, score: 86 },
        { ranking: 4, score: 82 },
        { ranking: 5, score: 79 },
        { ranking: 6, score: 76 },
        { ranking: 7, score: 73 },
        { ranking: 8, score: 70 },
        { ranking: 9, score: 67 },
        { ranking: 10, score: 64 },
        { ranking: 11, score: 61 },
        { ranking: 12, score: 58 },
        { ranking: 13, score: 55 },
        { ranking: 14, score: 52 },
        { ranking: 15, score: 49 },
        { ranking: 16, score: 46 },
        { ranking: 17, score: 43 },
        { ranking: 18, score: 40 },
        { ranking: 19, score: 38 },
        { ranking: 20, score: 36 },
        { ranking: 21, score: 34 },
        { ranking: 22, score: 32 },
        { ranking: 23, score: 30 },
        { ranking: 24, score: 28 },
        { ranking: 25, score: 26 },
        { ranking: 26, score: 24 },
        { ranking: 27, score: 22 },
        { ranking: 28, score: 20 },
        { ranking: 29, score: 18 },
        { ranking: 30, score: 16 },
        { ranking: 31, score: 14 },
        { ranking: 32, score: 12 },
      ],
      digitTimeStart: null,
      digitTimeFinish: null,
      currentPort: "",
      isRankedDescending: false,

      /** penting: tipe konsisten */
      participant: [],
      dataEvent: {},
      titleCategories: "",
    };
  },

  computed: {
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
  },

  async mounted() {
    window.addEventListener("scroll", this.handleScroll);
    const ok = this.loadFromRaceStartPayload();
    if (!ok) await this.checkValueStorage();
  },

  beforeDestroy() {
    window.removeEventListener("scroll", this.handleScroll);
  },

  /** gunakan guard rute yang benar (bukan di methods) */
  beforeRouteLeave(to, from, next) {
    localStorage.removeItem("raceStartPayload");
    localStorage.removeItem("participantByCategories");
    localStorage.removeItem("currentCategories");

    next();
  },

  methods: {
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

        console.log(this.serialCtrl, "<<<< cek");

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
    // ======

    setBaud(br) {
      this.baudRate = br;
    },

    openModal(datas) {
      this.editForm = datas;
      this.$bvModal &&
        this.$bvModal.show &&
        this.$bvModal.show("bv-modal-edit-team");
    },

    async calculateScore(ranked) {
      const scoreData = this.dataScore.find((d) => d.ranking === ranked);
      return scoreData ? scoreData.score : 0;
    },

    parsesTime(timeStr) {
      const [hours, minutes, seconds] = String(timeStr || "0:0:0")
        .split(":")
        .map(parseFloat);
      return hours * 3600 * 1000 + minutes * 60 * 1000 + seconds * 1000;
    },

    async parseTimeResult(timeResult) {
      const parts = String(timeResult || "00:00:00:000").split(":");
      const [hours, minutes, seconds, milliseconds] = parts.map(
        (p) => parseInt(p, 10) || 0
      );
      return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
    },

    async recalcPenalties(item) {
      const sp = this.findPenalty(item.result.startPenalty);
      const fp = this.findPenalty(item.result.finishPenalty);

      item.result.startPenaltyTime = sp.timePen;
      item.result.finishPenaltyTime = fp.timePen;

      // total angka penalti (detik) hanya dari start+finish
      item.result.totalPenalty = Number(sp.value) + Number(fp.value);

      // total waktu penalti = start + finish
      const totalPenaltyTime = await this.tambahWaktu(sp.timePen, fp.timePen);
      item.result.totalPenaltyTime = totalPenaltyTime;

      // sinkron legacy
      item.result.penaltyTime = totalPenaltyTime;

      // total lomba = raceTime + penaltyTime (jika raceTime ada)
      if (item.result.raceTime) {
        item.result.totalTime = await this.tambahWaktu(
          item.result.raceTime,
          totalPenaltyTime
        );
      }

      this.editResult = true;
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

    async resetRace() {
      this.editResult = false;
    },

    async checkingPenalties() {
      for (let i = 0; i < this.participant.length; i++) {
        await this.recalcPenalties(this.participant[i]);
      }
      this.editResult = true;
      await this.assignRanks(this.participant);
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

    formatTime(inputTime) {
      const hours = String(inputTime).substr(0, 2);
      const minutes = String(inputTime).substr(2, 2);
      const seconds = String(inputTime).substr(4, 2);
      const milliseconds = String(inputTime).substr(6);
      const correctedMinutes = Math.min(parseInt(minutes, 10) || 0, 59);
      const correctedSeconds = Math.min(parseInt(seconds, 10) || 0, 59);
      return `${hours}:${correctedMinutes}:${correctedSeconds}.${milliseconds}`;
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
        // panggil kalkulasi penalti agar totalTime langsung update
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
      const pad = (n) => (n < 10 ? "0" + n : "" + n);
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.${ms}`;
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

    goTo() {
      localStorage.removeItem("raceStartPayload");
      localStorage.removeItem("participantByCategories");
      localStorage.removeItem("currentCategories");

      this.participant = [];
      this.titleCategories = "";
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },

    handleScroll() {
      this.isScrolled = window.scrollY > 0;
    },

    saveResult() {
      const clean = JSON.parse(JSON.stringify(this.participantArr || []));
      if (!Array.isArray(clean) || clean.length === 0) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail: "Belum ada data yang bisa disimpan.",
          message: "Ups Sorry",
        });
        return;
      }

      // Gunakan bucket dari raceStartPayload agar identik dengan Team Registered
      const bucket = getBucket();
      const must = ["eventId", "initialId", "raceId", "divisionId"];
      const missing = must.filter((k) => !bucket[k]);
      if (missing.length) {
        ipcRenderer.send("get-alert", {
          type: "error",
          detail: `Bucket fields missing: ${missing.join(", ")}`,
          message: "Failed",
        });
        return;
      }

      // Bangun dokumen yang siap disimpan
      const docs = buildResultDocs(clean, bucket);

      // KIRIM ARRAY LANGSUNG (bukan objek)
      ipcRenderer.send("insert-sprint-result", docs);

      ipcRenderer.once("insert-sprint-result-reply", (_e, res) => {
        if (res && res.ok) {
          ipcRenderer.send("get-alert-saved", {
            type: "question",
            detail: "Result data has been successfully saved",
            message: "Successfully",
          });
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            detail: (res && res.error) || "Save failed",
            message: "Failed",
          });
        }
      });
    },
  },
};
</script>

<style scoped>
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
  width: 100px;
  height: 100px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
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
  max-width: 520px; /* sesuaikan */
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
  max-width: 460px; /* = max-width pill - padding + ikon */
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
  min-width: 120px; /* lebar label tetap */
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #334155; /* slate-700 */
  font-style: italic;
}
.meta-value {
  font-weight: 600;
  color: #0f172a; /* slate-900 */
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
  color: #1d4ed8;
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
