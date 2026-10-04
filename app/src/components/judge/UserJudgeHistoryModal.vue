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
            <h5 class="jh-title">{{ username || "-" }}</h5>
          </div>
        </div>
        <div v-if="items.length" class="jh-summary">
          <span class="jh-summary__chip"><Icon icon="mdi:gavel" /> {{ items.length }} tindakan</span>
          <span class="jh-summary__chip"><Icon icon="mdi:calendar-multiple" /> {{ eventOptions.length - 1 }} event</span>
        </div>
      </div>

      <div v-if="items.length && !loading && !error" class="jh-toolbar">
        <div class="jh-filter">
          <label>Event</label>
          <select v-model="filterEventId">
            <option v-for="o in eventOptions" :key="o.value" :value="o.value">{{ o.text }}</option>
          </select>
        </div>
        <div class="jh-filter">
          <label>Task</label>
          <select v-model="filterTask">
            <option v-for="o in taskOptions" :key="o.value" :value="o.value">{{ o.text }}</option>
          </select>
        </div>
        <span class="jh-count">
          <strong>{{ filteredItems.length }}</strong> / {{ items.length }} tindakan
        </span>
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
          Juri ini belum punya tindakan apa pun yang tercatat.
        </div>
        <div v-else-if="!filteredItems.length" class="jh-state">
          <Icon icon="mdi:filter-off-outline" />
          Tidak ada tindakan yang cocok dengan filter ini.
        </div>
        <template v-else>
          <div v-for="g in groupedItems" :key="g.key">
            <div class="jh-day">{{ g.label }}</div>
            <ul class="jh-list">
              <li v-for="item in g.items" :key="item._id" class="jh-item">
                <span class="jh-item__dot"><Icon icon="mdi:gavel" /></span>
                <div class="jh-item__main">
                  <div class="jh-item__top">
                    <span class="jh-badge jh-badge--event" :title="eventName(item.eventId)">{{ eventName(item.eventId) }}</span>
                    <span class="jh-badge jh-badge--category">{{ (item.raceCategory || "-").toUpperCase() }}</span>
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
                <time class="jh-item__time">{{ formatClock(item.receivedAt) }}</time>
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
import { Icon } from "@iconify/vue2";
import { groupByDay, penaltyTone, formatClock } from "@/utils/judgeHistoryView";

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
    groupedItems() {
      return groupByDay(this.filteredItems);
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
    penaltyTone,
    formatClock,
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
/* Isi modal: assets/styles/judge-history-modal.css (global, krn b-modal
   dirender di <body>). Tombol pemicunya distyle oleh halaman pemakai. */
.ujh-wrapper {
  display: inline-flex;
}
</style>
