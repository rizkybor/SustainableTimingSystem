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
      body-class="p-0"
      content-class="ost-content"
    >
      <!-- Header (warna mengikuti status) -->
      <div class="ost-head" :class="'ost-head--' + status">
        <button
          type="button"
          class="ost-head__close"
          aria-label="Tutup"
          @click="showModal = false"
        >
          <Icon icon="mdi:close" width="18" height="18" />
        </button>
        <span class="ost-head__icon">
          <Icon icon="mdi:clock-edit-outline" width="24" height="24" />
        </span>
        <div class="ost-head__text">
          <span class="ost-head__eyebrow">Penetapan Status</span>
          <h3 class="ost-head__title">Atur Waktu Penetapan Status</h3>
          <span class="ost-head__status">
            <span class="ost-head__dot"></span>
            {{ statusLabel }}
          </span>
        </div>
      </div>

      <div class="ost-body">
        <p class="ost-desc">
          Waktu ditetapkannya status untuk kategori ini — ditampilkan di
          stempel PDF &amp; Live Result. Default otomatis mengikuti waktu saat
          status dipilih; ubah di sini kalau perlu koreksi manual.
        </p>

        <!-- Zona waktu -->
        <div class="ost-field">
          <label class="ost-field-label">Zona Waktu</label>
          <div class="ost-tz" role="group" aria-label="Zona waktu">
            <button
              v-for="z in TZ_OPTIONS"
              :key="z"
              type="button"
              class="ost-tz__btn"
              :class="{ active: manualTz === z }"
              @click="manualTz = z"
            >
              {{ z }}
              <small>UTC+{{ tzOffset(z) }}</small>
            </button>
          </div>
        </div>

        <!-- Tanggal & waktu -->
        <div class="ost-field">
          <div class="ost-field-row">
            <label class="ost-field-label mb-0">
              Tanggal &amp; Waktu
              <span class="ost-field-label-hint">({{ manualTz }})</span>
            </label>
            <button type="button" class="ost-now-btn" @click="useNow">
              <Icon icon="mdi:clock-fast" width="14" height="14" />
              Gunakan waktu sekarang
            </button>
          </div>
          <div class="ost-datetime-wrap">
            <Icon
              icon="mdi:calendar-clock-outline"
              width="17"
              height="17"
              class="ost-datetime-icon"
            />
            <input
              v-model="manualDateTime"
              type="datetime-local"
              class="ost-datetime-input"
            />
          </div>
        </div>

        <!-- Pratinjau teks stempel -->
        <div class="ost-preview" :class="'ost-preview--' + status">
          <span class="ost-preview__label">Pratinjau waktu penetapan</span>
          <span class="ost-preview__value">
            <Icon icon="mdi:stamper" width="15" height="15" />
            {{ manualPreview || "Isi tanggal & waktu dulu" }}
          </span>
        </div>
      </div>

      <div class="ost-foot">
        <button type="button" class="ost-btn ost-btn--ghost" @click="showModal = false">
          Batal
        </button>
        <button
          type="button"
          class="ost-btn ost-btn--primary"
          :disabled="!manualDateTime"
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
    // Pratinjau teks "Ditetapkan: …" dari isian modal (wall-clock pada zona
    // yg dipilih) — dipakai kotak pratinjau di modal.
    manualPreview() {
      const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(this.manualDateTime || "");
      if (!m) return "";
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const mon = months[Number(m[2]) - 1] || m[2];
      return `Ditetapkan: ${m[3]} ${mon} ${m[1]} ${m[4]}.${m[5]} ${this.manualTz}`;
    },
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
    tzOffset(z) {
      return TZ_OFFSET_HOURS[z] || 7;
    },
    useNow() {
      this.manualDateTime = this.formatForTz(new Date(), this.manualTz);
    },
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
.ost-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 56px 20px 22px;
  color: #fff;
  background: linear-gradient(110deg, #0f2f52 0%, #1c4c7a 55%, #1d7fb8 100%);
}
.ost-head--provisional { background: linear-gradient(110deg, #7c2d12 0%, #b45309 55%, #d97706 100%); }
.ost-head--unofficial { background: linear-gradient(110deg, #7f1d1d 0%, #b91c1c 55%, #dc2626 100%); }
.ost-head--official { background: linear-gradient(110deg, #14532d 0%, #15803d 55%, #16a34a 100%); }
.ost-head__close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.ost-head__close:hover { background: rgba(255, 255, 255, 0.22); }
.ost-head__icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ost-head__text { min-width: 0; }
.ost-head__eyebrow {
  display: block;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.8;
}
.ost-head__title {
  margin: 2px 0 6px;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.ost-head__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.ost-head__dot { width: 7px; height: 7px; border-radius: 50%; background: #64748b; }
.ost-head--provisional .ost-head__dot { background: #d97706; }
.ost-head--unofficial .ost-head__dot { background: #dc2626; }
.ost-head--official .ost-head__dot { background: #16a34a; }

.ost-body { padding: 20px 22px 6px; }
.ost-desc { margin: 0 0 18px; font-size: 12.5px; line-height: 1.55; color: #64748b; }
.ost-field { margin-bottom: 16px; }
.ost-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.ost-field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #334155;
}
.ost-field-label-hint { font-weight: 600; color: #94a3b8; text-transform: none; letter-spacing: 0; }

.ost-tz {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: #f1f5fb;
  border: 1px solid #e6edf6;
}
.ost-tz__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 7px 4px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.ost-tz__btn small { font-size: 10px; font-weight: 600; opacity: 0.75; }
.ost-tz__btn:hover { color: #1c4c7a; }
.ost-tz__btn.active {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  box-shadow: 0 4px 10px rgba(28, 76, 122, 0.25);
}

.ost-now-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 8px;
  border: 1px solid #d6e3f1;
  background: #fff;
  color: #1c4c7a;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}
.ost-now-btn:hover { border-color: #25b0eb; background: #f0f7ff; }

.ost-datetime-wrap { position: relative; display: flex; align-items: center; }
.ost-datetime-icon { position: absolute; left: 12px; color: #94a3b8; pointer-events: none; }
.ost-datetime-input {
  width: 100%;
  height: 44px;
  padding: 0 12px 0 38px;
  border-radius: 11px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font: inherit;
  font-weight: 700;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
.ost-datetime-input:focus {
  background: #fff;
  border-color: #25b0eb;
  box-shadow: 0 0 0 3px rgba(37, 176, 235, 0.15);
}

.ost-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
}
.ost-preview__label {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #94a3b8;
}
.ost-preview__value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #334155;
}
.ost-preview--provisional { border-color: #fcd34d; background: #fffbeb; }
.ost-preview--provisional .ost-preview__value { color: #b45309; }
.ost-preview--unofficial { border-color: #fca5a5; background: #fef2f2; }
.ost-preview--unofficial .ost-preview__value { color: #b91c1c; }
.ost-preview--official { border-color: #86efac; background: #f0fdf4; }
.ost-preview--official .ost-preview__value { color: #15803d; }

.ost-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 22px;
  border-top: 1px solid #eef2f7;
  background: #fbfdff;
}
.ost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 18px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: filter 0.15s ease, background-color 0.15s ease, transform 0.08s ease;
}
.ost-btn:active:not(:disabled) { transform: translateY(1px); }
.ost-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.ost-btn--ghost { background: #fff; border-color: #e2e8f0; color: #475569; }
.ost-btn--ghost:hover { background: #f8fafc; }
.ost-btn--primary {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  box-shadow: 0 6px 14px rgba(28, 76, 122, 0.25);
}
.ost-btn--primary:hover:not(:disabled) { filter: brightness(1.07); }
</style>

<style>
/* Kartu modal — GLOBAL krn b-modal dirender di <body> (dulu `:deep()` di
   blok scoped tidak pernah kena, sudut & bayangan kartu tidak tampil). */
.ost-content {
  border: none;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
}
</style>

