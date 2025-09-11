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

        <div class="d-flex flex-wrap mt-2" style="gap: 8px">
          <span v-if="podium.gold" class="badge badge-success"
            >🥇 Juara 1: {{ podium.gold }}</span
          >
          <span v-if="podium.silver" class="badge badge-primary"
            >🥈 Juara 2: {{ podium.silver }}</span
          >
          <span v-if="podium.bronze" class="badge badge-warning"
            >🥉 Juara 3: {{ podium.bronze }}</span
          >
          <span v-if="podium.fourth" class="badge badge-secondary"
            >4th: {{ podium.fourth }}</span
          >
        </div>
      </div>
    </div>

    <!-- BRACKET -->
    <div class="px-4 mt-4 mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h4 class="mb-0">Bracket Head 2 Head</h4>
        <div class="d-flex" style="gap: 8px">
          <div class="d-flex align-items-center" style="gap: 8px">
            <button class="btn btn-outline-secondary" @click="prevRound">
              <Icon icon="mdi:chevron-left" /> Prev
            </button>

            <!-- NEW: pilih babak aktif -->
            <b-form-select
              v-model="currentRoundIndex"
              :options="roundOptions"
              class="w-auto"
              style="min-width: 180px"
            ></b-form-select>

            <button class="btn btn-outline-secondary" @click="nextRound">
              Next <Icon icon="mdi:chevron-right" />
            </button>
          </div>

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

                <!-- <div
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
                </div> -->

                <div
                  class="bracket__actions"
                  v-if="m.team1.name && m.team2.name"
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

    <!-- OPERATION TIME (shared component) -->
    <OperationTimePanel
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="visibleParticipants"
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />

    <!-- LIST RESULT -->
    <div class="px-4 mt-4">
      <div class="card-body">
        <h4>
          List Result —
          {{
            currentRound
              ? currentRound.bronze
                ? "Third Place"
                : currentRound.name
              : "—"
          }}
        </h4>
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
                    <th rowspan="2">No</th>
                    <th rowspan="2">Heat</th>
                    <th rowspan="2">Team Name</th>
                    <th rowspan="2">BIB</th>
                    <th rowspan="2">Start Time</th>

                    <!-- Grup Penalties -->
                    <th colspan="8" class="text-center">Penalties</th>

                    <th rowspan="2">Total Penalty</th>
                    <th rowspan="2">Penalty Time</th>
                    <th rowspan="2">Finish Time</th>
                    <th rowspan="2">Race Time</th>
                    <th rowspan="2">Result</th>
                    <th rowspan="2">Win/Lose</th>
                    <th v-if="editResult" rowspan="2">Action</th>
                  </tr>
                  <tr>
                    <th>S</th>
                    <th>CL</th>
                    <th>R1</th>
                    <th>R2</th>
                    <th>L1</th>
                    <th>L2</th>
                    <th>PB</th>
                    <th>F</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(item, index) in visibleParticipants" :key="index">
                    <td>{{ index + 1 }}</td>
                    <!-- Heat = index match pada babak aktif -->
                    <td style="min-width: 110px">
                      <b-form-select
                        v-model="item.result.heat"
                        :options="heatOptionsLabeled"
                        size="sm"
                        class="w-auto"
                        @change="onHeatChanged(item)"
                      />
                    </td>

                    <td class="large-bold text-strong max-char">
                      {{ item.nameTeam }}
                      <span
                        v-if="isByeTeam(item)"
                        class="badge badge-light ml-2"
                        >BYE</span
                      >
                    </td>
                    <td class="large-bold">{{ item.bibTeam }}</td>
                    <td class="text-monospace">{{ item.result.startTime }}</td>

                    <!-- Penalties breakdown (read-only jika belum ada rincian) -->
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.s"
                        :options="penaltyChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="isByeTeam(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.cl"
                        :options="penaltyChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.r1"
                        :options="penaltyChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.r2"
                        :options="penaltyChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.l1"
                        :options="penaltyChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.l2"
                        :options="penaltyChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.pb"
                        :options="penaltyChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.f"
                        :options="penaltyChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                      />
                    </td>

                    <td class="large-bold">
                      {{ getTotalPenalty(item) }}
                      <small class="text-muted"
                        >({{ getPenaltyCount(item) }}x)</small
                      >
                    </td>

                    <!-- Penalty selector tetap ada (biar gampang input) -->
                    <td class="text-monospace large-bold">
                      {{ item.result.penaltyTime }}
                    </td>

                    <td class="text-monospace">{{ item.result.finishTime }}</td>

                    <td class="large-bold text-monospace">
                      {{ item.result.raceTime }}
                    </td>

                    <td class="text-monospace large-bold">
                      {{
                        item.result.penaltyTime
                          ? item.result.totalTime
                          : item.result.raceTime
                      }}
                    </td>

                    <td class="large-bold">{{ item.result.winLose || "" }}</td>

                    <td v-if="editResult">
                      <button
                        type="button"
                        class="btn btn-warning"
                        @click="openModal(item)"
                        :disabled="isByeTeam(item)"
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

// NEW: key penyimpanan hasil per-babak
const RESULTS_KEY_PREFIX = "h2hRoundResults:";

// gabungkan kunci unik berdasar bucket (event/initial/race/division)
function getResultsRootKey() {
  const b = getBucket();
  if (!b.eventId || !b.initialId || !b.raceId || !b.divisionId) return null;
  return (
    RESULTS_KEY_PREFIX +
    [b.eventId, b.initialId, b.raceId, b.divisionId].join("|")
  );
}

// NEW: helper baca/tulis ke localStorage
function readAllRoundResults(rootKey) {
  try {
    return JSON.parse(localStorage.getItem(rootKey) || "{}");
  } catch {
    return {};
  }
}
function writeAllRoundResults(rootKey, obj) {
  localStorage.setItem(rootKey, JSON.stringify(obj || {}));
}

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
    penalties: { s: 0, cl: 0, r1: 0, r2: 0, l1: 0, l2: 0, pb: 0, f: 0 },
    totalTime: "",
    ranked: "",
    score: "",
    winLose: null,
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
    teams: Array.isArray(b.teams) ? b.teams.map(normalizeTeamForH2H) : [],
  };
  return { bucket };
}

export default {
  name: "SustainableTimingSystemH2HRace",
  components: { OperationTimePanel, Icon },
  data() {
    return {
      roundResultsRootKey: null,
      podium: {
        gold: null, // Juara 1
        silver: null, // Juara 2
        bronze: null, // Juara 3
        fourth: null, // Juara 4
      },
      currentRoundIndex: -1,
      editBracketTeams: false,
      rounds: [],
      showBronze: true,
      editForm: "",
      editResult: false,
      port: null,
      isPortConnected: false,
      digitId: [],
      digitTime: [],
      dataPenalties: [
        { label: "0", value: 0, timePen: "00:00:00.000" },
        { label: "5", value: 5, timePen: "00:00:05.000" },
        { label: "50", value: 50, timePen: "00:00:50.000" },
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
      isRankedDescending: false,

      /** penting: tipe konsisten */
      participant: [],
      dataEvent: {},
      titleCategories: "",
    };
  },

  computed: {
    penaltyChoices() {
      // opsi untuk semua dropdown penalty (S, CL, R1, R2, L1, L2, PB, F)
      // ambil dari dataPenalties supaya satu sumber data
      return (this.dataPenalties || []).map((p) => ({
        value: Number(p.value) || 0,
        text: `${p.label} (${p.value}s)`,
      }));
    },
    // jumlah opsi heat = banyaknya match pada babak aktif
    heatOptions() {
      var r = this.currentRound;
      var n = r && r.matches ? r.matches.length : 0;
      return Array.from({ length: n }, function (_, i) {
        return { value: i + 1, text: i + 1 }; // 1..n (bukan index)
      });
    },
    heatOptionsLabeled() {
      return this.heatOptions.map(function (o) {
        return { value: o.value, text: "Heat " + o.text };
      });
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

    // NEW: opsi dropdown babak (ikut urutan this.rounds)
    roundOptions() {
      return (this.rounds || []).map((r, i) => ({
        value: i,
        text: r.bronze ? "Third Place" : r.name,
      }));
    },

    // NEW: ambil round aktif (null-safe)
    currentRound() {
      const i = this.currentRoundIndex;
      return i >= 0 && i < (this.rounds || []).length ? this.rounds[i] : null;
    },

    // NEW: tim (nama) yang tampil pada babak aktif → array of strings (nama tim)
    teamsInCurrentRound() {
      const r = this.currentRound;
      if (!r) return [];
      const names = [];
      (r.matches || []).forEach((m) => {
        if (m.team1 && m.team1.name) names.push(String(m.team1.name));
        if (m.team2 && m.team2.name) names.push(String(m.team2.name));
      });
      // unik
      return Array.from(new Set(names));
    },

    // NEW: participant yang “terlihat” = hanya mereka yang ada di babak aktif
    visibleParticipants() {
      const want = new Set(
        this.teamsInCurrentRound.map(function (n) {
          return n.toUpperCase();
        })
      );
      const list = this.participantArr.filter(function (p) {
        const nm = String(p.nameTeam || p.teamName || "").toUpperCase();
        return nm && want.has(nm);
      });

      // placeholder jika belum ada di participant
      if (want.size && list.length < want.size) {
        const existing = new Set(
          list.map(function (p) {
            return String(p.nameTeam || p.teamName || "").toUpperCase();
          })
        );
        this.teamsInCurrentRound.forEach(function (n) {
          const up = n.toUpperCase();
          if (!existing.has(up))
            list.push(this.normalizeTeamForViewPlaceholder(n));
        }, this);
      }

      // ===== NEW: sort agar Heat 1,1, 2,2, dst (berdasarkan heat & posisi team1/team2)
      const orderMap = this.buildHeatOrderPosMapFromBracket();
      list.sort(function (a, b) {
        // A
        var nameA = String(a.nameTeam || a.teamName || "").toUpperCase();
        var recA = orderMap[nameA];
        var heatA =
          (a && a.result && Number(a.result.heat)) || (recA ? recA.heat : 9999);
        var posA = recA ? recA.pos : 9;

        // B
        var nameB = String(b.nameTeam || b.teamName || "").toUpperCase();
        var recB = orderMap[nameB];
        var heatB =
          (b && b.result && Number(b.result.heat)) || (recB ? recB.heat : 9999);
        var posB = recB ? recB.pos : 9;

        if (heatA !== heatB) return heatA - heatB; // heat dulu
        if (posA !== posB) return posA - posB; // team1 sebelum team2
        // stabilizer (biar konsisten)
        return nameA.localeCompare(nameB);
      });

      return list;
    },
  },

  watch: {
    rounds: {
      deep: true,
      handler() {
        this.computePodium();
        this.$nextTick(this.ensureDefaultHeatForVisible);
      },
    },
    currentRoundIndex() {
      this.computePodium();
      this.$nextTick(this.ensureDefaultHeatForVisible);
      this.loadRoundResultsForCurrentRound(); // <-- tambah ini
    },
  },

  beforeRouteLeave(to, from, next) {
    // NEW: reset data hasil pertandingan di localStorage ketika berpindah halaman
    this.clearAllRoundResults();
    next();
  },

  async mounted() {
    const ok = this.loadFromRaceStartPayload();
    if (!ok) await this.checkValueStorage();

    // jumlah tim aktual (4..32), bisa diambil dari participantArr.length
    const n = Math.min(Math.max(this.participantArr.length || 8, 4), 32);
    this.rebuildBracketDynamic(n); // bangun + seed kolom pertama
    this.syncWinLoseFromBracketToParticipants(); // NEW

    this.roundResultsRootKey = getResultsRootKey(); // NEW
    // load hasil tersimpan utk babak awal (jika ada)
    this.loadRoundResultsForCurrentRound(); // NEW

    this.$nextTick(this.ensureDefaultHeatForVisible);
  },

  methods: {
    evaluateHeatWinnersForCurrentRound() {
      const r = this.currentRound;
      if (!r || !r.matches) return;

      const toKey = (p) =>
        String((p && (p.nameTeam || p.teamName)) || "").toUpperCase();

      // map nama → object participant (subset visible)
      const map = new Map(this.visibleParticipants.map((p) => [toKey(p), p]));

      r.matches.forEach((m) => {
        const n1 = m.team1 && m.team1.name ? m.team1.name.toUpperCase() : "";
        const n2 = m.team2 && m.team2.name ? m.team2.name.toUpperCase() : "";

        // BYE dibiarkan mekanisme bye yang menetapkan pemenang
        if (m.bye || !n1 || !n2) return;

        const P1 = map.get(n1);
        const P2 = map.get(n2);
        if (!P1 || !P2) return;

        const t1 =
          (P1.result && (P1.result.totalTime || P1.result.raceTime)) || "";
        const t2 =
          (P2.result && (P2.result.totalTime || P2.result.raceTime)) || "";

        const T1 = this.parsesTime(t1);
        const T2 = this.parsesTime(t2);
        if (!isFinite(T1) || !isFinite(T2)) return; // belum lengkap

        if (T1 < T2) {
          m.winner = m.team1;
          P1.result.winLose = "Win";
          P2.result.winLose = "Lose";
        } else if (T2 < T1) {
          m.winner = m.team2;
          P1.result.winLose = "Lose";
          P2.result.winLose = "Win";
        } else {
          m.winner = null;
          P1.result.winLose = null;
          P2.result.winLose = null;
        }
      });

      this.computePodium();
      this.persistRoundResults();
    },
    isByeTeam(item) {
      const r = this.currentRound;
      if (!r || !r.matches) return false;
      const name = String(
        (item && (item.nameTeam || item.teamName)) || ""
      ).toUpperCase();
      if (!name) return false;

      for (var i = 0; i < r.matches.length; i++) {
        var m = r.matches[i];
        if (!m || !m.bye) continue;

        var n1 = m.team1 && m.team1.name ? m.team1.name.toUpperCase() : "";
        var n2 = m.team2 && m.team2.name ? m.team2.name.toUpperCase() : "";

        // Pada BYE, hanya satu dari n1/n2 yang ada.
        if ((n1 && n1 === name && !n2) || (n2 && n2 === name && !n1)) {
          return true; // tim ini lolos BYE → disable inputnya
        }
      }
      return false;
    },
    getPenaltyCount(item) {
      const has = item && item.result;
      const pb = has && item.result.penalties;
      if (!pb || typeof pb !== "object") return 0;
      const keys = ["s", "cl", "r1", "r2", "l1", "l2", "pb", "f"];
      // hitung berapa field yang > 0
      return keys.reduce(
        (cnt, k) => cnt + ((Number(pb[k]) || 0) > 0 ? 1 : 0),
        0
      );
    },
    secondsToTimeString(totalSec) {
      const t = Math.max(0, Number(totalSec) || 0);
      const ms = 0;
      const sec = Math.floor(t % 60);
      const min = Math.floor((t / 60) % 60);
      const hr = Math.floor(t / 3600);
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.${pad(ms, 3)}`;
    },
    ensurePenaltiesObject(result) {
      if (!result || typeof result !== "object") return;

      if (!result.penalties || typeof result.penalties !== "object") {
        // pastikan reactive (Vue 2)
        this.$set(result, "penalties", {
          s: 0,
          cl: 0,
          r1: 0,
          r2: 0,
          l1: 0,
          l2: 0,
          pb: 0,
          f: 0,
        });
      } else {
        const keys = ["s", "cl", "r1", "r2", "l1", "l2", "pb", "f"];
        keys.forEach((k) => {
          const v = result.penalties[k];
          // paksa ke number & reactive kalau belum ada
          if (typeof v === "undefined") {
            this.$set(result.penalties, k, 0);
          } else {
            result.penalties[k] = Number(v) || 0;
          }
        });
      }
    },
    async onPenaltyChange(item) {
      if (!item || !item.result) return;

      // pastikan struktur penalties exist & numeric
      this.ensurePenaltiesObject(item.result);

      // total poin penalty (detik)
      const totalPenaltySeconds = this.getTotalPenalty(item);
      item.result.penalty = totalPenaltySeconds;

      // detik → HH:MM:SS.mmm
      item.result.penaltyTime = this.secondsToTimeString(totalPenaltySeconds);

      // hitung total time jika sudah ada raceTime
      if (item.result.raceTime) {
        item.result.totalTime = await this.tambahWaktu(
          item.result.raceTime,
          item.result.penaltyTime
        );
      }

      this.evaluateHeatWinnersForCurrentRound();

      // re-rank subset & persist
      await this.assignRanks(this.visibleParticipants);
      this.syncWinLoseFromBracketToParticipants();
      this.persistRoundResults();
    },

    // map: NAMA_TIM (UPPER) -> { heat: number, pos: 0|1 }  (pos: team1=0, team2=1)
    buildHeatOrderPosMapFromBracket() {
      var r = this.currentRound;
      var map = Object.create(null);
      if (!r || !r.matches) return map;

      r.matches.forEach(function (m, i) {
        var h = i + 1;
        var n1 =
          m.team1 && m.team1.name ? String(m.team1.name).toUpperCase() : "";
        var n2 =
          m.team2 && m.team2.name ? String(m.team2.name).toUpperCase() : "";
        if (n1) map[n1] = { heat: h, pos: 0 };
        if (n2) map[n2] = { heat: h, pos: 1 };
      });
      return map;
    },
    // Map nama tim → nomor heat (match index + 1) dari babak aktif
    buildHeatMapFromBracket() {
      var r = this.currentRound;
      var map = Object.create(null);
      if (!r || !r.matches) return map;

      r.matches.forEach(function (m, i) {
        var h = i + 1;
        var n1 =
          m.team1 && m.team1.name ? String(m.team1.name).toUpperCase() : "";
        var n2 =
          m.team2 && m.team2.name ? String(m.team2.name).toUpperCase() : "";
        if (n1) map[n1] = h;
        if (n2) map[n2] = h;
      });
      return map;
    },

    // Pastikan setiap item punya result.heat; jika kosong → isi dari bracket
    ensureDefaultHeatForVisible() {
      var heatMap = this.buildHeatMapFromBracket();
      this.visibleParticipants.forEach(function (p) {
        if (!p.result) p.result = {};
        if (!p.result.heat || Number(p.result.heat) <= 0) {
          var key = String(p.nameTeam || p.teamName || "").toUpperCase();
          p.result.heat = heatMap[key] || 1;
        }
      });
    },

    // Saat user ubah dropdown heat pada baris
    onHeatChanged(item) {
      var n = Number(item && item.result && item.result.heat) || 1;
      item.result.heat = n;
      if (typeof this.persistRoundResults === "function") {
        this.persistRoundResults();
      }
      // trigger re-render (opsional, biasanya tidak perlu karena reactive)
      this.$forceUpdate && this.$forceUpdate();
    },
    // mapping tim -> nomor heat (index match + 1) pada babak aktif
    getPB(item, key) {
      const has = item && item.result;
      const pb = has && item.result.penalties;
      const v = pb && typeof pb[key] !== "undefined" ? pb[key] : 0;
      return Number.isFinite(+v) ? +v : 0;
    },

    getTotalPenalty(item) {
      const has = item && item.result;
      const pb = has && item.result.penalties;
      if (pb && typeof pb === "object") {
        const keys = ["s", "cl", "r1", "r2", "l1", "l2", "pb", "f"];
        return keys.reduce((sum, k) => sum + (Number(pb[k]) || 0), 0);
      }
      // fallback ke skema lama (single value)
      const pen =
        has && typeof item.result.penalty !== "undefined"
          ? item.result.penalty
          : 0;
      return Number(pen || 0);
    },

    // identitas round saat ini utk map penyimpanan
    currentRoundKey() {
      const r = this.currentRound;
      return r ? String(r.id) : null;
    },

    // NEW: kumpulkan hasil tim-tim yg sedang tampil (babak aktif) & simpan ke localStorage
    persistRoundResults() {
      if (!this.roundResultsRootKey) return;
      const roundKey = this.currentRoundKey();
      if (!roundKey) return;

      // hanya simpan subset tim pada babak aktif (visibleParticipants)
      const pack = this.visibleParticipants.map((p) => ({
        nameTeam: String(p.nameTeam || p.teamName || ""),
        bibTeam: String(p.bibTeam || ""),
        result: { ...(p.result || {}) }, // start, finish, race, penalty, total, ranked, winLose, dll.
      }));

      const all = readAllRoundResults(this.roundResultsRootKey);
      all[roundKey] = pack;
      writeAllRoundResults(this.roundResultsRootKey, all);
    },

    // NEW: muat hasil tersimpan utk babak aktif lalu merge ke this.participant
    loadRoundResultsForCurrentRound() {
      if (!this.roundResultsRootKey) return;
      const roundKey = this.currentRoundKey();
      if (!roundKey) return;

      const all = readAllRoundResults(this.roundResultsRootKey);
      const arr = Array.isArray(all[roundKey]) ? all[roundKey] : [];
      if (!arr.length) {
        // tetap sinkron status win/lose walau belum ada simpanan
        this.syncWinLoseFromBracketToParticipants();
        return;
      }

      // merge by name (fallback bib)
      const indexByName = new Map(
        this.participantArr.map((p, i) => [
          String(p.nameTeam || p.teamName || "").toUpperCase(),
          i,
        ])
      );
      arr.forEach((row) => {
        const key = String(row.nameTeam || "").toUpperCase();
        const idx = indexByName.get(key);
        if (idx != null && idx > -1) {
          // masukkan kembali ke objek utama
          const tgt = this.participant[idx];
          tgt.result = { ...(tgt.result || {}), ...(row.result || {}) };
        }
      });

      // hitung ranking ulang utk subset babak aktif
      this.assignRanks(this.visibleParticipants);
      this.syncWinLoseFromBracketToParticipants();
    },

    // NEW: bersihkan seluruh hasil per-babak (dipakai saat pindah halaman)
    clearAllRoundResults() {
      if (!this.roundResultsRootKey) return;
      localStorage.removeItem(this.roundResultsRootKey);
    },

    // NEW: tandai Win/Lose utk list berdasarkan winner di bracket utk babak aktif
    syncWinLoseFromBracketToParticipants() {
      const r = this.currentRound;
      if (!r) return;

      // map nama tim → object participant yg sedang tampil di tabel
      const nameMap = new Map(
        this.visibleParticipants.map(function (p) {
          return [String(p.nameTeam || p.teamName || "").toUpperCase(), p];
        })
      );

      (r.matches || []).forEach(function (m) {
        const t1 = m.team1 && m.team1.name ? m.team1.name.toUpperCase() : "";
        const t2 = m.team2 && m.team2.name ? m.team2.name.toUpperCase() : "";
        const w = m.winner && m.winner.name ? m.winner.name.toUpperCase() : "";
        const isBye = !!m.bye; // flag BYE dari bracket

        const P1 = t1 ? nameMap.get(t1) : null;
        const P2 = t2 ? nameMap.get(t2) : null;

        // default: null
        var v1 = null,
          v2 = null;

        if (isBye) {
          // kalau BYE, pemenang otomatis ada 1 tim saja
          if (w && t1 && w === t1) v1 = "Bye";
          if (w && t2 && w === t2) v2 = "Bye";
        } else if (w) {
          // match normal: Win/Lose sesuai pemenang
          if (t1) v1 = w === t1 ? "Win" : t2 ? "Lose" : null;
          if (t2) v2 = w === t2 ? "Win" : t1 ? "Lose" : null;
        }
        // kalau belum ada pemenang & bukan BYE → tetap null

        if (P1) {
          if (!P1.result) P1.result = {};
          P1.result.winLose = v1;
        }
        if (P2) {
          if (!P2.result) P2.result = {};
          P2.result.winLose = v2;
        }
      });
    },
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
    /** Method podium config */
    /** Cari round final (size==2) dan bronze (round.bronze) */
    getFinalRound() {
      return (this.rounds || []).find((r) => !r.bronze && r.size === 2) || null;
    },
    getBronzeRound() {
      return (this.rounds || []).find((r) => r.bronze) || null;
    },

    /** Reset podium */
    clearPodium() {
      this.podium = { gold: null, silver: null, bronze: null, fourth: null };
    },

    /** Hitung podium dari keadaan Final & Bronze saat ini */
    computePodium() {
      this.clearPodium();

      const final = this.getFinalRound();
      if (final && final.matches && final.matches[0]) {
        const fm = final.matches[0];
        if (fm.winner && fm.winner.name) {
          // Juara 1 = pemenang final
          this.podium.gold = fm.winner.name;
          // Juara 2 = lawan pemenang final
          const runnerUp =
            fm.winner.name === (fm.team1 && fm.team1.name)
              ? fm.team2
              : fm.team1;
          if (runnerUp && runnerUp.name) this.podium.silver = runnerUp.name;
        }
      }

      const bronze = this.getBronzeRound();
      if (bronze && bronze.matches && bronze.matches[0]) {
        const bm = bronze.matches[0];
        if (bm.winner && bm.winner.name) {
          // Juara 3 = pemenang bronze
          this.podium.bronze = bm.winner.name;
          // Juara 4 = lawan pemenang bronze
          const fourth =
            bm.winner.name === (bm.team1 && bm.team1.name)
              ? bm.team2
              : bm.team1;
          if (fourth && fourth.name) this.podium.fourth = fourth.name;
        }
      }
    },

    /** Babak configuration */
    // NEW: buat placeholder participant jika tim ada di bracket tapi belum ada di data
    normalizeTeamForViewPlaceholder(name) {
      return {
        penaltyChoices: [0, 5, 10],
        nameTeam: String(name),
        bibTeam: "",
        startOrder: "",
        praStart: "",
        intervalRace: "",
        statusId: 0,
        result: {
          startTime: "",
          finishTime: "",
          raceTime: "",
          penaltyTime: "00:00:00.000",
          penalty: 0,
          totalTime: "",
          ranked: "",
          score: "",
          winLose: null,
        },
        otr: {
          startTime: "",
          finishTime: "",
          raceTime: "",
          penaltyTime: "00:00:00.000",
          penalty: 0,
          totalTime: "",
          ranked: "",
          score: "",
          winLose: null,
        },
      };
    },

    // CHANGED: setelah build, set currentRoundIndex = round awal terbesar (firstRoundIndex)
    rebuildBracketDynamic(nTeams) {
      this.rounds = this.buildEmptyBracket(nTeams);
      this.populateFirstRoundWithSeeds(nTeams);
      // set babak aktif ke ronde kompetitif paling awal (bukan bronze)
      this.currentRoundIndex = this.firstRoundIndex;
      this.computePodium();
    },

    // NEW: navigasi babak
    prevRound() {
      if (this.currentRoundIndex > 0) this.currentRoundIndex--;
    },
    nextRound() {
      if (this.currentRoundIndex < this.rounds.length - 1)
        this.currentRoundIndex++;
    },
    /** End babak configuration */

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
      this.syncWinLoseFromBracketToParticipants(); // NEW
      this.persistRoundResults(); // NEW
    },

    /** Pindahkan pemenang secara manual ke ronde berikutnya (untuk non-BYE) */
    advanceWinner(roundIndex, matchIndex, winnerIdx /* 1 atau 2 */) {
      const round = this.rounds[roundIndex];
      if (!round) return;

      const match = round.matches[matchIndex];
      if (!match) return;

      // set pemenang match ini
      const winner = winnerIdx === 1 ? match.team1 : match.team2;
      match.winner = winner;

      // Jika ini BUKAN bronze, dorong pemenang ke ronde kompetitif berikutnya (kalau ada)
      if (!round.bronze) {
        let nextRoundIndex = -1;
        for (let i = roundIndex + 1; i < this.rounds.length; i++) {
          if (!this.rounds[i].bronze) {
            nextRoundIndex = i;
            break;
          }
        }

        if (nextRoundIndex !== -1) {
          const next = this.rounds[nextRoundIndex];
          const slot = Math.floor(matchIndex / 2);
          const pos = matchIndex % 2 === 0 ? "team1" : "team2";
          if (next && next.matches[slot]) {
            next.matches[slot][pos] = winner;
          }
        }
      }

      // Jika ini Final (size==2 & non-bronze) atau Bronze, hitung podium (Juara 1–4)
      const isFinal = !round.bronze && round.size === 2;
      const isBronze = !!round.bronze;
      if (isFinal || isBronze) {
        this.computePodium();
      }
      this.syncWinLoseFromBracketToParticipants(); // NEW
      this.persistRoundResults(); // NEW: simpan setiap ada perubahan pemenang
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

      dataStorage = localStorage.getItem("participantByCategories");
      events = localStorage.getItem("eventDetails");

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
      await this.assignRanks(this.visibleParticipants);
      this.evaluateHeatWinnersForCurrentRound();
      this.syncWinLoseFromBracketToParticipants(); // NEW
      this.persistRoundResults(); // NEW
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
        this.notifyError(err, "Serial setup failed");
      }
    },

    async updateTime(val, visIndex, title) {
      // ambil item yang sedang terlihat (subset babak aktif)
      const visItem = this.visibleParticipants[visIndex];
      if (!visItem) return;

      // cari index sebenarnya di this.participant
      const targetIndex = this.participantArr.findIndex((p) => {
        const nameMatch =
          String(p.nameTeam || p.teamName || "").toUpperCase() ===
          String(visItem.nameTeam || visItem.teamName || "").toUpperCase();
        const bibMatch =
          String(p.bibTeam || "") === String(visItem.bibTeam || "");
        // cocokkan nama; kalau ada BIB, bantu perkuat kecocokan
        return nameMatch && (!visItem.bibTeam ? true : bibMatch);
      });

      if (targetIndex === -1) return;

      const target = this.participant[targetIndex];

      if (title === "start") target.result.startTime = val;
      if (title === "finish") {
        target.result.finishTime = val;
        if (target.result.startTime && target.result.finishTime) {
          target.result.raceTime = await this.hitungSelisihWaktu(
            target.result.startTime,
            target.result.finishTime
          );
        }
      }

      await this.assignRanks(this.visibleParticipants);
      this.evaluateHeatWinnersForCurrentRound();
      this.syncWinLoseFromBracketToParticipants(); // NEW
      this.persistRoundResults(); // NEW
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
      const subset = JSON.parse(JSON.stringify(this.visibleParticipants || []));
      if (!Array.isArray(subset) || subset.length === 0) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail: "Belum ada data yang bisa disimpan untuk babak ini.",
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

      // tag metadata babak di dalam result
      const roundId = this.currentRoundKey();
      const roundName = this.currentRound ? this.currentRound.name : "";

      const docs = subset.map((t) => {
        const base = buildResultDocs([t], bucket)[0];
        base.result = {
          ...(base.result || {}),
          _roundId: roundId,
          _roundName: roundName,
        };
        return base;
      });

      ipcRenderer.send("insert-h2h-result", docs);
      ipcRenderer.once("insert-h2h-result-reply", (_e, res) => {
        if (res && res.ok) {
          ipcRenderer.send("get-alert-saved", {
            type: "question",
            detail: `Result telah disimpan untuk babak: ${
              roundName || roundId
            }`,
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
      this.clearAllRoundResults(); // NEW
      this.$router.push(`/event-detail/${this.$route.params.id}`);
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

thead th[rowspan="2"] {
  vertical-align: middle;
}
thead th[colspan="8"] {
  text-align: center;
}
</style>
