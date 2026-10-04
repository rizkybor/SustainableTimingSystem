<template>
  <span class="ujh-wrapper">
    <b-button
      size="sm"
      variant="outline-info"
      class="btn-icon"
      title="Riwayat Judge"
      @click="open"
    >
      <Icon icon="mdi:history" width="16" height="16" />
    </b-button>

    <b-modal v-model="isOpen" hide-footer size="lg" :title="modalTitle">
      <div class="ujh-body">
        <div v-if="loading" class="ujh-state">Memuat riwayat…</div>
        <div v-else-if="error" class="ujh-state ujh-state--error">
          Gagal memuat riwayat: {{ error }}
        </div>
        <div v-else-if="!items.length" class="ujh-state">
          Juri ini belum punya tindakan apa pun yang tercatat.
        </div>
        <template v-else>
          <!-- FILTER: by Event & by Task -->
          <div class="ujh-filters">
            <div class="ujh-filter">
              <label>Event</label>
              <b-form-select v-model="filterEventId" :options="eventOptions" size="sm" />
            </div>
            <div class="ujh-filter">
              <label>Task</label>
              <b-form-select v-model="filterTask" :options="taskOptions" size="sm" />
            </div>
            <div class="ujh-filter-count">
              Menampilkan <strong>{{ filteredItems.length }}</strong> dari {{ items.length }} tindakan
            </div>
          </div>

          <div v-if="!filteredItems.length" class="ujh-state">
            Tidak ada tindakan yang cocok dengan filter ini.
          </div>
          <ul v-else class="ujh-list">
            <li v-for="item in filteredItems" :key="item._id" class="ujh-item">
              <div class="ujh-item-icon">
                <Icon icon="mdi:gavel" width="18" height="18" />
              </div>
              <div class="ujh-item-main">
                <div class="ujh-item-top">
                  <span class="ujh-badge ujh-badge--event">{{ eventName(item.eventId) }}</span>
                  <span class="ujh-badge ujh-badge--category">{{ (item.raceCategory || "-").toUpperCase() }}</span>
                  <span v-if="taskLabel(item)" class="ujh-badge ujh-badge--task">{{ taskLabel(item) }}</span>
                  <span v-if="item.value !== null && item.value !== undefined" class="ujh-badge ujh-badge--value">
                    Penalty {{ item.value }}
                  </span>
                </div>
                <div class="ujh-item-text">{{ item.text || item.type }}</div>
                <div class="ujh-item-meta">
                  <span v-if="categoryLabelFor(item)">{{ categoryLabelFor(item) }}</span>
                  <span v-if="item.teamName"> &middot; {{ item.teamName }}</span>
                  <span v-if="item.bibTeam"> &middot; BIB {{ item.bibTeam }}</span>
                </div>
              </div>
              <div class="ujh-item-time">{{ formatAt(item.receivedAt) }}</div>
            </li>
          </ul>
        </template>
      </div>
    </b-modal>
  </span>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";

export default {
  name: "UserJudgeHistoryModal",
  components: { Icon },
  props: {
    username: { type: String, required: true },
    // map { [eventId]: { name, level, start, end } } — dari fetchEvents()
    // di AdminUserManagement.vue, dipakai utk menampilkan nama event (log
    // ini sendiri cuma menyimpan eventId mentah).
    eventDict: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      isOpen: false,
      loading: false,
      error: null,
      items: [],
      filterEventId: "",
      filterTask: "",
    };
  },
  computed: {
    modalTitle() {
      return "Riwayat Judge — " + (this.username || "-");
    },
    // Opsi dropdown Event — cuma event yang BENAR-BENAR ada tindakannya di
    // riwayat juri ini (bukan semua event di sistem), + hitungan per event.
    eventOptions() {
      const counts = {};
      this.items.forEach((it) => {
        const id = String(it.eventId || "");
        counts[id] = (counts[id] || 0) + 1;
      });
      const opts = Object.keys(counts).map((id) => ({
        value: id,
        text: this.eventName(id) + " (" + counts[id] + ")",
      }));
      opts.sort((a, b) => a.text.localeCompare(b.text));
      opts.unshift({ value: "", text: "Semua Event (" + this.items.length + ")" });
      return opts;
    },
    // Opsi dropdown Task — distinct `type` mentah, dilabeli pakai
    // taskLabel() yang sama dgn JudgeActionHistoryModal.vue, + hitungan.
    taskOptions() {
      const counts = {};
      this.items.forEach((it) => {
        const t = String(it.type || "");
        counts[t] = (counts[t] || 0) + 1;
      });
      const opts = Object.keys(counts).map((t) => ({
        value: t,
        text: (this.taskLabel({ type: t }) || "(tanpa task)") + " (" + counts[t] + ")",
      }));
      opts.sort((a, b) => a.text.localeCompare(b.text));
      opts.unshift({ value: "", text: "Semua Task (" + this.items.length + ")" });
      return opts;
    },
    filteredItems() {
      return this.items.filter((it) => {
        if (this.filterEventId && String(it.eventId || "") !== this.filterEventId) return false;
        if (this.filterTask && String(it.type || "") !== this.filterTask) return false;
        return true;
      });
    },
  },
  methods: {
    open() {
      this.isOpen = true;
      this.filterEventId = "";
      this.filterTask = "";
      this.fetchLogs();
    },
    eventName(id) {
      const key = String(id || "");
      const meta = this.eventDict && this.eventDict[key];
      return (meta && meta.name) || key || "-";
    },
    categoryLabelFor(item) {
      const parts = [item.initialName, item.divisionName, item.raceName].filter(Boolean);
      return parts.join(" - ");
    },
    // Sama persis dgn JudgeActionHistoryModal.vue — "task" judge = item.type
    // mentah dari sts-jurysystem, di-humanize jadi label yang enak dibaca.
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
    formatAt(v) {
      if (!v) return "-";
      try {
        const d = new Date(v);
        if (isNaN(d.getTime())) return "-";
        return (
          d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
          ", " +
          d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      } catch (e) {
        return "-";
      }
    },
    fetchLogs() {
      if (typeof ipcRenderer === "undefined" || !this.username) return;
      this.loading = true;
      this.error = null;

      ipcRenderer.removeAllListeners("judgeLog:listByJudge:reply");
      ipcRenderer.send("judgeLog:listByJudge", { judge: this.username });
      ipcRenderer.once("judgeLog:listByJudge:reply", (_e, res) => {
        this.loading = false;
        if (res && res.ok) {
          this.items = res.items || [];
        } else {
          this.items = [];
          this.error = (res && res.error) || "unknown error";
        }
      });
    },
  },
};
</script>

<style scoped>
.ujh-body {
  max-height: 65vh;
  overflow-y: auto;
}
.ujh-filters {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 12px;
}
.ujh-filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
}
.ujh-filter label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin: 0;
}
.ujh-filter-count {
  font-size: 12.5px;
  color: #64748b;
  margin-left: auto;
}
.ujh-state {
  padding: 24px 8px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}
.ujh-state--error {
  color: #dc2626;
}
.ujh-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ujh-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}
.ujh-item-icon {
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
.ujh-item-main {
  flex: 1;
  min-width: 0;
}
.ujh-item-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 3px;
}
.ujh-item-text {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}
.ujh-item-meta {
  color: #64748b;
  font-size: 12px;
  margin-top: 2px;
}
.ujh-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: #eff6ff;
  color: #1874a5;
  vertical-align: middle;
}
.ujh-badge--event {
  background: #f1f5f9;
  color: #334155;
}
.ujh-badge--category {
  background: #ecfdf5;
  color: #047857;
}
.ujh-badge--value {
  background: #fef2f2;
  color: #dc2626;
}
.ujh-badge--task {
  background: #f3ecff;
  color: #7c3aed;
}
.ujh-item-time {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
}
</style>
