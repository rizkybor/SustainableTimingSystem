<template>
  <span v-if="status.enabled" class="lr-badge-wrap">
    <button type="button" class="lr-badge" :class="'lr-badge--' + state" :title="title + ' — klik untuk kalibrasi'" @click="showCalibration = true">
      <span class="lr-badge__dot"></span>
      <Icon icon="mdi:flag-checkered" width="13" height="13" />
      {{ label }}
      <span v-if="detail" class="lr-badge__detail">{{ detail }}</span>
    </button>
    <LongrangeCalibration v-model="showCalibration" />
  </span>
</template>

<script>
// Status koneksi STS Long Range Start (pistol PS-77 di garis start jauh) —
// gaya pill+dot sama dengan PhotofinishBadge / ConnectionStatusBadge.
import { getStatus, onStatus } from "@/services/longrange";
import { Icon } from "@iconify/vue2";
import LongrangeCalibration from "./LongrangeCalibration.vue";

export default {
  name: "LongrangeBadge",
  components: { Icon, LongrangeCalibration },
  data() {
    return { status: { enabled: false, connected: false }, showCalibration: false };
  },
  computed: {
    state() {
      if (!this.status.connected) return "disconnected";
      return this.status.clockSynced ? "connected" : "syncing";
    },
    label() {
      if (!this.status.connected) return "Long Range Start Terputus";
      return this.status.clockSynced ? "Long Range Start Terhubung" : "Long Range Start Sinkron Jam…";
    },
    detail() {
      if (!this.status.connected || !this.status.clockSynced) return "";
      const basis = { manual: "kalibrasi manual", racetime: "jam RaceTime2", laptop: "jam laptop" }[this.status.basis] || "";
      return this.status.trimMs ? basis + " " + (this.status.trimMs > 0 ? "+" : "") + this.status.trimMs + " ms" : basis;
    },
    title() {
      if (this.status.lastError) return this.status.lastError;
      const s = this.status;
      const parts = ["Start dari pistol PS-77 di garis start masuk ke Buffer-Timer-Start."];
      if (s.clockSynced) parts.push("Jam server: RTT " + Math.round(s.rttMs) + " ms (±" + Math.ceil(s.rttMs / 2) + " ms).");
      parts.push(
        s.basis === "manual"
          ? "Basis waktu: kalibrasi manual."
          : s.basis === "racetime"
          ? "Basis waktu: heartbeat RaceTime2."
          : "Basis waktu: jam laptop (RaceTime2 tidak mengirim heartbeat berwaktu) — kalibrasi bila jam RaceTime2 berbeda."
      );
      if (s.trimMs) parts.push("Trim " + s.trimMs + " ms.");
      if (s.lastStart) parts.push("Terakhir: " + s.lastStart.kind + " " + s.lastStart.time + ".");
      return parts.join(" ");
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
.lr-badge {
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
.lr-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.lr-badge__detail {
  font-weight: 500;
  opacity: 0.85;
}
.lr-badge__detail::before {
  content: "· ";
}
.lr-badge--connected {
  background: #e6f7ed;
  color: #1a7f4b;
}
.lr-badge--connected .lr-badge__dot {
  background: #22c55e;
}
.lr-badge--syncing {
  background: #fdf1de;
  color: #b4630a;
}
.lr-badge--syncing .lr-badge__dot {
  background: #f59e0b;
  animation: lr-badge-pulse 1s infinite;
}
.lr-badge--disconnected {
  background: #fde7ec;
  color: #b91c3c;
}
.lr-badge--disconnected .lr-badge__dot {
  background: #ef4444;
}
.lr-badge:hover {
  filter: brightness(0.96);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.06);
}
.lr-badge:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 116, 165, 0.35);
}
@keyframes lr-badge-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
</style>
