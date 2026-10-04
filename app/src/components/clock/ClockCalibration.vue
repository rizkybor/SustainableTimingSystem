<template>
  <b-modal
    :visible="value"
    size="lg"
    centered
    hide-header
    hide-footer
    body-class="p-0"
    content-class="ccb"
    @change="$emit('input', $event)"
  >
    <!-- ===== kepala ===== -->
    <header class="ccb-head">
      <span class="ccb-head__icon"><Icon :icon="icons.tune" width="22" height="22" /></span>
      <div class="ccb-head__text">
        <h5>Kalibrasi Jam RaceTime2</h5>
        <small>Satu kalibrasi dipakai bersama Long Range Start &amp; STS Photo Finish</small>
      </div>
      <button type="button" class="ccb-icon-btn" title="Tutup" @click="$emit('input', false)"><Icon :icon="icons.close" width="22" height="22" /></button>
    </header>

    <div class="ccb-body">
      <!-- ===== jam berjalan ===== -->
      <section class="ccb-clock">
        <div class="ccb-clock__label">Jam RaceTime2</div>
        <div class="ccb-clock__value mono">{{ clockNow }}</div>
        <div class="ccb-chips">
          <span class="ccb-chip" :class="'ccb-chip--' + status.basis">{{ BASIS[status.basis] || "–" }}</span>
          <span class="ccb-chip">Trim {{ fmtMs(status.trimMs) }}</span>
          <span
            v-if="status.calibration && status.calibration.origin === 'photofinish'"
            class="ccb-chip ccb-chip--sync"
            title="Kalibrasi terakhir dibuat admin di STS Photo Finish dan diterapkan otomatis"
          >Dari Photo Finish</span>
          <span
            v-if="status.calibration && status.calibration.origin === 'longrange'"
            class="ccb-chip ccb-chip--sync"
            title="Kalibrasi terakhir dibuat lewat modal Long Range Start"
          >Dari Long Range</span>
        </div>
        <p class="ccb-hint">Bandingkan dengan layar RaceTime2. Bila berbeda, kalibrasi di bawah.</p>
        <p class="ccb-hint">
          Kalibrasi ini dipakai Buffer-Timer-Start (Long Range Start) &amp; disinkronkan ke
          <b>STS Photo Finish</b> bila terhubung — kalibrasi terbaru di aplikasi manapun berlaku untuk semuanya.
        </p>
      </section>

      <!-- ===== set ke waktu ===== -->
      <section class="ccb-card">
        <h6><Icon :icon="icons.timer" width="18" height="18" /> 1. Set ke waktu RaceTime2</h6>
        <p class="ccb-hint">
          Ketik waktu yang <b>akan</b> tampil di RaceTime2, lalu tekan <b>SET</b> tepat saat RaceTime2 menunjukkan waktu itu.
          Ketelitian ± waktu reaksi, rapikan dengan trim. Trim kembali 0.
        </p>
        <div class="ccb-setbar">
          <div class="ccb-setbar__field">
            <input
              v-model="setTime"
              class="ccb-input mono ccb-time-input"
              inputmode="numeric"
              maxlength="12"
              placeholder="HH:MM:SS.000"
              @input="setTime = mask($event.target.value)"
            />
            <button type="button" class="ccb-btn ccb-btn--ghost" title="Isi dengan jam sekarang + 10 detik" @click="prefill">
              <Icon :icon="icons.add" width="16" height="16" />10 dtk
            </button>
          </div>
          <button type="button" class="ccb-btn ccb-btn--set" :disabled="busy || !validSetTime" @pointerdown.prevent="doSet">
            <Icon :icon="icons.timer" width="22" height="22" />
            <span class="ccb-btn--set__text"><strong>SET</strong><small>tekan saat RaceTime2 = {{ validSetTime ? setTime : "…" }}</small></span>
          </button>
        </div>
      </section>

      <!-- ===== trim ===== -->
      <section class="ccb-card">
        <h6><Icon :icon="icons.adjust" width="18" height="18" /> 2. Trim halus</h6>
        <p class="ccb-hint">+ = jam RaceTime2 maju (lebih besar), − = mundur.</p>
        <div class="ccb-trimbar">
          <button
            v-for="d in TRIMS_DOWN"
            :key="d"
            type="button"
            class="ccb-trimbar__btn ccb-trimbar__btn--down"
            :disabled="busy"
            :title="'Mundurkan ' + -d + ' ms'"
            @click="act({ action: 'trim', deltaMs: d })"
          >
            {{ d }}
          </button>
          <div class="ccb-trimbar__value" :class="{ 'is-zero': !status.trimMs }">
            <span class="mono">{{ fmtMs(status.trimMs) }}</span>
            <small>trim</small>
          </div>
          <button
            v-for="d in TRIMS_UP"
            :key="d"
            type="button"
            class="ccb-trimbar__btn ccb-trimbar__btn--up"
            :disabled="busy"
            :title="'Majukan ' + d + ' ms'"
            @click="act({ action: 'trim', deltaMs: d })"
          >
            +{{ d }}
          </button>
        </div>
        <div class="ccb-row ccb-row--gap">
          <div class="ccb-suffix">
            <input v-model.number="trimValue" type="number" step="1" class="ccb-input mono" placeholder="0" aria-label="Nilai trim (ms)" />
            <span>ms</span>
          </div>
          <button
            type="button"
            class="ccb-btn ccb-btn--outline"
            :disabled="busy || trimValue === '' || trimValue === null || trimValue === status.trimMs"
            @click="act({ action: 'set-trim', trimMs: trimValue })"
          >
            <Icon :icon="icons.check" width="16" height="16" />Terapkan
          </button>
          <button type="button" class="ccb-btn ccb-btn--danger" :disabled="busy || !status.trimMs" @click="act({ action: 'reset-trim' })">
            <Icon :icon="icons.restart" width="16" height="16" />Reset
          </button>
        </div>
      </section>

      <!-- ===== mode ===== -->
      <section class="ccb-card">
        <h6><Icon :icon="icons.sync" width="18" height="18" /> Mode</h6>
        <div class="ccb-row ccb-row--gap">
          <div class="ccb-seg" role="radiogroup" aria-label="Mode kalibrasi">
            <button
              type="button"
              role="radio"
              :aria-checked="!isManual"
              :class="{ on: !isManual }"
              :disabled="busy || !isManual"
              title="Hapus kalibrasi manual: heartbeat RaceTime2 bila ada, selain itu jam laptop"
              @click="act({ action: 'use-auto' })"
            >
              <Icon :icon="icons.sync" width="16" height="16" />Otomatis
            </button>
            <button type="button" role="radio" :aria-checked="isManual" :class="{ on: isManual }" disabled title="Manual aktif setelah SET atau kunci heartbeat">
              <Icon :icon="icons.tune" width="16" height="16" />Manual
            </button>
          </div>
          <button type="button" class="ccb-btn ccb-btn--outline" :disabled="busy || !status.heartbeatAvailable" @click="act({ action: 'freeze-from-racetime' })">
            <Icon :icon="icons.sensors" width="16" height="16" />Kunci dari heartbeat
          </button>
        </div>
        <p class="ccb-hint">
          Otomatis = heartbeat RaceTime2 berwaktu bila ada, selain itu jam laptop.
          {{ status.heartbeatAvailable ? "Heartbeat RaceTime2 sedang diterima." : "Heartbeat RaceTime2 berwaktu tidak diterima (frame bare)." }}
        </p>
      </section>

      <!-- ===== log ===== -->
      <section v-if="log.length" class="ccb-log">
        <div class="ccb-log__title">Riwayat kalibrasi</div>
        <div v-for="(l, i) in log" :key="i" class="ccb-log__row">
          <span class="mono">{{ fmtAt(l.at) }}</span>
          <span>{{ l.note }}</span>
        </div>
      </section>
    </div>
  </b-modal>
</template>

<script>
// Kalibrasi jam RaceTime2 bersama — logika di clockCalibrationCore.js
// (lewat clockMain.js), di sini hanya UI + jam berjalan. Dikloning dari
// LongrangeCalibration.vue (sengaja TANPA bagian "Riwayat Start"/recompute
// — itu murni milik Long Range Start, bukan kalibrasi jam itu sendiri)
// supaya tetap bisa dipakai walau Long Range TIDAK dikonfigurasi sama
// sekali (mis. event yang cuma pakai STS Photo Finish).
import { Icon } from "@iconify/vue2";
import icTune from "@iconify/icons-ic/baseline-tune";
import icClose from "@iconify/icons-ic/baseline-close";
import icTimer from "@iconify/icons-ic/baseline-timer";
import icAdjust from "@iconify/icons-ic/baseline-exposure";
import icSync from "@iconify/icons-ic/baseline-sync";
import icAdd from "@iconify/icons-ic/baseline-add";
import icRestart from "@iconify/icons-ic/baseline-restart-alt";
import icSensors from "@iconify/icons-ic/baseline-sensors";
import icCheck from "@iconify/icons-ic/baseline-check";
import { calibrate, getStatus, hostNowMs, onStatus } from "@/services/clock";

const DAY_MS = 86400000;
const BASIS = { manual: "Manual", racetime: "Heartbeat RaceTime2", laptop: "Jam laptop" };
const TRIMS_DOWN = [-100, -10, -1];
const TRIMS_UP = [1, 10, 100];

function pad(n, l) {
  return String(n).padStart(l || 2, "0");
}
function fmtClock(todMs) {
  const t = Math.floor(((todMs % DAY_MS) + DAY_MS) % DAY_MS);
  return pad(Math.floor(t / 3600000)) + ":" + pad(Math.floor((t % 3600000) / 60000)) + ":" + pad(Math.floor((t % 60000) / 1000)) + "." + pad(t % 1000, 3);
}
function localTod(ms) {
  const d = new Date(ms);
  return ms - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default {
  name: "ClockCalibration",
  components: { Icon },
  props: { value: { type: Boolean, default: false } },
  data() {
    return {
      status: {},
      clockNow: "--:--:--.---",
      setTime: "",
      trimValue: "",
      busy: false,
      BASIS: BASIS,
      TRIMS_DOWN: TRIMS_DOWN,
      TRIMS_UP: TRIMS_UP,
      icons: {
        tune: icTune, close: icClose, timer: icTimer, adjust: icAdjust, sync: icSync,
        add: icAdd, restart: icRestart, sensors: icSensors, check: icCheck,
      },
    };
  },
  computed: {
    validSetTime() {
      return /^\d{2}:\d{2}:\d{2}\.\d{3}$/.test(this.setTime);
    },
    isManual() {
      return !!(this.status.calibration && this.status.calibration.manual);
    },
    log() {
      return (this.status.calibration && this.status.calibration.log) || [];
    },
  },
  watch: {
    value(open) {
      if (open) this.refresh();
    },
  },
  mounted() {
    this._off = onStatus((st) => {
      this.status = st;
    });
    this._tick = setInterval(() => {
      if (!this.value || typeof this.status.displayOffsetMs !== "number") return;
      this.clockNow = fmtClock(localTod(Date.now()) - this.status.displayOffsetMs);
    }, 47);
    if (this.value) this.refresh();
  },
  beforeDestroy() {
    if (this._off) this._off();
    clearInterval(this._tick);
  },
  methods: {
    async refresh() {
      this.status = await getStatus();
      if (!this.setTime) this.prefill();
      this.trimValue = this.status.trimMs || 0;
    },
    mask(raw) {
      const d = String(raw || "").replace(/\D/g, "").slice(0, 9);
      let out = "";
      for (let i = 0; i < d.length; i++) {
        if (i === 2 || i === 4) out += ":";
        else if (i === 6) out += ".";
        out += d[i];
      }
      return out;
    },
    prefill() {
      if (typeof this.status.displayOffsetMs !== "number") return;
      const t = localTod(Date.now()) - this.status.displayOffsetMs + 10000;
      this.setTime = fmtClock(Math.floor(t / 1000) * 1000);
    },
    doSet() {
      // Waktu host dicatat SEKARANG (pointerdown), sebelum IPC — inti ketelitian SET.
      const hostMs = hostNowMs();
      this.act({ action: "set-time", deviceTime: this.setTime, hostMs: hostMs }, "Jam disetel ke " + this.setTime + ".");
    },
    async act(body, okText) {
      this.busy = true;
      try {
        const res = await calibrate(body);
        if (!res.ok) return this.toast("danger", res.error);
        this.status = res.status;
        this.trimValue = res.status.trimMs;
        this.toast("success", okText || "Kalibrasi diperbarui: " + res.status.calibration.log[0].note + ".");
      } finally {
        this.busy = false;
      }
    },
    fmtMs(v) {
      const n = Number(v) || 0;
      return (n > 0 ? "+" : "") + n + " ms";
    },
    fmtAt(iso) {
      return new Date(iso).toLocaleTimeString("id-ID");
    },
    toast(variant, text) {
      if (this.$bvToast) this.$bvToast.toast(text, { title: "Kalibrasi Jam RaceTime2", variant: variant, solid: true, autoHideDelay: 5000 });
    },
  },
};
</script>

<style>
/* tidak scoped: kelas ini dipasang pada elemen milik b-modal */
.ccb {
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
}
</style>

<style scoped>
.mono {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}
.ccb-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: linear-gradient(90deg, #1874a5, #1d8fbb);
  color: #fff;
}
.ccb-head__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
}
.ccb-head__text {
  flex: 1;
  min-width: 0;
}
.ccb-head__text h5 {
  margin: 0;
  font-weight: 800;
}
.ccb-head__text small {
  opacity: 0.85;
}
.ccb-icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.ccb-icon-btn:hover {
  background: rgba(255, 255, 255, 0.24);
}
.ccb-body {
  padding: 18px;
  display: grid;
  gap: 14px;
  background: #f4f7fb;
}
.ccb-clock {
  background: #2f2f2f;
  border-radius: 18px;
  padding: 16px;
  color: #fff;
  text-align: center;
}
.ccb-clock__label {
  font-weight: 700;
  font-size: 0.85rem;
  color: #dbe4ee;
}
.ccb-clock__value {
  display: inline-block;
  margin: 8px 0;
  padding: 6px 18px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  color: #7dd3fc;
  font-size: 2.6rem;
  font-weight: 800;
}
.ccb-clock .ccb-hint {
  color: #b6c2cf;
  margin: 8px 0 0;
}
.ccb-chips {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}
.ccb-chip {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
.ccb-chip--sync {
  background: rgba(34, 211, 238, 0.18);
  color: #a5f3fc;
}
.ccb-chip--manual {
  background: #1d8fbb;
  border-color: #1d8fbb;
}
.ccb-chip--racetime {
  background: #10b981;
  border-color: #10b981;
}
.ccb-chip--laptop,
.ccb-chip--warn {
  background: #f59e0b;
  border-color: #f59e0b;
  color: #1f1f1f;
}
.ccb-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px 16px;
}
.ccb-card h6 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  font-weight: 800;
  color: #0f172a;
}
.ccb-card h6 svg {
  color: #1874a5;
}
.ccb-hint {
  color: #6b7280;
  font-size: 0.82rem;
  margin: 0 0 10px;
}
.ccb-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.ccb-row + .ccb-row {
  margin-top: 8px;
}
.ccb-row--gap {
  gap: 10px;
}
.ccb-row + .ccb-hint {
  margin: 10px 0 0;
}

/* ---------- tombol (bahasa visual sts-timingsystem: btn-action + gradien brand) ---------- */
.ccb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #cfd8e6;
  background: #fff;
  color: #1c4c7a;
  font-weight: 700;
  font-size: 0.9rem;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.05s;
}
.ccb-btn:hover:not(:disabled) {
  background: #1f6fa3;
  border-color: #1f6fa3;
  color: #fff;
}
.ccb-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
}
.ccb-btn:active:not(:disabled) {
  transform: translateY(1px);
}
.ccb-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.ccb-btn--ghost {
  border-color: transparent;
  background: #eaf4fa;
  color: #1874a5;
}
.ccb-btn--danger {
  color: #dc2626;
  border-color: #fecaca;
}
.ccb-btn--danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

/* SET: tombol utama besar — ditekan tepat saat RaceTime2 menunjukkan waktu */
.ccb-setbar {
  display: flex;
  gap: 10px;
  align-items: stretch;
  flex-wrap: wrap;
}
.ccb-setbar__field {
  flex: 1 1 260px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 0;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #f8fafc;
}
.ccb-setbar__field:focus-within {
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  background: #fff;
}
.ccb-input {
  height: 44px;
  width: 100%;
  min-width: 0;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 0 12px;
  color: #0f172a;
}
.ccb-input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  background: #fff;
}
.ccb-time-input {
  flex: 1;
  border: 0;
  background: transparent;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.ccb-time-input:focus {
  box-shadow: none;
  background: transparent;
}
.ccb-btn--set {
  flex: 1 1 230px;
  max-width: 100%;
  min-height: 56px;
  padding: 8px 18px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(90deg, #1874a5, #1d8fbb);
  color: #fff;
  box-shadow: 0 6px 16px rgba(24, 116, 165, 0.35);
  justify-content: flex-start;
  gap: 10px;
}
.ccb-btn--set:hover:not(:disabled) {
  background: linear-gradient(90deg, #13628d, #1874a5);
}
.ccb-btn--set:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(24, 116, 165, 0.35);
}
.ccb-btn--set__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
  min-width: 0;
}
.ccb-btn--set__text strong {
  font-size: 1.15rem;
  letter-spacing: 0.08em;
}
.ccb-btn--set__text small {
  font-weight: 600;
  font-size: 0.72rem;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Trim: satu batang — mundur | nilai | maju */
.ccb-trimbar {
  display: flex;
  align-items: stretch;
  border: 1px solid #cfd8e6;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  margin-bottom: 10px;
}
.ccb-trimbar__btn {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  border: 0;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ccb-trimbar__btn--down {
  color: #b45309;
}
.ccb-trimbar__btn--up {
  color: #047857;
  border-right: 0;
  border-left: 1px solid #e5e7eb;
}
.ccb-trimbar__btn--down:hover:not(:disabled) {
  background: #fff7ed;
}
.ccb-trimbar__btn--up:hover:not(:disabled) {
  background: #ecfdf5;
}
.ccb-trimbar__btn:active:not(:disabled) {
  filter: brightness(0.94);
}
.ccb-trimbar__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.ccb-trimbar__value {
  flex: 1.4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background: #1874a5;
  color: #fff;
  line-height: 1.1;
}
.ccb-trimbar__value.is-zero {
  background: #f1f5f9;
  color: #374151;
}
.ccb-trimbar__value .mono {
  font-weight: 800;
  font-size: 1rem;
}
.ccb-trimbar__value small {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.8;
}
.ccb-suffix {
  position: relative;
  width: 150px;
}
.ccb-suffix .ccb-input {
  padding-right: 40px;
}
.ccb-suffix span {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.85rem;
  font-weight: 600;
  pointer-events: none;
}

/* Mode: kontrol segmen Otomatis / Manual */
.ccb-seg {
  display: inline-flex;
  padding: 3px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #e5e7eb;
}
.ccb-seg button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 6px 14px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #6b7280;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
}
.ccb-seg button:hover:not(:disabled):not(.on) {
  color: #1874a5;
  background: #fff;
}
.ccb-seg button.on {
  background: #fff;
  color: #1874a5;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
  cursor: default;
}
.ccb-seg button:disabled:not(.on) {
  cursor: default;
}

.spacer {
  flex: 1;
}
.ccb-log {
  font-size: 0.82rem;
  color: #374151;
}
.ccb-log__title {
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin-bottom: 4px;
}
.ccb-log__row {
  display: flex;
  gap: 12px;
  padding: 3px 0;
  border-bottom: 1px solid #eef2f7;
}
</style>
