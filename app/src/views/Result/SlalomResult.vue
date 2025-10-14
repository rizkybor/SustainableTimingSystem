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
        <b-button
          v-if="sessionMode == 'all'"
          :disabled="results.length === 0 || loading"
          variant="primary"
          class="action-btn"
          @click="generatePdf"
        >
          <Icon icon="mdi:download" class="mr-2" /> Download Result (PDF)
        </b-button>
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
              <th
                class="text-center"
                v-if="!isOfficial && sessionMode === 'all'"
              >
                Action
              </th>
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
                {{ r.startPenalty || 0 }}
              </td>
              <td class="text-center" style="color: red">
                {{ r.finishPenalty || 0 }}
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
              <td class="text-center">{{ r.startTime || "00:00:00.000" }}</td>
              <td class="text-center">{{ r.finishTime || "00:00:00.000" }}</td>
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

              <!-- Action (tetap hanya sekali per run; kalau mau sekali per grup, bisa dipindah ke sel merged juga) -->
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
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import SlalomPdf from "../DetailEvent/ResultComponent/slalom-pdfResult.vue";

// import SlalomPdf from "../DetailEvent/ResultComponent/slalom-pdfResult.vue";
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
  const items = Array.isArray(this.rawResultItems) ? this.rawResultItems : [];

  // helpers
  function norm(s) {
    return String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
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
    return (+hh) * 3600000 + (+mm) * 60000 + (+ss) * 1000 + (+ms || 0);
  };
  const msToHMSms = (ms) => {
    if (!Number.isFinite(ms)) return "";
    function pad(n, w) { return String(n).padStart(w || 2, "0"); }
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const mil = ms % 1000;
    return pad(h) + ":" + pad(m) + ":" + pad(s) + "." + String(mil).padStart(3, "0");
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
    const s = run && run.session ? String(run.session).trim().toLowerCase() : "";
    if (s === "1" || /\brun\s*1\b/.test(s) || /\b1\b/.test(s)) return 1;
    if (s === "2" || /\brun\s*2\b/.test(s) || /\b2\b/.test(s)) return 2;
    return (ridx === 0) ? 1 : (ridx === 1 ? 2 : null);
  }

  // ==== Kumpulkan per tim (≤2 run) ====
  const map = Object.create(null);

  for (let d = 0; d < items.length; d++) {
    const doc = items[d];
    const teams = (doc && Array.isArray(doc.teams)) ? doc.teams : [];
    for (let t = 0; t < teams.length; t++) {
      const T = teams[t] || {};
      const nameTeam = T && T.nameTeam ? String(T.nameTeam) : "-";
      const bibTeam = T && (T.bibTeam || T.bibNumber) ? String(T.bibTeam || T.bibNumber) : "-";
      const statusId = Number(T && T.statusId) || 0;
      const teamId = (T && T.teamId) ? T.teamId : (T && T.id) ? T.id : null;
      const key = teamId ? ("id:" + teamId) : ("name:" + norm(nameTeam));

      if (!map[key]) {
        map[key] = {
          nameTeam: nameTeam,
          bibTeam: bibTeam,
          statusId: statusId,
          result: [],     // akan diisi maksimal 2 objek run
          ranked: 0,
          score: 0,
          bestTime: "",
          meta: {},
          otr: {},
          _slots: { 1: null, 2: null }, // internal
        };
      } else {
        if (!map[key].nameTeam) map[key].nameTeam = nameTeam;
        if (map[key].bibTeam === "-" && bibTeam && bibTeam !== "-") map[key].bibTeam = bibTeam;
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
          session: r.session ? String(r.session) : ("Run " + idx),
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
            gates.reduce(function(a, v){ return a + (Number(v) || 0); }, 0) +
            (Number(p.finish) || 0),
          totalTime: String(r.totalTime || r.raceTime || ""),
          ranked: Number(r.ranked) || 0,
          judgesBy: String(r.judgesBy || ""),
          judgesTime: String(r.judgesTime || "")
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
          map[key].score = Number(r.score) || self.getScoreByRanked(runObj.ranked) || 0;
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
    if (!entry.score) entry.score = self.getScoreByRanked(entry.ranked) || 0;

    // bersihkan field internal
    delete entry._slots;

    out.push(entry);
  }

  return out;
},
    // pdfParticipants() {
    //   // Ambil langsung dari payload DB yang diisi di loadSlalomResult()
    //   const items = Array.isArray(this.rawResultItems)
    //     ? this.rawResultItems
    //     : [];
    //   const teamsMap = Object.create(null);

    //   // helper waktu
    //   const timeToMs = (str) => {
    //     if (!str) return Infinity;
    //     const [hh = "0", mm = "0", ssms = "0"] = String(str).split(":");
    //     const [ss = "0", ms = "0"] = String(ssms).split(".");
    //     return +hh * 3600000 + +mm * 60000 + +ss * 1000 + (+ms || 0);
    //   };
    //   const msToHMSms = (ms) => {
    //     if (!Number.isFinite(ms)) return "";
    //     const pad = (n, w = 2) => String(n).padStart(w, "0");
    //     const h = Math.floor(ms / 3600000);
    //     const m = Math.floor((ms % 3600000) / 60000);
    //     const s = Math.floor((ms % 60000) / 1000);
    //     const mil = ms % 1000;
    //     return `${pad(h)}:${pad(m)}:${pad(s)}.${String(mil).padStart(3, "0")}`;
    //   };

    //   // Flatten dari semua dokumen → per tim
    //   for (const doc of items) {
    //     const teams = Array.isArray(doc && doc.teams) ? doc.teams : [];
    //     for (const t of teams) {
    //       const nameTeam = String(t && t.nameTeam ? t.nameTeam : "-");
    //       const bibTeam = String(
    //         t && (t.bibTeam || t.bibNumber) ? t.bibTeam || t.bibNumber : "-"
    //       );
    //       const key = nameTeam + "|" + bibTeam;

    //       if (!teamsMap[key]) {
    //         teamsMap[key] = {
    //           nameTeam,
    //           bibTeam,
    //           statusId: Number(t && t.statusId) || 0,
    //           result: [],
    //           ranked: 0,
    //           score: 0,
    //           bestTime: "",
    //           meta: {},
    //           otr: {},
    //           __bestMs: Infinity, // internal
    //         };
    //       }

    //       const runs = Array.isArray(t && t.result) ? t.result : [];
    //       for (let i = 0; i < runs.length; i++) {
    //         const r = runs[i] || {};
    //         const p = r.penaltyTotal || {};
    //         const gates = Array.isArray(p.gates) ? p.gates : [];

    //         const runObj = {
    //           session: r.session || `Run ${i + 1}`,
    //           startTime: String(r.startTime || ""),
    //           finishTime: String(r.finishTime || ""),
    //           raceTime: String(r.raceTime || ""),
    //           penaltyTime: String(r.penaltyTime || "00:00:00.000"),
    //           penaltyTotal: {
    //             start: Number(p.start) || 0,
    //             gates,
    //             finish: Number(p.finish) || 0,
    //           },
    //           penalty:
    //             (Number(p.start) || 0) +
    //             gates.reduce((a, v) => a + (Number(v) || 0), 0) +
    //             (Number(p.finish) || 0),
    //           totalTime: String(r.totalTime || r.raceTime || ""),
    //           ranked: Number(r.ranked) || 0,
    //           judgesBy: String(r.judgesBy || ""),
    //           judgesTime: String(r.judgesTime || ""),
    //         };

    //         teamsMap[key].result.push(runObj);

    //         // hitung kandidat best (pakai totalTime bila ada, else raceTime)
    //         const ms = timeToMs(runObj.totalTime || runObj.raceTime);
    //         if (Number.isFinite(ms) && ms < teamsMap[key].__bestMs) {
    //           teamsMap[key].__bestMs = ms;
    //         }

    //         // isi ranked/score level tim bila run ini punya rank
    //         if (runObj.ranked > 0) {
    //           teamsMap[key].ranked = runObj.ranked;
    //           teamsMap[key].score =
    //             Number(r.score) || this.getScoreByRanked(runObj.ranked) || 0;
    //         }
    //       }
    //     }
    //   }

    //   // fallback ranked/score jika belum terisi
    //   const out = [];
    //   for (const k of Object.keys(teamsMap)) {
    //     const t = teamsMap[k];

    //     if (
    //       Array.isArray(t.result) &&
    //       t.result.length >= 2 &&
    //       Number.isFinite(t.__bestMs)
    //     ) {
    //       t.bestTime = msToHMSms(t.__bestMs);
    //     } else {
    //       t.bestTime = ""; // biar konsisten dengan PDF lama
    //     }

    //     if (!t.ranked) t.ranked = 0;
    //     if (!t.score) t.score = this.getScoreByRanked(t.ranked) || 0;

    //     delete t.__bestMs;
    //     out.push(t);
    //   }

    //   return out;
    // },
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

  // util
  function norm(s) {
    return String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
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
    if (aValid && bValid) return msB < msA;   // b lebih cepat → b lebih baik
    if (!aValid && bValid) return true;
    return false; // default: pertahankan a
  }

  // deteksi index run (1 atau 2)
  function sessionIndex(run, ridx) {
    var s = run && run.session ? String(run.session) : "";
    var clean = s.trim().toLowerCase();
    // pola umum: "run 1", "run1", "1", dsb.
    if (clean === "1" || /\brun\s*1\b/.test(clean) || /\b1\b/.test(clean)) return 1;
    if (clean === "2" || /\brun\s*2\b/.test(clean) || /\b2\b/.test(clean)) return 2;
    // fallback berdasarkan posisi dalam array
    return (ridx === 0) ? 1 : (ridx === 1 ? 2 : null);
  }

  // ---- kumpulkan per tim, maksimum 2 run ----
  var teamsObj = {};

  for (var d = 0; d < items.length; d++) {
    var doc = items[d];
    if (!doc || !Array.isArray(doc.teams)) continue;

    for (var t = 0; t < doc.teams.length; t++) {
      var team = doc.teams[t] || {};

      var rawName = (team && team.nameTeam) ? team.nameTeam : "-";
      var rawBib  = (team && team.bibTeam) ? team.bibTeam
                 : (team && team.bibNumber) ? team.bibNumber
                 : "";
      var teamId  = (team && team.teamId) ? team.teamId
                 : (team && team.id) ? team.id
                 : null;

      var nameTeam = String(rawName).trim();
      var bibTeam  = String(rawBib).trim();
      var result   = Array.isArray(team.result) ? team.result : [];
      if (result.length === 0) continue;

      var key = teamId ? ("id:" + teamId) : ("name:" + norm(nameTeam));

      if (!teamsObj[key]) {
        teamsObj[key] = {
          nameTeam: nameTeam,
          bibTeam: bibTeam,
          runsByIdx: { 1: null, 2: null }, // simpan maksimal 2
          bestIdx: -1,
          bestMs: Number.POSITIVE_INFINITY,
          bestRank: 0
        };
      } else {
        if (!teamsObj[key].nameTeam) teamsObj[key].nameTeam = nameTeam;
        if (!teamsObj[key].bibTeam && bibTeam) teamsObj[key].bibTeam = bibTeam;
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
          session: run.session ? String(run.session) : ("Run " + idx),
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
            (run.penaltyTotal && Array.isArray(run.penaltyTotal.gates))
              ? run.penaltyTotal.gates
              : []
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
      var ms = this.timeToMs(row.resultTime || row.totalTime || row.raceTime);
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
  bestArray.sort(function(a, b) { return a.ms - b.ms; });

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
  var orderedKeys = Object.keys(teamsObj).sort(function(ka, kb) {
    var ra = teamsObj[ka].bestRank || Infinity;
    var rb = teamsObj[kb].bestRank || Infinity;
    return ra - rb;
  });

  var finalRows = [];
  var teamCounter = 1;

  for (var x = 0; x < orderedKeys.length; x++) {
    var key = orderedKeys[x];
    var pack3 = teamsObj[key];
    var rows = [];

    if (mode === "1") {
      if (pack3.runsByIdx[1]) rows.push(pack3.runsByIdx[1]);
    } else if (mode === "2") {
      if (pack3.runsByIdx[2]) rows.push(pack3.runsByIdx[2]);
    } else {
      // "all": maksimal 2 baris (run1 lalu run2 bila ada)
      if (pack3.runsByIdx[1]) rows.push(pack3.runsByIdx[1]);
      if (pack3.runsByIdx[2]) rows.push(pack3.runsByIdx[2]);
    }

    for (var y = 0; y < rows.length; y++) {
      var rrow = rows[y];
      finalRows.push({
        nameTeam: rrow.nameTeam,
        bibTeam: rrow.bibTeam,
        session: rrow.session,
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
        ranked: rrow.isBest ? (rrow.ranked || "-") : "-",
        score: rrow.isBest ? (rrow.score || 0) : 0,
        teamIndex: teamCounter
      });
    }
    teamCounter++;
  }

  // Rowspan merge utk mode "all" (sekarang pasti ≤2 per tim)
  if (mode === "all") {
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
        // timeoutId = setTimeout(() => {
        //   this.loading = false;
        //   this.error = "Gagal memuat hasil (timeout). Coba ulangi.";
        //   resolve();
        // }, TIMEOUT_MS);

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
    onPdfGenerated() {
      this.showPdf = false;
    },
  },
};
</script>

<style scoped>

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
</style>
