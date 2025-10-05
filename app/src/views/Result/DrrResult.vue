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
        <b-button
          :disabled="results.length === 0 || loading"
          variant="primary"
          class="action-btn"
          @click="generatePdf"
        >
          <Icon icon="mdi:download" class="mr-2" /> Download Result (PDF)
        </b-button>
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
              <th>No</th>
              <th>Team Name</th>
              <th>BIB</th>
              <th>Start Time</th>
              <th>Finish Time</th>
              <th>Race Time</th>
              <th>Penalty Total</th>
              <th>Penalty Time</th>
              <th>Result</th>
              <th>Ranked</th>
              <th>Score</th>
              <th v-if="!isOfficial">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(r, idx) in results" :key="idx">
              <td class="text-center">{{ idx + 1 }}</td>
              <td>
                <div class="team">{{ r.nameTeam || "-" }}</div>
              </td>
              <td class="text-center">{{ r.bibTeam || "-" }}</td>
              <td>{{ r.startTime || "00:00:00.000" }}</td>
              <td>{{ r.finishTime || "00:00:00.000" }}</td>
              <td>{{ r.raceTime || "00:00:00.000" }}</td>
              <td>{{ r.totalPenalty || "0" }}</td>
              <td>{{ r.penaltyTime || "00:00:00.000" }}</td>
              <td class="bold">{{ r.resultTime || "00:00:00.000" }}</td>
              <td class="text-center">{{ r.ranked || "-" }}</td>
              <td class="text-center">
                {{
                  r.score !== undefined && r.score !== null && r.score !== ""
                    ? r.score
                    : getScoreByRanked(r.ranked) || 0
                }}
              </td>
              <td class="text-center" v-if="!isOfficial">
                <b-button
                  size="sm"
                  variant="warning"
                  class="icon-btn"
                  @click="openEdit(r)"
                >
                  <Icon icon="mdi:pencil" />
                </b-button>
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
        <DrrPdf
          :data="pdfEventData"
          :dataParticipant="pdfParticipants"
          :categories="pdfCategories"
          :isOfficial="isOfficial"
          :drrCats="drrCats"
        />
      </section>
    </vue-html2pdf>
  </div>
</template>

<script>
import defaultImg from "@/assets/images/default-second.jpeg";
import EmptyStateFull from "@/components/EmptyStateFull.vue";
import VueHtml2pdf from "vue-html2pdf";
import DrrPdf from "../DetailEvent/ResultComponent/drr-pdfResult.vue";
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";

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
  components: { Icon, EmptyStateFull, DrrPdf, VueHtml2pdf },

  data() {
    return {
      defaultImg,
      isOfficial: false,
      loading: false,
      error: "",
      results: [],
      showPdf: false,
      eventInfo: {},

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
    };
  },

  computed: {
    hasEventLogo() {
      const ev = this.eventInfo || {};
      const logos = ev.event_logo;
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
      const logos = ev.event_logo;
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
      const payload = safeParse(
        localStorage.getItem(RACE_PAYLOAD_KEY) || "{}",
        {}
      );
      const b = payload.bucket || {};
      const q = this.$route.query || {};
      return {
        initial: b.initialName || q.initialName || "-",
        race: b.raceName || q.raceName || "-",
        division: b.divisionName || q.divisionName || "-",
      };
    },

    // Data untuk komponen PDF
    pdfEventData() {
      const out = {};
      const src = this.eventInfo || {};
      const keys = [
        "eventName",
        "addressCity",
        "riverName",
        "levelName",
        "startDateEvent",
        "endDateEvent",
        "addressVillage",
        "addressDistrict",
        "addressSubDistrict",
        "addressProvince",
        "addressState",
        "addressZipCode",
        "raceDirector",
        "chiefJudge",
        "event_logo",
      ];
      let i = 0;
      while (i < keys.length) {
        const k = keys[i];
        out[k] = src[k] != null ? src[k] : k === "event_logo" ? [] : "";
        i++;
      }
      if (!out.levelName) out.levelName = "-";
      return out;
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
    // OFFICIAL mode (per event)
    const k = this.officialKey();
    const saved = localStorage.getItem(k);
    if (saved !== null) this.isOfficial = saved === "1";

    // Event info dari IPC atau localStorage
    const q = this.$route.query || {};
    if (q.eventId) {
      await this.loadEventById(q.eventId);
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
    }

    this.loadDrrResult();
  },

  mounted() {
    window.addEventListener("pdf-generated", function (e) {
      console.log("[PDF EVENT] pdf-generated", e);
    });
    window.addEventListener("hasGenerated", function (e) {
      console.log("[PDF EVENT] hasGenerated", e);
    });
    window.addEventListener("pdfDownloaded", function (e) {
      console.log("[PDF EVENT] pdfDownloaded", e);
    });
  },

  methods: {
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
              this.eventInfo = res;
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

    officialKey() {
      const q = this.$route.query || {};
      return "resultOfficialMode:" + (q.eventId || "global");
    },

    toggleOfficial() {
      this.isOfficial = !this.isOfficial;
      localStorage.setItem(this.officialKey(), this.isOfficial ? "1" : "0");
    },

    openEdit(row) {
      this.$emit("edit-row", row);
    },

    getScoreByRanked(ranked) {
      let i = 0;
      const r = Number(ranked);
      while (i < this.dataScore.length) {
        const row = this.dataScore[i];
        if (row && row.ranking === r) return row.score;
        i++;
      }
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
              this.error = (res && res.error) || "Gagal memuat hasil.";
              this.loading = false;
              resolve();
              return;
            }

            // --- helper kecil ---
            const self = this;
            function asStr(v, d) {
              if (d === undefined) d = "";
              return v == null ? d : String(v);
            }
            function asNum(v, d) {
              if (d === undefined) d = 0;
              const n = Number(v);
              return Number.isFinite(n) ? n : d;
            }
            function timeOrZero(t) {
              const s = asStr(t, "");
              return s ? s : "00:00:00.000";
            }

            // NORMALISASI PENUH satu tim (lengkap, plus field datar utk tabel)
            function normalizeTeamFull(team) {
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

              // ATURAN BARU: kalau sectionPenalty = 0 → sectionPenaltyTime = []
              let sectionPenaltyTime = [];
              if (sectionPenalty > 0) {
                const a = rIn.sectionPenaltyTime;
                if (Array.isArray(a) && a.length > 0) {
                  let ii = 0;
                  while (ii < a.length) {
                    sectionPenaltyTime.push(timeOrZero(a[ii]));
                    ii++;
                  }
                } else {
                  // kalau penalti ada tapi array kosong → isi default 3 nol
                  sectionPenaltyTime = [
                    "00:00:00.000",
                    "00:00:00.000",
                    "00:00:00.000",
                  ];
                }
              } // else tetap []

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
                __resultMs: self.timeToMs(resultTime),
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
                penaltySection: (function () {
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
              const flat = self.normalizeResultFlat({ result: resultObj });
              const out = {
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
                sectionPenaltyTime: resultObj.sectionPenaltyTime
              };

              return out;
            }

            // rakit rows penuh
            const rows = [];
            const items = Array.isArray(res.items) ? res.items : [res.items];
            let di = 0;
            while (di < items.length) {
              const doc = items[di];
              const teams = doc && Array.isArray(doc.result) ? doc.result : [];
              let ti = 0;
              while (ti < teams.length) {
                rows.push(normalizeTeamFull(teams[ti]));
                ti++;
              }
              di++;
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
        if (!inst) {
          console.error("ref html2Pdf tidak ditemukan");
          return;
        }
        await new Promise(function (r) {
          setTimeout(r, 200);
        });
        await inst.generatePdf();
      } catch (e) {
        console.error("[PDF] gagal generate:", e);
        this.error = "Gagal membuat PDF";
      }
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
</style>
