<template>
  <span class="ck-badge-wrap">
    <button type="button" class="ck-badge" :class="'ck-badge--' + state" :title="title + ' — klik untuk kalibrasi'" @click="showCalibration = true">
      <span class="ck-badge__dot"></span>
      <Icon icon="mdi:clock-outline" width="13" height="13" />
      {{ label }}
      <span v-if="detail" class="ck-badge__detail">{{ detail }}</span>
    </button>
    <ClockCalibration v-model="showCalibration" />
  </span>
</template>

<script>
// Badge kalibrasi jam RaceTime2 — SELALU tampil (tidak seperti LongrangeBadge
// yang hanya muncul bila Long Range Start dikonfigurasi, atau PhotofinishBadge
// yang hanya muncul bila STS Photo Finish dikonfigurasi). clockMain.js
// (lihat background.js) selalu aktif, jadi entry point kalibrasinya pun
// harus selalu ada — supaya event yang CUMA pakai Photo Finish (tanpa Long
// Range) tetap punya cara mengatur jam RaceTime2 secara manual.
import { getStatus, onStatus } from "@/services/clock";
import { Icon } from "@iconify/vue2";
import ClockCalibration from "./ClockCalibration.vue";

export default {
  name: "ClockBadge",
  components: { Icon, ClockCalibration },
  data() {
    return { status: {}, showCalibration: false };
  },
  computed: {
    state() {
      if (this.status.basis === "manual") return "manual";
      return this.status.heartbeatAvailable ? "connected" : "auto";
    },
    label() {
      if (this.status.basis === "manual") return "Jam RaceTime2 Manual";
      return this.status.heartbeatAvailable ? "Jam RaceTime2 Tersinkron" : "Jam RaceTime2 (Jam Laptop)";
    },
    detail() {
      return this.status.trimMs ? "trim " + (this.status.trimMs > 0 ? "+" : "") + this.status.trimMs + " ms" : "";
    },
    title() {
      const s = this.status;
      const parts = ["Kalibrasi jam RaceTime2 — dipakai Buffer-Timer-Start & disinkronkan ke STS Photo Finish."];
      parts.push(
        s.basis === "manual"
          ? "Basis waktu: kalibrasi manual."
          : s.basis === "racetime"
          ? "Basis waktu: heartbeat RaceTime2."
          : "Basis waktu: jam laptop (RaceTime2 belum mengirim heartbeat berwaktu)."
      );
      if (s.trimMs) parts.push("Trim " + s.trimMs + " ms.");
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
.ck-badge {
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
.ck-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.ck-badge__detail {
  font-weight: 500;
  opacity: 0.85;
}
.ck-badge__detail::before {
  content: "· ";
}
.ck-badge--connected {
  background: #e6f7ed;
  color: #1a7f4b;
}
.ck-badge--connected .ck-badge__dot {
  background: #22c55e;
}
.ck-badge--manual {
  background: #eef0fe;
  color: #4338ca;
}
.ck-badge--manual .ck-badge__dot {
  background: #6366f1;
}
.ck-badge--auto {
  background: #fdf1de;
  color: #b4630a;
}
.ck-badge--auto .ck-badge__dot {
  background: #f59e0b;
}
.ck-badge:hover {
  filter: brightness(0.96);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.06);
}
.ck-badge:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 116, 165, 0.35);
}
</style>
