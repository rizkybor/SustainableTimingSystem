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
              {{
                eventInfo.eventName || "-"
              }}
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
            >DRR RESULT | {{ sprintCats.initial }} -
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
              <th>No</th>
              <th>Team Name</th>
              <th>BIB</th>
              <th>Start Time</th>
              <th>Finish Time</th>
              <th>Race Time</th>
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
              <td>{{ r.startTime || "00:00:000" }}</td>
              <td>{{ r.finishTime || "00:00:000" }}</td>
              <td>{{ r.raceTime || "00:00:000" }}</td>
              <td>{{ r.penaltyTime || "00:00:000" }}</td>
              <td class="bold">{{ r.resultTime || "00:00:000" }}</td>
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
        <SprintPdf
          :data="pdfEventData"
          :dataParticipant="pdfParticipants"
          :categories="pdfCategories"
          :isOfficial="isOfficial"
          :sprintCats="sprintCats"
        />
      </section>
    </vue-html2pdf>
  </div>
</template>

<script>
import defaultImg from "@/assets/images/default-second.jpeg";
import EmptyStateFull from "@/components/EmptyStateFull.vue";
import VueHtml2pdf from "vue-html2pdf";
import SprintPdf from "../DetailEvent/ResultComponent/sprint-pdfResult.vue";
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
    return activeId && store[activeId]
      ? store[activeId]
      : Object.values(store)[0] || {};
  }
  if (Array.isArray(store)) {
    if (activeId) {
      const found = store.find((ev) => evIdToString(ev) === activeId);
      if (found) return found;
    }
    return store[0] || {};
  }
  return store; // single object
}

export default {
  name: "SprintResult",
  components: { Icon, EmptyStateFull, SprintPdf, VueHtml2pdf },
  data() {
    return {
      defaultImg,
      isOfficial: false,
      loading: false,
      error: "",
      results: [],
      showPdf: false,
      eventInfo: {},
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
    };
  },

  computed: {
     hasEventLogo() {
      var ev = this.eventInfo || {};
      var logos = ev.event_logo;
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
      var logos = ev.event_logo;
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
      const payload = safeParse(
        localStorage.getItem("raceStartPayload") || "{}",
        {}
      );
      const b = payload.bucket || {};
      const q = this.$route.query || {};
      return {
        // urutan sesuai permintaan: Initial, Race, Division
        initial: b.initialName || q.initialName || "-",
        race: b.raceName || q.raceName || "-",
        division: b.divisionName || q.divisionName || "-",
      };
    },
    // Info event dari localStorage (fallback ke query)
    eventInfo() {
      const ev = pickEventFromStore();
      const q = this.$route.query || {};
      console.log(q, ev,'<<< MINGGU')
      return {
        eventName: ev.eventName || q.eventName || "",
        addressCity:
          ev.addressCity || ev.location || q.addressCity || q.location || "",
        riverName: ev.riverName || q.riverName || "",
        levelName: ev.levelName || q.levelName || "",
        startDateEvent: ev.startDateEvent || q.startDateEvent || "",
        endDateEvent: ev.endDateEvent || q.endDateEvent || "",
        addressVillage: ev.addressVillage || "",
        addressDistrict: ev.addressDistrict || "",
        addressSubDistrict: ev.addressSubDistrict || "",
        addressProvince: ev.addressProvince || "",
        addressState: ev.addressState || "",
        addressZipCode: ev.addressZipCode || "",
        raceDirector: ev.raceDirector || "",
        chiefJudge: ev.chiefJudge || "",
      };
    },

    // Data untuk komponen PDF
    pdfEventData() {
      let a ={ ...this.eventInfo, levelName: this.eventInfo.levelName || "-" };
      return { ...this.eventInfo, levelName: this.eventInfo.levelName || "-" };
    },
    pdfParticipants() {
      return (this.results || []).map((r) => ({
        nameTeam: r.nameTeam,
        bibTeam: r.bibTeam,
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
    // load mode OFFICIAL dari localStorage (per event)
    const k = this.officialKey();
    const saved = localStorage.getItem(k);
    if (saved !== null) this.isOfficial = saved === "1";

        // ambil event langsung dari IPC
    const q = this.$route.query || {};
    console.log(q,'<<<< cek')
    if (q.eventId) {
      await this.loadEventById(q.eventId);
    }

    this.loadSprintResult();
  },

  mounted() {
    window.addEventListener("pdf-generated", (e) =>
      console.log("[PDF EVENT] pdf-generated", e)
    );
    window.addEventListener("hasGenerated", (e) =>
      console.log("[PDF EVENT] hasGenerated", e)
    );
    window.addEventListener("pdfDownloaded", (e) =>
      console.log("[PDF EVENT] pdfDownloaded", e)
    );
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
              this.eventInfo = res; // langsung simpan hasil ke data
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
      return `resultOfficialMode:${q.eventId || "global"}`;
    },

    toggleOfficial() {
      this.isOfficial = !this.isOfficial;
      localStorage.setItem(this.officialKey(), this.isOfficial ? "1" : "0");
    },

    // NEW: toggle & persist
    toggleOfficial() {
      this.isOfficial = !this.isOfficial;
      localStorage.setItem(this.officialKey(), this.isOfficial ? "1" : "0");
    },
    openEdit(row) {
      this.$emit("edit-row", row);
    },
    getScoreByRanked(ranked) {
      const m = this.dataScore.find((d) => d.ranking === Number(ranked));
      return m ? m.score : 0;
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

    async loadSprintResult() {
      const q = this.$route.query || {};
      if (!q.eventId || !q.initialId || !q.raceId || !q.divisionId) {
        this.error = "Parameter hasil tidak lengkap.";
        return;
      }

      this.loading = true;
      this.error = "";

      // kirim permintaan
      ipcRenderer.send("get-drr-result", q);

      // timeout failsafe supaya UI tidak menggantung
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
            if (res && res.ok && Array.isArray(res.items)) {
              const rows = [];
              res.items.forEach((doc) => {
                const arr = Array.isArray(doc.result)
                ? doc.result
                : [doc.result || {}];
                arr.forEach((r) => {
                  const R = this.normalizeResult(r);
                  console.log(R,'<<<<<< cek')

                  // rows.push({
                  //   nameTeam: r.nameTeam || doc.nameTeam || "",
                  //   bibTeam: r.bibTeam || doc.bibTeam || "",
                  //   startTime: R.startTime || "",
                  //   finishTime: R.finishTime || "",
                  //   raceTime: R.raceTime || "",
                  //   totalPenalty: Number(R.totalPenalty) || 0,
                  //   penaltyTime:
                  //     R.totalPenaltyTime || R.penaltyTime || "00:00:00.000",
                  //   resultTime: R.penaltyTime
                  //     ? R.totalTime || R.raceTime || ""
                  //     : R.raceTime || "",
                  //   totalTime: R.totalTime || "",
                  //   ranked: Number(R.ranked) || 0,
                  //   score:
                  //     R.score !== undefined &&
                  //     R.score !== null &&
                  //     R.score !== ""
                  //       ? Number(R.score)
                  //       : 0,
                  // });
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
        console.log("[PDF] klik tombol");
        this.showPdf = true;
        await this.$nextTick();

        const inst = this.$refs.html2Pdf;
        if (!inst) return console.error("ref html2Pdf tidak ditemukan");

        // Delay kecil supaya konten sempat render
        await new Promise((r) => setTimeout(r, 200));

        console.log("[PDF] memanggil generatePdf()…");
        await inst.generatePdf(); // v1.8.0 akan otomatis trigger download
        console.log("[PDF] generatePdf() selesai");
      } catch (e) {
        console.error("[PDF] gagal generate:", e);
        this.error = "Gagal membuat PDF";
      }
    },

    onBeforeDownload() {
      console.log("[PDF] sebelum download — siap generate PDF");
    },

    onPdfGenerated(pdf) {
      console.log("[PDF] pdfGenerated terpanggil:", pdf);
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
</style>
