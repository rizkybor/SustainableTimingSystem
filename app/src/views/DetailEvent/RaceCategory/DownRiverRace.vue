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
                ><strong class="text-white">River</strong> : -</span
              >
              <span class="mr-3"
                ><strong class="text-white">Level</strong> : -</span
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
                class="btn btn-secondary"
                @click="saveResult"
              >
                <Icon icon="icon-park-outline:save" /> Save Result
              </button>

              <button
                type="button"
                class="btn btn-info"
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
                class="btn"
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

    <!-- RESULT TABLE -->
    <div class="px-4 mt-4">
      <div class="card-body">
        <h4>List Result (Down River Race)</h4>
        <b-row>
          <b-col>
            <div class="table-wrapper">
            <table
              class="table"
              aria-label="Scrollable results table"
            >
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
              <tbody>
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
                      @change="updateTimePen($event, item, 'penaltyStartTime')"
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
                    <div class="d-flex flex-column">
                      <b-select
                        v-for="(sec, sIdx) in item.result.penaltySection"
                        :key="sIdx"
                        class="small-select"
                        v-model="item.result.penaltySection[sIdx]"
                        @change="
                          updateTimePen($event, item, 'penaltySection', sIdx)
                        "
                      >
                        <option disabled value="">
                          Section {{ sIdx + 1 }}
                        </option>
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
                      @change="updateTimePen($event, item, 'penaltyFinishTime')"
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
            </table>
            </div>
            <br />
          </b-col>
        </b-row>
      </div>

      <b-button @click="goTo()" variant="outline-info" class="custom-button">
        <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
      </b-button>
    </div>

    <br /><br />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { SerialPort } from "serialport";
import OperationTimePanel from "../components/OperationTeamPanel.vue";
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
  try {
    obj = JSON.parse(localStorage.getItem(RACE_PAYLOAD_KEY) || "{}");
  } catch {}
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

export default {
  name: "SustainableTimingSystemDRRRace",
  components: { OperationTimePanel, Icon },
  data() {
    return {
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
  methods: {
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
      try {
        dataStorage = localStorage.getItem("participantByCategories");
        events = localStorage.getItem("eventDetails");
      } catch {}
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
        console.error("Serial error:", e && e.message);
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
      const docs = buildResultDocs(clean, bucket);
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
      try {
        localStorage.removeItem("raceStartPayload");
        localStorage.removeItem("participantByCategories");
        localStorage.removeItem("currentCategories");
      } catch {}
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
.detail-hero {
  position: relative;
  overflow: hidden;
}
.detail-hero .hero-bg {
  position: absolute;
  inset: 0;
  background-image: url("https://images.unsplash.com/photo-1520981825232-ece5fae45120?q=80&w=1600&auto=format&fit=crop");
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
  padding: 22px;
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

/* buttons */
.custom-button {
  border-color: #1874a5;
  color: #1874a5;
  transition: all 0.3s ease;
}
.custom-button:hover {
  background: #1874a5;
  color: #fff;
  border-color: #1874a5;
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
  overflow-x: auto;           /* enable horizontal scroll */
  -webkit-overflow-scrolling: touch; /* smooth on mobile */
}

.table-wrapper table {
  min-width: 1200px;          /* adjust sesuai jumlah kolom */
  border-collapse: collapse;
}

.table-wrapper th,
.table-wrapper td {
  white-space: nowrap;        /* prevent wrapping */
}
</style>
