<template>
  <div class="jah-page">
    <div class="jah-hero">
      <b-container class="jah-hero__inner">
        <button type="button" class="jah-back" @click="goBack">
          <Icon icon="mdi:arrow-left" width="15" height="15" />
          Kembali ke Event Detail
        </button>
        <div class="jah-hero__row">
          <div class="jah-hero__title">
            <div class="jah-hero__icon">
              <Icon icon="mdi:gavel" width="22" height="22" />
            </div>
            <div>
              <h3>Judges Activity History</h3>
              <p>{{ eventInfo.eventName || "Event" }}</p>
            </div>
          </div>
          <button type="button" class="jah-refresh-btn" :disabled="loading" @click="fetchAll">
            <b-spinner v-if="loading" small />
            <Icon v-else icon="mdi:refresh" width="16" height="16" />
            Refresh
          </button>
        </div>
      </b-container>
    </div>

    <b-container class="jah-body">
      <!-- SUMMARY -->
      <div class="jah-stat-grid">
        <div class="jah-stat">
          <div class="jah-stat__icon jah-stat__icon--blue">
            <Icon icon="mdi:account-group-outline" width="18" height="18" />
          </div>
          <div>
            <div class="jah-stat__value">{{ judgeProfiles.length }}</div>
            <div class="jah-stat__label">Judges Ditugaskan</div>
          </div>
        </div>
        <div class="jah-stat">
          <div class="jah-stat__icon jah-stat__icon--violet">
            <Icon icon="mdi:format-list-bulleted" width="18" height="18" />
          </div>
          <div>
            <div class="jah-stat__value">{{ activityItems.length }}</div>
            <div class="jah-stat__label">Total Aktivitas</div>
          </div>
        </div>
        <div class="jah-stat">
          <div class="jah-stat__icon jah-stat__icon--cyan">
            <Icon icon="mdi:filter-variant" width="18" height="18" />
          </div>
          <div>
            <div class="jah-stat__value">{{ filteredItems.length }}</div>
            <div class="jah-stat__label">Sesuai Filter</div>
          </div>
        </div>
        <div class="jah-stat">
          <div class="jah-stat__icon jah-stat__icon--amber">
            <Icon icon="mdi:pulse" width="18" height="18" />
          </div>
          <div>
            <div class="jah-stat__value">{{ distinctJudgeNames.length }}</div>
            <div class="jah-stat__label">Juri Aktif Mencatat</div>
          </div>
        </div>
      </div>

      <!-- PROFILE JUDGES -->
      <section class="jah-section">
        <div class="jah-section__head">
          <h5>Profile Judges</h5>
          <span class="jah-section__hint">Klik kartu untuk filter aktivitas per juri</span>
        </div>
        <div v-if="!judgeProfiles.length && !loading" class="jah-note">
          Belum ada juri yang ditugaskan untuk event ini (atur lewat "Judges Settings" di Event Detail).
        </div>
        <div class="jah-profile-grid">
          <div
            v-for="p in judgeProfiles"
            :key="p.email"
            class="jah-profile-card"
            :class="{ 'jah-profile-card--active': filters.judge === p.username }"
            @click="toggleJudgeFilter(p.username)"
          >
            <div class="jah-profile-card__head">
              <div class="jah-profile-avatar">
                {{ (p.username || p.email || "?").charAt(0).toUpperCase() }}
              </div>
              <div class="jah-profile-card__id">
                <div class="jah-profile-name">{{ p.username || "-" }}</div>
                <div class="jah-profile-email">{{ p.email }}</div>
              </div>
              <div class="jah-profile-count" :title="`${activityCountFor(p.username)} aktivitas`">
                {{ activityCountFor(p.username) }}
              </div>
            </div>
            <div class="jah-profile-tasks">
              <span
                v-for="(task, idx) in tasksFor(p)"
                :key="idx"
                class="jah-task-chip"
                :class="'jah-task-chip--' + task.category.toLowerCase()"
              >
                {{ task.category }} · {{ task.label }}
              </span>
              <span v-if="!tasksFor(p).length" class="jah-note jah-note--inline">
                Belum ada tugas di-assign
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- FILTERS -->
      <section class="jah-filter-bar">
        <div class="jah-filter-item">
          <label><Icon icon="mdi:flag-checkered" width="12" height="12" /> Race Category</label>
          <b-form-select v-model="filters.category" :options="categoryOptions" size="sm" />
        </div>
        <div class="jah-filter-item">
          <label><Icon icon="mdi:tag-outline" width="12" height="12" /> Initial</label>
          <b-form-select v-model="filters.initial" :options="initialOptions" size="sm" />
        </div>
        <div class="jah-filter-item">
          <label><Icon icon="mdi:account-outline" width="12" height="12" /> Judge</label>
          <b-form-select v-model="filters.judge" :options="judgeOptions" size="sm" />
        </div>
        <div class="jah-filter-item jah-filter-item--grow">
          <label><Icon icon="mdi:magnify" width="12" height="12" /> Cari Task (mis. Start, Gate 2, Booyan)</label>
          <b-form-input v-model="filters.taskSearch" size="sm" placeholder="Ketik untuk cari task..." />
        </div>
        <div class="jah-filter-item jah-filter-item--reset">
          <button type="button" class="jah-reset-btn" @click="resetFilters">
            <Icon icon="mdi:filter-remove-outline" width="14" height="14" />
            Reset Filter
          </button>
        </div>
      </section>

      <!-- ACTIVITY TABLE -->
      <section class="jah-table-card">
        <div v-if="loading" class="jah-empty">
          <b-spinner small class="mr-2" />Memuat aktivitas…
        </div>
        <div v-else-if="!filteredItems.length" class="jah-empty">
          <Icon icon="mdi:inbox-outline" width="28" height="28" class="mb-2" />
          <div>Tidak ada aktivitas yang cocok dengan filter saat ini.</div>
        </div>
        <div v-else class="jah-table-wrap">
          <table class="jah-table">
            <thead>
              <tr>
                <th class="jah-col-time">Waktu</th>
                <th class="jah-col-judge">Juri</th>
                <th class="jah-col-cat">Kategori</th>
                <th class="jah-col-task">Task</th>
                <th class="jah-col-detail">Detail</th>
                <th class="jah-col-team">Tim</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item._id" class="jah-row">
                <td class="jah-col-time">
                  <span class="jah-time">{{ formatTime(item.receivedAt) }}</span>
                </td>
                <td class="jah-col-judge">
                  <span class="jah-judge">
                    <Icon icon="mdi:account-circle-outline" width="15" height="15" />
                    {{ item.judge || "Juri tidak diketahui" }}
                  </span>
                </td>
                <td class="jah-col-cat">
                  <span
                    class="jah-badge jah-badge--category"
                    :class="'jah-badge--cat-' + String(item.raceCategory).toLowerCase()"
                  >
                    {{ categoryLabel(item.raceCategory) }}
                  </span>
                  <div v-if="categoryContextFor(item)" class="jah-subtext">
                    {{ categoryContextFor(item) }}
                  </div>
                </td>
                <td class="jah-col-task">
                  <span v-if="taskLabel(item)" class="jah-badge jah-badge--task">
                    {{ taskLabel(item) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="jah-col-detail">
                  {{ item.text || item.type || "-" }}
                  <span v-if="item.value !== null && item.value !== undefined" class="jah-badge jah-badge--value">
                    Penalty {{ item.value }}
                  </span>
                </td>
                <td class="jah-col-team">
                  <template v-if="item.teamName || item.bibTeam">
                    <div v-if="item.teamName">{{ item.teamName }}</div>
                    <div v-if="item.bibTeam" class="jah-subtext">BIB {{ item.bibTeam }}</div>
                  </template>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </b-container>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";

const CATEGORY_LABELS = {
  sprint: "Sprint",
  h2h: "Head to Head",
  slalom: "Slalom",
  drr: "Down River Race",
  rx: "Rafting Cross",
};

export default {
  name: "JudgeActivityHistory",
  components: { Icon },
  data() {
    return {
      eventInfo: {},
      judgeProfiles: [],
      activityItems: [],
      loading: false,
      filters: {
        category: "",
        initial: "",
        judge: "",
        taskSearch: "",
      },
    };
  },
  computed: {
    eventId() {
      return this.$route.params.id ? String(this.$route.params.id) : "";
    },
    categoryOptions() {
      const opts = [{ value: "", text: "Semua Kategori" }];
      Object.keys(CATEGORY_LABELS).forEach((k) => {
        opts.push({ value: k, text: CATEGORY_LABELS[k] });
      });
      return opts;
    },
    initialOptions() {
      const set = new Set();
      this.activityItems.forEach((it) => {
        if (it.initialName) set.add(it.initialName);
      });
      const opts = [{ value: "", text: "Semua Initial" }];
      Array.from(set)
        .sort()
        .forEach((name) => opts.push({ value: name, text: name }));
      return opts;
    },
    distinctJudgeNames() {
      const set = new Set();
      this.activityItems.forEach((it) => {
        if (it.judge) set.add(it.judge);
      });
      return Array.from(set);
    },
    judgeOptions() {
      const set = new Set();
      this.judgeProfiles.forEach((p) => {
        if (p.username) set.add(p.username);
      });
      this.distinctJudgeNames.forEach((n) => set.add(n));
      const opts = [{ value: "", text: "Semua Judge" }];
      Array.from(set)
        .sort()
        .forEach((name) => opts.push({ value: name, text: name }));
      return opts;
    },
    filteredItems() {
      const catF = this.filters.category;
      const initF = this.filters.initial;
      const judgeF = this.filters.judge;
      const taskQ = String(this.filters.taskSearch || "").trim().toLowerCase();

      return this.activityItems.filter((it) => {
        if (catF && String(it.raceCategory).toLowerCase() !== catF) return false;
        if (initF && it.initialName !== initF) return false;
        if (judgeF && it.judge !== judgeF) return false;
        if (taskQ) {
          const label = this.taskLabel(it).toLowerCase();
          if (!label.includes(taskQ)) return false;
        }
        return true;
      });
    },
  },
  mounted() {
    if (this.eventId) this.fetchAll();
  },
  methods: {
    goBack() {
      this.$router.push(`/event-detail/${this.eventId}`);
    },
    async fetchAll() {
      this.loading = true;
      await Promise.all([
        this.fetchEventInfo(),
        this.fetchJudgeProfiles(),
        this.fetchActivity(),
      ]);
      this.loading = false;
    },
    fetchEventInfo() {
      return new Promise((resolve) => {
        if (typeof ipcRenderer === "undefined" || !this.eventId) return resolve();
        ipcRenderer.once("get-events-byid-reply", (_e, res) => {
          this.eventInfo = res && typeof res === "object" ? res : {};
          resolve();
        });
        ipcRenderer.send("get-events-byid", this.eventId);
      });
    },
    fetchJudgeProfiles() {
      return new Promise((resolve) => {
        if (typeof ipcRenderer === "undefined" || !this.eventId) return resolve();
        ipcRenderer.once("users-judges-assignment:listByEvent:reply", (_e, res) => {
          const items =
            res && res.ok && Array.isArray(res.items)
              ? res.items
              : Array.isArray(res)
              ? res
              : [];
          this.judgeProfiles = items;
          resolve();
        });
        ipcRenderer.send("users-judges-assignment:listByEvent", {
          eventId: this.eventId,
        });
      });
    },
    fetchActivity() {
      return new Promise((resolve) => {
        if (typeof ipcRenderer === "undefined" || !this.eventId) return resolve();
        ipcRenderer.once("judgeLog:listByEvent:reply", (_e, res) => {
          this.activityItems = res && res.ok && Array.isArray(res.items) ? res.items : [];
          resolve();
        });
        // TANPA raceCategory = semua kategori (Sprint/H2H/Slalom/DRR/RX)
        // untuk event ini sekaligus — beda dari JudgeActionHistoryModal.vue
        // yang selalu scoped ke 1 kategori. limit dinaikkan ke maksimum
        // yang diizinkan backend (500, lihat listJudgeActionLogsByEvent).
        ipcRenderer.send("judgeLog:listByEvent", {
          eventId: this.eventId,
          limit: 500,
        });
      });
    },
    toggleJudgeFilter(username) {
      this.filters.judge = this.filters.judge === username ? "" : username;
    },
    resetFilters() {
      this.filters = { category: "", initial: "", judge: "", taskSearch: "" };
    },
    activityCountFor(username) {
      if (!username) return 0;
      return this.activityItems.filter((it) => it.judge === username).length;
    },
    // Bangun daftar task humanized dari 1 profile judge (judges[0] hasil
    // listUserJudgeAssignmentsByEvent) — field per kategori sama persis
    // dgn buildEventPositionsPayloadForEmail() di JudgesSettings.vue.
    tasksFor(profile) {
      const j =
        profile && Array.isArray(profile.judges) && profile.judges[0]
          ? profile.judges[0]
          : null;
      if (!j) return [];
      const out = [];
      const push = (cat, label) => out.push({ category: cat, label });

      if (j.sprint) {
        if (j.sprint.start) push("Sprint", "Start");
        if (j.sprint.finish) push("Sprint", "Finish");
      }
      if (j.h2h) {
        if (j.h2h.start) push("H2H", "Start");
        if (j.h2h.finish) push("H2H", "Finish");
        ["R1", "R2", "L1", "L2"].forEach((k) => {
          if (j.h2h[k]) push("H2H", "Booyan " + k);
        });
      }
      if (j.slalom) {
        if (j.slalom.start) push("Slalom", "Start");
        if (j.slalom.finish) push("Slalom", "Finish");
        (j.slalom.gates || []).forEach((g) => push("Slalom", "Gate " + g));
      }
      if (j.drr) {
        if (j.drr.start) push("DRR", "Start");
        if (j.drr.finish) push("DRR", "Finish");
        (j.drr.sections || []).forEach((s) => push("DRR", "Section " + s));
      }
      if (j.rx) {
        if (j.rx.start) push("RX", "Start");
        if (j.rx.finish) push("RX", "Finish");
        (j.rx.gates || []).forEach((g) => push("RX", "Gate " + g));
      }
      return out;
    },
    categoryLabel(cat) {
      return CATEGORY_LABELS[String(cat).toLowerCase()] || cat || "-";
    },
    categoryContextFor(item) {
      const parts = [item.initialName, item.divisionName, item.raceName].filter(Boolean);
      return parts.join(" - ");
    },
    // Sama persis humanizer di JudgeActionHistoryModal.vue — item.type
    // mentah beda format per kategori (Sprint "Start"/"Finish", H2H
    // "PenaltyStart"/"BooyanCorner", Slalom/DRR "start"/"gate"/"section",
    // RX "PenaltyGate1"/"RaceTime") -> label enak dibaca.
    taskLabel(item) {
      const raw = item && item.type ? String(item.type) : "";
      if (!raw) return "";
      const spaced = raw
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([a-zA-Z])([0-9])/g, "$1 $2")
        .replace(/_/g, " ")
        .trim();
      return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
    },
    formatTime(v) {
      if (!v) return "-";
      try {
        const d = new Date(v);
        return d.toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch (e) {
        return "-";
      }
    },
  },
};
</script>

<style scoped>
.jah-page {
  background: #f6f8fb;
  /* BUG FIX: `.app-main` (App.vue) meregang penuh layar lewat flexbox
     (flex: 1 0 auto), BUKAN lewat tinggi eksplisit — jadi `min-height:
     100%` di sini tidak bisa "mewarisi" tinggi itu (persentase height
     butuh parent dengan tinggi eksplisit, bukan hasil hitungan flexbox),
     dan background abu-abu ini cuma setinggi konten, nyisain celah putih
     polos di bawahnya saat konten pendek (mis. state kosong). Pakai
     viewport-relative + kurangi tinggi Navbar/Footer (var css global dari
     App.vue) supaya pas mengisi area konten tanpa lebih. */
  min-height: calc(100vh - var(--nav-h, 64px) - var(--footer-h, 56px));
  padding-bottom: 48px;
}

/* ===== HERO HEADER ===== */
.jah-hero {
  background: linear-gradient(135deg, #163a5c 0%, #1c4c7a 55%, #2a6099 100%);
  padding: 18px 0 26px;
  margin-bottom: -18px;
}
.jah-hero__inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.jah-back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.85);
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.jah-back:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.jah-hero__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.jah-hero__title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.jah-hero__icon {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.jah-hero__title h3 {
  color: #fff;
  font-weight: 800;
  font-size: 19px;
  margin: 0;
  line-height: 1.2;
}
.jah-hero__title p {
  color: rgba(255, 255, 255, 0.65);
  font-size: 12.5px;
  margin: 2px 0 0;
}
.jah-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  color: #1c4c7a;
  border: none;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}
.jah-refresh-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  transform: translateY(-1px);
}
.jah-refresh-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.jah-body {
  position: relative;
  z-index: 1;
}

/* ===== STAT CARDS ===== */
.jah-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}
.jah-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #e6ebf1;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.jah-stat__icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.jah-stat__icon--blue { background: #e8f1fa; color: #1c4c7a; }
.jah-stat__icon--violet { background: #eef0fe; color: #6366f1; }
.jah-stat__icon--cyan { background: #e3f6fe; color: #0ea5e9; }
.jah-stat__icon--amber { background: #fef3e0; color: #d9860f; }
.jah-stat__value {
  font-size: 21px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
}
.jah-stat__label {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
}

/* ===== SECTIONS ===== */
.jah-section {
  margin-bottom: 22px;
}
.jah-section__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}
.jah-section__head h5 {
  font-weight: 800;
  font-size: 15px;
  color: #0f172a;
  margin: 0;
}
.jah-section__hint {
  font-size: 11.5px;
  color: #94a3b8;
}
.jah-note {
  font-size: 12.5px;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 12px;
}
.jah-note--inline {
  background: none;
  border: none;
  padding: 0;
}

/* ===== PROFILE JUDGES ===== */
.jah-profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}
.jah-profile-card {
  border: 1px solid #e6ebf1;
  border-radius: 14px;
  padding: 13px 15px;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}
.jah-profile-card:hover {
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}
.jah-profile-card--active {
  border-color: #1c4c7a;
  box-shadow: 0 0 0 2px rgba(28, 76, 122, 0.15);
}
.jah-profile-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.jah-profile-card__id {
  min-width: 0;
}
.jah-profile-avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f1fa, #dbe9fb);
  color: #1c4c7a;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.jah-profile-name {
  font-weight: 700;
  font-size: 13.5px;
  color: #0f172a;
}
.jah-profile-email {
  font-size: 11.5px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jah-profile-count {
  margin-left: auto;
  min-width: 26px;
  text-align: center;
  font-weight: 800;
  font-size: 13px;
  color: #1c4c7a;
  background: #eef4ff;
  border-radius: 999px;
  padding: 3px 8px;
  flex-shrink: 0;
}
.jah-profile-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 11px;
}
.jah-task-chip {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
}
.jah-task-chip--sprint { background: #e8f1fa; color: #1c4c7a; }
.jah-task-chip--h2h { background: #eef0fe; color: #6366f1; }
.jah-task-chip--slalom { background: #e3f6fe; color: #0ea5e9; }
.jah-task-chip--drr { background: #fdf1de; color: #d9860f; }
.jah-task-chip--rx { background: #fde7ec; color: #e11d48; }

/* ===== FILTER BAR ===== */
.jah-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  background: #fff;
  border: 1px solid #e6ebf1;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.jah-filter-item {
  min-width: 160px;
}
.jah-filter-item--grow {
  flex: 1 1 240px;
}
.jah-filter-item--reset {
  min-width: auto;
}
.jah-filter-item label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.jah-reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #dde3ea;
  color: #475569;
  font-size: 12.5px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  height: 31px;
  transition: background 0.15s ease;
}
.jah-reset-btn:hover {
  background: #eef2f6;
}

/* ===== ACTIVITY TABLE ===== */
.jah-table-card {
  background: #fff;
  border: 1px solid #e6ebf1;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.jah-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
.jah-table-wrap {
  overflow-x: auto;
}
.jah-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.jah-table thead th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  text-align: left;
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
  padding: 11px 14px;
  border-bottom: 1px solid #e6ebf1;
  white-space: nowrap;
}
.jah-row td {
  padding: 11px 14px;
  border-bottom: 1px solid #eef1f5;
  vertical-align: top;
  color: #1e293b;
}
.jah-row:last-child td {
  border-bottom: none;
}
.jah-row:hover td {
  background: #f8fafc;
}
.jah-col-time { white-space: nowrap; }
.jah-time {
  color: #64748b;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.jah-col-judge { white-space: nowrap; }
.jah-judge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #1c4c7a;
  font-weight: 700;
  font-size: 12.5px;
}
.jah-col-cat { white-space: nowrap; }
.jah-subtext {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 3px;
}
.jah-col-detail {
  font-weight: 600;
  color: #0f172a;
  min-width: 200px;
}
.jah-col-team { white-space: nowrap; }

.jah-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: #eff6ff;
  color: #1874a5;
  vertical-align: middle;
}
.jah-badge--value {
  margin-left: 6px;
  background: #fef2f2;
  color: #dc2626;
}
.jah-badge--task {
  background: #f3ecff;
  color: #7c3aed;
}
.jah-badge--cat-sprint { background: #e8f1fa; color: #1c4c7a; }
.jah-badge--cat-h2h { background: #eef0fe; color: #6366f1; }
.jah-badge--cat-slalom { background: #e3f6fe; color: #0ea5e9; }
.jah-badge--cat-drr { background: #fdf1de; color: #d9860f; }
.jah-badge--cat-rx { background: #fde7ec; color: #e11d48; }

@media (max-width: 576px) {
  .jah-hero__row {
    flex-direction: column;
    align-items: flex-start;
  }
  .jah-refresh-btn {
    align-self: stretch;
    justify-content: center;
  }
}
</style>
