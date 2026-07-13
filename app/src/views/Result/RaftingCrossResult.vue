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
        <span class="muted">Rafting Cross Result</span>
      </div>

      <div class="right-actions">
        <b-button
          :disabled="rows.length === 0 || loading"
          variant="primary"
          class="action-btn"
          @click="generatePdf"
        >
          <Icon icon="mdi:download" class="mr-2" /> Download Result (PDF)
        </b-button>

        <b-button
          variant="outline-primary"
          class="action-btn"
          :disabled="loading"
          @click="fetchEventResultsAggregate"
        >
          <Icon icon="mdi:table-large" class="mr-2" /> View Overall
        </b-button>

        <b-button
          variant="outline-secondary"
          class="action-btn"
          :disabled="loading"
          @click="generateBracketPdf"
        >
          <Icon icon="mdi:sitemap" class="mr-2" /> Print Bracket
        </b-button>

        <b-button
          variant="outline-secondary"
          class="action-btn"
          :disabled="loading"
          @click="generateAllOverallPdf"
        >
          <Icon icon="mdi:trophy-outline" class="mr-2" /> Print Overall (All
          Categories)
        </b-button>
      </div>
    </div>

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
          <span class="muted"
            >RAFTING CROSS RESULT | {{ rxCats.initial }} -
            {{ rxCats.division }} {{ rxCats.race }}
          </span>
        </h2>
      </div>

      <b-alert show variant="danger" v-if="error" class="mb-3">{{
        error
      }}</b-alert>
      <div v-if="loading" class="loading-row">
        <b-spinner small class="mr-2" /> Loading results...
      </div>

      <!-- PODIUM -->
      <div class="rx-podium mb-4" v-if="!loading && podium.length">
        <b-row>
          <b-col md="3" v-for="p in podium" :key="p.overallRank">
            <div class="rx-podium-card">
              <div class="rx-podium-place">#{{ p.overallRank }}</div>
              <div class="rx-podium-name">{{ p.nameTeam || "-" }}</div>
              <div class="rx-podium-bib">BIB {{ p.bibTeam || "-" }}</div>
            </div>
          </b-col>
        </b-row>
      </div>

      <EmptyStateFull
        v-if="!loading && rows.length === 0"
        :img-src="require('@/assets/images/404.png')"
        title="No data available"
        subtitle="Hasil Rafting Cross belum tersedia untuk kategori ini."
        primary-text="Kembali ke Event"
        @primary="goBack"
      />

      <div v-else class="table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th class="text-center">No</th>
              <th class="text-start">Team Name</th>
              <th class="text-center">BIB</th>
              <th class="text-center">Race Time</th>
              <th class="text-center">Penalty Time</th>
              <th class="text-center">Total Time</th>
              <th class="text-center">Ranked</th>
              <th class="text-center">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in rows" :key="idx">
              <td class="text-center">{{ idx + 1 }}</td>
              <td>
                <div class="team">{{ r.nameTeam || "-" }}</div>
              </td>
              <td class="text-center">{{ r.bibTeam || "-" }}</td>
              <td class="text-center">{{ r.raceTime || "-" }}</td>
              <td class="text-center" style="color: red">
                {{ r.penaltyTime || "-" }}
              </td>
              <td class="bold text-center" style="color: green">
                {{ r.totalTime || "-" }}
              </td>
              <td class="text-center">{{ r.ranked || "-" }}</td>
              <td class="text-center">{{ r.score || 0 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
        <RaftingCrossPdf
          :data="pdfEventData"
          :dataParticipant="rows"
          :categories="pdfCategories"
          :isOfficial="isOfficial"
          :rxCats="rxCats"
        />
      </section>
    </vue-html2pdf>

    <vue-html2pdf
      v-if="showBracketPdf"
      ref="bracketHtml2Pdf"
      :show-layout="false"
      :float-layout="false"
      :enable-download="true"
      :preview-modal="false"
      :paginate-elements-by-height="1400"
      :pdf-quality="2"
      :filename="bracketPdfFilename"
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
      @pdfGenerated="onBracketPdfGenerated"
      @beforeDownload="onBeforeDownload"
    >
      <section slot="pdf-content">
        <RaftingCrossByBracketPdf
          :data="pdfEventData"
          :bracket="bracketDoc"
          :isOfficial="isOfficial"
          :rxCats="rxCats"
        />
      </section>
    </vue-html2pdf>

    <vue-html2pdf
      v-if="showAllOverallPdf"
      ref="allOverallHtml2Pdf"
      :show-layout="false"
      :float-layout="false"
      :enable-download="true"
      :preview-modal="false"
      :paginate-elements-by-height="1400"
      :pdf-quality="2"
      :filename="allOverallPdfFilename"
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
      @pdfGenerated="onAllOverallPdfGenerated"
      @beforeDownload="onBeforeDownload"
    >
      <section slot="pdf-content">
        <RaftingCrossOverallPdf
          :data="pdfEventData"
          :categories="allCategoriesOverall"
          :isOfficial="isOfficial"
        />
      </section>
    </vue-html2pdf>

    <PrintOverallModal
      centered
      :show="showOverallModal"
      :dataEvent="eventInfo"
      :aggregate="dataAggregate"
      :raceCats="rxCats"
      @close="showOverallModal = false"
    />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import RaftingCrossPdf from "../DetailEvent/ResultComponent/rafting-cross-pdfResult.vue";
import RaftingCrossByBracketPdf from "../DetailEvent/ResultComponent/RaftingCross/by-bracket-pdfResult.vue";
import RaftingCrossOverallPdf from "../DetailEvent/ResultComponent/RaftingCross/overall-pdfResult.vue";
import EmptyStateFull from "@/components/EmptyStateFull.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import VueHtml2pdf from "vue-html2pdf";
import { logger } from "@/utils/logger";
import PrintOverallModal from "@/components/result/PrintOverallModal.vue";
import { Icon } from "@iconify/vue2";

const RACE_PAYLOAD_KEY = "raceStartPayload";

function safeParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export default {
  name: "RaftingCrossResult",
  components: {
    Icon,
    EmptyStateFull,
    RaftingCrossPdf,
    RaftingCrossByBracketPdf,
    RaftingCrossOverallPdf,
    VueHtml2pdf,
    PrintOverallModal,
  },
  data() {
    return {
      defaultImg,
      isOfficial: false,
      loading: false,
      error: "",
      rows: [],
      podium: [],
      showPdf: false,
      eventInfo: {},
      showOverallModal: false,
      dataAggregate: null,
      bracketDoc: [],
      allCategoriesOverall: [],
      showBracketPdf: false,
      showAllOverallPdf: false,
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
    rxCats() {
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
    pdfFilename() {
      const parts = [];
      if (this.eventInfo && this.eventInfo.eventName) {
        parts.push(this.eventInfo.eventName);
      }
      parts.push(
        "RAFTING CROSS (" +
          (this.rxCats.initial || "-") +
          " - " +
          (this.rxCats.division || "-") +
          " " +
          (this.rxCats.race || "-") +
          ")"
      );
      return parts.join(" - ");
    },
    pdfEventData() {
      return { ...this.eventInfo, levelName: this.eventInfo.levelName || "-" };
    },
    bracketPdfFilename() {
      const parts = [];
      if (this.eventInfo && this.eventInfo.eventName) {
        parts.push(this.eventInfo.eventName);
      }
      parts.push(
        "RAFTING CROSS BRACKET (" +
          (this.rxCats.initial || "-") +
          " - " +
          (this.rxCats.division || "-") +
          " " +
          (this.rxCats.race || "-") +
          ")"
      );
      return parts.join(" - ");
    },
    allOverallPdfFilename() {
      const parts = [];
      if (this.eventInfo && this.eventInfo.eventName) {
        parts.push(this.eventInfo.eventName);
      }
      parts.push("RAFTING CROSS OVERALL - ALL CATEGORIES");
      return parts.join(" - ");
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
      return title || "RAFTING CROSS";
    },
  },
  async created() {
    const q = this.$route.query || {};
    if (q.eventId) {
      await this.loadEventById(q.eventId);
    }
    await this.loadRxResult();
  },
  methods: {
    goBack() {
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },
    officialKey() {
      const q = this.$route.query || {};
      return `resultOfficialMode:${q.eventId || "global"}`;
    },
    toggleOfficial() {
      this.isOfficial = !this.isOfficial;
      localStorage.setItem(this.officialKey(), this.isOfficial ? "1" : "0");
    },
    async loadEventById(eventId) {
      try {
        this.loading = true;
        ipcRenderer.send("get-events-byid", eventId);
        await new Promise((resolve) => {
          ipcRenderer.once("get-events-byid-reply", (_e, res) => {
            this.loading = false;
            this.eventInfo = res && typeof res === "object" ? res : {};
            resolve();
          });
        });
      } catch (err) {
        this.loading = false;
        this.eventInfo = {};
      }
    },
    async loadRxResult() {
      const q = this.$route.query || {};
      const payload = safeParse(
        localStorage.getItem(RACE_PAYLOAD_KEY) || "{}",
        {}
      );
      const b = payload.bucket || {};
      const bucket = {
        eventId: String(q.eventId || b.eventId || ""),
        initialId: String(q.initialId || b.initialId || ""),
        raceId: String(q.raceId || b.raceId || ""),
        divisionId: String(q.divisionId || b.divisionId || ""),
      };
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
        ipcRenderer.once("rx:overall:get-reply", (_e, res) => {
          this.loading = false;
          if (res && res.ok && res.item) {
            const overallRows = Array.isArray(res.item.overallRows)
              ? res.item.overallRows
              : [];
            this.rows = overallRows
              .slice()
              .sort((a, b) => (a.ranked || 999) - (b.ranked || 999));
            const placements = Array.isArray(res.item.placements)
              ? res.item.placements
              : [];
            this.podium = placements
              .filter((p) => p.overallRank <= 4)
              .sort((a, b) => a.overallRank - b.overallRank);
          } else {
            this.rows = [];
            this.podium = [];
          }
          resolve();
        });
        ipcRenderer.send("rx:overall:get", bucket);
      });
    },
    fetchEventResultsAggregate() {
      var q = this.$route && this.$route.query ? this.$route.query : {};
      var f = {
        eventId: String(q.eventId || ""),
        initialId: String(q.initialId || ""),
        raceId: String(q.raceId || ""),
        divisionId: String(q.divisionId || ""),
      };
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
        sub = sub ? sub + " • " + String(doc.initialName) : String(doc.initialName);
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
        chiefJudge: eventInfo && eventInfo.chiefJudge ? eventInfo.chiefJudge : "",
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
          } else if (nm === "HEADTOHEAD" || nm === "HEAD TO HEAD" || nm === "H2H") {
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
        var totalScore =
          t && t.totalScore != null
            ? Number(t.totalScore) || 0
            : sprintScore + h2hScore + slalomScore + drrScore + rxScore;
        rows.push({
          no: i + 1,
          teamName: t.teamName || "",
          bib: t.bib || "",
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
    onPdfGenerated() {
      this.showPdf = false;
    },

    // bucket kategori RX yang sedang dibuka (dipakai untuk bracket & overall lintas kategori)
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

    async loadBracketDoc() {
      const bucket = this.resolveBucket();
      if (
        !bucket.eventId ||
        !bucket.initialId ||
        !bucket.raceId ||
        !bucket.divisionId
      ) {
        this.bracketDoc = [];
        return;
      }
      if (typeof ipcRenderer === "undefined") return;

      await new Promise((resolve) => {
        ipcRenderer.once("rx:bracket:get-reply", (_e, res) => {
          this.bracketDoc =
            res && res.ok && res.item && Array.isArray(res.item.rounds)
              ? res.item.rounds
              : [];
          resolve();
        });
        ipcRenderer.send("rx:bracket:get", bucket);
      });
    },

    async loadAllCategoriesOverall() {
      const bucket = this.resolveBucket();
      if (!bucket.eventId || typeof ipcRenderer === "undefined") {
        this.allCategoriesOverall = [];
        return;
      }

      await new Promise((resolve) => {
        ipcRenderer.once("rx:overalls:byEvent-reply", (_e, res) => {
          const items = res && res.ok && Array.isArray(res.items) ? res.items : [];
          const mapped = items.map((doc) => {
            const b = doc.bucket || {};
            const placements = Array.isArray(doc.placements)
              ? doc.placements
              : [];
            const podium = {
              gold: placements.find((p) => p.overallRank === 1) || null,
              silver: placements.find((p) => p.overallRank === 2) || null,
              bronze: placements.find((p) => p.overallRank === 3) || null,
              fourth: placements.find((p) => p.overallRank === 4) || null,
            };
            const rows = Array.isArray(doc.overallRows)
              ? doc.overallRows
                  .slice()
                  .sort((a, b2) => (a.ranked || 999) - (b2.ranked || 999))
              : [];
            return {
              initialName: b.initialName || "-",
              raceName: b.raceName || "-",
              divisionName: b.divisionName || "-",
              podium,
              rows,
            };
          });
          mapped.sort((a, b2) => {
            const ka = `${a.divisionName}|${a.raceName}|${a.initialName}`;
            const kb = `${b2.divisionName}|${b2.raceName}|${b2.initialName}`;
            return ka.localeCompare(kb);
          });
          this.allCategoriesOverall = mapped;
          resolve();
        });
        ipcRenderer.send("rx:overalls:byEvent", bucket.eventId);
      });
    },

    async generateBracketPdf() {
      try {
        await this.loadBracketDoc();
        this.showBracketPdf = true;
        await this.$nextTick();
        const inst = this.$refs.bracketHtml2Pdf;
        if (!inst) return logger.warn("ref bracketHtml2Pdf tidak ditemukan");
        await new Promise((r) => setTimeout(r, 200));
        await inst.generatePdf();
      } catch (e) {
        this.error = "Gagal membuat PDF bracket";
      }
    },
    onBracketPdfGenerated() {
      this.showBracketPdf = false;
    },

    async generateAllOverallPdf() {
      try {
        await this.loadAllCategoriesOverall();
        this.showAllOverallPdf = true;
        await this.$nextTick();
        const inst = this.$refs.allOverallHtml2Pdf;
        if (!inst) return logger.warn("ref allOverallHtml2Pdf tidak ditemukan");
        await new Promise((r) => setTimeout(r, 200));
        await inst.generatePdf();
      } catch (e) {
        this.error = "Gagal membuat PDF overall semua kategori";
      }
    },
    onAllOverallPdfGenerated() {
      this.showAllOverallPdf = false;
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
</style>
