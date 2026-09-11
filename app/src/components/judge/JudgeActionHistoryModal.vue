<template>
  <span class="jah-wrapper">
    <button
      type="button"
      class="jah-trigger"
      title="Riwayat tindakan judge"
      @click="open"
    >
      <Icon icon="mdi:history" width="16" height="16" />
      Riwayat Judge
    </button>

    <b-modal v-model="isOpen" hide-footer size="lg" :title="modalTitle">
      <div class="jah-body">
        <div v-if="loading" class="jah-state">Memuat riwayat…</div>
        <div v-else-if="error" class="jah-state jah-state--error">
          Gagal memuat riwayat: {{ error }}
        </div>
        <div v-else-if="!items.length" class="jah-state">
          Belum ada tindakan judge untuk kategori ini.
        </div>
        <ul v-else class="jah-list">
          <li v-for="item in items" :key="item._id" class="jah-item">
            <div class="jah-item-icon">
              <Icon icon="mdi:gavel" width="18" height="18" />
            </div>
            <div class="jah-item-main">
              <div class="jah-item-text">{{ item.text || item.type }}</div>
              <div class="jah-item-meta">
                <span v-if="item.teamName">{{ item.teamName }}</span>
                <span v-if="item.bibTeam"> &middot; BIB {{ item.bibTeam }}</span>
                <span v-if="item.from"> &middot; {{ item.from }}</span>
              </div>
            </div>
            <div class="jah-item-time">{{ formatTime(item.receivedAt) }}</div>
          </li>
        </ul>
      </div>
    </b-modal>
  </span>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "JudgeActionHistoryModal",
  props: {
    eventId: { type: String, required: true },
    // "sprint" | "slalom" | "drr" | "h2h" | "rx"
    raceCategory: { type: String, required: true },
    categoryLabel: { type: String, default: "" },
  },
  data() {
    return {
      isOpen: false,
      loading: false,
      error: null,
      items: [],
    };
  },
  computed: {
    modalTitle() {
      var label = this.categoryLabel || this.raceCategory;
      return "Riwayat Judge — " + label;
    },
  },
  methods: {
    open() {
      this.isOpen = true;
      this.fetchLogs();
    },
    formatTime(v) {
      if (!v) return "-";
      try {
        var d = new Date(v);
        return d.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch (e) {
        return "-";
      }
    },
    fetchLogs() {
      if (typeof ipcRenderer === "undefined" || !this.eventId) return;
      this.loading = true;
      this.error = null;

      ipcRenderer.removeAllListeners("judgeLog:listByEvent:reply");
      ipcRenderer.send("judgeLog:listByEvent", {
        eventId: this.eventId,
        raceCategory: this.raceCategory,
      });
      ipcRenderer.once("judgeLog:listByEvent:reply", (_e, res) => {
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
.jah-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.jah-trigger:hover {
  background: #f1f5f9;
}
.jah-body {
  max-height: 60vh;
  overflow-y: auto;
}
.jah-state {
  padding: 24px 8px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}
.jah-state--error {
  color: #dc2626;
}
.jah-list {
  list-style: none;
  margin: 0;
  padding: 0;
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
.jah-item-time {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
}
</style>
