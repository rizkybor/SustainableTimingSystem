<template>
  <div class="jah-page">
    <b-container class="mt-3">
      <!-- HEADER -->
      <div class="d-flex align-items-center justify-content-between flex-wrap mb-3" style="gap: 10px">
        <div>
          <b-button variant="outline-secondary" size="sm" class="mb-2" @click="goBack">
            <Icon icon="mdi:arrow-left" class="mr-1" />
            Kembali ke Event Detail
          </b-button>
          <h3 class="font-weight-bold mb-0">Judges Activity History</h3>
          <small class="text-muted">{{ eventInfo.eventName || "-" }}</small>
        </div>
        <b-button variant="outline-primary" :disabled="loading" @click="fetchAll">
          <b-spinner v-if="loading" small class="mr-1" />
          <Icon v-else icon="mdi:refresh" class="mr-1" />
          Refresh
        </b-button>
      </div>

      <!-- SUMMARY -->
      <b-row class="mb-3">
        <b-col cols="6" md="3" class="mb-2">
          <div class="jah-stat">
            <div class="jah-stat__value">{{ judgeProfiles.length }}</div>
            <div class="jah-stat__label">Judges Ditugaskan</div>
          </div>
        </b-col>
        <b-col cols="6" md="3" class="mb-2">
          <div class="jah-stat">
            <div class="jah-stat__value">{{ activityItems.length }}</div>
            <div class="jah-stat__label">Total Aktivitas</div>
          </div>
        </b-col>
        <b-col cols="6" md="3" class="mb-2">
          <div class="jah-stat">
            <div class="jah-stat__value">{{ filteredItems.length }}</div>
            <div class="jah-stat__label">Sesuai Filter</div>
          </div>
        </b-col>
        <b-col cols="6" md="3" class="mb-2">
          <div class="jah-stat">
            <div class="jah-stat__value">{{ distinctJudgeNames.length }}</div>
            <div class="jah-stat__label">Juri Aktif Mencatat</div>
          </div>
        </b-col>
      </b-row>

      <!-- PROFILE JUDGES -->
      <div class="mb-4">
        <h5 class="font-weight-bold mb-2">Profile Judges</h5>
        <div v-if="!judgeProfiles.length && !loading" class="text-muted small">
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
              <div class="min-w-0">
                <div class="jah-profile-name">{{ p.username || "-" }}</div>
                <div class="jah-profile-email">{{ p.email }}</div>
              </div>
              <div class="jah-profile-count">{{ activityCountFor(p.username) }}</div>
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
              <span v-if="!tasksFor(p).length" class="text-muted small">
                Belum ada tugas di-assign
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="jah-filter-bar mb-3">
        <div class="jah-filter-item">
          <label>Race Category</label>
          <b-form-select v-model="filters.category" :options="categoryOptions" size="sm" />
        </div>
        <div class="jah-filter-item">
          <label>Initial</label>
          <b-form-select v-model="filters.initial" :options="initialOptions" size="sm" />
        </div>
        <div class="jah-filter-item">
          <label>Judge</label>
          <b-form-select v-model="filters.judge" :options="judgeOptions" size="sm" />
        </div>
        <div class="jah-filter-item jah-filter-item--grow">
          <label>Cari Task (mis. Start, Gate 2, Booyan)</label>
          <b-form-input v-model="filters.taskSearch" size="sm" placeholder="Ketik untuk cari task..." />
        </div>
        <div class="jah-filter-item">
          <label>&nbsp;</label>
          <b-button variant="outline-secondary" size="sm" block @click="resetFilters">
            Reset Filter
          </b-button>
        </div>
      </div>

      <!-- ACTIVITY LIST -->
      <div class="jah-list-wrap">
        <div v-if="loading" class="jah-empty">Memuat aktivitas…</div>
        <div v-else-if="!filteredItems.length" class="jah-empty">
          Tidak ada aktivitas yang cocok dengan filter saat ini.
        </div>
        <ul v-else class="jah-list">
          <li v-for="item in filteredItems" :key="item._id" class="jah-item">
            <div class="jah-item-icon">
              <Icon icon="mdi:gavel" width="18" height="18" />
            </div>
            <div class="jah-item-main">
              <div class="jah-item-judge">
                <Icon icon="mdi:account-circle-outline" class="mr-1" />
                <span class="jah-judge-name">{{ item.judge || "Juri tidak diketahui" }}</span>
                <span class="jah-badge jah-badge--category" :class="'jah-badge--cat-' + String(item.raceCategory).toLowerCase()">
                  {{ categoryLabel(item.raceCategory) }}
                </span>
                <span v-if="taskLabel(item)" class="jah-badge jah-badge--task">
                  {{ taskLabel(item) }}
                </span>
              </div>
              <div class="jah-item-text">
                {{ item.text || item.type }}
                <span v-if="item.value !== null && item.value !== undefined" class="jah-badge jah-badge--value">
                  Penalty {{ item.value }}
                </span>
              </div>
              <div class="jah-item-meta">
                <span v-if="categoryContextFor(item)">{{ categoryContextFor(item) }}</span>
                <span v-if="item.teamName"> &middot; {{ item.teamName }}</span>
                <span v-if="item.bibTeam"> &middot; BIB {{ item.bibTeam }}</span>
              </div>
            </div>
            <div class="jah-item-time">{{ formatTime(item.receivedAt) }}</div>
          </li>
        </ul>
      </div>
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
  padding-bottom: 40px;
}
.jah-stat {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: center;
}
.jah-stat__value {
  font-size: 22px;
  font-weight: 800;
  color: #1c4c7a;
}
.jah-stat__label {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.jah-profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}
.jah-profile-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}
.jah-profile-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
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
.jah-profile-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eef4ff;
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
  font-weight: 800;
  font-size: 15px;
  color: #1c4c7a;
  flex-shrink: 0;
}
.jah-profile-tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
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

.jah-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: end;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}
.jah-filter-item {
  min-width: 160px;
}
.jah-filter-item--grow {
  flex: 1 1 240px;
}
.jah-filter-item label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
}

.jah-list-wrap {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.jah-empty {
  padding: 40px 16px;
  text-align: center;
  color: #64748b;
}
.jah-list {
  list-style: none;
  margin: 0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.jah-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}
.jah-item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  color: #1874a5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.jah-item-main {
  flex: 1;
  min-width: 0;
}
.jah-item-judge {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  color: #1c4c7a;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 3px;
}
.jah-judge-name {
  margin-right: 2px;
}
.jah-item-text {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}
.jah-item-meta {
  color: #64748b;
  font-size: 12px;
  margin-top: 2px;
}
.jah-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: #eff6ff;
  color: #1874a5;
  vertical-align: middle;
}
.jah-badge--value {
  background: #fef2f2;
  color: #dc2626;
}
.jah-badge--task {
  background: #f3ecff;
  color: #7c3aed;
}
.jah-badge--category { margin-left: 0; }
.jah-badge--cat-sprint { background: #e8f1fa; color: #1c4c7a; }
.jah-badge--cat-h2h { background: #eef0fe; color: #6366f1; }
.jah-badge--cat-slalom { background: #e3f6fe; color: #0ea5e9; }
.jah-badge--cat-drr { background: #fdf1de; color: #d9860f; }
.jah-badge--cat-rx { background: #fde7ec; color: #e11d48; }
.jah-item-time {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
}
</style>
