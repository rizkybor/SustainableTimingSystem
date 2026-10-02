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
        :title="'Atur waktu manual (' + tz + ')'"
        @click.stop="openManualModal"
      >
        <Icon icon="mdi:pencil-outline" width="12" height="12" />
      </button>
    </span>
    <button
      v-else
      type="button"
      class="ost-set-time-btn"
      :title="'Atur waktu manual (' + tz + ')'"
      @click.stop="openManualModal"
    >
      <Icon icon="mdi:clock-plus-outline" width="13" height="13" />
      <span>Atur Waktu</span>
    </button>

    <b-modal
      v-model="showModal"
      hide-header
      hide-footer
      centered
      size="md"
      body-class="ost-modal-body"
      content-class="ost-modal-content"
    >
      <button
        type="button"
        class="ost-modal-close"
        aria-label="Tutup"
        @click="showModal = false"
      >
        <Icon icon="mdi:close" width="16" height="16" />
      </button>

      <div class="ost-modal-icon" :class="'ost-modal-icon--' + status">
        <Icon icon="mdi:clock-edit-outline" width="22" height="22" />
      </div>

      <h3 class="ost-modal-title">Atur Waktu Penetapan Status</h3>
      <p class="ost-modal-desc">
        Waktu ditetapkannya status
        <span class="ost-modal-badge" :class="'ost-modal-badge--' + status">{{
          statusLabel
        }}</span>
        untuk kategori ini — ditampilkan di stempel PDF &amp; Live Result.
        Default otomatis mengikuti waktu saat status dipilih; ubah di sini
        kalau perlu koreksi manual.
      </p>

      <div class="ost-field">
        <label class="ost-field-label">Zona Waktu</label>
        <b-form-radio-group
          v-model="manualTz"
          :options="TZ_OPTIONS"
          button-variant="outline-primary"
          buttons
          size="sm"
          class="ost-tz-group"
        />
      </div>

      <div class="ost-field">
        <label class="ost-field-label">
          Tanggal &amp; Waktu
          <span class="ost-field-label-hint">({{ manualTz }})</span>
        </label>
        <div class="ost-datetime-wrap">
          <Icon
            icon="mdi:calendar-clock-outline"
            width="16"
            height="16"
            class="ost-datetime-icon"
          />
          <b-form-input
            type="datetime-local"
            v-model="manualDateTime"
            class="ost-datetime-input"
          />
        </div>
      </div>

      <div class="ost-modal-actions">
        <button
          type="button"
          class="ost-btn ost-btn--ghost"
          @click="showModal = false"
        >
          Batal
        </button>
        <button
          type="button"
          class="ost-btn ost-btn--primary"
          @click="confirmManual"
        >
          <Icon icon="mdi:content-save-outline" width="15" height="15" />
          <span>Simpan Waktu</span>
        </button>
      </div>
    </b-modal>
  </span>
</template>

<script>
import { RESULT_STATUS_LABELS } from "@/utils/officialStamp";

// BUG FIX (2026-09-25): modal "Atur Waktu Penetapan Status" sebelumnya
// HARDCODE WIB (Asia/Jakarta, UTC+7) — event di luar Jawa/Sumatra (WITA/
// WIT) terpaksa menghitung manual selisih jam sendiri sebelum input.
// Offset tetap (bukan lookup timezone library) krn Indonesia TIDAK
// kenal DST — WIB/WITA/WIT masing2 selalu +7/+8/+9 sepanjang tahun.
const TZ_OFFSET_HOURS = { WIB: 7, WITA: 8, WIT: 9 };
const TZ_OPTIONS = ["WIB", "WITA", "WIT"];

export default {
  name: "OfficialStampToggle",
  props: {
    // "provisional" | "unofficial" | "official"
    status: { type: String, default: "provisional" },
    // ISO string (UTC) atau null/kosong kalau belum pernah di-set.
    setAt: { type: String, default: "" },
    // BUG FIX (2026-09-28): dulu badge waktu di sini SELALU ditampilkan
    // sbg WIB terlepas dari zona sebenarnya event ini (Event Settings ->
    // resultTimezone). Sekarang parent (tiap *Result.vue) mengoper zona
    // event via prop ini, dipakai buat format tampilan DAN sbg default
    // pilihan saat modal "Atur Waktu Manual" dibuka.
    tz: { type: String, default: "WIB" },
  },
  data() {
    return {
      showModal: false,
      manualDateTime: "",
      // Default WIB — SAMA PERSIS dgn perilaku lama sebelum fix ini utk
      // operator yang tidak menyentuh pilihan zona sama sekali (zero
      // impact kalau tidak dipakai).
      manualTz: "WIB",
      TZ_OPTIONS,
    };
  },
  watch: {
    // Operator ganti pilihan zona di tengah pengisian — hitung ulang
    // instant dari nilai yang SEDANG diketik di zona LAMA (`oldTz`, dari
    // Vue watcher, bukan asumsi urutan event), lalu tampilkan ulang di
    // zona BARU, supaya waktu absolut yang dimaksud TIDAK berubah cuma
    // krn ganti pilihan zona (bukan reset ke waktu sekarang lagi).
    manualTz(newTz, oldTz) {
      if (!this.manualDateTime) return;
      const withSeconds =
        this.manualDateTime.length === 16
          ? this.manualDateTime + ":00"
          : this.manualDateTime;
      const prevOffsetMs = (TZ_OFFSET_HOURS[oldTz] || 7) * 3600000;
      const asUtcGuess = new Date(withSeconds + "Z");
      if (isNaN(asUtcGuess.getTime())) return;
      const instant = new Date(asUtcGuess.getTime() - prevOffsetMs);
      this.manualDateTime = this.formatForTz(instant, newTz);
    },
  },
  computed: {
    statusLabel() {
      return RESULT_STATUS_LABELS[this.status] || RESULT_STATUS_LABELS.provisional;
    },
    formattedSetAt() {
      if (!this.setAt) return "";
      const d = new Date(this.setAt);
      if (isNaN(d.getTime())) return "";
      const zone = TZ_OFFSET_HOURS[this.tz] ? this.tz : "WIB";
      const ianaZone =
        zone === "WITA"
          ? "Asia/Makassar"
          : zone === "WIT"
          ? "Asia/Jayapura"
          : "Asia/Jakarta";
      return (
        "Ditetapkan: " +
        d.toLocaleString("id-ID", {
          timeZone: ianaZone,
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " " +
        zone
      );
    },
  },
  methods: {
    // Format instant (Date) jadi wall-clock string "YYYY-MM-DDTHH:mm" utk
    // input datetime-local, pada zona `tz` — geser epoch sesuai offset
    // tetap zona itu lalu baca komponen UTC-nya, supaya benar TERLEPAS
    // dari timezone OS operator (tidak butuh library timezone tambahan).
    formatForTz(date, tz) {
      const offsetMs = (TZ_OFFSET_HOURS[tz] || 7) * 3600000;
      const shifted = new Date(date.getTime() + offsetMs);
      const pad = (n) => String(n).padStart(2, "0");
      return (
        shifted.getUTCFullYear() +
        "-" +
        pad(shifted.getUTCMonth() + 1) +
        "-" +
        pad(shifted.getUTCDate()) +
        "T" +
        pad(shifted.getUTCHours()) +
        ":" +
        pad(shifted.getUTCMinutes())
      );
    },
    // Buka modal, pre-fill input datetime-local dgn waktu SEKARANG (kalau
    // belum pernah di-set) atau waktu tersimpan saat ini, pada zona yang
    // sedang dipilih (default WIB — sama persis perilaku lama).
    openManualModal() {
      this.manualTz = TZ_OFFSET_HOURS[this.tz] ? this.tz : "WIB";
      const base = this.setAt ? new Date(this.setAt) : new Date();
      this.manualDateTime = this.formatForTz(base, this.manualTz);
      this.showModal = true;
    },
    confirmManual() {
      if (!this.manualDateTime) return;
      // Input datetime-local diperlakukan sbg wall-clock pada zona yang
      // dipilih (WIB/WITA/WIT — Indonesia tidak kenal DST, jadi offset
      // tetap) — susun ISO string dgn offset eksplisit supaya Date selalu
      // diparse benar jadi instant UTC yang tepat, terlepas dari timezone
      // OS operator.
      const withSeconds =
        this.manualDateTime.length === 16
          ? this.manualDateTime + ":00"
          : this.manualDateTime;
      const offset = TZ_OFFSET_HOURS[this.manualTz] || 7;
      const offsetStr = "+" + String(offset).padStart(2, "0") + ":00";
      const d = new Date(withSeconds + offsetStr);
      if (isNaN(d.getTime())) return;
      // BUG FIX (2026-10-02): sebelumnya cuma emit ISO instant-nya saja —
      // `manualTz` yang dipilih operator di modal ini (WIB/WITA/WIT)
      // dibuang begitu saja setelah dipakai utk MENGHITUNG instant-nya,
      // tidak pernah diteruskan ke parent. Akibatnya label "Ditetapkan"
      // di sebelah ikon pensil & stempel PDF tetap memakai zona LAMA
      // (eventInfo.resultTimezone dari Event Settings) walau operator
      // baru saja ganti zona + klik "Simpan Waktu" di sini — perubahan
      // zonanya kelihatan HILANG. Sertakan `tz` supaya parent bisa ikut
      // menyimpan zona baru ini sbg zona result event (lihat
      // setOfficialManualTime() di tiap *Result.vue).
      this.$emit("set-manual", { iso: d.toISOString(), tz: this.manualTz });
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
.ost-edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 2px;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s ease, color 0.15s ease;
}
.ost-edit-btn:hover {
  background: #f1f5f9;
  color: #1c4c7a;
}

.ost-set-time-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 3px 9px;
  color: #475569;
  cursor: pointer;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.ost-set-time-btn:hover {
  background: #eef6ff;
  border-color: #bfdbfe;
  color: #1c4c7a;
}

/* ===================== Modal "Atur Waktu Penetapan Status" ===================== */
:deep(.ost-modal-content) {
  border: none;
  border-radius: 18px;
  box-shadow: 0 24px 60px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}
:deep(.ost-modal-body) {
  padding: 28px 26px 22px;
  position: relative;
}

.ost-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.ost-modal-close:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.ost-modal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #eef6ff;
  color: #2f6ea5;
  margin-bottom: 14px;
}
.ost-modal-icon--provisional {
  background: #fef3e2;
  color: #b45309;
}
.ost-modal-icon--unofficial {
  background: #fdecec;
  color: #c0392b;
}
.ost-modal-icon--official {
  background: #e7f7ee;
  color: #148a3b;
}

.ost-modal-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.ost-modal-desc {
  font-size: 12.5px;
  line-height: 1.55;
  color: #64748b;
  margin: 0 0 20px;
}

.ost-modal-badge {
  display: inline-block;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.02em;
  padding: 1px 7px;
  border-radius: 5px;
  color: #1e293b;
  background: #eef2f7;
}
.ost-modal-badge--provisional {
  color: #b45309;
  background: #fef3e2;
}
.ost-modal-badge--unofficial {
  color: #c0392b;
  background: #fdecec;
}
.ost-modal-badge--official {
  color: #148a3b;
  background: #e7f7ee;
}

.ost-field {
  margin-bottom: 18px;
}
.ost-field-label {
  display: block;
  font-size: 11.5px;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}
.ost-field-label-hint {
  font-weight: 600;
  color: #94a3b8;
  text-transform: none;
  letter-spacing: 0;
}

/* Bootstrap .btn-group merapatkan tombol jadi satu blok nyambung (margin-
   left negatif + border-radius cuma di ujung kiri/kanan) — gap saja tidak
   cukup krn keduanya "berebut" jarak antar tombol. Lepas semua perilaku
   nyambung itu supaya WIB/WITA/WIT tampil sbg 3 pill terpisah dgn jarak
   yg jelas. */
.ost-tz-group :deep(.btn-group) {
  display: flex;
  gap: 8px;
}
.ost-tz-group :deep(.btn) {
  border-radius: 8px !important;
  font-weight: 700;
  font-size: 12px;
  margin-left: 0 !important;
}

.ost-datetime-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.ost-datetime-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}
:deep(.ost-datetime-input) {
  padding-left: 36px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid #dde3ec;
  font-weight: 600;
  color: #1e293b;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
:deep(.ost-datetime-input:focus) {
  border-color: #2f6ea5;
  box-shadow: 0 0 0 3px rgba(47, 110, 165, 0.12);
}

.ost-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.ost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
}
.ost-btn:active {
  transform: translateY(1px);
}
.ost-btn--ghost {
  background: #fff;
  border: 1px solid #dde3ec;
  color: #475569;
}
.ost-btn--ghost:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
.ost-btn--primary {
  background: linear-gradient(135deg, #3aa3ec, #1c6fb0);
  border: 1px solid #1c6fb0;
  color: #fff;
  box-shadow: 0 6px 16px -4px rgba(28, 111, 176, 0.45);
}
.ost-btn--primary:hover {
  background: linear-gradient(135deg, #46addb, #2178bb);
  box-shadow: 0 8px 20px -4px rgba(28, 111, 176, 0.55);
}
</style>
