<
<template>
  <div>
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
            <h6 style="font-weight: 800; font-style: italic">
              Nomor Lomba : DRR
            </h6>
            <h6 style="font-weight: 800; font-style: italic">
              Categories : {{ titleCategories || "-" }}
            </h6>
            <h6 style="font-weight: 800; font-style: italic">
              Tanggal : {{ dataEventSafe.startDateEvent || "-" }} -
              {{ dataEventSafe.endDateEvent || "-" }}
            </h6>
          </b-col>

          <b-col>
            <div style="display: flex; gap: 10px; justify-content: flex-end">
              <button
                type="button"
                class="btn-action btn-secondary"
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

              <button
                type="button"
                :class="{
                  'btn-danger': isPortConnected,
                  'btn-success': !isPortConnected,
                }"
                class="btn-action"
                @click="connectPort"
              >
                <Icon icon="ic:baseline-sync" />
                {{ isPortConnected ? "Disconnect Device" : "Connect Device" }}
              </button>
              <span
                class="status-indicator"
                :class="{
                  connected: isPortConnected,
                  disconnected: !isPortConnected,
                }"
              ></span>
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
        <b-row class="align-items-center">
          <b-col>
            <h4>List Result (Down River Race)</h4>
            <small class="text-muted">
              Category active: {{ titleCategories || "-" }}
            </small>
          </b-col>
          <b-col cols="12" md="6">
            <b-form-group
              label="Switch DRR Category:"
              label-for="drrBucketSelect"
              class="mb-0"
            >
              <b-form-select
                id="drrBucketSelect"
                :options="drrBucketOptions"
                v-model="selectedDrrKey"
                @change="onSelectDrrBucket"
              />
            </b-form-group>
          </b-col>
        </b-row>
      </div>
    </div>

    <!-- RESULT TABLE -->
    <div class="px-4">
      <div class="card-body">
        <b-row>
          <b-col>
            <div class="table-wrapper">
              <table class="table" aria-label="Scrollable results table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Team Name</th>
                    <th>BIB</th>
                    <th>Start Time</th>
                    <th>Finish Time</th>
                    <th>Race Time</th>
                    <th>Pen Start</th>
                    <th>Pen Section</th>
                    <th>Pen Finish</th>
                    <th>Pen Total</th>
                    <th>Result</th>
                    <th>Ranked</th>
                    <th>Score</th>
                    <th v-if="editResult">Action</th>
                  </tr>
                </thead>
                <tbody v-if="participantArr.length">
                  <tr v-for="(item, index) in participantArr" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td class="large-bold text-strong max-char">
                      {{ item.nameTeam }}
                    </td>
                    <td class="large-bold">{{ item.bibTeam }}</td>
                    <td class="text-monospace">{{ item.result.startTime }}</td>
                    <td class="text-monospace">{{ item.result.finishTime }}</td>
                    <td class="large-bold text-monospace">
                      {{ item.result.raceTime }}
                    </td>

                    <!-- Pen Start -->
                    <td>
                      <b-select
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
                    <td>
                      <div class="pen-grid">
                        <b-select
                          v-for="sIdx in drrSectionsCount"
                          :key="sIdx"
                          class="small-select"
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
                    <td>
                      <b-select
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

                    <td class="large-bold penalty-char text-monospace">
                      {{ item.result.penaltyTime }}
                    </td>
                    <td class="large-bold result-char text-monospace">
                      {{
                        item.result.penaltyTime
                          ? item.result.totalTime
                          : item.result.raceTime
                      }}
                    </td>
                    <td class="large-bold">{{ item.result.ranked }}</td>
                    <td class="large-bold">
                      {{ getScoreByRanked(item.result.ranked) }}
                    </td>

                    <td v-if="editResult">
                      <b-button
                        size="sm"
                        variant="warning"
                        @click="openModal(item)"
                        >Edit</b-button
                      >
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
            </div>
            <br />
          </b-col>
        </b-row>
      </div>

      <b-button @click="goTo()" variant="outline-info" class="btn-action">
        <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
      </b-button>
    </div>

    <br /><br />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { SerialPort } from "serialport";
import OperationTimePanel from "@/components/race/OperationTeamPanel.vue";
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
    result.penaltyStartTime = String(result.penaltyStartTime || "");
    result.penaltyFinishTime = String(result.penaltyFinishTime || "");
    result.penaltySection = Array.isArray(result.penaltySection)
      ? result.penaltySection.map((x) => String(x || ""))
      : [];
    result.penaltyTime = String(result.penaltyTime || "00:00:00.000");
    result.totalTime = String(result.totalTime || result.raceTime || "");
    result.ranked = Number.isFinite(result.ranked)
      ? Number(result.ranked)
      : result.ranked
      ? Number(result.ranked)
      : 0;
    result.score = Number.isFinite(result.score)
      ? Number(result.score)
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

// --- KATALOG DRR (fix) ---
const DRR_EVENT_ID = "4"; // value eventId untuk DRR

function catalogsFromEvent(ev = {}) {
  const safeArr = (a) => (Array.isArray(a) ? a : []);
  // eventId utk DRR diambil dari categoriesEvent (value dari name === DRR)
  const drrCat = safeArr(ev.categoriesEvent).find(
    (c) => String(c.name || "").toUpperCase() === "DRR"
  );
  const eventId = drrCat ? String(drrCat.value) : "4"; // fallback "4"

  const divisions = safeArr(ev.categoriesDivision).map((d) => ({
    id: String(d.value),
    name: String(d.name),
  }));

  const races = safeArr(ev.categoriesRace).map((r) => ({
    id: String(r.value),
    name: String(r.name),
  }));

  const initials = safeArr(ev.categoriesInitial).map((i) => ({
    id: String(i.value),
    name: String(i.name),
  }));

  return { eventId, divisions, races, initials };
}

// key => "eventId|initialId|raceId|divisionId"
function keyFromIds({ eventId, initialId, raceId, divisionId }) {
  return [
    String(eventId || ""),
    String(initialId || ""),
    String(raceId || ""),
    String(divisionId || ""),
  ].join("|");
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

import { logger } from "@/utils/logger";

export default {
  name: "SustainableTimingSystemDRRRace",
  components: { OperationTimePanel, Icon },
  data() {
    return {
      drrBucketOptions: [],
      drrBucketMap: Object.create(null),
      selectedDrrKey: "",
      currentBucket: null,
      drrSectionsCount: 3,
      editForm: "",
      editResult: false,
      isScrolled: false,
      port: null,
      isPortConnected: false,
      digitId: [],
      digitTime: [],
      dataPenalties: [
        { label: "0", value: 0, timePen: "00:00:00.000" },
        { label: "+ 10", value: 10, timePen: "00:00:10.000" },
        { label: "- 10", value: 999, timePen: "-00:00:10.000" },
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
    };
  },
  computed: {
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
    window.addEventListener("scroll", this.handleScroll);

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
  beforeDestroy() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
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
    buildStaticDrrOptionsFromCatalog(catalog) {
      const { eventId, divisions, races, initials } = catalog;
      const opts = [];
      const map = Object.create(null);

      divisions.forEach((div) => {
        races.forEach((race) => {
          initials.forEach((init) => {
            const key = [eventId, init.id, race.id, div.id]
              .map(String)
              .join("|");
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
        } catch {}

        const finalEventId = bucketLS.eventId || routeId || eventDetailsId;

        if (!finalEventId) {
          console.warn(
            "[DRR] eventId tidak ditemukan (payload/route/eventDetails)."
          );
          this.drrBucketOptions = [];
          this.drrBucketMap = {};
          return;
        }

        // 2) panggil IPC
        const filters = { eventId: finalEventId };
        // SALAH: console.log(payload, 'tes') // payload belum ada di sini
        console.log("[DRR] send filters:", filters);

        const res = await new Promise((resolve) => {
          ipcRenderer.once("teams-registered:find-reply", (_e, payload) => {
            console.log("[DRR] reply payload:", payload); // <- di sini boleh log payload
            resolve(payload);
          });
          ipcRenderer.send("teams-registered:find", filters);
        });

        if (!res || !res.ok) {
          console.warn("[DRR] IPC reply error:", res && res.error);
          this.drrBucketOptions = [];
          this.drrBucketMap = {};
          return;
        }
        if (!Array.isArray(res.items) || res.items.length === 0) {
          console.warn("[DRR] items kosong dari DB untuk filters:", filters);
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
        console.warn("loadAllDrrBucketsFromDB error:", err && err.message);
      }
    },
    loadAllDrrBucketsFromEvent() {
      try {
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
      console.log(key, "<<<< cek");
      await this.fetchBucketTeamsByKey(key);
    },

    async fetchBucketTeamsByKey(key) {
      try {
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
          console.warn("[DRR] reply error:", res && res.error);
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
        console.warn("fetchBucketTeamsByKey error:", err && err.message);
      }
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
        // biarkan default 3
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
      if (penaltyType === "penaltySection" && sectionIndex !== null) {
        item.result.penaltySection[sectionIndex] = selectedTimePen;
      } else {
        item.result[penaltyType] = selectedTimePen;
      }

      let totalPenaltyTime = "00:00:00.000";
      const fields = [
        item.result.penaltyStartTime || "00:00:00.000",
        item.result.penaltyFinishTime || "00:00:00.000",
        ...item.result.penaltySection.map((x) => x || "00:00:00.000"),
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
      item.result.penaltyTime = totalPenaltyTime;

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

    async connectPort() {
      if (!this.isPortConnected) {
        const ok = await this.setupSerialListener();
        if (ok) {
          this.isPortConnected = true;
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
      if (this.port && this.port.isOpen) this.port.close();
      this.isPortConnected = false;
    },

    async setupSerialListener() {
      try {
        const ports = await SerialPort.list();
        if (!ports || ports.length === 0) return false;
        this.currentPort = ports;
        const selectedPort = ports[6] || ports[5] || ports[ports.length - 1];
        if (!selectedPort || !selectedPort.path) return false;
        this.port = new SerialPort({ path: selectedPort.path, baudRate: 9600 });

        let receivedData = "";
        let a = "",
          b = "";
        this.port.on("data", (data) => {
          const newData = data.toString();
          receivedData += newData;
          for (let i = 0; i < receivedData.length; i++) {
            const ch = receivedData[i];
            if (ch === "M" || ch === "R") {
              a = receivedData.slice(0, i + 1);
              b = receivedData.slice(i + 1);
              receivedData = "";
              break;
            }
          }
          this.digitId.unshift(a);
          this.digitTime.unshift(b);
          if (a[11] == "0") {
            this.digitTimeStart = b.replace(
              /(\d{2})(\d{2})(\d{2})(\d{3})/,
              "$1:$2:$3.$4"
            );
          } else if (a[11] == "2") {
            this.digitTimeFinish = b.replace(
              /(\d{2})(\d{2})(\d{2})(\d{3})/,
              "$1:$2:$3.$4"
            );
          }
          return true;
        });
        return true;
      } catch (e) {
        logger.warn("❌ Failed to update race settings:", e && e.message);
        return false;
      }
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

    handleScroll() {
      this.isScrolled = window.scrollY > 0;
    },
  },
};
</script>

<style scoped>
.pen-grid {
  display: grid;
  /* isi 3 baris dulu (kebawah), lalu lanjut buat kolom baru ke samping */
  grid-template-rows: repeat(3, auto);
  grid-auto-flow: column;
  grid-column-gap: 8px; /* jarak antar kolom */
  grid-row-gap: 6px;    /* jarak antar item vertikal */
  align-items: start;
}

/* opsional: biar select-nya konsisten */
.small-select {
  width: 140px;
  min-width: 120px;
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

/* table */
table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 12px;
  overflow: hidden;
}
thead {
  background: #4a4a4a;
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

.small-select {
  margin-bottom: 5px;
  width: 140px;
}
.large-bold {
  font-size: 1.2rem;
  font-weight: bold;
}
.text-strong {
  color: #000;
}
.max-char {
  max-width: 260px;
  word-wrap: break-word;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
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
</style>
>
