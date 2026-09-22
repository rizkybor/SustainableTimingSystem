<template>
  <span class="ost-wrap">
    <span class="ost-stamp" :class="'ost-stamp--' + status">
      <select
        class="ost-select"
        :value="status"
        title="Pilih status result"
        @change="$emit('set-status', $event.target.value)"
      >
        <option value="provisional">PROVISIONAL</option>
        <option value="unofficial">UNOFFICIAL</option>
        <option value="official">OFFICIAL</option>
      </select>
    </span>

    <span v-if="formattedSetAt" class="ost-time">
      {{ formattedSetAt }}
      <button
        type="button"
        class="ost-edit-btn"
        title="Atur waktu manual (WIB)"
        @click.stop="openManualModal"
      >
        <Icon icon="mdi:pencil-outline" width="12" height="12" />
      </button>
    </span>
    <button
      v-else
      type="button"
      class="ost-set-time-btn"
      title="Atur waktu manual (WIB)"
      @click.stop="openManualModal"
    >
      <Icon icon="mdi:clock-plus-outline" width="12" height="12" class="mr-1" />
      Atur Waktu
    </button>

    <b-modal
      v-model="showModal"
      title="Atur Waktu Penetapan Status"
      hide-footer
      size="sm"
      centered
    >
      <p class="small text-muted mb-3">
        Waktu ditetapkannya status <strong>{{ statusLabel }}</strong>
        untuk kategori ini — ditampilkan di stempel PDF &amp; Live Result. Default otomatis
        mengikuti waktu saat status dipilih; ubah di sini kalau perlu koreksi manual.
      </p>
      <b-form-group label="Tanggal &amp; Waktu (WIB / Asia-Jakarta)">
        <b-form-input type="datetime-local" v-model="manualDateTime" />
      </b-form-group>
      <div class="d-flex justify-content-end" style="gap: 8px">
        <b-button variant="outline-secondary" size="sm" @click="showModal = false">
          Batal
        </b-button>
        <b-button variant="primary" size="sm" @click="confirmManual">
          Simpan Waktu
        </b-button>
      </div>
    </b-modal>
  </span>
</template>

<script>
import { RESULT_STATUS_LABELS } from "@/utils/officialStamp";

export default {
  name: "OfficialStampToggle",
  props: {
    // "provisional" | "unofficial" | "official"
    status: { type: String, default: "provisional" },
    // ISO string (UTC) atau null/kosong kalau belum pernah di-set.
    setAt: { type: String, default: "" },
  },
  data() {
    return {
      showModal: false,
      manualDateTime: "",
    };
  },
  computed: {
    statusLabel() {
      return RESULT_STATUS_LABELS[this.status] || RESULT_STATUS_LABELS.provisional;
    },
    formattedSetAt() {
      if (!this.setAt) return "";
      const d = new Date(this.setAt);
      if (isNaN(d.getTime())) return "";
      return (
        "Ditetapkan: " +
        d.toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " WIB"
      );
    },
  },
  methods: {
    // Buka modal, pre-fill input datetime-local dgn waktu SEKARANG (kalau
    // belum pernah di-set) atau waktu tersimpan saat ini — keduanya
    // dikonversi ke wall-clock WIB dgn cara geser epoch +7 jam lalu baca
    // komponen UTC-nya, supaya benar TERLEPAS dari timezone OS operator
    // (tidak butuh library timezone tambahan).
    openManualModal() {
      const base = this.setAt ? new Date(this.setAt) : new Date();
      const wib = new Date(base.getTime() + 7 * 3600000);
      const pad = (n) => String(n).padStart(2, "0");
      this.manualDateTime =
        wib.getUTCFullYear() +
        "-" +
        pad(wib.getUTCMonth() + 1) +
        "-" +
        pad(wib.getUTCDate()) +
        "T" +
        pad(wib.getUTCHours()) +
        ":" +
        pad(wib.getUTCMinutes());
      this.showModal = true;
    },
    confirmManual() {
      if (!this.manualDateTime) return;
      // Input datetime-local diperlakukan sbg wall-clock WIB (UTC+7,
      // Indonesia tidak kenal DST) — susun ISO string dgn offset eksplisit
      // "+07:00" supaya Date selalu diparse benar jadi instant UTC yang
      // tepat, terlepas dari timezone OS operator.
      const withSeconds =
        this.manualDateTime.length === 16
          ? this.manualDateTime + ":00"
          : this.manualDateTime;
      const d = new Date(withSeconds + "+07:00");
      if (isNaN(d.getTime())) return;
      this.$emit("set-manual", d.toISOString());
      this.showModal = false;
    },
  },
};
</script>

<style scoped>
.ost-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

/* Visual "cap/stempel" — dipindah ke sini (self-contained) dari style
   scoped tiap halaman Result, karena scoped CSS induk TIDAK PERNAH
   menjangkau elemen di dalam template komponen anak ini walau nama
   class-nya sama; stempel Official/Unofficial jadi tanpa warna/border
   sebelum fix ini. */
.ost-stamp {
  display: inline-flex;
  font-weight: bold;
  text-transform: uppercase;
  border: 2px solid #d9534f;
  border-radius: 4px;
  transform: rotate(5deg);
  opacity: 0.85;
}
.ost-stamp--provisional {
  border-color: #d97706;
  transform: rotate(3deg);
}
.ost-stamp--unofficial {
  border-color: #d9534f;
}
.ost-stamp--official {
  border-color: #148a3b;
  transform: rotate(0deg);
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(20, 138, 59, 0.12) inset;
}

.ost-select {
  appearance: none;
  -webkit-appearance: none;
  border: none;
  background: transparent;
  font: inherit;
  font-weight: bold;
  text-transform: uppercase;
  padding: 4px 22px 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%23999'/></svg>");
  background-repeat: no-repeat;
  background-position: right 8px center;
}
.ost-stamp--provisional .ost-select {
  color: #d97706;
}
.ost-stamp--unofficial .ost-select {
  color: #d9534f;
}
.ost-stamp--official .ost-select {
  color: #148a3b;
}

.ost-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
}
.ost-edit-btn,
.ost-set-time-btn {
  display: inline-flex;
  align-items: center;
  background: transparent;
  border: none;
  padding: 1px 4px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 6px;
}
.ost-edit-btn:hover,
.ost-set-time-btn:hover {
  background: #f1f5f9;
  color: #1c4c7a;
}
.ost-set-time-btn {
  font-size: 10.5px;
  font-weight: 600;
}
</style>
