<template>
  <span class="fnm-wrapper">
    <button
      type="button"
      class="fnm-trigger"
      title="Field Notes dari juri (informasi, bukan penalty resmi)"
      @click="open"
    >
      <Icon icon="mdi:note-text-outline" width="16" height="16" />
      Field Notes
      <span v-if="items.length" class="fnm-badge">{{ items.length }}</span>
    </button>

    <b-modal v-model="isOpen" hide-footer size="lg" title="Field Notes">
      <div class="fnm-body">
        <p class="fnm-hint">
          Catatan lapangan yang dikirim juri — murni informasi, TIDAK
          mempengaruhi penalty/hasil resmi.
        </p>

        <div v-if="loading" class="fnm-state">Memuat catatan…</div>
        <div v-else-if="error" class="fnm-state fnm-state--error">
          Gagal memuat catatan: {{ error }}
        </div>
        <div v-else-if="!items.length" class="fnm-state">
          Belum ada Field Notes utk kategori ini.
        </div>
        <ul v-else class="fnm-list">
          <li v-for="item in items" :key="item._id" class="fnm-item">
            <div class="fnm-item-icon">
              <Icon icon="mdi:note-text" width="18" height="18" />
            </div>
            <div class="fnm-item-main">
              <div class="fnm-item-title">
                {{ (item.team && item.team.nameTeam) || "Team" }}
                <template v-if="item.team && item.team.bibTeam">
                  (BIB {{ item.team.bibTeam }})
                </template>
                <span v-if="item.runNumber" class="fnm-badge fnm-badge--run">
                  Run {{ item.runNumber }}
                </span>
              </div>
              <div v-if="item.remarks" class="fnm-remarks">
                "{{ item.remarks }}"
              </div>
              <small class="fnm-judge">Oleh: {{ item.judge || "Undefined" }}</small>
            </div>
            <div class="fnm-item-time">{{ formatTime(item.receivedAt) }}</div>
          </li>
        </ul>
      </div>
    </b-modal>
  </span>
</template>

<script>
import { ipcRenderer } from "electron";

// Versi RINGAN dari FoulsReportModal.vue (H2H) — dipakai Sprint/Slalom/
// DRR/RX, tanpa Pen Position/Detail/Unfouls Team (cuma satu team per
// catatan). Satu komponen dipakai bersama 4 kategori, dibedakan lewat
// prop `category`.
export default {
  name: "FieldNotesModal",
  props: {
    eventId: { type: String, required: true },
    category: { type: String, required: true }, // "SPRINT"|"SLALOM"|"DRR"|"RX"
    divisionId: { type: String, default: "" },
    raceId: { type: String, default: "" },
    // dinaikkan parent view tiap kali Field Notes baru diterima —
    // dipakai refetch otomatis kalau modal ini sedang terbuka.
    refreshTick: { type: Number, default: 0 },
  },
  data() {
    return {
      isOpen: false,
      loading: false,
      error: null,
      items: [],
    };
  },
  watch: {
    raceId() {
      this.fetchItems();
    },
    divisionId() {
      this.fetchItems();
    },
    refreshTick() {
      this.fetchItems();
    },
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    open() {
      this.isOpen = true;
      this.fetchItems();
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
    fetchItems() {
      if (typeof ipcRenderer === "undefined" || !this.eventId || !this.category)
        return;
      this.loading = true;
      this.error = null;

      ipcRenderer.removeAllListeners("fieldNotes:list:reply");
      ipcRenderer.send("fieldNotes:list", {
        eventId: this.eventId,
        category: this.category,
        divisionId: this.divisionId,
        raceId: this.raceId,
      });
      ipcRenderer.once("fieldNotes:list:reply", (_e, res) => {
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
.fnm-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #bae6fd;
  background: #f0f9ff;
  color: #0369a1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.fnm-trigger:hover {
  background: #e0f2fe;
}
.fnm-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: #0284c7;
  color: #fff;
}
.fnm-badge--run {
  background: #f1f5f9;
  color: #334155;
  margin-left: 6px;
}
.fnm-body {
  max-height: 60vh;
  overflow-y: auto;
}
.fnm-hint {
  color: #64748b;
  font-size: 12px;
  margin: 0 0 12px;
}
.fnm-state {
  padding: 24px 8px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}
.fnm-state--error {
  color: #dc2626;
}
.fnm-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fnm-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #bae6fd;
  border-radius: 10px;
  background: #f0f9ff;
}
.fnm-item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #e0f2fe;
  color: #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fnm-item-main {
  flex: 1;
  min-width: 0;
}
.fnm-item-title {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}
.fnm-remarks {
  margin-top: 6px;
  color: #475569;
  font-size: 12px;
  font-style: italic;
}
.fnm-judge {
  display: block;
  margin-top: 6px;
  color: #64748b;
}
.fnm-item-time {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
}
</style>
