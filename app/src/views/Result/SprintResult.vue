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
        <span class="muted">Sprint Result</span>
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
            Switch Sprint Category
            <Icon icon="mdi:chevron-down" class="caret-icon" width="16" height="16" />
          </template>
          <div class="switch-category-panel px-3 py-2">
            <div class="init-tabs mb-2" v-if="bucketInitials.length">
              <button
                v-for="i in bucketInitials"
                :key="i.id"
                type="button"
                class="init-tab"
                :class="{ active: selectedInitialName === i.name }"
                @click="selectInitialTab(i)"
              >
                {{ i.name }}
              </button>
            </div>
            <b-form-select
              :options="bucketOptionsForSelectedInitial"
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
        <!-- Back di kiri -->
        <b-button variant="link" class="p-0 back-link" @click="goBack">
          <Icon icon="mdi:chevron-left" /> Back
        </b-button>

        <!-- Stamp di kanan: klik untuk toggle -->
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
          <span class="muted"
            >SPRINT RESULT | {{ sprintCats.initial }} -
            {{ sprintCats.division }} {{ sprintCats.race }}
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
        subtitle="Hasil Sprint belum tersedia untuk kategori ini."
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
              <th class="text-center">Start Time</th>
              <th class="text-center">Pen. Start (PS)</th>
              <th class="text-center">Pen. Finish (PF)</th>
              <th class="text-center">Finish Time</th>
              <th class="text-center">Race Time</th>
              <th class="text-center">Penalty Time</th>
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
              <td class="text-center">
                <input
                  v-if="!isOfficial"
                  type="text"
                  class="cell-input"
                  placeholder="00:00:00.000"
                  :value="r.startTime"
                  @change="onEditTimeField(r, 'startTime', $event.target.value)"
                />
                <span v-else>{{ r.startTime || "00:00:000" }}</span>
              </td>
              <!-- BUG FIX: dulu Penalty Time yg diketik bebas — seharusnya
                   operator memilih Pen. Start/Pen. Finish dari daftar (sama
                   seperti menu Sprint Details), Penalty Time cuma HASIL
                   perhitungan, bukan input langsung. -->
              <td class="text-center">
                <select
                  v-if="!isOfficial"
                  class="cell-input"
                  :value="r.startPenalty"
                  @change="
                    r.startPenalty = Number($event.target.value);
                    onPenaltyDropdownChange(r);
                  "
                >
                  <option
                    v-for="p in dataPenaltiesStart"
                    :key="'sp-' + idx + '-' + p.value"
                    :value="p.value"
                  >
                    {{ p.label }}
                  </option>
                </select>
                <span v-else>{{ r.startPenalty || 0 }}</span>
              </td>
              <td class="text-center">
                <select
                  v-if="!isOfficial"
                  class="cell-input"
                  :value="r.finishPenalty"
                  @change="
                    r.finishPenalty = Number($event.target.value);
                    onPenaltyDropdownChange(r);
                  "
                >
                  <option
                    v-for="p in dataPenaltiesFinish"
                    :key="'fp-' + idx + '-' + p.value"
                    :value="p.value"
                  >
                    {{ p.label }}
                  </option>
                </select>
                <span v-else>{{ r.finishPenalty || 0 }}</span>
              </td>
              <td class="text-center">
                <input
                  v-if="!isOfficial"
                  type="text"
                  class="cell-input"
                  placeholder="00:00:00.000"
                  :value="r.finishTime"
                  @change="onEditTimeField(r, 'finishTime', $event.target.value)"
                />
                <span v-else>{{ r.finishTime || "00:00:000" }}</span>
              </td>
              <td class="bold text-center">{{ r.raceTime || "00:00:000" }}</td>
              <td class="text-center" style="color: red">
                {{ r.penaltyTime || "00:00:000" }}
              </td>
              <td class="bold text-center" style="color: green">
                {{ r.resultTime || "00:00:000" }}
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
        <SprintPdf
          :data="pdfEventData"
          :dataParticipant="pdfParticipants"
          :categories="pdfCategories"
          :isOfficial="isOfficial"
          :sprintCats="sprintCats"
        />
      </section>
    </vue-html2pdf>

    <PrintOverallModal
      centered
      :show="showOverallModal"
      :dataEvent="eventInfo"
      :aggregate="dataAggregate"
      :raceCats="sprintCats"
      :categories="visibleCategories"
      @close="showOverallModal = false"
    />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import SprintPdf from "../DetailEvent/ResultComponent/sprint-pdfResult.vue";
import EmptyStateFull from "@/components/EmptyStateFull.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import VueHtml2pdf from "vue-html2pdf";
import { logger } from "@/utils/logger";
import PrintOverallModal from "@/components/result/PrintOverallModal.vue";
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

/* ========= Helpers localStorage ========= */
const RACE_PAYLOAD_KEY = "raceStartPayload";
// const EVENT_DETAILS_KEY = "eventDetails";

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
// function evIdToString(ev) {
//   if (ev && ev._id) {
//     if (typeof ev._id === "object" && ev._id.$oid) return String(ev._id.$oid);
//     return String(ev._id);
//   }
//   return "";
// }
// function currentEventIdFromBucket() {
//   const payload = safeParse(localStorage.getItem(RACE_PAYLOAD_KEY) || "{}", {});
//   const b = payload && payload.bucket ? payload.bucket : {};
//   return String(b.eventId || "");
// }
// function pickEventFromStore() {
//   const store = safeParse(
//     localStorage.getItem(EVENT_DETAILS_KEY) || "null",
//     null
//   );
//   if (!store) return {};
//   const activeId = currentEventIdFromBucket();

//   const isDict =
//     typeof store === "object" &&
//     !Array.isArray(store) &&
//     !store.eventName &&
//     !store._id;
//   if (isDict) {
//     return activeId && store[activeId]
//       ? store[activeId]
//       : Object.values(store)[0] || {};
//   }
//   if (Array.isArray(store)) {
//     if (activeId) {
//       const found = store.find((ev) => evIdToString(ev) === activeId);
//       if (found) return found;
//     }
//     return store[0] || {};
//   }
//   return store; // single object
// }

export default {
  name: "SprintResult",
  components: {
    Icon,
    EmptyStateFull,
    SprintPdf,
    VueHtml2pdf,
    PrintOverallModal,
    CountryFlag,
  },
  mixins: [teamFlagMixin],
  data() {
    return {
      defaultImg,
      isOfficial: false,
      loading: false,
      error: "",
      results: [],
      showPdf: false,
      eventInfo: {},
      // semua bucket registrasi (lintas race category) utk event ini,
      // dipakai cross-check di buildAggregateFromDoc() (modal Print Result
      // Overall) — lihat src/utils/registeredTeamsFilter.js
      registeredBuckets: [],
      // Race Category yang benar-benar dipilih utk event ini — null =
      // fail-open (tampilkan semua kolom kategori)
      enabledCategoryKeys: null,
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
      // score fallback utk rank di luar daftar dataScore (Race Settings ->
      // Sprint -> "Score utk Rank N+ dan seterusnya")
      sprintDefaultScoreBeyondRank: 0,
      // On/off kolom tanda tangan di PDF Result — per kategori lewat Race
      // Settings, default TAMPIL (true), di-refresh di loadRaceSettings().
      showTechnicalDelegate: true,
      showChiefJudge: true,
      showRaceDirector: true,
      // Daftar pilihan Pen. Start (PS) / Pen. Finish (PF) — {label,value,
      // timePen}[], sama pola dgn SprintRace.vue: default dari optionPenalties
      // (global), di-override per-event lewat Race Settings kalau ada.
      dataPenaltiesStart: [],
      dataPenaltiesFinish: [],
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
      // Switch Sprint Category (sama pola dgn SprintRace.vue): tab Initial
      // yg sedang dipilih di switcher toolbar.
      selectedInitialName: "",
    };
  },

  computed: {
    visibleCategories() {
      return getVisibleCategoryMeta(this.enabledCategoryKeys);
    },
    // Kombinasi statis Divisi x Race x Initial (dari config event, sama
    // seperti buildStaticSprintOptions() di SprintRace.vue) — dipakai
    // switcher "Switch Sprint Category" supaya berpindah bucket TANPA
    // balik ke Dashboard, identik dgn switcher di halaman Race Detail-nya.
    bucketData() {
      const q = this.$route.query || {};
      const eventId = String(q.eventId || this.$route.params.id || "");
      return buildStaticBucketOptions(this.eventInfo, eventId);
    },
    bucketInitials() {
      return this.bucketData.initials;
    },
    // Opsi Divisi/Race saja (Initial sudah dipilih lewat tab) — label tanpa
    // nama Initial, sama seperti sprintOptionsForSelectedInitial().
    bucketOptionsForSelectedInitial() {
      const opts = this.bucketData.bucketOptions;
      if (!this.selectedInitialName) return opts;
      const target = String(this.selectedInitialName).toUpperCase();
      return opts
        .filter((o) => {
          const b = this.bucketData.bucketMap[o.value];
          return b && String(b.initialName).toUpperCase() === target;
        })
        .map((o) => {
          const b = this.bucketData.bucketMap[o.value];
          return { value: o.value, text: `${b.divisionName} ${b.raceName}` };
        });
    },
    // Key bucket yg SEDANG ditampilkan (dari $route.query saat ini) —
    // dipakai supaya <b-form-select> menunjukkan pilihan yg aktif.
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
      var ev = this.eventInfo || {};
      var logos = ev.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        // string URL langsung atau objek { url: '...' }
        var first = logos[0];
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
      var ev = this.eventInfo || {};
      var logos = ev.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        var first = logos[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && typeof first.url === "string")
          return first.url;
      }
      return "";
    },
    pdfFilename() {
      const parts = [];
      if (this.eventInfo && this.eventInfo.eventName) {
        parts.push(this.eventInfo.eventName);
      }
      const catTitle =
        "SPRINT (" +
        (this.sprintCats.initial || "-") +
        " - " +
        (this.sprintCats.division || "-") +
        " " +
        (this.sprintCats.race || "-") +
        ")";
      parts.push(catTitle);
      return parts.join(" - ");
    },
    sprintCats() {
      // BUG FIX: dulu localStorage (raceStartPayload) diprioritaskan di atas
      // $route.query — cocok dulu krn satu-satunya cara masuk ke halaman ini
      // adalah dari Race Detail yg selalu menulis localStorage bucket SAAT
      // ITU JUGA (selalu sinkron dgn query). Sekarang "Switch Sprint
      // Category" berpindah bucket murni lewat query (router push), TANPA
      // menyentuh localStorage — localStorage jadi bucket LAMA yg basi,
      // sehingga judul tetap menampilkan bucket sebelumnya walau tabel
      // hasil di bawahnya sudah benar pindah. Balik urutannya: query dulu.
      const q = this.$route.query || {};
      const payload = safeParse(
        localStorage.getItem("raceStartPayload") || "{}",
        {}
      );
      const b = payload.bucket || {};
      return {
        // urutan sesuai permintaan: Initial, Race, Division
        initial: q.initialName || b.initialName || "-",
        race: q.raceName || b.raceName || "-",
        division: q.divisionName || b.divisionName || "-",
      };
    },
    // eventInfo() {
    //   const ev = pickEventFromStore();
    //   const q = this.$route.query || {};
    //   return {
    //     eventName: ev.eventName || q.eventName || "",
    //     addressCity:
    //       ev.addressCity || ev.location || q.addressCity || q.location || "",
    //     riverName: ev.riverName || q.riverName || "",
    //     levelName: ev.levelName || q.levelName || "",
    //     startDateEvent: ev.startDateEvent || q.startDateEvent || "",
    //     endDateEvent: ev.endDateEvent || q.endDateEvent || "",
    //     addressVillage: ev.addressVillage || "",
    //     addressDistrict: ev.addressDistrict || "",
    //     addressSubDistrict: ev.addressSubDistrict || "",
    //     addressProvince: ev.addressProvince || "",
    //     addressState: ev.addressState || "",
    //     addressZipCode: ev.addressZipCode || "",
    //     raceDirector: ev.raceDirector || "",
    //     chiefJudge: ev.chiefJudge || "",
    //   };
    // },

    // Data untuk komponen PDF
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
      return (this.results || []).map((r) => ({
        nameTeam: r.nameTeam,
        bibTeam: r.bibTeam,
        countryCode: this.flagFor(r.nameTeam),
        result: {
          startTime: r.startTime || "",
          finishTime: r.finishTime || "",
          raceTime: r.raceTime || "",
          penaltyTime: r.penaltyTime || "00:00:00.000",
          penalty: Number(r.totalPenalty) || 0,
          totalTime: r.totalTime || r.resultTime || r.raceTime || "",
          ranked: r.ranked || "",
          score:
            r.score !== undefined && r.score !== null && r.score !== ""
              ? r.score
              : this.getScoreByRanked(r.ranked) || 0,
        },
      }));
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
      return title || "SPRINT";
    },
  },

  async created() {
    // ambil event langsung dari IPC
    const q = this.$route.query || {};
    await this.loadDataPenalties("SPRINT");
    if (q.eventId) {
      await this.loadEventById(q.eventId);
      this.registeredBuckets = await loadRegisteredBucketsByEvent(q.eventId);
      this.enabledCategoryKeys = await loadEnabledCategoryKeys(q.eventId);
      await this.loadRaceSettings(q.eventId);
    }
    this.selectedInitialName = String(q.initialName || "").toUpperCase();

    this.loadSprintResult();
  },
  mounted() {},
  methods: {
    // Switch Sprint Category (sama pola dgn onSelectSprintBucket() +
    // selectInitialTab() di SprintRace.vue) — navigasi ke Sprint Result yg
    // SAMA dgn bucket (Initial/Divisi/Race) baru; router-view di-key by
    // fullPath (lihat DetailEvent/index.vue) supaya halaman full-remount &
    // memuat ulang data bucket barunya dari created().
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
          eventName: "SPRINT",
          initialName: b.initialName,
          raceName: b.raceName,
          divisionName: b.divisionName,
        },
      });
    },
    selectInitialTab(i) {
      this.selectedInitialName = i.name;
      const target = String(i.name).toUpperCase();
      const match = this.bucketData.bucketOptions.find((o) => {
        const b = this.bucketData.bucketMap[o.value];
        return b && String(b.initialName).toUpperCase() === target;
      });
      if (match) this.goToBucket(match.value);
    },

    // builder data untuk modal Overall (header + rows)
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
    // klik tombol “View Overall”
    fetchEventResultsAggregate: function () {
      var q = this.$route && this.$route.query ? this.$route.query : {};
      var f = {
        eventId: String(q.eventId || ""),
        initialId: String(q.initialId || ""),
        raceId: String(q.raceId || ""),
        divisionId: String(q.divisionId || ""),
      };
      // fallback dari localStorage bila ada yg kosong
      if (!f.eventId || !f.initialId || !f.raceId || !f.divisionId) {
        var payload = safeParse(
          localStorage.getItem(RACE_PAYLOAD_KEY) || "{}",
          {}
        );
        var b = payload && payload.bucket ? payload.bucket : {};
        if (!f.eventId) f.eventId = String(b.eventId || "");
        if (!f.initialId) f.initialId = String(b.initialId || "");
        if (!f.raceId) f.raceId = String(b.raceId || "");
        if (!f.divisionId) f.divisionId = String(b.divisionId || "");
      }
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
    goBack() {
      this.$router.push(`/event-detail/${this.$route.params.id}`);
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
              this.eventInfo = res; // langsung simpan hasil ke data
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

    // Daftar pilihan Pen. Start/Finish global (optionPenalties "SPRINT") —
    // dipakai sbg fallback sebelum Race Settings per-event dimuat, sama
    // pola dgn loadDataPenalties() di SprintRace.vue.
    async loadDataPenalties(type) {
      try {
        if (typeof ipcRenderer === "undefined") return;
        ipcRenderer.send("option-penalties", type);
        ipcRenderer.once("option-penalties-reply", (_e, payload) => {
          const data =
            payload && payload[0] && Array.isArray(payload[0].data)
              ? payload[0].data
              : [];
          this.dataPenaltiesStart = data;
          this.dataPenaltiesFinish = data;
        });
      } catch (error) {
        this.dataPenaltiesStart = [];
        this.dataPenaltiesFinish = [];
      }
    },

    // sekon -> "HH:MM:SS.000", sama pola dgn secondsToTimeString() di
    // SprintRace.vue supaya timePen konsisten dgn Race Detail.
    secondsToTimeString(totalSec) {
      const t = Math.max(0, Number(totalSec) || 0);
      const sec = Math.floor(t % 60);
      const min = Math.floor((t / 60) % 60);
      const hr = Math.floor(t / 3600);
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(hr)}:${pad(min)}:${pad(sec)}.000`;
    },

    // Score by Rank per-event (Race Settings) — override tabel default
    // (dulunya global/hardcoded lewat optionRanked "SPRINT") kalau event
    // ini sudah dikustomisasi.
    async loadRaceSettings(eventId) {
      try {
        if (typeof ipcRenderer === "undefined" || !eventId) return;
        await new Promise((resolve) => {
          ipcRenderer.once("race-settings:get-reply", (_e, res) => {
            const scoreByRank =
              res &&
              res.ok &&
              res.settings &&
              res.settings.sprint &&
              Array.isArray(res.settings.sprint.scoreByRank)
                ? res.settings.sprint.scoreByRank
                : null;
            if (scoreByRank && scoreByRank.length) {
              this.dataScore = scoreByRank.map((p) => ({
                ranking: Number(p.ranking) || 0,
                score: Number(p.score) || 0,
              }));
            }
            this.sprintDefaultScoreBeyondRank =
              Number(
                res &&
                  res.settings &&
                  res.settings.sprint &&
                  res.settings.sprint.defaultScoreBeyondRank
              ) || 0;

            // PS (Pen. Start) & PF (Pen. Finish) — daftar pilihan independen
            // yg bisa dikustomisasi per-event lewat Race Settings, sama
            // pola persis dgn loadRaceSettings() di SprintRace.vue.
            const sprintSettings = res && res.ok && res.settings && res.settings.sprint;
            const toList = (arr) =>
              Array.isArray(arr) && arr.length > 0
                ? arr.map((p) => ({
                    label: String(p.label || p.value),
                    value: Number(p.value) || 0,
                    timePen: this.secondsToTimeString(Number(p.value) || 0),
                  }))
                : null;
            const startList = sprintSettings && toList(sprintSettings.startPenalties);
            const finishList = sprintSettings && toList(sprintSettings.finishPenalties);
            if (startList) this.dataPenaltiesStart = startList;
            if (finishList) this.dataPenaltiesFinish = finishList;

            // On/off kolom Technical Delegate/Chief Judge/Race Director di
            // PDF Result Sprint — diatur per kategori lewat Race Settings,
            // default TAMPIL (true) kalau belum pernah diatur.
            const boolOrDefault = (v, d) => (v === undefined || v === null ? d : !!v);
            this.showTechnicalDelegate = boolOrDefault(
              sprintSettings && sprintSettings.showTechnicalDelegate,
              true
            );
            this.showChiefJudge = boolOrDefault(
              sprintSettings && sprintSettings.showChiefJudge,
              true
            );
            this.showRaceDirector = boolOrDefault(
              sprintSettings && sprintSettings.showRaceDirector,
              true
            );

            resolve();
          });
          ipcRenderer.send("race-settings:get", eventId);
        });
      } catch (error) {
        // biarkan dataScore/dataPenalties default kalau gagal memuat override
      }
    },

    // Cari opsi penalty by value (seconds) dari salah satu list — dipakai
    // saat operator ganti pilihan Pen. Start/Finish, sama pola dgn
    // findPenalty() di SprintRace.vue.
    findPenaltyOption(val, list) {
      return (
        (list || []).find((p) => Number(p.value) === Number(val)) || {
          value: 0,
          timePen: "00:00:00.000",
        }
      );
    },

    // Dipanggil saat Pen. Start / Pen. Finish diganti di dropdown: hitung
    // ulang Penalty Time (PS + PF) dari opsi yg dipilih (BUKAN diketik
    // bebas), lalu Result Time, re-rank/re-score, dan simpan — sama pola
    // dgn recalcPenalties() di SprintRace.vue (menu Sprint Details).
    onPenaltyDropdownChange(row) {
      const sp = this.findPenaltyOption(row.startPenalty, this.dataPenaltiesStart);
      const fp = this.findPenaltyOption(row.finishPenalty, this.dataPenaltiesFinish);

      row.startPenaltyTime = sp.timePen;
      row.finishPenaltyTime = fp.timePen;
      row.totalPenalty = Number(sp.value) + Number(fp.value);

      const totalPenaltyTime = this.tambahWaktu(sp.timePen, fp.timePen);
      row.penaltyTime = totalPenaltyTime;
      row.totalPenaltyTime = totalPenaltyTime;

      row.totalTime = row.raceTime
        ? this.tambahWaktu(row.raceTime, totalPenaltyTime)
        : "";
      row.resultTime = row.totalTime;

      this.results = this.computeRanksAndScores(this.results);
      this.saveResultsToDb();
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
      const m = this.dataScore.find((d) => d.ranking === Number(ranked));
      if (m) return m.score;
      // rank di luar daftar (mis. list cuma diisi Rank 1-5) → pakai score
      // fallback "Rank N+ dan seterusnya" dari Race Settings, kalau ada
      const maxRank = this.dataScore.length
        ? Math.max(...this.dataScore.map((d) => d.ranking))
        : 0;
      if (Number(ranked) > maxRank) {
        return this.sprintDefaultScoreBeyondRank || 0;
      }
      return 0;
    },

    /** Normalisasi baris hasil; aman untuk 2 bentuk: flat atau r.result */
    normalizeResult(raw) {
      const base = {
        startTime: "",
        finishTime: "",
        raceTime: "",
        startPenalty: 0,
        finishPenalty: 0,
        penalty: 0,
        totalPenalty: 0,
        startPenaltyTime: "00:00:00.000",
        finishPenaltyTime: "00:00:00.000",
        totalPenaltyTime: "00:00:00.000",
        penaltyTime: "",
        totalTime: "",
        ranked: "",
        score: "",
      };

      // dukung schema lama/baru
      const src =
        raw && raw.result && typeof raw.result === "object"
          ? { ...raw, ...raw.result } // flatten
          : { ...raw };

      const merged = {
        ...base,
        startTime: String(src.startTime || ""),
        finishTime: String(src.finishTime || ""),
        raceTime: String(src.raceTime || ""),
        penalty: Number(src.penalty) || 0,
        totalPenalty: Number(src.totalPenalty) || 0,
        startPenalty: Number(src.startPenalty) || 0,
        finishPenalty: Number(src.finishPenalty) || 0,
        startPenaltyTime: String(src.startPenaltyTime || "00:00:00.000"),
        finishPenaltyTime: String(src.finishPenaltyTime || "00:00:00.000"),
        totalPenaltyTime: String(
          src.totalPenaltyTime || src.penaltyTime || "00:00:00.000"
        ),
        penaltyTime: String(
          src.penaltyTime || src.totalPenaltyTime || "00:00:00.000"
        ),
        totalTime: String(src.totalTime || ""),
        ranked:
          src.ranked === 0 || src.ranked === "0" ? 0 : Number(src.ranked) || "",
        score:
          src.score === 0 || src.score === "0" ? 0 : Number(src.score) || "",
      };

      // hitung totalPenalty jika belum ada
      if (!merged.totalPenalty) {
        merged.totalPenalty = merged.startPenalty + merged.finishPenalty;
      }

      return merged;
    },

    /** "HH:MM:SS.mmm" -> ms (Infinity kalau kosong/tidak valid) */
    timeToMs(str) {
      if (!str) return Number.POSITIVE_INFINITY;
      const [hh = "0", mm = "0", ssms = "0"] = String(str).split(":");
      const [ss = "0", ms = "0"] = String(ssms).split(".");
      const h = parseInt(hh, 10) || 0;
      const m = parseInt(mm, 10) || 0;
      const s = parseInt(ss, 10) || 0;
      const mil = parseInt(ms, 10) || 0;
      return h * 3600000 + m * 60000 + s * 1000 + mil;
    },

    /** Hitung rank & score otomatis */
    computeRanksAndScores(rows) {
      const withTime = rows
        .map((r, i) => {
          const t = r.resultTime || r.totalTime || r.raceTime || "";
          return { i, ms: this.timeToMs(t) };
        })
        .filter(
          (x) => Number.isFinite(x.ms) && x.ms !== Number.POSITIVE_INFINITY
        );

      withTime.sort((a, b) => a.ms - b.ms);

      withTime.forEach((item, idx) => {
        const rank = idx + 1;
        rows[item.i].ranked = rank;
        rows[item.i].score = this.getScoreByRanked(rank);
      });

      rows.forEach((r) => {
        if (!r.ranked || r.ranked === "-" || Number(r.ranked) <= 0) {
          r.ranked = r.ranked ? r.ranked : "-";
          r.score =
            r.score !== undefined && r.score !== null && r.score !== ""
              ? Number(r.score) || 0
              : 0;
        }
      });

      rows.sort((a, b) => {
        const ra = Number(a.ranked) || Infinity;
        const rb = Number(b.ranked) || Infinity;
        return ra - rb;
      });

      return rows;
    },

    /** "HH:MM:SS.mmm" -> ms, aman untuk kosong/format salah (bukan Infinity) */
    timeToMsSafe(str) {
      if (!str) return 0;
      const [hh = "0", mm = "0", ssms = "0"] = String(str).split(":");
      const [ss = "0", ms = "0"] = String(ssms).split(".");
      const h = parseInt(hh, 10) || 0;
      const m = parseInt(mm, 10) || 0;
      const s = parseInt(ss, 10) || 0;
      const mil = parseInt(ms, 10) || 0;
      return h * 3600000 + m * 60000 + s * 1000 + mil;
    },

    /** ms -> "HH:MM:SS.mmm" */
    msToTime(ms) {
      const total = Math.max(0, Math.round(ms));
      const h = Math.floor(total / 3600000);
      const rem1 = total % 3600000;
      const m = Math.floor(rem1 / 60000);
      const rem2 = rem1 % 60000;
      const s = Math.floor(rem2 / 1000);
      const mil = rem2 % 1000;
      const pad = (n, w = 2) => String(n).padStart(w, "0");
      return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(mil, 3)}`;
    },

    /** Race Time = Finish Time - Start Time */
    hitungSelisihWaktu(waktuAwal, waktuAkhir) {
      if (!waktuAwal || !waktuAkhir) return "";
      const msA = this.timeToMsSafe(waktuAwal);
      const msB = this.timeToMsSafe(waktuAkhir);
      return this.msToTime(msB - msA);
    },

    /** Result Time = Race Time + Penalty Time */
    tambahWaktu(waktuA, waktuB) {
      return this.msToTime(
        this.timeToMsSafe(waktuA) + this.timeToMsSafe(waktuB)
      );
    },

    /** Dipanggil saat Penalty/Start/Finish Time diedit langsung di tabel:
     * hitung ulang Race Time & Result Time baris ini, lalu re-rank/re-score
     * SEMUA baris (waktu satu tim berubah bisa menggeser ranking tim lain),
     * dan simpan hasilnya ke database. */
    onEditTimeField(row, field, rawValue) {
      this.$set(row, field, String(rawValue == null ? "" : rawValue).trim());

      row.raceTime =
        row.startTime && row.finishTime
          ? this.hitungSelisihWaktu(row.startTime, row.finishTime)
          : "";
      row.totalTime = row.raceTime
        ? this.tambahWaktu(row.raceTime, row.penaltyTime || "00:00:00.000")
        : "";
      row.resultTime = row.totalTime;

      this.results = this.computeRanksAndScores(this.results);
      this.saveResultsToDb();
    },

    /** Simpan seluruh baris hasil (dgn ranking/score terbaru) ke DB */
    saveResultsToDb() {
      const q = this.$route.query || {};
      if (!q.eventId || !q.initialId || !q.raceId || !q.divisionId) return;

      const docs = this.results.map((r) => ({
        eventId: String(q.eventId),
        initialId: String(q.initialId),
        raceId: String(q.raceId),
        divisionId: String(q.divisionId),
        eventName: "SPRINT",
        initialName: String(q.initialName || this.sprintCats.initial || ""),
        raceName: String(q.raceName || this.sprintCats.race || ""),
        divisionName: String(q.divisionName || this.sprintCats.division || ""),
        nameTeam: r.nameTeam,
        bibTeam: r.bibTeam,
        startOrder: r.startOrder || "",
        praStart: r.praStart || "",
        intervalRace: r.intervalRace || "",
        statusId: r.statusId || 0,
        result: {
          startTime: r.startTime || "",
          finishTime: r.finishTime || "",
          raceTime: r.raceTime || "",
          startPenalty: r.startPenalty || 0,
          finishPenalty: r.finishPenalty || 0,
          penalty: r.totalPenalty || 0,
          totalPenalty: r.totalPenalty || 0,
          // BUG FIX: dulu di-hardcode "00:00:00.000" di sini apa pun nilai
          // startPenalty/finishPenalty-nya — breakdown waktu PS/PF individual
          // jadi selalu ke-nolkan tiap kali disimpan (walau totalnya benar).
          startPenaltyTime: r.startPenaltyTime || "00:00:00.000",
          finishPenaltyTime: r.finishPenaltyTime || "00:00:00.000",
          totalPenaltyTime: r.penaltyTime || "00:00:00.000",
          penaltyTime: r.penaltyTime || "00:00:00.000",
          totalTime: r.totalTime || r.resultTime || "",
          ranked: Number(r.ranked) || 0,
          score: Number(r.score) || 0,
          judgesBy: r.judgesBy || "",
          judgesTime: r.judgesTime || "",
        },
      }));

      ipcRenderer.send("insert-sprint-result", docs);
      ipcRenderer.once("insert-sprint-result-reply", (_e, res) => {
        if (!res || !res.ok) {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Gagal menyimpan",
            detail:
              (res && res.error) || "Perubahan tidak tersimpan ke database.",
          });
          return;
        }
        // Editan di halaman Result (mis. koreksi penalty/waktu) tetap harus
        // ikut memperbarui dokumen "View Overall" — kalau tidak, ranking di
        // View Overall diam-diam jadi usang begitu ada koreksi di sini.
        this.upsertEventResults(q, this.results);
      });
    },

    // === merge hasil SPRINT (versi terkoreksi di halaman Result) ke
    // dokumen event-results (kategori lain aman) — mirror logika yang sama
    // dgn SprintRace.vue supaya View Overall selalu ikut ter-update. ===
    async upsertEventResults(identity, rows) {
      const K = {
        SPRINT: "SPRINT",
        H2H: "HEADTOHEAD",
        SLALOM: "SLALOM",
        DRR: "DRR",
        RX: "RX",
      };
      const toNumOrEmpty = (v) => (v || v === 0 ? v : "");

      const baseFilter = {
        eventId: String(identity.eventId || ""),
        initialId: String(identity.initialId || ""),
        raceId: String(identity.raceId || ""),
        divisionId: String(identity.divisionId || ""),
      };

      const incoming = new Map();
      (rows || []).forEach((r) => {
        const key = String(r.teamId || r.bibTeam || "");
        if (!key) return;
        const ranked = r.ranked || r.ranked === 0 ? r.ranked : "";
        const scored = ranked !== "" ? this.getScoreByRanked(ranked) : "";
        incoming.set(key, {
          teamId: r.teamId || "",
          teamName: r.nameTeam || "",
          bib: r.bibTeam || "",
          sprintCat: {
            name: K.SPRINT,
            rankedByCats: toNumOrEmpty(ranked),
            scored: toNumOrEmpty(scored),
          },
          totalRanked: toNumOrEmpty(ranked),
          totalScore: toNumOrEmpty(scored),
        });
      });

      let existingDoc = null;
      try {
        const gres = await new Promise((resolve) => {
          ipcRenderer.once("event-results:get-reply", (_e, res) => resolve(res));
          ipcRenderer.send("event-results:get", baseFilter);
        });
        if (gres && gres.ok && gres.doc) existingDoc = gres.doc;
      } catch (e) {
        existingDoc = null;
      }

      const now = new Date();
      const payload = {
        eventId: baseFilter.eventId,
        initialId: baseFilter.initialId,
        raceId: baseFilter.raceId,
        divisionId: baseFilter.divisionId,
        eventName: "SPRINT",
        initialName: String(identity.initialName || this.sprintCats.initial || ""),
        raceName: String(identity.raceName || this.sprintCats.race || ""),
        divisionName: String(identity.divisionName || this.sprintCats.division || ""),
        eventResult: [],
        createdAt: now,
        updatedAt: now,
      };

      if (existingDoc) {
        payload.createdAt = existingDoc.createdAt
          ? new Date(existingDoc.createdAt)
          : now;

        const map = new Map();
        (Array.isArray(existingDoc.eventResult) ? existingDoc.eventResult : []).forEach(
          (row) => {
            const k = String((row && row.teamId) || (row && row.bib) || "");
            if (k) map.set(k, JSON.parse(JSON.stringify(row)));
          }
        );

        incoming.forEach((inc, key) => {
          let prev = map.get(key);
          if (!prev) {
            prev = {
              teamId: inc.teamId,
              teamName: inc.teamName,
              bib: inc.bib,
              categories: [],
              totalRanked: "",
              totalScore: "",
            };
          }
          const prevCats = Array.isArray(prev.categories) ? prev.categories : [];
          const foundIdx = prevCats.findIndex(
            (c) => String((c && c.name) || "").toUpperCase() === K.SPRINT
          );
          if (foundIdx >= 0) prevCats[foundIdx] = inc.sprintCat;
          else prevCats.push(inc.sprintCat);

          map.set(key, {
            teamId: inc.teamId || prev.teamId || "",
            teamName: inc.teamName || prev.teamName || "",
            bib: inc.bib || prev.bib || "",
            categories: prevCats,
            totalRanked: inc.totalRanked,
            totalScore: inc.totalScore,
          });
        });

        payload.eventResult = Array.from(map.values());
      } else {
        payload.eventResult = Array.from(incoming.values()).map((inc) => ({
          teamId: inc.teamId,
          teamName: inc.teamName,
          bib: inc.bib,
          categories: [
            inc.sprintCat,
            { name: K.H2H, rankedByCats: "", scored: "" },
            { name: K.SLALOM, rankedByCats: "", scored: "" },
            { name: K.DRR, rankedByCats: "", scored: "" },
            { name: K.RX, rankedByCats: "", scored: "" },
          ],
          totalRanked: inc.totalRanked,
          totalScore: inc.totalScore,
        }));
      }

      ipcRenderer.send("event-results:upsert", payload);
      ipcRenderer.once("event-results:upsert-reply", (_e, res) => {
        if (!res || !res.ok) {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Sync Overall gagal",
            detail: (res && res.error) || "Unknown error",
          });
        }
      });
    },

    // Tim yang BENAR-BENAR terdaftar SPRINT utk kombinasi initial/race/
    // division ini saat ini (bukan histori). Dipakai buat menyaring hasil
    // yang mungkin sudah usang: kalau dulu pernah tersimpan hasil race utk
    // tim tsb tapi registrasinya sekarang sudah dihapus/dipindah ke race
    // category lain, hasil lama itu harusnya tidak ikut tampil di sini lagi.
    // Return null kalau gagal mengecek (bukan "tidak ada yang terdaftar")
    // supaya baris hasil tidak diam-diam disembunyikan gara-gara error IPC.
    fetchRegisteredSprintTeamNames(q) {
      return new Promise((resolve) => {
        const identity = {
          eventId: String(q.eventId || ""),
          initialId: String(q.initialId || ""),
          raceId: String(q.raceId || ""),
          divisionId: String(q.divisionId || ""),
          eventName: "SPRINT",
          initialName: String(q.initialName || ""),
          raceName: String(q.raceName || ""),
          divisionName: String(q.divisionName || ""),
        };

        // reqId supaya balasan channel ini tidak ketukar dengan request lain
        // yang kebetulan nembak IPC "get-teams-registered" bersamaan (mis.
        // halaman Details yang fetch beberapa panel divisi/race sekaligus).
        const reqId = "sprintResult|" + Date.now() + "|" + Math.random();
        let settled = false;

        const onReply = (_e, bucket) => {
          if (!bucket || bucket.__reqId !== reqId) return;
          ipcRenderer.removeListener("get-teams-registered-reply", onReply);
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);

          if (!Array.isArray(bucket.teams)) {
            resolve(null);
            return;
          }
          const names = new Set();
          bucket.teams.forEach((t) => {
            const n = String((t && t.nameTeam) || "").trim().toUpperCase();
            if (n) names.add(n);
          });
          resolve(names);
        };

        const timeoutId = setTimeout(() => {
          if (settled) return;
          settled = true;
          ipcRenderer.removeListener("get-teams-registered-reply", onReply);
          resolve(null);
        }, 5000);

        ipcRenderer.on("get-teams-registered-reply", onReply);
        ipcRenderer.send("get-teams-registered", { ...identity, __reqId: reqId });
      });
    },

    async loadSprintResult() {
      const q = this.$route.query || {};
      if (!q.eventId || !q.initialId || !q.raceId || !q.divisionId) {
        this.error = "Parameter hasil tidak lengkap.";
        return;
      }

      this.loading = true;
      this.error = "";

      const registeredNames = await this.fetchRegisteredSprintTeamNames(q);

      // kirim permintaan
      ipcRenderer.send("get-sprint-result", q);

      // timeout failsafe supaya UI tidak menggantung
      let timeoutId;
      const TIMEOUT_MS = 8000;

      await new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          this.loading = false;
          this.error = "Gagal memuat hasil (timeout). Coba ulangi.";
          resolve();
        }, TIMEOUT_MS);

        ipcRenderer.once("get-sprint-result-reply", (_e, res) => {
          clearTimeout(timeoutId);
          try {
            if (res && res.ok && Array.isArray(res.items)) {
              const rows = [];
              res.items.forEach((doc) => {
                const arr = Array.isArray(doc.result)
                  ? doc.result
                  : [doc.result || {}];
                arr.forEach((r) => {
                  const nameUpper = String(r.nameTeam || doc.nameTeam || "")
                    .trim()
                    .toUpperCase();
                  // tim sudah tidak terdaftar Sprint utk kombinasi ini →
                  // hasil lama ini usang, jangan ditampilkan
                  if (registeredNames && !registeredNames.has(nameUpper)) {
                    return;
                  }
                  const R = this.normalizeResult(r);
                  rows.push({
                    nameTeam: r.nameTeam || doc.nameTeam || "",
                    bibTeam: r.bibTeam || doc.bibTeam || "",
                    startTime: R.startTime || "",
                    finishTime: R.finishTime || "",
                    raceTime: R.raceTime || "",
                    totalPenalty: Number(R.totalPenalty) || 0,
                    penaltyTime:
                      R.totalPenaltyTime || R.penaltyTime || "00:00:00.000",
                    resultTime: R.penaltyTime
                      ? R.totalTime || R.raceTime || ""
                      : R.raceTime || "",
                    totalTime: R.totalTime || "",
                    ranked: Number(R.ranked) || 0,
                    score:
                      R.score !== undefined &&
                      R.score !== null &&
                      R.score !== ""
                        ? Number(R.score)
                        : 0,
                    // dipertahankan supaya tidak hilang saat menyimpan ulang
                    // (results di halaman ini tidak menampilkannya, tapi
                    // dokumen di DB punya field-field ini per tim)
                    startOrder: r.startOrder || "",
                    praStart: r.praStart || "",
                    intervalRace: r.intervalRace || "",
                    statusId: Number.isFinite(r.statusId) ? r.statusId : 0,
                    startPenalty: Number(R.startPenalty) || 0,
                    finishPenalty: Number(R.finishPenalty) || 0,
                    judgesBy: (r.result && r.result.judgesBy) || "",
                    judgesTime: (r.result && r.result.judgesTime) || "",
                  });
                });
              });

              this.results = this.computeRanksAndScores(rows);
              this.loading = false;
            } else {
              this.results = [];
              this.error = (res && res.error) || "Gagal memuat hasil.";
              this.loading = false;
            }
          } catch (err) {
            // jika parsing error, jangan biarkan UI menggantung
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
        if (!inst) return logger.warn("ref html2Pdf tidak ditemukan");
        await new Promise((r) => setTimeout(r, 200));
        await inst.generatePdf();
      } catch (e) {
        this.error = "Gagal membuat PDF";
      }
    },

    onBeforeDownload() {
      //
    },

    onPdfGenerated() {
      this.showPdf = false;
    },

    downloadExcel() {
      const rows = (this.results || []).map((r, idx) => ({
        No: idx + 1,
        "Team Name": r.nameTeam || "-",
        BIB: r.bibTeam || "-",
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
      exportRowsToExcel(`Sprint Result - ${eventName}`, rows, "Sprint Result");
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

/* ---- Redesign: Download Result & Switch Sprint Category buttons ---- */
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
.event-location {
  font-size: 18px;
  font-weight: 700;
  color: #444;
  margin: 4px 0 0;
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
  border-color: #9ec5ff;
  box-shadow: 0 0 0 3px rgba(42, 104, 196, 0.15);
}
.text-center {
  text-align: center;
}
.empty {
  text-align: center;
  color: #9aa0aa;
  padding: 16px;
}

/* buttons */
.icon-btn {
  border-radius: 10px;
  padding: 6px 9px;
}
.loading-row {
  display: inline-flex;
  align-items: center;
  margin: 8px 0 12px;
  color: #6a6f7a;
}

/* sr-only untuk html2pdf */
.sr-only {
  position: absolute !important;
  left: -99999px !important;
  top: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
}

.unofficial-stamp {
  color: #d9534f; /* merah */
  font-weight: bold;
  text-transform: uppercase;
  border: 2px solid #d9534f;
  padding: 4px 10px;
  border-radius: 4px;
  transform: rotate(5deg); /* sedikit miring biar mirip cap */
  opacity: 0.8;
  font-size: 1.3rem;
  letter-spacing: 1px;
  display: inline-block;
}

.official-stamp {
  color: #148a3b; /* hijau */
  border-color: #148a3b;
  transform: rotate(0deg); /* lurus */
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
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 0 20px rgba(0, 128, 255, 0.6);
}

.event-logo-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  border-radius: 10px;
}

/* ---- Styling utk Switch Sprint Category (dropdown toolbar) ---- */
.switch-category-panel {
  min-width: 260px;
}
.init-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: #f1f3f7;
  padding: 6px;
  border-radius: 10px;
}
.init-tab {
  border: none;
  background: transparent;
  color: #2b3445;
  font-weight: 700;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.25s ease;
}
.init-tab:hover {
  background: #dbeafe;
  color: #1e3a8a;
  cursor: pointer;
}
.init-tab.active {
  background: rgb(54, 142, 180);
  color: #fff;
}
/* ---- End styling utk Switch Sprint Category ---- */
</style>
