<template>
  <span class="ost-wrap">
    <span
      class="unofficial-stamp"
      :class="{ 'official-stamp': isOfficial }"
      @click="$emit('toggle')"
      role="button"
      tabindex="0"
      title="Klik untuk toggle OFFICIAL/UNOFFICIAL"
      @keyup.enter="$emit('toggle')"
    >
      {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
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
        Waktu ditetapkannya status <strong>{{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}</strong>
        untuk kategori ini — ditampilkan di stempel PDF &amp; Live Result. Default otomatis
        mengikuti waktu saat status diklik; ubah di sini kalau perlu koreksi manual.
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
export default {
  name: "OfficialStampToggle",
  props: {
    isOfficial: { type: Boolean, default: false },
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
