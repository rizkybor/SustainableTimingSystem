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
            {{ "Slalom Race" }}
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
              {{ dataEventSafe.eventName || "-" }}
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

    <!-- STICKY HEADER -->
    <div class="px-5">
      <div class="card-body">
        <b-row>
          <b-col>
            <div class="meta-panel">
              <div class="meta-row">
                <span class="meta-label">Nomor Lomba</span>
                <span class="meta-value">
                  <span class="badge-chip badge-chip--blue">Slalom Race</span>
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
                  label="Switch Slalom Category:"
                  label-for="sprintBucketSelect"
                  class="mb-0 slalom-actionbar__select"
                >
                  <b-form-select
                    id="slalomBucketSelect"
                    :options="slalomBucketOptions"
                    v-model="selectedSlalomKey"
                    @change="onSelectSlalomBucket"
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

    <!-- OPERATION TIME (reuse Sprint) -->
    <OperationTimePanel
      v-if="visibleTeams && visibleTeams.length"
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="participantsForPanel"
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />

    <!-- RACETIME OUTPUT -->
    <div class="px-4 mt-4">
      <div class="card-body">
        <div class="table-responsive">
          <div
            class="d-flex justify-content-start mb-2"
            v-if="visibleTeams && visibleTeams.length"
          >
            <div class="btn-group" role="group" aria-label="Run Switch">
              <button
                type="button"
                class="mr-2 btn"
                :class="{
                  'btn-action-active': activeRun === 0,
                  'btn-action': activeRun !== 0,
                }"
                @click="setRun(0)"
              >
                Run Session #1
              </button>
              <button
                type="button"
                class="btn"
                :class="{
                  'btn-action-active': activeRun === 1,
                  'btn-action': activeRun !== 1,
                }"
                @click="setRun(1)"
              >
                Run Session #2
              </button>
            </div>
          </div>

          <!-- ACTION BAR: Save & Sort (mirip Sprint/DRR) -->
          <div
            class="d-flex justify-content-between"
            v-if="visibleTeams && visibleTeams.length"
          >
            <div class="racetime-header">
              <h4>Output Racetime :</h4>
              <small class="text-muted">
                Category active: {{ titleCategories || "-" }}
              </small>
            </div>
            <div class="slalom-actionbar">
              <div class="slalom-actionbar__buttons">
                <!-- SAVE ONLY SESSION 1 -->
                <button
                  type="button"
                  class="btn-action btn-success"
                  @click="saveSession1"
                  :disabled="!teams.length"
                  title="Simpan hanya run/session #1"
                >
                  <Icon icon="mdi:content-save-outline" />
                  Save Session 1
                </button>

                <!-- SHOW RESULT SESSION 1 (MODAL) -->
                <button
                  type="button"
                  class="btn-action btn-primary"
                  @click="openSession1Modal"
                  title="Tampilkan Result Session 1 dari database"
                >
                  <Icon icon="mdi:table-eye" />
                  Result Session 1
                </button>

                <!-- PRINT PDF SESSION 1 -->
                <button
                  type="button"
                  class="btn-action btn-warning"
                  @click="printPdfSession1"
                  title="Download PDF khusus Session 1"
                >
                  <Icon icon="mdi:download" />
                  PDF Session 1
                </button>

                <button
                  type="button"
                  class="btn-action btn-secondary"
                  @click="saveResult"
                  :disabled="!teams.length"
                  title="Simpan hasil Slalom (semua tim & semua run)"
                >
                  <Icon icon="icon-park-outline:save" /> Save Result
                </button>

                <button
                  type="button"
                  class="btn-action btn-info"
                  @click="toggleSortRanked"
                  :disabled="!teams.length"
                  :title="
                    !sortBest.enabled
                      ? 'Urutkan berdasarkan best time (ASC)'
                      : sortBest.desc
                      ? 'Matikan sort best time'
                      : 'Urutkan berdasarkan best time (DESC)'
                  "
                >
                  <Icon icon="icon-park-outline:ranking" />
                  Sort Ranked
                  <small v-if="sortBest.enabled" class="ml-1">
                    ({{ sortBest.desc ? "DESC" : "ASC" }})
                  </small>
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="isLoading"
            class="bracket-loading d-flex align-items-center justify-content-center py-5"
          >
            <div class="text-center">
              <b-spinner label="Loading" class="mb-2"></b-spinner>
              <div class="text-muted">Loading bracket & teams…</div>
            </div>
          </div>

          <table v-else-if="visibleTeams && visibleTeams.length" class="table">
            <thead>
              <tr>
                <th class="text-center" rowspan="2">No</th>
                <th class="text-start" rowspan="2">Team Name</th>
                <th class="text-center" rowspan="2">BIB Number</th>
                <th class="text-center" rowspan="2">Start Time</th>
                <!-- Judul grup penalties: S + 1..N + F -->
                <th
                  v-if="!penaltiesWrapped"
                  class="text-center penalties-title is-clickable"
                  :colspan="SLALOM_GATES.length + 2"
                  @click="penaltiesWrapped = true"
                  title="Klik untuk bungkus (wrap) penalties"
                >
                  Gates Run Session #{{ this.activeRun + 1 }} Penalties
                </th>
                <!-- Mode wrapped: cuma 1 kolom -->
                <th
                  v-else
                  class="text-center penalties-title is-clickable"
                  rowspan="2"
                  @click="penaltiesWrapped = false"
                  title="Klik untuk tampilkan penuh (un-wrap) penalties"
                >
                  Gates Run Session #{{ this.activeRun + 1 }} Penalties
                </th>

                <th class="text-center" rowspan="2">Penalty Total</th>

                <th class="text-center" rowspan="2">Finish Time</th>
                <th class="text-center" rowspan="2">Race Time</th>
                <th class="text-center" rowspan="2">Penalty Time</th>
                <th class="text-center" rowspan="2">Total Time</th>
                <th class="text-center" rowspan="2">Best Time</th>
                <th class="text-center" rowspan="2">Ranked</th>
                <th class="text-center" rowspan="2">Score</th>
                <th v-if="endGame" class="text-center" rowspan="2">Action</th>
              </tr>
              <tr v-if="!penaltiesWrapped">
                <th class="text-center">Start</th>
                <th
                  v-for="n in SLALOM_GATES"
                  :key="'g' + n"
                  class="text-center"
                >
                  {{ n }}
                </th>
                <th class="text-center">Finish</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(team, ti) in visibleTeams" :key="team._id">
                <td class="text-center">{{ ti + 1 }}</td>

                <!-- TEAM NAME  -->
                <td class="large-bold text-strong max-char text-left">
                  {{ team.nameTeam }}
                </td>

                <!-- BIB NUMBER  -->
                <td>{{ team.bibNumber }}</td>

                <!-- START TIME  -->
                <td class="text-center text-monospace" style="min-width: 120px">
                  {{ currentSession(team).startTime || "-" }}
                </td>

                <!-- ========== PENALTIES ========== -->
                <!-- Mode WRAPPED: 1 kolom berisi grid S,1..N,F -->
                <td v-if="penaltiesWrapped" class="p-1">
                  <div class="penalties-grid">
                    <!-- S -->
                    <div class="p-item">
                      <div class="p-label">S</div>
                      <b-form-select
                        class="small-select"
                        v-model="currentSession(team).startPenalty"
                        :options="dataPenalties"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="recalcTeam(team)"
                        style="border-radius: 12px"
                      />
                    </div>

                    <!-- 1..N -->
                    <div
                      v-for="(gate, gi) in currentSession(team).penalties"
                      :key="team._id + '-wrap-' + gi"
                      class="p-item"
                    >
                      <div class="p-label">{{ gi + 1 }}</div>
                      <b-form-select
                        class="small-select"
                        v-model="currentSession(team).penalties[gi]"
                        :options="dataPenalties"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="recalcTeam(team)"
                        style="border-radius: 12px"
                      />
                    </div>

                    <!-- F -->
                    <div class="p-item">
                      <div class="p-label">F</div>
                      <b-form-select
                        class="small-select"
                        v-model="currentSession(team).finishPenalty"
                        :options="dataPenalties"
                        text-field="label"
                        value-field="value"
                        size="sm"
                        @change="recalcTeam(team)"
                        style="border-radius: 12px"
                      />
                    </div>
                  </div>
                </td>

                <!-- Mode EXPANDED: kolom S,1..N,F terpisah (seperti sebelumnya) -->
                <template v-else>
                  <!-- S -->
                  <td>
                    <b-form-select
                      style="min-width: 70px; border-radius: 12px"
                      class="small-select"
                      v-model="currentSession(team).startPenalty"
                      :options="dataPenalties"
                      text-field="label"
                      value-field="value"
                      size="sm"
                      @change="recalcTeam(team)"
                    />
                  </td>

                  <!-- 1..N -->
                  <td
                    v-for="(gate, gi) in currentSession(team).penalties"
                    :key="team._id + '-' + gi"
                  >
                    <b-form-select
                      class="small-select"
                      style="min-width: 70px; border-radius: 12px"
                      v-model="currentSession(team).penalties[gi]"
                      :options="dataPenalties"
                      text-field="label"
                      value-field="value"
                      size="sm"
                      @change="recalcTeam(team)"
                    />
                  </td>

                  <!-- F -->
                  <td>
                    <b-form-select
                      class="small-select"
                      style="min-width: 70px; border-radius: 12px"
                      v-model="currentSession(team).finishPenalty"
                      :options="dataPenalties"
                      text-field="label"
                      value-field="value"
                      size="sm"
                      @change="recalcTeam(team)"
                    />
                  </td>
                </template>
                <!-- ========== /PENALTIES ========== -->

                <!-- PENALTY TOTAL -->
                <td class="text-center penalty-char" style="min-width: 120px">
                  {{ displayTotalPenalty(team) }}
                </td>

                <!-- FINISH TIME  -->
                <td class="text-center text-monospace" style="min-width: 120px">
                  {{ currentSession(team).finishTime || "-" }}
                </td>

                <!-- RACE TIME  -->
                <td
                  class="text-center large-bold text-monospace"
                  style="min-width: 120px"
                >
                  {{ currentSession(team).raceTime || "-" }}
                </td>

                <!-- PENALTY TOTAL TIME  -->
                <td class="text-center penalty-char text-monospace">
                  {{ currentSession(team).penaltyTime || "-" }}
                </td>

                <!-- RESULT TIME  -->
                <td
                  class="text-center large-bold result-char text-monospace"
                  style="min-width: 120px"
                >
                  {{ currentSession(team).totalTime || "-" }}
                </td>

                <!-- BEST TIME  -->
                <td
                  class="text-center large-bold text-monospace best-time-cell"
                  style="min-width: 120px"
                  :title="
                    bestRunOf(team)
                      ? 'Best time diambil dari Run ' + bestRunOf(team)
                      : ''
                  "
                >
                  <small v-if="bestRunOf(team)" class="best-time-tag mb-3"
                    >Best Time Run {{ bestRunOf(team) }}</small
                  >
                  <div>{{ calculateBestTime(team) || "-" }}</div>
                </td>

                <!-- RANKED  -->
                <td style="min-width: 120px" class="text-center large-bold">
                  {{ rankOfTeam(team) }}
                </td>

                <!-- SCORED  -->
                <td style="min-width: 120px" class="text-center large-bold">
                  {{ scoreOfTeam(team) }}
                </td>
                <td v-if="endGame">
                  <!-- <button
                    type="button"
                    class="btn btn-warning btn-sm"
                    @click="openEdit(team)"
                  >
                    Edit
                  </button> -->
                  <button
                    type="button"
                    class="btn-action btn-danger"
                    @click="resetRow(team)"
                    :title="`Reset data run aktif untuk ${team.nameTeam}`"
                  >
                    Reset Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- EMPTY STATE -->
          <EmptyCard v-else />

          <!-- START SESSION 1  -->
          <b-modal
            v-model="showSession1Modal"
            title="Slalom - Result Session 1"
            size="xl"
            hide-footer
            centered
          >
            <div v-if="loadingSession1" class="text-center py-5">
              <b-spinner class="mb-2" /> Memuat result…
            </div>

            <div v-else>
              <div class="mb-2 text-muted small">
                Ditampilkan dari <code>(Session 1)</code>
              </div>

              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team</th>
                      <th>BIB</th>
                      <th>Start</th>
                      <th>Gates Σ</th>
                      <th>Finish</th>
                      <th>Total Pen.</th>
                      <th>Race Time</th>
                      <th>Penalty Time</th>
                      <th>Total Time</th>
                      <th>Ranked*</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, i) in session1Rows" :key="i">
                      <td>{{ i + 1 }}</td>
                      <td class="text-left">{{ r.nameTeam }}</td>
                      <td>{{ r.bibTeam }}</td>
                      <td>{{ r.startPenalty }}</td>
                      <td>{{ r.gatesSum }}</td>
                      <td>{{ r.finishPenalty }}</td>
                      <td>{{ r.totalPenalty }}</td>
                      <td class="text-monospace">{{ r.raceTime }}</td>
                      <td class="text-monospace">{{ r.penaltyTime }}</td>
                      <td class="text-monospace font-weight-bold">
                        {{ r.totalTime }}
                      </td>
                      <td>{{ r.ranked || "-" }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <small class="text-muted">
                *Rank/Score diambil dari dokumen (jika tersedia). Jika tidak
                ada, tampil “- / 0”.
              </small>

              <div class="text-right mt-3">
                <b-button variant="secondary" @click="showSession1Modal = false"
                  >Close</b-button
                >
              </div>
            </div>
          </b-modal>

          <vue-html2pdf
            v-show="true"
            ref="html2PdfS1"
            :show-layout="false"
            :float-layout="false"
            :enable-download="true"
            :preview-modal="false"
            :paginate-elements-by-height="1400"
            :pdf-quality="2"
            :filename="pdfFilenameSession1"
            pdf-format="a4"
            pdf-orientation="landscape"
            pdf-content-width="100%"
            style="
              position: absolute;
              left: -99999px;
              top: 0;
              width: 0;
              height: 0;
              overflow: hidden;
            "
            @pdfGenerated="onPdfGeneratedS1"
          >
            <section slot="pdf-content">
              <SlalomSession1PdfResult
                :data="dataEventSafe"
                :pdf-participants-session1="pdfParticipantsSession1"
                :title-categories="titleCategories"
                :is-official="false"
              />
            </section>
          </vue-html2pdf>

          <!-- END SESSION 1  -->
        </div>

        <b-button
          @click="goTo"
          variant="outline-secondary"
          class="btn-action mt-2 ml-2"
        >
          <Icon icon="ic:baseline-keyboard-double-arrow-left" /> Back
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import SlalomSession1PdfResult from "../ResultComponent/slalom-session1-pdfResult.vue";
import { ipcRenderer } from "electron";
import { createSerialReader, listPorts } from "@/utils/serialConnection.js";
import OperationTimePanel from "@/components/race/OperationTeamPanel.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import EmptyCard from "@/components/cards/card-empty.vue";
import VueHtml2pdf from "vue-html2pdf";
import { logger } from "@/utils/logger";
import { Icon } from "@iconify/vue2";

/** ===== constants/helpers (sama dengan Sprint) ===== */
const RACE_PAYLOAD_KEY = "raceStartPayload";
function safeJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const val = JSON.parse(raw);
    return val == null ? fallback : val;
  } catch {
    return fallback;
  }
}
function pad(n, w = 2) {
  return String(n).padStart(w, "0");
}
function msToHMSms(ms) {
  const hr = Math.floor(ms / 3600000);
  const rem1 = ms % 3600000;
  const min = Math.floor(rem1 / 60000);
  const rem2 = rem1 % 60000;
  const sec = Math.floor(rem2 / 1000);
  const mss = rem2 % 1000;
  return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(mss, 3)}`;
}
function hmsToMs(str) {
  const [h = "0", m = "0", sMs = "0.000"] = String(str || "").split(":");
  const [s = "0", ms = "0"] = String(sMs).split(".");
  return +h * 3600000 + +m * 60000 + +s * 1000 + +ms;
}

/** ===== Slalom specifics (dinamis dari DB) ===== */
const DEFAULT_S16 = 14;
function buildGates(n) {
  const total = Number.isFinite(+n) && +n > 0 ? +n : DEFAULT_S16;
  return Array.from({ length: total }, (_, i) => i + 1);
}
const PENALTY_VALUE_TO_MS = { 0: 0, 5: 5000, 50: 50000 };

/** ===== Payload baru: ambil bucket & teams (seperti Sprint Result) ===== */
function normalizeTeamFromBucketForSlalom(t = {}) {
  // id internal untuk v-for
  const _id =
    t._id ||
    t.id ||
    `${String(t.bibTeam || t.bibNumber || "")}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  const base = {
    _id,
    teamId: String(t.teamId || ""),
    nameTeam: String(t.nameTeam || t.name || ""),
    bibNumber: String(t.bibTeam || t.bibNumber || ""),
    startOrder: String(t.startOrder || ""),
    praStart: String(t.praStart || ""),
    intervalRace: String(t.intervalRace || ""),
    statusId: Number.isFinite(t.statusId) ? Number(t.statusId) : 0,
  };

  // siapkan 2 sesi default, dan merge jika ada data existing
  const emptySession = (gateLen = DEFAULT_S16) => ({
    startPenalty: 0,
    penalties: Array.from({ length: gateLen }, () => 0),
    finishPenalty: 0,
    totalPenalty: 0,
    penaltyTime: "00:00:00.000",
    startTime: "",
    finishTime: "",
    raceTime: "",
    totalTime: "",
    ranked: 0,
    score: 0,
  });

  const sessions =
    Array.isArray(t.sessions) && t.sessions.length
      ? t.sessions.map((s) => ({ ...emptySession(DEFAULT_S16), ...(s || {}) }))
      : [emptySession(DEFAULT_S16), emptySession(DEFAULT_S16)];

  return { ...base, sessions };
}

function getBucket() {
  const obj = safeJSON(RACE_PAYLOAD_KEY, {});
  return obj.bucket || {};
}

export default {
  name: "SlalomRacePanel",
  components: {
    OperationTimePanel,
    EmptyCard,
    VueHtml2pdf,
    SlalomSession1PdfResult,
    Icon,
  },

  data() {
    return {
      pdfParticipantsSession1: [],
      localShow: true,
      showSession1Modal: false,
      loadingSession1: false,
      session1Rows: [],
      showPdfS1: false,
      isLoading: false,
      defaultImg,
      slalomBucketOptions: [],
      slalomBucketMap: Object.create(null),
      selectedSlalomKey: "",
      selectPath: "",
      baudRate: 9600,
      baudOptions: [1200, 2400, 9600],
      serialCtrl: null,
      endGame: false,
      activeRun: 0,
      sortBest: { enabled: false, desc: false },
      SLALOM_GATES: buildGates(DEFAULT_S16),
      port: null,
      isPortConnected: false,
      digitId: [],
      digitTime: [],
      digitTimeStart: null,
      digitTimeFinish: null,
      dataEvent: {},
      titleCategories: "",
      teams: [],
      selectedSession: {},
      dataPenalties: [],
      dataScore: [],
      penaltiesWrapped: false,
    };
  },

  computed: {
    pdfFilenameSession1: function () {
      var eventSafe =
        this.dataEventSafe && this.dataEventSafe.eventName
          ? this.dataEventSafe.eventName + " - "
          : "";
      var cats = this.titleCategories ? this.titleCategories : "SLALOM";
      return eventSafe + cats + " - Session 1";
    },
    getBucket() {
      const obj = safeJSON(RACE_PAYLOAD_KEY, {});
      return obj.bucket || {};
    },
    currentSlalomEventId() {
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

    slalomDivisions() {
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

    slalomRaces() {
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

    slalomInitials() {
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

    visibleTeams() {
      const arr = this.teams.slice();

      if (!this.sortBest.enabled) return arr;

      const toBestMs = (team) => {
        const times = (Array.isArray(team.sessions) ? team.sessions : [])
          .map((s) => s && s.totalTime)
          .filter(Boolean)
          .map(hmsToMs);

        if (!times.length) return Number.POSITIVE_INFINITY;
        return Math.min(...times);
      };

      return arr.sort((a, b) => {
        const am = toBestMs(a);
        const bm = toBestMs(b);
        return this.sortBest.desc ? bm - am : am - bm;
      });
    },

    /** Mapping untuk OperationTimePanel (1 sesi aktif per tim) */
    participantsForPanel() {
      return this.teams.map((t) => {
        const idx =
          this.selectedSession[String(t._id)] != null
            ? this.selectedSession[String(t._id)]
            : 0;
        const s = t.sessions[idx] || {};
        return {
          nameTeam: t.nameTeam,
          bibTeam: t.bibNumber,
          result: {
            startTime: s.startTime || "",
            finishTime: s.finishTime || "",
            raceTime: s.raceTime || "",
            penaltyTime: s.penaltyTime || "00:00:00.000",
            totalTime: s.totalTime || s.raceTime || "",
            ranked: s.ranked || 0,
            score: s.score || 0,
          },
        };
      });
    },

    // NEW: ranking & score per team berdasarkan best time
    ranksMap() {
      const arr = this.teams.map((t) => {
        const times = (t.sessions || [])
          .map((s) => s && s.totalTime)
          .filter(Boolean)
          .map(hmsToMs);
        const bestMs = times.length ? Math.min(...times) : Infinity;
        return { id: String(t._id), bestMs };
      });
      arr.sort((a, b) => a.bestMs - b.bestMs);
      const map = {};
      let prev = null,
        rank = 0,
        idx = 0;
      for (const it of arr) {
        idx++;
        if (!Number.isFinite(it.bestMs)) {
          map[it.id] = { rank: "-", score: 0 };
          continue;
        }
        if (prev === null || it.bestMs !== prev) {
          rank = idx;
          prev = it.bestMs;
        }
        const scoreObj = this.dataScore.find((d) => Number(d.ranking) === rank);
        map[it.id] = { rank, score: scoreObj ? Number(scoreObj.score) : 0 };
      }
      return map;
    },
  },
  created() {
    this.activeRun = 0;
  },
  async mounted() {
    try {
      const events = localStorage.getItem("eventDetails");
      this.dataEvent = events ? JSON.parse(events) : {};
    } catch {
      this.dataEvent = {};
    }
    await this.loadDataScore("SLALOM");
    await this.loadDataPenalties("SLALOM");

    const ok = this.loadFromRaceStartPayloadForSlalom();
    if (!ok) {
      await this.checkValueStorage();
    }
    this.buildSlalomOptions();
    if (this.slalomBucketOptions.length) {
      const savedKey = localStorage.getItem("currentSlalomBucketKey");
      this.selectedSlalomKey =
        savedKey && this.slalomBucketMap[savedKey]
          ? savedKey
          : this.slalomBucketOptions[0].value;

      await this.fetchSlalomTeamsByKey(this.selectedSlalomKey);
    } else {
      this.loadAllSlalomBucketsFromEvent();
    }
    this.teams.forEach((t) =>
      this.$set(this.selectedSession, String(t._id), this.activeRun)
    );

    // Ambil jumlah gate untuk slalom dari pengaturan
    this.fetchSlalomGateCountFromSettings();
  },

  methods: {
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
    loadFromRaceStartPayloadForSlalom() {
      const obj = safeJSON(RACE_PAYLOAD_KEY, {});
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
      };
      const teams = Array.isArray(b.teams)
        ? b.teams.map(normalizeTeamFromBucketForSlalom)
        : [];
      return { bucket, teams };
    },
    buildSlalomOptions() {
      const eventId = this.currentSlalomEventId || "";
      if (!eventId) {
        this.slalomBucketOptions = [];
        this.slalomBucketMap = {};
        return;
      }

      const divs = this.slalomDivisions.length
        ? this.slalomDivisions
        : [
            { id: "1", name: "R4" },
            { id: "2", name: "R6" },
          ];
      const races = this.slalomRaces.length
        ? this.slalomRaces
        : [
            { id: "1", name: "MEN" },
            { id: "2", name: "WOMEN" },
          ];
      const inits = this.slalomInitials.length
        ? this.slalomInitials
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
              eventName: "SLALOM",
              initialName: String(init.name),
              raceName: String(race.name),
              divisionName: String(div.name),
              teams: [],
            };
          });
        });
      });

      this.slalomBucketOptions = opts;
      this.slalomBucketMap = map;
    },
    async onSelectSlalomBucket(key) {
      await this.fetchSlalomTeamsByKey(key);
    },
    async fetchSlalomTeamsByKey(key) {
      try {
        this.isLoading = true;
        if (
          !key ||
          !this.slalomBucketMap[key] ||
          typeof ipcRenderer === "undefined"
        )
          return;

        const b = this.slalomBucketMap[key];
        const filters = {
          eventId: String(b.eventId),
          initialId: String(b.initialId),
          raceId: String(b.raceId),
          divisionId: String(b.divisionId),
        };

        this.selectedSlalomKey = key;
        localStorage.setItem("currentSlalomBucketKey", key);

        // Fetch data teams from IPC (channel baru untuk slalom)
        const res = await new Promise((resolve) => {
          ipcRenderer.once(
            "teams-slalom-registered:find-reply",
            (_e, payload) => resolve(payload)
          );
          ipcRenderer.send("teams-slalom-registered:find", filters);
        });

        if (!res || !res.ok) {
          this.teams = [];
          this._useSlalomBucket(key);
          return;
        }

        const doc = Array.isArray(res.items) ? res.items[0] : res.items;
        const teams =
          doc && Array.isArray(doc.teams)
            ? doc.teams.map(normalizeTeamFromBucketForSlalom)
            : [];

        this.slalomBucketMap[key] = { ...b, teams };
        this._useSlalomBucket(key);
      } catch {
        this._useSlalomBucket(key);
      }
      this.isLoading = false;
    },
    _slalomBucketLabel(b) {
      const div = b && b.divisionName ? String(b.divisionName) : "";
      const rac = b && b.raceName ? String(b.raceName) : "";
      const ini = b && b.initialName ? String(b.initialName) : "";
      return `${div} ${rac} – ${ini}`;
    },
    _useSlalomBucket(key) {
      const b = this.slalomBucketMap[key];
      if (!b) return;

      this.teams = (b.teams || []).map((t) => ({ ...t }));
      this.titleCategories = this._slalomBucketLabel(b);

      localStorage.setItem("currentSlalomBucketKey", key);

      try {
        const raw = localStorage.getItem("raceStartPayload") || "{}";
        const obj = JSON.parse(raw || "{}") || {};
        obj.bucket =
          obj.bucket && typeof obj.bucket === "object" ? obj.bucket : {};
        obj.bucket.eventId = String(b.eventId || "");
        obj.bucket.initialId = String(b.initialId || "");
        obj.bucket.raceId = String(b.raceId || "");
        obj.bucket.divisionId = String(b.divisionId || "");
        obj.bucket.eventName = "SLALOM";
        obj.bucket.initialName = String(b.initialName || "");
        obj.bucket.raceName = String(b.raceName || "");
        obj.bucket.divisionName = String(b.divisionName || "");
        localStorage.setItem("raceStartPayload", JSON.stringify(obj));
      } catch (err) {
        logger.warn("❌ Failed to update race settings:", err);
      }
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

    checkEndGameStatus() {
      const allFinished =
        Array.isArray(this.teams) &&
        this.teams.length > 0 &&
        this.teams.every((t) => {
          const s = this.currentSession(t); // run aktif per tim
          return (
            s && typeof s.finishTime === "string" && s.finishTime.trim() !== ""
          );
        });

      this.endGame = !!allFinished;
    },
    resetRow(team) {
      if (!team) return;

      // Tentukan sesi yang sedang aktif untuk tim ini
      const s = this.currentSession(team);
      if (!s) return;

      // Opsional: konfirmasi agar tidak kepencet
      const ok = window.confirm(
        `Reset data run aktif untuk tim "${team.nameTeam}"?`
      );
      if (!ok) return;

      // Reset penalties: S, gates, F
      this.$set(s, "startPenalty", 0);
      this.$set(s, "finishPenalty", 0);

      const need = this.SLALOM_GATES.length;
      const zeros = Array.from({ length: need }, () => 0);
      this.$set(s, "penalties", zeros);

      // Reset perhitungan & waktu
      this.$set(s, "totalPenalty", 0);
      this.$set(s, "penaltyTime", "00:00:00.000");
      this.$set(s, "startTime", "");
      this.$set(s, "finishTime", "");
      this.$set(s, "raceTime", "");
      this.$set(s, "totalTime", "");
      this.$set(s, "ranked", 0);
      this.$set(s, "score", 0);

      // Jika mau, panggil kalkulasi lagi (tidak wajib karena sudah 0 semua)
      // this.recalcSession(s);

      // Opsional: feedback lewat IPC alert (kalau mau konsisten dengan notifikasi lain)
      try {
        ipcRenderer &&
          ipcRenderer.send("get-alert", {
            type: "success",
            detail: `Row untuk "${team.nameTeam}" (Run ${
              this.selectedSession[team._id] + 1
            }) telah direset.`,
            message: "Reset Berhasil",
          });
      } catch (e) {
        /* no-op */
      }
      this.checkEndGameStatus();
    },

    bestTimeWithRun(team) {
      const msList = (team.sessions || [])
        .map((s) => s && s.totalTime)
        .map((t) => (t ? hmsToMs(t) : Infinity));

      let best = Infinity,
        runIndex = null;
      msList.forEach((ms, i) => {
        if (Number.isFinite(ms) && ms < best) {
          best = ms;
          runIndex = i; // 0-based
        }
      });

      if (!Number.isFinite(best)) return { time: "", run: null };
      return { time: msToHMSms(best), run: runIndex + 1 }; // 1-based untuk UI
    },

    bestRunOf(team) {
      return this.bestTimeWithRun(team).run; // 1 atau 2, atau null jika belum ada
    },
    setRun(idx) {
      this.activeRun = idx;
      this.teams.forEach((t) =>
        this.$set(this.selectedSession, String(t._id), idx)
      );
      this.checkEndGameStatus();
    },
    async fetchSlalomGateCountFromSettings() {
      try {
        var evId = this.currentSlalomEventId
          ? String(this.currentSlalomEventId)
          : "";
        if (typeof ipcRenderer === "undefined" || !evId) {
          this.SLALOM_GATES = buildGates(DEFAULT_S16);
          this.syncAllTeamsPenaltiesLength();
          return this.SLALOM_GATES;
        }

        // bungkus ke Promise supaya bisa di-await dan mengembalikan gates
        const gates = await new Promise((resolve) => {
          ipcRenderer.once("race-settings:get-reply", (_e, res) => {
            var n = DEFAULT_S16;
            if (
              res &&
              res.ok &&
              res.settings &&
              res.settings.slalom &&
              res.settings.slalom.totalGate
            ) {
              var parsed = parseInt(res.settings.slalom.totalGate, 10);
              if (Number.isFinite(parsed) && parsed > 0) n = parsed;
            }
            this.SLALOM_GATES = buildGates(n);
            this.syncAllTeamsPenaltiesLength();
            resolve(this.SLALOM_GATES);
          });
          ipcRenderer.send("race-settings:get", evId);
        });

        return gates; // array angka [1..N]
      } catch (err) {
        this.SLALOM_GATES = buildGates(DEFAULT_S16);
        this.syncAllTeamsPenaltiesLength();
        return this.SLALOM_GATES;
      }
    },

    // Samakan panjang penalties setiap sesi tim dengan jumlah gate terbaru
    syncAllTeamsPenaltiesLength() {
      const need = this.SLALOM_GATES.length;
      const fixLen = (arr) => {
        const a = Array.isArray(arr) ? arr.slice() : [];
        while (a.length < need) a.push(0);
        if (a.length > need) a.length = need;
        return a;
      };
      this.teams.forEach((t) => {
        (t.sessions || []).forEach((s) => {
          this.$set(s, "penalties", fixLen(s && s.penalties));
        });
      });
    },
    // rankOf(id) {
    //   const r = this.ranksMap && this.ranksMap[id];
    //   // jika tidak ada best time → '-'
    //   return r && (typeof r.rank === "number" || r.rank === "-") ? r.rank : "-";
    // },
    // scoreOf(id) {
    //   const r = this.ranksMap && this.ranksMap[id];
    //   return r && typeof r.score === "number" ? r.score : 0;
    // },
    rankOfTeam(team) {
      const r = this.ranksMap && this.ranksMap[String(team._id)];
      return r && (typeof r.rank === "number" || r.rank === "-") ? r.rank : "-";
    },
    scoreOfTeam(team) {
      const r = this.ranksMap && this.ranksMap[String(team._id)];
      return r && typeof r.score === "number" ? r.score : 0;
    },
    /** === Table accessors === */
    sessionOptions(team) {
      return team.sessions.map((_, i) => ({ text: `Run ${i + 1}`, value: i }));
    },
    // Modify currentSession to handle undefined cases
    currentSession(team) {
      const idx =
        this.selectedSession[String(team._id)] != null
          ? this.selectedSession[String(team._id)]
          : 0;
      // Safeguard: Ensure the session is defined
      const session =
        team.sessions && team.sessions[idx] ? team.sessions[idx] : {}; // Default to empty object if session is undefined

      // Ensure penalties is always an array
      const need = this.SLALOM_GATES.length;
      let penalties = Array.isArray(session.penalties) ? session.penalties : [];
      while (penalties.length < need) penalties.push(0); // Ensure enough penalties
      if (penalties.length > need) penalties.length = need; // Ensure no more penalties than needed

      // Safeguard: Ensure startPenalty and finishPenalty are defined
      session.startPenalty =
        session.startPenalty != null ? session.startPenalty : 0;
      session.finishPenalty =
        session.finishPenalty != null ? session.finishPenalty : 0;

      // Set the penalties in the session object
      session.penalties = penalties;

      return session;
    },

    /** === Perhitungan penalty/time === */
    recalcSession(s) {
      // total penalty (angka) = S + sum(1..N) + F
      const core = (s.penalties || []).reduce(
        (a, v) => a + (Number(v) || 0),
        0
      );
      const sVal = Number(s.startPenalty) || 0;
      const fVal = Number(s.finishPenalty) || 0;
      s.totalPenalty = sVal + core + fVal;

      // konversi ke ms dengan peta nilai
      const toMs = (v) => PENALTY_VALUE_TO_MS[Number(v) || 0] || 0;
      const penMs =
        toMs(sVal) +
        (s.penalties || []).reduce((sum, v) => sum + toMs(v), 0) +
        toMs(fVal);

      s.penaltyTime = msToHMSms(penMs);

      if (s.raceTime) {
        const raceMs = hmsToMs(s.raceTime);
        s.totalTime = msToHMSms(raceMs + penMs);
      }
    },
    recalcTeam(team) {
      this.recalcSession(this.currentSession(team));
    },
    displayTotalPenalty(team) {
      const s = this.currentSession(team);
      return Number(s.totalPenalty) || 0;
    },
    calculateBestTime(team) {
      const times = (team.sessions || [])
        .map((s) => s && s.totalTime)
        .filter(Boolean);
      if (!times.length) return "";
      const best = times
        .map(hmsToMs)
        .reduce((min, ms) => Math.min(min, ms), Infinity);
      return msToHMSms(best);
    },
    onGatePenaltyChange(team, gateIndex, value) {
      const s = this.currentSession(team);
      this.$set(s.penalties, gateIndex, Number(value) || 0);
      this.recalcSession(s);
    },

    /** === Hook dari OperationTimePanel === */
    async updateTime(val, idx, title) {
      const team = this.teams[idx];
      if (!team) return;
      const s = this.currentSession(team);
      if (title === "start") s.startTime = val;
      if (title === "finish") {
        s.finishTime = val;
        if (s.startTime && s.finishTime) {
          const diff = Math.max(
            0,
            hmsToMs(s.finishTime) - hmsToMs(s.startTime)
          );
          s.raceTime = msToHMSms(diff);
          this.recalcSession(s);
        }
      }
      this.checkEndGameStatus();
    },

    /** === Navigasi sederhana === */
    goTo() {
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },

    getScoreByRanked(ranked) {
      const m = this.dataScore.find((d) => d.ranking === ranked);
      return m ? m.score : null;
    },

    toggleSortRanked() {
      // cycle: off → asc → desc → off
      if (!this.sortBest.enabled) {
        this.sortBest.enabled = true;
        this.sortBest.desc = false; // ASC
      } else if (!this.sortBest.desc) {
        this.sortBest.desc = true; // DESC
      } else {
        this.sortBest.enabled = false; // OFF
      }
    },
    _zeroGates(n) {
      var out = [];
      var i = 0;
      while (i < n) {
        out.push(0);
        i = i + 1;
      }
      return out;
    },

    /** === Save: dokumen Slalom (multi-run + penalty dinamis) === */
    buildDocs() {
      // Ambil bucket & (opsional) teams dari payload start
      var payload = this.loadFromRaceStartPayloadForSlalom();
      var bucket = payload && payload.bucket ? payload.bucket : {};

      // Validasi minimal
      var must = ["eventId", "initialId", "raceId", "divisionId"];
      var missing = [];
      var i = 0;
      while (i < must.length) {
        var k = must[i];
        if (!bucket[k]) missing.push(k);
        i = i + 1;
      }
      if (missing.length > 0) {
        throw new Error("Bucket fields missing: " + missing.join(", "));
      }

      // Siapkan dokumen dasar
      var doc = {
        eventId: String(
          bucket.eventId || this.eventId || this.$route.params.id || ""
        ),
        initialId: String(bucket.initialId || ""),
        raceId: String(bucket.raceId || ""),
        divisionId: String(bucket.divisionId || ""),
        eventName: String(bucket.eventName || "SLALOM").toUpperCase(),
        initialName: String(bucket.initialName || "").toUpperCase(),
        raceName: String(bucket.raceName || "").toUpperCase(),
        divisionName: String(bucket.divisionName || "").toUpperCase(),
        teams: [],
      };

      // Sumber data tim:
      // - prioritas UI aktif (this.teams) karena memuat waktu & penalties hasil input panel,
      // - kalau kosong, fallback ke payload.teams (jaga-jaga).
      var sourceTeams;
      if (Array.isArray(this.teams) && this.teams.length > 0) {
        sourceTeams = this.teams;
      } else if (Array.isArray(payload.teams) && payload.teams.length > 0) {
        sourceTeams = payload.teams;
      } else {
        sourceTeams = [];
      }

      // Jumlah gate dari setting, fallback 14
      var gatesCount = 14;
      if (
        this.raceSettings &&
        this.raceSettings.slalom &&
        this.raceSettings.slalom.totalGate
      ) {
        var nGate = parseInt(this.raceSettings.slalom.totalGate, 10);
        if (nGate > 0) gatesCount = nGate;
      }

      // Loop tim satu per satu
      var tIndex = 0;
      while (tIndex < sourceTeams.length) {
        var t = sourceTeams[tIndex] || {};
        var teamIdStr = t.teamId != null ? String(t.teamId) : "";
        var nameTeamStr = t.nameTeam != null ? String(t.nameTeam) : "";
        var bibTeamStr =
          t.bibNumber != null ? String(t.bibNumber) : String(t.bibTeam || "");
        var startOrderStr = t.startOrder != null ? String(t.startOrder) : "";
        var praStartStr = t.praStart != null ? String(t.praStart) : "";
        var intervalRaceStr =
          t.intervalRace != null ? String(t.intervalRace) : "";
        var statusNum = 0;
        if (Number.isFinite(t.statusId)) statusNum = Number(t.statusId);

        // Ambil 2 sesi (run) dari struktur panel slalom:
        // t.sessions[0] dan t.sessions[1] → kalau tidak ada, isi kosong
        var sessions = Array.isArray(t.sessions) ? t.sessions : [];
        var s1 = sessions[0] || {};
        var s2 = sessions[1] || {};

        // Pastikan penalties S/1..N/F terset (angka)
        var s1Start = Number(s1.startPenalty || 0);
        var s1Finish = Number(s1.finishPenalty || 0);
        var s1Gates = Array.isArray(s1.penalties) ? s1.penalties : [];
        // normalkan panjang gates ke gatesCount
        var fixed1 = [];
        var gi1 = 0;
        while (gi1 < gatesCount) {
          var v1 = s1Gates[gi1];
          fixed1.push(Number(v1 || 0));
          gi1 = gi1 + 1;
        }

        var s2Start = Number(s2.startPenalty || 0);
        var s2Finish = Number(s2.finishPenalty || 0);
        var s2Gates = Array.isArray(s2.penalties) ? s2.penalties : [];
        var fixed2 = [];
        var gi2 = 0;
        while (gi2 < gatesCount) {
          var v2 = s2Gates[gi2];
          fixed2.push(Number(v2 || 0));
          gi2 = gi2 + 1;
        }

        // Bangun array result: Run 1 & Run 2
        var results = [];

        var r1 = {
          session: "Run 1",
          startTime: String(s1.startTime || ""),
          finishTime: String(s1.finishTime || ""),
          raceTime: String(s1.raceTime || ""),
          penaltyTime: String(s1.penaltyTime || "00:00:00.000"),
          penaltyTotal: {
            start: s1Start,
            finish: s1Finish,
            gates: fixed1,
          },
          totalTime: String(s1.totalTime || s1.raceTime || ""),
          ranked: Number(s1.ranked || 0),
          score: Number(s1.score || 0),
          judgesBy: String(s1.judgesBy || ""),
          judgesTime: String(s1.judgesTime || ""),
        };
        results.push(r1);

        var r2 = {
          session: "Run 2",
          startTime: String(s2.startTime || ""),
          finishTime: String(s2.finishTime || ""),
          raceTime: String(s2.raceTime || ""),
          penaltyTime: String(s2.penaltyTime || "00:00:00.000"),
          penaltyTotal: {
            start: s2Start,
            finish: s2Finish,
            gates: fixed2,
          },
          totalTime: String(s2.totalTime || s2.raceTime || ""),
          ranked: Number(s2.ranked || 0),
          score: Number(s2.score || 0),
          judgesBy: String(s2.judgesBy || ""),
          judgesTime: String(s2.judgesTime || ""),
        };
        results.push(r2);

        // Dorong tim (PASTIKAN teamId tidak diubah)
        var teamOut = {
          teamId: teamIdStr,
          nameTeam: nameTeamStr,
          bibTeam: bibTeamStr,
          startOrder: startOrderStr,
          praStart: praStartStr,
          intervalRace: intervalRaceStr,
          statusId: statusNum,
          result: results,
        };
        doc.teams.push(teamOut);

        tIndex = tIndex + 1;
      }

      return doc;
    },
    /** === Save (parity dengan Sprint) === */
    saveResult() {
      try {
        const docs = this.buildDocs();
        if (!docs || typeof docs !== "object" || Array.isArray(docs)) {
          ipcRenderer.send("get-alert", {
            type: "warning",
            detail: "Belum ada data yang bisa disimpan.",
            message: "Ups Sorry",
          });
          return;
        }

        // Bungkus ke array agar konsisten dengan format insert-sprint-result
        const payload = [docs];

        // Kirim ARRAY langsung (paritas dengan Sprint)
        ipcRenderer.send("insert-slalom-result", payload);

        // Tunggu balasan — pola sama seperti Sprint
        ipcRenderer.once("insert-slalom-result-reply", (_e, res) => {
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
      } catch (e) {
        ipcRenderer.send("get-alert", {
          type: "error",
          detail: e && e.message ? e.message : "Save failed",
          message: "Failed",
        });
      }
    },

    // 1 ONLY
    // ===== SAVE ONLY SESSION 1 =====
    saveSession1() {
      try {
        const doc = this.buildDocsSession1Only();
        if (!doc || typeof doc !== "object" || !Array.isArray(doc.teams)) {
          ipcRenderer.send("get-alert", {
            type: "warning",
            detail: "Belum ada data yang bisa disimpan (Sesi 1).",
            message: "Ups Sorry",
          });
          return;
        }
        const payload = [doc];
        ipcRenderer.send("insert-slalom-result", payload);
        ipcRenderer.once("insert-slalom-result-reply", (_e, res) => {
          if (res && res.ok) {
            ipcRenderer.send("get-alert-saved", {
              type: "question",
              detail: "Session 1 berhasil disimpan.",
              message: "Successfully",
            });
          } else {
            ipcRenderer.send("get-alert", {
              type: "error",
              detail: (res && res.error) || "Save Session 1 failed",
              message: "Failed",
            });
          }
        });
      } catch (e) {
        ipcRenderer.send("get-alert", {
          type: "error",
          detail: e && e.message ? e.message : "Save Session 1 failed",
          message: "Failed",
        });
      }
    },

    buildDocsSession1Only() {
      // Ambil bucket dari localStorage
      const payload = this.loadFromRaceStartPayloadForSlalom();
      const b = (payload && payload.bucket) || {};

      const must = ["eventId", "initialId", "raceId", "divisionId"];
      const miss = must.filter((k) => !b[k]);
      if (miss.length)
        throw new Error("Bucket fields missing: " + miss.join(", "));

      const out = {
        eventId: String(b.eventId || this.$route.params.id || ""),
        initialId: String(b.initialId || ""),
        raceId: String(b.raceId || ""),
        divisionId: String(b.divisionId || ""),
        eventName: String(b.eventName || "SLALOM").toUpperCase(),
        initialName: String(b.initialName || "").toUpperCase(),
        raceName: String(b.raceName || "").toUpperCase(),
        divisionName: String(b.divisionName || "").toUpperCase(),
        teams: [],
      };

      // Ambil dari UI (this.teams) → ambil sessions[0] saja
      const gatesCount = this.SLALOM_GATES.length || 14;

      const fixGates = (arr) => {
        const a = Array.isArray(arr) ? arr.slice() : [];
        const out = [];
        for (let i = 0; i < gatesCount; i++) out.push(Number(a[i] || 0));
        return out;
      };

      for (let i = 0; i < this.teams.length; i++) {
        const t = this.teams[i] || {};
        const s1 =
          Array.isArray(t.sessions) && t.sessions[0] ? t.sessions[0] : {};

        const r1 = {
          session: "Run 1",
          startTime: String(s1.startTime || ""),
          finishTime: String(s1.finishTime || ""),
          raceTime: String(s1.raceTime || ""),
          penaltyTime: String(s1.penaltyTime || "00:00:00.000"),
          penaltyTotal: {
            start: Number(s1.startPenalty || 0),
            finish: Number(s1.finishPenalty || 0),
            gates: fixGates(s1.penalties),
          },
          totalTime: String(s1.totalTime || s1.raceTime || ""),
          ranked: Number(s1.ranked || 0),
          score: Number(s1.score || 0),
          judgesBy: String(s1.judgesBy || ""),
          judgesTime: String(s1.judgesTime || ""),
        };

        out.teams.push({
          teamId: String(t.teamId || ""),
          nameTeam: String(t.nameTeam || ""),
          bibTeam: String(t.bibNumber || t.bibTeam || ""),
          startOrder: String(t.startOrder || ""),
          praStart: String(t.praStart || ""),
          intervalRace: String(t.intervalRace || ""),
          statusId: Number(t.statusId || 0),
          result: [r1],
        });
      }

      return out;
    },

    // ===== MODAL RESULT SESSION 1 (GET dari DB) =====
    async openSession1Modal() {
      this.showSession1Modal = true;
      this.loadingSession1 = true;
      try {
        const key = this.selectedSlalomKey;
        const b = this.slalomBucketMap[key] || {};
        const filters = {
          eventId: String(b.eventId || ""),
          initialId: String(b.initialId || ""),
          raceId: String(b.raceId || ""),
          divisionId: String(b.divisionId || ""),
        };

        // Ambil dari DB result slalom
        const res = await new Promise((resolve) => {
          ipcRenderer.once("get-slalom-result-reply", (_e, payload) =>
            resolve(payload)
          );
          ipcRenderer.send("get-slalom-result", filters);
        });

        const rows = [];
        if (res && res.ok && Array.isArray(res.items)) {
          // Ambil doc pertama yang match bucket
          const doc = res.items[0] || {};
          const teams = Array.isArray(doc.teams) ? doc.teams : [];
          for (let i = 0; i < teams.length; i++) {
            const t = teams[i] || {};
            const s1 = Array.isArray(t.result) ? t.result[0] : null; // === SESSION 1
            if (!s1) continue;

            const g =
              s1.penaltyTotal && Array.isArray(s1.penaltyTotal.gates)
                ? s1.penaltyTotal.gates
                : [];
            const gsum = g.reduce((a, v) => a + (Number(v) || 0), 0);
            const start = Number(
              (s1.penaltyTotal && s1.penaltyTotal.start) || 0
            );
            const finish = Number(
              (s1.penaltyTotal && s1.penaltyTotal.finish) || 0
            );
            const totalPen = start + gsum + finish;

            rows.push({
              nameTeam: String(t.nameTeam || ""),
              bibTeam: String(t.bibTeam || t.bibNumber || ""),
              startPenalty: start,
              gatesSum: gsum,
              finishPenalty: finish,
              totalPenalty: totalPen,
              raceTime: String(s1.raceTime || ""),
              penaltyTime: String(s1.penaltyTime || "00:00:00.000"),
              totalTime: String(s1.totalTime || s1.raceTime || ""),
              ranked: Number(t.ranked || s1.ranked || 0),
              score: Number(t.score || s1.score || 0),
            });
          }
        }
        this.session1Rows = rows;
      } catch {
        this.session1Rows = [];
      }
      this.loadingSession1 = false;
    },

    // ===== PDF SESSION 1 (ambil data dari DB seperti openSession1Modal) =====
    async printPdfSession1() {
      this.loadingSession1 = true;
      try {
        const key = this.selectedSlalomKey;
        const b = this.slalomBucketMap[key] || {};
        const filters = {
          eventId: String(b.eventId || ""),
          initialId: String(b.initialId || ""),
          raceId: String(b.raceId || ""),
          divisionId: String(b.divisionId || ""),
        };

        const res = await new Promise((resolve) => {
          ipcRenderer.once("get-slalom-result-reply", (_e, payload) =>
            resolve(payload)
          );
          ipcRenderer.send("get-slalom-result", filters);
        });

        if (res && res.ok && Array.isArray(res.items)) {
          const doc = res.items[0] || {};
          const teams = Array.isArray(doc.teams) ? doc.teams : [];

          // ✅ ini yang penting → langsung kirim ke komponen PDF
          this.pdfParticipantsSession1 = teams;
          // this.dataEventSafe = doc;
          this.titleCategories =
            (doc.divisionName || "") +
            " " +
            (doc.initialName || "") +
            " " +
            (doc.raceName || "");
        } else {
          this.pdfParticipantsSession1 = [];
        }

        await this.$nextTick();

        const pdf = this.$refs.html2PdfS1;
        if (pdf && typeof pdf.generatePdf === "function") {
          await pdf.generatePdf();
        } else {
          ipcRenderer &&
            ipcRenderer.send("get-alert", {
              type: "warning",
              detail: "Komponen PDF belum siap. Coba lagi.",
              message: "PDF belum siap",
            });
        }
      } catch (err) {
        ipcRenderer &&
          ipcRenderer.send("get-alert", {
            type: "error",
            detail: err.message || "Gagal membuat PDF Session 1",
            message: "Failed",
          });
      }

      this.loadingSession1 = false;
    },
    onPdfGeneratedS1() {
      try {
        ipcRenderer &&
          ipcRenderer.send("get-alert", {
            type: "success",
            detail: "PDF Slalom Session 1 telah berhasil diunduh.",
            message: "Download Selesai",
          });
      } catch (err) {
        logger.warn("❌ Failed to update race settings:", err);
      }
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
/* ---- Styling utk Switch Slalom Category select ---- */
.slalom-actionbar__select {
  min-width: 260px;
  flex: 1 1 260px;
}

.slalom-actionbar__select #drrBucketSelect {
  border-radius: 12px;
  cursor: pointer;
}

#slalomBucketSelect {
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
}

#slalomBucketSelect:hover {
  border-color: rgb(0, 180, 255);
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
}
/* ---- End styling utk Switch Slalom Category select ---- */

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

/* ===== Buttons ===== */
.btn-action {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
  transition: all 0.25s ease;
}

/* Saat hover */
.btn-action:hover {
  background: #eaf3ff;
  border-color: #90c2ff;
  color: #ffffff;
  box-shadow: 0 0 6px rgba(0, 123, 255, 0.25);
}

/* === ACTIVE STATE === */
.btn-action-active {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  border: 1px solid #267cb6;
  color: #ffffff;
  font-weight: 800;
  border-radius: 10px;
  padding: 8px 14px;
  box-shadow: 0 0 12px rgba(37, 99, 235, 0.5),
    inset 0 0 4px rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  transition: all 0.3s ease;
}

/* Saat tombol aktif dihover → makin terang */
.btn-action-active:hover {
  background: linear-gradient(135deg, #25b0eb, #267cb6);
  box-shadow: 0 0 60px rgba(0, 180, 255, 0.4),
    inset 0 0 6px rgba(255, 255, 255, 0.4);
}

/* ===== STYLING BEST TIME RACETIME ===== */
.best-time-tag {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2px;
  background: rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.best-time-cell {
  background: linear-gradient(135deg, #fff8dc, #ffd700, #ffcc00, #ffb700);
  color: #000;
  font-weight: 700;
  text-align: center;
  transition: all 0.4s ease;
  background-size: 200% 200%;
  animation: gold-gradient 6s ease infinite;
  position: relative;
  z-index: 1;
}

/* Animasi gradient halus */
@keyframes gold-gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Glow halus saat hover */
.best-time-cell:hover {
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 200, 0, 0.4);
  cursor: pointer;
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

.btn-action {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
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

/* ===== Port indicator ===== */
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

/* ===== Table look ===== */
.table-responsive {
  overflow-x: auto;
}

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
  text-align: center;
}

/* Header clickable cue */
.is-clickable {
  cursor: pointer;
}

/* Kolom penalties WRAPPED */
.penalties-grid {
  display: grid;
  grid-template-columns: repeat(
    6,
    minmax(56px, 1fr)
  ); /* 8 kolom x 2 baris -> 16 item + S/F = 16 + 2 = 18; akan auto-wrap */
  gap: 6px 8px;
  align-items: center;
}

.p-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.p-label {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  line-height: 1;
  margin-bottom: 2px;
  color: #666;
}

/* Responsif: jika layar sempit, kurangi kolom grid */
@media (max-width: 992px) {
  .penalties-grid {
    grid-template-columns: repeat(6, minmax(52px, 1fr));
  }
}
@media (max-width: 768px) {
  .penalties-grid {
    grid-template-columns: repeat(4, minmax(50px, 1fr));
  }
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

/* --- Slalom Action Bar --- */
.slalom-actionbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.slalom-actionbar__spacer {
  flex: 1 1 auto; /* dorong tombol ke kanan */
}

.slalom-actionbar__buttons {
  display: inline-flex;
  gap: 8px;
  flex: 0 0 auto;
}

@media (max-width: 767.98px) {
  .slalom-actionbar__buttons {
    width: 100%;
    justify-content: flex-end; /* tombol tetap rapi saat wrap */
  }
}
</style>
