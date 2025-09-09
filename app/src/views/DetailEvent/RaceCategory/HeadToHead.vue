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

    <!-- SUBHEADER -->
    <div class="px-5">
      <div class="card-body">
        <b-row>
          <b-col>
            <h6 style="font-weight: 800; font-style: italic">
              Nomor Lomba : Head To Head
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

    <!-- OPERATION TIME (shared component) -->
    <OperationTimePanel
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="participantArr"
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />

    <!-- LIST RESULT -->
    <div class="px-4 mt-4">
      <div class="card-body">
        <h4>List Result One by One</h4>
        <b-row>
          <b-col>
            <div
              class="table-wrapper"
              aria-label="Scrollable results table"
              role="region"
            >
              <table class="table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Team Name</th>
                    <th>BIB</th>
                    <th>Start Time</th>
                    <th>Finish Time</th>
                    <th>Race Time</th>
                    <th>Penalties</th>
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
                    <td class="large-bold text-strong max-char">
                      {{ item.nameTeam }}
                    </td>
                    <td class="large-bold">{{ item.bibTeam }}</td>
                    <td class="text-monospace">{{ item.result.startTime }}</td>
                    <td class="text-monospace">{{ item.result.finishTime }}</td>
                    <td class="large-bold text-monospace">
                      {{ item.result.raceTime }}
                    </td>

                    <!-- Penalties (single dropdown like Sprint) -->
                    <td>
                      <b-select
                        v-if="item.result.startTime"
                        v-model="item.result.penalty"
                        @change="updateTimePen($event, item)"
                      >
                        <option
                          v-for="pen in dataPenalties"
                          :key="pen.value"
                          :value="pen.value"
                        >
                          {{ pen.label }}
                        </option>
                      </b-select>
                    </td>

                    <td class="text-monospace large-bold">
                      {{ item.result.penaltyTime }}
                    </td>
                    <td class="text-monospace large-bold">
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
                      <button
                        type="button"
                        class="btn btn-warning"
                        @click="openModal(item)"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <br />
          </b-col>
        </b-row>
      </div>

      <b-button @click="goTo" variant="outline-info" class="custom-button">
        <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
      </b-button>
    </div>

    <!-- BRACKET -->
    <!-- BRACKET (refined) -->
    <div class="px-4 mt-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h4 class="mb-0">Bracket Head 2 Head</h4>
        <div class="d-flex" style="gap: 8px">
          <button
            class="btn btn-outline-secondary"
            @click="
              rebuildBracketDynamic(
                Math.min(Math.max(participantArr.length || 8, 4), 32)
              )
            "
          >
            <Icon icon="mdi:refresh" /> Rebuild by Participants
          </button>
          <button
            class="btn"
            :class="editBracketTeams ? 'btn-success' : 'btn-outline-success'"
            @click="editBracketTeams = !editBracketTeams"
          >
            <Icon icon="mdi:pencil-outline" />
            {{ editBracketTeams ? "Done" : "Edit Teams" }}
          </button>
          <button
            class="btn btn-outline-danger"
            @click="clearFirstRoundAssignments"
          >
            <Icon icon="mdi:eraser-variant" /> Clear First Round
          </button>
          <button
            class="btn btn-outline-warning"
            @click="populateBronzeFromSemis"
          >
            <Icon icon="mdi:medal-outline" /> Populate Bronze
          </button>
        </div>
      </div>

      <div class="bracket" role="region" aria-label="Tournament Bracket">
        <div
          v-for="(round, rIdx) in rounds"
          :key="round.id"
          class="bracket__round"
          :class="{ 'bracket__round--bronze': round.bronze }"
        >
          <div class="bracket__round-header">
            <span class="bracket__round-title">{{ round.name }}</span>
            <span class="bracket__round-meta" v-if="!round.bronze"
              >Matches: {{ round.matches.length }}</span
            >
            <span class="bracket__round-meta" v-else>Third Place</span>
          </div>

          <div class="bracket__list">
            <div
              v-for="(m, mIdx) in round.matches"
              :key="m.id"
              class="bracket__match"
              :aria-label="`Match ${m.id}`"
            >
              <!-- Team 1 -->
              <div class="bracket__team" :class="{ 'is-bye': !m.team1.name }">
                <div class="bracket__team-main">
                  <span class="bracket__seed" v-if="m.team1.seed">{{
                    m.team1.seed
                  }}</span>
                  <span
                    class="bracket__name"
                    v-if="!editBracketTeams || rIdx !== firstRoundIndex"
                  >
                    {{ m.team1.name || "—" }}
                  </span>

                  <!-- Editor slot Team 1 (ronde pertama saja) -->
                  <div v-else class="w-100">
                    <b-select
                      :value="m.team1.__pid || ''"
                      @change="setTeamAtFirstRound(mIdx, 'team1', $event)"
                      class="w-100"
                    >
                      <option :value="''">— pilih tim —</option>
                      <option
                        v-for="opt in availableTeamOptions(
                          m.team1 && m.team1.__pid
                        )"
                        :key="'t1-' + opt.id"
                        :value="opt.id"
                      >
                        {{ opt.label }}
                      </option>
                    </b-select>
                  </div>
                </div>
                <span class="bracket__score" v-if="m.score1 != null">{{
                  m.score1
                }}</span>
              </div>

              <!-- vs divider -->
              <div class="bracket__vs" aria-hidden="true">vs</div>

              <!-- Team 2 -->
              <div class="bracket__team" :class="{ 'is-bye': !m.team2.name }">
                <div class="bracket__team-main">
                  <span class="bracket__seed" v-if="m.team2.seed">{{
                    m.team2.seed
                  }}</span>
                  <span
                    class="bracket__name"
                    v-if="!editBracketTeams || rIdx !== firstRoundIndex"
                  >
                    {{ m.team2.name || "—" }}
                  </span>

                  <!-- Editor slot Team 2 (ronde pertama saja) -->
                  <div v-else class="w-100">
                    <b-select
                      :value="m.team2.__pid || ''"
                      @change="setTeamAtFirstRound(mIdx, 'team2', $event)"
                      class="w-100"
                    >
                      <option :value="''">— pilih tim —</option>
                      <option
                        v-for="opt in availableTeamOptions(
                          m.team2 && m.team2.__pid
                        )"
                        :key="'t2-' + opt.id"
                        :value="opt.id"
                      >
                        {{ opt.label }}
                      </option>
                    </b-select>
                  </div>
                </div>
                <span class="bracket__score" v-if="m.score2 != null">{{
                  m.score2
                }}</span>
              </div>

              <!-- Actions / badges -->
              <div class="bracket__footer">
                <span v-if="m.bye" class="badge badge-light"
                  >Auto-advance (BYE)</span
                >

                <div
                  class="bracket__actions"
                  v-if="!round.bronze && m.team1.name && m.team2.name"
                >
                  <button
                    class="btn btn-xs btn-outline-success"
                    @click="advanceWinner(rIdx, mIdx, 1)"
                    title="Set winner: top"
                    :disabled="editBracketTeams"
                  >
                    <Icon icon="mdi:crown-outline" /> Top Win
                  </button>
                  <button
                    class="btn btn-xs btn-outline-primary"
                    @click="advanceWinner(rIdx, mIdx, 2)"
                    title="Set winner: bottom"
                    :disabled="editBracketTeams"
                  >
                    <Icon icon="mdi:crown-outline" /> Bottom Win
                  </button>
                </div>

                <div class="bracket__winner" v-if="m.winner && m.winner.name">
                  <Icon icon="mdi:trophy-variant-outline" />
                  <span class="ml-1">{{ m.winner.name }}</span>
                </div>
              </div>
            </div>
            <!-- /match -->
          </div>
          <!-- /list -->
        </div>
        <!-- /round -->
      </div>
      <!-- /bracket -->
    </div>


        <!-- LIST RESULT -->
    <div class="px-4 mt-4">
      <div class="card-body">
        <h4>List Result Head 2 Head</h4>
        <b-row>
          <b-col>
            <div
              class="table-wrapper"
              aria-label="Scrollable results table"
              role="region"
            >
              <table class="table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Team Name</th>
                    <th>BIB</th>
                    <th>Start Time</th>
                    <th>Finish Time</th>
                    <th>Race Time</th>
                    <th>Penalties</th>
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
                    <td class="large-bold text-strong max-char">
                      {{ item.nameTeam }}
                    </td>
                    <td class="large-bold">{{ item.bibTeam }}</td>
                    <td class="text-monospace">{{ item.result.startTime }}</td>
                    <td class="text-monospace">{{ item.result.finishTime }}</td>
                    <td class="large-bold text-monospace">
                      {{ item.result.raceTime }}
                    </td>

                    <!-- Penalties (single dropdown like Sprint) -->
                    <td>
                      <b-select
                        v-if="item.result.startTime"
                        v-model="item.result.penalty"
                        @change="updateTimePen($event, item)"
                      >
                        <option
                          v-for="pen in dataPenalties"
                          :key="pen.value"
                          :value="pen.value"
                        >
                          {{ pen.label }}
                        </option>
                      </b-select>
                    </td>

                    <td class="text-monospace large-bold">
                      {{ item.result.penaltyTime }}
                    </td>
                    <td class="text-monospace large-bold">
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
                      <button
                        type="button"
                        class="btn btn-warning"
                        @click="openModal(item)"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <br />
          </b-col>
        </b-row>
      </div>

      <b-button @click="goTo" variant="outline-info" class="custom-button">
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

/** builder dokumen yang akan disimpan (pola Sprint) */
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

    // normalisasi
    result.startTime = String(result.startTime || "");
    result.finishTime = String(result.finishTime || "");
    result.raceTime = String(result.raceTime || "");
    result.penalty = Number.isFinite(result.penalty)
      ? result.penalty
      : result.penalty
      ? Number(result.penalty)
      : 0;
    result.penaltyTime = String(result.penaltyTime || "00:00:00.000");
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
      // kunci relasi (HARUS sama dgn Teams Registered)
      eventId: bucket.eventId,
      initialId: bucket.initialId,
      raceId: bucket.raceId,
      divisionId: bucket.divisionId,
      eventName: bucket.eventName,
      initialName: bucket.initialName,
      raceName: bucket.raceName,
      divisionName: bucket.divisionName,

      // data tim + hasil
      ...team,
      result,
      otr,

      // meta optional
      createdAt: now,
      updatedAt: now,
    };
  });
}

function normalizeTeamForH2H(t = {}) {
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
    penaltyTime: "00:00:00.000",
    penalty: 0,
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

function loadRaceStartPayloadForH2H() {
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
    teams: Array.isArray(b.teams) ? b.teams.map(normalizeTeamForH2H) : [],
  };
  return { bucket };
}

export default {
  name: "SustainableTimingSystemH2HRace",
  components: { OperationTimePanel, Icon },
  data() {
    return {
      editBracketTeams: false,
      rounds: [],
      showBronze: true,
      editForm: "",
      editResult: false,
      isScrolled: false,
      port: null,
      isPortConnected: false,
      digitId: [],
      digitTime: [],
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
    firstRoundIndex() {
      // indeks ronde kompetitif paling awal (size terbesar, bukan bronze)
      let idx = -1,
        maxSize = -1;
      (this.rounds || []).forEach((r, i) => {
        if (!r.bronze && r.size > maxSize) {
          maxSize = r.size;
          idx = i;
        }
      });
      return idx;
    },
    teamOptionsAll() {
      // opsi dropdown: ambil dari participants, tentukan seed otomatis
      return (this.participantArr || []).map((p, i) => {
        const seed =
          Number(p.seed) || Number(p.startOrder) || Number(p.bibTeam) || i + 1;
        const id = i + 1; // id internal sederhana (index+1)
        const name = String(p.nameTeam || p.teamName || `Team ${id}`);
        return { id, seed, name, label: `${seed ? `#${seed} ` : ""}${name}` };
      });
    },
    assignedIdsFirstRound() {
      const ids = new Set();
      const fr = this.rounds[this.firstRoundIndex];
      if (!fr) return ids;
      fr.matches.forEach((m) => {
        if (m.team1 && m.team1.__pid) ids.add(m.team1.__pid);
        if (m.team2 && m.team2.__pid) ids.add(m.team2.__pid);
      });
      return ids;
    },
  },

  async mounted() {
    window.addEventListener("scroll", this.handleScroll);
    const ok = this.loadFromRaceStartPayload();
    if (!ok) await this.checkValueStorage();

    // jumlah tim aktual (4..32), bisa diambil dari participantArr.length
    const n = Math.min(Math.max(this.participantArr.length || 8, 4), 32);
    this.rebuildBracketDynamic(n); // bangun + seed kolom pertama
  },

  beforeDestroy() {
    window.removeEventListener("scroll", this.handleScroll);
  },

  methods: {
    /** Hitung pangkat dua berikutnya */
    nextPow2(n) {
      let p = 1;
      while (p < n) p <<= 1;
      return p;
    },

    /** Nama ronde human friendly berdasar size */
    roundName(size) {
      if (size === 2) return "Final";
      if (size === 4) return "Semifinals";
      if (size === 8) return "Quarterfinals";
      if (size === 16) return "Round of 16";
      if (size === 32) return "Round of 32";
      return `Round of ${size}`;
    },

    /** Buat satu kolom ronde kosong dengan jumlah match = size/2 */
    makeEmptyRound(id, size) {
      const matches = Array.from({ length: size / 2 }, (_, i) => ({
        id: id * 100 + (i + 1),
        team1: { id: null, seed: null, name: "" },
        team2: { id: null, seed: null, name: "" },
        score1: null,
        score2: null,
        winner: null, // nanti diisi object tim pemenang
        bye: false, // jika match berisi BYE auto-advance
      }));
      return { id: `R${id}`, name: this.roundName(size), size, matches };
    },

    /** Bangun struktur default kosong (kolom dari besar → final) */
    buildEmptyBracket(nTeams) {
      const cap = Math.min(Math.max(4, nTeams), 32); // clamp 4..32
      const base = this.nextPow2(cap); // 4, 8, 16, 32
      const rounds = [];
      let id = 1;
      for (let size = base; size >= 2; size >>= 1) {
        rounds.push(this.makeEmptyRound(id++, size));
      }
      // Tambah Third Place bila size awal >= 4
      if (this.showBronze && base >= 4) {
        rounds.splice(rounds.length - 1, 0, {
          // sisipkan sebelum Final
          id: "R_B",
          name: "Third Place",
          size: 2,
          matches: [
            {
              id: 3001,
              team1: { id: null, seed: null, name: "" },
              team2: { id: null, seed: null, name: "" },
              score1: null,
              score2: null,
              winner: null,
              bye: false,
            },
          ],
          bronze: true,
        });
      }
      return rounds;
    },

    /** Ambil 32 tim max dari participant + tentukan seed */
    collectTeamsForSeeding(limit = 32) {
      const src = (this.participantArr || []).slice(0, limit).map((p, idx) => ({
        id: idx + 1,
        seed:
          Number(p.seed) ||
          Number(p.startOrder) ||
          Number(p.bibTeam) ||
          idx + 1,
        name: String(p.nameTeam || p.teamName || `Team ${idx + 1}`),
      }));
      // unik + sort by seed
      const seen = new Set();
      const uniq = src.filter(
        (t) => t && !seen.has(t.name) && seen.add(t.name)
      );
      uniq.sort((a, b) => a.seed - b.seed);
      return uniq;
    },

    /** Pairing sederhana: 1vsN, 2vsN-1, dst (cukup baik untuk seeding dasar) */
    pairSeedsOrdered(seeds) {
      const pairs = [];
      for (let i = 0; i < Math.floor(seeds.length / 2); i++) {
        pairs.push([seeds[i], seeds[seeds.length - 1 - i]]);
      }
      return pairs;
    },

    /**
     * Populate kolom pertama (round awal) dengan seeding + BYE
     * - Jika n bukan pangkat dua → tambahkan BYE (slot kosong) untuk top seeds
     * - BYE artinya lawan kosong → auto-advance ke ronde berikutnya
     */
    populateFirstRoundWithSeeds(nTeams) {
      const teams = this.collectTeamsForSeeding(nTeams);
      const base = this.nextPow2(Math.min(Math.max(4, nTeams), 32));
      const byes = base - teams.length; // jumlah bye (0 jika pas pangkat 2)

      // Tambahkan dummy "BYE" di ujung (seed teratas akan berpasangan dengannya)
      const fillers = Array.from({ length: byes }, () => ({
        id: null,
        seed: null,
        name: "",
      }));
      const padded = teams.concat(fillers);

      // susun pasangan
      const pairs = this.pairSeedsOrdered(padded);

      const first = this.rounds.find((r) => !r.bronze && r.size === base);
      if (!first) return;

      // isi kolom pertama
      first.matches.forEach((m, i) => {
        const [t1, t2] = pairs[i] || [{}, {}];
        m.team1 = t1 || { id: null, seed: null, name: "" };
        m.team2 = t2 || { id: null, seed: null, name: "" };
        // tandai bye jika salah satunya kosong
        m.bye = !m.team1.name || !m.team2.name;
      });

      // Jika ada BYE, advance otomatis
      this.autoAdvanceByes();
    },

    /** Advance otomatis untuk match yang bye (tanpa sentuh Bronze/Final) */
    autoAdvanceByes() {
      for (let i = 0; i < this.rounds.length; i++) {
        const round = this.rounds[i];
        if (round.bronze) continue;
        // round terakhir (Final) tidak perlu advance
        const nextIdx = this.rounds.findIndex((r, idx) => idx > i && !r.bronze);
        if (nextIdx === -1) break;

        const next = this.rounds[nextIdx];
        round.matches.forEach((m, idxMatch) => {
          if (m.bye) {
            // jika t2 kosong → pemenang = t1, atau sebaliknya
            const win = m.team1 && m.team1.name ? m.team1 : m.team2;
            m.winner = win && win.name ? win : null;

            // map ke slot next round:
            const slot = Math.floor(idxMatch / 2);
            const pos = idxMatch % 2 === 0 ? "team1" : "team2";
            if (next && next.matches[slot]) {
              next.matches[slot][pos] =
                win && win.name ? win : { id: null, seed: null, name: "" };
            }
          }
        });
      }
    },

    /** Pindahkan pemenang secara manual ke ronde berikutnya (untuk non-BYE) */
    advanceWinner(roundIndex, matchIndex, winnerIdx /* 1 atau 2 */) {
      const round = this.rounds[roundIndex];
      if (!round || round.bronze) return;

      // cari next round non-bronze
      let nextRoundIndex = -1;
      for (let i = roundIndex + 1; i < this.rounds.length; i++) {
        if (!this.rounds[i].bronze) {
          nextRoundIndex = i;
          break;
        }
      }
      if (nextRoundIndex === -1) return;

      const match = round.matches[matchIndex];
      const winner = winnerIdx === 1 ? match.team1 : match.team2;
      match.winner = winner;

      const next = this.rounds[nextRoundIndex];
      const slot = Math.floor(matchIndex / 2);
      const pos = matchIndex % 2 === 0 ? "team1" : "team2";
      if (next.matches[slot]) next.matches[slot][pos] = winner;
    },

    /** Isi Bronze (3rd place) setelah SF selesai */
    populateBronzeFromSemis() {
      const sfIdx = this.rounds.findIndex((r) => !r.bronze && r.size === 4);
      const bronzeIdx = this.rounds.findIndex((r) => r.bronze);
      if (sfIdx === -1 || bronzeIdx === -1) return;

      const sf = this.rounds[sfIdx];
      const bronze = this.rounds[bronzeIdx];
      if (sf.matches.length < 2) return;

      // asumsikan pemenang sudah di-set; ambil 'kalah' dari masing-masing semi
      const losers = sf.matches.map((m) => {
        if (!m.winner) return null;
        const lose =
          m.winner && m.winner.name === (m.team1 && m.team1.name)
            ? m.team2
            : m.team1;
        return lose && lose.name ? lose : null;
      });

      if (losers[0] && losers[1]) {
        bronze.matches[0].team1 = losers[0];
        bronze.matches[0].team2 = losers[1];
      }
    },

    /** API utama untuk dipanggil saat mounted / ketika jumlah tim berubah */
    rebuildBracketDynamic(nTeams) {
      this.rounds = this.buildEmptyBracket(nTeams);
      this.populateFirstRoundWithSeeds(nTeams); // default seed → kolom 1
    },

    /** Ambil opsi yang masih tersedia (bebas duplikat kecuali id yang sedang dipilih) */
    availableTeamOptions(keepId = null) {
      const used = this.assignedIdsFirstRound;
      return this.teamOptionsAll.filter(
        (opt) => !used.has(opt.id) || opt.id === keepId
      );
    },

    /** Helper: buat objek tim untuk bracket dari option */
    toBracketTeam(opt) {
      if (!opt) return { id: null, seed: null, name: "" };
      return {
        id: opt.id,
        seed: opt.seed || null,
        name: opt.name || "",
        __pid: opt.id,
      };
    },

    /** Set tim ke slot (team1/team2) di match ronde pertama */
    setTeamAtFirstRound(matchIndex, slot /* 'team1' | 'team2' */, pickedId) {
      const rIdx = this.firstRoundIndex;
      const round = this.rounds[rIdx];
      if (!round) return;

      const match = round.matches[matchIndex];
      if (!match) return;

      // kosongkan
      if (!pickedId) {
        match[slot] = { id: null, seed: null, name: "" };
        match.bye =
          !(match.team1 && match.team1.name) ||
          !(match.team2 && match.team2.name);
        // reset winner bila slot berubah
        match.winner = null;
        this.autoAdvanceByes();
        return;
      }

      // cegah duplikat (kecuali mengganti dirinya sendiri)
      const current =
        match[slot] && match[slot].__pid ? match[slot].__pid : null;
      const options = this.availableTeamOptions(current);
      const opt = options.find((o) => o.id === Number(pickedId));
      if (!opt) {
        // kalau sudah dipakai tempat lain → keluarkan alert
        this.$bvToast &&
          this.$bvToast.toast("Tim sudah terpasang di pertandingan lain.", {
            variant: "warning",
            autoHideDelay: 2000,
            title: "Duplicate block",
          });
        return;
      }

      match[slot] = this.toBracketTeam(opt);
      match.bye =
        !(match.team1 && match.team1.name) ||
        !(match.team2 && match.team2.name);
      match.winner = null; // reset winner ketika ada perubahan pasangan

      // tiap perubahan, jalankan auto-advance untuk BYE
      this.autoAdvanceByes();
    },

    /** Hapus semua assignment di ronde pertama (quick clear) */
    clearFirstRoundAssignments() {
      const rIdx = this.firstRoundIndex;
      const round = this.rounds[rIdx];
      if (!round) return;
      round.matches.forEach((m) => {
        m.team1 = { id: null, seed: null, name: "" };
        m.team2 = { id: null, seed: null, name: "" };
        m.winner = null;
        m.bye = true;
      });
      this.autoAdvanceByes();
    },

    /** SIGN BRACKET */
    /** load dari payload baru */
    loadFromRaceStartPayload() {
      const { bucket } = loadRaceStartPayloadForH2H();
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

    /** fallback format lama */
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

      this.participant = arr.map(normalizeTeamForH2H);
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
      const scoreData = this.dataScore.find((d) => d.ranking === ranked);
      return scoreData ? scoreData.score : 0;
    },

    async parseTimeResult(timeResult) {
      const parts = String(timeResult || "00:00:00:000").split(":");
      const [hours, minutes, seconds, milliseconds] = parts.map(
        (p) => parseInt(p, 10) || 0
      );
      return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
    },

    async updateTimePen(selectedValue, item) {
      const sel = this.dataPenalties.find((p) => p.value === selectedValue);
      if (sel) item.result.penaltyTime = sel.timePen;

      if (item.result.raceTime && item.result.penaltyTime) {
        item.result.totalTime = await this.tambahWaktu(
          item.result.raceTime,
          item.result.penaltyTime
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

    /** Serial connect */
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

        let receivedData = "",
          a = "",
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
      } catch (err) {
        console.error("Serial error:", err && err.message);
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
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
    },

    async tambahWaktu(waktuA, waktuB) {
      const psA = String(waktuA).split(":"),
        psB = String(waktuB).split(":");
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

    /** SAVE RESULT (channel khusus H2H) */
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
      ipcRenderer.send("insert-h2h-result", docs);

      ipcRenderer.once("insert-h2h-result-reply", (_e, res) => {
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
/* ===== HERO / BANNER ===== */
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

/* ===== TABLE WRAPPER: overflow horizontal tanpa mengecilkan kolom ===== */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.table-wrapper::-webkit-scrollbar {
  height: 8px;
}
.table-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}
.table-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.28);
  border-radius: 8px;
}

/* ===== TABLE ===== */
table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
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
  white-space: nowrap;
} /* <-- cegah wrap; geser ke samping */
.text-monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}

.large-bold {
  font-size: 1.2rem;
  font-weight: 800;
}
.text-strong {
  color: #000;
}
.max-char {
  max-width: 260px;
  white-space: normal;
  word-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
} /* Team name boleh wrap */

/* ===== PORT STATUS ===== */
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

/* ===== BUTTONS ===== */
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

/* ===== BRACKET (refined) ===== */
.bracket {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(260px, 1fr);
  gap: 18px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.bracket::-webkit-scrollbar {
  height: 8px;
}
.bracket::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}
.bracket::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.28);
  border-radius: 8px;
}

.bracket__round {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  padding: 14px;
  min-width: 260px;
  position: relative;
}
.bracket__round--bronze {
  background: linear-gradient(180deg, #fff7ef, #ffffff);
}

.bracket__round-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: transparent;
  padding-bottom: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
}
.bracket__round-title {
  font-weight: 800;
  letter-spacing: 0.3px;
}
.bracket__round-meta {
  font-size: 12px;
  color: #6b7280;
}

.bracket__list {
  display: grid;
  gap: 12px;
}

.bracket__match {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 10px;
  background: #fafafa;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.bracket__match:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  background: #fff;
}

.bracket__team {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
}
.bracket__team + .bracket__team {
  margin-top: 8px;
} /* kalau tanpa vs */
.bracket__team-main {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bracket__seed {
  min-width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #eef6ff;
  color: #2563eb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  border: 1px solid rgba(37, 99, 235, 0.12);
}
.bracket__name {
  font-weight: 700;
  color: #111827;
  max-width: 170px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bracket__score {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-weight: 800;
  color: #111827;
  padding-left: 8px;
}

.bracket__vs {
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  margin: 6px 0;
}

.bracket__footer {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.bracket__actions {
  display: flex;
  gap: 6px;
}
.btn-xs {
  --padY: 2px;
  --padX: 8px;
  padding: var(--padY) var(--padX);
  font-size: 12px;
  line-height: 1.2;
  border-radius: 8px;
}
.bracket__winner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid rgba(16, 185, 129, 0.18);
  padding: 2px 8px;
  border-radius: 999px;
}

.bracket__team.is-bye {
  opacity: 0.7;
  background: #f9fafb;
  border-style: dashed;
}
</style>
