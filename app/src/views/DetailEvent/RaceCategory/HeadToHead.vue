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
            {{ "Head to Head" }}
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
    <div class="px-4">
      <div class="card-body">
        <b-row>
          <b-col>
            <div class="meta-panel">
              <div class="meta-row">
                <span class="meta-label">Nomor Lomba</span>
                <span class="meta-value">
                  <span class="badge-chip badge-chip--blue">Head to Head</span>
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
                  label="Switch Head to Head Category:"
                  label-for="h2hBucketSelect"
                  class="mb-0 toolbar-select"
                >
                  <b-form-select
                    id="h2hBucketSelect"
                    :options="h2hBucketOptions"
                    v-model="selectedH2HKey"
                    @change="onSelectH2HBucket"
                    class="toolbar-select__control"
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
    <div class="px-5 mt-2 mb-4">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h4 class="mb-0">Bracket Head to Head</h4>
        <div class="toolbar-actions">
          <!-- Build / Edit -->
          <div class="toolbar-actions">
            <!-- Kelompok tombol -->
            <div
              class="btn-group-actions"
              role="group"
              aria-label="Build actions"
            >
              <button
                class="btn-action btn-outline-info ml-2"
                @click="toggleBracket"
                v-b-tooltip.hover="
                  showBracket ? 'Sembunyikan bracket' : 'Tampilkan bracket'
                "
                aria-controls="h2h-bracket"
                :aria-expanded="showBracket ? 'true' : 'false'"
              >
                <Icon
                  :icon="
                    showBracket ? 'mdi:eye-off-outline' : 'mdi:eye-outline'
                  "
                  class="mr-1"
                />
                {{ showBracket ? "Hide Bracket" : "Show Bracket" }}
              </button>

              <button
                class="btn-action"
                :class="
                  editBracketTeams ? 'btn-success' : 'btn-outline-success'
                "
                @click="editBracketTeams = !editBracketTeams"
                v-b-tooltip.hover="
                  editBracketTeams
                    ? 'Selesai edit tim'
                    : 'Edit tim di ronde pertama'
                "
              >
                <Icon icon="mdi:pencil-outline" class="mr-1" />
                {{ editBracketTeams ? "Done" : "Edit Teams" }}
              </button>

              <button
                class="btn-action btn-outline-danger"
                @click="clearFirstRoundAssignments"
                v-b-tooltip.hover="'Kosongkan ronde pertama'"
              >
                <Icon icon="mdi:eraser-variant" class="mr-1" /> Clear First
              </button>

              <button
                class="btn-action btn-secondary"
                @click="populateBronzeFromSemis"
                v-b-tooltip.hover="'Ambil dua tim kalah semifinal'"
              >
                <Icon icon="mdi:medal-outline" class="mr-1" /> Assign Final B
              </button>
            </div>
          </div>

          <!-- Divider -->
          <div class="toolbar-divider d-none d-md-block"></div>

          <!-- Navigation -->
          <div class="round-nav ml-md-3">
            <button
              class="btn-action btn-outline-secondary"
              @click="prevRound"
              v-b-tooltip.hover="'Ronde sebelumnya'"
            >
              Prev
            </button>

            <b-form-select
              v-model="currentRoundIndex"
              :options="roundOptions"
              class="round-select mx-2"
              v-b-tooltip.hover="'Pilih ronde aktif'"
            />

            <button
              class="btn-action btn-outline-secondary"
              @click="nextRound"
              v-b-tooltip.hover="'Ronde berikutnya'"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="showBracket"
        class="bracket"
        role="region"
        aria-label="Tournament Bracket"
      >
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
            <span class="bracket__round-meta" v-else>Final B</span>
          </div>

          <div class="bracket__list">
            <div
              v-for="(m, mIdx) in round.matches"
              :key="m.id"
              class="bracket__match"
              :aria-label="`Match ${m.id}`"
            >
              <div class="bracket__winner" v-if="m.winner && m.winner.name">
                <Icon icon="mdi:trophy-variant-outline" />
                <span class="ml-1">{{ m.winner.name }}</span>
              </div>
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
                    <b-form-select
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
                    </b-form-select>
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
                    <b-form-select
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
                    </b-form-select>
                  </div>
                </div>
                <span class="bracket__score" v-if="m.score2 != null">{{
                  m.score2
                }}</span>
              </div>

              <!-- Actions / badges -->
              <div class="bracket__footer">
                <div
                  class="bracket__actions"
                  v-if="m.team1.name && m.team2.name"
                >
                  <button
                    v-if="!editBracketTeams"
                    class="btn-action btn-xs btn-outline-success"
                    @click="advanceWinner(rIdx, mIdx, 1)"
                    title="Set winner: top"
                    :disabled="editBracketTeams"
                  >
                    <Icon icon="mdi:crown-outline" /> Top Win
                  </button>
                  <button
                    v-if="!editBracketTeams"
                    class="btn-action btn-xs btn-outline-primary"
                    @click="advanceWinner(rIdx, mIdx, 2)"
                    title="Set winner: bottom"
                    :disabled="editBracketTeams"
                  >
                    <Icon icon="mdi:crown-outline" /> Bottom Win
                  </button>
                </div>

                <!-- Toggle BYE (hanya saat edit tim) -->
                <button
                  v-if="
                    editBracketTeams &&
                    !['Final A', 'Final B', 'Semifinals'].includes(
                      (round.name || '').trim()
                    )
                  "
                  class="btn-action btn-xs btn-outline-dark"
                  @click="toggleBye(rIdx, mIdx)"
                  :title="
                    round.matches[mIdx] && round.matches[mIdx].bye
                      ? 'Batalkan BYE'
                      : 'Set BYE'
                  "
                >
                  <Icon icon="mdi:transfer-right" />
                  {{
                    round.matches[mIdx] && round.matches[mIdx].bye
                      ? "Un-BYE"
                      : "Set BYE"
                  }}
                  {{ round.name }}
                </button>
              </div>
            </div>
            <!-- /match -->
          </div>
          <!-- /list -->
        </div>
        <!-- /round -->
      </div>

      <div v-if="!showBracket" class="bracket-hidden-info">
        <div>
    <Icon icon="mdi:eye-off-outline" class="info-icon" />
    <h5 class="mb-1">Bracket is Hidden</h5>
    <p class="mb-0 text-muted">
      Gunakan tombol <strong>Show Bracket</strong> untuk menampilkan kembali.
    </p>
  </div>
</div>
      <!-- /bracket -->
    </div>

    <!-- Racetime Output -->
    <div class="px-4 mt-4">
      <div class="card-body">
        <div class="py-3" style="display: flex; justify-content: space-between">
          <div>
            <h4>
              Racetime Output —
              {{
                currentRound
                  ? currentRound.bronze
                    ? "Final B"
                    : currentRound.name
                  : "—"
              }}
            </h4>
          </div>
          <div class="d-flex" style="gap: 8px">
            <button
              class="btn-action btn-outline-success"
              @click="saveAllRoundsLocal"
            >
              <Icon icon="mdi:content-save-all-outline" /> Save All (Local)
            </button>
            <button
              class="btn-action btn-outline-primary"
              @click="saveAllRoundsToDB"
            >
              <Icon icon="mdi:database-arrow-up-outline" /> Save All (DB)
            </button>
            <button
              class="btn-action btn-outline-dark"
              @click="exportAllRoundsJSON"
            >
              <Icon icon="mdi:download" /> Export JSON
            </button>
          </div>
        </div>
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
                    <th colspan="9" class="text-center">Penalties</th>

                    <th rowspan="2">Total Penalty</th>
                    <th class="text-center" rowspan="2">Penalty Time</th>
                    <th class="text-center" rowspan="2">Finish Time</th>
                    <th class="text-center" rowspan="2">Race Time</th>
                    <th class="text-center" rowspan="2">Result</th>
                    <th rowspan="2">Win/Lose</th>
                    <th v-if="editResult" rowspan="2">Action</th>
                  </tr>
                  <tr>
                    <th class="text-center">S</th>
                    <th class="text-center">CL</th>
                    <th class="text-center">R1</th>
                    <th class="text-center">R2</th>
                    <th class="text-center">L1</th>
                    <th class="text-center">L2</th>
                    <th class="text-center">PB</th>
                    <th class="text-center">F</th>
                    <th class="text-center">Others</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="(item, index) in visibleParticipants"
                    :key="stableRowKey(item)"
                  >
                    <td>{{ index + 1 }}</td>
                    <!-- Heat = index match pada babak aktif -->
                    <td style="min-width: 110px">
                      <b-form-select
                        v-model="item.result.heat"
                        :options="[
                          { value: null, text: '— pilih heat —' },
                          ...heatOptionsForItem(item),
                        ]"
                        size="sm"
                        class="w-auto"
                        @change="onHeatChanged(item, $event)"
                        :disabled="isByeTeam(item)"
                      />
                    </td>

                    <td class="large-bold text-strong max-char">
                      {{ item.nameTeam }}
                      <span
                        v-if="isByeTeam(item)"
                        class="badge badge-light ml-2"
                        >BYE</span
                      >

                      <!-- status pills -->
                      <span
                        v-if="item.result && item.result.flag === 'DNF'"
                        class="badge badge-danger badge-pill ml-2"
                        >DNF</span
                      >
                      <span
                        v-if="item.result && item.result.flag === 'DNS'"
                        class="badge badge-secondary badge-pill ml-2"
                        >DNS</span
                      >
                      <span
                        v-if="item.result && item.result.flag === 'DSQ'"
                        class="badge badge-dark badge-pill ml-2"
                        >DSQ</span
                      >
                    </td>
                    <td class="large-bold">{{ item.bibTeam }}</td>
                    <td class="text-monospace">{{ item.result.startTime }}</td>

                    <!-- Penalties breakdown (read-only jika belum ada rincian) -->
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.s"
                        :options="sChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="isByeTeam(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.cl"
                        :options="clChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="isByeTeam(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model="item.result.penalties.r1"
                        :options="ynChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="isByeTeam(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model="item.result.penalties.r2"
                        :options="ynChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="isByeTeam(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model="item.result.penalties.l1"
                        :options="ynChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="isByeTeam(item)"
                      />
                    </td>
                    <td>
                      <b-form-select
                        v-model="item.result.penalties.l2"
                        :options="ynChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="isByeTeam(item)"
                      />
                    </td>
                    <td class="text-center">
                      <span
                        :class="{
                          'badge badge-success': item.result.penalties.pb === 0,
                          'badge badge-danger': item.result.penalties.pb === 50,
                          'badge badge-danger':
                            item.result.penalties.pb === 100,
                        }"
                        class="p-2"
                      >
                        {{ item.result.penalties.pb }}
                      </span>
                    </td>

                    <td>
                      <b-form-select
                        v-model.number="item.result.penalties.f"
                        :options="fChoices"
                        size="sm"
                        @change="onPenaltyChange(item)"
                        :disabled="isByeTeam(item)"
                      />
                    </td>

                    <td class="pen-o-cell">
                      <b-form-input
                        :value="getOthersValue(item)"
                        size="xs"
                        style="min-width: 10px"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        placeholder="0"
                        @keypress="digitsOnly($event)"
                        @paste="digitsPaste($event)"
                        @input="onOthersTyping($event, item)"
                        @change="onOthersCommit(item)"
                        :disabled="isByeTeam(item)"
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
                      <div class="d-flex" style="gap: 6px; flex-wrap: wrap">
                        <b-button
                          size="sm"
                          variant="outline-secondary"
                          @click="resetRow(item)"
                          :disabled="isByeTeam(item)"
                          >RESET</b-button
                        >
                        <b-button
                          size="sm"
                          variant="outline-danger"
                          @click="markFlag(item, 'DNF')"
                          :disabled="isByeTeam(item)"
                          >DNF</b-button
                        >
                        <b-button
                          size="sm"
                          variant="outline-warning"
                          @click="markFlag(item, 'DNS')"
                          :disabled="isByeTeam(item)"
                          >DNS</b-button
                        >
                        <b-button
                          size="sm"
                          variant="outline-dark"
                          @click="markFlag(item, 'DSQ')"
                          :disabled="isByeTeam(item)"
                          >DSQ</b-button
                        >
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <br />
          </b-col>
        </b-row>
      </div>
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

    <div class="ml-5">
      <b-button @click="goTo" variant="outline-info" class="btn-action">
        <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
      </b-button>
    </div>

    <br /><br />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { createSerialReader, listPorts } from "@/utils/serialConnection.js";
import OperationTimePanel from "@/components/race/OperationTeamPanel.vue";
import { Icon } from "@iconify/vue2";

// NEW: key penyimpanan hasil per-babak
const RESULTS_KEY_PREFIX = "h2hRoundResults:";
const MAX_HEAT_NUMBER = 24;
const HEAT_GLOBAL_KEY = "h2hHeatUsage:page"; // session-scoped
const HEAT_GLOBAL_LIMIT = 2; // tiap nomor dipakai max 2 tim
const SHOW_BRACKET_KEY = "h2h:ui:showBracket";

function readGlobalHeatUsage() {
  try {
    const raw = sessionStorage.getItem(HEAT_GLOBAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeGlobalHeatUsage(obj) {
  sessionStorage.setItem(HEAT_GLOBAL_KEY, JSON.stringify(obj || {}));
}

// tambah/kurang 1 untuk nomor heat tertentu
function bumpGlobalHeat(heat, delta) {
  const usage = readGlobalHeatUsage();
  const h = Number(heat);
  if (!Number.isFinite(h) || h <= 0) return;
  usage[h] = Math.max(0, (usage[h] || 0) + (Number(delta) || 0));
  writeGlobalHeatUsage(usage);
}

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
    /** NEW */
    heat: null,
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

// === SEED GLOBAL HEAT USAGE DARI DATA YANG SUDAH ADA ===
function seedGlobalHeatFromList(list, { reset = false } = {}) {
  const usage = reset ? {} : readGlobalHeatUsage();
  (list || []).forEach((p) => {
    const h = p && p.result && Number(p.result.heat);
    if (Number.isFinite(h) && h > 0) {
      usage[h] = (usage[h] || 0) + 1;
      // simpan sebagai prev agar onHeatChanged tidak salah hitung
      p.__prevHeat = h;
    }
  });
  writeGlobalHeatUsage(usage);
}

export default {
  name: "SustainableTimingSystemH2HRace",
  components: { OperationTimePanel, Icon },
  data() {
    return {
      selfSocketId: null,
      selectPath: "",
      baudRate: 9600,
      baudOptions: [1200, 2400, 9600],
      serialCtrl: null,
      endGame: false,
      isScrolled: false,
      showBracket: true,
      h2hBucketOptions: [],
      h2hBucketMap: Object.create(null),
      selectedH2HKey: "",
      currentBucket: null,
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
      var fromEvent = "";
      if (
        this.dataEventSafe &&
        (this.dataEventSafe._id || this.dataEventSafe.id)
      ) {
        fromEvent = String(this.dataEventSafe._id || this.dataEventSafe.id);
      }

      var fromRoute = "";
      if (this.$route && this.$route.params && this.$route.params.id) {
        fromRoute = String(this.$route.params.id);
      }

      var fromBucket = "";
      var bucket = getBucket();
      if (bucket && bucket.eventId) {
        fromBucket = String(bucket.eventId);
      }

      return fromEvent || fromRoute || fromBucket || "";
    },

    divisions() {
      if (
        this.dataEventSafe &&
        Array.isArray(this.dataEventSafe.categoriesDivision)
      ) {
        return this.dataEventSafe.categoriesDivision.map(function (d) {
          return { id: String(d.value), name: String(d.name) };
        });
      }
      return [];
    },

    races() {
      if (
        this.dataEventSafe &&
        Array.isArray(this.dataEventSafe.categoriesRace)
      ) {
        return this.dataEventSafe.categoriesRace.map(function (r) {
          return { id: String(r.value), name: String(r.name) };
        });
      }
      return [];
    },

    initials() {
      if (
        this.dataEventSafe &&
        Array.isArray(this.dataEventSafe.categoriesInitial)
      ) {
        return this.dataEventSafe.categoriesInitial.map(function (i) {
          return { id: String(i.value), name: String(i.name) };
        });
      }
      return [];
    },
    sChoices() {
      return [
        { value: 0, text: "0 (0s)" },
        { value: 50, text: "50 (50s)" },
      ];
    },
    fChoices() {
      return [
        { value: 0, text: "0 (0s)" },
        { value: 10, text: "10 (10s)" },
        { value: 50, text: "50 (50s)" },
      ];
    },
    clChoices() {
      return [
        { value: 0, text: "0 (0s)" },
        { value: 10, text: "10 (10s)" },
        { value: 20, text: "20 (20s)" },
      ];
    },
    ynChoices() {
      return [
        { value: "N", text: "N" },
        { value: "Y", text: "Y" },
      ];
    },
    storedResultsByRound() {
      // baca semua yang sudah dipersist ke localStorage untuk bucket saat ini
      if (!this.roundResultsRootKey) return {};
      const all = readAllRoundResults(this.roundResultsRootKey) || {};
      // bentuk: { "R1": { roundName: "Round of 16", items:[...] }, ... }
      const map = {};
      (this.rounds || []).forEach((r) => {
        const roundId = String(r.id);
        const items = Array.isArray(all[roundId]) ? all[roundId] : [];
        map[roundId] = {
          roundName: r.bronze ? "Final B" : r.name,
          items,
        };
      });
      return map;
    },
    // ... (computed lain tetap)
    allHeatChoices() {
      const usage = readGlobalHeatUsage();
      const maxUsed = Math.max(0, ...Object.keys(usage).map(Number));
      const cap = Math.max(MAX_HEAT_NUMBER, maxUsed + 4); // kasih spare 3-4 nomor
      return Array.from({ length: cap }, (_, i) => i + 1);
    },
    penaltyChoices() {
      // opsi untuk semua dropdown penalty (S, CL, R1, R2, L1, L2, PB, F)
      // ambil dari dataPenalties supaya satu sumber data
      return (this.dataPenalties || []).map((p) => ({
        value: Number(p.value) || 0,
        text: `${p.label} (${p.value}s)`,
      }));
    },
    globalHeatOffsets() {
      // offset heat kumulatif per round index (hanya round kompetitif; bronze ikut offset berjalan)
      let offset = 0;
      const offsets = [];
      (this.rounds || []).forEach((r, i) => {
        offsets[i] = offset;
        if (!r.bronze) {
          offset += r.matches ? r.matches.length : 0;
        } else {
          // bronze tidak menambah jumlah heat total di babak kompetitif
          // tapi tetap memakai offset yang sudah berjalan
        }
      });
      return offsets;
    },
    heatOptions() {
      const r = this.currentRound;
      const n = r && r.matches ? r.matches.length : 0;
      const base = (this.globalHeatOffsets[this.currentRoundIndex] || 0) + 1;
      return Array.from({ length: n }, (_, i) => ({
        value: base + i,
        text: base + i,
      }));
    },
    heatOptionsLabeled() {
      return this.heatOptions.map((o) => ({
        value: o.value,
        text: `Heat ${o.text}`,
      }));
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
        text: r.bronze ? "Final B" : r.name,
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

      const orderMap = this.buildHeatOrderPosMapFromBracket();

      list.sort(function (a, b) {
        var nameA = String(
          (a && (a.nameTeam || a.teamName)) || ""
        ).toUpperCase();
        var nameB = String(
          (b && (b.nameTeam || b.teamName)) || ""
        ).toUpperCase();

        // heat boleh null/'' (BYE / belum diisi) → disortir ke belakang
        var heatA =
          a &&
          a.result &&
          a.result.heat !== null &&
          a.result.heat !== "" &&
          typeof a.result.heat !== "undefined"
            ? Number(a.result.heat)
            : Number.POSITIVE_INFINITY;

        var heatB =
          b &&
          b.result &&
          b.result.heat !== null &&
          b.result.heat !== "" &&
          typeof b.result.heat !== "undefined"
            ? Number(b.result.heat)
            : Number.POSITIVE_INFINITY;

        if (heatA !== heatB) return heatA - heatB;

        var recA = orderMap[nameA];
        var recB = orderMap[nameB];
        var posA = recA && typeof recA.pos !== "undefined" ? recA.pos : 9; // team1=0, team2=1
        var posB = recB && typeof recB.pos !== "undefined" ? recB.pos : 9;

        if (posA !== posB) return posA - posB;
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
      },
    },
    currentRoundIndex() {
      this.computePodium();
      this.loadRoundResultsForCurrentRound();
      this.computeWinLoseByHeat(); // << tambah
    },
    showBracket(val) {
      localStorage.setItem(SHOW_BRACKET_KEY, val ? "1" : "0");
    },
  },

  beforeRouteLeave(to, from, next) {
    this.clearAllRoundResults();
    sessionStorage.removeItem(HEAT_GLOBAL_KEY);
    next();
  },

  async mounted() {
    const saved = localStorage.getItem(SHOW_BRACKET_KEY);
    if (saved !== null) this.showBracket = saved === "1";

    // event details
    try {
      const evRaw = localStorage.getItem("eventDetails");
      this.dataEvent = evRaw ? JSON.parse(evRaw) : {};
    } catch {
      this.dataEvent = {};
    }

    // build opsi statik dari kategori event (fallback ke default bila kosong)
    this.buildStaticH2HOptions();

    // pilih default & fetch teams via DB
    if (this.h2hBucketOptions.length) {
      const savedKey = localStorage.getItem("currentH2HBucketKey");
      this.selectedH2HKey =
        savedKey && this.h2hBucketMap[savedKey]
          ? savedKey
          : this.h2hBucketOptions[0].value;

      await this.fetchH2HBucketTeamsByKey(this.selectedH2HKey);
    } else {
      // fallback: baca seluruh bucket H2H dari eventDetails (mode offline)
      this.loadAllH2HBucketsFromEvent();
    }

    // === (lanjutan logic H2H lama kamu) ===
    const ok = this.participantArr && this.participantArr.length > 0;
    const n = Math.min(Math.max(this.participantArr.length || 8, 4), 32);
    this.rebuildBracketDynamic(n);
    this.syncWinLoseFromBracketToParticipants();

    this.roundResultsRootKey = getResultsRootKey();
    this.loadRoundResultsForCurrentRound();
    this.computeWinLoseByHeat();

    seedGlobalHeatFromList(this.visibleParticipants, { reset: false });
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

    toggleBracket() {
      this.showBracket = !this.showBracket;
    },

    getNextAvailableHeat() {
      const usage = readGlobalHeatUsage();
      // cari heat bernomor paling kecil yang usage < LIMIT
      for (let h = 1; ; h++) {
        if ((usage[h] || 0) < HEAT_GLOBAL_LIMIT) return h;
      }
    },
    // --- load semua bucket H2H dari eventDetails (offline/fallback) ---
    loadAllH2HBucketsFromEvent() {
      try {
        const raw = localStorage.getItem("eventDetails");
        const ev = raw ? JSON.parse(raw) : {};
        const participant = Array.isArray(ev.participant) ? ev.participant : [];

        // filter hanya eventName H2H
        const h2hBuckets = participant.filter(
          (b) => String(b.eventName || "").toUpperCase() === "HEAD2HEAD"
        );

        const map = Object.create(null);
        const opts = [];

        // (optional) agregat semua H2H
        const agg = {
          eventId: "",
          initialId: "",
          raceId: "",
          divisionId: "",
          eventName: "HEAD2HEAD",
          initialName: "ALL",
          raceName: "ALL",
          divisionName: "ALL",
          teams: [],
          _isAggregate: true,
        };

        h2hBuckets.forEach((b) => {
          const key = this._h2hBucketKey(b);
          const label = this._h2hBucketLabel(b);
          const normalizedTeams = Array.isArray(b.teams)
            ? b.teams.map(normalizeTeamForH2H)
            : [];

          map[key] = { ...b, teams: normalizedTeams };
          opts.push({ value: key, text: label });

          agg.teams.push(...normalizedTeams.map((t) => ({ ...t })));
        });

        // hapus duplikat pada agregat berdasarkan (nameTeam|bibTeam)
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
          const aggKey = "__ALL_H2H__";
          map[aggKey] = agg;
          opts.unshift({ value: aggKey, text: "All H2H Teams (aggregate)" });
        }

        this.h2hBucketMap = map;
        this.h2hBucketOptions = opts;

        // pilih default
        const savedKey = localStorage.getItem("currentH2HBucketKey");
        if (savedKey && map[savedKey]) {
          this._useH2HBucket(savedKey);
          this.selectedH2HKey = savedKey;
        } else if (opts.length) {
          this._useH2HBucket(opts[0].value);
          this.selectedH2HKey = opts[0].value;
        }
      } catch {
        /* noop */
      }
    },

    // --- apply bucket yang dipilih: set teams, judul, currentBucket, dll. ---
    _useH2HBucket(key) {
      const b = this.h2hBucketMap[key];
      if (!b) return;

      // set teams
      this.participant = (b.teams || []).map((t) => ({ ...t }));

      // title kategori
      this.titleCategories = b._isAggregate
        ? "ALL DIVISION/RACE – ALL INITIAL (HEAD2HEAD)"
        : this._h2hBucketLabel(b);

      // current bucket (untuk Save DB & kunci H2H round results)
      this.currentBucket = b._isAggregate
        ? null
        : {
            eventId: String(b.eventId || ""),
            initialId: String(b.initialId || ""),
            raceId: String(b.raceId || ""),
            divisionId: String(b.divisionId || ""),
            eventName: "HEAD2HEAD",
            initialName: String(b.initialName || "").toUpperCase(),
            raceName: String(b.raceName || "").toUpperCase(),
            divisionName: String(b.divisionName || "").toUpperCase(),
          };

      // simpan pilihan terakhir
      localStorage.setItem("currentH2HBucketKey", key);

      // update raceStartPayload.bucket agar konsisten antar halaman
      try {
        const raw = localStorage.getItem("raceStartPayload") || "{}";
        const obj = JSON.parse(raw || "{}") || {};
        obj.bucket =
          obj.bucket && typeof obj.bucket === "object" ? obj.bucket : {};
        const c = this.currentBucket || b;
        obj.bucket.eventId = String(c.eventId || "");
        obj.bucket.initialId = String(c.initialId || "");
        obj.bucket.raceId = String(c.raceId || "");
        obj.bucket.divisionId = String(c.divisionId || "");
        obj.bucket.eventName = String(c.eventName || "HEAD2HEAD");
        obj.bucket.initialName = String(c.initialName || "");
        obj.bucket.raceName = String(c.raceName || "");
        obj.bucket.divisionName = String(c.divisionName || "");
        // opsional: obj.bucket.teams = this.participant;
        localStorage.setItem("raceStartPayload", JSON.stringify(obj));
      } catch {
        /* noop */
      }

      // rebuild bracket berdasar jumlah tim yang baru
      const n = Math.min(Math.max(this.participantArr.length || 8, 4), 32);
      this.rebuildBracketDynamic(n);
      this.syncWinLoseFromBracketToParticipants();

      // reset hasil per-babak untuk root key baru
      this.roundResultsRootKey = getResultsRootKey();
      this.loadRoundResultsForCurrentRound();
      this.computeWinLoseByHeat();

      seedGlobalHeatFromList(this.visibleParticipants, { reset: false });
    },

    // --- handler perubahan select ---
    async onSelectH2HBucket(key) {
      await this.fetchH2HBucketTeamsByKey(key);
    },

    // --- fetch teams via IPC (mirip DRR: fetchBucketTeamsByKey) ---
    async fetchH2HBucketTeamsByKey(key) {
      try {
        if (
          !key ||
          !this.h2hBucketMap[key] ||
          typeof ipcRenderer === "undefined"
        )
          return;

        const b = this.h2hBucketMap[key];
        const filters = {
          eventId: String(b.eventId),
          initialId: String(b.initialId),
          raceId: String(b.raceId),
          divisionId: String(b.divisionId),
        };

        console.log(filters, "<<< cek");

        this.selectedH2HKey = key;
        localStorage.setItem("currentH2HBucketKey", key);

        const res = await new Promise((resolve) => {
          ipcRenderer.once("teams-h2h-registered:find-reply", (_e, payload) =>
            resolve(payload)
          );
          ipcRenderer.send("teams-h2h-registered:find", filters);
        });

        if (!res || !res.ok) {
          // kosongkan participant tapi tetap apply bucket untuk judul & payload
          this.participant = [];
          this._useH2HBucket(key);
          return;
        }
        console.log(res.items);
        const doc = Array.isArray(res.items) ? res.items[0] : res.items;
        const teams =
          doc && Array.isArray(doc.teams)
            ? doc.teams.map(normalizeTeamForH2H)
            : [];

        // commit teams ke map → agar _useH2HBucket punya data
        this.h2hBucketMap[key] = {
          ...b,
          teams,
        };

        // apply bucket
        this._useH2HBucket(key);
      } catch {
        // fallback minimal
        this._useH2HBucket(key);
      }
    },
    _h2hBucketKey(b) {
      const ei = b && b.eventId ? String(b.eventId) : "";
      const ii = b && b.initialId ? String(b.initialId) : "";
      const ri = b && b.raceId ? String(b.raceId) : "";
      const di = b && b.divisionId ? String(b.divisionId) : "";
      return [ei, ii, ri, di].join("|");
    },
    _h2hBucketLabel(b) {
      const div = (
        b && b.divisionName ? String(b.divisionName) : ""
      ).toUpperCase();
      const rac = (b && b.raceName ? String(b.raceName) : "").toUpperCase();
      const ini = (
        b && b.initialName ? String(b.initialName) : ""
      ).toUpperCase();
      return `${div} ${rac} – ${ini}`;
    },

    // --- build opsi statik dari catalog event (fallback) ---
    buildStaticH2HOptions() {
      const eventId = this.currentEventId || "";
      if (!eventId) {
        this.h2hBucketOptions = [];
        this.h2hBucketMap = {};
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
              eventName: "HEAD2HEAD",
              initialName: String(init.name),
              raceName: String(race.name),
              divisionName: String(div.name),
              teams: [],
            };
          });
        });
      });

      this.h2hBucketOptions = opts;
      this.h2hBucketMap = map;
    },
    stableRowKey(item) {
      const t = item || {};
      const name = String(t.nameTeam || t.teamName || "").toUpperCase();
      const bib = String(t.bibTeam || "");
      return name + "|" + bib;
    },
    markFlag(item, type) {
      if (!item || !item.result) return;
      // set flag (hanya salah satu dari DNF/DNS/DSQ)
      this.$set(item.result, "flag", type);

      // kosongkan waktu & total (biar tidak dihitung menang/kalah)
      item.result.startTime = "";
      item.result.finishTime = "";
      item.result.raceTime = "";
      item.result.totalTime = "";
      item.result.winLose = null;

      // nolkan penalti (biar jelas)
      this.ensurePenaltiesObject(item.result);
      const p = item.result.penalties || {};
      this.$set(p, "s", 0);
      this.$set(p, "cl", 0);
      this.$set(p, "r1", "N");
      this.$set(p, "r2", "N");
      this.$set(p, "l1", "N");
      this.$set(p, "l2", "N");
      this.$set(p, "pb", 0);
      this.$set(p, "f", 0);
      this.$set(p, "o", 0);
      item.result.penalty = 0;
      item.result.penaltyTime = "00:00:00.000";

      // simpan & recompute agar pairing heat/win-lose bersih
      this.persistRoundResults();
      this.computeWinLoseByHeat();
      this.evaluateHeatWinnersForCurrentRound();
      this.assignRanks(this.visibleParticipants);
    },

    resetRow(item) {
      if (!item) return;
      // hapus flag dan reset result bersih
      this.$set(item.result || (item.result = {}), "flag", null);
      const fresh = this.makeEmptyResult();
      // pertahankan HEAT yang sudah dipilih
      fresh.heat = item.result.heat != null ? item.result.heat : null;
      item.result = { ...fresh };

      this.persistRoundResults();
      this.computeWinLoseByHeat();
      this.evaluateHeatWinnersForCurrentRound();
      this.assignRanks(this.visibleParticipants);
    },
    pushWinnerToNext(roundIndex, matchIndex, winner) {
      const round = this.rounds[roundIndex];
      if (!round || round.bronze) return;

      // cari ronde kompetitif berikutnya
      let nextRoundIndex = -1;
      for (let i = roundIndex + 1; i < this.rounds.length; i++) {
        if (!this.rounds[i].bronze) {
          nextRoundIndex = i;
          break;
        }
      }
      if (nextRoundIndex === -1) return;

      const next = this.rounds[nextRoundIndex];
      const slot = Math.floor(matchIndex / 2);
      const pos = matchIndex % 2 === 0 ? "team1" : "team2";
      if (next && next.matches[slot]) {
        next.matches[slot][pos] =
          winner && winner.name ? winner : { id: null, seed: null, name: "" };
      }
    },

    pullWinnerFromNext(roundIndex, matchIndex, prevWinner) {
      const round = this.rounds[roundIndex];
      if (!round || round.bronze) return;

      let nextRoundIndex = -1;
      for (let i = roundIndex + 1; i < this.rounds.length; i++) {
        if (!this.rounds[i].bronze) {
          nextRoundIndex = i;
          break;
        }
      }
      if (nextRoundIndex === -1) return;

      const next = this.rounds[nextRoundIndex];
      const slot = Math.floor(matchIndex / 2);
      const pos = matchIndex % 2 === 0 ? "team1" : "team2";
      const cell = next && next.matches[slot] && next.matches[slot][pos];

      // hanya kosongkan jika sama dengan prevWinner (hindari menghapus isian manual)
      if (cell && prevWinner && cell.name === prevWinner.name) {
        next.matches[slot][pos] = { id: null, seed: null, name: "" };
      }
    },
    toggleBye(roundIndex, matchIndex) {
      const round = this.rounds[roundIndex];
      if (!round) return;
      const match = round.matches[matchIndex];
      if (!match) return;

      // flip status
      match.bye = !match.bye;

      // kalau set BYE: tentukan pemenang (tim yang ada)
      if (match.bye) {
        const has1 = match.team1 && match.team1.name;
        const has2 = match.team2 && match.team2.name;
        if (has1 && !has2) {
          match.winner = match.team1;
        } else if (!has1 && has2) {
          match.winner = match.team2;
        } else if (!has1 && !has2) {
          // tidak ada tim, BYE tidak bermakna → batal
          match.bye = false;
          this.$bvToast &&
            this.$bvToast.toast("Tidak ada tim di match ini.", {
              variant: "warning",
              autoHideDelay: 2000,
              title: "BYE dibatalkan",
            });
          return;
        } else {
          // dua-duanya ada → tetap boleh BYE kalau kamu memang mau auto-lolos salah satu
          // default pemenang = team1 (atau bisa munculkan modal pilih)
          match.winner = match.team1;
        }
        // dorong ke ronde kompetitif berikutnya
        this.pushWinnerToNext(roundIndex, matchIndex, match.winner);
      } else {
        // un-BYE → hapus winner & cabut dari ronde berikutnya
        const prevWin = match.winner;
        match.winner = null;
        this.pullWinnerFromNext(roundIndex, matchIndex, prevWin);
      }

      this.syncWinLoseFromBracketToParticipants();
      this.persistRoundResults();
      this.computePodium();
    },
    // FUNCTION OTHERS PENALTY
    getOthersValue(item) {
      if (!item || !item.result) return "0";
      if (!item.result.penalties || typeof item.result.penalties !== "object") {
        return "0";
      }
      var v = item.result.penalties.o;
      if (typeof v === "undefined" || v === null) return "0";
      return String(v);
    },

    digitsOnly(e) {
      var k = e.key || "";
      if (!/^\d$/.test(k)) {
        e.preventDefault();
      }
    },

    digitsPaste(e) {
      var clip = e.clipboardData || window.clipboardData;
      var text = clip ? clip.getData("text") || "" : "";
      if (!/^\d+$/.test(text)) {
        e.preventDefault();
      }
    },

    onOthersTyping(val, item) {
      if (!item || !item.result) return;
      this.ensurePenaltiesObject(item.result);

      var s = String(val || "");
      var cleaned = s.replace(/\D+/g, "");
      var num = cleaned === "" ? 0 : Number(cleaned);

      this.$set(item.result.penalties, "o", num);
    },

    onOthersCommit(item) {
      // hitung ulang total penalti, time, win/lose, simpan, dll.
      this.onPenaltyChange(item);
    },

    // ADD: helper untuk reset result di round tertentu
    resetResultsForRound(roundObj) {
      const list = this.participantsForRound(roundObj);
      list.forEach((p) => {
        // kosongkan hasil round ini
        p.result = this.makeEmptyResult();
        // pastikan penalties lengkap & reactive
        this.ensurePenaltiesObject(p.result);
      });
    },

    /** Dapatkan daftar peserta utk sebuah round TANPA mengganti currentRoundIndex */
    participantsForRound(roundObj) {
      if (!roundObj) return [];
      const want = new Set();
      (roundObj.matches || []).forEach((m) => {
        if (m.team1 && m.team1.name) want.add(m.team1.name.toUpperCase());
        if (m.team2 && m.team2.name) want.add(m.team2.name.toUpperCase());
      });
      // map dari participantArr yg namanya ada di round ini
      const list = (this.participantArr || []).filter((p) =>
        want.has(String(p.nameTeam || p.teamName || "").toUpperCase())
      );
      // placeholder utk tim yang belum ada di participant (kalau ada)
      if (want.size && list.length < want.size) {
        const existing = new Set(
          list.map((p) => String(p.nameTeam || p.teamName || "").toUpperCase())
        );
        want.forEach((up) => {
          if (!existing.has(up))
            list.push(this.normalizeTeamForViewPlaceholder(up));
        });
      }
      return list;
    },

    /** Simpan hasil utk round tertentu (bukan hanya currentRound) */
    persistRoundResultsFor(roundObj) {
      if (!this.roundResultsRootKey || !roundObj) return;
      const roundKey = String(roundObj.id);
      const subset = this.participantsForRound(roundObj);
      const pack = subset.map((p) => ({
        nameTeam: String(p.nameTeam || p.teamName || ""),
        bibTeam: String(p.bibTeam || ""),
        result: { ...(p.result || {}) },
      }));
      const all = readAllRoundResults(this.roundResultsRootKey) || {};
      all[roundKey] = pack;
      writeAllRoundResults(this.roundResultsRootKey, all);
    },

    /** Simpan hasil utk SEMUA babak (Round of 32→Final + Bronze) */
    saveAllRoundsLocal() {
      (this.rounds || []).forEach((r) => this.persistRoundResultsFor(r));
      this.$bvToast &&
        this.$bvToast.toast("Semua hasil per-babak tersimpan lokal.", {
          variant: "success",
          autoHideDelay: 2000,
          title: "Saved",
        });
    },

    /** (Opsional) Ekspor semua hasil per-round (JSON) utk arsip/backup */
    exportAllRoundsJSON() {
      if (!this.roundResultsRootKey) return;
      const payload = {
        bucket: getBucket(),
        savedAt: new Date().toISOString(),
        rounds: Object.entries(this.storedResultsByRound).map(([rid, v]) => ({
          roundId: rid,
          roundName: v.roundName,
          items: v.items,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `h2h-results-${payload.bucket.eventId || "event"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    // Tambahkan di methods:
    computeWinLoseByHeat() {
      // kelompokkan visibleParticipants berdasarkan nomor heat (yang valid)
      const groups = new Map();
      (this.visibleParticipants || []).forEach((p) => {
        const h =
          p && p.result && p.result.heat != null ? Number(p.result.heat) : null;
        if (!h || !isFinite(h)) return; // abaikan yang belum pilih heat
        if (!groups.has(h)) groups.set(h, []);
        groups.get(h).push(p);
      });

      // reset default (biar yang tidak berpasangan tidak menampilkan sisa status lama)
      (this.visibleParticipants || []).forEach((p) => {
        if (!p || !p.result) return;
        p.result.winLose = null;
      });

      // bandingkan per grup heat
      groups.forEach((arr) => {
        if (!Array.isArray(arr) || arr.length < 2) {
          // belum lengkap pasangannya → biarkan null
          return;
        }
        // jika lebih dari 2 (kasus input ganda), ambil 2 pertama saja
        const [A, B] = arr;

        const tA = this.parsesTime(
          (A.result && (A.result.totalTime || A.result.raceTime)) || ""
        );
        const tB = this.parsesTime(
          (B.result && (B.result.totalTime || B.result.raceTime)) || ""
        );

        if (!isFinite(tA) || !isFinite(tB)) {
          // waktu belum lengkap → biarkan null
          return;
        }

        if (tA < tB) {
          A.result.winLose = "Win";
          B.result.winLose = "Lose";
        } else if (tB < tA) {
          A.result.winLose = "Lose";
          B.result.winLose = "Win";
        } else {
          // seri → kosongkan (atau ganti "Draw" kalau mau)
          A.result.winLose = null;
          B.result.winLose = null;
        }
      });
    },
    getGlobalHeatUsageCount() {
      return readGlobalHeatUsage();
    },

    // opsi heat per baris (sembunyikan yang sudah 2x dipakai global,
    // tapi pertahankan nilai milik baris itu sendiri agar tetap terlihat)
    heatOptionsForItem(item) {
      const keep =
        item && item.result && item.result.heat != null
          ? Number(item.result.heat)
          : null;

      const usage = this.getGlobalHeatUsageCount();

      const allowed = this.allHeatChoices.filter((h) => {
        const used = usage[h] || 0;
        return used < HEAT_GLOBAL_LIMIT || keep === h;
      });

      return allowed.map((v) => ({ value: v, text: "Heat " + v }));
    },

    onHeatChanged(item, newVal) {
      if (!item || !item.result) return;

      const prev = Number.isFinite(item.__prevHeat)
        ? item.__prevHeat
        : Number(item.result.heat) || null;

      let val = newVal === "" || newVal == null ? null : Number(newVal);
      if (val != null && (!Number.isFinite(val) || val <= 0)) val = null;

      // kalau tidak berubah, cukup persist & evaluasi
      if (prev !== null && val === prev) {
        this.persistRoundResults();
        this.computeWinLoseByHeat();
        this.evaluateHeatWinnersForCurrentRound();
        return;
      }

      // cek limit global (kecuali kalau mempertahankan heat lama)
      if (val !== null) {
        const usage = readGlobalHeatUsage();
        const used = usage[val] || 0;
        if (used >= HEAT_GLOBAL_LIMIT && val !== prev) {
          // revert ke sebelumnya
          this.$set(item.result, "heat", prev);
          item.__prevHeat = prev;
          this.$bvToast &&
            this.$bvToast.toast(
              `Heat ${val} sudah terpakai ${HEAT_GLOBAL_LIMIT}× secara global.`,
              {
                variant: "warning",
                autoHideDelay: 2500,
                title: "Limit heat tercapai",
              }
            );
          return;
        }
      }

      // release heat lama
      if (prev != null) bumpGlobalHeat(prev, -1);
      // set nilai baru & reserve
      this.$set(item.result, "heat", val);
      item.__prevHeat = val;
      if (val != null) bumpGlobalHeat(val, +1);

      // simpan & hitung ulang
      this.persistRoundResults();
      this.computeWinLoseByHeat();
      this.evaluateHeatWinnersForCurrentRound();
      this.assignRanks(this.visibleParticipants);
      this.$nextTick &&
        this.$nextTick(() => this.$forceUpdate && this.$forceUpdate());
    },
    makeEmptyResult() {
      return {
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
        heat: null,
      };
    },
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
      const keys = ["s", "cl", "r1", "r2", "l1", "l2", "pb", "f", "o"];
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
        this.$set(result, "penalties", {
          s: 0,
          cl: 0,
          r1: "N",
          r2: "N",
          l1: "N",
          l2: "N",
          pb: 0,
          f: 0,
          o: 0,
        });
      } else {
        if (typeof result.penalties.r1 === "undefined")
          this.$set(result.penalties, "r1", "N");
        if (typeof result.penalties.r2 === "undefined")
          this.$set(result.penalties, "r2", "N");
        if (typeof result.penalties.l1 === "undefined")
          this.$set(result.penalties, "l1", "N");
        if (typeof result.penalties.l2 === "undefined")
          this.$set(result.penalties, "l2", "N");
        if (typeof result.penalties.pb === "undefined")
          this.$set(result.penalties, "pb", 0);
        if (typeof result.penalties.o === "undefined")
          this.$set(result.penalties, "o", 0);
      }
    },

    async onPenaltyChange(item) {
      if (!item || !item.result) return;
      this.ensurePenaltiesObject(item.result);

      const p = item.result.penalties;

      // --- rule Y/N ---
      const r1 = p.r1 === "Y";
      const r2 = p.r2 === "Y";
      const l1 = p.l1 === "Y";
      const l2 = p.l2 === "Y";

      // jika semua N → PB = 100
      if (!r1 && !r2 && !l1 && !l2) {
        this.$set(p, "pb", 100);
      } else {
        const comboValid = (r1 && l1) || (r1 && l2) || (r2 && l1) || (r2 && l2);
        // PB menampilkan hasil rule: 0 jika valid, 50 jika tidak
        this.$set(p, "pb", comboValid ? 0 : 50);
      }

      // --- total penalti (detik) ---
      const totalPenaltySeconds =
        (Number(p.s) || 0) +
        (Number(p.cl) || 0) +
        (Number(p.pb) || 0) +
        (Number(p.f) || 0) +
        (Number(p.o) || 0);

      item.result.penalty = totalPenaltySeconds;
      item.result.penaltyTime = this.secondsToTimeString(totalPenaltySeconds);

      if (item.result.raceTime) {
        item.result.totalTime = await this.tambahWaktu(
          item.result.raceTime,
          item.result.penaltyTime
        );
      }

      this.evaluateHeatWinnersForCurrentRound();
      await this.assignRanks(this.visibleParticipants);
      this.syncWinLoseFromBracketToParticipants();
      this.persistRoundResults();
      this.computeWinLoseByHeat();
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
        const keys = ["s", "cl", "r1", "r2", "l1", "l2", "pb", "f", "o"];
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

    // CHANGE: muat hasil tersimpan utk babak aktif
    loadRoundResultsForCurrentRound() {
      if (!this.roundResultsRootKey) return;

      const r = this.currentRound;
      if (!r) return;

      // ⬇️ Reset dulu hasil untuk round ini
      this.resetResultsForRound(r);

      const roundKey = String(r.id);
      const all = readAllRoundResults(this.roundResultsRootKey);
      const arr = Array.isArray(all[roundKey]) ? all[roundKey] : [];

      if (arr.length) {
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
            const tgt = this.participant[idx];
            // merge hasil dari storage ke result yang baru di-reset
            tgt.result = { ...tgt.result, ...(row.result || {}) };
            this.ensurePenaltiesObject(tgt.result);
          }
        });
      }

      // hitung ulang konsekuensi untuk round ini
      this.assignRanks(this.visibleParticipants);
      this.evaluateHeatWinnersForCurrentRound();
      this.syncWinLoseFromBracketToParticipants();
      this.computeWinLoseByHeat();

      seedGlobalHeatFromList(this.visibleParticipants, { reset: false });
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
          heat: null,
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
          heat: null,
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
      this.persistRoundResults();
      if (this.currentRoundIndex > 0) this.currentRoundIndex--;
    },
    nextRound() {
      // simpan hasil round aktif dulu
      this.persistRoundResults();
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
      if (size === 2) return "Final A";
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
      // Tambah Final B bila size awal >= 4
      if (this.showBronze && base >= 4) {
        rounds.splice(rounds.length - 1, 0, {
          // sisipkan sebelum Final
          id: "R_B",
          name: "Final B",
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
      });
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
        match.winner = null;
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
      match.winner = null; // reset winner ketika ada perubahan pasangan
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
        m.bye = false;
      });
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

      this.computeWinLoseByHeat();
    },

    getScoreByRanked(ranked) {
      const m = this.dataScore.find((d) => d.ranking === ranked);
      return m ? m.score : null;
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
    // ...existing
    saveAllRoundsToDB() {
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

      const docs = [];
      (this.rounds || []).forEach((r) => {
        // ambil hasil tersimpan; kalau belum ada, bangun dari memory saat ini
        const roundKey = String(r.id);
        const all = readAllRoundResults(this.roundResultsRootKey) || {};
        const arr = Array.isArray(all[roundKey])
          ? all[roundKey]
          : this.participantsForRound(r).map((t) => ({
              nameTeam: t.nameTeam,
              bibTeam: t.bibTeam,
              result: t.result,
            }));

        arr.forEach((row) => {
          const base = buildResultDocs([row], bucket)[0];
          base.result = {
            ...(base.result || {}),
            _roundId: roundKey,
            _roundName: r.bronze ? "Final B" : r.name,
          };
          docs.push(base);
        });
      });

      if (!docs.length) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail: "Belum ada data yang bisa disimpan.",
          message: "Ups Sorry",
        });
        return;
      }

      ipcRenderer.send("insert-h2h-result", docs);
      ipcRenderer.once("insert-h2h-result-reply", (_e, res) => {
        if (res && res.ok) {
          ipcRenderer.send("get-alert-saved", {
            type: "question",
            detail: "Semua hasil per-babak berhasil disimpan.",
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
      localStorage.removeItem("h2hRoundResults");

      this.participant = [];
      this.titleCategories = "";
      this.clearAllRoundResults(); // NEW
      this.$router.push(`/event-detail/${this.$route.params.id}`);
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

.bracket-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 5; /* tetap terlihat saat scroll */
}
.toolbar-title {
  font-weight: 800;
  letter-spacing: 0.2px;
}
/* Bar aksi kanan: select + tombol sejajar rapi */
.toolbar-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap; /* biar responsif */
}

/* Select block */
.toolbar-select {
  min-width: 260px;
  flex: 1 1 260px; /* bisa melebar di layar kecil */
}
.toolbar-select__control {
  border-radius: 10px;
}

/* Kelompok tombol (bukan .btn-group bootstrap agar tidak “paksa” tombol-only) */
.btn-group-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Sedikit konsistensi ukuran tombol custom */
.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 10px;
  line-height: 1.2;
}
.toolbar-divider {
  width: 1px;
  height: 28px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 6px;
}
.round-nav {
  display: flex;
  align-items: center;
}
.round-select {
  min-width: 200px;
}
.bracket-toolbar .btn {
  border-radius: 10px;
}
.bracket-toolbar .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.15s ease;
}

/* Responsif: tumpuk di layar kecil */
@media (max-width: 768px) {
  .bracket-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .toolbar-actions {
    width: 100%;
    gap: 8px;
  }
  .round-nav {
    width: 100%;
    justify-content: space-between;
  }
  .round-select {
    flex: 1;
    min-width: 0;
  }
}

/* Kolom Others: lebih kecil & rapat */
.pen-o-cell {
  width: 64px;
  min-width: 64px;
  padding-right: 6px; /* biar gak nempel */
}

/* BootstrapVue render: input.form-control */
.pen-o-input.form-control,
.pen-o-input.form-control.form-control-sm {
  max-width: 60px;
  height: 26px;
  padding: 2px 6px;
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
  border-radius: 6px;
}

.badge-pill {
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 700;
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

.bracket-hidden-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  margin: 16px 0;
  border: 2px dashed #d1d5db; /* abu-abu */
  border-radius: 12px;
  background: #f9fafb; /* abu terang */
  color: #374151;      /* teks abu gelap */
  text-align: center;
}

.bracket-hidden-info .info-icon {
  font-size: 28px;
  color: #6b7280; /* abu-abu */
}
</style>
