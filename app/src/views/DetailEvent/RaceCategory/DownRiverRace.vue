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
            {{ "Down River Race" }}
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
              <span class="mr-3"
                ><strong class="text-white">Location</strong> :
                {{ dataEventSafe.addressCity || "-" }}</span
              >
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
                  <span class="badge-chip badge-chip--blue"
                    >Down River Race</span
                  >
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

    <!-- OPERATION TIME (shared component like Sprint) -->
    <OperationTimePanel
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="participantArr"
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />

    <!-- Selector Bucket DRR -->
    <div class="px-4">
      <div class="card-body">
        <b-row class="align-items-center py-2">
          <b-col>
            <h4>Output Racetime :</h4>
            <small class="text-muted">
              Category active: {{ titleCategories || "-" }}
            </small>
          </b-col>
          <b-col cols="12" md="6">
            <div class="drr-actionbar">
              <b-form-group
                label="Switch DRR Category:"
                label-for="drrBucketSelect"
                class="mb-0 drr-actionbar__select"
              >
                <b-form-select
                  id="drrBucketSelect"
                  :options="drrBucketOptions"
                  v-model="selectedDrrKey"
                  @change="onSelectDrrBucket"
                />
              </b-form-group>

              <div class="drr-actionbar__buttons">
                <!-- === NEW: Preview JSON Button (TAMBAHAN) === -->
                <button
                  type="button"
                  class="btn-action btn-warning"
                  @click="previewJson"
                  :disabled="!currentBucket || !participantArr.length"
                  title="Tampilkan JSON yang akan disimpan"
                >
                  <Icon icon="mdi:code-json" /> Preview JSON
                </button>

                <button
                  type="button"
                  class="btn-action btn-secondary"
                  @click="saveResult"
                  :disabled="!currentBucket || !participantArr.length"
                  title="Simpan hasil untuk bucket yang dipilih"
                >
                  <Icon icon="icon-park-outline:save" /> Save Result
                </button>

                <button
                  type="button"
                  class="btn-action btn-info"
                  @click="toggleSortRanked"
                  :disabled="!participantArr.length"
                  title="Urutkan berdasarkan rank naik/turun"
                >
                  <Icon icon="icon-park-outline:ranking" /> Sort Ranked
                </button>
              </div>
            </div>
          </b-col>
        </b-row>

        <b-row>
          <b-col>
            <div class="table-wrapper">
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
                aria-label="Scrollable results table"
              >
                <thead>
                  <tr>
                    <th class="text-center">No</th>
                    <th class="text-left">Team Name</th>
                    <th class="text-center">BIB Number</th>
                    <th class="text-center">Start Time</th>
                    <th class="text-center">Finish Time</th>
                    <th class="text-center">Race Time</th>
                    <th class="text-center">Penalty Start</th>
                    <th class="text-center">Penalty Section</th>
                    <th class="text-center">Penalty Finish</th>
                    <th class="text-center">Penalty Total</th>
                    <th class="text-center">Result</th>
                    <th class="text-center">Ranked</th>
                    <th class="text-center">Score</th>
                    <th v-if="editResult">Action</th>
                  </tr>
                </thead>
                <tbody v-if="participantArr.length">
                  <tr v-for="(item, index) in participantArr" :key="index">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td class="large-bold text-strong max-char text-left">
                      {{ item.nameTeam }}
                    </td>
                    <td class="text-center">{{ item.bibTeam }}</td>
                    <td class="text-center text-monospace">
                      {{ item.result.startTime }}
                    </td>
                    <td class="text-center text-monospace">
                      {{ item.result.finishTime }}
                    </td>
                    <td class="text-center large-bold text-monospace">
                      {{ item.result.raceTime }}
                    </td>

                    <!-- Pen Start -->
                    <td class="text-center">
                      <b-select
                        class="small-select"
                        v-if="item.result.startTime"
                        v-model="item.result.penaltyStartTime"
                        :placeholder="'Penalty Start'"
                        @change="
                          updateTimePen($event, item, 'penaltyStartTime')
                        "
                      >
                        <option disabled value="">
                          Select Penalty Start Time
                        </option>
                        <option
                          v-for="p in dataPenalties"
                          :key="p.value"
                          :value="p.timePen"
                        >
                          {{ p.label }}
                        </option>
                      </b-select>
                    </td>

                    <!-- Pen Section -->
                    <td class="text-center">
                      <div class="pen-grid">
                        <b-select
                          v-for="sIdx in drrSectionsCount"
                          :key="sIdx"
                          class="small-select"
                          style="border-radius: 12px; font-weight: 600"
                          v-model="item.result.penaltySection[sIdx - 1]"
                          @change="
                            updateTimePen(
                              $event,
                              item,
                              'penaltySection',
                              sIdx - 1
                            )
                          "
                        >
                          <option disabled value="">Section {{ sIdx }}</option>
                          <option
                            v-for="p in dataPenalties"
                            :key="p.value"
                            :value="p.timePen"
                          >
                            {{ p.label }}
                          </option>
                        </b-select>
                      </div>
                    </td>

                    <!-- Pen Finish -->
                    <td class="text-center">
                      <b-select
                        class="small-select"
                        v-if="item.result.startTime"
                        v-model="item.result.penaltyFinishTime"
                        :placeholder="'Penalty Finish'"
                        @change="
                          updateTimePen($event, item, 'penaltyFinishTime')
                        "
                      >
                        <option disabled value="">
                          Select Penalty Finish Time
                        </option>
                        <option
                          v-for="p in dataPenalties"
                          :key="p.value"
                          :value="p.timePen"
                        >
                          {{ p.label }}
                        </option>
                      </b-select>
                    </td>

                    <td
                      class="text-center large-bold penalty-char text-monospace"
                    >
                      {{ item.result.penaltyTime }}
                    </td>
                    <td
                      class="text-center large-bold result-char text-monospace"
                    >
                      {{
                        item.result.penaltyTime
                          ? item.result.totalTime
                          : item.result.raceTime
                      }}
                    </td>
                    <td class="text-center large-bold">
                      {{ item.result.ranked }}
                    </td>
                    <td class="text-center large-bold">
                      {{ getScoreByRanked(item.result.ranked) }}
                    </td>

                    <td v-if="editResult">
                      <!-- <b-button
                        size="sm"
                        variant="warning"
                        @click="openModal(item)"
                        >Edit</b-button
                      > -->

                      <b-button
                        size="sm"
                        class="btn-action"
                        variant="danger"
                        @click="resetRow(item)"
                        title="Reset this row"
                      >
                        Reset
                      </b-button>
                    </td>
                  </tr>
                </tbody>

                <tbody v-else>
                  <tr>
                    <td colspan="14" class="text-center text-muted py-5">
                      Data not found
                    </td>
                  </tr>
                </tbody>
              </table>
              <!-- EMPTY STATE -->
              <EmptyCard v-else />
            </div>
            <br />
          </b-col>
        </b-row>

        <b-button @click="goTo()" variant="outline-info" class="btn-action">
          <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
        </b-button>
      </div>
    </div>

    <!-- === NEW: MODAL PREVIEW JSON (TAMBAHAN) === -->
    <b-modal
      id="preview-json-modal"
      title="Preview JSON – Down River Race"
      size="xl"
      hide-footer
    >
      <div class="mb-2 text-muted small">
        <div><strong>Bucket</strong> : {{ titleCategories || "-" }}</div>
        <div>
          <strong>Total Teams</strong> :
          {{ (previewDocs && previewDocs.length) || 0 }}
        </div>
      </div>

      <b-form-group label="Pretty print:" label-cols-sm="2" class="mb-2">
        <b-form-checkbox
          v-model="prettyPrint"
          switch
          @change="refreshPreviewText"
        >
          {{ prettyPrint ? "ON" : "OFF" }}
        </b-form-checkbox>
      </b-form-group>

      <div class="json-scroll">
        <pre class="json-pre">{{ previewJsonText }}</pre>
      </div>

      <div class="d-flex justify-content-between mt-3">
        <div class="d-flex">
          <b-button
            variant="outline-secondary"
            class="mr-2 btn-action"
            @click="copyPreview"
          >
            <Icon icon="mdi:content-copy" /> Copy JSON
          </b-button>
          <b-button
            variant="outline-secondary"
            class="btn-action"
            @click="downloadPreview"
          >
            <Icon icon="mdi:download" /> Download JSON
          </b-button>
        </div>
        <div class="d-flex">
          <b-button
            variant="secondary"
            class="mr-2 btn-action"
            @click="$bvModal.hide('preview-json-modal')"
          >
            Cancel
          </b-button>
          <b-button
            variant="success"
            class="btn-action"
            @click="saveResultConfirmed"
          >
            <Icon icon="mdi:check-circle" /> Continue &amp; Save
          </b-button>
        </div>
      </div>
    </b-modal>
    <!-- === END MODAL PREVIEW JSON === -->
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { createSerialReader, listPorts } from "@/utils/serialConnection.js";
import OperationTimePanel from "@/components/race/OperationTeamPanel.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import EmptyCard from "@/components/cards/card-empty.vue";
import { logger } from "@/utils/logger";
import { Icon } from "@iconify/vue2";

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

function buildResultDocs(participantArr, bucket) {
  const now = new Date();

  const asStr = (v) => (v == null ? "" : String(v));
  const asNum = (v, d = 0) =>
    Number.isFinite(Number(v)) ? Number(v) : Number(d);
  const timeOrZero = (t) => asStr(t) || "00:00:00.000";

  return participantArr.map((t) => {
    const team = {
      nameTeam: asStr(t.nameTeam),
      bibTeam: asStr(t.bibTeam),
      startOrder: asStr(t.startOrder),
      praStart: asStr(t.praStart),
      intervalRace: asStr(t.intervalRace),
      statusId: asNum(t.statusId, 0),
    };

    const r = { ...(t.result || {}) };
    const o = { ...(t.otr || {}) };

    // ambil nilai penalti numerik
    const startPenalty = asNum(r.startPenalty, 0);
    const finishPenalty = asNum(r.finishPenalty, 0);
    const sectionPenalty = asNum(r.sectionPenalty, 0);
    const totalPenalty = startPenalty + finishPenalty + sectionPenalty;

    // ambil waktu penalti (default “00:00:00.000”)
    const startPenaltyTime = timeOrZero(
      r.penaltyStartTime || r.startPenaltyTime
    );
    const finishPenaltyTime = timeOrZero(
      r.penaltyFinishTime || r.finishPenaltyTime
    );
    const sectionPenaltyTime = Array.isArray(
      r.penaltySectionTime || r.penaltySection
    )
      ? (r.penaltySectionTime || r.penaltySection).map(timeOrZero)
      : ["00:00:00.000", "00:00:00.000", "00:00:00.000"];

    // total penalty time (bisa dihitung otomatis atau pakai field dari UI)
    const totalPenaltyTime = timeOrZero(r.penaltyTime || r.totalPenaltyTime);
    const totalTime = timeOrZero(r.totalTime || r.raceTime);

    const result = {
      startTime: asStr(r.startTime),
      finishTime: asStr(r.finishTime),
      raceTime: asStr(r.raceTime),

      startPenalty,
      finishPenalty,
      sectionPenalty,
      totalPenalty,

      startPenaltyTime,
      finishPenaltyTime,
      sectionPenaltyTime,
      totalPenaltyTime,

      totalTime,
      ranked: asNum(r.ranked, 0),
      score: asNum(r.score, 0),
      judgesBy: asStr(r.judgesBy),
      judgesTime: asStr(r.judgesTime),
    };

    const otr = {
      startTime: asStr(o.startTime),
      finishTime: asStr(o.finishTime),
      raceTime: asStr(o.raceTime),
      penaltyStartTime: asStr(o.penaltyStartTime),
      penaltyFinishTime: asStr(o.penaltyFinishTime),
      penaltySection: Array.isArray(o.penaltySection)
        ? o.penaltySection.map(asStr)
        : ["", "", ""],
      penaltyTime: asStr(o.penaltyTime),
      totalTime: asStr(o.totalTime),
      ranked: asStr(o.ranked),
      score: asStr(o.score),
      penalty: asStr(o.penalty),
    };

    return {
      eventId: asStr(bucket.eventId),
      initialId: asStr(bucket.initialId),
      raceId: asStr(bucket.raceId),
      divisionId: asStr(bucket.divisionId),
      eventName: asStr(bucket.eventName || "DRR"),
      initialName: asStr(bucket.initialName),
      raceName: asStr(bucket.raceName),
      divisionName: asStr(bucket.divisionName),

      ...team,
      result,
      otr,

      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  });
}

function normalizeTeamForDRR(t = {}) {
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
    penaltyStartTime: "",
    penaltyFinishTime: "",
    penaltySection: ["", "", ""],
    penaltyTime: "",
    totalTime: "",
    startPenalty: 0,
    finishPenalty: 0,
    sectionPenalty: 0,
    totalPenalty: 0,
    ranked: "",
    score: "",
  };

  let result = t.result;
  if (Array.isArray(result)) result = result[0] || {};
  if (!result || typeof result !== "object") result = {};
  result = { ...emptyRes, ...result };

  let otr = t.otr;
  if (!otr || typeof otr !== "object") otr = {};
  otr = { ...emptyRes, ...otr };

  if (!Array.isArray(result.penaltySection))
    result.penaltySection = ["", "", ""];
  while (result.penaltySection.length < 3) result.penaltySection.push("");

  return { ...base, result, otr };
}

function loadRaceStartPayloadForDRR() {
  let obj = {};

  obj = JSON.parse(localStorage.getItem(RACE_PAYLOAD_KEY) || "{}");

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
    teams: Array.isArray(b.teams) ? b.teams.map(normalizeTeamForDRR) : [],
  };
  return { bucket };
}

function readEventDetailsFromLS() {
  try {
    const raw = localStorage.getItem("eventDetails");
    const obj = raw ? JSON.parse(raw) : null;
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

export default {
  name: "SustainableTimingSystemDRRRace",
  components: { OperationTimePanel, EmptyCard, Icon },
  data() {
    return {
      isLoading: false,
      defaultImg,
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
      drrBucketOptions: [],
      drrBucketMap: Object.create(null),
      selectedDrrKey: "",
      currentBucket: null,
      drrSectionsCount: 3,
      editForm: "",
      editResult: false,
      dataPenalties: [
        { label: "0", value: 0, timePen: "00:00:00.000" },
        { label: "+ 10", value: 10, timePen: "00:00:10.000" },
        { label: "- 10", value: -10, timePen: "-00:00:10.000" },
        { label: "+ 50", value: 50, timePen: "00:00:50.000" },
      ],
      dataScore: [
        { ranking: 1, score: 350 },
        { ranking: 2, score: 322 },
        { ranking: 3, score: 301 },
        { ranking: 4, score: 287 },
        { ranking: 5, score: 277 },
        { ranking: 6, score: 266 },
        { ranking: 7, score: 256 },
        { ranking: 8, score: 245 },
        { ranking: 9, score: 235 },
        { ranking: 10, score: 224 },
        { ranking: 11, score: 214 },
        { ranking: 12, score: 203 },
        { ranking: 13, score: 193 },
        { ranking: 14, score: 182 },
        { ranking: 15, score: 172 },
        { ranking: 16, score: 161 },
        { ranking: 17, score: 151 },
        { ranking: 18, score: 140 },
        { ranking: 19, score: 133 },
        { ranking: 20, score: 126 },
        { ranking: 21, score: 119 },
        { ranking: 22, score: 112 },
        { ranking: 23, score: 105 },
        { ranking: 24, score: 98 },
        { ranking: 25, score: 91 },
        { ranking: 26, score: 84 },
        { ranking: 27, score: 77 },
        { ranking: 28, score: 70 },
        { ranking: 29, score: 63 },
        { ranking: 30, score: 56 },
        { ranking: 31, score: 49 },
        { ranking: 32, score: 42 },
      ],
      digitTimeStart: null,
      digitTimeFinish: null,
      currentPort: "",
      isRankedDescending: false,
      participant: [],
      dataEvent: {},
      titleCategories: "",

      /* === NEW: State untuk Preview JSON (TAMBAHAN) === */

      previewDocs: [],
      previewJsonText: "",
      prettyPrint: true,
    };
  },
  computed: {
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
    currentEventId() {
      const fromEvent = String(
        this.dataEventSafe._id || this.dataEventSafe.id || ""
      );
      const fromRoute =
        this.$route && this.$route.params && this.$route.params.id
          ? String(this.$route.params.id)
          : "";
      const fromBucket = getBucket().eventId ? String(getBucket().eventId) : "";
      return fromEvent || fromRoute || fromBucket || "";
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

    divisions() {
      return Array.isArray(this.dataEventSafe.categoriesDivision)
        ? this.dataEventSafe.categoriesDivision.map((d) => ({
            id: String(d.value),
            name: String(d.name),
          }))
        : [];
    },

    races() {
      return Array.isArray(this.dataEventSafe.categoriesRace)
        ? this.dataEventSafe.categoriesRace.map((r) => ({
            id: String(r.value),
            name: String(r.name),
          }))
        : [];
    },

    initials() {
      return Array.isArray(this.dataEventSafe.categoriesInitial)
        ? this.dataEventSafe.categoriesInitial.map((i) => ({
            id: String(i.value),
            name: String(i.name),
          }))
        : [];
    },

    drrEventId() {
      // cari eventId untuk kategori DRR
      const cat = (this.dataEventSafe.categoriesEvent || []).find(
        (c) => String(c.name || "").toUpperCase() === "DRR"
      );
      return cat ? String(cat.value) : "";
    },
  },
  async mounted() {
    this.dataEvent = readEventDetailsFromLS();
    this.buildStaticDrrOptions();

    if (this.drrBucketOptions.length) {
      const savedKey = localStorage.getItem("currentDRRBucketKey");
      this.selectedDrrKey =
        savedKey && this.drrBucketMap[savedKey]
          ? savedKey
          : this.drrBucketOptions[0].value;

      await this.fetchBucketTeamsByKey(this.selectedDrrKey);
    } else {
      await this.loadAllDrrBucketsFromEvent(); // fallback lama kalau perlu
    }

    this.fetchDrrSectionCountFromSettings();
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
    resetRow(item) {
      if (!item || !item.result) return;

      // panjang penalty section mengikuti setting saat ini
      var secLen =
        Number.isFinite(this.drrSectionsCount) && this.drrSectionsCount > 0
          ? this.drrSectionsCount
          : 3;

      // kosongkan waktu utama
      item.result.startTime = "";
      item.result.finishTime = "";
      item.result.raceTime = "";
      item.result.startPenalty = 0;
      item.result.finishPenalty = 0;
      item.result.sectionPenalty = 0;
      item.result.totalPenalty = 0;

      // kosongkan penalti DRR
      item.result.penaltyStartTime = "";
      item.result.penaltyFinishTime = "";

      var emptySections = Array.from({ length: secLen }, function () {
        return "";
      });
      if (this.$set) this.$set(item.result, "penaltySection", emptySections);
      else item.result.penaltySection = emptySections;

      item.result.penaltyTime = "";
      item.result.totalTime = "";

      // peringkat & skor
      item.result.ranked = "";
      item.result.score = "";

      // jika masih ada field model lama (sprint), aman-kan:
      if (typeof item.result.startPenalty !== "undefined")
        item.result.startPenalty = 0;
      if (typeof item.result.finishPenalty !== "undefined")
        item.result.finishPenalty = 0;
      if (typeof item.result.totalPenalty !== "undefined")
        item.result.totalPenalty = 0;

      // re-assign ranking setelah reset
      this.assignRanks(this.participant);

      // paksa re-render jika diperlukan
      if (this.$forceUpdate) this.$forceUpdate();
    },
    buildStaticDrrOptions() {
      const eventId = this.currentEventId; // pakai ID event aktif (bukan "4")
      if (!eventId) return;

      // --- fallback kalau kategori di event kosong ---
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
            const key = [eventId, init.id, race.id, div.id].join("|");
            const label = `${div.name} ${race.name} – ${init.name}`;
            opts.push({ value: key, text: label });
            map[key] = {
              eventId,
              initialId: init.id,
              raceId: race.id,
              divisionId: div.id,
              eventName: "DRR",
              initialName: init.name,
              raceName: race.name,
              divisionName: div.name,
              teams: [],
            };
          });
        });
      });

      this.drrBucketOptions = opts;
      this.drrBucketMap = map;
    },
    async loadAllDrrBucketsFromDB() {
      try {
        if (typeof ipcRenderer === "undefined") return;

        // 1) sumber eventId
        const bucketLS = getBucket();
        const routeId =
          this.$route && this.$route.params && this.$route.params.id
            ? String(this.$route.params.id)
            : "";
        let eventDetailsId = "";
        try {
          const evRaw = localStorage.getItem("eventDetails");
          const evObj = evRaw ? JSON.parse(evRaw) : null;
          eventDetailsId =
            evObj && (evObj._id || evObj.id)
              ? String(evObj._id || evObj.id)
              : "";
        } catch (err) {
          logger.warn("❌ Failed to update race settings:", err);
        }

        const finalEventId = bucketLS.eventId || routeId || eventDetailsId;

        if (!finalEventId) {
          this.drrBucketOptions = [];
          this.drrBucketMap = {};
          return;
        }

        // 2) panggil IPC
        const filters = { eventId: finalEventId };

        const res = await new Promise((resolve) => {
          ipcRenderer.once("teams-registered:find-reply", (_e, payload) => {
            resolve(payload);
          });
          ipcRenderer.send("teams-registered:find", filters);
        });

        if (!res || !res.ok) {
          this.drrBucketOptions = [];
          this.drrBucketMap = {};
          return;
        }
        if (!Array.isArray(res.items) || res.items.length === 0) {
          this.drrBucketOptions = [];
          this.drrBucketMap = {};
          return;
        }

        // 3) mapping → options + map + agregat
        const map = Object.create(null);
        const opts = [];

        const agg = {
          eventId: "",
          initialId: "",
          raceId: "",
          divisionId: "",
          eventName: "DRR",
          initialName: "ALL",
          raceName: "ALL",
          divisionName: "ALL",
          teams: [],
          _isAggregate: true,
        };

        const toUpper = (v) => String(v || "").toUpperCase();

        res.items.forEach((b) => {
          const normalizedTeams = Array.isArray(b.teams)
            ? b.teams.map(normalizeTeamForDRR)
            : [];

          const bucketDoc = {
            ...b,
            eventName: toUpper(b.eventName),
            initialName: toUpper(b.initialName),
            raceName: toUpper(b.raceName),
            divisionName: toUpper(b.divisionName),
            teams: normalizedTeams,
          };

          const key = this._bucketKey(bucketDoc); // "eventId|initialId|raceId|divisionId"
          const label = this._bucketLabel(bucketDoc); // "DIV RACE – INITIAL"

          map[key] = bucketDoc;
          opts.push({ value: key, text: label });

          // agregat
          agg.teams.push(...normalizedTeams.map((t) => ({ ...t })));
        });

        // hapus duplikat tim di agregat (nameTeam+bibTeam)
        if (agg.teams.length) {
          const seen = new Set();
          agg.teams = agg.teams.filter((t) => {
            const sig = `${String(t.nameTeam).toUpperCase()}|${String(
              t.bibTeam
            )}`;
            if (seen.has(sig)) return false;
            seen.add(sig);
            return true;
          });
          const aggKey = "__ALL_DRR__";
          map[aggKey] = agg;
          opts.unshift({ value: aggKey, text: "All DRR Teams (aggregate)" });
        }

        // 4) commit ke state
        this.drrBucketMap = map;
        this.drrBucketOptions = opts;

        // 5) pilih bucket default
        const savedKey = localStorage.getItem("currentDRRBucketKey");
        if (savedKey && map[savedKey]) {
          this._useDrrBucket(savedKey);
          this.selectedDrrKey = savedKey;
          return;
        }

        const startKey = this._bucketKey({
          eventId: finalEventId,
          initialId: bucketLS.initialId,
          raceId: bucketLS.raceId,
          divisionId: bucketLS.divisionId,
        });
        if (map[startKey]) {
          this._useDrrBucket(startKey);
          this.selectedDrrKey = startKey;
          return;
        }

        if (opts.length) {
          this._useDrrBucket(opts[0].value); // biasanya agregat
          this.selectedDrrKey = opts[0].value;
        }
      } catch (err) {
        logger.warn("❌ Failed to update race settings:", err);
      }
    },
    loadAllDrrBucketsFromEvent() {
      try {
        this.isLoading = true;
        const raw = localStorage.getItem("eventDetails");
        const ev = raw ? JSON.parse(raw) : {};
        const participant = Array.isArray(ev.participant) ? ev.participant : [];

        // Ambil semua bucket yang eventName-nya DRR (case-insensitive)
        const drrBuckets = participant.filter(
          (b) => String(b.eventName || "").toUpperCase() === "DRR"
        );

        // siapkan map & options
        const map = Object.create(null);
        const opts = [];

        // optional: opsi "All DRR Teams" sebagai agregat
        const agg = {
          eventId: "",
          initialId: "",
          raceId: "",
          divisionId: "",
          eventName: "DRR",
          initialName: "ALL",
          raceName: "ALL",
          divisionName: "ALL",
          teams: [],
          _isAggregate: true,
        };

        drrBuckets.forEach((b) => {
          const key = this._bucketKey(b);
          const label = this._bucketLabel(b);
          const normalizedTeams = Array.isArray(b.teams)
            ? b.teams.map(normalizeTeamForDRR)
            : [];

          map[key] = {
            ...b,
            teams: normalizedTeams,
          };
          opts.push({ value: key, text: label });

          // gabungkan ke agregat
          agg.teams.push(...normalizedTeams.map((t) => ({ ...t })));
        });

        // hapus duplikat di agregat berdasarkan (nameTeam + bibTeam)
        if (agg.teams.length) {
          const seen = new Set();
          agg.teams = agg.teams.filter((t) => {
            const sig = `${String(t.nameTeam).toUpperCase()}|${String(
              t.bibTeam
            )}`;
            if (seen.has(sig)) return false;
            seen.add(sig);
            return true;
          });
        }

        // masukkan opsi aggregate paling atas kalau mau dipakai
        if (agg.teams.length) {
          const aggKey = "__ALL_DRR__";
          map[aggKey] = agg;
          opts.unshift({ value: aggKey, text: "All DRR Teams (aggregate)" });
        }

        this.drrBucketMap = map;
        this.drrBucketOptions = opts;

        // pilih default:
        // 1) restore dari localStorage, atau
        // 2) kalau ada raceStartPayload dan bucket-nya DRR, pakai itu, atau
        // 3) ambil opsi pertama
        const savedKey = localStorage.getItem("currentDRRBucketKey");

        if (savedKey && map[savedKey]) {
          this._useDrrBucket(savedKey);
          this.selectedDrrKey = savedKey;
          return;
        }

        const { bucket } = loadRaceStartPayloadForDRR();
        const startKey = bucket && this._bucketKey(bucket);
        if (startKey && map[startKey]) {
          this._useDrrBucket(startKey);
          this.selectedDrrKey = startKey;
          return;
        }

        if (opts.length) {
          this._useDrrBucket(opts[0].value);
          this.selectedDrrKey = opts[0].value;
        }
      } catch {
        // biarkan fallback yang sudah ada (loadFromRaceStartPayload / checkValueStorage)
      }
      this.isLoading = false;
    },

    _useDrrBucket(key) {
      const b = this.drrBucketMap[key];
      if (!b) return;

      // set participant & judul
      this.participant = (b.teams || []).map((t) => ({ ...t }));
      this.titleCategories = b._isAggregate
        ? "ALL DIVISION/RACE – ALL INITIAL (DRR)"
        : this._bucketLabel(b);

      // set bucket aktif (dipakai Save)
      this.currentBucket = b._isAggregate
        ? null // aggregate tidak punya ID → Save dinonaktifkan atau diarahkan untuk pilih bucket spesifik
        : {
            eventId: String(b.eventId || ""),
            initialId: String(b.initialId || ""),
            raceId: String(b.raceId || ""),
            divisionId: String(b.divisionId || ""),
            eventName: String(b.eventName || "").toUpperCase(),
            initialName: String(b.initialName || "").toUpperCase(),
            raceName: String(b.raceName || "").toUpperCase(),
            divisionName: String(b.divisionName || "").toUpperCase(),
          };

      // simpan pilihan terakhir
      localStorage.setItem("currentDRRBucketKey", key);

      // sesuaikan jumlah section bila setting berbeda
      this.applyDrrSectionCount(this.drrSectionsCount);

      if (this.currentBucket && typeof ipcRenderer !== "undefined") {
        ipcRenderer.send("race-settings:get", this.currentBucket.eventId);
        ipcRenderer.once("race-settings:get-reply", (_e, res) => {
          let count = 3;
          if (res && res.ok && res.settings && res.settings.drr) {
            const c = parseInt(res.settings.drr.totalSection, 10);
            if (Number.isFinite(c) && c > 0) count = c;
          }
          this.applyDrrSectionCount(count);
        });
      }
    },

    async onSelectDrrBucket(key) {
      await this.fetchBucketTeamsByKey(key);
    },

    async fetchBucketTeamsByKey(key) {
      try {
        this.isLoading = true;

        if (
          !key ||
          !this.drrBucketMap[key] ||
          typeof ipcRenderer === "undefined"
        )
          return;

        const b = this.drrBucketMap[key];
        const filters = {
          eventId: String(b.eventId),
          initialId: String(b.initialId),
          raceId: String(b.raceId),
          divisionId: String(b.divisionId),
        };

        // simpan pilihan
        this.selectedDrrKey = key;
        localStorage.setItem("currentDRRBucketKey", key);

        // request ke main
        const res = await new Promise((resolve) => {
          ipcRenderer.once("teams-registered:find-reply", (_e, payload) =>
            resolve(payload)
          );
          ipcRenderer.send("teams-registered:find", filters);
        });

        if (!res || !res.ok) {
          this.participant = [];
          this.currentBucket = null;
          this.titleCategories = this._bucketLabel(b);
          return;
        }

        // server bisa return 1 dokumen bucket atau array dokumen.
        // Karena kita kasih filter lengkap (4 id), mestinya 0/1 dokumen.
        const doc = Array.isArray(res.items) ? res.items[0] : res.items;
        const teams =
          doc && Array.isArray(doc.teams)
            ? doc.teams.map(normalizeTeamForDRR)
            : [];

        // set participant + judul + currentBucket (buat save)
        this.participant = teams;
        this.titleCategories = this._bucketLabel(b);
        this.currentBucket = {
          eventId: b.eventId,
          initialId: b.initialId,
          raceId: b.raceId,
          divisionId: b.divisionId,
          eventName: "DRR",
          initialName: b.initialName,
          raceName: b.raceName,
          divisionName: b.divisionName,
        };

        // sesuaikan jumlah section penalty ke setting
        this.applyDrrSectionCount(this.drrSectionsCount);
      } catch (err) {
        logger.warn("❌ Failed to update race settings:", err);
      }
      this.isLoading = false;
    },
    _bucketKey(b) {
      // pakai ID kalau ada, fallback ke nama (UPPER) agar stabil
      const ei = String(b.eventId || "");
      const ii = String(b.initialId || "");
      const ri = String(b.raceId || "");
      const di = String(b.divisionId || "");
      return [ei, ii, ri, di].join("|");
    },
    _bucketLabel(b) {
      // contoh label: "R4 MEN – JUNIOR"
      const div = String(b.divisionName || "").toUpperCase();
      const rac = String(b.raceName || "").toUpperCase();
      const ini = String(b.initialName || "").toUpperCase();
      return `${div} ${rac} – ${ini}`;
    },
    _resizePenaltySections(arr, targetLen) {
      const out = Array.isArray(arr) ? arr.slice(0, targetLen) : [];
      while (out.length < targetLen) out.push("");
      return out;
    },
    async fetchDrrSectionCountFromSettings() {
      try {
        if (typeof ipcRenderer === "undefined") return;

        const bucket = getBucket(); // sudah ada di file-mu
        const eventId = String(bucket.eventId || "");
        if (!eventId) return;

        // token untuk cegah balasan lama nindih
        const token = Date.now();
        this._lastRSFetchToken = token;

        ipcRenderer.send("race-settings:get", eventId);
        ipcRenderer.once("race-settings:get-reply", (_e, res) => {
          if (this._lastRSFetchToken !== token) return;

          let count = 3;
          if (res && res.ok && res.settings && res.settings.drr) {
            const c = parseInt(res.settings.drr.totalSection, 10);
            if (Number.isFinite(c) && c > 0) count = c;
          }
          this.applyDrrSectionCount(count);
        });
      } catch (err) {
        logger.warn("❌ Failed to update race settings:", err);
      }
    },

    applyDrrSectionCount(count) {
      const c = Number.isFinite(count) && count > 0 ? count : 3;
      this.drrSectionsCount = c;

      if (Array.isArray(this.participant)) {
        this.participant = this.participant.map((t) => {
          const nt = { ...t };
          const r =
            nt.result && typeof nt.result === "object" ? { ...nt.result } : {};
          r.penaltySection = this._resizePenaltySections(r.penaltySection, c);
          nt.result = r;

          if (nt.otr && typeof nt.otr === "object") {
            nt.otr = { ...nt.otr };
            nt.otr.penaltySection = this._resizePenaltySections(
              nt.otr.penaltySection,
              c
            );
          }

          return nt;
        });
      }
    },

    timeToPenaltyValue(timeStr) {
      const p = String(timeStr || "");
      // cari di dataPenalties by timePen
      const found = this.dataPenalties.find((x) => x.timePen === p);
      if (found) return Number(found.value) || 0;

      // fallback: parse waktu jadi detik & pakai sebagai nilai (misal 00:00:50.000 → 50, tanda minus ikut)
      const neg = p.startsWith("-");
      const t = p.replace("-", "");
      const [hh = "0", mm = "0", ssms = "0"] = t.split(":");
      const ss = parseFloat(ssms) || 0; // boleh ada .ms, tetap aman
      const val = +hh * 3600 + +mm * 60 + ss; // detik
      return (neg ? -1 : 1) * Math.round(val); // bulatkan ke detik terdekat
    },

    loadFromRaceStartPayload() {
      const { bucket } = loadRaceStartPayloadForDRR();
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

      dataStorage = localStorage.getItem("participantByCategories");
      events = localStorage.getItem("eventDetails");

      this.dataEvent = events ? JSON.parse(events) : {};
      const raw = dataStorage ? JSON.parse(dataStorage) : [];
      const arr = Array.isArray(raw) ? raw : Object.values(raw || {});
      arr.sort((a, b) =>
        String(a.praStart || "").localeCompare(String(b.praStart || ""))
      );
      this.participant = arr.map(normalizeTeamForDRR);
      this.titleCategories = String(
        localStorage.getItem("currentCategories") || ""
      ).trim();
    },

    openModal(datas) {
      this.editForm = datas;
      this.$bvModal &&
        this.$bvModal.show &&
        this.$bvModal.show("bv-modal-edit-team");
    },

    async assignRanks(items) {
      const itemsWith = items.filter(
        (it) => it.result.totalTime || it.result.raceTime
      );
      itemsWith.sort(
        (a, b) =>
          this.parsesTime(a.result.totalTime || a.result.raceTime) -
          this.parsesTime(b.result.totalTime || b.result.raceTime)
      );
      itemsWith.forEach((it, idx) => {
        it.result.ranked = idx + 1;
      });
    },

    parsesTime(timeStr) {
      if (!timeStr) return Number.POSITIVE_INFINITY;
      const [h = 0, m = 0, s = 0] = String(timeStr).split(":").map(parseFloat);
      return h * 3600 * 1000 + m * 60 * 1000 + s * 1000;
    },

    async calculateScore(ranked) {
      const f = this.dataScore.find((d) => d.ranking === ranked);
      return f ? f.score : 0;
    },

    async parseTimeResult(t) {
      const parts = String(t || "00:00:00:000").split(":");
      const [h, m, s, ms] = parts.map((p) => parseInt(p, 10) || 0);
      return h * 3600000 + m * 60000 + s * 1000 + ms;
    },

    async updateTimePen(
      selectedTimePen,
      item,
      penaltyType,
      sectionIndex = null
    ) {
      // 1) set waktu penalti di field yang sesuai
      if (penaltyType === "penaltySection" && sectionIndex !== null) {
        item.result.penaltySection[sectionIndex] = selectedTimePen;
      } else {
        item.result[penaltyType] = selectedTimePen; // "penaltyStartTime" / "penaltyFinishTime"
      }

      // 2) hitung penalty numeric per bagian
      const startPenalty = this.timeToPenaltyValue(
        item.result.penaltyStartTime || "00:00:00.000"
      );
      const finishPenalty = this.timeToPenaltyValue(
        item.result.penaltyFinishTime || "00:00:00.000"
      );

      let sectionPenalty = 0;
      for (const s of item.result.penaltySection || []) {
        sectionPenalty += this.timeToPenaltyValue(s || "00:00:00.000");
      }
      const totalPenalty = startPenalty + finishPenalty + sectionPenalty;

      // 3) simpan angka ke result
      item.result.startPenalty = startPenalty;
      item.result.finishPenalty = finishPenalty;
      item.result.sectionPenalty = sectionPenalty;
      item.result.totalPenalty = totalPenalty;

      // 4) hitung total penalty time (string HH:MM:SS.mmm) sesuai existing logic
      let totalPenaltyTime = "00:00:00.000";
      const fields = [
        item.result.penaltyStartTime || "00:00:00.000",
        item.result.penaltyFinishTime || "00:00:00.000",
        ...(item.result.penaltySection || []).map((x) => x || "00:00:00.000"),
      ];
      for (const p of fields) {
        if (String(p).startsWith("-")) {
          totalPenaltyTime = await this.kurangiWaktu(
            totalPenaltyTime,
            String(p).replace("-", "")
          );
        } else {
          totalPenaltyTime = await this.tambahWaktu(totalPenaltyTime, p);
        }
      }
      item.result.penaltyTime = totalPenaltyTime; // tetap isi field lama
      item.result.totalPenaltyTime = totalPenaltyTime; // kalau mau disimpan juga sesuai pattern baru

      // 5) update totalTime bila raceTime ada
      if (item.result.raceTime) {
        item.result.totalTime = await this.tambahWaktu(
          item.result.raceTime,
          totalPenaltyTime
        );
      }

      this.editResult = true;
      await this.assignRanks(this.participant);
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
      if (title === "start") this.participant[id].result.startTime = val;
      if (title === "finish") {
        this.participant[id].result.finishTime = val;
        if (
          this.participant[id].result.startTime &&
          this.participant[id].result.finishTime
        ) {
          this.participant[id].result.raceTime = await this.hitungSelisihWaktu(
            this.participant[id].result.startTime,
            this.participant[id].result.finishTime
          );
        }
      }
    },

    async hitungSelisihWaktu(a, b) {
      const [h1, m1, s1d] = String(a).split(":");
      const [h2, m2, s2d] = String(b).split(":");
      const s1 = parseInt((s1d || "0").split(".")[0]) || 0;
      const ms1 = parseInt((s1d || "0").split(".")[1]) || 0;
      const s2 = parseInt((s2d || "0").split(".")[0]) || 0;
      const ms2 = parseInt((s2d || "0").split(".")[1]) || 0;
      const d1 = new Date(0);
      d1.setUTCHours(+h1 || 0, +m1 || 0, s1, ms1);
      const d2 = new Date(0);
      d2.setUTCHours(+h2 || 0, +m2 || 0, s2, ms2);
      const diff = d2 - d1;
      const ms = diff % 1000;
      const sec = Math.floor((diff / 1000) % 60);
      const min = Math.floor((diff / (1000 * 60)) % 60);
      const hr = Math.floor(diff / (1000 * 60 * 60));
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
    },

    async tambahWaktu(a, b) {
      const psA = String(a).split(":"),
        psB = String(b).split(":");
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

    async kurangiWaktu(a, b) {
      const psA = String(a).split(":"),
        psB = String(b).split(":");
      const msA =
        (+psA[0] || 0) * 3600000 +
        (+psA[1] || 0) * 60000 +
        (parseFloat(psA[2]) || 0) * 1000;
      const msB =
        (+psB[0] || 0) * 3600000 +
        (+psB[1] || 0) * 60000 +
        (parseFloat(psB[2]) || 0) * 1000;
      let total = msA - msB;
      if (total < 0) total = 0;
      const hr = Math.floor(total / 3600000);
      const rem = total % 3600000;
      const min = Math.floor(rem / 60000);
      const rem2 = rem % 60000;
      const sec = Math.floor(rem2 / 1000);
      const ms = rem2 % 1000;
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
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

      if (!this.currentBucket) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail:
            "Silakan pilih kategori DRR spesifik (bukan aggregate) sebelum menyimpan.",
          message: "Ups Sorry",
        });
        return;
      }

      const must = ["eventId", "initialId", "raceId", "divisionId"];
      const missing = must.filter((k) => !this.currentBucket[k]);
      if (missing.length) {
        ipcRenderer.send("get-alert", {
          type: "error",
          detail: `Bucket fields missing: ${missing.join(", ")}`,
          message: "Failed",
        });
        return;
      }

      const docs = buildResultDocs(clean, this.currentBucket);
      ipcRenderer.send("insert-drr-result", docs);
      ipcRenderer.once("insert-drr-result-reply", (_e, res) => {
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

    goTo() {
      localStorage.removeItem("raceStartPayload");
      localStorage.removeItem("participantByCategories");
      localStorage.removeItem("currentCategories");
      this.participant = [];
      this.titleCategories = "";
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },

    /* === NEW: Helper membangun docs yang sama seperti saat Save (TAMBAHAN) === */
    _buildDocsForSave() {
      const clean = JSON.parse(JSON.stringify(this.participantArr || []));
      return buildResultDocs(clean, this.currentBucket);
    },

    /* === NEW: Buka modal Preview JSON (TAMBAHAN) === */
    async previewJson() {
      try {
        this.previewDocs = this._buildDocsForSave();
        this.prettyPrint = true;
        this.refreshPreviewText();
        this.$bvModal &&
          this.$bvModal.show &&
          this.$bvModal.show("preview-json-modal");
      } catch (e) {
        logger.warn("❌ openPreviewJson failed", e);
      }
    },

    /* === NEW: Toggle pretty/compact (TAMBAHAN) === */
    refreshPreviewText() {
      try {
        if (!Array.isArray(this.previewDocs)) return;
        this.previewJsonText = JSON.stringify(
          this.previewDocs,
          null,
          this.prettyPrint ? 2 : 0
        );
      } catch (err) {
        // ignore
      }
    },

    /* === NEW: Copy JSON ke clipboard (TAMBAHAN) === */
    async copyPreview() {
      try {
        await navigator.clipboard.writeText(this.previewJsonText || "");
        this.notify("success", "JSON copied to clipboard.", "Copied");
      } catch (err) {
        this.notifyError(err, "Copy Failed");
      }
    },

    /* === NEW: Download JSON file (TAMBAHAN) === */
    downloadPreview() {
      try {
        const fileName = `drr-preview-${Date.now()}.json`;
        const blob = new Blob([this.previewJsonText || "[]"], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        this.notifyError(err, "Download Failed");
      }
    },

    /* === NEW: Lanjutkan simpan dari modal (TAMBAHAN) === */
    saveResultConfirmed() {
      try {
        this.$bvModal &&
          this.$bvModal.hide &&
          this.$bvModal.hide("preview-json-modal");

        if (!this.currentBucket) {
          this.notify(
            "warning",
            "Bucket tidak valid untuk penyimpanan.",
            "Save"
          );
          return;
        }
        const must = ["eventId", "initialId", "raceId", "divisionId"];
        const missing = must.filter((k) => !this.currentBucket[k]);
        if (missing.length) {
          this.notify(
            "error",
            `Bucket fields missing: ${missing.join(", ")}`,
            "Save"
          );
          return;
        }

        const docs =
          Array.isArray(this.previewDocs) && this.previewDocs.length
            ? this.previewDocs
            : this._buildDocsForSave();

        if (!docs.length) {
          this.notify(
            "warning",
            "Tidak ada dokumen yang akan disimpan.",
            "Save"
          );
          return;
        }

        ipcRenderer.send("insert-drr-result", docs);
        ipcRenderer.once("insert-drr-result-reply", (_e, res) => {
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
      } catch (err) {
        this.notifyError(err, "Save Failed");
      }
    },
  },
};
</script>

<style scoped>
/* --- DRR Action Bar --- */
.drr-actionbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap; /* biar rapi saat layar kecil */
}

.drr-actionbar__select {
  min-width: 260px;
  flex: 1 1 260px;
}

.drr-actionbar__select #drrBucketSelect {
  border-radius: 12px;
  cursor: pointer;
}

.drr-actionbar__buttons {
  display: inline-flex;
  gap: 8px;
  flex: 0 0 auto;
}

@media (max-width: 767.98px) {
  .drr-actionbar {
    align-items: stretch;
  }
  .drr-actionbar__buttons {
    width: 100%;
    justify-content: flex-end; /* tombol rata kanan saat turun ke baris baru */
  }
}

.pen-grid {
  display: grid;
  /* isi 3 baris dulu (kebawah), lalu lanjut buat kolom baru ke samping */
  grid-template-rows: repeat(3, auto);
  grid-auto-flow: column;
  grid-column-gap: 8px; /* jarak antar kolom */
  grid-row-gap: 6px; /* jarak antar item vertikal */
  align-items: start;
}

/* responsif: di layar kecil, batasi 2 per kolom */
@media (max-width: 576px) {
  .pen-grid {
    grid-template-rows: repeat(2, auto);
  }
}

.btn-action {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
}

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

/* table */
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

/* port */
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

.table-wrapper {
  width: 100%;
  overflow-x: auto; /* enable horizontal scroll */
  -webkit-overflow-scrolling: touch; /* smooth on mobile */
}

.table-wrapper table {
  min-width: 1200px; /* adjust sesuai jumlah kolom */
  border-collapse: collapse;
}

.table-wrapper th,
.table-wrapper td {
  white-space: nowrap; /* prevent wrapping */
}

/* ---- Styling utk Switch DRR Category select ---- */
#drrBucketSelect {
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
}

#drrBucketSelect:hover {
  border-color: rgb(0, 180, 255);
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
}

/* ---- Styling utk penalty section select ---- */
.small-select {
  margin-bottom: 5px;
  width: 140px;
}

.small-select {
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-bottom: 6px; /* jarak antar select */
}

.small-select:hover {
  border-color: rgb(0, 180, 255);
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.5);
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

/* === NEW: Styling area preview JSON (TAMBAHAN) === */
.json-scroll {
  max-height: 60vh;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #0b1020;
  padding: 12px;
}
.json-pre {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: #e5e7eb;
  white-space: pre-wrap; /* wrap kalau area sempit */
  word-break: break-word;
}
</style>
