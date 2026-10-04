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

    <b-modal
      v-model="isOpen"
      hide-header
      hide-footer
      size="lg"
      centered
      body-class="p-0"
      content-class="jh-content"
    >
      <div class="jh-head">
        <div class="jh-head__bg"></div>
        <button type="button" class="jh-close" aria-label="Close" @click="isOpen = false">
          <Icon icon="mdi:close" />
        </button>
        <div class="jh-head__inner">
          <span class="jh-head__icon"><Icon icon="mdi:history" /></span>
          <div>
            <span class="jh-eyebrow">Riwayat Judge</span>
            <h5 class="jh-title">{{ categoryLabel || raceCategory }}</h5>
          </div>
        </div>
        <div v-if="items.length" class="jh-summary">
          <span class="jh-summary__chip"><Icon icon="mdi:gavel" /> {{ items.length }} tindakan</span>
          <span class="jh-summary__chip"><Icon icon="mdi:account-group-outline" /> {{ judgeOptions.length - 1 }} juri</span>
        </div>
      </div>

      <div v-if="items.length && !loading && !error && !confirmingDelete" class="jh-toolbar">
        <div class="jh-filter">
          <label>Juri</label>
          <select v-model="filterJudge">
            <option v-for="o in judgeOptions" :key="o.value" :value="o.value">{{ o.text }}</option>
          </select>
        </div>
        <div class="jh-filter">
          <label>Task</label>
          <select v-model="filterTask">
            <option v-for="o in taskOptions" :key="o.value" :value="o.value">{{ o.text }}</option>
          </select>
        </div>
        <button
          type="button"
          class="jh-danger-btn"
          :disabled="deleting"
          @click="confirmingDelete = true"
        >
          <Icon icon="mdi:trash-can-outline" />
          Hapus Riwayat
        </button>
      </div>

      <div v-if="confirmingDelete" class="jh-confirm">
        <p class="jh-confirm__text">
          <Icon icon="mdi:alert-octagon-outline" />
          <span>
            Yakin ingin menghapus <strong>seluruh</strong> riwayat judge
            kategori <strong>{{ categoryLabel || raceCategory }}</strong>
            untuk event ini? Ini menghapus riwayat SEMUA juri (bukan cuma
            satu) dan tidak bisa dibatalkan.
          </span>
        </p>
        <div class="jh-confirm__actions">
          <button type="button" class="jh-btn jh-btn--ghost" :disabled="deleting" @click="confirmingDelete = false">
            Batal
          </button>
          <button type="button" class="jh-btn jh-btn--danger" :disabled="deleting" @click="deleteHistory">
            {{ deleting ? "Menghapus…" : "Ya, Hapus Semua Riwayat" }}
          </button>
        </div>
      </div>

      <div class="jh-body">
        <div v-if="loading" class="jh-state">
          <b-spinner small /> Memuat riwayat…
        </div>
        <div v-else-if="error" class="jh-state jh-state--error">
          <Icon icon="mdi:alert-circle-outline" />
          Gagal memuat riwayat: {{ error }}
        </div>
        <div v-else-if="!items.length" class="jh-state">
          <Icon icon="mdi:clipboard-text-off-outline" />
          Belum ada tindakan judge untuk kategori ini.
        </div>
        <div v-else-if="!filteredItems.length && !confirmingDelete" class="jh-state">
          <Icon icon="mdi:filter-off-outline" />
          Tidak ada tindakan yang cocok dengan filter ini.
        </div>
        <template v-else-if="!confirmingDelete">
          <div v-for="g in groupedItems" :key="g.key">
            <div class="jh-day">{{ g.label }}</div>
            <ul class="jh-list">
              <li v-for="item in g.items" :key="item._id" class="jh-item">
                <span class="jh-item__dot"><Icon icon="mdi:gavel" /></span>
                <div class="jh-item__main">
                  <!-- Judge + Task paling utama: SIAPA yg memberi penalty
                       & TUGAS/posisinya apa. -->
                  <div class="jh-item__top">
                    <span class="jh-judge">
                      <Icon icon="mdi:account-circle-outline" />
                      {{ item.judge || item.from || "Juri tidak diketahui" }}
                    </span>
                    <span v-if="taskLabel(item)" class="jh-badge jh-badge--task">{{ taskLabel(item) }}</span>
                    <span
                      v-if="item.value !== null && item.value !== undefined"
                      class="jh-pill"
                      :class="'jh-pill--' + penaltyTone(item.value)"
                    >
                      Penalty {{ item.value }}
                    </span>
                  </div>
                  <div class="jh-item__text">{{ item.text || item.type }}</div>
                  <div class="jh-item__meta">
                    <span v-if="categoryLabelFor(item)">{{ categoryLabelFor(item) }}</span>
                    <span v-if="item.teamName"> &middot; {{ item.teamName }}</span>
                    <span v-if="item.bibTeam"> &middot; BIB {{ item.bibTeam }}</span>
                  </div>
                </div>
                <time class="jh-item__time">{{ formatTime(item.receivedAt) }}</time>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </b-modal>
  </span>
</template>

<script>
import { ipcRenderer } from "electron";
import { groupByDay, penaltyTone } from "@/utils/judgeHistoryView";

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
      filterJudge: "",
      filterTask: "",
    };
  },
  watch: {
    refreshTick() {
      this.fetchLogs();
    },
  },
  computed: {
    judgeName() {
      return (item) => item.judge || item.from || "Juri tidak diketahui";
    },
    // Opsi filter Juri / Task — cuma yg benar2 ada di log, + hitungan.
    judgeOptions() {
      const counts = {};
      this.items.forEach((it) => {
        const j = this.judgeName(it);
        counts[j] = (counts[j] || 0) + 1;
      });
      const opts = Object.keys(counts)
        .sort((a, b) => a.localeCompare(b))
        .map((j) => ({ value: j, text: j + " (" + counts[j] + ")" }));
      opts.unshift({ value: "", text: "Semua Juri (" + this.items.length + ")" });
      return opts;
    },
    taskOptions() {
      const counts = {};
      this.items.forEach((it) => {
        const t = String(it.type || "");
        counts[t] = (counts[t] || 0) + 1;
      });
      const opts = Object.keys(counts)
        .map((t) => ({
          value: t,
          text: (this.taskLabel({ type: t }) || "(tanpa task)") + " (" + counts[t] + ")",
        }))
        .sort((a, b) => a.text.localeCompare(b.text));
      opts.unshift({ value: "", text: "Semua Task (" + this.items.length + ")" });
      return opts;
    },
    filteredItems() {
      return this.items.filter((it) => {
        if (this.filterJudge && this.judgeName(it) !== this.filterJudge) return false;
        if (this.filterTask && String(it.type || "") !== this.filterTask) return false;
        return true;
      });
    },
    groupedItems() {
      return groupByDay(this.filteredItems);
    },
    modalTitle() {
      var label = this.categoryLabel || this.raceCategory;
      return "Riwayat Judge — " + label;
    },
  },
  methods: {
    penaltyTone,
    open() {
      this.isOpen = true;
      this.confirmingDelete = false;
      this.filterJudge = "";
      this.filterTask = "";
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
/* Isi modal: assets/styles/judge-history-modal.css (global, krn b-modal
   dirender di <body>). Di toolbar race, tombol ini juga distyle ulang oleh
   race-category-toolbar.css. */
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
</style>
