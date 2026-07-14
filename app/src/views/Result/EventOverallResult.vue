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
        <span class="muted">Event Overall Result</span>
      </div>

      <div class="right-actions">
        <b-button
          :disabled="buckets.length === 0 || loading"
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

      <div class="event-header">
        <h2 class="event-name">
          <span class="muted">EVENT OVERALL RESULT — SELURUH KATEGORI</span>
        </h2>
      </div>

      <b-alert show variant="danger" v-if="error" class="mb-3">{{
        error
      }}</b-alert>
      <div v-if="loading" class="loading-row">
        <b-spinner small class="mr-2" /> Loading results...
      </div>

      <EmptyStateFull
        v-if="!loading && buckets.length === 0"
        :img-src="require('@/assets/images/404.png')"
        title="No data available"
        subtitle="Belum ada Overall Score yang tersimpan untuk event ini."
        primary-text="Kembali ke Event"
        @primary="goBack"
      />

      <div v-else class="bucket-list">
        <div
          class="bucket-block"
          v-for="(b, bIdx) in buckets"
          :key="bIdx"
        >
          <div class="bucket-title">
            {{ b.divisionName }} {{ b.raceName }} – {{ b.initialName }}
          </div>

          <div class="table-wrap">
            <table class="result-table-overall">
              <thead>
                <tr>
                  <th rowspan="2" class="w-60 text-center">No</th>
                  <th rowspan="2" class="team-col">Team Name</th>
                  <th rowspan="2" class="w-70 text-center">BIB</th>

                  <th colspan="2" class="group sprint text-center">Sprint</th>
                  <th colspan="2" class="group h2h text-center">H2H</th>
                  <th colspan="2" class="group slalom text-center">Slalom</th>
                  <th colspan="2" class="group drr text-center">DRR</th>
                  <th colspan="2" class="group rx text-center">
                    Rafting Cross
                  </th>

                  <th rowspan="2" class="w-110 text-center">Total Score</th>
                  <th rowspan="2" class="w-110 text-center">Rank Overall</th>
                </tr>
                <tr>
                  <th class="sub">Score</th>
                  <th class="sub">Ranked</th>
                  <th class="sub">Score</th>
                  <th class="sub">Ranked</th>
                  <th class="sub">Score</th>
                  <th class="sub">Ranked</th>
                  <th class="sub">Score</th>
                  <th class="sub">Ranked</th>
                  <th class="sub">Score</th>
                  <th class="sub">Ranked</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in b.rows" :key="i">
                  <td class="text-center">{{ i + 1 }}</td>
                  <td>
                    {{ row.teamName || "-" }}
                    <CountryFlag :code="flagFor(row.teamName)" />
                  </td>
                  <td class="text-center">{{ row.bib || "-" }}</td>

                  <td class="text-center">{{ row.sprintScore || 0 }}</td>
                  <td class="text-center">{{ row.sprintRank || "-" }}</td>
                  <td class="text-center">{{ row.h2hScore || 0 }}</td>
                  <td class="text-center">{{ row.h2hRank || "-" }}</td>
                  <td class="text-center">{{ row.slalomScore || 0 }}</td>
                  <td class="text-center">{{ row.slalomRank || "-" }}</td>
                  <td class="text-center">{{ row.drrScore || 0 }}</td>
                  <td class="text-center">{{ row.drrRank || "-" }}</td>
                  <td class="text-center">{{ row.rxScore || 0 }}</td>
                  <td class="text-center">{{ row.rxRank || "-" }}</td>

                  <td class="text-center font-weight-bold">
                    {{ row.totalScore || 0 }}
                  </td>
                  <td class="text-center font-weight-bold">
                    {{ row.rank || "-" }}
                  </td>
                </tr>
                <tr v-if="!b.rows.length">
                  <td class="empty" colspan="15">No data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
        <EventOverallPdf
          :data="pdfEventData"
          :buckets="buckets"
          :isOfficial="isOfficial"
        />
      </section>
    </vue-html2pdf>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import EventOverallPdf from "../DetailEvent/ResultComponent/Overall/event-overall-pdfResult.vue";
import EmptyStateFull from "@/components/EmptyStateFull.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import VueHtml2pdf from "vue-html2pdf";
import { logger } from "@/utils/logger";
import { Icon } from "@iconify/vue2";
import CountryFlag from "@/components/common/CountryFlag.vue";
import teamFlagMixin from "@/mixins/teamFlagMixin";

// "categories[].name" di temporaryOverallEventResults kadang beda ejaan
// dgn discipline key yg dipakai teamsRegisteredCollection utk Head to Head
// (HEAD2HEAD saat registrasi, HEADTOHEAD saat hasil di-merge ke rekap).
var DISCIPLINE_KEY_ALIASES = { HEAD2HEAD: "HEADTOHEAD" };
function normalizeDisciplineKey(key) {
  var up = String(key || "").toUpperCase();
  return DISCIPLINE_KEY_ALIASES[up] || up;
}

export default {
  name: "EventOverallResult",
  components: {
    Icon,
    EmptyStateFull,
    EventOverallPdf,
    VueHtml2pdf,
    CountryFlag,
  },
  mixins: [teamFlagMixin],
  data() {
    return {
      defaultImg,
      isOfficial: false,
      loading: false,
      error: "",
      eventInfo: {},
      buckets: [],
      showPdf: false,
      // semua bucket registrasi (lintas race category) utk event ini,
      // dipakai cross-check skor lama vs status registrasi saat ini —
      // lihat buildBucketRows()/isTeamRegisteredFor()
      registeredBuckets: [],
    };
  },
  computed: {
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
    pdfFilename() {
      var parts = [];
      if (this.eventInfo && this.eventInfo.eventName) {
        parts.push(this.eventInfo.eventName);
      }
      parts.push("EVENT OVERALL - SELURUH KATEGORI");
      return parts.join(" - ");
    },
    pdfEventData() {
      return { ...this.eventInfo, levelName: this.eventInfo.levelName || "-" };
    },
  },
  async created() {
    var eventId = String(this.$route.params.id || "");
    if (eventId) {
      await this.loadEventById(eventId);
      await this.loadRegisteredBuckets(eventId);
      await this.loadAllBuckets(eventId);
    }
  },
  methods: {
    goBack() {
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },

    // Ambil semua bucket registrasi (lintas race category) event ini, utk
    // cross-check di buildBucketRows(): kalau gagal, biarkan
    // registeredBuckets kosong — isTeamRegisteredFor() akan fail-open (tidak
    // menyaring apa pun) daripada diam-diam menyembunyikan skor yang valid.
    async loadRegisteredBuckets(eventId) {
      if (typeof ipcRenderer === "undefined") return;
      await new Promise((resolve) => {
        const timeoutId = setTimeout(resolve, 5000);
        ipcRenderer.send("teams-registered:find-by-event", eventId);
        ipcRenderer.once("teams-registered:find-by-event-reply", (_e, res) => {
          clearTimeout(timeoutId);
          this.registeredBuckets =
            res && res.ok && Array.isArray(res.items) ? res.items : [];
          resolve();
        });
      });
    },

    // Apakah `teamName` benar-benar terdaftar di `disciplineKey` (SPRINT/
    // HEAD2HEAD/SLALOM/DRR/RX) utk kombinasi initial/race/division ini?
    // Fail-open (true) kalau registeredBuckets belum berhasil dimuat sama
    // sekali, supaya kegagalan fetch tidak menyembunyikan skor yang valid.
    isTeamRegisteredFor(disciplineKey, initialName, raceName, divisionName, teamName) {
      if (!this.registeredBuckets.length) return true;

      const wantedKey = normalizeDisciplineKey(disciplineKey);
      const nameUpper = String(teamName || "").trim().toUpperCase();
      const ini = String(initialName || "").toUpperCase();
      const rac = String(raceName || "").toUpperCase();
      const div = String(divisionName || "").toUpperCase();

      return this.registeredBuckets.some(
        (b) =>
          normalizeDisciplineKey(b.raceCategory) === wantedKey &&
          String(b.initialName || "").toUpperCase() === ini &&
          String(b.raceName || "").toUpperCase() === rac &&
          String(b.divisionName || "").toUpperCase() === div &&
          Array.isArray(b.teamNames) &&
          b.teamNames.indexOf(nameUpper) !== -1
      );
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
      var eventId = String(this.$route.params.id || this.eventInfo._id || "");
      if (!eventId || typeof ipcRenderer === "undefined") return;

      var nextValue = !this.isOfficial;
      var self = this;
      await new Promise((resolve) => {
        ipcRenderer.once("event:set-official-reply", (_e, res) => {
          if (res && res.ok) {
            self.isOfficial = nextValue;
            self.eventInfo = {
              ...self.eventInfo,
              resultsOfficial: nextValue,
            };
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

    // bangun rows satu bucket (per Division/Race/Initial) dari dokumen eventResult
    buildBucketRows(doc) {
      var rows = [];
      var arr = doc && Array.isArray(doc.eventResult) ? doc.eventResult : [];
      var initialName = doc && doc.initialName;
      var raceName = doc && doc.raceName;
      var divisionName = doc && doc.divisionName;

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
        // benar-benar terdaftar di discipline tsb utk bucket ini sekarang —
        // hasil lama yang tersimpan tidak otomatis hilang saat registrasi
        // diubah/dihapus, jadi tanpa cross-check ini skor basi bisa tetap
        // muncul di rekap Overall walau tim sudah tidak ikut kategori itu.
        if (!this.isTeamRegisteredFor("SPRINT", initialName, raceName, divisionName, t.teamName)) {
          sprintScore = 0;
          sprintRank = 0;
        }
        if (!this.isTeamRegisteredFor("HEAD2HEAD", initialName, raceName, divisionName, t.teamName)) {
          h2hScore = 0;
          h2hRank = 0;
        }
        if (!this.isTeamRegisteredFor("SLALOM", initialName, raceName, divisionName, t.teamName)) {
          slalomScore = 0;
          slalomRank = 0;
        }
        if (!this.isTeamRegisteredFor("DRR", initialName, raceName, divisionName, t.teamName)) {
          drrScore = 0;
          drrRank = 0;
        }
        if (!this.isTeamRegisteredFor("RX", initialName, raceName, divisionName, t.teamName)) {
          rxScore = 0;
          rxRank = 0;
        }

        // Total dihitung ulang dari discipline yang sudah tervalidasi di
        // atas — jangan percaya t.totalScore mentah-mentah karena bisa
        // sudah termasuk kontribusi discipline yang barusan disaring.
        var totalScore = sprintScore + h2hScore + slalomScore + drrScore + rxScore;

        // Kalau SEMUA discipline-nya gugur (tim ini sudah tidak terdaftar
        // di kategori apa pun utk bucket ini), seluruh barisnya basi —
        // jangan ditampilkan sama sekali, bukan cuma skornya di-nol-kan.
        var hasAnyValidDiscipline =
          sprintRank > 0 || h2hRank > 0 || slalomRank > 0 || drrRank > 0 || rxRank > 0;
        if (!hasAnyValidDiscipline) continue;

        rows.push({
          teamName: t.teamName || "",
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
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        var aBest = Math.min(
          a.sprintRank || Infinity,
          a.h2hRank || Infinity,
          a.slalomRank || Infinity,
          a.drrRank || Infinity,
          a.rxRank || Infinity
        );
        var bBest = Math.min(
          b.sprintRank || Infinity,
          b.h2hRank || Infinity,
          b.slalomRank || Infinity,
          b.drrRank || Infinity,
          b.rxRank || Infinity
        );
        if (aBest !== bBest) return aBest - bBest;
        return String(a.teamName || "").localeCompare(String(b.teamName || ""));
      });

      for (var k = 0; k < rows.length; k++) rows[k].rank = k + 1;
      return rows;
    },

    async loadAllBuckets(eventId) {
      if (typeof ipcRenderer === "undefined") return;
      this.loading = true;
      this.error = "";
      await new Promise((resolve) => {
        ipcRenderer.once(
          "event-results:get-all-by-event-reply",
          (_e, res) => {
            this.loading = false;
            if (res && res.ok && Array.isArray(res.items)) {
              var self = this;
              this.buckets = res.items.map(function (doc) {
                return {
                  divisionName: doc.divisionName || "-",
                  raceName: doc.raceName || "-",
                  initialName: doc.initialName || "-",
                  rows: self.buildBucketRows(doc),
                };
              });
            } else {
              this.buckets = [];
              this.error = (res && res.error) || "";
            }
            resolve();
          }
        );
        ipcRenderer.send("event-results:get-all-by-event", eventId);
      });
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
    onPdfGenerated() {
      this.showPdf = false;
    },
  },
};
</script>

<style scoped>
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
  font-size: 24px;
  font-weight: 800;
  color: #2d2d2d;
  margin: 0;
}

.loading-row {
  display: inline-flex;
  align-items: center;
  margin: 8px 0 12px;
  color: #6a6f7a;
}

.bucket-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 16px;
}
.bucket-block {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
}
.bucket-title {
  padding: 10px 16px;
  font-weight: 800;
  background: #f4f6f9;
  border-bottom: 1px solid #e8e8e8;
  text-transform: uppercase;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}
.result-table-overall {
  width: 100%;
  border-collapse: collapse;
}
.result-table-overall thead th {
  border: 1px solid #ddd;
  padding: 8px 6px;
  background: #f9fafb;
  vertical-align: middle;
  font-weight: 800;
  font-size: 12px;
}
.result-table-overall thead th.group.sprint {
  background: #d9e8ff;
}
.result-table-overall thead th.group.h2h {
  background: #ffe0c7;
}
.result-table-overall thead th.group.slalom {
  background: #fff2b8;
}
.result-table-overall thead th.group.drr {
  background: #ccf7d9;
}
.result-table-overall thead th.group.rx {
  background: #f3d9ff;
}
.result-table-overall thead th.sub {
  background: #ffffff;
  font-weight: 700;
}
.result-table-overall tbody td {
  border: 1px solid #eee;
  padding: 8px;
  font-weight: 600;
  font-size: 13px;
}
.result-table-overall tbody tr:nth-child(even) {
  background: #f9f9f9;
}
.team-col {
  min-width: 180px;
}
.w-60 {
  width: 50px;
}
.w-70 {
  width: 60px;
}
.w-110 {
  width: 90px;
}
.text-center {
  text-align: center;
}
.empty {
  text-align: center;
  color: #9aa0aa;
  padding: 16px;
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
