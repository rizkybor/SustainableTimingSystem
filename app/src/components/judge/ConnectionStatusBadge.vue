<template>
  <span class="csb" :class="'csb--' + connectionState.status" :title="tooltip">
    <span class="csb__dot"></span>
    {{ label }}
  </span>
</template>

<script>
// Indikator status koneksi realtime (socket ke broker yang menghubungkan
// sts-timingsystem <-> sts-jurysystem) — dipasang di toolbar tiap kategori
// race-entry (Sprint/H2H/Slalom/DRR/RX) supaya operator TAHU kapan channel
// live penalty juri sedang terputus, bukan cuma diam tanpa indikasi.
import { connectionState } from "@/services/socket";

export default {
  name: "ConnectionStatusBadge",
  data() {
    return { connectionState };
  },
  computed: {
    label() {
      const map = {
        connected: "Realtime Terhubung",
        connecting: "Menghubungkan…",
        reconnecting: "Menyambung Ulang…",
        disconnected: "Realtime Terputus",
      };
      return map[this.connectionState.status] || "Status Tidak Diketahui";
    },
    tooltip() {
      if (this.connectionState.status === "disconnected") {
        return (
          "Koneksi realtime ke sts-jurysystem terputus — penalty juri yang " +
          "dikirim saat ini TIDAK akan langsung muncul. Akan otomatis " +
          "tersinkron begitu koneksi tersambung kembali."
        );
      }
      if (this.connectionState.status === "reconnecting") {
        return "Sedang mencoba menyambung ulang ke server realtime…";
      }
      return "Channel realtime ke sts-jurysystem aktif.";
    },
  },
};
</script>

<style scoped>
.csb {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
.csb__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.csb--connected {
  background: #e6f7ed;
  color: #1a7f4b;
}
.csb--connected .csb__dot {
  background: #22c55e;
}
.csb--connecting {
  background: #eef0fe;
  color: #4338ca;
}
.csb--connecting .csb__dot {
  background: #6366f1;
  animation: csb-pulse 1s infinite;
}
.csb--reconnecting {
  background: #fdf1de;
  color: #b4630a;
}
.csb--reconnecting .csb__dot {
  background: #f59e0b;
  animation: csb-pulse 1s infinite;
}
.csb--disconnected {
  background: #fde7ec;
  color: #b91c3c;
}
.csb--disconnected .csb__dot {
  background: #ef4444;
}
@keyframes csb-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
</style>
