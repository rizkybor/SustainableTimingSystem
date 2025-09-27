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

    <!-- STICKY HEADER -->
    <div class="px-5">
      <div class="card-body">
        <b-row>
          <b-col>
            <h6 style="font-weight: 800; font-style: italic">
              Nomor Lomba : Slalom
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

    <!-- OPERATION TIME (reuse Sprint) -->
    <OperationTimePanel
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="participantsForPanel"
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />

    <!-- LIST RESULT (Slalom) -->
    <div class="px-4 mt-4">
      <div class="card-body">
        <h4>List Result (Slalom)</h4>
        <div class="table-responsive">
          <div class="d-flex justify-content-start mb-2">
            <div class="btn-group" role="group" aria-label="Run Switch">
              <button
                type="button"
                class="btn-action mr-2 btn"
                :class="activeRun === 0 ? 'btn-primary' : 'btn-outline-primary'"
                @click="setRun(0)"
              >
                Run 1
              </button>
              <button
                type="button"
                class="btn-action btn"
                :class="activeRun === 1 ? 'btn-primary' : 'btn-outline-primary'"
                @click="setRun(1)"
              >
                Run 2
              </button>
            </div>
          </div>

          <table class="table table-bordered">
            <thead>
              <tr>
                <th rowspan="2">No</th>
                <th class="text-center" rowspan="2">Team Name</th>
                <th class="text-center" rowspan="2">BIB Number</th>
                <!-- Judul grup penalties: S + 1..N + F -->
                <th
                  v-if="!penaltiesWrapped"
                  class="text-center penalties-title is-clickable"
                  :colspan="SLALOM_GATES.length + 2"
                  @click="penaltiesWrapped = true"
                  title="Klik untuk bungkus (wrap) penalties"
                >
                  Penalty Gates
                </th>
                <!-- Mode wrapped: cuma 1 kolom -->
                <th
                  v-else
                  class="text-center penalties-title is-clickable"
                  rowspan="2"
                  @click="penaltiesWrapped = false"
                  title="Klik untuk tampilkan penuh (un-wrap) penalties"
                >
                  Penalty Gates
                </th>

                <th class="text-center" rowspan="2">Penalty Total</th>

                <th class="text-center" rowspan="2">Penalty Time</th>
                <th class="text-center" rowspan="2">Start Time</th>
                <th class="text-center" rowspan="2">Finish Time</th>
                <th class="text-center" rowspan="2">Race Time</th>
                <th class="text-center" rowspan="2">Total Time</th>
                <th class="text-center" rowspan="2">Best Time</th>
                <th class="text-center" rowspan="2">Ranked</th>
                <th class="text-center" rowspan="2">Score</th>
                <th class="text-center" rowspan="2">Edit</th>
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
                <td>{{ ti + 1 }}</td>
                <td style="min-width: 150px">{{ team.nameTeam }}</td>
                <td>{{ team.bibNumber }}</td>

                <!-- ========== PENALTIES ========== -->
                <!-- Mode WRAPPED: 1 kolom berisi grid S,1..N,F -->
                <td v-if="penaltiesWrapped" class="p-1">
                  <div class="penalties-grid">
                    <!-- S -->
                    <div class="p-item">
                      <div class="p-label">S</div>
                      <b-form-select
                        class="p-select"
                        v-model="
                          team.sessions[selectedSession[team._id]].startPenalty
                        "
                        :options="penaltyOptions"
                        size="sm"
                        @change="recalcTeam(team)"
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
                        class="p-select"
                        v-model="
                          team.sessions[selectedSession[team._id]].penalties[gi]
                        "
                        :options="penaltyOptions"
                        size="sm"
                        @change="recalcTeam(team)"
                      />
                    </div>

                    <!-- F -->
                    <div class="p-item">
                      <div class="p-label">F</div>
                      <b-form-select
                        class="p-select"
                        v-model="
                          team.sessions[selectedSession[team._id]].finishPenalty
                        "
                        :options="penaltyOptions"
                        size="sm"
                        @change="recalcTeam(team)"
                      />
                    </div>
                  </div>
                </td>

                <!-- Mode EXPANDED: kolom S,1..N,F terpisah (seperti sebelumnya) -->
                <template v-else>
                  <!-- S -->
                  <td>
                    <b-form-select
                      style="min-width: 50px"
                      v-model="
                        team.sessions[selectedSession[team._id]].startPenalty
                      "
                      :options="penaltyOptions"
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
                      style="min-width: 50px"
                      v-model="
                        team.sessions[selectedSession[team._id]].penalties[gi]
                      "
                      :options="penaltyOptions"
                      size="sm"
                      @change="recalcTeam(team)"
                    />
                  </td>

                  <!-- F -->
                  <td>
                    <b-form-select
                      style="min-width: 50px"
                      v-model="
                        team.sessions[selectedSession[team._id]].finishPenalty
                      "
                      :options="penaltyOptions"
                      size="sm"
                      @change="recalcTeam(team)"
                    />
                  </td>
                </template>
                <!-- ========== /PENALTIES ========== -->

                <td style="min-width: 120px">
                  {{ displayTotalPenalty(team) }}
                </td>

                <td>{{ currentSession(team).penaltyTime || "-" }}</td>
                <td style="min-width: 120px">
                  {{ currentSession(team).startTime || "-" }}
                </td>
                <td style="min-width: 120px">
                  {{ currentSession(team).finishTime || "-" }}
                </td>
                <td style="min-width: 120px">
                  {{ currentSession(team).raceTime || "-" }}
                </td>
                <td style="min-width: 120px">
                  {{ currentSession(team).totalTime || "-" }}
                </td>
                <td style="background-color: greenyellow; min-width: 120px">
                  {{ calculateBestTime(team) || "-" }}
                </td>
                <td style="min-width: 120px" class="text-center">
                  {{ rankOf(team._id) }}
                </td>
                <td style="min-width: 120px" class="text-center">
                  {{ scoreOf(team._id) }}
                </td>
                <td>
                  <button
                    type="button"
                    class="btn btn-warning btn-sm"
                    @click="openEdit(team)"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
import { ipcRenderer } from "electron";
import { SerialPort } from "serialport";
import OperationTimePanel from "@/components/race/OperationTeamPanel.vue";
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
    nameTeam: String(t.nameTeam || t.name || ""),
    bibNumber: String(t.bibTeam || t.bibNumber || ""),
    // informasi lain yang mungkin dipakai
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

function loadFromRaceStartPayloadForSlalom() {
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
}

export default {
  name: "SlalomRacePanel",
  components: { OperationTimePanel, Icon },

  data() {
    return {
      activeRun: 0,
      sortBest: { enabled: false, desc: false },
      SLALOM_GATES: buildGates(DEFAULT_S16),
      port: null,
      isPortConnected: false,
      digitId: [],
      digitTime: [],
      digitTimeStart: null,
      digitTimeFinish: null,
      // event & category title
      dataEvent: {},
      titleCategories: "",
      // list result (tim)
      teams: [],
      selectedSession: {},
      penaltyOptions: [
        { text: "0", value: 0 },
        { text: "5", value: 5 },
        { text: "50", value: 50 },
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
      penaltiesWrapped: false,
    };
  },

  computed: {
    dataEventSafe() {
      return this.dataEvent && typeof this.dataEvent === "object"
        ? this.dataEvent
        : {};
    },

    visibleTeams() {
      const arr = this.teams.slice();

      if (!this.sortBest.enabled) return arr;

      const toBestMs = (team) => {
        const times = (Array.isArray(team.sessions) ? team.sessions : [])
          .map((s) => s && s.totalTime)
          .filter(Boolean)
          .map(hmsToMs); // helper kamu sudah ada

        if (!times.length) return Number.POSITIVE_INFINITY; // tanpa waktu → di bawah
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
          this.selectedSession[t._id] != null ? this.selectedSession[t._id] : 0;
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
      // ambil best time ms per tim
      const arr = this.teams.map((t) => {
        const times = (t.sessions || [])
          .map((s) => s && s.totalTime)
          .filter(Boolean)
          .map(hmsToMs);
        const bestMs = times.length ? Math.min(...times) : Infinity;
        return { id: t._id, bestMs };
      });

      // sort ascending (kecil = lebih cepat)
      arr.sort((a, b) => a.bestMs - b.bestMs);

      // assign rank; tim tanpa waktu (Infinity) tidak diranking
      const map = {};
      let rankCounter = 1;
      for (const item of arr) {
        if (!Number.isFinite(item.bestMs)) {
          map[item.id] = { rank: "-", score: 0 };
        } else {
          const rank = rankCounter++;
          const scoreObj = this.dataScore.find((d) => d.ranking === rank);
          map[item.id] = { rank, score: scoreObj ? scoreObj.score : 0 };
        }
      }
      return map;
    },
  },

  mounted() {
    // ambil event info
    this.dataEvent = safeJSON("eventDetails", {});

    // 1) payload baru (seperti Sprint Result)
    const { bucket, teams } = loadFromRaceStartPayloadForSlalom();
    this._eventId = String(bucket.eventId || "");
    if (teams.length) {
      this.teams = teams;
      this.titleCategories =
        `${bucket.divisionName} ${bucket.raceName} – ${bucket.initialName}`.trim();
    } else {
      // 2) fallback format lama
      const legacyTeams = safeJSON("participantByCategories", []);
      this.teams = (
        Array.isArray(legacyTeams)
          ? legacyTeams
          : Object.values(legacyTeams || {})
      )
        .sort((a, b) =>
          String(a.praStart || "").localeCompare(String(b.praStart || ""))
        )
        .map(normalizeTeamFromBucketForSlalom);
      this.titleCategories = String(
        localStorage.getItem("currentCategories") || ""
      ).trim();
    }

    // default session index
    this.teams.forEach((t) =>
      this.$set(this.selectedSession, t._id, this.activeRun)
    );
    this.fetchSlalomGateCountFromSettings();
  },

  methods: {
    setRun(idx) {
      this.activeRun = idx;
      // sinkronkan pilihan sesi untuk semua tim
      this.teams.forEach((t) => this.$set(this.selectedSession, t._id, idx));
    },
    async fetchSlalomGateCountFromSettings() {
      try {
        if (typeof ipcRenderer === "undefined" || !this._eventId) return;
        ipcRenderer.send("race-settings:get", this._eventId);
        ipcRenderer.once("race-settings:get-reply", (_e, res) => {
          const n =
            res && res.ok && res.settings && res.settings.slalom
              ? parseInt(res.settings.slalom.totalGate, 10)
              : DEFAULT_S16;

          // set array gates
          this.SLALOM_GATES = buildGates(n);

          // pastikan panjang penalties di tiap sesi = jumlah gate baru
          this.syncAllTeamsPenaltiesLength();
        });
      } catch (err) {
        // fallback: tetap pakai default
        this.SLALOM_GATES = buildGates(DEFAULT_S16);
        this.syncAllTeamsPenaltiesLength();
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
    rankOf(id) {
      const r = this.ranksMap && this.ranksMap[id];
      // jika tidak ada best time → '-'
      return r && (typeof r.rank === "number" || r.rank === "-") ? r.rank : "-";
    },
    scoreOf(id) {
      const r = this.ranksMap && this.ranksMap[id];
      return r && typeof r.score === "number" ? r.score : 0;
    },
    /** === Table accessors === */
    sessionOptions(team) {
      return team.sessions.map((_, i) => ({ text: `Run ${i + 1}`, value: i }));
    },
    currentSession(team) {
      const idx =
        this.selectedSession[team._id] != null
          ? this.selectedSession[team._id]
          : 0;
      const s = team.sessions[idx] || {};
      if (
        !Array.isArray(s.penalties) ||
        s.penalties.length !== this.SLALOM_GATES.length
      ) {
        const need = this.SLALOM_GATES.length;
        const a = Array.isArray(s.penalties) ? s.penalties.slice() : [];
        while (a.length < need) a.push(0);
        if (a.length > need) a.length = need;
        this.$set(s, "penalties", a);
      }
      if (s.startPenalty == null) this.$set(s, "startPenalty", 0);
      if (s.finishPenalty == null) this.$set(s, "finishPenalty", 0);
      return s;
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
      const times = team.sessions.map((s) => s.totalTime).filter(Boolean);
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
    },

    /** === Navigasi sederhana === */
    goTo() {
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },
    // openEdit(_team) {
    //   /* TODO: modal edit */
    // },

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

    /** === Device connection (sama pola Sprint, lebih aman) === */
    async connectPort() {
      if (this.isPortConnected) return this.disconnected();
      try {
        const ports = await SerialPort.list();
        if (!ports || !ports.length)
          throw new Error("No serial ports available");
        const chosen = ports.find((p) => p.path) || ports[0];
        this.port = new SerialPort({ path: chosen.path, baudRate: 9600 });
        this.port.on("data", (buf) => {
          const s = buf.toString();
          this.digitId.unshift(s.slice(0, 12));
          this.digitTime.unshift(s.slice(12));
        });
        this.isPortConnected = true;
        alert("Connected");
      } catch (e) {
        this.isPortConnected = false;
        alert(e && e.message ? e.message : "Failed to connect device");
      }
    },
    async disconnected() {
      try {
        if (this.port && this.port.isOpen) {
          this.port.close();
        }
      } catch (e) {
        // Tulis pesan error agar tidak silent
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Error when closing port:", e);
        }
        // simpan pesan terakhir ke state kalau perlu
        this.lastError = e && e.message ? e.message : String(e);
      } finally {
        this.isPortConnected = false;
        alert("Disconnected");
      }
    },

    /** === Save: dokumen Slalom (multi-run + penalty dinamis) === */
    /** === Build docs (parity dengan Sprint) === */
    buildDocs() {
      // Ambil bucket dari payload baru (harus identik dgn Team Registered)
      const { bucket } = loadFromRaceStartPayloadForSlalom();
      const must = ["eventId", "initialId", "raceId", "divisionId"];
      const missing = must.filter((k) => !bucket[k]);
      if (missing.length) {
        throw new Error(`Bucket fields missing: ${missing.join(", ")}`);
      }

      const now = new Date();

      // deep-clone biar aman (parity dgn Sprint yang clone participantArr)
      const cleanTeams = JSON.parse(JSON.stringify(this.teams || []));
      if (!Array.isArray(cleanTeams) || cleanTeams.length === 0) return [];

      return cleanTeams.map((t) => {
        const sessions = Array.isArray(t.sessions) ? t.sessions : [];

        // Normalisasi tiap run/sesi
        const results = sessions.map((s) => ({
          startTime: String(s.startTime || ""),
          finishTime: String(s.finishTime || ""),
          raceTime: String(s.raceTime || ""),
          penaltyTime: String(s.penaltyTime || "00:00:00.000"),
          penalty: Number.isFinite(s.totalPenalty)
            ? Number(s.totalPenalty)
            : Number(s.totalPenalty) || 0,
          totalTime: String(s.totalTime || s.raceTime || ""),
          ranked: Number.isFinite(s.ranked)
            ? Number(s.ranked)
            : Number(s.ranked) || 0,
          score: Number.isFinite(s.score)
            ? Number(s.score)
            : Number(s.score) || 0,
        }));

        return {
          // KUNCI RELASI (harus sama dengan Teams Registered)
          eventId: bucket.eventId,
          initialId: bucket.initialId,
          raceId: bucket.raceId,
          divisionId: bucket.divisionId,
          eventName: bucket.eventName,
          initialName: bucket.initialName,
          raceName: bucket.raceName,
          divisionName: bucket.divisionName,

          // DATA TIM
          nameTeam: String(t.nameTeam || ""),
          bibTeam: String(t.bibNumber || t.bibTeam || ""),
          startOrder: String(t.startOrder || ""),
          praStart: String(t.praStart || ""),
          intervalRace: String(t.intervalRace || ""),
          statusId: Number.isFinite(t.statusId) ? Number(t.statusId) : 0,

          // ARRAY RUN (slalom multi-run)
          result: results,

          // Best time opsional
          bestTime: String(this.calculateBestTime(t) || ""),

          // Meta opsional (boleh diabaikan kalau tidak dipakai di BE)
          // otr dibiarkan kosong agar kompatibel
          otr: {
            startTime: "",
            finishTime: "",
            raceTime: "",
            penaltyTime: "",
            penalty: "",
            totalTime: "",
            ranked: "",
            score: "",
          },

          // meta waktu
          createdAt: now,
          updatedAt: now,
        };
      });
    },
    /** === Save (parity dengan Sprint) === */
    saveResult() {
      try {
        const docs = this.buildDocs();
        // Debug optional
        // console.log("DEBUG saveResult (Slalom):", docs);

        if (!Array.isArray(docs) || docs.length === 0) {
          ipcRenderer.send("get-alert", {
            type: "warning",
            detail: "Belum ada data yang bisa disimpan.",
            message: "Ups Sorry",
          });
          return;
        }

        // Kirim ARRAY langsung (bukan objek) — sama seperti Sprint
        ipcRenderer.send("insert-slalom-result", docs);

        // Tunggu balasan — pola sama dengan Sprint
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
  },
};
</script>

<style scoped>
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
    8,
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

/* Lebarkan sedikit select agar enak dilihat */
::v-deep .p-select .custom-select,
.p-select .custom-select,
.p-select :deep(.custom-select) {
  min-width: 56px; /* set 56–72px sesuai selera */
  padding-left: 6px;
  padding-right: 18px;
  height: 28px;
  font-size: 12px;
}

.table-bordered th {
  vertical-align: middle !important; /* teks header vertikal rata tengah */
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
</style>
