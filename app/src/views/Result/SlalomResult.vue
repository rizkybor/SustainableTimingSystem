<template>
  <div class="result-wrap p-3 mb-2 mt-5">
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
              {{ eventInfo.eventName || "-" }}
            </h2>
            <div class="meta text-white-50">
              <span class="mr-3">
                <strong class="text-white">Location</strong> :
                {{ eventInfo.addressCity || "-" }}
              </span>
              <span class="mr-3"
                ><strong class="text-white">River</strong> :
                {{ eventInfo.riverName || "-" }}</span
              >
              <span class="mr-3"
                ><strong class="text-white">Level</strong> :
                {{ eventInfo.levelName || "-" }}</span
              >
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>

    <!-- Top bar -->
    <div class="topbar">
      <div class="crumbs">
        <span class="sep">›</span>
        <router-link :to="`/event-detail/${$route.params.id}`" class="muted"
          >Dashboard</router-link
        >
        <span class="sep">›</span>
        <span class="muted">Slalom Result</span>
      </div>

      <div class="right-actions">
        <b-dropdown
          v-if="sessionMode == 'all'"
          :disabled="results.length === 0 || loading"
          variant="link"
          class="action-btn"
          toggle-class="d-flex align-items-center btn-pill btn-pill--solid"
          menu-class="dropdown-menu--pill"
          no-caret
        >
          <template #button-content>
            <Icon icon="mdi:tray-arrow-down" class="mr-2" width="18" height="18" />
            Download Result
            <Icon icon="mdi:chevron-down" class="caret-icon" width="16" height="16" />
          </template>
          <b-dropdown-item @click="generatePdf">
            <Icon icon="mdi:file-pdf-box" class="mr-2" /> PDF
          </b-dropdown-item>
          <b-dropdown-item @click="downloadExcel">
            <Icon icon="mdi:file-excel-box" class="mr-2" /> Excel (.xlsx)
          </b-dropdown-item>
        </b-dropdown>

        <b-button-group class="mr-3 custom-btn-group">
          <b-button
            size="sm"
            :variant="sessionMode === 'all' ? 'primary' : 'outline-primary'"
            @click="changeSessionMode('all')"
            class="custom-btn"
            >All</b-button
          >

          <b-button
            size="sm"
            :variant="sessionMode === '1' ? 'primary' : 'outline-primary'"
            @click="changeSessionMode('1')"
            class="custom-btn"
            >Run 1</b-button
          >

          <b-button
            size="sm"
            :variant="sessionMode === '2' ? 'primary' : 'outline-primary'"
            @click="changeSessionMode('2')"
            class="custom-btn"
            >Run 2</b-button
          >
        </b-button-group>

        <b-button
          variant="link"
          class="action-btn btn-pill btn-pill--outline"
          :disabled="loading"
          @click="fetchEventResultsAggregate"
        >
          <Icon icon="mdi:table-large" class="mr-2" width="18" height="18" />
          View Overall
        </b-button>

        <b-dropdown
          variant="link"
          class="action-btn"
          toggle-class="d-flex align-items-center btn-pill btn-pill--outline"
          menu-class="dropdown-menu--pill"
          no-caret
        >
          <template #button-content>
            <Icon icon="mdi:swap-horizontal" class="mr-2" width="18" height="18" />
            Switch Slalom Category
            <Icon icon="mdi:chevron-down" class="caret-icon" width="16" height="16" />
          </template>
          <div class="switch-category-panel px-3 py-2">
            <b-form-select
              :options="bucketData.bucketOptions"
              :value="currentBucketKey"
              size="sm"
              @change="goToBucket"
            />
          </div>
        </b-dropdown>
      </div>
    </div>

    <!-- Card -->
    <div class="card">
      <div class="card-back d-flex justify-content-between align-items-center">
        <b-button variant="link" class="p-0 back-link" @click="goBack">
          <Icon icon="mdi:chevron-left" /> Back
        </b-button>

        <span
          class="unofficial-stamp"
          :class="{ 'official-stamp': isOfficial }"
          @click="toggleOfficial"
          title="Klik untuk toggle OFFICIAL/UNOFFICIAL"
          role="button"
          tabindex="0"
          @keyup.enter="toggleOfficial"
        >
          {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
        </span>
      </div>

      <!-- EVENT HEADER -->
      <div class="event-header">
        <h2 class="event-name">
          <span class="muted">
            SLALOM RESULT | {{ slalomCats.initial }} -
            {{ slalomCats.division }} {{ slalomCats.race }} | RUN :
            {{ sessionMode }}
          </span>
        </h2>
      </div>

      <b-alert show variant="danger" v-if="error" class="mb-3">{{
        error
      }}</b-alert>
      <div v-if="loading" class="loading-row">
        <b-spinner small class="mr-2" /> Loading results...
      </div>

      <!-- Empty state -->
      <EmptyStateFull
        v-if="!loading && results.length === 0"
        :img-src="require('@/assets/images/404.png')"
        title="No data available"
        subtitle="Hasil Slalom belum tersedia untuk kategori ini."
        primary-text="Kembali ke Event"
        @primary="goBack"
      />

      <!-- Table -->
      <div v-else class="table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Team Name</th>
              <th class="text-center">BIB</th>
              <th class="text-center">Run</th>
              <!-- NEW -->
              <th class="text-center">Start Pen.</th>
              <th class="text-center">Finish Pen.</th>
              <th class="text-center">Gate Pen.</th>
              <th class="text-center">Total Pen.</th>
              <th class="text-center">Penalty Time</th>
              <th class="text-center">Start Time</th>
              <th class="text-center">Finish Time</th>
              <th class="text-center">Race Time</th>
              <th class="text-center">Result</th>
              <th class="text-center">Ranked</th>
              <th class="text-center" v-if="sessionMode === 'all'">Score</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(r, idx) in results"
              :key="idx"
              :class="{ 'best-row': r.isBest && sessionMode === 'all' }"
            >
              <!-- No -->
              <td
                v-if="sessionMode !== 'all' || r.__groupStart"
                class="text-center no-cell"
                :rowspan="sessionMode === 'all' ? r.__groupSize : 1"
              >
                {{ r.teamIndex }}
              </td>

              <!-- Team Name -->
              <td
                v-if="sessionMode !== 'all' || r.__groupStart"
                :rowspan="sessionMode === 'all' ? r.__groupSize : 1"
                class="team-cell"
              >
                <div class="team">
                  {{ r.nameTeam || "-" }}
                  <CountryFlag :code="flagFor(r.nameTeam)" />
                </div>
              </td>

              <!-- BIB -->
              <td
                v-if="sessionMode !== 'all' || r.__groupStart"
                class="text-center bib-cell"
                :rowspan="sessionMode === 'all' ? r.__groupSize : 1"
              >
                {{ r.bibTeam || "-" }}
              </td>

              <!-- Session-specific columns (tetap per baris) -->
              <td class="text-center">{{ r.session || "-" }}</td>
              <td class="text-center" style="color: red">
                <b-form-select
                  v-if="!isOfficial"
                  size="sm"
                  class="small-select"
                  :value="r.startPenalty"
                  :options="filteredPenalties('START')"
                  text-field="label"
                  value-field="value"
                  @change="
                    r.startPenalty = Number($event);
                    onSlalomFieldChange(r);
                  "
                />
                <span v-else>{{ r.startPenalty || 0 }}</span>
              </td>
              <td class="text-center" style="color: red">
                <b-form-select
                  v-if="!isOfficial"
                  size="sm"
                  class="small-select"
                  :value="r.finishPenalty"
                  :options="filteredPenalties('FINISH')"
                  text-field="label"
                  value-field="value"
                  @change="
                    r.finishPenalty = Number($event);
                    onSlalomFieldChange(r);
                  "
                />
                <span v-else>{{ r.finishPenalty || 0 }}</span>
              </td>
              <td class="text-center">
                <span
                  class="gate-modal-trigger"
                  style="color: red"
                  @click="openGateModal(r)"
                >
                  {{ r.sectionPenalty || 0 }}
                </span>
              </td>
              <td class="text-center" style="color: red">
                {{ r.totalPenalty || 0 }}
              </td>
              <td class="text-center" style="color: red">
                {{ r.penaltyTime || "00:00:00.000" }}
              </td>
              <td class="text-center">
                <input
                  v-if="!isOfficial"
                  type="text"
                  class="cell-input"
                  placeholder="00:00:00.000"
                  :value="r.startTime"
                  @change="
                    r.startTime = $event.target.value.trim();
                    onSlalomFieldChange(r);
                  "
                />
                <span v-else>{{ r.startTime || "00:00:00.000" }}</span>
              </td>
              <td class="text-center">
                <input
                  v-if="!isOfficial"
                  type="text"
                  class="cell-input"
                  placeholder="00:00:00.000"
                  :value="r.finishTime"
                  @change="
                    r.finishTime = $event.target.value.trim();
                    onSlalomFieldChange(r);
                  "
                />
                <span v-else>{{ r.finishTime || "00:00:00.000" }}</span>
              </td>
              <td class="bold text-center">
                {{ r.raceTime || "00:00:00.000" }}
              </td>
              <td class="bold text-center" style="color: green">
                {{ r.resultTime || "00:00:00.000" }}
              </td>

              <!-- Ranked Overall -->
              <td v-if="sessionMode === 'all'" class="text-center">
                {{ r.ranked || "-" }}
              </td>

              <!-- Ranked Run 1 & 2 -->
              <td v-if="sessionMode !== 'all'" class="text-center">
                {{ r.teamIndex }}
              </td>

              <!-- Score (ikut aturan Anda: hanya isi di BEST) -->
              <td v-if="sessionMode === 'all'" class="text-center">
                {{
                  r.score !== undefined && r.score !== null && r.score !== ""
                    ? r.score
                    : getScoreByRanked(r.ranked) || 0
                }}
              </td>

            </tr>
          </tbody>
        </table>

        <b-modal
          v-model="showGateModal"
          title="Gate Penalty Detail"
          size="lg"
          hide-footer
          centered
        >
          <div class="mb-2">
            <div class="text-sm text-muted">
              <strong>Team:</strong> {{ gateModal.team || "-" }} &nbsp; | &nbsp;
              <strong>BIB:</strong> {{ gateModal.bib || "-" }}
            </div>
          </div>

          <div class="gate-list">
            <div class="gate-row gate-head">
              <div>Gate</div>
              <div>Penalty</div>
            </div>

            <div
              v-for="(val, i) in gateModal.gates"
              :key="i"
              class="gate-row"
              :class="{ 'has-penalty': Number(val) > 0 }"
            >
              <div>Gate {{ i + 1 }}</div>
              <div class="gate-val">
                <b-form-select
                  v-if="!isOfficial"
                  size="sm"
                  class="small-select"
                  :value="val"
                  :options="filteredPenalties('GATE')"
                  text-field="label"
                  value-field="value"
                  @change="$set(gateModal.gates, i, Number($event))"
                />
                <span
                  v-else
                  class="badge"
                  :class="Number(val) > 0 ? 'badge-danger' : 'badge-light'"
                >
                  {{ val }}
                </span>
              </div>
            </div>

            <div
              v-if="!gateModal.gates || gateModal.gates.length === 0"
              class="empty-gates"
            >
              No gate penalties
            </div>
          </div>

          <div class="modal-actions">
            <b-button
              v-if="!isOfficial"
              variant="success"
              class="mr-2"
              @click="saveGateModal"
              >Save</b-button
            >
            <b-button variant="secondary" @click="closeGateModal"
              >Close</b-button
            >
          </div>
        </b-modal>
      </div>
    </div>

    <!-- Komponen PDF (hidden) -->
    <vue-html2pdf
      v-if="showPdf"
      ref="html2Pdf"
      :show-layout="false"
      :float-layout="false"
      :enable-download="true"
      :preview-modal="false"
      :paginate-elements-by-height="1400"
      :pdf-quality="2"
      :filename="pdfFilename"
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
      @pdfGenerated="onPdfGenerated"
    >
      <section slot="pdf-content">
        <SlalomPdf
          :data="pdfEventData"
          :pdfParticipantsSession1="pdfParticipants"
          :titleCategories="pdfCategories"
          :isOfficial="isOfficial"
          :slalomCats="slalomCats"
        />
      </section>
    </vue-html2pdf>

    <PrintOverallModal
      centered
      :show="showOverallModal"
      :dataEvent="eventInfo"
      :aggregate="dataAggregate"
      :raceCats="slalomCats"
      :categories="visibleCategories"
      @close="showOverallModal = false"
    />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import SlalomPdf from "../DetailEvent/ResultComponent/slalom-pdfResult.vue";
import PrintOverallModal from "@/components/result/PrintOverallModal.vue";
import EmptyStateFull from "@/components/EmptyStateFull.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import VueHtml2pdf from "vue-html2pdf";
import { Icon } from "@iconify/vue2";
import CountryFlag from "@/components/common/CountryFlag.vue";
import teamFlagMixin from "@/mixins/teamFlagMixin";
import {
  loadRegisteredBucketsByEvent,
  isTeamRegisteredFor,
} from "@/utils/registeredTeamsFilter";
import { loadEnabledCategoryKeys } from "@/utils/eventCategories";
import { getVisibleCategoryMeta } from "@/utils/overallCategoryMeta";
import { buildStaticBucketOptions } from "@/utils/buildStaticBucketOptions";
import { exportRowsToExcel } from "@/utils/exportExcel";

/* ========= Helpers ========= */
const RACE_PAYLOAD_KEY = "raceStartPayload";
function safeParse(str, fb) {
  try {
    return JSON.parse(str);
  } catch {
    return fb;
  }
}

export default {
  name: "SlalomResult",
  components: {
    Icon,
    EmptyStateFull,
    SlalomPdf,
    PrintOverallModal,
    VueHtml2pdf,
    CountryFlag,
  },
  mixins: [teamFlagMixin],
  data() {
    return {
      // semua bucket registrasi (lintas race category) utk event ini,
      // dipakai cross-check di buildAggregateFromDoc() (modal Print Result
      // Overall) — lihat src/utils/registeredTeamsFilter.js
      registeredBuckets: [],
      // Race Category yang benar-benar dipilih utk event ini — null =
      // fail-open (tampilkan semua kolom kategori)
      enabledCategoryKeys: null,
      showOverallModal: false,
      dataAggregate: {
        header: {
          title: "",
          subTitle: "",
          dateStr: "",
          chiefJudge: "",
          official: false,
        },
        rows: [],
      },
      sessionMode: "all", // nilai default
      rawResultItems: [],
      defaultImg,
      isOfficial: false,
      loading: false,
      error: "",
      results: [],
      showPdf: false,
      eventInfo: {},
      showGateModal: false,
      gateModal: {
        team: "",
        bib: "",
        gates: [],
        row: null,
      },
      // skema score Slalom (boleh sesuaikan)
      // BUG FIX: dulu tabel placeholder (300, 275, 255...) yg BEDA dari
      // tabel asli optionRanked type "SLALOM" yg sebenarnya dipakai backend
      // (insertSlalomResult()) & default Race Settings (350, 322, 301...)
      // — kalau r.score (hasil tersimpan) kosong, fallback getScoreByRanked()
      // di sini bisa menampilkan angka yg TIDAK PERNAH cocok dgn yg
      // sebenarnya bakal tersimpan. Samakan dgn tabel asli (DrrResult.vue
      // pakai tabel yg sama persis).
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
      slalomDefaultScoreBeyondRank: 0,
      // On/off kolom tanda tangan di PDF Result — per kategori lewat Race
      // Settings, default TAMPIL (true), di-refresh di loadRaceSettings().
      showTechnicalDelegate: true,
      showChiefJudge: true,
      showRaceDirector: true,
      // Daftar pilihan Start/Finish/Gate Penalty (global optionPenalties
      // "SLALOM") — sama sumber & filter value yg dipakai SlalomRace.vue
      // (filteredPenalties()), dipakai dropdown editable di tabel ini.
      dataPenalties: [],
      // Override per-event dari Race Settings (Pilihan Pen. Start/Finish/
      // Gates), diisi di loadRaceSettings(); kosong = pakai default global.
      dataPenaltiesStart: [],
      dataPenaltiesFinish: [],
      dataPenaltiesGate: [],
    };
  },

  computed: {
    visibleCategories() {
      return getVisibleCategoryMeta(this.enabledCategoryKeys);
    },
    // Kombinasi statis Divisi x Race x Initial (dari config event, sama
    // seperti buildSlalomOptions() di SlalomRace.vue) — dipakai switcher
    // "Switch Slalom Category" (flat select, sama seperti Race Detail-nya,
    // tidak pakai tab Initial).
    bucketData() {
      const q = this.$route.query || {};
      const eventId = String(q.eventId || this.$route.params.id || "");
      return buildStaticBucketOptions(this.eventInfo, eventId);
    },
    currentBucketKey() {
      const q = this.$route.query || {};
      return [
        String(q.eventId || ""),
        String(q.initialId || ""),
        String(q.raceId || ""),
        String(q.divisionId || ""),
      ].join("|");
    },
    hasEventLogo() {
      const ev = this.eventInfo || {};
      const logos = ev.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        const first = logos[0];
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
      const ev = this.eventInfo || {};
      const logos = ev.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        const first = logos[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && typeof first.url === "string")
          return first.url;
      }
      return "";
    },
    pdfFilename() {
      const parts = [];
      if (this.eventInfo && this.eventInfo.eventName)
        parts.push(this.eventInfo.eventName);
      parts.push(
        `SLALOM (${this.slalomCats.initial || "-"} - ${
          this.slalomCats.division || "-"
        } ${this.slalomCats.race || "-"})`
      );
      return parts.join(" - ");
    },
    slalomCats() {
      // BUG FIX: query dulu, localStorage cuma fallback — lihat catatan
      // di h2hCats() (HeadToHeadResult.vue)/sprintCats() (SprintResult.vue)
      // soal kenapa localStorage-first bikin judul basi setelah "Switch
      // Slalom Category" (yg cuma ganti $route.query, tidak menyentuh
      // localStorage).
      const q = this.$route.query || {};
      const payload = safeParse(
        localStorage.getItem(RACE_PAYLOAD_KEY) || "{}",
        {}
      );
      const b = payload.bucket || {};
      return {
        initial: q.initialName || b.initialName || "-",
        race: q.raceName || b.raceName || "-",
        division: q.divisionName || b.divisionName || "-",
      };
    },

    // data buat PDF
    pdfEventData() {
      return {
        ...this.eventInfo,
        levelName: this.eventInfo.levelName || "-",
        showTechnicalDelegate: this.showTechnicalDelegate,
        showChiefJudge: this.showChiefJudge,
        showRaceDirector: this.showRaceDirector,
      };
    },
    pdfParticipants() {
      const items = Array.isArray(this.rawResultItems)
        ? this.rawResultItems
        : [];

      // helpers
      function norm(s) {
        return String(s || "")
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase();
      }
      const timeToMs = (str) => {
        if (!str) return Infinity;
        const parts = String(str).split(":");
        const hh = parts[0] || "0";
        const mm = parts[1] || "0";
        const ssms = parts[2] || "0";
        const ssmsParts = String(ssms).split(".");
        const ss = ssmsParts[0] || "0";
        const ms = ssmsParts[1] || "0";
        return +hh * 3600000 + +mm * 60000 + +ss * 1000 + (+ms || 0);
      };
      const msToHMSms = (ms) => {
        if (!Number.isFinite(ms)) return "";
        function pad(n, w) {
          return String(n).padStart(w || 2, "0");
        }
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const mil = ms % 1000;
        return (
          pad(h) +
          ":" +
          pad(m) +
          ":" +
          pad(s) +
          "." +
          String(mil).padStart(3, "0")
        );
      };
      const self = this;

      function isBetterRun(a, b) {
        if (!a && b) return true;
        if (a && !b) return false;
        if (!a && !b) return false;
        const msA = timeToMs(a.totalTime || a.raceTime);
        const msB = timeToMs(b.totalTime || b.raceTime);
        const aValid = Number.isFinite(msA);
        const bValid = Number.isFinite(msB);
        if (aValid && bValid) return msB < msA; // b lebih cepat
        if (!aValid && bValid) return true;
        return false;
      }

      function sessionIndex(run, ridx) {
        const s =
          run && run.session ? String(run.session).trim().toLowerCase() : "";
        if (s === "1" || /\brun\s*1\b/.test(s) || /\b1\b/.test(s)) return 1;
        if (s === "2" || /\brun\s*2\b/.test(s) || /\b2\b/.test(s)) return 2;
        return ridx === 0 ? 1 : ridx === 1 ? 2 : null;
      }

      // ==== Kumpulkan per tim (≤2 run) ====
      const map = Object.create(null);

      for (let d = 0; d < items.length; d++) {
        const doc = items[d];
        const teams = doc && Array.isArray(doc.teams) ? doc.teams : [];
        for (let t = 0; t < teams.length; t++) {
          const T = teams[t] || {};
          const nameTeam = T && T.nameTeam ? String(T.nameTeam) : "-";
          const bibTeam =
            T && (T.bibTeam || T.bibNumber)
              ? String(T.bibTeam || T.bibNumber)
              : "-";
          const statusId = Number(T && T.statusId) || 0;
          const teamId = T && T.teamId ? T.teamId : T && T.id ? T.id : null;
          const key = teamId ? "id:" + teamId : "name:" + norm(nameTeam);

          if (!map[key]) {
            map[key] = {
              nameTeam: nameTeam,
              bibTeam: bibTeam,
              countryCode: self.flagFor(nameTeam),
              statusId: statusId,
              result: [], // akan diisi maksimal 2 objek run
              ranked: 0,
              score: 0,
              bestTime: "",
              meta: {},
              otr: {},
              _slots: { 1: null, 2: null }, // internal
            };
          } else {
            if (!map[key].nameTeam) map[key].nameTeam = nameTeam;
            if (map[key].bibTeam === "-" && bibTeam && bibTeam !== "-")
              map[key].bibTeam = bibTeam;
            if (!map[key].statusId) map[key].statusId = statusId;
          }

          const runs = Array.isArray(T && T.result) ? T.result : [];
          for (let i = 0; i < runs.length; i++) {
            const r = runs[i] || {};
            const p = r.penaltyTotal || {};
            const gates = Array.isArray(p.gates) ? p.gates : [];
            const idx = sessionIndex(r, i); // 1 atau 2
            if (idx !== 1 && idx !== 2) continue;

            const runObj = {
              session: r.session ? String(r.session) : "Run " + idx,
              startTime: String(r.startTime || ""),
              finishTime: String(r.finishTime || ""),
              raceTime: String(r.raceTime || ""),
              penaltyTime: String(r.penaltyTime || "00:00:00.000"),
              penaltyTotal: {
                start: Number(p.start) || 0,
                gates: gates,
                finish: Number(p.finish) || 0,
              },
              penalty:
                (Number(p.start) || 0) +
                gates.reduce(function (a, v) {
                  return a + (Number(v) || 0);
                }, 0) +
                (Number(p.finish) || 0),
              totalTime: String(r.totalTime || r.raceTime || ""),
              ranked: Number(r.ranked) || 0,
              judgesBy: String(r.judgesBy || ""),
              judgesTime: String(r.judgesTime || ""),
            };

            // merge ke slot idx (pilih yang lebih baik)
            const cur = map[key]._slots[idx];
            if (isBetterRun(cur, runObj)) {
              map[key]._slots[idx] = runObj;
            } else if (!cur) {
              map[key]._slots[idx] = runObj;
            }

            // simpan ranked/score tim dari run yang punya ranked
            if (runObj.ranked > 0) {
              map[key].ranked = runObj.ranked;
              map[key].score =
                Number(r.score) || self.getScoreByRanked(runObj.ranked) || 0;
            }
          }
        }
      }

      // ==== Bentuk output, hitung bestTime dari 2 run ====
      const out = [];
      const keys = Object.keys(map);
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const entry = map[key];

        // urut: Run 1 lalu Run 2 jika ada
        if (entry._slots[1]) entry.result.push(entry._slots[1]);
        if (entry._slots[2]) entry.result.push(entry._slots[2]);

        // bestTime = min(totalTime || raceTime) dari dua run
        let bestMs = Infinity;
        for (let i = 0; i < entry.result.length; i++) {
          const rr = entry.result[i];
          const ms = timeToMs(rr.totalTime || rr.raceTime);
          if (Number.isFinite(ms) && ms < bestMs) bestMs = ms;
        }
        entry.bestTime = Number.isFinite(bestMs) ? msToHMSms(bestMs) : "";

        if (!entry.ranked) entry.ranked = 0;
        if (!entry.score)
          entry.score = self.getScoreByRanked(entry.ranked) || 0;

        // bersihkan field internal
        delete entry._slots;

        out.push(entry);
      }

      return out;
    },
    pdfCategories() {
      const payload = safeParse(
        localStorage.getItem(RACE_PAYLOAD_KEY) || "{}",
        {}
      );
      const b = payload.bucket || {};
      const title = [b.divisionName, b.raceName, b.initialName]
        .filter(Boolean)
        .join(" – ");
      return title || "SLALOM";
    },
  },

  async created() {
    const q = this.$route.query || {};
    await this.loadDataPenalties("SLALOM");
    if (q.eventId) {
      await this.loadEventById(q.eventId);
      this.registeredBuckets = await loadRegisteredBucketsByEvent(q.eventId);
      this.enabledCategoryKeys = await loadEnabledCategoryKeys(q.eventId);
      await this.loadRaceSettings(q.eventId);
    }

    // muat data slalom
    await this.loadSlalomResult();
  },

  methods: {
    async loadRaceSettings(eventId) {
      try {
        if (typeof ipcRenderer === "undefined" || !eventId) return;
        await new Promise((resolve) => {
          ipcRenderer.once("race-settings:get-reply", (_e, res) => {
            const scoreByRank =
              res &&
              res.ok &&
              res.settings &&
              res.settings.slalom &&
              Array.isArray(res.settings.slalom.scoreByRank)
                ? res.settings.slalom.scoreByRank
                : null;
            if (scoreByRank && scoreByRank.length) {
              this.dataScore = scoreByRank.map((p) => ({
                ranking: Number(p.ranking) || 0,
                score: Number(p.score) || 0,
              }));
            }
            this.slalomDefaultScoreBeyondRank =
              Number(
                res &&
                  res.settings &&
                  res.settings.slalom &&
                  res.settings.slalom.defaultScoreBeyondRank
              ) || 0;
            // Pilihan Pen. Start (PS) / Pen. Finish (PF) / Pen. Gates (PG) —
            // sinkron dgn override di SlalomRace.vue supaya dropdown editable
            // di halaman Result ini identik dgn Race Detail.
            const sl = res && res.ok && res.settings && res.settings.slalom;
            if (sl) {
              if (Array.isArray(sl.startPenalties) && sl.startPenalties.length) {
                this.dataPenaltiesStart = sl.startPenalties;
              }
              if (
                Array.isArray(sl.finishPenalties) &&
                sl.finishPenalties.length
              ) {
                this.dataPenaltiesFinish = sl.finishPenalties;
              }
              if (Array.isArray(sl.gatePenalties) && sl.gatePenalties.length) {
                this.dataPenaltiesGate = sl.gatePenalties;
              }
            }

            // On/off kolom Technical Delegate/Chief Judge/Race Director di
            // PDF Result Slalom — diatur per kategori lewat Race Settings,
            // default TAMPIL (true) kalau belum pernah diatur.
            const boolOrDefault = (v, d) => (v === undefined || v === null ? d : !!v);
            this.showTechnicalDelegate = boolOrDefault(
              sl && sl.showTechnicalDelegate,
              true
            );
            this.showChiefJudge = boolOrDefault(sl && sl.showChiefJudge, true);
            this.showRaceDirector = boolOrDefault(
              sl && sl.showRaceDirector,
              true
            );

            resolve();
          });
          ipcRenderer.send("race-settings:get", eventId);
        });
      } catch (error) {
        // biarkan dataScore default kalau gagal memuat override
      }
    },
    buildAggregateFromDoc: function (doc, eventInfo) {
      var headerTitle = "";
      if (doc && typeof doc.eventName === "string") headerTitle = doc.eventName;
      if (
        !headerTitle &&
        eventInfo &&
        typeof eventInfo.eventName === "string"
      ) {
        headerTitle = eventInfo.eventName;
      }
      var sub = "";
      if (doc && typeof doc.divisionName === "string" && doc.divisionName)
        sub = String(doc.divisionName);
      if (doc && typeof doc.initialName === "string" && doc.initialName) {
        sub = sub
          ? sub + " • " + String(doc.initialName)
          : String(doc.initialName);
      }
      var d = new Date();
      var dateStr = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      var chief = "";
      if (eventInfo && typeof eventInfo.chiefJudge === "string")
        chief = eventInfo.chiefJudge;
      var header = {
        title: headerTitle || "—",
        subTitle: sub || "—",
        dateStr: dateStr,
        official: false,
        chiefJudge: chief || "",
      };
      var rows = [];
      var arr = doc && Array.isArray(doc.eventResult) ? doc.eventResult : [];
      for (var i = 0; i < arr.length; i++) {
        var t = arr[i] || {};
        var teamName = t && typeof t.teamName === "string" ? t.teamName : "";
        var bib = t && typeof t.bib === "string" ? t.bib : "";
        var cats = t && Array.isArray(t.categories) ? t.categories : [];
        var sprintScore = 0,
          sprintRank = 0;
        var h2hScore = 0,
          h2hRank = 0;
        var slalomScore = 0,
          slalomRank = 0;
        var drrScore = 0,
          drrRank = 0;
        var rxScore = 0,
          rxRank = 0;
        for (var j = 0; j < cats.length; j++) {
          var c = cats[j] || {};
          var nm = c && typeof c.name === "string" ? c.name.toUpperCase() : "";
          var sc = 0;
          var rk = 0;
          if (c && c.scored != null) {
            sc = Number(c.scored);
            if (!Number.isFinite(sc)) sc = Number(c.scored) || 0;
          }
          if (c && c.rankedByCats != null) {
            rk = Number(c.rankedByCats);
            if (!Number.isFinite(rk)) rk = Number(c.rankedByCats) || 0;
          }
          if (nm === "SPRINT") {
            sprintScore = sc;
            sprintRank = rk;
          } else if (
            nm === "HEADTOHEAD" ||
            nm === "HEAD TO HEAD" ||
            nm === "H2H"
          ) {
            h2hScore = sc;
            h2hRank = rk;
          } else if (nm === "SLALOM") {
            slalomScore = sc;
            slalomRank = rk;
          } else if (nm === "DRR" || nm === "DOWN RIVER RACE") {
            drrScore = sc;
            drrRank = rk;
          } else if (nm === "RX" || nm === "RAFTING CROSS") {
            rxScore = sc;
            rxRank = rk;
          }
        }
        // Skor/rank per discipline hanya dipercaya kalau tim ini MASIH
        // benar-benar terdaftar di discipline tsb saat ini — mencegah skor
        // basi (tim sudah dihapus/dipindah dari Registered Teams) tetap
        // muncul di Print Result Overall.
        var initialName = doc && doc.initialName;
        var raceName = doc && doc.raceName;
        var divisionName = doc && doc.divisionName;
        if (!isTeamRegisteredFor(this.registeredBuckets, "SPRINT", initialName, raceName, divisionName, teamName)) {
          sprintScore = 0;
          sprintRank = 0;
        }
        if (!isTeamRegisteredFor(this.registeredBuckets, "HEAD2HEAD", initialName, raceName, divisionName, teamName)) {
          h2hScore = 0;
          h2hRank = 0;
        }
        if (!isTeamRegisteredFor(this.registeredBuckets, "SLALOM", initialName, raceName, divisionName, teamName)) {
          slalomScore = 0;
          slalomRank = 0;
        }
        if (!isTeamRegisteredFor(this.registeredBuckets, "DRR", initialName, raceName, divisionName, teamName)) {
          drrScore = 0;
          drrRank = 0;
        }
        if (!isTeamRegisteredFor(this.registeredBuckets, "RX", initialName, raceName, divisionName, teamName)) {
          rxScore = 0;
          rxRank = 0;
        }

        var hasAnyValidDiscipline =
          sprintRank > 0 || h2hRank > 0 || slalomRank > 0 || drrRank > 0 || rxRank > 0;
        if (!hasAnyValidDiscipline) continue;

        var totalScore = sprintScore + h2hScore + slalomScore + drrScore + rxScore;
        rows.push({
          no: i + 1,
          teamName: teamName,
          bib: bib,
          countryCode: this.flagFor(teamName),
          sprintScore: sprintScore,
          sprintRank: sprintRank,
          h2hScore: h2hScore,
          h2hRank: h2hRank,
          slalomScore: slalomScore,
          slalomRank: slalomRank,
          drrScore: drrScore,
          drrRank: drrRank,
          rxScore: rxScore,
          rxRank: rxRank,
          totalScore: totalScore,
        });
      }
      rows.sort(function (a, b) {
        return b.totalScore - a.totalScore;
      });
      for (var k = 0; k < rows.length; k++) rows[k].no = k + 1;
      return { header: header, rows: rows };
    },
    fetchEventResultsAggregate: function () {
      var q = this.$route && this.$route.query ? this.$route.query : {};
      var f = {
        eventId: String(q.eventId || ""),
        initialId: String(q.initialId || ""),
        raceId: String(q.raceId || ""),
        divisionId: String(q.divisionId || ""),
      };

      // validasi minimal
      if (!f.eventId || !f.initialId || !f.raceId || !f.divisionId) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Load Overall",
          detail: "Parameter kategori tidak lengkap.",
        });
        return;
      }
      var self = this;
      ipcRenderer.send("event-results:get", f);
      ipcRenderer.once("event-results:get-reply", function (_e, res) {
        if (res && res.ok && res.doc) {
          var agg = self.buildAggregateFromDoc(res.doc, self.eventInfo);
          self.dataAggregate = agg;
          self.showOverallModal = true;
        } else {
          var det = res && res.error ? res.error : "Tidak ada data aggregate.";
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Load Overall",
            detail: det,
          });
        }
      });
    },
    buildResultRows(mode) {
      const items = this.rawResultItems || [];
      if (!Array.isArray(items) || items.length === 0) return [];

      // util
      function norm(s) {
        return String(s || "")
          .trim()
          .replace(/\s+/g, " ")
          .toLowerCase();
      }
      const self = this;

      // pilih run yang "lebih baik" untuk slot run yang sama
      function isBetterRun(a, b) {
        if (!a && b) return true;
        if (a && !b) return false;
        if (!a && !b) return false;
        // bandingkan berdasarkan resultTime -> totalTime -> raceTime
        const msA = self.timeToMs(a.resultTime || a.totalTime || a.raceTime);
        const msB = self.timeToMs(b.resultTime || b.totalTime || b.raceTime);
        const aValid = Number.isFinite(msA);
        const bValid = Number.isFinite(msB);
        if (aValid && bValid) return msB < msA; // b lebih cepat → b lebih baik
        if (!aValid && bValid) return true;
        return false; // default: pertahankan a
      }

      // deteksi index run (1 atau 2)
      function sessionIndex(run, ridx) {
        var s = run && run.session ? String(run.session) : "";
        var clean = s.trim().toLowerCase();
        // pola umum: "run 1", "run1", "1", dsb.
        if (clean === "1" || /\brun\s*1\b/.test(clean) || /\b1\b/.test(clean))
          return 1;
        if (clean === "2" || /\brun\s*2\b/.test(clean) || /\b2\b/.test(clean))
          return 2;
        // fallback berdasarkan posisi dalam array
        return ridx === 0 ? 1 : ridx === 1 ? 2 : null;
      }

      // ---- kumpulkan per tim, maksimum 2 run ----
      var teamsObj = {};

      for (var d = 0; d < items.length; d++) {
        var doc = items[d];
        if (!doc || !Array.isArray(doc.teams)) continue;

        for (var t = 0; t < doc.teams.length; t++) {
          var team = doc.teams[t] || {};

          var rawName = team && team.nameTeam ? team.nameTeam : "-";
          var rawBib =
            team && team.bibTeam
              ? team.bibTeam
              : team && team.bibNumber
              ? team.bibNumber
              : "";
          var teamId =
            team && team.teamId
              ? team.teamId
              : team && team.id
              ? team.id
              : null;

          var nameTeam = String(rawName).trim();
          var bibTeam = String(rawBib).trim();
          var result = Array.isArray(team.result) ? team.result : [];
          if (result.length === 0) continue;

          var key = teamId ? "id:" + teamId : "name:" + norm(nameTeam);

          if (!teamsObj[key]) {
            teamsObj[key] = {
              nameTeam: nameTeam,
              bibTeam: bibTeam,
              runsByIdx: { 1: null, 2: null }, // simpan maksimal 2
              bestIdx: -1,
              bestMs: Number.POSITIVE_INFINITY,
              bestRank: 0,
            };
          } else {
            if (!teamsObj[key].nameTeam) teamsObj[key].nameTeam = nameTeam;
            if (!teamsObj[key].bibTeam && bibTeam)
              teamsObj[key].bibTeam = bibTeam;
          }

          // iterasi semua run, taruh hanya ke slot 1/2
          for (var r = 0; r < result.length; r++) {
            var run = result[r] || {};
            var idx = sessionIndex(run, r); // 1 atau 2 atau null
            if (idx !== 1 && idx !== 2) continue; // abaikan selain 1/2

            var R = this.normalizeResult(run);
            var item = {
              nameTeam: teamsObj[key].nameTeam || nameTeam,
              bibTeam: bibTeam || teamsObj[key].bibTeam || "",
              session: run.session ? String(run.session) : "Run " + idx,
              runIdx: idx,
              startTime: R.startTime,
              finishTime: R.finishTime,
              raceTime: R.raceTime,
              startPenalty: R.startPenalty,
              finishPenalty: R.finishPenalty,
              sectionPenalty: R.sectionPenalty,
              totalPenalty: R.totalPenalty,
              penaltyTime: R.penaltyTime,
              totalTime: R.totalTime,
              resultTime: R.resultTime,
              isBest: false,
              ranked: 0,
              score: 0,
              gatesDetail:
                run.penaltyTotal && Array.isArray(run.penaltyTotal.gates)
                  ? run.penaltyTotal.gates
                  : [],
            };

            // jika slot kosong → isi; jika sudah ada → pilih yang lebih baik
            var current = teamsObj[key].runsByIdx[idx];
            if (isBetterRun(current, item)) {
              teamsObj[key].runsByIdx[idx] = item;
            } else if (!current) {
              teamsObj[key].runsByIdx[idx] = item;
            }
          }
        }
      }

      // ---- bentuk array runs final per tim (≤2 item), tentukan best ----
      var keys = Object.keys(teamsObj);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var pack = teamsObj[k];

        // urutkan Run 1 lalu Run 2 jika ada
        var mergedRuns = [];
        if (pack.runsByIdx[1]) mergedRuns.push(pack.runsByIdx[1]);
        if (pack.runsByIdx[2]) mergedRuns.push(pack.runsByIdx[2]);
        pack.runs = mergedRuns;

        // tentukan best dari 1 atau 2
        for (var j = 0; j < pack.runs.length; j++) {
          var row = pack.runs[j];
          var ms = this.timeToMs(
            row.resultTime || row.totalTime || row.raceTime
          );
          if (Number.isFinite(ms) && ms < pack.bestMs) {
            pack.bestMs = ms;
            pack.bestIdx = j;
          }
        }
      }

      // ---- ranking antar tim berdasarkan bestMs ----
      var bestArray = [];
      for (var k1 in teamsObj) {
        if (!Object.prototype.hasOwnProperty.call(teamsObj, k1)) continue;
        bestArray.push({ key: k1, ms: teamsObj[k1].bestMs });
      }
      bestArray.sort(function (a, b) {
        return a.ms - b.ms;
      });

      var rankCounter = 1;
      for (var b = 0; b < bestArray.length; b++) {
        var ent = bestArray[b];
        var pack2 = teamsObj[ent.key];
        // kalau tidak ada run sama sekali, lewati rank (tetap Infinity)
        if (!Array.isArray(pack2.runs) || pack2.runs.length === 0) continue;

        pack2.bestRank = rankCounter;
        if (pack2.bestIdx >= 0 && pack2.bestIdx < pack2.runs.length) {
          pack2.runs[pack2.bestIdx].isBest = true;
          pack2.runs[pack2.bestIdx].ranked = rankCounter;
          pack2.runs[pack2.bestIdx].score = this.getScoreByRanked(rankCounter);
        }
        rankCounter++;
      }
      // ---- susun finalRows sesuai mode ----
      var finalRows = [];

      if (mode === "all") {
        var orderedKeys = Object.keys(teamsObj).sort(function (ka, kb) {
          var ra = teamsObj[ka].bestRank || Infinity;
          var rb = teamsObj[kb].bestRank || Infinity;
          return ra - rb;
        });

        var teamCounter = 1;
        for (var x = 0; x < orderedKeys.length; x++) {
          let key = orderedKeys[x];
          var pack3 = teamsObj[key];

          // urut: Run 1 lalu Run 2 (bila ada)
          var rows = [];
          if (pack3.runsByIdx[1]) rows.push(pack3.runsByIdx[1]);
          if (pack3.runsByIdx[2]) rows.push(pack3.runsByIdx[2]);

          for (let y = 0; y < rows.length; y++) {
            let rrow = rows[y];
            finalRows.push({
              nameTeam: rrow.nameTeam,
              bibTeam: rrow.bibTeam,
              session: rrow.session,
              runIdx: rrow.runIdx,
              startTime: rrow.startTime,
              finishTime: rrow.finishTime,
              raceTime: rrow.raceTime,
              startPenalty: rrow.startPenalty,
              finishPenalty: rrow.finishPenalty,
              sectionPenalty: rrow.sectionPenalty,
              totalPenalty: rrow.totalPenalty,
              penaltyTime: rrow.penaltyTime,
              totalTime: rrow.totalTime,
              resultTime: rrow.resultTime,
              isBest: rrow.isBest,
              gatesDetail: rrow.gatesDetail,
              ranked: rrow.isBest ? rrow.ranked || "-" : "-",
              score: rrow.isBest ? rrow.score || 0 : 0,
              teamIndex: teamCounter,
            });
          }
          teamCounter++;
        }

        // Rowspan merge utk mode "all"
        var groupCount = new Map();
        for (var z = 0; z < finalRows.length; z++) {
          var rr = finalRows[z];
          groupCount.set(rr.teamIndex, (groupCount.get(rr.teamIndex) || 0) + 1);
        }
        var seenFirst = new Set();
        for (var z2 = 0; z2 < finalRows.length; z2++) {
          var r2 = finalRows[z2];
          if (!seenFirst.has(r2.teamIndex)) {
            r2.__groupStart = true;
            r2.__groupSize = groupCount.get(r2.teamIndex) || 1;
            seenFirst.add(r2.teamIndex);
          } else {
            r2.__groupStart = false;
            r2.__groupSize = 0;
          }
        }
      } else {
        // ---- mode "1" atau "2": urutkan by waktu run spesifik ----
        var wantedIdx = mode === "1" ? 1 : 2;
        let pool = [];

        for (let k in teamsObj) {
          if (!Object.prototype.hasOwnProperty.call(teamsObj, k)) continue;
          let run = teamsObj[k].runsByIdx[wantedIdx];
          if (!run) continue;

          let ms = this.timeToMs(
            run.resultTime || run.totalTime || run.raceTime
          );
          pool.push({
            ms: Number.isFinite(ms) ? ms : Infinity,
            row: run,
          });
        }

        // sort by waktu tercepat
        pool.sort(function (a, b) {
          return a.ms - b.ms;
        });

        // assign teamIndex sesuai urutan ini
        for (let i = 0; i < pool.length; i++) {
          let rrow = pool[i].row;
          finalRows.push({
            nameTeam: rrow.nameTeam,
            bibTeam: rrow.bibTeam,
            session: rrow.session,
            runIdx: rrow.runIdx,
            startTime: rrow.startTime,
            finishTime: rrow.finishTime,
            raceTime: rrow.raceTime,
            startPenalty: rrow.startPenalty,
            finishPenalty: rrow.finishPenalty,
            sectionPenalty: rrow.sectionPenalty,
            totalPenalty: rrow.totalPenalty,
            penaltyTime: rrow.penaltyTime,
            totalTime: rrow.totalTime,
            resultTime: rrow.resultTime,
            isBest: rrow.isBest, // tidak dipakai di UI run-only
            gatesDetail: rrow.gatesDetail,
            ranked: "-", // kolom ini di UI run-only menampilkan teamIndex
            score: 0, // tidak dipakai di UI run-only
            teamIndex: i + 1, // <- ini yang jadi “urutan tercepat” untuk run tsb
          });
        }
      }

      return finalRows;
    },
    changeSessionMode(mode) {
      if (!["all", "1", "2"].includes(mode)) return;
      this.sessionMode = mode;
      this.results = this.buildResultRows(mode);
    },
    openGateModal(row) {
      this.gateModal.team = row && row.nameTeam ? row.nameTeam : "";
      this.gateModal.bib = row && row.bibTeam ? row.bibTeam : "";
      // salinan (bukan referensi langsung) — edit di modal baru diterapkan
      // ke row aslinya saat "Save" diklik, bukan diam-diam sebelum disimpan.
      this.gateModal.gates = Array.isArray(row && row.gatesDetail)
        ? row.gatesDetail.slice()
        : [];
      this.gateModal.row = row || null;
      this.showGateModal = true;
    },
    closeGateModal() {
      this.showGateModal = false;
      this.gateModal.row = null;
    },
    async saveGateModal() {
      if (this.isOfficial || !this.gateModal.row) {
        this.showGateModal = false;
        return;
      }
      const row = this.gateModal.row;
      this.$set(row, "gatesDetail", this.gateModal.gates.slice());
      this.showGateModal = false;
      this.gateModal.row = null;
      await this.onSlalomFieldChange(row);
    },
    goBack() {
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },

    goToBucket(key) {
      const b = this.bucketData.bucketMap[key];
      if (!b) return;
      this.$router.push({
        path: this.$route.path,
        query: {
          eventId: b.eventId,
          initialId: b.initialId,
          raceId: b.raceId,
          divisionId: b.divisionId,
          eventName: "SLALOM",
          initialName: b.initialName,
          raceName: b.raceName,
          divisionName: b.divisionName,
        },
      });
    },

    async loadEventById(eventId) {
      try {
        this.loading = true;
        ipcRenderer.send("get-events-byid", eventId);
        await new Promise((resolve) => {
          ipcRenderer.once("get-events-byid-reply", (_e, res) => {
            this.loading = false;
            this.eventInfo = res && typeof res === "object" ? res : {};
            this.isOfficial = !!this.eventInfo.resultsOfficial;
            if (!this.eventInfo.eventName) this.error = this.error || "";
            resolve();
          });
        });
      } catch {
        this.loading = false;
        this.eventInfo = {};
        this.error = "Terjadi kesalahan saat memuat event.";
      }
    },

    async toggleOfficial() {
      const q = this.$route.query || {};
      const eventId = String(q.eventId || this.eventInfo._id || "");
      if (!eventId || typeof ipcRenderer === "undefined") return;

      const nextValue = !this.isOfficial;
      await new Promise((resolve) => {
        ipcRenderer.once("event:set-official-reply", (_e, res) => {
          if (res && res.ok) {
            this.isOfficial = nextValue;
            this.eventInfo = { ...this.eventInfo, resultsOfficial: nextValue };
          } else {
            ipcRenderer.send("get-alert", {
              type: "error",
              message: "Update Status",
              detail:
                res && res.error
                  ? res.error
                  : "Gagal mengubah status OFFICIAL/UNOFFICIAL.",
            });
          }
          resolve();
        });
        ipcRenderer.send("event:set-official", { eventId, value: nextValue });
      });
    },
    getScoreByRanked(ranked) {
      const found = this.dataScore.find((d) => d.ranking === Number(ranked));
      if (found) return found.score;
      const list = this.dataScore || [];
      const maxRank = list.length
        ? Math.max(...list.map((d) => d.ranking))
        : 0;
      if (Number(ranked) > maxRank) {
        return this.slalomDefaultScoreBeyondRank || 0;
      }
      return 0;
    },

    timeToMs(str) {
      if (!str) return Number.POSITIVE_INFINITY;
      const [hh = "0", mm = "0", ssms = "0"] = String(str).split(":");
      const [ss = "0", ms = "0"] = String(ssms).split(".");
      const h = parseInt(hh, 10) || 0,
        m = parseInt(mm, 10) || 0,
        s = parseInt(ss, 10) || 0,
        mil = parseInt(ms, 10) || 0;
      return h * 3600000 + m * 60000 + s * 1000 + mil;
    },

    // ---- Editing: Start/Finish Time, Start/Finish Penalty, Gate Penalty ----
    // (dulu tabel ini murni read-only + tombol "Action" mati total; sekarang
    // sama pola dgn Sprint/H2H Result: editable saat UNOFFICIAL, disimpan
    // via channel yg sama dgn menu Slalom Details.)

    // Daftar pilihan penalty (global optionPenalties "SLALOM") — sumber sama
    // dgn loadDataPenalties() di SlalomRace.vue.
    async loadDataPenalties(type) {
      try {
        if (typeof ipcRenderer === "undefined") return;
        await new Promise((resolve) => {
          ipcRenderer.send("option-penalties", type);
          ipcRenderer.once("option-penalties-reply", (_e, payload) => {
            const data =
              payload && payload[0] && Array.isArray(payload[0].data)
                ? payload[0].data
                : [];
            this.dataPenalties = data;
            resolve();
          });
        });
      } catch (error) {
        this.dataPenalties = [];
      }
    },

    // context: 'START' / 'FINISH' / 'GATE' — sama persis dgn
    // filteredPenalties() di SlalomRace.vue supaya daftar pilihannya identik,
    // termasuk override per-event dari Race Settings kalau ada.
    filteredPenalties(context) {
      const ctx = String(context || "").toUpperCase();
      if (ctx === "START") {
        return this.dataPenaltiesStart.length
          ? this.dataPenaltiesStart
          : this.dataPenalties.filter(
              (p) => p.value === 0 || p.value === 10 || p.value === 50
            );
      }
      if (ctx === "FINISH") {
        return this.dataPenaltiesFinish.length
          ? this.dataPenaltiesFinish
          : this.dataPenalties.filter(
              (p) => p.value === 0 || p.value === 10 || p.value === 50
            );
      }
      return this.dataPenaltiesGate.length
        ? this.dataPenaltiesGate
        : this.dataPenalties.filter(
            (p) => p.value === 0 || p.value === 5 || p.value === 50
          );
    },

    _parseHmsToMs(str) {
      const s = String(str || "").trim();
      const m = s.match(/^(\d{1,2}):([0-5]?\d):([0-5]?\d)(?:\.(\d{1,3}))?$/);
      if (!m) return NaN;
      const h = parseInt(m[1], 10) || 0;
      const mi = parseInt(m[2], 10) || 0;
      const se = parseInt(m[3], 10) || 0;
      const ms = parseInt((m[4] || "0").padEnd(3, "0"), 10) || 0;
      return h * 3600000 + mi * 60000 + se * 1000 + ms;
    },
    _msToHms(ms) {
      if (!Number.isFinite(ms) || ms < 0) return "";
      const pad = (n, w = 2) => String(Math.trunc(n)).padStart(w, "0");
      const hh = Math.floor(ms / 3600000);
      const mm = Math.floor((ms % 3600000) / 60000);
      const ss = Math.floor((ms % 60000) / 1000);
      const mss = Math.round(ms % 1000);
      return `${pad(hh, 2)}:${pad(mm, 2)}:${pad(ss, 2)}.${pad(mss, 3)}`;
    },

    // Hitung ulang Race Time, Penalty Total/Time, dan Total/Result Time satu
    // baris — dipanggil tiap kali Start/Finish Time, Start/Finish Penalty,
    // atau Gate Penalty diedit.
    recomputeSlalomRow(row) {
      const startMs = this._parseHmsToMs(row.startTime);
      const finishMs = this._parseHmsToMs(row.finishTime);
      row.raceTime =
        Number.isFinite(startMs) && Number.isFinite(finishMs) && finishMs >= startMs
          ? this._msToHms(finishMs - startMs)
          : "";

      const gateSum = Array.isArray(row.gatesDetail)
        ? row.gatesDetail.reduce((a, b) => a + (Number(b) || 0), 0)
        : 0;
      row.sectionPenalty = gateSum;
      row.totalPenalty =
        (Number(row.startPenalty) || 0) + (Number(row.finishPenalty) || 0) + gateSum;

      const penMs = row.totalPenalty * 1000;
      row.penaltyTime = this._msToHms(penMs) || "00:00:00.000";

      const raceMs = this._parseHmsToMs(row.raceTime);
      row.totalTime = Number.isFinite(raceMs) ? this._msToHms(raceMs + penMs) : "";
      row.resultTime =
        row.totalPenalty === 0 ? row.raceTime : row.totalTime || row.raceTime;
    },

    // Cari entry run asli (di this.rawResultItems, dokumen persis spt yg
    // dikirim SlalomRace.vue via insert-slalom-result) yg cocok dgn baris
    // tampilan `row` — dicocokkan lewat nama+bib+runIdx (bukan Object sama,
    // krn `row` hasil bentukan ulang buildResultRows()).
    _findRawRun(row) {
      const items = this.rawResultItems || [];
      const wantName = String(row.nameTeam || "").trim().toUpperCase();
      const wantBib = String(row.bibTeam || "").trim();

      function sessionIdxOf(run, ridx) {
        const s = String((run && run.session) || "").trim().toLowerCase();
        if (clean_1(s)) return 1;
        if (clean_2(s)) return 2;
        return ridx === 0 ? 1 : ridx === 1 ? 2 : null;
      }
      function clean_1(s) {
        return s === "1" || /\brun\s*1\b/.test(s) || /\b1\b/.test(s);
      }
      function clean_2(s) {
        return s === "2" || /\brun\s*2\b/.test(s) || /\b2\b/.test(s);
      }

      for (const doc of items) {
        if (!doc || !Array.isArray(doc.teams)) continue;
        for (const team of doc.teams) {
          const tName = String((team && team.nameTeam) || "").trim().toUpperCase();
          if (tName !== wantName) continue;
          const tBib = String(
            (team && (team.bibTeam || team.bibNumber)) || ""
          ).trim();
          if (wantBib && tBib && tBib !== wantBib) continue;

          const result = Array.isArray(team.result) ? team.result : [];
          for (let i = 0; i < result.length; i++) {
            if (sessionIdxOf(result[i], i) === row.runIdx) {
              return { doc, team, run: result[i] };
            }
          }
        }
      }
      return null;
    },

    // Rank + Score keseluruhan (lintas semua tim, berdasar best run) —
    // ditulis balik ke rawResultItems supaya yg tersimpan ke DB konsisten
    // dgn yg ditampilkan, sama pola dgn ranking di buildResultRows().
    _recomputeAllRanksAndScores() {
      const self = this;
      const bestByTeam = new Map();

      (this.rawResultItems || []).forEach((doc) => {
        if (!doc || !Array.isArray(doc.teams)) return;
        doc.teams.forEach((team) => {
          const key =
            String(team.nameTeam || "").trim().toUpperCase() +
            "|" +
            String(team.bibTeam || team.bibNumber || "").trim();
          const result = Array.isArray(team.result) ? team.result : [];
          result.forEach((run) => {
            const ms = self.timeToMs(run.totalTime || run.raceTime);
            if (!Number.isFinite(ms)) return;
            const prev = bestByTeam.get(key);
            if (!prev || ms < prev.ms) bestByTeam.set(key, { ms, run });
          });
        });
      });

      const ranked = Array.from(bestByTeam.values()).sort((a, b) => a.ms - b.ms);
      const bestRuns = new Set(ranked.map((v) => v.run));
      ranked.forEach((v, idx) => {
        const rank = idx + 1;
        v.run.ranked = rank;
        v.run.score = self.getScoreByRanked(rank);
      });

      // tim/run yg BUKAN best (atau tidak py waktu valid) → ranked/score 0,
      // supaya tidak ada nilai lama yg nyangkut.
      (this.rawResultItems || []).forEach((doc) => {
        if (!doc || !Array.isArray(doc.teams)) return;
        doc.teams.forEach((team) => {
          const result = Array.isArray(team.result) ? team.result : [];
          result.forEach((run) => {
            if (!bestRuns.has(run)) {
              run.ranked = 0;
              run.score = 0;
            }
          });
        });
      });
    },

    // Simpan SEMUA dokumen (this.rawResultItems, sudah termasuk edit
    // terbaru) — insert-slalom-result menerima array dokumen bucket persis
    // spt ini (lihat saveSession1() dkk di SlalomRace.vue).
    async saveRawResultsToDb() {
      if (typeof ipcRenderer === "undefined") return;
      await new Promise((resolve) => {
        ipcRenderer.once("insert-slalom-result-reply", (_e, res) => {
          if (!res || !res.ok) {
            ipcRenderer.send("get-alert", {
              type: "error",
              message: "Gagal menyimpan",
              detail: (res && res.error) || "",
            });
          }
          resolve();
        });
        ipcRenderer.send("insert-slalom-result", this.rawResultItems || []);
      });
    },

    // Dipanggil tiap kali Start/Finish Time, Start/Finish Penalty, atau Gate
    // Penalty (via saveGateModal) diedit di tabel: hitung ulang baris ini,
    // tulis balik ke rawResultItems, re-rank+re-score SEMUA tim, refresh
    // tampilan, lalu simpan ke DB.
    async onSlalomFieldChange(row) {
      if (this.isOfficial) return;
      this.recomputeSlalomRow(row);

      const found = this._findRawRun(row);
      if (found) {
        const r = found.run;
        r.startTime = row.startTime || "";
        r.finishTime = row.finishTime || "";
        r.raceTime = row.raceTime || "";
        r.penaltyTime = row.penaltyTime || "00:00:00.000";
        r.totalTime = row.totalTime || "";
        r.penaltyTotal = r.penaltyTotal && typeof r.penaltyTotal === "object" ? r.penaltyTotal : {};
        r.penaltyTotal.start = Number(row.startPenalty) || 0;
        r.penaltyTotal.finish = Number(row.finishPenalty) || 0;
        r.penaltyTotal.gates = Array.isArray(row.gatesDetail)
          ? row.gatesDetail.slice()
          : [];
      }

      this._recomputeAllRanksAndScores();
      this.results = this.buildResultRows(this.sessionMode);
      await this.saveRawResultsToDb();
    },

    normalizeResult(raw) {
      const base = {
        startTime: "",
        finishTime: "",
        raceTime: "",
        startPenalty: 0,
        finishPenalty: 0,
        sectionPenalty: 0,
        totalPenalty: 0,
        penaltyTime: "00:00:00.000",
        totalTime: "",
        resultTime: "",
        ranked: "",
        score: "",
      };

      const out = { ...base };

      if (raw && typeof raw === "object") {
        const p = raw.penaltyTotal || {};
        const gateSum = Array.isArray(p.gates)
          ? p.gates.reduce((a, b) => a + (Number(b) || 0), 0)
          : 0;

        // BUG FIX: dulu startTime/finishTime tidak pernah diekstrak dari
        // `raw` (run tersimpan) — kolom Start/Finish Time di tabel selalu
        // menampilkan fallback "00:00:00.000" apa pun data sebenarnya.
        out.startTime = String(raw.startTime || "");
        out.finishTime = String(raw.finishTime || "");
        out.raceTime = String(raw.raceTime || "");
        out.startPenalty = Number(p.start) || 0;
        out.finishPenalty = Number(p.finish) || 0;
        out.sectionPenalty = gateSum;
        out.totalPenalty =
          out.startPenalty + out.finishPenalty + out.sectionPenalty;
        out.penaltyTime = String(raw.penaltyTime || "00:00:00.000");
        out.totalTime = String(raw.totalTime || "");
        out.ranked = Number(raw.ranked) || 0;
        out.score = Number(raw.score) || 0;

        // kalau penaltyTime bukan 00:00:00.000 → totalTime
        const zeroPen = out.penaltyTime === "00:00:00.000";
        out.resultTime = zeroPen ? out.raceTime : out.totalTime || out.raceTime;
      }

      return out;
    },

    async loadSlalomResult() {
      const q = this.$route.query || {};
      if (!q.eventId || !q.initialId || !q.raceId || !q.divisionId) {
        this.error = "Parameter hasil tidak lengkap.";
        return;
      }

      this.loading = true;
      this.error = "";

      ipcRenderer.send("get-slalom-result", q);
      await new Promise((resolve) => {
        ipcRenderer.once("get-slalom-result-reply", (_e, res) => {
          try {
            if (!(res && res.ok && Array.isArray(res.items))) {
              this.results = [];
              this.error = (res && res.error) || "Gagal memuat hasil.";
              this.loading = false;
              resolve();
              return;
            }

            // simpan mentah
            this.rawResultItems = res.items;
            // bangun tampilan awal (All)
            this.results = this.buildResultRows("all");
            this.loading = false;
          } catch (err) {
            this.results = [];
            this.error = "Terjadi kesalahan saat memproses data.";
            this.loading = false;
          } finally {
            resolve();
          }
        });
      });
    },

    // PDF
    async generatePdf() {
      try {
        this.showPdf = true;
        await this.$nextTick();
        const inst = this.$refs.html2Pdf;
        if (!inst) return;
        await new Promise((r) => setTimeout(r, 200));
        await inst.generatePdf();
      } catch {
        this.error = "Gagal membuat PDF";
      }
    },

    downloadExcel() {
      const rows = (this.results || []).map((r) => ({
        No: r.teamIndex || "-",
        "Team Name": r.nameTeam || "-",
        BIB: r.bibTeam || "-",
        Run: r.session || "-",
        "Start Pen.": r.startPenalty || 0,
        "Finish Pen.": r.finishPenalty || 0,
        "Gate Pen.": r.sectionPenalty || 0,
        "Total Pen.": r.totalPenalty || 0,
        "Penalty Time": r.penaltyTime || "00:00:00.000",
        "Start Time": r.startTime || "00:00:00.000",
        "Finish Time": r.finishTime || "00:00:00.000",
        "Race Time": r.raceTime || "00:00:00.000",
        Result: r.resultTime || "00:00:00.000",
        Ranked: r.ranked || "-",
        Score:
          r.score !== undefined && r.score !== null && r.score !== ""
            ? r.score
            : this.getScoreByRanked(r.ranked) || 0,
      }));
      const eventName = (this.eventInfo && this.eventInfo.eventName) || "Event";
      exportRowsToExcel(`Slalom Result - ${eventName}`, rows, "Slalom Result");
    },
    onPdfGenerated() {
      this.showPdf = false;
    },
  },
};
</script>

<style scoped>
/* Input/select editable inline di tabel (Start/Finish Time, Start/Finish
   Penalty) — dipakai saat UNOFFICIAL. */
.cell-input {
  width: 100%;
  min-width: 100px;
  max-width: 130px;
  text-align: center;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  padding: 6px 8px;
  font: inherit;
  color: inherit;
  background: #fafbfc;
}
.cell-input:focus {
  outline: none;
  background: #fff;
  border-color: #368eb4;
}
.small-select {
  min-width: 70px;
  border-radius: 8px;
}

/* Nonaktifkan highlight hijau pada 3 kolom ini saja */
.best-row .no-cell,
.best-row .team-cell,
.best-row .bib-cell {
  background: #fff !important; /* samakan dengan warna sel normal */
}

.custom-btn-group .custom-btn {
  border-radius: 9999px; /* fully rounded pill shape */
  padding: 0.35rem 1rem;
  font-weight: 500;
  transition: all 0.25s ease;
  border: none;
}

/* Gradient background when active */
.custom-btn-group .custom-btn.btn-primary {
  background: linear-gradient(135deg, #007bff, #00b4d8);
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3);
}

/* Gradient hover for outline buttons */
.custom-btn-group .custom-btn.btn-outline-primary:hover {
  background: linear-gradient(135deg, #007bff, #00b4d8);
  color: #fff;
  border-color: transparent;
}

/* Active hover effect for solid button */
.custom-btn-group .custom-btn.btn-primary:hover {
  background: linear-gradient(135deg, #0066d3, #0096c7);
  box-shadow: 0 3px 10px rgba(0, 123, 255, 0.4);
}

/* Optional focus/active animation */
.custom-btn-group .custom-btn:active,
.custom-btn-group .custom-btn:focus {
  transform: scale(0.96);
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.best-row {
  background: #f2fff5 !important; /* hijau sangat muda */
}
.team .best-badge {
  margin-left: 8px;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: #14a44d;
  color: #fff;
  font-weight: 700;
  vertical-align: middle;
}
/* dalam <style scoped> */
.gate-modal-trigger {
  cursor: pointer;
  color: #005fa3;
  font-weight: 600;
  text-decoration: underline dotted #8ab4f8;
}

/* styling isi modal */
.gate-list {
  border: 1px solid #e6e9ef;
  border-radius: 10px;
  overflow: hidden;
}

.gate-row {
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #f1f3f7;
  align-items: center;
  font-size: 14px;
}

.gate-row:first-child {
  border-top: none;
}

.gate-head {
  background: #f7fbff;
  font-weight: 700;
  color: #194c7b;
}

.gate-row.has-penalty {
  background: #fff5f5;
}

.gate-val {
  text-align: right;
}

.empty-gates {
  padding: 16px;
  text-align: center;
  color: #8b8d97;
  font-style: italic;
}

.modal-actions {
  margin-top: 14px;
  text-align: right;
}

.modal-actions .btn {
  border-radius: 0.75rem; /* 3/4 rounded */
  background: linear-gradient(135deg, #007bff, #00b4d8);
  border: none;
  color: #fff;
  font-weight: 600;
  padding: 8px 18px;
  transition: all 0.25s ease-in-out;
  box-shadow: 0 3px 6px rgba(0, 123, 255, 0.3);
}

.modal-actions .btn:hover {
  background: linear-gradient(135deg, #0066d3, #0096c7);
  box-shadow: 0 5px 10px rgba(0, 123, 255, 0.45);
  transform: translateY(-1px);
}
/* ===== Page/Layout/Styles sama seperti Sprint untuk konsistensi ===== */
.result-wrap {
  padding: 18px;
  background: #f7f7f9;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  margin-top: 20px;
}
.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
}
.back-link {
  color: #1874a5 !important;
  font-weight: 600;
}
.muted {
  color: #8b8d97;
}
.sep {
  color: #c9cbd4;
}
.right-actions {
  display: flex;
  gap: 10px;
}
.action-btn {
  border-radius: 10px;
  padding: 8px 16px;
  font-weight: 600;
}

/* ---- Redesign: Download Result & Switch Category buttons ---- */
.right-actions >>> .btn-pill {
  display: inline-flex;
  align-items: center;
  padding: 9px 18px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13.5px;
  line-height: 1.2;
  border: 1.5px solid transparent;
  transition: transform 0.15s ease, box-shadow 0.15s ease,
    background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  text-decoration: none !important;
}
.right-actions >>> .btn-pill .caret-icon {
  margin-left: 8px;
  opacity: 0.75;
  transition: transform 0.15s ease;
}
.right-actions >>> .btn-pill[aria-expanded="true"] .caret-icon {
  transform: rotate(180deg);
}
.right-actions >>> .btn-pill--solid {
  background: linear-gradient(135deg, #2f96e0, #1c6fb0);
  color: #fff !important;
  box-shadow: 0 6px 16px rgba(28, 111, 176, 0.32);
}
.right-actions >>> .btn-pill--solid:hover,
.right-actions >>> .btn-pill--solid:focus {
  background: linear-gradient(135deg, #3aa3ec, #1f7bc2);
  box-shadow: 0 8px 20px rgba(28, 111, 176, 0.42);
  transform: translateY(-1px);
  color: #fff !important;
}
.right-actions >>> .btn-pill--solid:disabled {
  background: #cfd6de;
  box-shadow: none;
  color: #fff !important;
  transform: none;
}
.right-actions >>> .btn-pill--outline {
  background: #fff;
  color: #37475a !important;
  border-color: #dbe0e8;
}
.right-actions >>> .btn-pill--outline:hover,
.right-actions >>> .btn-pill--outline:focus {
  border-color: #1c6fb0;
  color: #1c6fb0 !important;
  background: #f2f9fd;
  transform: translateY(-1px);
}
.right-actions >>> .btn-pill--outline:disabled {
  background: #fff;
  border-color: #e4e7ed;
  color: #b4bac4 !important;
  transform: none;
}
.right-actions >>> .dropdown-menu--pill {
  border: 1px solid #eceff3;
  border-radius: 14px;
  box-shadow: 0 14px 34px rgba(20, 30, 45, 0.14);
  padding: 8px;
  margin-top: 8px;
}
.right-actions >>> .dropdown-menu--pill .dropdown-item {
  border-radius: 9px;
  padding: 9px 12px;
  font-weight: 600;
  font-size: 13.5px;
  color: #37475a;
  display: flex;
  align-items: center;
}
.right-actions >>> .dropdown-menu--pill .dropdown-item:hover,
.right-actions >>> .dropdown-menu--pill .dropdown-item:focus {
  background: #f2f9fd;
  color: #1c6fb0;
}
/* ---- End redesign ---- */

.card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(28, 39, 49, 0.06);
  padding: 18px 18px 8px;
}
.event-header {
  text-align: center;
  margin: 16px 0 20px;
}
.event-name {
  font-size: 28px;
  font-weight: 800;
  color: #2d2d2d;
  margin: 0;
}
.table-wrap {
  width: 100%;
  overflow-x: auto;
}
.result-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
}
.result-table thead th {
  background: #f4f5f7;
  color: #6a6f7a;
  font-weight: 700;
  font-size: 14px;
  padding: 12px 14px;
  border-bottom: 1px solid #eceef2;
}
.result-table tbody tr {
  background: #fff;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}
.result-table tbody td {
  padding: 14px;
  border-top: 1px solid #f0f2f6;
}
.team {
  font-weight: 600;
  color: #2b2f38;
}
.bold {
  font-weight: 800;
}
.text-center {
  text-align: center;
}
.loading-row {
  display: inline-flex;
  align-items: center;
  margin: 8px 0 12px;
  color: #6a6f7a;
}
.unofficial-stamp {
  color: #d9534f;
  font-weight: 700;
  text-transform: uppercase;
  border: 2px solid #d9534f;
  padding: 4px 10px;
  border-radius: 4px;
  transform: rotate(5deg);
  opacity: 0.8;
  font-size: 1.3rem;
  letter-spacing: 1px;
  display: inline-block;
}
.official-stamp {
  color: #148a3b;
  border-color: #148a3b;
  transform: rotate(0);
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(20, 138, 59, 0.12) inset;
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

/* ---- Styling utk Switch Slalom Category (dropdown toolbar) ---- */
.switch-category-panel {
  min-width: 260px;
}
/* ---- End styling utk Switch Slalom Category ---- */
</style>
