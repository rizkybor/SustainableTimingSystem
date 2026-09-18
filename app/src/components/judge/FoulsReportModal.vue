<template>
  <span class="frm-wrapper">
    <button
      type="button"
      class="frm-trigger"
      title="Fouls Report dari juri (informasi, bukan penalty resmi)"
      @click="open"
    >
      <Icon icon="mdi:alert-octagon-outline" width="16" height="16" />
      Fouls Report
      <span v-if="items.length" class="frm-badge">{{ items.length }}</span>
    </button>

    <b-modal v-model="isOpen" hide-footer size="lg" :title="modalTitle">
      <div class="frm-body">
        <p class="frm-hint">
          Daftar pelanggaran yang dilaporkan juri utk babak ini — murni
          informasi, TIDAK mempengaruhi penalty/hasil resmi.
        </p>

        <div v-if="loading" class="frm-state">Memuat laporan…</div>
        <div v-else-if="error" class="frm-state frm-state--error">
          Gagal memuat laporan: {{ error }}
        </div>
        <div v-else-if="!items.length" class="frm-state">
          Belum ada Fouls Report utk babak ini.
        </div>
        <ul v-else class="frm-list">
          <li v-for="item in items" :key="item._id" class="frm-item">
            <div class="frm-item-icon">
              <Icon icon="mdi:alert-octagon" width="18" height="18" />
            </div>
            <div class="frm-item-main">
              <div class="frm-item-title">
                <span class="frm-foul-team">
                  {{ (item.foulTeam && item.foulTeam.nameTeam) || "Team" }}
                  <template v-if="item.foulTeam && item.foulTeam.bibTeam">
                    (BIB {{ item.foulTeam.bibTeam }})
                  </template>
                </span>
                <span class="frm-vs">vs</span>
                <span class="frm-unfoul-team">
                  {{ (item.unfoulTeam && item.unfoulTeam.nameTeam) || "-" }}
                  <template v-if="item.unfoulTeam && item.unfoulTeam.bibTeam">
                    (BIB {{ item.unfoulTeam.bibTeam }})
                  </template>
                </span>
              </div>
              <div class="frm-item-meta">
                <span v-if="item.detailLabel" class="frm-badge frm-badge--detail">
                  {{ item.detailLabel }}
                  <template v-if="item.penaltySecondsLabel !== null && item.penaltySecondsLabel !== undefined">
                    ({{ item.penaltySecondsLabel === "DQ" ? "DQ" : item.penaltySecondsLabel + "s" }})
                  </template>
                </span>
                <span v-if="item.positionLabel" class="frm-badge frm-badge--position">
                  {{ item.positionLabel }}
                </span>
              </div>
              <div v-if="item.remarks" class="frm-remarks">
                "{{ item.remarks }}"
              </div>
              <small class="frm-judge">Oleh: {{ item.judge || "Undefined" }}</small>
            </div>
            <div class="frm-item-time">{{ formatTime(item.receivedAt) }}</div>
          </li>
        </ul>
      </div>
    </b-modal>
  </span>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "FoulsReportModal",
  props: {
    eventId: { type: String, required: true },
    divisionId: { type: String, default: "" },
    raceId: { type: String, default: "" },
    roundId: { type: String, default: "" },
    roundLabel: { type: String, default: "" },
    // dinaikkan HeadToHead.vue tiap kali Fouls Report baru diterima —
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
  computed: {
    modalTitle() {
      return "Fouls Report" + (this.roundLabel ? " — " + this.roundLabel : "");
    },
  },
  watch: {
    // babak berganti → daftar lama tidak relevan lagi, refetch supaya
    // badge counter di tombol tetap akurat utk babak yang SEDANG dibuka.
    roundId() {
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
      if (typeof ipcRenderer === "undefined" || !this.eventId || !this.roundId)
        return;
      this.loading = true;
      this.error = null;

      ipcRenderer.removeAllListeners("h2hFouls:list:reply");
      ipcRenderer.send("h2hFouls:list", {
        eventId: this.eventId,
        divisionId: this.divisionId,
        raceId: this.raceId,
        roundId: this.roundId,
      });
      ipcRenderer.once("h2hFouls:list:reply", (_e, res) => {
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
.frm-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #b45309;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.frm-trigger:hover {
  background: #fef3c7;
}
.frm-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: #dc2626;
  color: #fff;
}
.frm-body {
  max-height: 60vh;
  overflow-y: auto;
}
.frm-hint {
  color: #64748b;
  font-size: 12px;
  margin: 0 0 12px;
}
.frm-state {
  padding: 24px 8px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}
.frm-state--error {
  color: #dc2626;
}
.frm-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.frm-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #fde68a;
  border-radius: 10px;
  background: #fffbeb;
}
.frm-item-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #fef3c7;
  color: #b45309;
  display: flex;
  align-items: center;
  justify-content: center;
}
.frm-item-main {
  flex: 1;
  min-width: 0;
}
.frm-item-title {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}
.frm-foul-team {
  color: #dc2626;
}
.frm-vs {
  color: #94a3b8;
  margin: 0 6px;
  font-weight: 400;
}
.frm-unfoul-team {
  color: #0f172a;
}
.frm-item-meta {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.frm-badge--detail {
  background: #eff6ff;
  color: #1874a5;
}
.frm-badge--position {
  background: #f1f5f9;
  color: #334155;
}
.frm-remarks {
  margin-top: 6px;
  color: #475569;
  font-size: 12px;
  font-style: italic;
}
.frm-judge {
  display: block;
  margin-top: 6px;
  color: #64748b;
}
.frm-item-time {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
}
</style>
