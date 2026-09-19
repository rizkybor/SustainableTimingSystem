<template>
  <span class="jah-wrapper">
    <button
      type="button"
      class="jah-trigger"
      title="Riwayat tindakan judge"
      @click="open"
    >
      <Icon icon="mdi:history" class="mr-1" />
      Riwayat Judge
    </button>

    <b-modal v-model="isOpen" hide-footer size="lg" :title="modalTitle">
      <div class="jah-body">
        <div v-if="items.length && !loading && !confirmingDelete" class="jah-toolbar">
          <button
            type="button"
            class="jah-delete-trigger"
            :disabled="deleting"
            @click="confirmingDelete = true"
          >
            <Icon icon="mdi:trash-can-outline" width="16" height="16" />
            Hapus Riwayat
          </button>
        </div>

        <div v-if="confirmingDelete" class="jah-confirm">
          <p class="jah-confirm-text">
            Yakin ingin menghapus <strong>seluruh</strong> riwayat judge
            kategori <strong>{{ categoryLabel || raceCategory }}</strong>
            untuk event ini? Ini menghapus riwayat SEMUA juri (bukan cuma
            satu) dan tidak bisa dibatalkan.
          </p>
          <div class="jah-confirm-actions">
            <button
              type="button"
              class="jah-btn jah-btn--ghost"
              :disabled="deleting"
              @click="confirmingDelete = false"
            >
              Batal
            </button>
            <button
              type="button"
              class="jah-btn jah-btn--danger"
              :disabled="deleting"
              @click="deleteHistory"
            >
              {{ deleting ? "Menghapus…" : "Ya, Hapus Semua Riwayat" }}
            </button>
          </div>
        </div>

        <div v-if="loading" class="jah-state">Memuat riwayat…</div>
        <div v-else-if="error" class="jah-state jah-state--error">
          Gagal memuat riwayat: {{ error }}
        </div>
        <div v-else-if="!items.length" class="jah-state">
          Belum ada tindakan judge untuk kategori ini.
        </div>
        <ul v-else-if="!confirmingDelete" class="jah-list">
          <li v-for="item in items" :key="item._id" class="jah-item">
            <div class="jah-item-icon">
              <Icon icon="mdi:gavel" width="18" height="18" />
            </div>
            <div class="jah-item-main">
              <!-- Judge + Task — paling utama supaya operator langsung tau
                   SIAPA yang memberi penalty & TUGAS/posisinya apa, tanpa
                   perlu menebak dari teks aksi. -->
              <div class="jah-item-judge">
                <Icon icon="mdi:account-circle-outline" class="mr-1" />
                <span class="jah-judge-name">{{ item.judge || (item.from || "Juri tidak diketahui") }}</span>
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
                <span v-if="categoryLabelFor(item)">{{ categoryLabelFor(item) }}</span>
                <span v-if="item.teamName"> &middot; {{ item.teamName }}</span>
                <span v-if="item.bibTeam"> &middot; BIB {{ item.bibTeam }}</span>
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
    // Opsional — dinaikkan pemanggil (mis. HeadToHead.vue) tiap kali ada
    // tindakan judge baru masuk lewat socket, supaya "Riwayat Judge"
    // auto-refresh tanpa perlu operator tutup-buka modalnya manual. Sama
    // pola dgn refreshTick di FoulsReportModal.vue. Default 0 = tidak
    // dipakai, tidak mengubah perilaku pemanggil lama yang belum diwire.
    refreshTick: { type: Number, default: 0 },
  },
  data() {
    return {
      isOpen: false,
      loading: false,
      error: null,
      items: [],
      confirmingDelete: false,
      deleting: false,
    };
  },
  watch: {
    refreshTick() {
      this.fetchLogs();
    },
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
      this.confirmingDelete = false;
      this.fetchLogs();
    },
    deleteHistory() {
      if (typeof ipcRenderer === "undefined" || !this.eventId || this.deleting)
        return;
      this.deleting = true;

      ipcRenderer.removeAllListeners("judgeLog:deleteHistory:reply");
      ipcRenderer.send("judgeLog:deleteHistory", {
        eventId: this.eventId,
        raceCategory: this.raceCategory,
      });
      ipcRenderer.once("judgeLog:deleteHistory:reply", (_e, res) => {
        this.deleting = false;
        this.confirmingDelete = false;
        if (res && res.ok) {
          this.items = [];
          ipcRenderer.send("get-alert-saved", {
            type: "info",
            message: "Riwayat Judge dihapus",
            detail:
              "Riwayat (" +
              (res.deletedDetails || 0) +
              " entri) untuk kategori " +
              (this.categoryLabel || this.raceCategory) +
              " sudah dikosongkan.",
          });
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Gagal menghapus riwayat",
            detail: (res && res.error) || "unknown error",
          });
        }
      });
    },
    categoryLabelFor(item) {
      var parts = [item.initialName, item.divisionName, item.raceName].filter(
        Boolean
      );
      return parts.join(" - ");
    },
    // "Task" judge = item.type mentah dari sts-jurysystem (beda format per
    // kategori: Sprint "Start"/"Finish", H2H "PenaltyStart"/"BooyanCorner",
    // Slalom/DRR "start"/"gate"/"section", RX "PenaltyGate1"/"RaceTime") —
    // di-humanize jadi label yang enak dibaca ("Penalty Gate 1", "Booyan
    // Corner", dst) tanpa perlu tabel mapping per kategori.
    taskLabel(item) {
      var raw = item && item.type ? String(item.type) : "";
      if (!raw) return "";
      var spaced = raw
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([a-zA-Z])([0-9])/g, "$1 $2")
        .replace(/_/g, " ")
        .trim();
      return spaced.replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
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
.jah-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.jah-delete-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.jah-delete-trigger:hover {
  background: #fee2e2;
}
.jah-delete-trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.jah-confirm {
  padding: 14px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  border-radius: 10px;
  margin-bottom: 12px;
}
.jah-confirm-text {
  color: #7f1d1d;
  font-size: 13px;
  margin: 0 0 12px;
  line-height: 1.5;
}
.jah-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.jah-btn {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.jah-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.jah-btn--ghost {
  background: #fff;
  border-color: #cbd5e1;
  color: #334155;
}
.jah-btn--danger {
  background: #dc2626;
  color: #fff;
}
.jah-btn--danger:hover {
  background: #b91c1c;
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
.jah-item-judge {
  display: flex;
  align-items: center;
  gap: 4px;
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
.jah-item-time {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
}
</style>
