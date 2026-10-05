<template>
  <div class="list-page">
    <PageHero
      title="Judges Activity History"
      crumb="Judges Activity History"
      icon="mdi:gavel"
      :subtitle="(eventInfo.eventName || 'Event') + ' — semua tindakan juri di event ini'"
      :stats="[
        { label: 'Judges Ditugaskan', value: judgeProfiles.length },
        { label: 'Total Aktivitas', value: activityItems.length, tone: 'neutral' },
        { label: 'Sesuai Filter', value: filteredItems.length, tone: 'success' },
        { label: 'Juri Aktif Mencatat', value: distinctJudgeNames.length, tone: 'warning' },
      ]"
      @back="goBack"
    >
      <template #actions>
        <button type="button" class="ph-btn ph-btn--primary" :disabled="loading" @click="fetchAll">
          <b-spinner v-if="loading" small />
          <Icon v-else icon="mdi:refresh" />
          Refresh
        </button>
      </template>
    </PageHero>

    <div class="jah-layout">
      <!-- PROFILE JUDGES -->
      <aside class="lp-card jah-profiles">
        <div class="lp-card__head">
          <h5 class="lp-card__title">
            <Icon icon="mdi:account-group-outline" />
            Profile Judges
          </h5>
          <span class="lp-segment__count">{{ judgeProfiles.length }}</span>
        </div>
        <p class="jah-profiles__hint">Klik kartu untuk filter aktivitas per juri.</p>
        <div class="jah-profiles__list">
          <div v-if="loading && !judgeProfiles.length" class="jah-note">
            <b-spinner small class="mr-2" /> Memuat juri…
          </div>
          <div v-else-if="!judgeProfiles.length" class="jah-note">
            Belum ada juri yang ditugaskan untuk event ini (atur lewat "Judges
            Settings" di Event Detail).
          </div>
          <button
            v-for="p in judgeProfiles"
            :key="p.email"
            type="button"
            class="jah-profile"
            :class="{ 'is-active': filters.judge === p.username }"
            @click="toggleJudgeFilter(p.username)"
          >
            <div class="jah-profile__head">
              <span class="jah-profile__avatar">
                {{ (p.username || p.email || "?").charAt(0).toUpperCase() }}
              </span>
              <span class="jah-profile__id">
                <span class="jah-profile__name">{{ p.username || "-" }}</span>
                <span class="jah-profile__email">{{ p.email }}</span>
              </span>
              <span class="jah-profile__count" :title="`${activityCountFor(p.username)} aktivitas`">
                {{ activityCountFor(p.username) }}
              </span>
            </div>
            <div class="jah-profile__tasks">
              <span
                v-for="(task, idx) in tasksFor(p)"
                :key="idx"
                class="jah-task"
                :class="'jah-task--' + task.category.toLowerCase()"
              >
                {{ task.category }} · {{ task.label }}
              </span>
              <span v-if="!tasksFor(p).length" class="jah-muted">Belum ada tugas di-assign</span>
            </div>
          </button>
        </div>
      </aside>

      <!-- AKTIVITAS -->
      <section class="lp-card jah-activity">
        <div class="lp-toolbar">
          <div class="lp-search">
            <Icon icon="mdi:magnify" class="lp-search__icon" />
            <input
              v-model="filters.taskSearch"
              type="text"
              class="lp-search__input"
              placeholder="Cari task (mis. Start, Gate 2, Booyan)…"
            />
            <button v-if="filters.taskSearch" type="button" class="lp-search__clear" @click="filters.taskSearch = ''">
              <Icon icon="mdi:close" />
            </button>
          </div>
          <div class="lp-filters">
            <div class="lp-select">
              <Icon icon="mdi:tag-outline" class="lp-select__icon" />
              <select v-model="filters.initial" class="lp-select__input">
                <option v-for="o in initialOptions" :key="o.value" :value="o.value">{{ o.text }}</option>
              </select>
              <Icon icon="mdi:chevron-down" class="lp-select__chev" />
            </div>
            <div class="lp-select">
              <Icon icon="mdi:account-outline" class="lp-select__icon" />
              <select v-model="filters.judge" class="lp-select__input">
                <option v-for="o in judgeOptions" :key="o.value" :value="o.value">{{ o.text }}</option>
              </select>
              <Icon icon="mdi:chevron-down" class="lp-select__chev" />
            </div>
            <button
              v-if="filters.category || filters.initial || filters.judge || filters.taskSearch"
              type="button"
              class="lp-reset"
              @click="resetFilters"
            >
              <Icon icon="mdi:filter-remove-outline" />
              Reset
            </button>
          </div>
        </div>

        <!-- Filter kategori (chip) -->
        <div class="jah-cats">
          <button
            v-for="c in categoryChips"
            :key="c.value || 'all'"
            type="button"
            class="jah-cat"
            :class="[{ active: filters.category === c.value }, c.value ? 'jah-cat--' + c.value : '']"
            @click="filters.category = c.value"
          >
            {{ c.text }}
            <span class="jah-cat__count">{{ c.count }}</span>
          </button>
        </div>

        <div v-if="loading" class="lp-empty">
          <b-spinner small /> Memuat aktivitas…
        </div>
        <div v-else-if="!filteredItems.length" class="lp-empty">
          <Icon icon="mdi:inbox-outline" width="36" height="36" />
          <div class="lp-empty__title">Tidak ada aktivitas</div>
          <small>Tidak ada aktivitas yang cocok dengan filter saat ini.</small>
        </div>
        <div v-else class="table-responsive lp-table-wrap">
          <table class="table lp-table mb-0">
            <thead>
              <tr>
                <th class="jah-col-time">Waktu</th>
                <th>Juri</th>
                <th>Kategori</th>
                <th>Task</th>
                <th>Detail</th>
                <th>Tim</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="g in groupedItems">
                <tr :key="'day-' + g.key" class="jah-day-row">
                  <td colspan="6">
                    <Icon icon="mdi:calendar-blank-outline" />
                    {{ g.label }}
                    <span class="jah-day-row__count">{{ g.items.length }} aktivitas</span>
                  </td>
                </tr>
                <tr v-for="item in g.items" :key="item._id">
                  <td class="jah-col-time">
                    <span class="jah-time">{{ formatClock(item.receivedAt) }}</span>
                  </td>
                  <td>
                    <span class="jah-judge">
                      <Icon icon="mdi:account-circle-outline" />
                      {{ item.judge || "Juri tidak diketahui" }}
                    </span>
                  </td>
                  <td>
                    <span class="jah-cat-badge" :class="'jah-cat-badge--' + String(item.raceCategory).toLowerCase()">
                      {{ categoryLabel(item.raceCategory) }}
                    </span>
                    <div v-if="categoryContextFor(item)" class="jah-subtext">
                      {{ categoryContextFor(item) }}
                    </div>
                  </td>
                  <td>
                    <span v-if="taskLabel(item)" class="jah-task-badge">{{ taskLabel(item) }}</span>
                    <span v-else class="jah-muted">-</span>
                  </td>
                  <td class="jah-col-detail">
                    {{ item.text || item.type || "-" }}
                    <span
                      v-if="item.value !== null && item.value !== undefined"
                      class="jah-pill"
                      :class="'jah-pill--' + penaltyTone(item.value)"
                    >
                      Penalty {{ item.value }}
                    </span>
                  </td>
                  <td>
                    <template v-if="item.teamName || item.bibTeam">
                      <div class="jah-team">{{ item.teamName }}</div>
                      <div v-if="item.bibTeam" class="jah-subtext">BIB {{ item.bibTeam }}</div>
                    </template>
                    <span v-else class="jah-muted">-</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import PageHero from "@/components/common/PageHero.vue";
import { groupByDay, penaltyTone, formatClock } from "@/utils/judgeHistoryView";

const CATEGORY_LABELS = {
  sprint: "Sprint",
  h2h: "Head to Head",
  slalom: "Slalom",
  drr: "Down River Race",
  rx: "Rafting Cross",
};

export default {
  name: "JudgeActivityHistory",
  components: { Icon, PageHero },
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
    // Chip filter kategori + jumlah aktivitas per kategori.
    categoryChips() {
      const counts = {};
      this.activityItems.forEach((it) => {
        const k = String(it.raceCategory || "").toLowerCase();
        counts[k] = (counts[k] || 0) + 1;
      });
      return this.categoryOptions.map((o) => ({
        value: o.value,
        text: o.value ? o.text : "Semua",
        count: o.value ? counts[o.value] || 0 : this.activityItems.length,
      }));
    },
    // Aktivitas terfilter dikelompokkan per hari (header baris di tabel).
    groupedItems() {
      return groupByDay(this.filteredItems);
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
    penaltyTone,
    formatClock,
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
/* Header: PageHero.vue; kartu/toolbar/tabel: list-pages.css (global). */

.jah-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  margin-top: 20px;
}
.jah-layout .lp-card {
  margin-top: 0;
}

/* ---------- Profile Judges ---------- */
.jah-profiles {
  position: sticky;
  top: calc(var(--nav-h, 64px) + 16px);
  max-height: calc(100vh - var(--nav-h, 64px) - 32px);
  display: flex;
  flex-direction: column;
}
.jah-profiles__hint {
  margin: 4px 20px 10px;
  font-size: 12px;
  color: #64748b;
}
.jah-profiles__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 14px 16px;
  overflow-y: auto;
}
.jah-profile {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e6edf6;
  border-radius: 14px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}
.jah-profile:hover {
  border-color: #b9d7f0;
  box-shadow: 0 4px 12px rgba(15, 42, 67, 0.06);
}
.jah-profile.is-active {
  border-color: #25b0eb;
  background: #f0f7ff;
  box-shadow: 0 0 0 3px rgba(37, 176, 235, 0.15);
}
.jah-profile__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.jah-profile__avatar {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.jah-profile__id {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.jah-profile__name {
  font-weight: 800;
  font-size: 13.5px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jah-profile__email {
  font-size: 11.5px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jah-profile__count {
  flex: none;
  min-width: 28px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #e6f4fd;
  color: #1c4c7a;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}
.jah-profile__tasks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}
.jah-task {
  padding: 1px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
}
.jah-task--sprint { background: #e8f1fa; color: #1c4c7a; }
.jah-task--h2h { background: #eef0fe; color: #4f46e5; }
.jah-task--slalom { background: #e3f6fe; color: #0284c7; }
.jah-task--drr { background: #fdf1de; color: #b45309; }
.jah-task--rx { background: #fde7ec; color: #be123c; }
.jah-note {
  padding: 16px 12px;
  border: 1px dashed #dbe3ee;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 12.5px;
  text-align: center;
}
.jah-muted {
  color: #94a3b8;
  font-size: 12px;
}

/* ---------- Filter kategori ---------- */
.jah-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 20px;
  border-bottom: 1px solid #eef2f7;
}
.jah-cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}
.jah-cat:hover {
  border-color: #b9d7f0;
}
.jah-cat.active {
  background: #1c4c7a;
  border-color: #1c4c7a;
  color: #ffffff;
}
.jah-cat--h2h.active { background: #4f46e5; border-color: #4f46e5; }
.jah-cat--slalom.active { background: #0284c7; border-color: #0284c7; }
.jah-cat--drr.active { background: #b45309; border-color: #b45309; }
.jah-cat--rx.active { background: #be123c; border-color: #be123c; }
.jah-cat__count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
.jah-cat.active .jah-cat__count {
  background: rgba(255, 255, 255, 0.22);
}

/* ---------- Tabel aktivitas ---------- */
.jah-day-row td {
  padding: 8px 16px !important;
  background: #f8fafc;
  color: #1c4c7a;
  font-size: 11.5px !important;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.jah-day-row__count {
  margin-left: 8px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: none;
  letter-spacing: 0;
}
.jah-col-time {
  width: 110px;
  white-space: nowrap;
}
.jah-time {
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.jah-judge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  white-space: nowrap;
}
.jah-judge svg {
  color: #25b0eb;
}
.jah-cat-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 800;
  background: #f1f5f9;
  color: #475569;
  white-space: nowrap;
}
.jah-cat-badge--sprint { background: #e8f1fa; color: #1c4c7a; }
.jah-cat-badge--h2h { background: #eef0fe; color: #4f46e5; }
.jah-cat-badge--slalom { background: #e3f6fe; color: #0284c7; }
.jah-cat-badge--drr { background: #fdf1de; color: #b45309; }
.jah-cat-badge--rx { background: #fde7ec; color: #be123c; }
.jah-task-badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 8px;
  background: #ede9fe;
  color: #6d28d9;
  font-size: 11.5px;
  font-weight: 800;
  white-space: nowrap;
}
.jah-subtext {
  margin-top: 3px;
  font-size: 11.5px;
  color: #64748b;
}
.jah-col-detail {
  min-width: 220px;
}
.jah-team {
  font-weight: 700;
}
.jah-pill {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.jah-pill--plus { background: #fef3c7; color: #b45309; }
.jah-pill--minus { background: #dcfce7; color: #15803d; }
.jah-pill--zero { background: #f1f5f9; color: #64748b; }

@media (max-width: 1099.98px) {
  .jah-layout {
    grid-template-columns: 1fr;
  }
  .jah-profiles {
    position: static;
    max-height: none;
  }
  .jah-profiles__list {
    flex-direction: row;
    overflow-x: auto;
  }
  .jah-profile {
    min-width: 260px;
  }
}
</style>
