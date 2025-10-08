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
            :variant="sessionMode === 's1' ? 'primary' : 'outline-primary'"
            @click="changeSessionMode('s1')"
            class="custom-btn"
            >Session 1</b-button
          >

          <b-button
            size="sm"
            :variant="sessionMode === 's2' ? 'primary' : 'outline-primary'"
            @click="changeSessionMode('s2')"
            class="custom-btn"
            >Session 2</b-button
          >
        </b-button-group>

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
            SLALOM RESULT | {{ slalomCats.initial }} -
            {{ slalomCats.division }} {{ slalomCats.race }} | Session :
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
              <th>BIB</th>
              <th>Session</th>
              <!-- NEW -->
              <th>Start Pen.</th>
              <th>Finish Pen.</th>
              <th>Gate Pen.</th>
              <th>Total Pen.</th>
              <th>Race Time</th>
              <th>Penalty Time</th>
              <th>Result</th>
              <th>Ranked</th>
              <th v-if="sessionMode === 'all'">Score</th>
              <th v-if="!isOfficial && sessionMode === 'all'">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(r, idx) in results"
              :key="idx"
              :class="{ 'best-row': r.isBest && sessionMode === 'all' }"
            >
              <td class="text-center">{{ r.teamIndex }}</td>
              <td>
                <div class="team">
                  {{ r.nameTeam || "-" }}
                  <span
                    v-if="r.isBest && sessionMode === 'all'"
                    class="best-badge"
                    >BEST</span
                  >
                </div>
              </td>
              <td class="text-center">{{ r.bibTeam || "-" }}</td>
              <td class="text-center">{{ r.session || "-" }}</td>
              <!-- NEW -->
              <td class="text-center">{{ r.startPenalty || 0 }}</td>
              <td class="text-center">{{ r.finishPenalty || 0 }}</td>
              <td class="text-center">
                <span class="gate-modal-trigger" @click="openGateModal(r)">
                  {{ r.sectionPenalty || 0 }}
                </span>
              </td>
              <td class="text-center">{{ r.totalPenalty || 0 }}</td>
              <td>{{ r.raceTime || "00:00:00.000" }}</td>
              <td>{{ r.penaltyTime || "00:00:00.000" }}</td>
              <td class="bold">{{ r.resultTime || "00:00:00.000" }}</td>
              <td class="text-center">{{ r.ranked || "-" }}</td>
              <td v-if="sessionMode === 'all'" class="text-center">
                {{
                  r.score !== undefined && r.score !== null && r.score !== ""
                    ? r.score
                    : getScoreByRanked(r.ranked) || 0
                }}
              </td>
              <td
                class="text-center"
                v-if="!isOfficial && sessionMode === 'all'"
              >
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
                <span
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
      @beforeDownload="onBeforeDownload"
    >
      <section slot="pdf-content">
        <SlalomPdf
          :data="pdfEventData"
          :dataParticipant="pdfParticipants"
          :categories="pdfCategories"
          :isOfficial="isOfficial"
          :slalomCats="slalomCats"
        />
      </section>
    </vue-html2pdf>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import SlalomPdf from "../DetailEvent/ResultComponent/slalom-pdfResult.vue";
import EmptyStateFull from "@/components/EmptyStateFull.vue";
import defaultImg from "@/assets/images/default-second.jpeg";
import VueHtml2pdf from "vue-html2pdf";
import { Icon } from "@iconify/vue2";

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
  components: { Icon, EmptyStateFull, SlalomPdf, VueHtml2pdf },
  data() {
    return {
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
      },
      // skema score Slalom (boleh sesuaikan)
      dataScore: [
        { ranking: 1, score: 300 },
        { ranking: 2, score: 275 },
        { ranking: 3, score: 255 },
        { ranking: 4, score: 240 },
        { ranking: 5, score: 230 },
        { ranking: 6, score: 220 },
        { ranking: 7, score: 210 },
        { ranking: 8, score: 200 },
        { ranking: 9, score: 190 },
        { ranking: 10, score: 180 },
        { ranking: 11, score: 170 },
        { ranking: 12, score: 160 },
        { ranking: 13, score: 150 },
        { ranking: 14, score: 140 },
        { ranking: 15, score: 130 },
        { ranking: 16, score: 120 },
        { ranking: 17, score: 110 },
        { ranking: 18, score: 100 },
        { ranking: 19, score: 90 },
        { ranking: 20, score: 80 },
        { ranking: 21, score: 70 },
        { ranking: 22, score: 60 },
        { ranking: 23, score: 50 },
        { ranking: 24, score: 40 },
        { ranking: 25, score: 30 },
        { ranking: 26, score: 25 },
        { ranking: 27, score: 20 },
        { ranking: 28, score: 15 },
        { ranking: 29, score: 12 },
        { ranking: 30, score: 10 },
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
      parts.push(
        `SLALOM (${this.slalomCats.initial || "-"} - ${
          this.slalomCats.division || "-"
        } ${this.slalomCats.race || "-"})`
      );
      return parts.join(" - ");
    },
    slalomCats() {
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

    // data buat PDF
    pdfEventData() {
      return { ...this.eventInfo, levelName: this.eventInfo.levelName || "-" };
    },
    pdfParticipants() {
      return (this.results || []).map((r) => ({
        nameTeam: r.nameTeam,
        bibTeam: r.bibTeam,
        result: {
          raceTime: r.raceTime || "",
          startPenalty: Number(r.startPenalty) || 0,
          finishPenalty: Number(r.finishPenalty) || 0,
          sectionPenalty: Number(r.sectionPenalty) || 0,
          totalPenalty: Number(r.totalPenalty) || 0,
          penaltyTime: r.penaltyTime || "00:00:00.000",
          totalTime: r.totalTime || "",
          totalPenaltyTime: r.penaltyTime || "00:00:00.000",
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
      return title || "SLALOM";
    },
  },

  async created() {
    // OFFICIAL toggle per event
    const k = this.officialKey();
    const saved = localStorage.getItem(k);
    if (saved !== null) this.isOfficial = saved === "1";

    const q = this.$route.query || {};
    if (q.eventId) await this.loadEventById(q.eventId);

    // muat data slalom
    await this.loadSlalomResult();
  },

  methods: {
    buildResultRows(mode) {
      const items = this.rawResultItems || [];
      if (!Array.isArray(items) || items.length === 0) return [];

      const teamsObj = {};
      let d, t, r;

      for (d = 0; d < items.length; d++) {
        const doc = items[d];
        if (!doc || !Array.isArray(doc.teams)) continue;

        for (t = 0; t < doc.teams.length; t++) {
          const team = doc.teams[t] || {};
          const nameTeam = team.nameTeam ? String(team.nameTeam) : "";
          const bibTeam = team.bibTeam ? String(team.bibTeam) : "";
          const result = Array.isArray(team.result) ? team.result : [];
          if (result.length === 0) continue;

          const key = nameTeam + "##" + bibTeam;
          if (!teamsObj[key]) {
            teamsObj[key] = {
              nameTeam,
              bibTeam,
              runs: [],
              bestIdx: -1,
              bestMs: Number.POSITIVE_INFINITY,
              bestRank: 0,
            };
          }

          // ambil index sesuai filter mode
          const runIndexes = [];
          if (mode === "all") {
            for (r = 0; r < result.length; r++) runIndexes.push(r);
          } else if (mode === "s1" && result[0]) {
            runIndexes.push(0);
          } else if (mode === "s2" && result[1]) {
            runIndexes.push(1);
          }

          for (const ridx of runIndexes) {
            const run = result[ridx] || {};
            const R = this.normalizeResult(run);
            const item = {
              nameTeam,
              bibTeam,
              session: run.session || `Run ${ridx + 1}`,
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

            teamsObj[key].runs.push(item);
            const ms = this.timeToMs(
              item.resultTime || item.totalTime || item.raceTime
            );
            if (ms < teamsObj[key].bestMs) {
              teamsObj[key].bestMs = ms;
              teamsObj[key].bestIdx = ridx;
            }
          }
        }
      }

      // urutkan per best time antar tim
      const bestArray = [];
      for (const k in teamsObj) {
        if (!Object.prototype.hasOwnProperty.call(teamsObj, k)) continue;
        bestArray.push({ key: k, ms: teamsObj[k].bestMs });
      }
      bestArray.sort((a, b) => a.ms - b.ms);

      // assign rank & score
      let rankCounter = 1;
      for (const b of bestArray) {
        const pack = teamsObj[b.key];
        pack.bestRank = rankCounter;
        const idx = pack.bestIdx;
        if (idx >= 0 && idx < pack.runs.length) {
          pack.runs[idx].isBest = true;
          pack.runs[idx].ranked = rankCounter;
          pack.runs[idx].score = this.getScoreByRanked(rankCounter);
        }
        rankCounter++;
      }

      // susun finalRows
      const orderedKeys = Object.keys(teamsObj).sort((ka, kb) => {
        const ra = teamsObj[ka].bestRank || Infinity;
        const rb = teamsObj[kb].bestRank || Infinity;
        return ra - rb;
      });

      const finalRows = [];
      let teamCounter = 1;
      for (const k of orderedKeys) {
        const pack = teamsObj[k];
        const localRuns = pack.runs.slice();
        localRuns.sort((a, b) =>
          String(a.session).localeCompare(String(b.session))
        );

        for (let j = 0; j < localRuns.length; j++) {
          const row = localRuns[j];
          finalRows.push({
            ...row,
            ranked: row.isBest ? row.ranked || "-" : "-",
            score: row.isBest ? row.score || 0 : 0,
            teamIndex: teamCounter,
          });
        }
        teamCounter++;
      }

      return finalRows;
    },
    changeSessionMode(mode) {
      if (!["all", "s1", "s2"].includes(mode)) return;
      this.sessionMode = mode;
      this.results = this.buildResultRows(mode);
    },
    openGateModal(row) {
      this.gateModal.team = row && row.nameTeam ? row.nameTeam : "";
      this.gateModal.bib = row && row.bibTeam ? row.bibTeam : "";
      this.gateModal.gates = Array.isArray(row && row.gatesDetail)
        ? row.gatesDetail
        : [];
      this.showGateModal = true;
    },
    closeGateModal() {
      this.showGateModal = false;
    },
    goBack() {
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },

    async loadEventById(eventId) {
      try {
        this.loading = true;
        ipcRenderer.send("get-events-byid", eventId);
        await new Promise((resolve) => {
          ipcRenderer.once("get-events-byid-reply", (_e, res) => {
            this.loading = false;
            this.eventInfo = res && typeof res === "object" ? res : {};
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

    officialKey() {
      const q = this.$route.query || {};
      return `resultOfficialMode:${q.eventId || "global"}`;
    },
    toggleOfficial() {
      this.isOfficial = !this.isOfficial;
      localStorage.setItem(this.officialKey(), this.isOfficial ? "1" : "0");
    },
    openEdit(row) {
      this.$emit("edit-row", row);
    },

    getScoreByRanked(ranked) {
      const found = this.dataScore.find((d) => d.ranking === Number(ranked));
      return found ? found.score : 0;
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

    computeRanksAndScores(rows) {
      const withTime = rows
        .map((r, i) => ({
          i,
          ms: this.timeToMs(r.resultTime || r.totalTime || r.raceTime || ""),
        }))
        .filter((x) => Number.isFinite(x.ms));

      withTime.sort((a, b) => a.ms - b.ms);
      withTime.forEach((item, idx) => {
        const rank = idx + 1;
        rows[item.i].ranked = rank;
        if (!rows[item.i].score)
          rows[item.i].score = this.getScoreByRanked(rank);
      });

      rows.forEach((r) => {
        if (!r.ranked || Number(r.ranked) <= 0) {
          r.ranked = r.ranked ? r.ranked : "-";
          r.score = r.score ? Number(r.score) || 0 : 0;
        }
      });

      rows.sort(
        (a, b) =>
          (Number(a.ranked) || Infinity) - (Number(b.ranked) || Infinity)
      );
      return rows;
    },

    normalizeResult(raw) {
      const base = {
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

      const TIMEOUT_MS = 8000;
      let timeoutId;

      await new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          this.loading = false;
          this.error = "Gagal memuat hasil (timeout). Coba ulangi.";
          resolve();
        }, TIMEOUT_MS);

        ipcRenderer.once("get-slalom-result-reply", (_e, res) => {
          clearTimeout(timeoutId);
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
            console.error(err);
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
    onBeforeDownload() {},
    onPdfGenerated() {
      this.showPdf = false;
    },
  },
};
</script>

<style scoped>
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
