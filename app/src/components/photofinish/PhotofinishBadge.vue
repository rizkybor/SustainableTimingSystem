<template>
  <span v-if="status.enabled" class="pf-badge-wrap">
    <button type="button" class="pf-badge" :class="'pf-badge--' + state" :title="title + ' — klik untuk melihat hasil kiriman'" @click="showResults = true">
      <span class="pf-badge__dot"></span>
      <Icon icon="mdi:camera-burst" width="13" height="13" />
      {{ label }}
      <span v-if="queueLabel" class="pf-badge__queue">{{ queueLabel }}</span>
    </button>
    <PhotofinishResults v-model="showResults" />
  </span>
</template>

<script>
// Redesign (2026-10-02): disamakan gaya pill+dot dgn ConnectionStatusBadge.vue
// (indikator realtime juri) supaya semua badge status koneksi di toolbar
// race-entry konsisten satu bahasa visual — bukan lagi <span class="badge">
// Bootstrap polos. Tambah state "syncing" (kuning, dot berkedip) saat
// TERHUBUNG tapi masih ada sinyal/hasil yg belum selesai diproses, supaya
// operator bisa bedakan "aktif & bersih" vs "aktif tapi masih memproses"
// tanpa harus baca angka antreannya dulu.
import { getStatus, onStatus } from "@/services/photofinish";
import { Icon } from "@iconify/vue2";
import PhotofinishResults from "./PhotofinishResults.vue";

export default {
  name: "PhotofinishBadge",
  components: { Icon, PhotofinishResults },
  data() {
    return { status: { enabled: false, connected: false, outbox: 0, pending: 0, lastError: null }, showResults: false };
  },
  computed: {
    hasQueue() {
      return !!(this.status.outbox || this.status.pending);
    },
    state() {
      if (!this.status.connected) return "disconnected";
      return this.hasQueue ? "syncing" : "connected";
    },
    label() {
      if (!this.status.connected) return "Photo Finish Terputus";
      return this.hasQueue ? "Photo Finish Menyinkronkan…" : "Photo Finish Terhubung";
    },
    queueLabel() {
      const parts = [];
      if (this.status.outbox) parts.push(this.status.outbox + " sinyal antre");
      if (this.status.pending) parts.push(this.status.pending + " hasil menunggu");
      return parts.join(" · ");
    },
    title() {
      if (this.status.lastError) return this.status.lastError;
      return "Sinyal finish RaceTime2 dikirim ke STS Photo Finish; hasil juri diterapkan otomatis.";
    },
  },
  async mounted() {
    this.status = await getStatus();
    this._off = onStatus((st) => {
      this.status = st;
    });
  },
  beforeDestroy() {
    if (this._off) this._off();
  },
};
</script>

<style scoped>
.pf-badge {
  border: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
.pf-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.pf-badge__queue {
  font-weight: 500;
  opacity: 0.85;
}
.pf-badge__queue::before {
  content: "· ";
}
.pf-badge--connected {
  background: #e6f7ed;
  color: #1a7f4b;
}
.pf-badge--connected .pf-badge__dot {
  background: #22c55e;
}
.pf-badge--syncing {
  background: #fdf1de;
  color: #b4630a;
}
.pf-badge--syncing .pf-badge__dot {
  background: #f59e0b;
  animation: pf-badge-pulse 1s infinite;
}
.pf-badge--disconnected {
  background: #fde7ec;
  color: #b91c3c;
}
.pf-badge--disconnected .pf-badge__dot {
  background: #ef4444;
}
.pf-badge:hover {
  filter: brightness(0.96);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.06);
}
.pf-badge:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 116, 165, 0.35);
}
@keyframes pf-badge-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
</style>
