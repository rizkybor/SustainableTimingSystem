<template>
  <div class="result-wrap">
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
      <div class="card-back">
        <b-button variant="link" class="p-0 back-link" @click="goBack">
          <Icon icon="mdi:chevron-left" /> Back
        </b-button>
      </div>

      <!-- EVENT HEADER -->
      <div class="event-header">
        <h2 class="event-name">{{ eventInfo.eventName || "-" }}</h2>
        <h4 class="event-location">
          {{ eventInfo.riverName || "-" }}, {{ eventInfo.addressCity || "-" }}
        </h4>
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
              <th>Penalty</th>
              <th>Penalty Time</th>
              <th>Result</th>
              <th>Ranked</th>
              <th>Score</th>
              <th>Action</th>
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
              <td class="text-center">{{ r.totalPenalty || 0 }}</td>
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
              <td class="text-center">
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

    <!-- ===== Komponen PDF (disembunyikan dari layar, tapi tetap ada di DOM) ===== -->
    <div class="pdf-host sr-only" ref="pdfHost">
      <SprintPdf
        :data="pdfEventData"
        :dataParticipant="pdfParticipants"
        :categories="pdfCategories"
      />
    </div>
  </div>
</template>

<script>
import EmptyStateFull from "@/components/EmptyStateFull.vue";
import SprintPdf from "../DetailEvent/ResultComponent/sprint-pdfResult.vue"; // <-- simpan komponen pdf result-mu dengan nama ini
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";

/* ========= Helpers untuk baca localStorage ========= */
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
  if (isDict)
    return activeId && store[activeId]
      ? store[activeId]
      : Object.values(store)[0] || {};

  if (Array.isArray(store)) {
    if (activeId) {
      const found = store.find(function (ev) {
        return evIdToString(ev) === activeId;
      });
      if (found) return found;
    }
    return store[0] || {};
  }
  return store; // single object
}

export default {
  name: "SprintResult",
  components: { Icon, EmptyStateFull, SprintPdf },

  data() {
    return {
      loading: false,
      error: "",
      results: [],
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
    // Info event dari localStorage (fallback ke query bila ada yang kosong)
    eventInfo() {
      const ev = pickEventFromStore();
      const q = this.$route.query || {};
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

    // ====== Data untuk komponen PDF ======
    pdfEventData() {
      // komponen PDF memerlukan field seperti di template pdf (data.*)
      return { ...this.eventInfo, levelName: this.eventInfo.levelName || "-" };
    },
    pdfParticipants() {
      // Komponen PDF mengharapkan struktur: { nameTeam, bibTeam, result: {...} }
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
      // Ambil dari payload bucket jika ada
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

  created() {
    this.loadSprintResult();
  },

  methods: {
    goBack() {
      this.$router.push(`/event-detail/${this.$route.params.id}`);
    },
    openEdit(row) {
      this.$emit("edit-row", row);
    },
    getScoreByRanked(ranked) {
      const m = this.dataScore.find((d) => d.ranking === Number(ranked));
      return m ? m.score : 0;
    },
    normalizeResult(r) {
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
      let obj = r;
      if (Array.isArray(obj)) obj = obj[0] || {};
      if (!obj || typeof obj !== "object") obj = {};
      const merged = { ...base, ...obj };
      if (
        !merged.totalPenalty &&
        (merged.startPenalty || merged.finishPenalty)
      ) {
        merged.totalPenalty =
          Number(merged.startPenalty) + Number(merged.finishPenalty);
      }
      if (!merged.penaltyTime)
        merged.penaltyTime = merged.totalPenaltyTime || "00:00:00.000";
      return merged;
    },

    async loadSprintResult() {
      const q = this.$route.query || {};
      if (!q.eventId || !q.initialId || !q.raceId || !q.divisionId) {
        this.error = "Parameter hasil tidak lengkap.";
        return;
      }
      this.loading = true;
      this.error = "";
      ipcRenderer.send("get-sprint-result", q);

      await new Promise((resolve) => {
        ipcRenderer.once("get-sprint-result-reply", (_e, res) => {
          this.loading = false;
          if (res && res.ok && Array.isArray(res.items)) {
            const rows = [];
            res.items.forEach((doc) => {
              const arr = Array.isArray(doc.result)
                ? doc.result
                : [doc.result || {}];
              arr.forEach((r) => {
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
                  ranked: R.ranked || "",
                  score:
                    R.score !== undefined && R.score !== null && R.score !== ""
                      ? Number(R.score)
                      : this.getScoreByRanked(R.ranked),
                });
              });
            });
            rows.sort(
              (a, b) =>
                (Number(a.ranked) || Infinity) - (Number(b.ranked) || Infinity)
            );
            this.results = rows;
          } else {
            this.results = [];
            this.error = (res && res.error) || "Gagal memuat hasil.";
          }
          resolve();
        });
      });
    },

    // ====== PDF ======
    async generatePdf() {
      // butuh elemen DOM dari komponen PDF
      const host = this.$refs.pdfHost;
      if (!host || !window.html2pdf) {
        this.error = "PDF generator tidak ditemukan.";
        return;
      }

      // pastikan konten sudah render
      await this.$nextTick();

      const filename =
        (this.eventInfo.eventName ? `${this.eventInfo.eventName} - ` : "") +
        "Sprint Result.pdf";

      const opt = {
        margin: [10, 10, 10, 10],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      try {
        await window.html2pdf().set(opt).from(host).save();
      } catch (e) {
        this.error = "Gagal membuat PDF.";
      }
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

/* sr-only: hadir di DOM untuk html2pdf, tapi tidak tampak di layar */
.sr-only {
  position: absolute !important;
  left: -99999px !important;
  top: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
}
</style>
