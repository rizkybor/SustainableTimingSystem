<template>
  <b-modal
    :visible="value"
    size="lg"
    centered
    hide-header
    hide-footer
    body-class="p-0"
    content-class="lrc"
    @change="$emit('input', $event)"
  >
    <!-- ===== kepala ===== -->
    <header class="lrc-head">
      <span class="lrc-head__icon"><Icon :icon="icons.tune" width="22" height="22" /></span>
      <div class="lrc-head__text">
        <h5>Kalibrasi Long Range Start</h5>
        <small>Samakan jam start garis start jauh dengan tampilan RaceTime2</small>
      </div>
      <button type="button" class="lrc-icon-btn" title="Tutup" @click="$emit('input', false)"><Icon :icon="icons.close" width="22" height="22" /></button>
    </header>

    <div class="lrc-body">
      <!-- ===== jam berjalan ===== -->
      <section class="lrc-clock">
        <div class="lrc-clock__label">Jam Long Range (basis Buffer-Timer-Start)</div>
        <div class="lrc-clock__value mono">{{ clockNow }}</div>
        <div class="lrc-chips">
          <span class="lrc-chip" :class="'lrc-chip--' + status.basis">{{ BASIS[status.basis] || "–" }}</span>
          <span class="lrc-chip">Trim {{ fmtMs(status.trimMs) }}</span>
          <span v-if="status.clockSynced" class="lrc-chip">Server ±{{ Math.ceil((status.rttMs || 0) / 2) }} ms</span>
          <span v-else class="lrc-chip lrc-chip--warn">Jam server belum tersinkron</span>
        </div>
        <p class="lrc-hint">Bandingkan dengan layar RaceTime2. Bila berbeda, kalibrasi di bawah.</p>
      </section>

      <!-- ===== set ke waktu ===== -->
      <section class="lrc-card">
        <h6><Icon :icon="icons.timer" width="18" height="18" /> 1. Set ke waktu RaceTime2</h6>
        <p class="lrc-hint">
          Ketik waktu yang <b>akan</b> tampil di RaceTime2, lalu tekan <b>SET</b> tepat saat RaceTime2 menunjukkan waktu itu.
          Ketelitian ± waktu reaksi, rapikan dengan trim. Trim kembali 0.
        </p>
        <div class="lrc-setbar">
          <div class="lrc-setbar__field">
            <input
              v-model="setTime"
              class="lrc-input mono lrc-time-input"
              inputmode="numeric"
              maxlength="12"
              placeholder="HH:MM:SS.000"
              @input="setTime = mask($event.target.value)"
            />
            <button type="button" class="lrc-btn lrc-btn--ghost" title="Isi dengan jam sekarang + 10 detik" @click="prefill">
              <Icon :icon="icons.add" width="16" height="16" />10 dtk
            </button>
          </div>
          <button type="button" class="lrc-btn lrc-btn--set" :disabled="busy || !validSetTime" @pointerdown.prevent="doSet">
            <Icon :icon="icons.timer" width="22" height="22" />
            <span class="lrc-btn--set__text"><strong>SET</strong><small>tekan saat RaceTime2 = {{ validSetTime ? setTime : "…" }}</small></span>
          </button>
        </div>
      </section>

      <!-- ===== trim ===== -->
      <section class="lrc-card">
        <h6><Icon :icon="icons.adjust" width="18" height="18" /> 2. Trim halus</h6>
        <p class="lrc-hint">+ = waktu start maju (lebih besar), − = mundur. Berlaku untuk start berikutnya.</p>
        <div class="lrc-trimbar">
          <button
            v-for="d in TRIMS_DOWN"
            :key="d"
            type="button"
            class="lrc-trimbar__btn lrc-trimbar__btn--down"
            :disabled="busy"
            :title="'Mundurkan ' + -d + ' ms'"
            @click="act({ action: 'trim', deltaMs: d })"
          >
            {{ d }}
          </button>
          <div class="lrc-trimbar__value" :class="{ 'is-zero': !status.trimMs }">
            <span class="mono">{{ fmtMs(status.trimMs) }}</span>
            <small>trim</small>
          </div>
          <button
            v-for="d in TRIMS_UP"
            :key="d"
            type="button"
            class="lrc-trimbar__btn lrc-trimbar__btn--up"
            :disabled="busy"
            :title="'Majukan ' + d + ' ms'"
            @click="act({ action: 'trim', deltaMs: d })"
          >
            +{{ d }}
          </button>
        </div>
        <div class="lrc-row lrc-row--gap">
          <div class="lrc-suffix">
            <input v-model.number="trimValue" type="number" step="1" class="lrc-input mono" placeholder="0" aria-label="Nilai trim (ms)" />
            <span>ms</span>
          </div>
          <button
            type="button"
            class="lrc-btn lrc-btn--outline"
            :disabled="busy || trimValue === '' || trimValue === null || trimValue === status.trimMs"
            @click="act({ action: 'set-trim', trimMs: trimValue })"
          >
            <Icon :icon="icons.check" width="16" height="16" />Terapkan
          </button>
          <button type="button" class="lrc-btn lrc-btn--danger" :disabled="busy || !status.trimMs" @click="act({ action: 'reset-trim' })">
            <Icon :icon="icons.restart" width="16" height="16" />Reset
          </button>
        </div>
      </section>

      <!-- ===== mode ===== -->
      <section class="lrc-card">
        <h6><Icon :icon="icons.sync" width="18" height="18" /> Mode</h6>
        <div class="lrc-row lrc-row--gap">
          <div class="lrc-seg" role="radiogroup" aria-label="Mode kalibrasi">
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
          <button type="button" class="lrc-btn lrc-btn--outline" :disabled="busy || !status.heartbeatAvailable" @click="act({ action: 'freeze-from-racetime' })">
            <Icon :icon="icons.sensors" width="16" height="16" />Kunci dari heartbeat
          </button>
        </div>
        <p class="lrc-hint">
          Otomatis = heartbeat RaceTime2 berwaktu bila ada, selain itu jam laptop.
          {{ status.heartbeatAvailable ? "Heartbeat RaceTime2 sedang diterima." : "Heartbeat RaceTime2 berwaktu tidak diterima (frame bare)." }}
        </p>
      </section>

      <!-- ===== start terakhir ===== -->
      <section v-if="last" class="lrc-card">
        <h6><Icon :icon="icons.flag" width="18" height="18" /> Start terakhir</h6>
        <div class="lrc-row lrc-last">
          <span class="mono lrc-last__time">{{ last.time }}</span>
          <span v-if="last.originalTime && last.originalTime !== last.time" class="lrc-hint">semula {{ last.originalTime }}</span>
          <span class="lrc-hint">{{ [last.raceId, last.wave ? "wave " + last.wave : null, last.deviceName].filter(Boolean).join(" · ") }}</span>
          <span class="spacer"></span>
          <button
            type="button"
            class="lrc-btn lrc-btn--primary"
            :disabled="busy || !lastStale"
            :title="lastStale ? 'Terapkan kalibrasi terbaru ke start ini' : 'Sudah memakai kalibrasi terbaru'"
            @click="doRecompute"
          >
            <Icon :icon="icons.refresh" width="16" height="16" />
            <template v-if="lastStale">Hitung ulang → <span class="mono">{{ lastPreview }}</span></template>
            <template v-else>Sudah terkalibrasi</template>
          </button>
        </div>
        <p class="lrc-hint">Hitung ulang mengisi Buffer-Timer-Start lagi. Bila waktu lama sudah ditetapkan ke BIB, ubah di tim tersebut.</p>
      </section>

      <!-- ===== log ===== -->
      <section v-if="log.length" class="lrc-log">
        <div class="lrc-log__title">Riwayat kalibrasi</div>
        <div v-for="(l, i) in log" :key="i" class="lrc-log__row">
          <span class="mono">{{ fmtAt(l.at) }}</span>
          <span>{{ l.note }}</span>
        </div>
      </section>
    </div>
  </b-modal>
</template>

<script>
// Kalibrasi manual jam Long Range Start terhadap RaceTime2 — logika di
// longrangeCore.js (calibrate/recompute), di sini hanya UI + jam berjalan.
import { Icon } from "@iconify/vue2";
import icTune from "@iconify/icons-ic/baseline-tune";
import icClose from "@iconify/icons-ic/baseline-close";
import icTimer from "@iconify/icons-ic/baseline-timer";
import icAdjust from "@iconify/icons-ic/baseline-exposure";
import icSync from "@iconify/icons-ic/baseline-sync";
import icFlag from "@iconify/icons-ic/baseline-flag";
import icAdd from "@iconify/icons-ic/baseline-add";
import icRestart from "@iconify/icons-ic/baseline-restart-alt";
import icSensors from "@iconify/icons-ic/baseline-sensors";
import icRefresh from "@iconify/icons-ic/baseline-refresh";
import icCheck from "@iconify/icons-ic/baseline-check";
import { calibrate, getRecent, getStatus, hostNowMs, onStatus, recompute } from "@/services/longrange";

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
  name: "LongrangeCalibration",
  components: { Icon },
  props: { value: { type: Boolean, default: false } },
  data() {
    return {
      status: {},
      recent: [],
      clockNow: "--:--:--.---",
      setTime: "",
      trimValue: "",
      busy: false,
      BASIS: BASIS,
      TRIMS_DOWN: TRIMS_DOWN,
      TRIMS_UP: TRIMS_UP,
      icons: {
        tune: icTune, close: icClose, timer: icTimer, adjust: icAdjust, sync: icSync, flag: icFlag,
        add: icAdd, restart: icRestart, sensors: icSensors, refresh: icRefresh, check: icCheck,
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
    last() {
      return this.recent.find((e) => e.kind === "START") || null;
    },
    lastStale() {
      return !!(this.last && this.status.calibration && this.last.calibrationRevision !== this.status.calibration.revision);
    },
    lastPreview() {
      // Perkiraan saja (offset server→laptop saat ini dianggap sama); hasil pasti dihitung main process.
      if (!this.last || typeof this.status.serverOffsetMs !== "number") return "";
      return fmtClock(localTod(this.last.startServerMs - this.status.serverOffsetMs) - this.status.displayOffsetMs);
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
      this.recent = await getRecent();
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
    async doRecompute() {
      this.busy = true;
      try {
        const res = await recompute(this.last.startId);
        if (!res.ok) return this.toast("danger", res.error);
        this.recent = await getRecent();
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
      if (this.$bvToast) this.$bvToast.toast(text, { title: "Kalibrasi Long Range Start", variant: variant, solid: true, autoHideDelay: 5000 });
    },
  },
};
</script>

<style>
/* tidak scoped: kelas ini dipasang pada elemen milik b-modal */
.lrc {
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
.lrc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: linear-gradient(90deg, #1874a5, #1d8fbb);
  color: #fff;
}
.lrc-head__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
}
.lrc-head__text {
  flex: 1;
  min-width: 0;
}
.lrc-head__text h5 {
  margin: 0;
  font-weight: 800;
}
.lrc-head__text small {
  opacity: 0.85;
}
.lrc-icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.lrc-icon-btn:hover {
  background: rgba(255, 255, 255, 0.24);
}
.lrc-body {
  padding: 18px;
  display: grid;
  gap: 14px;
  background: #f4f7fb;
}
.lrc-clock {
  background: #2f2f2f;
  border-radius: 18px;
  padding: 16px;
  color: #fff;
  text-align: center;
}
.lrc-clock__label {
  font-weight: 700;
  font-size: 0.85rem;
  color: #dbe4ee;
}
.lrc-clock__value {
  display: inline-block;
  margin: 8px 0;
  padding: 6px 18px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  color: #7dd3fc;
  font-size: 2.6rem;
  font-weight: 800;
}
.lrc-clock .lrc-hint {
  color: #b6c2cf;
  margin: 8px 0 0;
}
.lrc-chips {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}
.lrc-chip {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
.lrc-chip--manual {
  background: #1d8fbb;
  border-color: #1d8fbb;
}
.lrc-chip--racetime {
  background: #10b981;
  border-color: #10b981;
}
.lrc-chip--laptop,
.lrc-chip--warn {
  background: #f59e0b;
  border-color: #f59e0b;
  color: #1f1f1f;
}
.lrc-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px 16px;
}
.lrc-card h6 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  font-weight: 800;
  color: #0f172a;
}
.lrc-card h6 svg {
  color: #1874a5;
}
.lrc-hint {
  color: #6b7280;
  font-size: 0.82rem;
  margin: 0 0 10px;
}
.lrc-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.lrc-row + .lrc-row {
  margin-top: 8px;
}
.lrc-row--gap {
  gap: 10px;
}
.lrc-row + .lrc-hint {
  margin: 10px 0 0;
}

/* ---------- tombol (bahasa visual sts-timingsystem: btn-action + gradien brand) ---------- */
.lrc-btn {
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
.lrc-btn:hover:not(:disabled) {
  background: #1f6fa3;
  border-color: #1f6fa3;
  color: #fff;
}
.lrc-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
}
.lrc-btn:active:not(:disabled) {
  transform: translateY(1px);
}
.lrc-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.lrc-btn--ghost {
  border-color: transparent;
  background: #eaf4fa;
  color: #1874a5;
}
.lrc-btn--primary {
  border-color: transparent;
  background: linear-gradient(90deg, #1874a5, #1d8fbb);
  color: #fff;
}
.lrc-btn--danger {
  color: #dc2626;
  border-color: #fecaca;
}
.lrc-btn--danger:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

/* SET: tombol utama besar — ditekan tepat saat RaceTime2 menunjukkan waktu */
.lrc-setbar {
  display: flex;
  gap: 10px;
  align-items: stretch;
  flex-wrap: wrap;
}
.lrc-setbar__field {
  flex: 1 1 260px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 0;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #f8fafc;
}
.lrc-setbar__field:focus-within {
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  background: #fff;
}
.lrc-input {
  height: 44px;
  width: 100%;
  min-width: 0;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 0 12px;
  color: #0f172a;
}
.lrc-input:focus {
  outline: none;
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  background: #fff;
}
.lrc-time-input {
  flex: 1;
  border: 0;
  background: transparent;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.lrc-time-input:focus {
  box-shadow: none;
  background: transparent;
}
.lrc-btn--set {
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
.lrc-btn--set:hover:not(:disabled) {
  background: linear-gradient(90deg, #13628d, #1874a5);
}
.lrc-btn--set:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(24, 116, 165, 0.35);
}
.lrc-btn--set__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
  min-width: 0;
}
.lrc-btn--set__text strong {
  font-size: 1.15rem;
  letter-spacing: 0.08em;
}
.lrc-btn--set__text small {
  font-weight: 600;
  font-size: 0.72rem;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Trim: satu batang — mundur | nilai | maju */
.lrc-trimbar {
  display: flex;
  align-items: stretch;
  border: 1px solid #cfd8e6;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  margin-bottom: 10px;
}
.lrc-trimbar__btn {
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
.lrc-trimbar__btn--down {
  color: #b45309;
}
.lrc-trimbar__btn--up {
  color: #047857;
  border-right: 0;
  border-left: 1px solid #e5e7eb;
}
.lrc-trimbar__btn--down:hover:not(:disabled) {
  background: #fff7ed;
}
.lrc-trimbar__btn--up:hover:not(:disabled) {
  background: #ecfdf5;
}
.lrc-trimbar__btn:active:not(:disabled) {
  filter: brightness(0.94);
}
.lrc-trimbar__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.lrc-trimbar__value {
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
.lrc-trimbar__value.is-zero {
  background: #f1f5f9;
  color: #374151;
}
.lrc-trimbar__value .mono {
  font-weight: 800;
  font-size: 1rem;
}
.lrc-trimbar__value small {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.8;
}
.lrc-suffix {
  position: relative;
  width: 150px;
}
.lrc-suffix .lrc-input {
  padding-right: 40px;
}
.lrc-suffix span {
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
.lrc-seg {
  display: inline-flex;
  padding: 3px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #e5e7eb;
}
.lrc-seg button {
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
.lrc-seg button:hover:not(:disabled):not(.on) {
  color: #1874a5;
  background: #fff;
}
.lrc-seg button.on {
  background: #fff;
  color: #1874a5;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
  cursor: default;
}
.lrc-seg button:disabled:not(.on) {
  cursor: default;
}

.lrc-last__time {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}
.lrc-last .lrc-hint {
  margin: 0;
}
.spacer {
  flex: 1;
}
.lrc-log {
  font-size: 0.82rem;
  color: #374151;
}
.lrc-log__title {
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin-bottom: 4px;
}
.lrc-log__row {
  display: flex;
  gap: 12px;
  padding: 3px 0;
  border-bottom: 1px solid #eef2f7;
}
</style>
