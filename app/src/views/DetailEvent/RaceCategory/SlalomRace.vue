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
                ><strong class="text-white">River</strong> : {{ dataEventSafe.riverName || "-" }}</span
              >
              <span class="mr-3"
                ><strong class="text-white">Level</strong> : {{ dataEventSafe.levelName || "-" }}</span
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
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>No</th>
                <th>Team Name</th>
                <th>BIB</th>
                <th>Run</th>
                <th>Total Penalty</th>
                <th v-for="n in SLALOM_GATES" :key="'g' + n">{{ n }}</th>
                <th>Penalty Time</th>
                <th>Start Time</th>
                <th>Finish Time</th>
                <th>Race Time</th>
                <th>Total Time</th>
                <th>Best Time</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(team, ti) in visibleTeams" :key="team._id">
                <td>{{ ti + 1 }}</td>
                <td>{{ team.nameTeam }}</td>
                <td>{{ team.bibNumber }}</td>
                <td style="min-width: 120px">
                  <b-form-select
                    v-model="selectedSession[team._id]"
                    :options="sessionOptions(team)"
                    @change="recalcTeam(team)"
                  />
                </td>
                <td>{{ displayTotalPenalty(team) }}</td>

                <!-- 14 Gates -->
                <td
                  v-for="(gate, gi) in currentSession(team).penalties"
                  :key="team._id + '-' + gi"
                >
                  <b-form-select
                    v-model="
                      team.sessions[selectedSession[team._id]].penalties[gi]
                    "
                    :options="penaltyOptions"
                    size="sm"
                    @change="recalcTeam(team)"
                  />
                </td>

                <td>{{ currentSession(team).penaltyTime || "-" }}</td>
                <td>{{ currentSession(team).startTime || "-" }}</td>
                <td>{{ currentSession(team).finishTime || "-" }}</td>
                <td>{{ currentSession(team).raceTime || "-" }}</td>
                <td>{{ currentSession(team).totalTime || "-" }}</td>
                <td style="background-color: greenyellow">
                  {{ calculateBestTime(team) || "-" }}
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
          @click="saveResult"
          variant="outline-info"
          class="custom-button mt-2"
        >
          <Icon icon="icon-park-outline:save" /> Save Result
        </b-button>
        <b-button
          @click="goTo"
          variant="outline-info"
          class="custom-button mt-2 ml-2"
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
import OperationTimePanel from "../components/OperationTeamPanel.vue";
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

/** ===== Slalom specifics ===== */
const SLALOM_GATES = 14;
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
  const emptySession = () => ({
    penalties: Array.from({ length: SLALOM_GATES }, () => 0),
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
      ? t.sessions.map((s) => ({ ...emptySession(), ...(s || {}) }))
      : [emptySession(), emptySession()];

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
      sortBest: { enabled: false, desc: false },
      SLALOM_GATES,
      // port/device
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
  },

  mounted() {
    // ambil event info
    this.dataEvent = safeJSON("eventDetails", {});

    // 1) payload baru (seperti Sprint Result)
    const { bucket, teams } = loadFromRaceStartPayloadForSlalom();
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
    this.teams.forEach((t) => this.$set(this.selectedSession, t._id, 0));
  },

  methods: {
    /** === Table accessors === */
    sessionOptions(team) {
      return team.sessions.map((_, i) => ({ text: `Run ${i + 1}`, value: i }));
    },
    currentSession(team) {
      const idx =
        this.selectedSession[team._id] != null
          ? this.selectedSession[team._id]
          : 0;
      const s = team.sessions[idx] || { penalties: [] };
      if (!Array.isArray(s.penalties) || s.penalties.length !== SLALOM_GATES) {
        this.$set(
          s,
          "penalties",
          Array.from({ length: SLALOM_GATES }, () => 0)
        );
      }
      return s;
    },

    /** === Perhitungan penalty/time === */
    recalcSession(s) {
      s.totalPenalty = s.penalties.reduce((a, v) => a + (Number(v) || 0), 0);
      const penMs = s.penalties.reduce(
        (sum, v) => sum + (PENALTY_VALUE_TO_MS[Number(v) || 0] || 0),
        0
      );
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
      return Number.isFinite(s.totalPenalty) ? s.totalPenalty : 0;
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
    openEdit(_team) {
      /* TODO: modal edit */
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
        if (this.port && this.port.isOpen) this.port.close();
      } catch {}
      this.isPortConnected = false;
      alert("Disconnected");
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
  text-align: center;
}

/* ===== Buttons ===== */
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
</style>
