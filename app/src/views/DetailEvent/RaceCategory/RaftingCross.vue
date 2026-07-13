<template>
  <div>
    <div class="card-wrapper p-3 mb-2 mt-5 mx-5">
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
          <b-breadcrumb-item active>Rafting Cross</b-breadcrumb-item>
        </b-breadcrumb>
        <div>{{ currentDateTime }}</div>
      </div>
    </div>

    <section class="detail-hero">
      <div class="hero-bg"></div>
      <b-container class="hero-inner">
        <b-row class="align-items-center">
          <b-col cols="auto" class="pr-0">
            <div
              class="hero-logo d-flex align-items-center justify-content-center"
            >
              <img
                :src="hasEventLogo ? eventLogoUrl : defaultImg"
                alt="Event Logo"
                class="event-logo-img"
              />
            </div>
          </b-col>
          <b-col>
            <h2 class="h1 font-weight-bold mb-1 text-white">
              {{ dataEventSafe.eventName || "NO DATA" }}
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
                  <span class="badge-chip badge-chip--blue">Rafting Cross</span>
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
                <b-form-group
                  label="Switch RX Category:"
                  label-for="rxBucketSelect"
                  class="mb-0 sprint-actionbar__select"
                >
                  <b-form-select
                    id="rxBucketSelect"
                    :options="rxBucketOptions"
                    v-model="selectedRxKey"
                    @change="onSelectRxBucket"
                  />
                </b-form-group>
              </div>
              <div class="meta-row">
                <span class="meta-label">Heat Setting</span>
                <span class="meta-value">
                  {{ settings.teamsPerHeat }} teams / heat,
                  top {{ settings.qualifiersPerHeat }} qualify
                </span>
              </div>
            </div>
          </b-col>
          <b-col cols="auto" class="text-right">
            <button
              type="button"
              class="btn-action btn-secondary mr-2"
              :disabled="!participantArr.length"
              @click="buildBracket"
            >
              <Icon icon="mdi:sitemap" class="mr-1" />
              {{ rounds.length ? "Rebuild Bracket" : "Build Bracket" }}
            </button>
            <button
              type="button"
              class="btn-action btn-secondary"
              :disabled="!rounds.length"
              @click="saveBracket"
            >
              <Icon icon="icon-park-outline:save" class="mr-1" />
              Save Bracket
            </button>
          </b-col>
        </b-row>

        <b-row class="mt-3">
          <b-col>
            <div
              class="d-flex flex-wrap justify-content-end align-items-center controls-bar"
            >
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

              <div class="w-100"></div>

              <div class="mb-1">
                <span
                  class="path-pill"
                  :class="{ 'path-pill--empty': !selectPath }"
                  :title="selectPath || 'No device selected'"
                >
                  <Icon icon="mdi:usb-port" width="16" height="16" class="mr-1" />
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

    <OperationTimePanel
      v-if="roundParticipants && roundParticipants.length"
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="roundParticipants"
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />

    <div class="px-5 mt-3" v-if="isLoading">
      <div class="d-flex align-items-center justify-content-center py-5">
        <b-spinner label="Loading" class="mb-2"></b-spinner>
        <div class="text-muted ml-2">Loading bracket &amp; teams…</div>
      </div>
    </div>

    <div class="px-5 mt-3" v-else-if="!participantArr.length">
      <EmptyCard />
    </div>

    <div class="px-5 mt-3" v-else-if="!rounds.length">
      <div class="rx-heat-card text-center py-5">
        <Icon icon="mdi:sitemap" width="40" height="40" class="mb-2 text-muted" />
        <div class="h5 font-weight-bold mb-1">Bracket belum dibuat</div>
        <div class="text-muted mb-3">
          {{ participantArr.length }} tim sudah terdaftar untuk kategori ini.
          Klik "Build Bracket" untuk membuat heat pertama.
        </div>
        <button type="button" class="btn-action btn-secondary" @click="buildBracket">
          <Icon icon="mdi:sitemap" class="mr-1" />
          Build Bracket
        </button>
      </div>
    </div>

    <div class="px-5 mt-3" v-else>
      <!-- ROUND NAV -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <button
          type="button"
          class="btn-action btn-secondary"
          :disabled="currentRoundIndex <= 0"
          @click="currentRoundIndex--"
        >
          <Icon icon="mdi:chevron-left" /> Prev
        </button>

        <b-form-select
          :options="roundOptions"
          v-model="currentRoundIndex"
          style="max-width: 320px"
        />

        <button
          type="button"
          class="btn-action btn-secondary"
          :disabled="currentRoundIndex >= rounds.length - 1"
          @click="currentRoundIndex++"
        >
          Next <Icon icon="mdi:chevron-right" />
        </button>
      </div>

      <!-- HEATS -->
      <div
        class="rx-heat-card mb-3"
        v-for="heat in currentRound.heats"
        :key="heat.id"
      >
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h5 class="mb-0 font-weight-bold">
            {{ currentRound.name }} — Heat {{ heat.id }}
            <span v-if="heat.bye" class="badge badge-warning ml-2">BYE</span>
          </h5>
          <div>
            <button
              type="button"
              class="btn-action btn-info mr-2"
              @click="rankHeat(heat)"
            >
              <Icon icon="icon-park-outline:ranking" /> Rank Heat
            </button>
            <button
              type="button"
              class="btn-action btn-secondary"
              @click="saveHeat(heat)"
            >
              <Icon icon="icon-park-outline:save" /> Save Heat
            </button>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th class="text-center">Seed</th>
              <th class="text-left">Team Name</th>
              <th class="text-center">BIB</th>
              <th class="text-center">Start Time</th>
              <th class="text-center">Finish Time</th>
              <th class="text-center">Race Time</th>
              <th class="text-center" v-if="settings.gate1.enabled">
                Gate 1 Penalty
              </th>
              <th class="text-center" v-if="settings.gate2.enabled">
                Gate 2 Penalty
              </th>
              <th class="text-center">Penalty Time</th>
              <th class="text-center">Total Time</th>
              <th class="text-center">Position</th>
              <th class="text-center">Qualified</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(team, idx) in heat.teams"
              :key="team.id || 'slot-' + idx"
            >
              <td class="text-center">{{ team.seed || "-" }}</td>
              <td class="text-left large-bold">{{ team.name || "-" }}</td>
              <td class="text-center">{{ team.bibTeam || "-" }}</td>
              <td class="text-center text-monospace">
                {{ heat.results[idx].startTime || "-" }}
              </td>
              <td class="text-center text-monospace">
                {{ heat.results[idx].finishTime || "-" }}
              </td>
              <td class="text-center">
                <b-form-input
                  v-if="team.id"
                  size="sm"
                  placeholder="00:00:00.000"
                  v-model="heat.results[idx].raceTime"
                  @change="recalcTeamResult(heat, idx)"
                  style="max-width: 150px; margin: 0 auto"
                />
              </td>
              <td class="text-center" v-if="settings.gate1.enabled">
                <b-form-select
                  v-if="team.id"
                  size="sm"
                  v-model.number="heat.results[idx].penalties.gate1"
                  @change="recalcTeamResult(heat, idx)"
                  style="max-width: 130px; margin: 0 auto"
                >
                  <option :value="null">-</option>
                  <option
                    v-for="p in dataPenalties"
                    :key="'g1-' + p.value"
                    :value="p.value"
                  >
                    {{ p.label }}
                  </option>
                </b-form-select>
              </td>
              <td class="text-center" v-if="settings.gate2.enabled">
                <b-form-select
                  v-if="team.id"
                  size="sm"
                  v-model.number="heat.results[idx].penalties.gate2"
                  @change="recalcTeamResult(heat, idx)"
                  style="max-width: 130px; margin: 0 auto"
                >
                  <option :value="null">-</option>
                  <option
                    v-for="p in dataPenalties"
                    :key="'g2-' + p.value"
                    :value="p.value"
                  >
                    {{ p.label }}
                  </option>
                </b-form-select>
              </td>
              <td class="text-center text-monospace">
                {{ heat.results[idx].penaltyTime }}
              </td>
              <td class="text-center large-bold text-monospace">
                {{ heat.results[idx].totalTime }}
              </td>
              <td class="text-center large-bold">
                {{ heat.results[idx].finishPosition || "-" }}
              </td>
              <td class="text-center">
                <span
                  v-if="heat.results[idx].qualified === true"
                  class="badge badge-success"
                  >Qualified</span
                >
                <span
                  v-else-if="heat.results[idx].qualified === false"
                  class="badge badge-secondary"
                  >Eliminated</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-end mb-5">
        <button
          v-if="currentRoundIndex < rounds.length - 1"
          type="button"
          class="btn-action btn-success"
          :disabled="!isCurrentRoundFullyRanked"
          @click="advanceRound"
        >
          <Icon icon="mdi:arrow-right-bold" class="mr-1" />
          Advance to Next Round
        </button>
        <button
          v-else
          type="button"
          class="btn-action btn-success"
          :disabled="!isFinalStageReady"
          @click="finalizeOverall"
        >
          <Icon icon="mdi:trophy" class="mr-1" />
          Finalize &amp; Save Overall
        </button>
      </div>

      <!-- PODIUM -->
      <div class="rx-podium mb-5" v-if="podium.gold || podium.silver">
        <h4 class="font-weight-bold mb-3">Podium</h4>
        <b-row>
          <b-col md="3" v-for="slot in podiumSlots" :key="slot.key">
            <div class="rx-podium-card">
              <div class="rx-podium-place">{{ slot.label }}</div>
              <div class="rx-podium-name">
                {{ podium[slot.key] ? podium[slot.key].name : "-" }}
              </div>
              <div class="rx-podium-bib" v-if="podium[slot.key]">
                BIB {{ podium[slot.key].bibTeam }}
              </div>
            </div>
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import EmptyCard from "@/components/cards/card-empty.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import { logger } from "@/utils/logger";
import { createSerialReader, listPorts } from "@/utils/serialConnection.js";
import OperationTimePanel from "@/components/race/OperationTeamPanel.vue";

const RACE_PAYLOAD_KEY = "raceStartPayload";
const PREFERRED_PATH = "/dev/tty.usbserial-120";

export default {
  name: "SustainableTimingSystemRaftingCrossRace",
  components: { Icon, EmptyCard, OperationTimePanel },
  data() {
    return {
      isLoading: false,
      defaultImg,
      dataEvent: {},
      titleCategories: "",

      rxBucketOptions: [],
      rxBucketMap: Object.create(null),
      selectedRxKey: "",

      registeredTeams: [],
      settings: {
        teamsPerHeat: 4,
        qualifiersPerHeat: 2,
        gate1: { enabled: true },
        gate2: { enabled: true },
      },
      dataPenalties: [],
      dataScore: [],

      // ===== Serial timing device =====
      selectPath: "",
      baudRate: 9600,
      baudOptions: [1200, 2400, 9600],
      serialCtrl: null,
      port: null,
      isPortConnected: false,
      digitId: [],
      digitTime: [],
      digitTimeStart: null,
      digitTimeFinish: null,
      currentPort: "",

      rounds: [],
      currentRoundIndex: -1,

      podium: { gold: null, silver: null, bronze: null, fourth: null },

      podiumSlots: [
        { key: "gold", label: "1st" },
        { key: "silver", label: "2nd" },
        { key: "bronze", label: "3rd" },
        { key: "fourth", label: "4th" },
      ],
    };
  },

  computed: {
    currentEventId() {
      let fromEvent = "";
      if (this.dataEventSafe && (this.dataEventSafe._id || this.dataEventSafe.id)) {
        fromEvent = String(this.dataEventSafe._id || this.dataEventSafe.id);
      }
      let fromRoute = "";
      if (this.$route && this.$route.params && this.$route.params.id) {
        fromRoute = String(this.$route.params.id);
      }
      return fromEvent || fromRoute || "";
    },
    dataEventSafe() {
      return this.dataEvent && typeof this.dataEvent === "object"
        ? this.dataEvent
        : {};
    },
    hasEventLogo() {
      var logos = this.dataEventSafe.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        var first = logos[0];
        if (typeof first === "string" && first) return true;
        if (first && typeof first === "object" && first.url) return true;
      }
      return false;
    },
    eventLogoUrl() {
      var logos = this.dataEventSafe.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        var first = logos[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object") return first.url || "";
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
    participantArr() {
      return Array.isArray(this.registeredTeams) ? this.registeredTeams : [];
    },
    currentRound() {
      return this.rounds[this.currentRoundIndex] || { heats: [], name: "" };
    },
    roundOptions() {
      return this.rounds.map((r, i) => ({ value: i, text: r.name }));
    },
    // seluruh tim di semua heat pada round aktif, untuk panel timing serial
    // (pola sama seperti visibleParticipants di HeadToHead.vue)
    roundParticipants() {
      const out = [];
      const heats = (this.currentRound && this.currentRound.heats) || [];
      heats.forEach((heat) => {
        heat.teams.forEach((team, idx) => {
          if (!team.id) return;
          out.push({
            ...team,
            result: heat.results[idx],
            _heatId: heat.id,
            _slotIdx: idx,
          });
        });
      });
      return out;
    },
    isCurrentRoundFullyRanked() {
      const r = this.currentRound;
      if (!r || !r.heats || !r.heats.length) return false;
      return r.heats.every((h) =>
        h.results.every((res) => res.qualified !== null || !res.teamId)
      );
    },
    isFinalStageReady() {
      const finalRound = this.rounds.find((r) => r.final);
      const bronzeRound = this.rounds.find((r) => r.bronze);
      const finalOk =
        finalRound &&
        finalRound.heats[0] &&
        finalRound.heats[0].results.every(
          (r) => !r.teamId || r.finishPosition
        );
      const bronzeOk =
        !bronzeRound ||
        !bronzeRound.heats[0] ||
        bronzeRound.heats[0].results.every(
          (r) => !r.teamId || r.finishPosition
        );
      return !!(finalOk && bronzeOk);
    },
  },

  async mounted() {
    try {
      const events = localStorage.getItem("eventDetails");
      this.dataEvent = events ? JSON.parse(events) : {};
    } catch {
      this.dataEvent = {};
    }

    await this.loadDataScore("RX");
    await this.loadDataPenalties("RX");
    await this.loadRaceSettings();

    this.buildStaticRxOptions();
    if (this.rxBucketOptions.length) {
      const savedKey = localStorage.getItem("currentRxBucketKey");
      this.selectedRxKey =
        savedKey && this.rxBucketMap[savedKey]
          ? savedKey
          : this.rxBucketOptions[0].value;
      await this.fetchRxBucketTeamsByKey(this.selectedRxKey);
      await this.loadBracket();
    }
  },

  beforeRouteLeave(to, from, next) {
    localStorage.removeItem(RACE_PAYLOAD_KEY);
    next();
  },

  methods: {
    /* ============ OPTIONS ============ */
    async loadDataScore(type) {
      try {
        ipcRenderer.send("option-ranked", type);
        ipcRenderer.once("option-ranked-reply", (_e, payload) => {
          this.dataScore =
            payload && payload[0] && Array.isArray(payload[0].data)
              ? payload[0].data
              : [];
        });
      } catch (error) {
        this.dataScore = [];
      }
    },
    async loadDataPenalties(type) {
      try {
        ipcRenderer.send("option-penalties", type);
        ipcRenderer.once("option-penalties-reply", (_e, payload) => {
          this.dataPenalties =
            payload && payload[0] && Array.isArray(payload[0].data)
              ? payload[0].data
              : [];
        });
      } catch (error) {
        this.dataPenalties = [];
      }
    },
    async loadRaceSettings() {
      try {
        if (typeof ipcRenderer === "undefined" || !this.currentEventId) return;
        await new Promise((resolve) => {
          ipcRenderer.once("race-settings:get-reply", (_e, res) => {
            if (res && res.ok && res.settings && res.settings.rx) {
              this.settings = {
                teamsPerHeat: Number(res.settings.rx.teamsPerHeat) || 4,
                qualifiersPerHeat: Number(res.settings.rx.qualifiersPerHeat) || 2,
                gate1: {
                  enabled: !!(res.settings.rx.gate1 && res.settings.rx.gate1.enabled),
                },
                gate2: {
                  enabled: !!(res.settings.rx.gate2 && res.settings.rx.gate2.enabled),
                },
              };
            }
            resolve();
          });
          ipcRenderer.send("race-settings:get", this.currentEventId);
        });
      } catch (err) {
        logger.warn("Failed to load RX race settings:", err);
      }
    },

    /* ============ BUCKET ============ */
    buildStaticRxOptions() {
      const eventId = this.currentEventId || "";
      if (!eventId) {
        this.rxBucketOptions = [];
        this.rxBucketMap = {};
        return;
      }
      const divs =
        (this.dataEventSafe.categoriesDivision || []).map((d) => ({
          id: String(d.value),
          name: String(d.name),
        })) || [];
      const races =
        (this.dataEventSafe.categoriesRace || []).map((r) => ({
          id: String(r.value),
          name: String(r.name),
        })) || [];
      const inits =
        (this.dataEventSafe.categoriesInitial || []).map((i) => ({
          id: String(i.value),
          name: String(i.name),
        })) || [];

      const opts = [];
      const map = Object.create(null);
      divs.forEach((div) => {
        races.forEach((race) => {
          inits.forEach((init) => {
            const key = [eventId, init.id, race.id, div.id].map(String).join("|");
            const label = `${div.name} ${race.name} – ${init.name}`;
            opts.push({ value: key, text: label });
            map[key] = {
              eventId,
              initialId: String(init.id),
              raceId: String(race.id),
              divisionId: String(div.id),
              eventName: "RX",
              initialName: String(init.name),
              raceName: String(race.name),
              divisionName: String(div.name),
              teams: [],
            };
          });
        });
      });
      this.rxBucketOptions = opts;
      this.rxBucketMap = map;
    },
    async onSelectRxBucket(key) {
      await this.fetchRxBucketTeamsByKey(key);
      await this.loadBracket();
    },
    async fetchRxBucketTeamsByKey(key) {
      try {
        this.isLoading = true;
        if (!key || !this.rxBucketMap[key] || typeof ipcRenderer === "undefined")
          return;

        const b = this.rxBucketMap[key];
        const filters = {
          eventId: String(b.eventId),
          initialId: String(b.initialId),
          raceId: String(b.raceId),
          divisionId: String(b.divisionId),
        };

        this.selectedRxKey = key;
        localStorage.setItem("currentRxBucketKey", key);

        const res = await new Promise((resolve) => {
          ipcRenderer.once("teams-rx-registered:find-reply", (_e, payload) =>
            resolve(payload)
          );
          ipcRenderer.send("teams-rx-registered:find", filters);
        });

        const doc =
          res && res.ok && Array.isArray(res.items) ? res.items[0] : null;
        this.registeredTeams = doc && Array.isArray(doc.teams) ? doc.teams : [];
        this.titleCategories = this._rxBucketLabel(b);

        try {
          const raw = localStorage.getItem(RACE_PAYLOAD_KEY) || "{}";
          const obj = JSON.parse(raw) || {};
          obj.bucket = obj.bucket && typeof obj.bucket === "object" ? obj.bucket : {};
          obj.bucket.eventId = String(b.eventId || "");
          obj.bucket.initialId = String(b.initialId || "");
          obj.bucket.raceId = String(b.raceId || "");
          obj.bucket.divisionId = String(b.divisionId || "");
          obj.bucket.eventName = "RX";
          obj.bucket.initialName = String(b.initialName || "");
          obj.bucket.raceName = String(b.raceName || "");
          obj.bucket.divisionName = String(b.divisionName || "");
          localStorage.setItem(RACE_PAYLOAD_KEY, JSON.stringify(obj));
        } catch (err) {
          logger.warn("Failed to update raceStartPayload:", err);
        }
      } finally {
        this.isLoading = false;
      }
    },
    _rxBucketLabel(b) {
      const div = (b && b.divisionName ? String(b.divisionName) : "").toUpperCase();
      const rac = (b && b.raceName ? String(b.raceName) : "").toUpperCase();
      const ini = (b && b.initialName ? String(b.initialName) : "").toUpperCase();
      return `${div} ${rac} – ${ini}`;
    },
    currentBucket() {
      const b = this.rxBucketMap[this.selectedRxKey] || {};
      return {
        eventId: String(b.eventId || this.currentEventId || ""),
        initialId: String(b.initialId || ""),
        raceId: String(b.raceId || ""),
        divisionId: String(b.divisionId || ""),
        eventName: "RX",
        initialName: String(b.initialName || ""),
        raceName: String(b.raceName || ""),
        divisionName: String(b.divisionName || ""),
      };
    },

    /* ============ TIME / PENALTY HELPERS ============ */
    parsesTime(timeStr) {
      if (!timeStr) return Number.POSITIVE_INFINITY;
      const [h = 0, m = 0, s = 0] = String(timeStr).split(":").map(parseFloat);
      if (!Number.isFinite(h + m + s)) return Number.POSITIVE_INFINITY;
      return h * 3600 * 1000 + m * 60 * 1000 + s * 1000;
    },
    tambahWaktu(waktuA, waktuB) {
      const psA = String(waktuA || "0:0:0").split(":");
      const psB = String(waktuB || "0:0:0").split(":");
      const msA =
        (+psA[0] || 0) * 3600000 + (+psA[1] || 0) * 60000 + (parseFloat(psA[2]) || 0) * 1000;
      const msB =
        (+psB[0] || 0) * 3600000 + (+psB[1] || 0) * 60000 + (parseFloat(psB[2]) || 0) * 1000;
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
    hitungSelisihWaktu(waktuAwal, waktuAkhir) {
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
    findPenalty(val) {
      return (
        this.dataPenalties.find((p) => Number(p.value) === Number(val)) || {
          value: 0,
          timePen: "00:00:00.000",
        }
      );
    },
    getScoreByRanked(ranked) {
      const m = this.dataScore.find((d) => d.ranking === Number(ranked));
      return m ? m.score : 0;
    },
    recalcTeamResult(heat, idx) {
      const res = heat.results[idx];
      if (!res) return;
      const g1 = this.findPenalty(res.penalties.gate1);
      const g2 = this.findPenalty(res.penalties.gate2);
      const penaltyTime = this.tambahWaktu(g1.timePen, g2.timePen);
      res.penaltyTime = penaltyTime;
      res.penaltyTotal = Number(g1.value || 0) + Number(g2.value || 0);
      res.totalTime = res.raceTime
        ? this.tambahWaktu(res.raceTime, penaltyTime)
        : "";
      res.finishPosition = null;
      res.qualified = null;
    },

    /* ============ SERIAL TIMING DEVICE ============ */
    async updateTime(val, visIndex, title) {
      const visItem = this.roundParticipants[visIndex];
      if (!visItem) return;

      const heat = this.currentRound.heats.find((h) => h.id === visItem._heatId);
      if (!heat) return;
      const res = heat.results[visItem._slotIdx];
      if (!res) return;

      if (title === "start") res.startTime = val;
      if (title === "finish") {
        res.finishTime = val;
        if (res.startTime && res.finishTime) {
          res.raceTime = this.hitungSelisihWaktu(res.startTime, res.finishTime);
          this.recalcTeamResult(heat, visItem._slotIdx);
        }
      }
    },

    async connectPort() {
      if (!this.isPortConnected) {
        const ports = await listPorts();
        this.currentPort = ports;
        const portIndex = ports.findIndex(
          (p) => String(p.path) === PREFERRED_PATH
        );

        if (portIndex === -1) {
          if (this.$bvToast) {
            this.$bvToast.toast(`Preferred port not found: ${PREFERRED_PATH}`, {
              title: "Device",
              variant: "warning",
              solid: true,
            });
          }
          return;
        }

        this.selectPath = ports[portIndex].path;

        this.serialCtrl = createSerialReader({
          baudRate: this.baudRate,
          portIndex: portIndex,
          onNotify: (type, detail, message) => {
            if (this.$bvToast) {
              this.$bvToast.toast(detail, {
                title: message || "Device",
                variant: type,
                solid: true,
              });
            }
          },
          onData: (a, b) => {
            this.digitId.unshift(a);
            this.digitTime.unshift(b);
          },
          onStart: (formatted) => {
            this.digitTimeStart = formatted;
          },
          onFinish: (formatted) => {
            this.digitTimeFinish = formatted;
          },
        });

        const res = await this.serialCtrl.connect();
        if (res.ok) {
          this.isPortConnected = true;
          this.port = this.serialCtrl.port;
        } else {
          this.isPortConnected = false;
          if (this.$bvToast) {
            this.$bvToast.toast("No valid serial port found / failed to open.", {
              title: "Device",
              variant: "danger",
              solid: true,
            });
          }
        }
      } else {
        await this.disconnected();
        this.isPortConnected = false;
      }
    },

    async disconnected() {
      try {
        if (this.serialCtrl) await this.serialCtrl.disconnect();
      } finally {
        this.port = null;
        this.serialCtrl = null;
        this.isPortConnected = false;
        this.selectPath = "";
      }
    },

    setBaud(br) {
      this.baudRate = br;
    },

    /* ============ BRACKET BUILD ============ */
    computeRoundsPlan(nTeams, teamsPerHeat, qualifiersPerHeat) {
      const plan = [];
      let remaining = nTeams;
      let guard = 0;
      while (remaining > teamsPerHeat && guard < 50) {
        const heatCount = Math.ceil(remaining / teamsPerHeat);
        plan.push({ heatCount, teamsIn: remaining });
        remaining = heatCount * qualifiersPerHeat;
        guard++;
      }
      plan.push({ heatCount: 1, teamsIn: Math.min(remaining, teamsPerHeat) });
      return plan;
    },
    roundName(index, total) {
      if (index === total - 1) return "Final Heat";
      if (index === total - 2) return "Semifinal Round";
      return `Heat Round ${index + 1}`;
    },
    makeEmptyHeat(id, teamsPerHeat) {
      const teams = Array.from({ length: teamsPerHeat }, () => ({
        id: null,
        seed: null,
        name: "",
        bibTeam: "",
      }));
      const results = Array.from({ length: teamsPerHeat }, () => ({
        teamId: null,
        nameTeam: "",
        bibTeam: "",
        raceTime: "",
        penalties: { gate1: null, gate2: null },
        penaltyTime: "",
        penaltyTotal: 0,
        totalTime: "",
        finishPosition: null,
        qualified: null,
      }));
      return { id, bye: false, teams, results };
    },
    makeEmptyRound(id, name, heatCount, teamsPerHeat, extra = {}) {
      const heats = Array.from({ length: heatCount }, (_, i) =>
        this.makeEmptyHeat(i + 1, teamsPerHeat)
      );
      return { id: `R${id}`, name, heats, ...extra };
    },
    collectTeamsForSeeding() {
      const arr = this.participantArr.map((t, i) => ({
        id: t.teamId || t._id || String(i),
        seed: t.seed || t.startOrder || i + 1,
        name: t.nameTeam || t.teamName || "",
        bibTeam: t.bibTeam || "",
      }));
      arr.sort((a, b) => Number(a.seed) - Number(b.seed));
      return arr;
    },
    buildBracket() {
      const teams = this.collectTeamsForSeeding();
      if (!teams.length) return;

      const tph = Math.max(3, Number(this.settings.teamsPerHeat) || 4);
      const qph = Math.min(
        tph - 1,
        Math.max(1, Number(this.settings.qualifiersPerHeat) || 2)
      );

      const plan = this.computeRoundsPlan(teams.length, tph, qph);
      const rounds = plan.map((p, i) =>
        this.makeEmptyRound(
          i + 1,
          this.roundName(i, plan.length),
          p.heatCount,
          tph,
          i === plan.length - 1 ? { final: true } : {}
        )
      );

      if (rounds.length > 1) {
        rounds.splice(rounds.length - 1, 0, {
          id: "RB",
          name: "Final B",
          bronze: true,
          heats: [this.makeEmptyHeat(1, tph)],
        });
      }

      // snake-seed round 1
      const round1 = rounds[0];
      let seedIdx = 0;
      let dir = 1;
      let heatCursor = 0;
      while (seedIdx < teams.length) {
        const heat = round1.heats[heatCursor];
        const slotIdx = heat.teams.findIndex((t) => !t.id);
        if (slotIdx !== -1) {
          const t = teams[seedIdx];
          heat.teams.splice(slotIdx, 1, {
            id: t.id,
            seed: t.seed,
            name: t.name,
            bibTeam: t.bibTeam,
          });
          heat.results.splice(slotIdx, 1, {
            teamId: t.id,
            nameTeam: t.name,
            bibTeam: t.bibTeam,
            raceTime: "",
            penalties: { gate1: null, gate2: null },
            penaltyTime: "",
            penaltyTotal: 0,
            totalTime: "",
            finishPosition: null,
            qualified: null,
          });
          seedIdx++;
        }
        heatCursor += dir;
        if (heatCursor >= round1.heats.length) {
          heatCursor = round1.heats.length - 1;
          dir = -1;
        } else if (heatCursor < 0) {
          heatCursor = 0;
          dir = 1;
        }
      }

      round1.heats.forEach((h) => {
        const realCount = h.teams.filter((t) => t.id).length;
        if (realCount > 0 && realCount <= qph) h.bye = true;
      });

      this.rounds = rounds;
      this.currentRoundIndex = 0;
      this.podium = { gold: null, silver: null, bronze: null, fourth: null };
    },

    /* ============ RANKING ============ */
    rankHeat(heat) {
      const withTeam = heat.results
        .map((r, i) => ({ r, i }))
        .filter((x) => x.r.teamId);
      withTeam.sort((a, b) => {
        const ta = this.parsesTime(a.r.totalTime || a.r.raceTime);
        const tb = this.parsesTime(b.r.totalTime || b.r.raceTime);
        return ta - tb;
      });
      const qph = Math.max(1, Number(this.settings.qualifiersPerHeat) || 2);
      withTeam.forEach((x, idx) => {
        x.r.finishPosition = idx + 1;
        x.r.qualified = idx < qph;
      });
    },

    /* ============ ROUND ADVANCE ============ */
    advanceRound() {
      const idx = this.currentRoundIndex;
      const curRound = this.rounds[idx];
      const nextCompetitiveIdx = this.rounds.findIndex(
        (r, i) => i > idx && !r.bronze
      );
      if (nextCompetitiveIdx === -1) return;
      const nextRound = this.rounds[nextCompetitiveIdx];

      const qualifiers = [];
      const nonQualifiers = [];
      curRound.heats.forEach((h) => {
        h.teams.forEach((t, i) => {
          if (!t.id) return;
          const res = h.results[i];
          if (res.qualified === true) qualifiers.push({ team: t, res });
          else if (res.qualified === false) nonQualifiers.push({ team: t, res });
        });
      });

      qualifiers.sort(
        (a, b) => (a.res.finishPosition || 99) - (b.res.finishPosition || 99)
      );

      let cursor = 0;
      nextRound.heats.forEach((h) => {
        h.teams.forEach((slot, i) => {
          if (slot.id) return;
          const q = qualifiers[cursor];
          if (!q) return;
          h.teams.splice(i, 1, {
            id: q.team.id,
            seed: q.team.seed,
            name: q.team.name,
            bibTeam: q.team.bibTeam,
          });
          h.results.splice(i, 1, {
            teamId: q.team.id,
            nameTeam: q.team.name,
            bibTeam: q.team.bibTeam,
            raceTime: "",
            penalties: { gate1: null, gate2: null },
            penaltyTime: "",
            penaltyTotal: 0,
            totalTime: "",
            finishPosition: null,
            qualified: null,
          });
          cursor++;
        });
      });

      // Final B populated only when advancing straight into the Final Heat
      if (nextRound.final) {
        const finalBRound = this.rounds.find((r) => r.bronze);
        if (finalBRound) {
          const tph = Math.max(3, Number(this.settings.teamsPerHeat) || 4);
          const bHeat = finalBRound.heats[0];
          const pick = nonQualifiers
            .sort(
              (a, b) => (a.res.finishPosition || 99) - (b.res.finishPosition || 99)
            )
            .slice(0, tph);
          pick.forEach((q, i) => {
            bHeat.teams.splice(i, 1, {
              id: q.team.id,
              seed: q.team.seed,
              name: q.team.name,
              bibTeam: q.team.bibTeam,
            });
            bHeat.results.splice(i, 1, {
              teamId: q.team.id,
              nameTeam: q.team.name,
              bibTeam: q.team.bibTeam,
              raceTime: "",
              penalties: { gate1: null, gate2: null },
              penaltyTime: "",
              penaltyTotal: 0,
              totalTime: "",
              finishPosition: null,
              qualified: null,
            });
          });
        }
      }

      this.currentRoundIndex = nextCompetitiveIdx;
    },

    /* ============ FINALIZE / OVERALL ============ */
    computeOverallPlacements() {
      const tph = Math.max(3, Number(this.settings.teamsPerHeat) || 4);
      const finalRound = this.rounds.find((r) => r.final);
      const bronzeRound = this.rounds.find((r) => r.bronze);
      const placements = [];
      const seen = new Set();

      const pushFrom = (heat, offset) => {
        if (!heat) return;
        heat.results
          .filter((r) => r.teamId && r.finishPosition)
          .sort((a, b) => a.finishPosition - b.finishPosition)
          .forEach((r) => {
            if (seen.has(r.teamId)) return;
            seen.add(r.teamId);
            placements.push({
              teamId: r.teamId,
              name: r.nameTeam,
              bibTeam: r.bibTeam,
              overallRank: offset + r.finishPosition,
            });
          });
      };

      pushFrom(finalRound && finalRound.heats[0], 0);
      pushFrom(bronzeRound && bronzeRound.heats[0], tph);

      // everyone else: tie by round eliminated (earlier round = worse), ordered by in-heat position
      let tierRank = tph * 2 + 1;
      for (let ri = this.rounds.length - 3; ri >= 0; ri--) {
        const r = this.rounds[ri];
        if (!r || r.bronze) continue;
        const eliminated = [];
        r.heats.forEach((h) => {
          h.results.forEach((res) => {
            if (res.teamId && res.qualified === false && !seen.has(res.teamId)) {
              eliminated.push(res);
            }
          });
        });
        eliminated.sort((a, b) => (a.finishPosition || 99) - (b.finishPosition || 99));
        eliminated.forEach((res) => {
          seen.add(res.teamId);
          placements.push({
            teamId: res.teamId,
            name: res.nameTeam,
            bibTeam: res.bibTeam,
            overallRank: tierRank,
          });
        });
        if (eliminated.length) tierRank += eliminated.length;
      }

      placements.sort((a, b) => a.overallRank - b.overallRank);
      return placements;
    },

    async finalizeOverall() {
      const placements = this.computeOverallPlacements();
      if (!placements.length) return;

      this.podium = {
        gold: placements.find((p) => p.overallRank === 1) || null,
        silver: placements.find((p) => p.overallRank === 2) || null,
        bronze: placements.find((p) => p.overallRank === 3) || null,
        fourth: placements.find((p) => p.overallRank === 4) || null,
      };

      const bucket = this.currentBucket();

      const overallPkg = {
        placements,
        finalRows: placements,
        rounds: this.rounds,
        overallRows: placements.map((p) => ({
          teamId: p.teamId,
          nameTeam: p.name,
          bibTeam: p.bibTeam,
          ranked: p.overallRank,
          score: this.getScoreByRanked(p.overallRank),
        })),
      };

      if (typeof ipcRenderer !== "undefined") {
        ipcRenderer.send("rx:overall:save", { bucket, overallPkg });

        const K_RX = "RX";
        const evPayload = {
          eventId: bucket.eventId,
          initialId: bucket.initialId,
          raceId: bucket.raceId,
          divisionId: bucket.divisionId,
          eventName: bucket.eventName,
          initialName: bucket.initialName,
          raceName: bucket.raceName,
          divisionName: bucket.divisionName,
          eventResult: overallPkg.overallRows.map((r) => ({
            teamId: r.teamId,
            teamName: r.nameTeam,
            bib: r.bibTeam,
            categories: [
              { name: K_RX, rankedByCats: r.ranked, scored: r.score || 0 },
            ],
            totalRanked: r.ranked,
            totalScore: r.score || 0,
          })),
        };
        ipcRenderer.send("event-results:upsert", evPayload);
      }

      if (this.$bvToast) {
        this.$bvToast.toast("Rafting Cross overall result saved.", {
          title: "Success",
          variant: "success",
          solid: true,
        });
      }
    },

    /* ============ PERSISTENCE ============ */
    async loadBracket() {
      if (typeof ipcRenderer === "undefined") return;
      const bucket = this.currentBucket();
      if (!bucket.eventId || !bucket.initialId || !bucket.raceId || !bucket.divisionId) {
        this.rounds = [];
        return;
      }
      await new Promise((resolve) => {
        ipcRenderer.once("rx:bracket:get-reply", (_e, res) => {
          if (res && res.ok && res.item && Array.isArray(res.item.rounds) && res.item.rounds.length) {
            this.rounds = res.item.rounds;
            this.currentRoundIndex = 0;
          } else {
            this.rounds = [];
            this.currentRoundIndex = -1;
          }
          resolve();
        });
        ipcRenderer.send("rx:bracket:get", bucket);
      });
    },
    saveBracket() {
      if (typeof ipcRenderer === "undefined" || !this.rounds.length) return;
      const bucket = this.currentBucket();
      ipcRenderer.send("rx:bracket:save", {
        bucket,
        rounds: this.rounds,
        settings: this.settings,
      });
      ipcRenderer.once("rx:bracket:save-reply", (_e, res) => {
        if (this.$bvToast) {
          this.$bvToast.toast(
            res && res.ok ? "Bracket saved." : "Failed to save bracket.",
            {
              title: res && res.ok ? "Success" : "Error",
              variant: res && res.ok ? "success" : "danger",
              solid: true,
            }
          );
        }
      });
    },
    saveHeat(heat) {
      if (typeof ipcRenderer === "undefined") return;
      const bucket = this.currentBucket();
      const rows = heat.results
        .filter((r) => r.teamId)
        .map((r) => ({
          team: r.nameTeam,
          bib: r.bibTeam,
          race: r.raceTime,
          total: r.totalTime,
          penaltyTime: r.penaltyTime,
          penaltySum: r.penaltyTotal,
          penalties: r.penalties,
          finishPosition: r.finishPosition,
          qualified: r.qualified,
        }));
      ipcRenderer.send("rx:heat:save", {
        bucket,
        roundId: this.currentRound.id,
        roundName: this.currentRound.name,
        heatId: heat.id,
        rows,
      });
      ipcRenderer.once("rx:heat:save-reply", (_e, res) => {
        if (this.$bvToast) {
          this.$bvToast.toast(
            res && res.ok ? "Heat result saved." : "Failed to save heat.",
            {
              title: res && res.ok ? "Success" : "Error",
              variant: res && res.ok ? "success" : "danger",
              solid: true,
            }
          );
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
  box-shadow: 0 0 20px rgba(0, 128, 255, 0.6);
}

.event-logo-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  border-radius: 10px;
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

/* ===== Buttons ===== */
.btn-action {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
}

/* ===== Meta Panel ===== */
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
  min-width: 120px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: #334155;
  font-style: italic;
}
.meta-value {
  font-weight: 600;
  color: #0f172a;
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

/* ===== PORT / Serial device ===== */
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

.controls-bar {
  gap: 10px;
}

.path-pill {
  display: inline-flex;
  align-items: center;
  max-width: 520px;
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
  max-width: 460px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rx-heat-card {
  border: 1px solid #e6ebf4;
  border-radius: 16px;
  background: #fff;
  padding: 18px 16px;
  box-shadow: 0 12px 26px rgba(31, 56, 104, 0.08);
}

.rx-podium {
  border-top: 1px solid #e6ebf4;
  padding-top: 20px;
}

.rx-podium-card {
  border: 1px solid #e6ebf4;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  margin-bottom: 12px;
}

.rx-podium-place {
  font-weight: 800;
  color: #325a8f;
}

.rx-podium-name {
  font-weight: 700;
}

.rx-podium-bib {
  color: #6c7a93;
  font-size: 12px;
}
</style>
