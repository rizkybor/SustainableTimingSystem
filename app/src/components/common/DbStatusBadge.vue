<template>
  <span class="dbs" :class="'dbs--' + tone" :title="tooltip" role="status" aria-live="polite">
    <span class="dbs__dot"></span>
    {{ label }}
    <button
      v-if="showRetry"
      type="button"
      class="dbs__retry"
      :disabled="retrying"
      @click="retryNow"
    >
      {{ retrying ? "Mencoba…" : "Coba sekarang" }}
    </button>
  </span>
</template>

<script>
// Indikator koneksi DATABASE (MongoDB Atlas) + jumlah perubahan yang masih
// menunggu tersimpan — pasangan ConnectionStatusBadge (yang cuma melihat
// koneksi realtime ke juri). Data dari main process: services/dbHealth.js
// (ping berkala) + antrean ulang-coba writeRetry di ipcMainServices.js.
import { ipcRenderer } from "electron";
import { ipcRequest } from "@/utils/ipcRequest";

export default {
  name: "DbStatusBadge",
  data() {
    return {
      online: null,
      pending: 0,
      lastOkAt: null,
      lastError: "",
      retrying: false,
    };
  },
  computed: {
    tone() {
      if (this.online === false) return "offline";
      if (this.pending > 0) return "syncing";
      if (this.online === true) return "ok";
      return "unknown";
    },
    label() {
      if (this.online === false) {
        return this.pending > 0
          ? `Database terputus · ${this.pending} perubahan menunggu`
          : "Database terputus";
      }
      if (this.pending > 0) return `Menyinkronkan ${this.pending} perubahan…`;
      if (this.online === true) return "Database OK";
      return "Memeriksa database…";
    },
    showRetry() {
      return this.online === false || this.pending > 0;
    },
    tooltip() {
      if (this.online === false) {
        return (
          "Koneksi ke database terputus. Start/Finish, Live Result, dan " +
          "bracket yang diubah tetap disimpan ulang OTOMATIS begitu koneksi " +
          "pulih — JANGAN tutup aplikasi selama masih ada perubahan menunggu." +
          (this.lastError ? `\n\nDetail: ${this.lastError}` : "")
        );
      }
      if (this.pending > 0) {
        return "Koneksi tersedia — perubahan yang tertunda sedang disimpan ulang.";
      }
      if (this.online === true && this.lastOkAt) {
        return `Terhubung ke database (cek terakhir ${new Date(this.lastOkAt).toLocaleTimeString("id-ID")}).`;
      }
      return "";
    },
  },
  created() {
    this._onStatus = (_e, st) => this.apply(st);
    if (typeof ipcRenderer !== "undefined") {
      ipcRenderer.on("db-status", this._onStatus);
      ipcRequest("db-status:get", {}, { timeoutMs: 5000 }).then((st) => st && this.apply(st));
    }
  },
  beforeDestroy() {
    if (typeof ipcRenderer !== "undefined" && this._onStatus) {
      ipcRenderer.removeListener("db-status", this._onStatus);
    }
  },
  methods: {
    apply(st) {
      if (!st || typeof st !== "object") return;
      this.online = st.online;
      this.pending = Number(st.pending) || 0;
      this.lastOkAt = st.lastOkAt || null;
      this.lastError = st.lastError || "";
    },
    async retryNow() {
      this.retrying = true;
      try {
        await ipcRequest("db-status:retry-now", {}, { timeoutMs: 5000 });
      } finally {
        // beri waktu ping/ulang-coba berjalan sebelum tombol aktif lagi
        setTimeout(() => (this.retrying = false), 1500);
      }
    },
  },
};
</script>

<style scoped>
.dbs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
.dbs__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.dbs--ok {
  background: #e6f7ed;
  color: #1a7f4b;
}
.dbs--ok .dbs__dot {
  background: #22c55e;
}
.dbs--unknown {
  background: #f1f5f9;
  color: #64748b;
}
.dbs--unknown .dbs__dot {
  background: #94a3b8;
}
.dbs--syncing {
  background: #e8f1fd;
  color: #1d4ed8;
}
.dbs--syncing .dbs__dot {
  background: #3b82f6;
  animation: dbs-pulse 1s infinite;
}
.dbs--offline {
  background: #fde7ec;
  color: #b91c3c;
}
.dbs--offline .dbs__dot {
  background: #ef4444;
  animation: dbs-pulse 1s infinite;
}
.dbs__retry {
  margin-left: 2px;
  border: 1px solid currentColor;
  background: #ffffff;
  color: inherit;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 999px;
  cursor: pointer;
}
.dbs__retry:disabled {
  opacity: 0.6;
  cursor: default;
}
@keyframes dbs-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dbs__dot {
    animation: none !important;
  }
}
</style>
