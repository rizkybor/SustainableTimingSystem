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
              <img
                :src="hasEventLogo ? eventLogoUrl : defaultImg"
                alt="Event Logo"
                class="event-logo-img"
              />
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
        <span class="muted">Head to Head Result</span>
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
            Switch Head to Head Category
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
            >HEAD TO HEAD RESULT | {{ h2hCats.initial }} -
            {{ h2hCats.division }} {{ h2hCats.race }}
          </span>
        </h2>
      </div>

      <b-alert show variant="danger" v-if="error" class="mb-3">{{
        error
      }}</b-alert>
      <div v-if="loading" class="loading-row">
        <b-spinner small class="mr-2" /> Loading results...
      </div>

      <!-- ROUND TABS: pindah tampilan antar babak (Quarterfinals/Semifinals/
           Final B/Final A/dst.), plus tab "Overall" utk hasil akhir -->
      <div class="round-tabs mb-3" v-if="tabs.length > 1">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="round-tab"
          :class="{ active: activeTab === t.id }"
          @click="selectTab(t.id)"
        >
          {{ t.label }}
        </button>
      </div>

      <template v-if="activeTab === 'overall'">
        <!-- PODIUM -->
        <div class="rx-podium mb-4" v-if="!loading && podium.length">
          <b-row>
            <b-col md="3" v-for="p in podium" :key="p.ranked">
              <div class="rx-podium-card">
                <div class="rx-podium-place">#{{ p.ranked }}</div>
                <div class="rx-podium-name">
                  {{ p.name || "-" }}
                  <CountryFlag :code="flagFor(p.name)" />
                </div>
                <div class="rx-podium-bib">BIB {{ p.bib || "-" }}</div>
              </div>
            </b-col>
          </b-row>
        </div>

        <!-- Empty state -->
        <EmptyStateFull
          v-if="!loading && results.length === 0"
          :img-src="require('@/assets/images/404.png')"
          title="No data available"
          subtitle="Hasil Head to Head belum tersedia untuk kategori ini."
          primary-text="Kembali ke Event"
          @primary="goBack"
        />

        <!-- Table Overall -->
        <div v-else class="table-wrap">
          <table class="result-table">
            <thead>
              <tr>
                <th class="text-center">No</th>
                <th class="text-start">Team Name</th>
                <th class="text-center">BIB</th>
                <th class="text-center">Ranked</th>
                <th class="text-center">Score</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(r, idx) in results" :key="idx">
                <td class="text-center">{{ idx + 1 }}</td>
                <td>
                  <div class="team">
                    {{ r.name || "-" }}
                    <CountryFlag :code="flagFor(r.name)" />
                  </div>
                </td>
                <td class="text-center">{{ r.bib || "-" }}</td>
                <td class="text-center">{{ r.ranked || "-" }}</td>
                <td class="text-center">{{ r.score || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Table per-babak: lengkap + editable Start/Finish Time & Penalties Group -->
      <template v-else>
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="text-muted small">
            <span v-if="isOfficial">
              Hasil sudah <strong>OFFICIAL</strong> — klik status di kanan
              atas utk kembali ke UNOFFICIAL sebelum bisa mengedit.
            </span>
            <span v-else>
              Ubah Start Time / Finish Time / Penalties Group lalu klik Save
              Round utk menyimpan.
            </span>
          </div>
          <b-button
            variant="success"
            size="sm"
            :disabled="savingRound || !editRows.length || isOfficial"
            @click="saveRoundEdits"
          >
            <b-spinner v-if="savingRound" small class="mr-1" />
            {{ savingRound ? "Menyimpan…" : "Save Round" }}
          </b-button>
        </div>

        <EmptyStateFull
          v-if="!editRows.length"
          :img-src="require('@/assets/images/404.png')"
          title="Belum ada tim di babak ini"
          subtitle="Babak ini belum punya tim yang di-assign ke bagan."
        />

        <div v-else class="table-wrap">
          <table class="result-table round-result-table">
            <thead>
              <tr>
                <th rowspan="2" class="text-center">No</th>
                <th rowspan="2" class="text-start">Team Name</th>
                <th rowspan="2" class="text-center">BIB</th>
                <th rowspan="2" class="text-center">Heat</th>
                <th rowspan="2" class="text-center">Start Time</th>
                <th rowspan="2" class="text-center">Finish Time</th>
                <th rowspan="2" class="text-center">Race Time</th>
                <th colspan="9" class="text-center">Penalties Group</th>
                <th rowspan="2" class="text-center">Pen. Total</th>
                <th rowspan="2" class="text-center">Pen. Time</th>
                <th rowspan="2" class="text-center">Result</th>
                <th rowspan="2" class="text-center">Win/Lose</th>
              </tr>
              <tr>
                <th class="text-center pen-col">PS</th>
                <th class="text-center pen-col">CL</th>
                <th class="text-center pen-col">R1</th>
                <th class="text-center pen-col">R2</th>
                <th class="text-center pen-col">L1</th>
                <th class="text-center pen-col">L2</th>
                <th class="text-center pen-col">PB</th>
                <th class="text-center pen-col">PF</th>
                <th class="text-center pen-col">PO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in editRows" :key="r.name + '-' + r.bib">
                <td class="text-center">{{ idx + 1 }}</td>
                <td>
                  <div class="team">
                    {{ r.name || "-" }}
                    <CountryFlag :code="flagFor(r.name)" />
                  </div>
                </td>
                <td class="text-center">{{ r.bib || "-" }}</td>
                <td class="text-center">{{ r.heat != null ? r.heat : "-" }}</td>
                <td>
                  <b-form-input
                    v-model="r.startTime"
                    size="sm"
                    placeholder="00:00:00.000"
                    style="min-width: 120px"
                    @change="onRowFieldChange(r)"
                    :disabled="isOfficial"
                  />
                </td>
                <td>
                  <b-form-input
                    v-model="r.finishTime"
                    size="sm"
                    placeholder="00:00:00.000"
                    style="min-width: 120px"
                    @change="onRowFieldChange(r)"
                    :disabled="isOfficial"
                  />
                </td>
                <td class="text-center text-monospace">
                  {{ r.raceTime || "-" }}
                </td>
                <td class="pen-col">
                  <b-form-input
                    v-model.number="r.s"
                    type="number"
                    min="0"
                    size="sm"
                    style="min-width: 60px"
                    @change="onRowFieldChange(r)"
                    :disabled="isOfficial"
                  />
                </td>
                <td class="pen-col">
                  <b-form-input
                    v-model.number="r.cl"
                    type="number"
                    min="0"
                    size="sm"
                    style="min-width: 60px"
                    @change="onRowFieldChange(r)"
                    :disabled="isOfficial"
                  />
                </td>
                <td class="pen-col text-center">{{ r.r1 || "—" }}</td>
                <td class="pen-col text-center">{{ r.r2 || "—" }}</td>
                <td class="pen-col text-center">{{ r.l1 || "—" }}</td>
                <td class="pen-col text-center">{{ r.l2 || "—" }}</td>
                <td class="pen-col">
                  <b-form-input
                    v-model.number="r.pb"
                    type="number"
                    min="0"
                    size="sm"
                    style="min-width: 60px"
                    @change="onRowFieldChange(r)"
                    :disabled="isOfficial"
                  />
                </td>
                <td class="pen-col">
                  <b-form-input
                    v-model.number="r.f"
                    type="number"
                    min="0"
                    size="sm"
                    style="min-width: 60px"
                    @change="onRowFieldChange(r)"
                    :disabled="isOfficial"
                  />
                </td>
                <td class="pen-col">
                  <b-form-input
                    v-model.number="r.o"
                    type="number"
                    min="0"
                    size="sm"
                    style="min-width: 60px"
                    @change="onRowFieldChange(r)"
                    :disabled="isOfficial"
                  />
                </td>
                <td class="text-center">{{ r.penaltyTotal || 0 }}</td>
                <td class="text-center text-monospace">
                  {{ r.penaltyTime || "00:00:00.000" }}
                </td>
                <td class="text-center text-monospace bold">
                  {{ r.totalTime || "-" }}
                </td>
                <td
                  class="text-center bold"
                  :class="{
                    'win-text': r.winLose === 'Win',
                    'lose-text': r.winLose === 'Lose',
                  }"
                >
                  {{ r.winLose || "-" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Komponen PDF (disembunyikan dari layar, tapi ada di DOM) -->
    <vue-html2pdf
      v-if="showPdf"
      ref="html2Pdf"
      :show-layout="false"
      :float-layout="false"
      :enable-download="true"
      :preview-modal="false"
      :manual-pagination="true"
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
        <HeadToHeadPdf
          :data="pdfEventData"
          pdfMode="allround"
          :pdfOverallPkg="pdfOverallPkg"
          :isOfficial="isOfficial"
          :headToHeadCats="h2hCats"
          :countryMap="_teamCountryMap"
        />
      </section>
    </vue-html2pdf>

    <PrintOverallModal
      centered
      :show="showOverallModal"
      :dataEvent="eventInfo"
      :aggregate="dataAggregate"
      :raceCats="h2hCats"
      :categories="visibleCategories"
      @close="showOverallModal = false"
    />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import HeadToHeadPdf from "../DetailEvent/ResultComponent/head-to-head-pdfResult.vue";
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
import { exportSheetsToExcel } from "@/utils/exportExcel";

const RACE_PAYLOAD_KEY = "raceStartPayload";

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export default {
  name: "HeadToHeadResult",
  components: {
    Icon,
    EmptyStateFull,
    HeadToHeadPdf,
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
      // semua bucket registrasi (lintas race category) utk event ini,
      // dipakai cross-check di buildAggregateFromDoc() (modal Print Result
      // Overall) — lihat src/utils/registeredTeamsFilter.js
      registeredBuckets: [],
      // Race Category yang benar-benar dipilih utk event ini — null =
      // fail-open (tampilkan semua kolom kategori)
      enabledCategoryKeys: null,
      results: [],
      podium: [],
      showPdf: false,
      eventInfo: {},
      showOverallModal: false,
      dataAggregate: null,
      selectedInitialName: "",
      // Round tabs: "overall" (default, hasil akhir) atau id round bagan
      // (Quarterfinals/Semifinals/Final A/Final B dst.) — lihat tabs().
      activeTab: "overall",
      // Struktur bagan (h2h_brackets) — dipakai membangun daftar tab +
      // daftar tim per babak (siapa lawan siapa, nomor Heat).
      bracketRounds: [],
      // Semua baris hasil TERSIMPAN lintas babak (h2h_results) — dipakai
      // mengisi editRows dgn data yg sudah ada saat pindah tab.
      roundResultsRaw: [],
      // Baris yang SEDANG diedit utk babak aktif (activeTab, kalau bukan
      // "overall") — salinan lokal, baru dikirim ke DB saat "Save Round".
      editRows: [],
      savingRound: false,
    };
  },

  computed: {
    visibleCategories() {
      return getVisibleCategoryMeta(this.enabledCategoryKeys);
    },
    // Daftar tab: tiap babak di bagan (urutan sesuai h2h_brackets.rounds,
    // Final B sudah disisipkan sebelum Final A oleh HeadToHead.vue) +
    // "Overall" di akhir sbg tab hasil akhir (default aktif).
    tabs() {
      const roundTabs = (this.bracketRounds || []).map((r) => ({
        id: r.id,
        label: r.bronze ? "Final B" : r.name,
      }));
      return [...roundTabs, { id: "overall", label: "Overall" }];
    },
    bucketData() {
      const q = this.$route.query || {};
      const eventId = String(q.eventId || this.$route.params.id || "");
      return buildStaticBucketOptions(this.eventInfo, eventId);
    },
    bucketInitials() {
      return this.bucketData.initials;
    },
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
      var logos = this.eventInfo.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        var first = logos[0];
        if (typeof first === "string" && first) return true;
        if (first && typeof first === "object" && first.url) return true;
      }
      return false;
    },
    eventLogoUrl() {
      var logos = this.eventInfo.eventFiles;
      if (Array.isArray(logos) && logos.length > 0) {
        var first = logos[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object") return first.url || "";
      }
      return "";
    },
    h2hCats() {
      // BUG FIX: dulu localStorage (RACE_PAYLOAD_KEY) diprioritaskan di atas
      // $route.query — cocok dulu krn satu-satunya cara masuk ke halaman ini
      // adalah dari Race Detail yg selalu menulis localStorage bucket SAAT
      // ITU JUGA (selalu sinkron dgn query). Sekarang "Switch Head to Head
      // Category" berpindah bucket murni lewat query (router push), TANPA
      // menyentuh localStorage — localStorage jadi bucket LAMA yg basi,
      // sehingga judul "HEAD TO HEAD RESULT | ..." tetap menampilkan bucket
      // sebelumnya walau tabel hasil di bawahnya sudah benar pindah (tabel
      // pakai resolveBucket(), yg SUDAH benar memprioritaskan query). Balik
      // urutannya: query dulu (mencerminkan bucket yg BENAR2 sedang
      // ditampilkan), localStorage cuma fallback kalau query kosong.
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
    pdfFilename() {
      const parts = [];
      if (this.eventInfo && this.eventInfo.eventName) {
        parts.push(this.eventInfo.eventName);
      }
      parts.push(
        "HEAD TO HEAD (" +
          (this.h2hCats.initial || "-") +
          " - " +
          (this.h2hCats.division || "-") +
          " " +
          (this.h2hCats.race || "-") +
          ")"
      );
      return parts.join(" - ");
    },
    pdfEventData() {
      return { ...this.eventInfo, levelName: this.eventInfo.levelName || "-" };
    },
    pdfOverallPkg() {
      return {
        overallRows: (this.results || []).map((r) => ({
          name: r.name,
          bib: r.bib,
          ranked: r.ranked,
          score: r.score,
        })),
        // Breakdown lengkap per babak (Start/Finish/Race Time + Penalties
        // Group PS/CL/R1/R2/L1/L2/PB/PF/PO) — dipakai pdfMode "allround" di
        // head-to-head-pdfResult.vue supaya "Download Result" PDF-nya
        // lengkap, bukan cuma ringkasan Overall Score/Rank.
        rounds: this.pdfRoundsForExport,
      };
    },
    // Bentuk ulang bracketRounds + roundResultsRaw jadi { roundId, roundName,
    // rows:[...] } per babak, dgn field name yg sama persis dgn yg dipakai
    // buildRoundRows() di HeadToHead.vue (dan yg sudah dirender pdfMode
    // "allround") — no/heat/team/bib/penalties/penaltyTime/penaltySum/
    // start/finish/race/total/winLose.
    pdfRoundsForExport() {
      return (this.bracketRounds || []).map((round) => {
        const seen = new Set();
        const rows = [];
        (round.matches || []).forEach((m) => {
          [m.team1, m.team2].forEach((t) => {
            if (!t || !t.name) return;
            const key =
              String(t.name).toUpperCase() + "|" + String(t.bibTeam || "");
            if (seen.has(key)) return;
            seen.add(key);

            const saved = this.roundResultsRaw.find(
              (row) =>
                String(row.roundId) === String(round.id) &&
                String(row.nameTeam || "").toUpperCase() ===
                  String(t.name).toUpperCase()
            );
            const sr = (saved && saved.result) || {};
            const pen =
              sr.penalties && typeof sr.penalties === "object"
                ? sr.penalties
                : {};

            rows.push({
              no: rows.length + 1,
              heat: m.heat != null ? m.heat : null,
              team: t.name,
              bib: t.bibTeam || "",
              penalties: pen,
              penaltyTime: sr.penaltyTime || "00:00:00.000",
              penaltySum: Number(sr.penalty) || 0,
              start: sr.startTime || "",
              finish: sr.finishTime || "",
              race: sr.raceTime || "",
              total: sr.totalTime || "",
              winLose: sr.winLose || "",
            });
          });
        });

        return {
          roundId: round.id,
          roundName: round.bronze ? "Final B" : round.name,
          rows,
        };
      });
    },
  },

  async created() {
    const q = this.$route.query || {};
    if (q.eventId) {
      await this.loadEventById(q.eventId);
      this.registeredBuckets = await loadRegisteredBucketsByEvent(q.eventId);
      this.enabledCategoryKeys = await loadEnabledCategoryKeys(q.eventId);
    }
    this.selectedInitialName = String(q.initialName || "").toUpperCase();
    await this.loadH2HResult();
    await this.loadBracketAndRoundResults();
  },

  methods: {
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
          eventName: "HEAD2HEAD",
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

    async loadEventById(eventId) {
      try {
        this.loading = true;
        ipcRenderer.send("get-events-byid", eventId);
        await new Promise((resolve) => {
          ipcRenderer.once("get-events-byid-reply", (_e, res) => {
            this.loading = false;
            this.eventInfo = res && typeof res === "object" ? res : {};
            this.isOfficial = !!this.eventInfo.resultsOfficial;
            resolve();
          });
        });
      } catch (err) {
        this.loading = false;
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

    async loadH2HResult() {
      const bucket = this.resolveBucket();
      if (
        !bucket.eventId ||
        !bucket.initialId ||
        !bucket.raceId ||
        !bucket.divisionId
      ) {
        this.error = "Parameter hasil tidak lengkap.";
        return;
      }
      if (typeof ipcRenderer === "undefined") return;

      this.loading = true;
      this.error = "";
      await new Promise((resolve) => {
        ipcRenderer.once("h2h:overall:get-reply", (_e, res) => {
          this.loading = false;
          if (res && res.ok && res.item) {
            const overallRows = Array.isArray(res.item.overallRows)
              ? res.item.overallRows
              : [];
            this.results = overallRows
              .slice()
              .sort((a, b) => (a.ranked || 999) - (b.ranked || 999));
            this.podium = this.results.filter(
              (r) => Number(r.ranked) > 0 && Number(r.ranked) <= 4
            );
          } else {
            this.results = [];
            this.podium = [];
            this.error = (res && res.error) || "";
          }
          resolve();
        });
        ipcRenderer.send("h2h:overall:get", bucket);
      });
    },

    // Fetch satu kali (reqId-safe) — h2h:bracket:get & h2h:results:getAll
    // echo balik __reqId (lihat ipcMainServices.js), jadi aman dipanggil
    // brengan tanpa risiko salah tangkap balasan channel yg sama.
    _fetchOnce(channel, payload) {
      return new Promise((resolve) => {
        const replyChannel = channel + "-reply";
        const reqId = Date.now() + "-" + Math.random().toString(36).slice(2);
        let settled = false;
        const onReply = (_e, res) => {
          if (!res || res.__reqId !== reqId) return;
          if (settled) return;
          settled = true;
          ipcRenderer.removeListener(replyChannel, onReply);
          resolve(res);
        };
        ipcRenderer.on(replyChannel, onReply);
        ipcRenderer.send(channel, { ...payload, __reqId: reqId });
        setTimeout(() => {
          if (settled) return;
          settled = true;
          ipcRenderer.removeListener(replyChannel, onReply);
          resolve(null);
        }, 5000);
      });
    },

    // Muat struktur bagan (utk daftar tab + tim per babak) & semua hasil
    // per-round tersimpan (utk mengisi editRows) — dipanggil sekali saat
    // halaman dibuka, lalu dipakai ulang tiap kali pindah tab.
    async loadBracketAndRoundResults() {
      if (typeof ipcRenderer === "undefined") return;
      const bucket = this.resolveBucket();
      if (
        !bucket.eventId ||
        !bucket.initialId ||
        !bucket.raceId ||
        !bucket.divisionId
      ) {
        return;
      }

      const [bracketRes, resultsRes] = await Promise.all([
        this._fetchOnce("h2h:bracket:get", bucket),
        this._fetchOnce("h2h:results:getAll", bucket),
      ]);

      this.bracketRounds =
        bracketRes &&
        bracketRes.ok &&
        bracketRes.item &&
        Array.isArray(bracketRes.item.rounds)
          ? bracketRes.item.rounds.map((r) => ({
              id: r.id,
              name: r.name,
              bronze: !!r.bronze,
              matches: Array.isArray(r.matches) ? r.matches : [],
            }))
          : [];
      this.roundResultsRaw =
        resultsRes && resultsRes.ok && Array.isArray(resultsRes.items)
          ? resultsRes.items
          : [];
    },

    _findRound(id) {
      return (this.bracketRounds || []).find((r) => String(r.id) === String(id)) || null;
    },

    selectTab(id) {
      this.activeTab = id;
      if (id !== "overall") {
        this.buildEditRowsForRound(id);
      }
    },

    // Bangun daftar baris editable utk satu babak: semua tim yg SUDAH
    // ditempatkan di slot match babak ini (dari struktur bagan), diisi
    // dgn hasil tersimpan kalau ada (h2h_results), atau kosong kalau
    // belum pernah di-input sama sekali.
    buildEditRowsForRound(roundId) {
      const round = this._findRound(roundId);
      if (!round) {
        this.editRows = [];
        return;
      }

      const seen = new Set();
      const rows = [];
      (round.matches || []).forEach((m) => {
        [m.team1, m.team2].forEach((t) => {
          if (!t || !t.name) return;
          const key = String(t.name).toUpperCase() + "|" + String(t.bibTeam || "");
          if (seen.has(key)) return;
          seen.add(key);

          const saved = this.roundResultsRaw.find(
            (row) =>
              String(row.roundId) === String(roundId) &&
              String(row.nameTeam || "").toUpperCase() ===
                String(t.name).toUpperCase()
          );
          const sr = (saved && saved.result) || {};
          const pen =
            sr.penalties && typeof sr.penalties === "object" ? sr.penalties : {};

          rows.push({
            name: t.name,
            bib: t.bibTeam || "",
            heat: m.heat != null ? m.heat : null,
            startTime: sr.startTime || "",
            finishTime: sr.finishTime || "",
            raceTime: sr.raceTime || "",
            s: pen.s !== undefined && pen.s !== null ? pen.s : "",
            cl: pen.cl !== undefined && pen.cl !== null ? pen.cl : "",
            r1: pen.r1 || "",
            r2: pen.r2 || "",
            l1: pen.l1 || "",
            l2: pen.l2 || "",
            pb: pen.pb !== undefined && pen.pb !== null ? pen.pb : "",
            f: pen.f !== undefined && pen.f !== null ? pen.f : "",
            o: pen.o !== undefined && pen.o !== null ? pen.o : "",
            penaltyTotal: 0,
            penaltyTime: sr.penaltyTime || "00:00:00.000",
            totalTime: sr.totalTime || "",
            winLose: sr.winLose || "",
          });
        });
      });

      rows.forEach((r) => this.recomputeRow(r));
      this.editRows = rows;
      this.computeWinLoseForEditRows();
    },

    // ---- Helper waktu (HH:MM:SS.mmm <-> ms) — mandiri per halaman, sama
    // pola dgn Result page lain (tiap halaman self-contained, tdk ada util
    // waktu bersama di codebase ini).
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
      const pad = (n, w) => String(Math.trunc(n)).padStart(w, "0");
      const hh = Math.floor(ms / 3600000);
      const mm = Math.floor((ms % 3600000) / 60000);
      const ss = Math.floor((ms % 60000) / 1000);
      const mss = Math.round(ms % 1000);
      return `${pad(hh, 2)}:${pad(mm, 2)}:${pad(ss, 2)}.${pad(mss, 3)}`;
    },

    // Hitung ulang Race Time (Finish - Start), Penalty Total/Time, dan
    // Total Time (Race + Penalty) satu baris — dipanggil tiap kali field
    // Start/Finish/Penalties diedit. Catatan: PB di sini adalah field
    // yang diedit LANGSUNG (detik), BUKAN dihitung otomatis dari
    // R1/R2/L1/L2 seperti di halaman Race Detail (HeadToHead.vue) — mesin
    // hitung booyan-mode di sana bergantung pengaturan event (Judges
    // Configuration) yg sengaja tidak diduplikasi di sini supaya tidak
    // ada dua implementasi aturan yg bisa berbeda hasil.
    recomputeRow(row) {
      const startMs = this._parseHmsToMs(row.startTime);
      const finishMs = this._parseHmsToMs(row.finishTime);
      row.raceTime =
        Number.isFinite(startMs) && Number.isFinite(finishMs) && finishMs >= startMs
          ? this._msToHms(finishMs - startMs)
          : "";

      const penSeconds = ["s", "cl", "pb", "f", "o"].reduce(
        (sum, k) => sum + (Number(row[k]) || 0),
        0
      );
      row.penaltyTotal = penSeconds;
      row.penaltyTime = this._msToHms(penSeconds * 1000) || "00:00:00.000";

      const raceMs = this._parseHmsToMs(row.raceTime);
      row.totalTime = Number.isFinite(raceMs)
        ? this._msToHms(raceMs + penSeconds * 1000)
        : "";
    },

    onRowFieldChange(row) {
      this.recomputeRow(row);
      this.computeWinLoseForEditRows();
    },

    // Win/Lose per match: bandingkan Total Time kedua sisi match yg sama
    // (pairing sudah pasti dari posisi slot bagan, bukan dari Heat).
    computeWinLoseForEditRows() {
      const round = this._findRound(this.activeTab);
      if (!round) return;
      (round.matches || []).forEach((m) => {
        const n1 = m.team1 && m.team1.name;
        const n2 = m.team2 && m.team2.name;
        if (!n1 || !n2) return;
        const row1 = this.editRows.find((r) => r.name === n1);
        const row2 = this.editRows.find((r) => r.name === n2);
        if (!row1 || !row2) return;
        const t1 = this._parseHmsToMs(row1.totalTime);
        const t2 = this._parseHmsToMs(row2.totalTime);
        if (!Number.isFinite(t1) || !Number.isFinite(t2)) {
          row1.winLose = "";
          row2.winLose = "";
          return;
        }
        if (t1 < t2) {
          row1.winLose = "Win";
          row2.winLose = "Lose";
        } else if (t2 < t1) {
          row1.winLose = "Lose";
          row2.winLose = "Win";
        } else {
          row1.winLose = "";
          row2.winLose = "";
        }
      });
    },

    async saveRoundEdits() {
      // Guard tambahan (selain :disabled di tombol/input) — hasil yg sudah
      // OFFICIAL tidak boleh diedit lagi lewat jalur mana pun.
      if (this.isOfficial) return;
      if (this.activeTab === "overall" || typeof ipcRenderer === "undefined") return;
      const round = this._findRound(this.activeTab);
      if (!round || !this.editRows.length) return;

      const bucket = this.resolveBucket();
      const rows = this.editRows.map((r) => ({
        team: r.name,
        bib: r.bib,
        start: r.startTime,
        finish: r.finishTime,
        race: r.raceTime,
        total: r.totalTime,
        penaltyTime: r.penaltyTime,
        penaltySum: r.penaltyTotal,
        winLose: r.winLose || null,
        heat: r.heat,
        penalties: {
          s: r.s,
          cl: r.cl,
          r1: r.r1,
          r2: r.r2,
          l1: r.l1,
          l2: r.l2,
          pb: r.pb,
          f: r.f,
          o: r.o,
        },
      }));

      this.savingRound = true;
      try {
        await new Promise((resolve) => {
          ipcRenderer.once("h2h:round:save-reply", (_e, res) => {
            if (res && res.ok) {
              this.$bvToast &&
                this.$bvToast.toast("Round tersimpan.", {
                  variant: "success",
                  title: "Saved",
                  autoHideDelay: 2000,
                });
            } else {
              this.$bvToast &&
                this.$bvToast.toast((res && res.error) || "Gagal menyimpan.", {
                  variant: "danger",
                  title: "Failed",
                });
            }
            resolve();
          });
          ipcRenderer.send("h2h:round:save", {
            bucket,
            roundId: round.id,
            roundName: round.bronze ? "Final B" : round.name,
            rows,
          });
        });
        await this.loadBracketAndRoundResults();
        this.buildEditRowsForRound(this.activeTab);
      } finally {
        this.savingRound = false;
      }
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
    onBeforeDownload() {},

    downloadExcel() {
      // BUG FIX: dulu cuma sheet Overall (No/Team/BIB/Ranked/Score) — sama
      // seperti PDF sebelum diperbaiki, Penalties Group (PS/CL/R1/R2/L1/
      // L2/PB/PF/PO) tidak pernah ikut ter-export sama sekali. Sekarang
      // multi-sheet: "Overall" + satu sheet per babak dgn breakdown lengkap
      // (sumber data sama persis dgn yg dipakai PDF "allround" —
      // pdfRoundsForExport).
      const overallRows = (this.results || []).map((r, idx) => ({
        No: idx + 1,
        "Team Name": r.name || "-",
        BIB: r.bib || "-",
        Ranked: r.ranked || "-",
        Score: r.score || 0,
      }));

      const sheets = [{ name: "Overall", rows: overallRows }];

      (this.pdfRoundsForExport || []).forEach((R) => {
        const rows = (R.rows || []).map((row) => {
          const pen = row.penalties || {};
          return {
            No: row.no,
            "Team Name": row.team || "-",
            BIB: row.bib || "-",
            Heat: row.heat != null ? row.heat : "-",
            "Start Time": row.start || "",
            "Finish Time": row.finish || "",
            "Race Time": row.race || "",
            PS: pen.s !== undefined && pen.s !== null && pen.s !== "" ? pen.s : "—",
            CL: pen.cl !== undefined && pen.cl !== null && pen.cl !== "" ? pen.cl : "—",
            R1: pen.r1 || "—",
            R2: pen.r2 || "—",
            L1: pen.l1 || "—",
            L2: pen.l2 || "—",
            PB: pen.pb !== undefined && pen.pb !== null && pen.pb !== "" ? pen.pb : "—",
            PF: pen.f !== undefined && pen.f !== null && pen.f !== "" ? pen.f : "—",
            PO: pen.o !== undefined && pen.o !== null && pen.o !== "" ? pen.o : "—",
            "Penalty Time": row.penaltyTime || "00:00:00.000",
            "Penalty Sum": row.penaltySum || 0,
            "Total Time": row.total || "",
            "Win/Lose": row.winLose || "",
          };
        });
        sheets.push({ name: R.roundName || "Round", rows });
      });

      const eventName = (this.eventInfo && this.eventInfo.eventName) || "Event";
      exportSheetsToExcel(`Head to Head Result - ${eventName}`, sheets);
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
.empty {
  text-align: center;
  color: #9aa0aa;
  padding: 16px;
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

/* ---- Styling utk Switch Head to Head Category (dropdown toolbar) ---- */
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
/* ---- End styling utk Switch Head to Head Category ---- */

/* ---- Round tabs (ganti tampilan antar babak / Overall) ---- */
.round-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: #f1f3f7;
  padding: 6px;
  border-radius: 12px;
  width: fit-content;
}
.round-tab {
  border: none;
  background: transparent;
  color: #2b3445;
  font-weight: 700;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 9px;
  transition: all 0.2s ease;
}
.round-tab:hover {
  background: #dbeafe;
  color: #1e3a8a;
  cursor: pointer;
}
.round-tab.active {
  background: rgb(54, 142, 180);
  color: #fff;
}

/* ---- Tabel per-babak (editable) ---- */
.round-result-table .pen-col {
  min-width: 64px;
}
.win-text {
  color: #1a7f4f;
}
.lose-text {
  color: #c0392b;
}
.text-monospace {
  font-variant-numeric: tabular-nums;
}
</style>
