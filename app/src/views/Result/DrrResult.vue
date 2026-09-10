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
        <router-link :to="`/event-detail/${$route.params.id}`" class="muted">
          Dashboard
        </router-link>
        <span class="sep">›</span>
        <span class="muted">DRR Result</span>
      </div>

      <div class="right-actions">
        <b-dropdown
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
            Switch DRR Category
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
            DRR RESULT | {{ drrCats.initial }} - {{ drrCats.division }}
            {{ drrCats.race }}
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
        subtitle="Hasil DRR belum tersedia untuk kategori ini."
        primary-text="Kembali ke Event"
        @primary="goBack"
      />

      <!-- Table -->
      <div v-else class="table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th class="text-center">No</th>
              <th class="text-start">Team Name</th>
              <th class="text-center">BIB</th>
              <th class="text-center">Penalty Start</th>
              <th class="text-center">Penalty Section</th>
              <th class="text-center">Penalty Finish</th>
              <th class="text-center">Penalty Total</th>
              <th class="text-center">Penalty Time</th>
              <th class="text-center">Start Time</th>
              <th class="text-center">Finish Time</th>
              <th class="text-center">Race Time</th>
              <th class="text-center">Result</th>
              <th class="text-center">Ranked</th>
              <th class="text-center">Score</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(r, idx) in results" :key="idx">
              <td class="text-center">{{ idx + 1 }}</td>
              <td>
                <div class="team">
                  {{ r.nameTeam || "-" }}
                  <CountryFlag :code="flagFor(r.nameTeam)" />
                </div>
              </td>
              <td class="text-center">{{ r.bibTeam || "-" }}</td>
              <td class="text-center" style="color: red">
                <b-form-select
                  v-if="!isOfficial"
                  size="sm"
                  class="small-select"
                  :value="r.startPenalty"
                  :options="optionsWithCurrent('START', r.startPenalty)"
                  text-field="label"
                  value-field="value"
                  @change="
                    r.startPenalty = Number($event);
                    onDrrFieldChange(r);
                  "
                />
                <span v-else>{{ r.startPenalty || 0 }}</span>
              </td>
              <td class="text-center">
                <span
                  class="section-modal-trigger"
                  style="color: red"
                  role="button"
                  tabindex="0"
                  @click="openSectionModal(r)"
                  @keyup.enter="openSectionModal(r)"
                  title="Lihat/edit detail Section Penalty"
                >
                  {{ r.sectionPenalty || 0 }}
                </span>
              </td>
              <td class="text-center" style="color: red">
                <b-form-select
                  v-if="!isOfficial"
                  size="sm"
                  class="small-select"
                  :value="r.finishPenalty"
                  :options="optionsWithCurrent('FINISH', r.finishPenalty)"
                  text-field="label"
                  value-field="value"
                  @change="
                    r.finishPenalty = Number($event);
                    onDrrFieldChange(r);
                  "
                />
                <span v-else>{{ r.finishPenalty || 0 }}</span>
              </td>
              <td class="text-center" style="color: red">
                {{ r.totalPenalty || "0" }}
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
                    onDrrFieldChange(r);
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
                    onDrrFieldChange(r);
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
              <td class="text-center">{{ r.ranked || "-" }}</td>
              <td class="text-center">
                {{
                  r.score !== undefined && r.score !== null && r.score !== ""
                    ? r.score
                    : getScoreByRanked(r.ranked) || 0
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <b-modal
      v-model="showSectionModal"
      title="Section Penalty Time Detail"
      size="lg"
      hide-footer
      centered
    >
      <div class="mb-2">
        <div class="text-sm text-muted">
          <strong>Team:</strong> {{ sectionModal.team || "-" }} &nbsp; | &nbsp;
          <strong>BIB:</strong> {{ sectionModal.bib || "-" }}
        </div>
      </div>

      <div class="section-time-list">
        <div class="section-time-row section-time-head">
          <div class="text-center">Section</div>
          <div class="text-start">Penalty</div>
        </div>

        <div
          v-for="(val, i) in sectionModal.values"
          :key="i"
          class="section-time-row"
        >
          <div class="text-center">{{ i + 1 }}</div>
          <div class="mono" style="color: red">
            <b-form-select
              v-if="!isOfficial"
              size="sm"
              class="small-select"
              :value="val"
              :options="optionsWithCurrent('SECTION', val)"
              text-field="label"
              value-field="value"
              @change="$set(sectionModal.values, i, Number($event))"
            />
            <span v-else>{{ val }}</span>
          </div>
        </div>

        <div
          v-if="!sectionModal.values || sectionModal.values.length === 0"
          class="empty-section-times"
        >
          No section penalty time
        </div>
      </div>

      <div class="modal-actions">
        <b-button
          v-if="!isOfficial"
          variant="success"
          class="mr-2"
          @click="saveSectionModal"
          >Save</b-button
        >
        <b-button variant="secondary" @click="closeSectionModal"
          >Close</b-button
        >
      </div>
    </b-modal>

    <!-- Komponen PDF (disembunyikan dari layar, tapi ada di DOM) -->
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
      @beforeDownload="onBeforeDownload"
    >
      <section slot="pdf-content">
        <DrrPdf
          :data="pdfEventData"
          :dataParticipant="pdfParticipants"
          :categories="pdfCategories"
          :isOfficial="isOfficial"
          :drrCats="drrCats"
        />
      </section>
    </vue-html2pdf>

    <PrintOverallModal
      centered
      :show="showOverallModal"
      :dataEvent="eventInfo"
      :aggregate="dataAggregate"
      :raceCats="drrCats"
      :categories="visibleCategories"
      @close="showOverallModal = false"
    />
  </div>
</template>

<script>
import defaultImg from "@/assets/images/default-second.jpeg";
import EmptyStateFull from "@/components/EmptyStateFull.vue";
import VueHtml2pdf from "vue-html2pdf";
import DrrPdf from "../DetailEvent/ResultComponent/drr-pdfResult.vue";
import { ipcRenderer } from "electron";
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
import PrintOverallModal from "@/components/result/PrintOverallModal.vue";

/* ========= Helpers localStorage ========= */
const RACE_PAYLOAD_KEY = "raceStartPayload";
const EVENT_DETAILS_KEY = "eventDetails";

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
function evIdToString(ev) {
  if (ev && ev._id) {
    if (typeof ev._id === "object" && ev._id.$oid) return String(ev._id.$oid);
    return String(ev._id);
  }
  return "";
}
function currentEventIdFromBucket() {
  const payload = safeParse(localStorage.getItem(RACE_PAYLOAD_KEY) || "{}", {});
  const b = payload && payload.bucket ? payload.bucket : {};
  return String(b.eventId || "");
}
function pickEventFromStore() {
  const store = safeParse(
    localStorage.getItem(EVENT_DETAILS_KEY) || "null",
    null
  );
  if (!store) return {};
  const activeId = currentEventIdFromBucket();

  const isDict =
    typeof store === "object" &&
    !Array.isArray(store) &&
    !store.eventName &&
    !store._id;

  if (isDict) {
    if (activeId && store[activeId]) return store[activeId];
    const vals = Object.values(store);
    if (vals && vals.length > 0) return vals[0];
    return {};
  }

  if (Array.isArray(store)) {
    if (activeId) {
      let i = 0;
      while (i < store.length) {
        const ev = store[i];
        if (evIdToString(ev) === activeId) return ev;
        i++;
      }
    }
    return store[0] || {};
  }

  return store; // single object
}

export default {
  name: "DrrResult",
  components: {
    Icon,
    EmptyStateFull,
    DrrPdf,
    VueHtml2pdf,
    PrintOverallModal,
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
      showSectionModal: false,
      sectionModal: {
        team: "",
        bib: "",
        values: [],
        row: null,
      },
      // Override per-event dari Race Settings (Pilihan Pen. Start/Finish/
      // Section) — diisi di loadRaceSettings(); kosong = pakai dataPenalties
      // (daftar global optionPenalties "DRR").
      dataPenalties: [],
      dataPenaltiesStart: [],
      dataPenaltiesFinish: [],
      dataPenaltiesSection: [],
      // Dokumen mentah temporaryDrrResult (get-drr-result) — dipakai
      // onDrrFieldChange()/saveRawResultsToDbDrr() supaya edit inline
      // ditulis balik & disimpan lewat channel yg sama dgn Race Detail
      // (insert-drr-result), sama pola dgn rawResultItems di SlalomResult.vue.
      rawResultDocs: [],
      defaultImg,
      isOfficial: false,
      loading: false,
      error: "",
      results: [],
      showPdf: false,
      eventInfo: {},
      showOverallModal: false,
      dataAggregate: null,

      // DRR score table
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
      drrDefaultScoreBeyondRank: 0,
      // Jumlah Section per Race Settings (drr.totalSection) — dipakai
      // openSectionModal() utk memastikan modal selalu punya N slot Section
      // yg bisa diisi, bahkan utk tim yg BELUM PERNAH diberi nilai Section
      // sama sekali (sectionPenaltyTime tersimpan []) — tanpa ini, modal
      // permanen kosong ("No section penalty time") dan operator tidak
      // pernah bisa mengisi Section utk tim itu dari halaman Result ini.
      drrSectionsCount: 3,
      // On/off kolom tanda tangan di PDF Result — per kategori lewat Race
      // Settings, default TAMPIL (true), di-refresh di loadRaceSettings().
      showTechnicalDelegate: true,
      showChiefJudge: true,
      showRaceDirector: true,
    };
  },

  computed: {
    visibleCategories() {
      return getVisibleCategoryMeta(this.enabledCategoryKeys);
    },
    // Kombinasi statis Divisi x Race x Initial (dari config event, sama
    // seperti buildDrrOptions() di DownRiverRace.vue) — dipakai switcher
    // "Switch DRR Category" (flat select, sama seperti Race Detail-nya).
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
      const catTitle =
        "DRR (" +
        (this.drrCats.initial || "-") +
        " - " +
        (this.drrCats.division || "-") +
        " " +
        (this.drrCats.race || "-") +
        ")";
      parts.push(catTitle);
      return parts.join(" - ");
    },
    drrCats() {
      // BUG FIX: query dulu, localStorage cuma fallback — lihat catatan
      // di h2hCats() (HeadToHeadResult.vue)/sprintCats() (SprintResult.vue)
      // soal kenapa localStorage-first bikin judul basi setelah "Switch
      // DRR Category" (yg cuma ganti $route.query, tidak menyentuh
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

    // Data untuk komponen PDF
    // BUG FIX: dulu whitelist manual field yg dikirim ke drr-pdfResult.vue,
    // dan salah nama field logo ("event_logo", padahal field asli & yg
    // dibaca komponen PDF adalah "eventFiles" — sama typo dgn hasEventLogo/
    // eventLogoUrl di atas) SEKALIGUS lupa masukkan "sponsorFiles" ke
    // daftar — akibatnya logo Event & Sponsor di PDF DRR selalu kosong.
    // Sama pola dgn pdfEventData() di SprintResult.vue: spread langsung
    // this.eventInfo supaya field apa pun yg dibutuhkan komponen PDF (mis.
    // eventFiles/sponsorFiles) otomatis ikut tanpa perlu whitelist manual.
    pdfEventData() {
      return {
        ...this.eventInfo,
        levelName: this.eventInfo.levelName || "-",
        showTechnicalDelegate: this.showTechnicalDelegate,
        showChiefJudge: this.showChiefJudge,
        showRaceDirector: this.showRaceDirector,
      };
    },

    // ambil dari this.results penuh → bentuk yang dipakai PDF
    pdfParticipants() {
      const arr = [];
      const src = Array.isArray(this.results) ? this.results : [];
      let i = 0;
      while (i < src.length) {
        const r = src[i] || {};
        const rr = r.result || {};
        const sectionPenalty = Number(rr.sectionPenalty) || 0;

        // aturan: kalau sectionPenalty = 0 → sectionPenaltyTime = []
        let sectionPenaltyTime;
        if (sectionPenalty <= 0) {
          sectionPenaltyTime = [];
        } else {
          // normalisasi isi array waktu section (tanpa chaining)
          sectionPenaltyTime = [];
          const a = rr.sectionPenaltyTime;
          if (Array.isArray(a) && a.length > 0) {
            let j = 0;
            while (j < a.length) {
              const val = a[j] != null ? String(a[j]) : "00:00:00.000";
              sectionPenaltyTime.push(val);
              j++;
            }
          } else {
            // kalau penalti ada tapi array kosong dari sumber, isi default 3 slot nol
            sectionPenaltyTime = [
              "00:00:00.000",
              "00:00:00.000",
              "00:00:00.000",
            ];
          }
        }

        arr.push({
          nameTeam: r.nameTeam || "",
          bibTeam: r.bibTeam || "",
          countryCode: this.flagFor(r.nameTeam),
          result: {
            startTime: rr.startTime || "",
            finishTime: rr.finishTime || "",
            raceTime: rr.raceTime || "",
            startPenalty: Number(rr.startPenalty) || 0,
            finishPenalty: Number(rr.finishPenalty) || 0,
            sectionPenalty: sectionPenalty,
            totalPenalty:
              Number(rr.totalPenalty) ||
              (Number(rr.startPenalty) || 0) +
                (Number(rr.finishPenalty) || 0) +
                sectionPenalty,
            startPenaltyTime: rr.startPenaltyTime || "00:00:00.000",
            finishPenaltyTime: rr.finishPenaltyTime || "00:00:00.000",
            sectionPenaltyTime: sectionPenaltyTime,
            totalPenaltyTime:
              rr.totalPenaltyTime || rr.penaltyTime || "00:00:00.000",
            totalTime: rr.totalTime || r.resultTime || r.raceTime || "",
            ranked: rr.ranked || r.ranked || "",
            score:
              rr.score != null && rr.score !== ""
                ? Number(rr.score)
                : this.getScoreByRanked(rr.ranked || r.ranked) || 0,
            judgesBy: rr.judgesBy || "",
            judgesTime: rr.judgesTime || "",
          },
        });
        i++;
      }
      return arr;
    },

    pdfCategories() {
      const payload = safeParse(
        localStorage.getItem(RACE_PAYLOAD_KEY) || "{}",
        {}
      );
      const b = payload.bucket || {};
      const parts = [];
      if (b.divisionName) parts.push(b.divisionName);
      if (b.raceName) parts.push(b.raceName);
      if (b.initialName) parts.push(b.initialName);
      if (parts.length === 0) return "DRR";
      let i = 0;
      let title = "";
      while (i < parts.length) {
        if (i > 0) title += " – ";
        title += parts[i];
        i++;
      }
      return title;
    },
  },

  async created() {
    // Event info dari IPC atau localStorage
    const q = this.$route.query || {};
    if (q.eventId) {
      await this.loadEventById(q.eventId);
      this.registeredBuckets = await loadRegisteredBucketsByEvent(q.eventId);
      this.enabledCategoryKeys = await loadEnabledCategoryKeys(q.eventId);
      await this.loadDataPenalties("DRR");
      await this.loadRaceSettings(q.eventId);
    } else {
      const ev = pickEventFromStore();
      this.eventInfo = {
        eventName: ev.eventName || "",
        addressCity: ev.addressCity || ev.location || "",
        riverName: ev.riverName || "",
        levelName: ev.levelName || "",
        startDateEvent: ev.startDateEvent || "",
        endDateEvent: ev.endDateEvent || "",
        addressVillage: ev.addressVillage || "",
        addressDistrict: ev.addressDistrict || "",
        addressSubDistrict: ev.addressSubDistrict || "",
        addressProvince: ev.addressProvince || "",
        addressState: ev.addressState || "",
        addressZipCode: ev.addressZipCode || "",
        raceDirector: ev.raceDirector || "",
        chiefJudge: ev.chiefJudge || "",
        event_logo: ev.event_logo || [],
      };
      this.isOfficial = !!this.eventInfo.resultsOfficial;
    }

    this.loadDrrResult();
  },

  mounted() {},

  methods: {
    async loadRaceSettings(eventId) {
      try {
        if (typeof ipcRenderer === "undefined" || !eventId) return;
        await new Promise((resolve) => {
          ipcRenderer.once("race-settings:get-reply", (_e, res) => {
            const drrSettings = res && res.ok && res.settings && res.settings.drr;
            const scoreByRank =
              drrSettings && Array.isArray(drrSettings.scoreByRank)
                ? drrSettings.scoreByRank
                : null;
            if (scoreByRank && scoreByRank.length) {
              this.dataScore = scoreByRank.map((p) => ({
                ranking: Number(p.ranking) || 0,
                score: Number(p.score) || 0,
              }));
            }
            this.drrDefaultScoreBeyondRank =
              Number(drrSettings && drrSettings.defaultScoreBeyondRank) || 0;

            const totalSection = parseInt(
              drrSettings && drrSettings.totalSection,
              10
            );
            if (Number.isFinite(totalSection) && totalSection > 0) {
              this.drrSectionsCount = totalSection;
            }

            // Pilihan Pen. Start (PS) / Pen. Finish (PF) / Pen. Section —
            // override per-event dari Race Settings, sinkron dgn
            // fetchDrrSectionCountFromSettings() di DownRiverRace.vue supaya
            // dropdown editable di halaman Result ini identik dgn Race Detail.
            if (drrSettings) {
              const toList = (arr) =>
                Array.isArray(arr) && arr.length > 0
                  ? arr.map((p) => ({
                      label: String(p.label || p.value),
                      value: Number(p.value) || 0,
                    }))
                  : null;
              const startList = toList(drrSettings.startPenalties);
              const finishList = toList(drrSettings.finishPenalties);
              const sectionList = toList(drrSettings.sectionPenalties);
              if (startList) this.dataPenaltiesStart = startList;
              if (finishList) this.dataPenaltiesFinish = finishList;
              if (sectionList) this.dataPenaltiesSection = sectionList;
            }

            // On/off kolom Technical Delegate/Chief Judge/Race Director di
            // PDF Result DRR — diatur per kategori lewat Race Settings,
            // default TAMPIL (true) kalau belum pernah diatur.
            const boolOrDefault = (v, d) => (v === undefined || v === null ? d : !!v);
            this.showTechnicalDelegate = boolOrDefault(
              drrSettings && drrSettings.showTechnicalDelegate,
              true
            );
            this.showChiefJudge = boolOrDefault(
              drrSettings && drrSettings.showChiefJudge,
              true
            );
            this.showRaceDirector = boolOrDefault(
              drrSettings && drrSettings.showRaceDirector,
              true
            );

            resolve();
          });
          ipcRenderer.send("race-settings:get", eventId);
        });
      } catch (error) {
        // biarkan dataScore/dataPenalties* default kalau gagal memuat override
      }
    },

    async loadDataPenalties(type) {
      try {
        await new Promise((resolve) => {
          ipcRenderer.send("option-penalties", type);
          ipcRenderer.once("option-penalties-reply", (_e, payload) => {
            const data =
              payload && payload[0] && Array.isArray(payload[0].data)
                ? payload[0].data
                : [];
            this.dataPenalties = data;
            // dipakai sebagai fallback sebelum race-settings per-event dimuat
            this.dataPenaltiesStart = data;
            this.dataPenaltiesFinish = data;
            this.dataPenaltiesSection = data;
            resolve();
          });
        });
      } catch (error) {
        this.dataPenalties = [];
      }
    },

    // context: 'START' / 'FINISH' / 'SECTION' — sama pola dgn
    // filteredPenalties() di SlalomResult.vue, sinkron dgn override per-event
    // dari Race Settings (Pilihan Pen. Start/Finish/Section).
    filteredPenalties(context) {
      const ctx = String(context || "").toUpperCase();
      const src =
        ctx === "START"
          ? this.dataPenaltiesStart
          : ctx === "FINISH"
          ? this.dataPenaltiesFinish
          : this.dataPenaltiesSection;
      return Array.isArray(src) && src.length ? src : this.dataPenalties || [];
    },

    // BUG FIX: kalau nilai penalty yg TERSIMPAN (mis. dari sebelum Race
    // Settings dikustomisasi, atau lewat jalur lain) TIDAK ada di daftar
    // preset filteredPenalties(), <select> native tampil KOSONG/blank total
    // (tidak match opsi manapun) walau datanya sebenarnya ADA — operator
    // bisa salah kira field itu belum diisi & menimpanya tanpa sadar (mis.
    // Section 5 blank di modal Section Penalty Time Detail padahal ada
    // nilai valid tersimpan). Selipkan opsi sintetis utk value saat ini
    // kalau belum ada di daftar preset, supaya select SELALU menampilkan
    // apa yg sebenarnya tersimpan.
    optionsWithCurrent(context, val) {
      const opts = (this.filteredPenalties(context) || []).slice();
      const n = Number(val);
      if (Number.isFinite(n) && !opts.some((o) => Number(o.value) === n)) {
        opts.push({ label: String(n), value: n });
      }
      return opts;
    },

    // sekunder BERTANDA (boleh minus, bonus dari Pilihan Pen. Section) →
    // string "±HH:MM:SS.000" — sama pola dgn secondsToTimeString() di
    // DownRiverRace.vue.
    secondsToTimeString(totalSec) {
      const raw = Number(totalSec) || 0;
      const neg = raw < 0;
      const t = Math.abs(raw);
      const sec = Math.floor(t % 60);
      const min = Math.floor((t / 60) % 60);
      const hr = Math.floor(t / 3600);
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${neg ? "-" : ""}${pad(hr)}:${pad(min)}:${pad(sec)}.000`;
    },

    // Kebalikan secondsToTimeString() — parse "±HH:MM:SS.mmm" jadi detik
    // bertanda. Tanpa lookup tabel (value SELALU berarti detik langsung —
    // sama fix pattern dgn timeToPenaltyValue() di DownRiverRace.vue).
    timeToPenaltyValue(timeStr) {
      const p = String(timeStr || "");
      const neg = p.startsWith("-");
      const t = p.replace("-", "");
      const [hh = "0", mm = "0", ssms = "0"] = t.split(":");
      const ss = parseFloat(ssms) || 0;
      const hhNum = parseFloat(hh) || 0;
      const mmNum = parseFloat(mm) || 0;
      const val = hhNum * 3600 + mmNum * 60 + ss;
      // safety net: data lama/tidak standar (bukan "-"? "HH:MM:SS.mmm")
      // seharusnya sudah ternormalisasi jadi 0 lewat fallback `|| 0` di
      // atas, tapi kalau tetap lolos jadi NaN, Math.round(NaN) tetap NaN —
      // dan NaN bikin optionsWithCurrent() gagal menyisipkan opsi sintetis
      // (Number.isFinite(NaN) === false), jadi select tetap blank walau
      // sudah diberi fallback. Floor terakhir ke 0 supaya select SELALU
      // punya nilai valid yg bisa direpresentasikan.
      const rounded = Math.round(val);
      return Number.isFinite(rounded) ? (neg ? -1 : 1) * rounded : 0;
    },

    // Buka modal Section — KHUSUS Unofficial: tiap section jadi select
    // editable (nilai numerik, boleh minus/bonus), sama pola dgn Gate
    // Penalty Detail di SlalomResult.vue. Saat Official, tetap read-only.
    openSectionModal(row) {
      this.sectionModal.team = row && row.nameTeam ? row.nameTeam : "";
      this.sectionModal.bib = row && row.bibTeam ? row.bibTeam : "";
      const raw = Array.isArray(row && row.sectionPenaltyTime)
        ? row.sectionPenaltyTime
        : [];
      // BUG FIX: dulu ditampilkan sbg string waktu tervalidasi via
      // normalizeHMSms()/isValidHMSms() — keduanya menolak prefix "-",
      // jadi section dgn bonus (mis. "-00:00:10.000") ke-flatten jadi
      // "00:00:00.000" (data section HILANG dari modal, padahal penalty
      // total sudah benar terhitung). Sekarang dikonversi ke angka
      // (timeToPenaltyValue(), support minus) supaya nilai section apa pun
      // — termasuk bonus — tampil apa adanya di modal.
      const values = raw.map((v) => this.timeToPenaltyValue(v));
      // BUG FIX: kalau tim ini BELUM PERNAH diberi nilai Section sama
      // sekali, sectionPenaltyTime tersimpan [] — tanpa padding ke
      // drrSectionsCount, modal permanen kosong ("No section penalty
      // time") & operator tidak pernah bisa mulai mengisi Section utk tim
      // itu dari halaman Result ini sama sekali (beda dgn Race Detail yg
      // selalu punya N slot select dari awal).
      const n =
        Number.isFinite(this.drrSectionsCount) && this.drrSectionsCount > 0
          ? this.drrSectionsCount
          : 3;
      // pad ke minimal n slot; kalau data lama justru punya LEBIH banyak
      // section (mis. Total Section pernah diperbesar lalu dikecilkan lagi),
      // tetap dipertahankan semua — bukan dipotong — supaya tidak ada data
      // yg diam2 hilang.
      while (values.length < n) values.push(0);
      this.sectionModal.values = values;
      this.sectionModal.row = row || null;
      this.showSectionModal = true;
    },

    closeSectionModal() {
      this.showSectionModal = false;
      this.sectionModal.row = null;
    },

    // Simpan perubahan Section dari modal — KHUSUS Unofficial. Hitung ulang
    // sectionPenalty (sum) & sectionPenaltyTime (array string, utk
    // konsistensi format penyimpanan dgn Race Detail), lalu recompute+save
    // lewat onDrrFieldChange() spt field lainnya.
    async saveSectionModal() {
      if (this.isOfficial || !this.sectionModal.row) {
        this.showSectionModal = false;
        return;
      }
      const row = this.sectionModal.row;
      const values = (this.sectionModal.values || []).map(
        (v) => Number(v) || 0
      );
      row.sectionPenaltyTime = values.map((v) => this.secondsToTimeString(v));
      row.sectionPenalty = values.reduce((a, b) => a + b, 0);
      this.showSectionModal = false;
      this.sectionModal.row = null;
      await this.onDrrFieldChange(row);
    },

    // "HH:MM:SS.mmm" (non-negatif) -> ms; NaN kalau tidak valid.
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
    // ms (non-negatif) -> "HH:MM:SS.mmm"
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
    // atau Section Penalty (via saveSectionModal) diedit. penaltyTime BOLEH
    // minus (bonus dari Pilihan Pen. Section) — beda dgn raceTime/totalTime
    // yg tetap non-negatif (di-floor 0 kalau bonus lebih besar drpd raceTime).
    recomputeDrrRow(row) {
      const startMs = this._parseHmsToMs(row.startTime);
      const finishMs = this._parseHmsToMs(row.finishTime);
      row.raceTime =
        Number.isFinite(startMs) &&
        Number.isFinite(finishMs) &&
        finishMs >= startMs
          ? this._msToHms(finishMs - startMs)
          : row.raceTime || "";

      row.totalPenalty =
        (Number(row.startPenalty) || 0) +
        (Number(row.finishPenalty) || 0) +
        (Number(row.sectionPenalty) || 0);

      const penMs = row.totalPenalty * 1000;
      row.penaltyTime = this.secondsToTimeString(row.totalPenalty);
      row.totalPenaltyTime = row.penaltyTime;

      const raceMs = this._parseHmsToMs(row.raceTime);
      row.totalTime = Number.isFinite(raceMs)
        ? this._msToHms(Math.max(0, raceMs + penMs))
        : "";
      row.resultTime =
        row.totalPenalty === 0 ? row.raceTime : row.totalTime || row.raceTime;
    },

    // Cari tim asli (di this.rawResultDocs, dokumen persis spt yg dikirim
    // DownRiverRace.vue via insert-drr-result) yg cocok dgn baris tampilan
    // `row` — dicocokkan lewat nama+bib, sama pola dgn _findRawRun() di
    // SlalomResult.vue (DRR single-run, jadi tidak perlu cocokkan session).
    _findRawTeam(row) {
      const docs = this.rawResultDocs || [];
      const wantName = String((row && row.nameTeam) || "").trim().toUpperCase();
      const wantBib = String((row && row.bibTeam) || "").trim();
      for (const doc of docs) {
        const teams = Array.isArray(doc && doc.result) ? doc.result : [];
        for (const team of teams) {
          const tName = String(team.nameTeam || "").trim().toUpperCase();
          const tBib = String(team.bibTeam || "").trim();
          if (tName === wantName && (!wantBib || tBib === wantBib)) {
            return { doc, team };
          }
        }
      }
      return null;
    },

    // Simpan SEMUA dokumen (this.rawResultDocs, sudah termasuk edit
    // terbaru) — insert-drr-result menerima ARRAY DATAR per-tim (bukan
    // dibungkus per-bucket spt temporaryDrrResult), persis spt buildResultDocs()
    // di DownRiverRace.vue, jadi di-flatten dulu di sini.
    async saveRawResultsToDbDrr() {
      if (typeof ipcRenderer === "undefined") return;
      const flat = [];
      (this.rawResultDocs || []).forEach((doc) => {
        const teams = Array.isArray(doc && doc.result) ? doc.result : [];
        teams.forEach((team) => {
          flat.push({
            eventId: doc.eventId,
            initialId: doc.initialId,
            raceId: doc.raceId,
            divisionId: doc.divisionId,
            eventName: doc.eventName || "DRR",
            initialName: doc.initialName,
            raceName: doc.raceName,
            divisionName: doc.divisionName,
            nameTeam: team.nameTeam,
            bibTeam: team.bibTeam,
            startOrder: team.startOrder,
            praStart: team.praStart,
            intervalRace: team.intervalRace,
            statusId: team.statusId,
            result: team.result,
            otr: team.otr,
          });
        });
      });
      if (!flat.length) return;
      await new Promise((resolve) => {
        ipcRenderer.once("insert-drr-result-reply", (_e, res) => {
          if (!res || !res.ok) {
            ipcRenderer.send("get-alert", {
              type: "error",
              message: "Gagal menyimpan",
              detail: (res && res.error) || "",
            });
          }
          resolve();
        });
        ipcRenderer.send("insert-drr-result", flat);
      });
    },

    // Dipanggil tiap kali Start/Finish Time, Start/Finish Penalty, atau
    // Section Penalty (via saveSectionModal) diedit di tabel: hitung ulang
    // baris ini, tulis balik ke rawResultDocs, refresh tampilan (rank/score
    // ditentukan ulang oleh rankAndScoreFullRows() di dalam
    // _buildResultsFromDocs(), yg juga dipakai loadDrrResult() — jadi TIDAK
    // perlu recompute rank/score terpisah di sini, itu cuma bikin dua sumber
    // kebenaran yg saling menimpa tanpa efek nyata), lalu simpan ke DB —
    // backend insertDrrResult() tetap menghitung ulang ranked/score final
    // secara otoritatif dari data tersimpan, terlepas dari apa yg dikirim.
    async onDrrFieldChange(row) {
      if (this.isOfficial) return;
      this.recomputeDrrRow(row);

      const found = this._findRawTeam(row);
      if (found) {
        const r =
          found.team.result && typeof found.team.result === "object"
            ? found.team.result
            : {};
        r.startTime = row.startTime || "";
        r.finishTime = row.finishTime || "";
        r.raceTime = row.raceTime || "";
        r.startPenalty = Number(row.startPenalty) || 0;
        r.finishPenalty = Number(row.finishPenalty) || 0;
        r.sectionPenalty = Number(row.sectionPenalty) || 0;
        r.totalPenalty = Number(row.totalPenalty) || 0;
        r.sectionPenaltyTime = Array.isArray(row.sectionPenaltyTime)
          ? row.sectionPenaltyTime.slice()
          : [];
        r.penaltyTime = row.penaltyTime || "00:00:00.000";
        r.totalPenaltyTime = row.penaltyTime || "00:00:00.000";
        r.totalTime = row.totalTime || "";
        found.team.result = r;
      }

      // Rebuild lokal dari rawResultDocs yg BARU dimutasi di atas — BUKAN
      // refetch (loadDrrResult()) yg akan menimpa balik edit ini dgn versi
      // DB lama sebelum sempat tersimpan.
      this._buildResultsFromDocs(this.rawResultDocs);
      await this.saveRawResultsToDbDrr();
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
          eventName: "DRR",
          initialName: b.initialName,
          raceName: b.raceName,
          divisionName: b.divisionName,
        },
      });
    },

    // ambil detail event dari IPC
    async loadEventById(eventId) {
      try {
        this.loading = true;
        ipcRenderer.send("get-events-byid", eventId);

        await new Promise((resolve) => {
          ipcRenderer.once("get-events-byid-reply", (_e, res) => {
            this.loading = false;
            if (res && typeof res === "object") {
              this.eventInfo = res;
              this.isOfficial = !!this.eventInfo.resultsOfficial;
            } else {
              this.eventInfo = {};
              this.error = "Gagal memuat data event.";
            }
            resolve();
          });
        });
      } catch (err) {
        this.loading = false;
        this.error = "Terjadi kesalahan saat memuat event.";
        this.eventInfo = {};
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

    resolveBucket() {
      const q = this.$route.query || {};
      const payload = safeParse(
        localStorage.getItem(RACE_PAYLOAD_KEY) || "{}",
        {}
      );
      const b = payload.bucket || {};
      return {
        eventId: String(q.eventId || b.eventId || ""),
        initialId: String(q.initialId || b.initialId || ""),
        raceId: String(q.raceId || b.raceId || ""),
        divisionId: String(q.divisionId || b.divisionId || ""),
      };
    },

    fetchEventResultsAggregate() {
      var f = this.resolveBucket();
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
          self.dataAggregate = self.buildAggregateFromDoc(
            res.doc,
            self.eventInfo
          );
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

    buildAggregateFromDoc(doc, eventInfo) {
      var headerTitle =
        (doc && doc.eventName) || (eventInfo && eventInfo.eventName) || "";
      var sub = "";
      if (doc && doc.divisionName) sub = String(doc.divisionName);
      if (doc && doc.initialName)
        sub = sub
          ? sub + " • " + String(doc.initialName)
          : String(doc.initialName);
      var d = new Date();
      var dateStr = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      var header = {
        title: headerTitle || "—",
        subTitle: sub || "—",
        dateStr: dateStr,
        official: false,
        chiefJudge:
          eventInfo && eventInfo.chiefJudge ? eventInfo.chiefJudge : "",
      };
      var rows = [];
      var arr = doc && Array.isArray(doc.eventResult) ? doc.eventResult : [];
      for (var i = 0; i < arr.length; i++) {
        var t = arr[i] || {};
        var cats = t && Array.isArray(t.categories) ? t.categories : [];
        var sprintScore = 0,
          sprintRank = 0,
          h2hScore = 0,
          h2hRank = 0,
          slalomScore = 0,
          slalomRank = 0,
          drrScore = 0,
          drrRank = 0,
          rxScore = 0,
          rxRank = 0;
        for (var j = 0; j < cats.length; j++) {
          var c = cats[j] || {};
          var nm = c && typeof c.name === "string" ? c.name.toUpperCase() : "";
          var sc = Number(c.scored) || 0;
          var rk = Number(c.rankedByCats) || 0;
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
        var teamName = t.teamName || "";
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
          bib: t.bib || "",
          countryCode: this.flagFor(t.teamName),
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

    getScoreByRanked(ranked) {
      let i = 0;
      const r = Number(ranked);
      let maxRank = 0;
      while (i < this.dataScore.length) {
        const row = this.dataScore[i];
        if (row && row.ranking > maxRank) maxRank = row.ranking;
        if (row && row.ranking === r) return row.score;
        i++;
      }
      if (r > maxRank) return this.drrDefaultScoreBeyondRank || 0;
      return 0;
    },

    /** Normalisasi DATAR untuk keperluan tabel (disimpan juga di top-level) */
    normalizeResultFlat(raw) {
      const r = raw && raw.result ? raw.result : {};

      const startPenalty = Number(r.startPenalty) || 0;
      const finishPenalty = Number(r.finishPenalty) || 0;
      const sectionPenalty = Number(r.sectionPenalty) || 0;
      const totalPenalty =
        Number(r.totalPenalty) || startPenalty + finishPenalty + sectionPenalty;

      const startTime = r.startTime ? String(r.startTime) : "";
      const finishTime = r.finishTime ? String(r.finishTime) : "";
      const raceTime = r.raceTime ? String(r.raceTime) : "";

      const totalPenaltyTime =
        r.totalPenaltyTime || r.penaltyTime || "00:00:00.000";
      const totalTime = r.totalTime ? String(r.totalTime) : "";

      let isZeroPenTime = false;
      if (totalPenaltyTime === "00:00:00.000") {
        if (!r.penaltyTime || r.penaltyTime === "00:00:00.000")
          isZeroPenTime = true;
      }
      const resultTime = isZeroPenTime ? raceTime : totalTime || raceTime;

      return {
        startTime: startTime,
        finishTime: finishTime,
        raceTime: raceTime,
        startPenalty: startPenalty,
        finishPenalty: finishPenalty,
        sectionPenalty: sectionPenalty,
        totalPenalty: totalPenalty,
        startPenaltyTime: r.startPenaltyTime || "00:00:00.000",
        finishPenaltyTime: r.finishPenaltyTime || "00:00:00.000",
        totalPenaltyTime: totalPenaltyTime,
        penaltyTime: r.penaltyTime || totalPenaltyTime,
        totalTime: totalTime,
        ranked: Number(r.ranked) || 0,
        score: Number(r.score) || 0,
        resultTime: resultTime,
      };
    },

    /** "HH:MM:SS.mmm" -> ms */
    timeToMs(str) {
      if (!str) return Number.POSITIVE_INFINITY;
      const s = String(str);
      const p = s.split(":");
      const hh = p[0] || "0";
      const mm = p[1] || "0";
      const ssms = p[2] || "0";
      const sp = String(ssms).split(".");
      const ss = sp[0] || "0";
      const ms = sp[1] || "0";
      let h = parseInt(hh, 10);
      let m = parseInt(mm, 10);
      let si = parseInt(ss, 10);
      let mi = parseInt(ms, 10);
      if (!Number.isFinite(h)) h = 0;
      if (!Number.isFinite(m)) m = 0;
      if (!Number.isFinite(si)) si = 0;
      if (!Number.isFinite(mi)) mi = 0;
      return h * 3600000 + m * 60000 + si * 1000 + mi;
    },

    /** Ranking + score (pakai result.__resultMs) */
    rankAndScoreFullRows(rows) {
      // kumpulkan indeks yang punya waktu valid
      const idx = [];
      let i = 0;
      while (i < rows.length) {
        const r = rows[i] && rows[i].result ? rows[i].result : null;
        if (r && Number.isFinite(r.__resultMs)) idx.push(i);
        i++;
      }

      // selection sort idx berdasarkan __resultMs
      let a = 0;
      while (a < idx.length - 1) {
        let minPos = a;
        let b = a + 1;
        while (b < idx.length) {
          const ia = idx[minPos];
          const ib = idx[b];
          const msa = rows[ia].result.__resultMs;
          const msb = rows[ib].result.__resultMs;
          if (msb < msa) minPos = b;
          b++;
        }
        if (minPos !== a) {
          const tmp = idx[a];
          idx[a] = idx[minPos];
          idx[minPos] = tmp;
        }
        a++;
      }

      // assign rank + score
      let rank = 1;
      let k = 0;
      while (k < idx.length) {
        const irow = idx[k];
        rows[irow].result.ranked = rank;
        if (!rows[irow].result.score) {
          rows[irow].result.score = this.getScoreByRanked(rank);
        }
        // sinkronkan field datar untuk tabel
        rows[irow].ranked = rows[irow].result.ranked;
        rows[irow].score = rows[irow].result.score;
        k++;
        rank++;
      }
    },

    async loadDrrResult() {
      const q = this.$route.query || {};
      if (!q.eventId || !q.initialId || !q.raceId || !q.divisionId) {
        this.error = "Parameter hasil tidak lengkap.";
        return;
      }

      this.loading = true;
      this.error = "";

      ipcRenderer.send("get-drr-result", q);

      let timeoutId;
      const TIMEOUT_MS = 8000;

      await new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          this.loading = false;
          this.error = "Gagal memuat hasil (timeout). Coba ulangi.";
          resolve();
        }, TIMEOUT_MS);

        ipcRenderer.once("get-drr-result-reply", (_e, res) => {
          clearTimeout(timeoutId);

          try {
            if (!(res && res.ok && Array.isArray(res.items))) {
              this.results = [];
              this.rawResultDocs = [];
              this.error = (res && res.error) || "Gagal memuat hasil.";
              this.loading = false;
              resolve();
              return;
            }

            // Simpan dokumen mentah (bukan cuma field datar hasil normalize)
            // supaya edit inline (onDrrFieldChange()) bisa ditulis balik ke
            // bentuk asli & disimpan lewat insert-drr-result — sama pola dgn
            // rawResultItems di SlalomResult.vue.
            this.rawResultDocs = res.items;
            this._buildResultsFromDocs(this.rawResultDocs);
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

    // Susun this.results (field datar utk tabel) dari dokumen mentah —
    // dipanggil dari loadDrrResult() (data baru dari DB) DAN dari
    // onDrrFieldChange() (rebuild lokal dari rawResultDocs yg SUDAH dimutasi
    // in-memory, TANPA fetch ulang — refetch di sini akan menimpa balik edit
    // yg belum sempat tersimpan dgn data DB yg masih lama).
    _buildResultsFromDocs(docs) {
      try {
        // --- helper kecil ---
        const asStr = (v, d = "") => (v == null ? d : String(v));

            const asNum = (v, d = 0) => {
              const n = Number(v);
              return Number.isFinite(n) ? n : d;
            };

            const timeOrZero = (t) => {
              const s = asStr(t, "");
              return s ? s : "00:00:00.000";
            };

            // NORMALISASI PENUH satu tim (lengkap, plus field datar utk tabel)
            const normalizeTeamFull = (team) => {
              const rIn = (team && team.result) || {};

              const startPenalty = asNum(rIn.startPenalty, 0);
              const finishPenalty = asNum(rIn.finishPenalty, 0);
              const sectionPenalty = asNum(rIn.sectionPenalty, 0);
              const totalPenalty = asNum(
                rIn.totalPenalty,
                startPenalty + finishPenalty + sectionPenalty
              );

              const startPenaltyTime = timeOrZero(rIn.startPenaltyTime);
              const finishPenaltyTime = timeOrZero(rIn.finishPenaltyTime);

              // BUG FIX: dulu di-gate oleh "sectionPenalty > 0" (SUM semua
              // section) — begitu Pen. Section boleh minus (bonus), sum bisa
              // 0 walau section-nya SENDIRI terisi (mis. +10 di Section 1 &
              // -10 di Section 2, net 0) — aturan lama membuang array itu
              // jadi [] sama sekali, sehingga modal "Section Penalty Time
              // Detail" salah menampilkan "tidak ada data" padahal section
              // sebenarnya sudah diisi. Sumber kebenaran section adalah
              // ARRAY rIn.sectionPenaltyTime itu sendiri, bukan sum-nya.
              const sectionPenaltyTime = Array.isArray(rIn.sectionPenaltyTime)
                ? rIn.sectionPenaltyTime.map((v) => timeOrZero(v))
                : [];

              const penaltyTimeSrc =
                rIn.totalPenaltyTime != null
                  ? rIn.totalPenaltyTime
                  : rIn.penaltyTime;
              const penaltyTime = timeOrZero(penaltyTimeSrc);

              const raceTime = asStr(rIn.raceTime, "");
              const totalTime = asStr(
                rIn.totalTime != null ? rIn.totalTime : raceTime,
                ""
              );

              let isZeroPen = false;
              if (penaltyTime === "00:00:00.000") {
                if (!rIn.penaltyTime || rIn.penaltyTime === "00:00:00.000")
                  isZeroPen = true;
              }
              const resultTime = isZeroPen ? raceTime : totalTime || raceTime;

              const resultObj = {
                startTime: timeOrZero(rIn.startTime),
                finishTime: timeOrZero(rIn.finishTime),
                raceTime: raceTime,
                startPenalty: startPenalty,
                finishPenalty: finishPenalty,
                sectionPenalty: sectionPenalty,
                totalPenalty: totalPenalty,
                startPenaltyTime: startPenaltyTime,
                finishPenaltyTime: finishPenaltyTime,
                sectionPenaltyTime: sectionPenaltyTime,
                totalPenaltyTime: penaltyTime,
                totalTime: totalTime,
                ranked: asNum(rIn.ranked, 0),
                score: asNum(rIn.score, 0),
                judgesBy: asStr(rIn.judgesBy, ""),
                judgesTime: asStr(rIn.judgesTime, ""),
                __resultTime: resultTime,
                __resultMs: this.timeToMs(resultTime), // langsung pakai this
              };

              const otrObj = {
                startTime: asStr(team && team.otr && team.otr.startTime, ""),
                finishTime: asStr(team && team.otr && team.otr.finishTime, ""),
                raceTime: asStr(team && team.otr && team.otr.raceTime, ""),
                penaltyStartTime: asStr(
                  team && team.otr && team.otr.penaltyStartTime,
                  ""
                ),
                penaltyFinishTime: asStr(
                  team && team.otr && team.otr.penaltyFinishTime,
                  ""
                ),
                penaltySection: (() => {
                  const a = team && team.otr && team.otr.penaltySection;
                  if (Array.isArray(a)) {
                    const out = [];
                    let i2 = 0;
                    while (i2 < a.length) {
                      out.push(asStr(a[i2], ""));
                      i2++;
                    }
                    return out;
                  }
                  return ["", "", ""];
                })(),
                penaltyTime: asStr(
                  team && team.otr && team.otr.penaltyTime,
                  ""
                ),
                totalTime: asStr(team && team.otr && team.otr.totalTime, ""),
                ranked: asStr(team && team.otr && team.otr.ranked, ""),
                score: asStr(team && team.otr && team.otr.score, ""),
                penalty: asStr(team && team.otr && team.otr.penalty, ""),
              };

              // objek akhir per tim (lengkap) + field datar untuk tabel
              const flat = this.normalizeResultFlat({ result: resultObj });
              return {
                nameTeam: asStr(team && team.nameTeam, ""),
                bibTeam: asStr(team && team.bibTeam, ""),
                startOrder: asStr(team && team.startOrder, ""),
                praStart: asStr(team && team.praStart, ""),
                intervalRace: asStr(team && team.intervalRace, ""),
                statusId: asNum(team && team.statusId, 0),

                // hasil lengkap
                result: resultObj,
                otr: otrObj,

                // field datar supaya tabel tetap jalan seperti sekarang
                startTime: flat.startTime,
                finishTime: flat.finishTime,
                raceTime: flat.raceTime,
                startPenalty: flat.startPenalty,
                finishPenalty: flat.finishPenalty,
                sectionPenalty: flat.sectionPenalty,
                totalPenalty: flat.totalPenalty,
                startPenaltyTime: flat.startPenaltyTime,
                finishPenaltyTime: flat.finishPenaltyTime,
                totalPenaltyTime: flat.totalPenaltyTime,
                penaltyTime: flat.penaltyTime,
                totalTime: flat.totalTime,
                resultTime: flat.resultTime,
                ranked: flat.ranked,
                score: flat.score,
                sectionPenaltyTime: resultObj.sectionPenaltyTime,
              };
            };

        // rakit rows penuh
        const rows = [];
        const items = Array.isArray(docs) ? docs : docs ? [docs] : [];
        for (const doc of items) {
          const teams = doc && Array.isArray(doc.result) ? doc.result : [];
          for (const team of teams) rows.push(normalizeTeamFull(team));
        }

        // ranking + score, sinkronkan ke field datar
        this.rankAndScoreFullRows(rows);

        // bersihkan field internal
        let ci = 0;
        while (ci < rows.length) {
          if (rows[ci] && rows[ci].result) {
            delete rows[ci].result.__resultTime;
            delete rows[ci].result.__resultMs;
          }
          ci++;
        }

        this.results = rows; // SIMPAN PENUH
      } catch (err) {
        this.results = [];
        this.error = "Terjadi kesalahan saat memproses data.";
      }
    },

    // PDF
    async generatePdf() {
      try {
        this.showPdf = true;
        await this.$nextTick();
        const inst = this.$refs.html2Pdf;
        if (!inst) {
          return;
        }
        await new Promise(function (r) {
          setTimeout(r, 200);
        });
        await inst.generatePdf();
      } catch (e) {
        this.error = "Gagal membuat PDF";
      }
    },

    downloadExcel() {
      const rows = (this.results || []).map((r, idx) => ({
        No: idx + 1,
        "Team Name": r.nameTeam || "-",
        BIB: r.bibTeam || "-",
        "Penalty Start": r.startPenalty || 0,
        // BUG FIX: dulu isinya JUMLAH entri section (r.sectionPenaltyTime.length),
        // bukan nilai penalty-nya — angka di Excel jadi tidak nyambung sama
        // sekali dgn kolom "Penalty Total" (mis. 3 section terisi tampil
        // "3" walau total penalty section-nya 50). Sekarang pakai sum yg
        // sama dgn yg ditampilkan di tabel (r.sectionPenalty).
        "Penalty Section": r.sectionPenalty || 0,
        "Penalty Finish": r.finishPenalty || 0,
        "Penalty Total": r.totalPenalty || "0",
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
      exportRowsToExcel(`DRR Result - ${eventName}`, rows, "DRR Result");
    },

    onBeforeDownload() {
      // hook opsional
    },

    onPdfGenerated() {
      this.showPdf = false;
    },
  },
};
</script>

<style scoped>
/* ===== Page Layout ===== */
.result-wrap {
  padding: 18px;
  background: #f7f7f9;
}

/* top bar */
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

/* actions */
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

/* card */
.card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(28, 39, 49, 0.06);
  padding: 18px 18px 8px;
}

/* event header */
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

/* table */
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
  font-weight: bold;
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
  transform: rotate(0deg);
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(20, 138, 59, 0.12) inset;
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

.section-modal-trigger {
  cursor: pointer;
  color: red;
  font-weight: 600;
  text-decoration: underline dotted #8ab4f8;
}

.cell-input {
  width: 100%;
  min-width: 100px;
  max-width: 130px;
  text-align: center;
  border: 1px solid #e0e3e8;
  border-radius: 8px;
  padding: 6px 8px;
  font: inherit;
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

.section-time-list {
  border: 1px solid #e6e9ef;
  border-radius: 10px;
  overflow: hidden;
}

.section-time-row {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #f1f3f7;
  align-items: center;
  font-size: 14px;
}
.section-time-row:first-child {
  border-top: none;
}
.section-time-head {
  background: #f7fbff;
  font-weight: 700;
  color: #194c7b;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
.empty-section-times {
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

.text-penalty {
  color: #e03131;
  font-weight: 600;
}

.section-time-row {
  display: grid;
  grid-template-columns: 80px 1fr; /* <— atur lebar kolom di sini */
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #f1f3f7;
  align-items: center;
  font-size: 14px;
}

/* ---- Styling utk Switch DRR Category (dropdown toolbar) ---- */
.switch-category-panel {
  min-width: 260px;
}
/* ---- End styling utk Switch DRR Category ---- */
</style>
