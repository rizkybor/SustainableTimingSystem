<template>
  <div class="px-5 py-2">
    <div class="card p-3 race-window">
      <div class="mb-3 text-center">
        <h5 class="section-title">STiming System 424 v2.0.0</h5>
        <!-- Status sumber waktu (jam RaceTime2 + Long Range Start) — di
             header panel, bukan di judul Buffer-Timer-Start, supaya tidak
             mengganggu tampilan card buffer. Klik badge = kalibrasi. -->
        <div class="time-source-bar">
          <span class="time-source-bar__label">Sumber Waktu</span>
          <ClockBadge />
          <LongrangeBadge />
          <PhotofinishBadge v-if="showPhotofinish" />
        </div>
      </div>

      <div>
        <b-row>
          <!-- LEFT: Live Feed -->
          <b-col cols="12" md="4" class="mb-3 mb-md-0">
            <div class="feed-panel">
              <div class="feed-scroll">
                <!-- tinggi tetap & scroll -->
                <table class="table table-sm table-rounded mb-0 w-100">
                  <thead>
                    <tr>
                      <th scope="col">Registration Id</th>
                      <th scope="col">Racetime</th>
                      <th scope="col">(hh:mm:ss.ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!digitId || !digitId.length">
                      <td colspan="3" class="text-center text-muted py-4">
                        Time data is not yet available
                      </td>
                    </tr>
                    <!-- Klik baris = salin waktunya ke Get Time Start/Finish,
                         jenisnya ditentukan sama persis dgn routing reader
                         (lihat feedRow()). -->
                    <tr
                      v-else
                      v-for="(id, index) in digitId"
                      :key="'feed-' + index"
                      :class="{
                        'highlight-row': index === 0,
                        'feed-row--clickable': !!feedRow(index).target,
                      }"
                      :title="feedRow(index).hint"
                      @click="applyFeedRow(index)"
                    >
                      <td>{{ id }}</td>
                      <td>{{ digitTime[index] }}</td>
                      <td class="feed-time-cell">
                        {{ feedRow(index).time }}
                        <span
                          v-if="feedRow(index).target"
                          class="feed-tag"
                          :class="'feed-tag--' + feedRow(index).target"
                        >
                          {{ feedRow(index).label }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </b-col>

          <!-- RIGHT: Start / Finish Buffer & tombol BIB (grid tile) -->
          <b-col cols="12" md class="pl-md-3">
            <div
              v-for="sec in sections"
              :key="sec.type"
              class="card card-fixed"
              :class="{ 'mt-3': sec.type === 'finish' }"
            >
              <div class="card-body h-100">
                <b-row no-gutters class="h-100">
                  <!-- kiri: judul + input buffer -->
                  <b-col cols="12" lg="4" class="d-flex flex-column pr-lg-3">
                    <h5 class="card-title" style="font-weight: 800">
                      {{ sec.title }}
                    </h5>
                    <p class="mb-1">{{ sec.inputLabel }}</p>
                    <div class="input-group mb-3">
                      <input
                        :value="sec.value"
                        @input="onTimerInput($event, sec.prop)"
                        type="text"
                        inputmode="numeric"
                        maxlength="12"
                        class="form-control"
                        :class="{ 'input-flash': flashField === sec.type }"
                        placeholder="00:00:00.000"
                      />
                    </div>
                  </b-col>

                  <!-- kanan: grid tombol BIB (scroll di sini) -->
                  <b-col
                    cols="12"
                    lg="8"
                    class="d-flex flex-column h-100 min-h-0 mt-2 mt-lg-0"
                  >
                    <div class="bib-toolbar">
                      <span class="bib-toolbar__count">
                        {{ doneCount(sec.type) }}/{{ participant.length }}
                        tercatat
                      </span>
                      <div class="bib-filter" role="group">
                        <button
                          type="button"
                          class="bib-filter__btn"
                          :class="{ active: filters[sec.type] === 'pending' }"
                          @click="filters[sec.type] = 'pending'"
                        >
                          Belum ({{ pendingCount(sec.type) }})
                        </button>
                        <button
                          type="button"
                          class="bib-filter__btn"
                          :class="{ active: filters[sec.type] === 'all' }"
                          @click="filters[sec.type] = 'all'"
                        >
                          Semua ({{ participant.length }})
                        </button>
                      </div>
                    </div>

                    <div class="btn-scroll">
                      <div class="bib-grid">
                        <button
                          v-for="tile in tilesFor(sec.type)"
                          :key="sec.type + '-' + tile.index"
                          type="button"
                          class="bib-tile"
                          :class="'bib-tile--' + tile.state"
                          :disabled="tile.state !== 'ready'"
                          :title="tile.title"
                          @click="
                            $emit('update-time', sec.value, tile.index, sec.type)
                          "
                        >
                          <span class="bib-tile__num">
                            <span v-if="tile.state === 'done'" class="bib-tile__check">✓</span>
                            {{ tile.bib }}
                          </span>
                          <span class="bib-tile__sub">{{ tile.sub }}</span>
                        </button>
                      </div>
                      <div
                        v-if="!tilesFor(sec.type).length"
                        class="bib-empty"
                      >
                        {{
                          participant.length
                            ? "Semua tim sudah tercatat."
                            : "Belum ada tim."
                        }}
                      </div>
                    </div>
                  </b-col>
                </b-row>
              </div>
            </div>
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
</template>

<script>
import LongrangeBadge from "@/components/longrange/LongrangeBadge.vue";
import ClockBadge from "@/components/clock/ClockBadge.vue";
import PhotofinishBadge from "@/components/photofinish/PhotofinishBadge.vue";
import { classifyFrame } from "@/utils/microGateReader";

const FEED_TIME_RE = /^\d{1,2}:\d{2}:\d{2}\.\d{1,3}$/;

export default {
  name: "OperationTimePanel",
  components: { LongrangeBadge, ClockBadge, PhotofinishBadge },
  data() {
    return {
      // Filter tombol BIB per buffer: "all" (default, posisi tile stabil
      // supaya tidak salah pencet) atau "pending" (sembunyikan yg sudah
      // tercatat).
      filters: { start: "all", finish: "all" },
      // Field buffer yg baru diisi dari klik Live Feed — dipakai utk efek
      // kedip singkat supaya operator lihat waktunya masuk ke mana.
      flashField: null,
    };
  },
  props: {
    digitId: { type: Array, default: () => [] },
    digitTime: { type: Array, default: () => [] },
    participant: { type: Array, default: () => [] },
    digitTimeStart: { type: String, default: "" },
    digitTimeFinish: { type: String, default: "" },
    // nama tim yang sedang BYE (mis. dari Head to Head) — tombol BIB mereka
    // di-disable krn tidak pernah balapan. Kosong/tidak dipakai di kategori
    // lain (Sprint/Slalom/dll.) yang tidak punya konsep BYE.
    byeNames: { type: Array, default: () => [] },
    // true khusus dari Head to Head — tombol BIB non-BYE ikut di-disable
    // selama tim itu belum diassign Heat (lewat klik di bagan). Default
    // false supaya kategori lain (yg tidak punya konsep Heat) tidak
    // terpengaruh.
    requireHeat: { type: Boolean, default: false },
    // true di halaman yg memakai STS Photo Finish (H2H/Rafting Cross/DRR)
    // — badge-nya tampil di kapsul "Sumber Waktu" sebelah Long Range Start.
    showPhotofinish: { type: Boolean, default: false },
  },
  beforeDestroy() {
    clearTimeout(this._flashTimer);
  },
  computed: {
    sections() {
      return [
        {
          type: "start",
          title: "Buffer-Timer-Start",
          inputLabel: "Get Time Start",
          prop: "digitTimeStart",
          value: this.digitTimeStart,
        },
        {
          type: "finish",
          title: "Buffer-Timer-Finish",
          inputLabel: "Get Time Finish",
          prop: "digitTimeFinish",
          value: this.digitTimeFinish,
        },
      ];
    },
  },
  methods: {
    // Buffer-Timer-Start / Buffer-Timer-Finish HANYA boleh diisi format
    // HH:MM:SS.mmm — operator cuma ketik angkanya (mis. dari hasil baca
    // stopwatch manual), ":" dan "." disisipkan otomatis, karakter selain
    // digit dibuang, dan input dipotong maks 9 digit (2+2+2+3).
    maskTimerInput(raw) {
      const digits = String(raw || "")
        .replace(/\D/g, "")
        .slice(0, 9);
      let out = "";
      for (let i = 0; i < digits.length; i++) {
        if (i === 2 || i === 4) out += ":";
        else if (i === 6) out += ".";
        out += digits[i];
      }
      return out;
    },
    onTimerInput(event, propName) {
      const masked = this.maskTimerInput(event.target.value);
      if (event.target.value !== masked) event.target.value = masked;
      this.$emit(`update:${propName}`, masked);
    },
    formatTime(v) {
      if (v === null || v === undefined) return "—";
      let raw = typeof v === "number" ? String(Math.trunc(v)) : String(v);
      raw = raw.trim();
      if (/^\d{1,2}:\d{2}:\d{2}(?:\.\d{1,3})?$/.test(raw)) return raw;
      let digits = raw.replace(/\D+/g, "");
      if (!digits) return "—";
      if (digits.length <= 9) {
        const s = digits.padStart(9, "0");
        const HH = s.slice(0, 2);
        const MM = s.slice(2, 4);
        const SS = s.slice(4, 6);
        const mmm = s.slice(6, 9);
        return `${HH}:${MM}:${SS}.${mmm}`;
      }
      if (digits.length >= 10 && digits.length <= 13) {
        if (digits.length === 10) digits = digits + "000";
        const t = Number(digits);
        const d = new Date(t);
        if (!isNaN(d.getTime())) {
          return this._fmtClock(d);
        }
      }
      return raw;
    },

    _pad2(n) {
      return String(n).padStart(2, "0");
    },
    _pad3(n) {
      return String(n).padStart(3, "0");
    },

    _fmtClock(d) {
      const hh = this._pad2(d.getHours());
      const mm = this._pad2(d.getMinutes());
      const ss = this._pad2(d.getSeconds());
      const ms = this._pad3(d.getMilliseconds());
      return `${hh}:${mm}:${ss}.${ms}`;
    },
    // Info satu baris Live Feed: waktu terformat + ke buffer mana waktunya
    // masuk kalau diklik. Aturannya SAMA dgn yg dipakai saat data datang:
    //   "LR…" (Long Range Start)  -> Start
    //   "PF…" (Photo Finish)      -> Finish
    //   frame RaceTime2           -> classifyFrame(): start -> Start,
    //                                finish/lap -> Finish (lihat
    //                                serialPortMixin onStart/onFinish/onLap)
    feedRow(index) {
      const id = String((this.digitId || [])[index] || "");
      const time = this.formatTime((this.digitTime || [])[index]);
      let kind = null;
      if (id.startsWith("LR")) kind = "start";
      else if (id.startsWith("PF")) kind = "finish";
      else kind = classifyFrame(id);

      let target = null;
      if (kind === "start") target = "start";
      else if (kind === "finish" || kind === "lap") target = "finish";
      if (!FEED_TIME_RE.test(time)) target = null; // tanpa waktu valid

      const label = kind === "lap" ? "LAP" : target ? target.toUpperCase() : "";
      const hint = target
        ? `Klik utk salin ${time} ke Get Time ${target === "start" ? "Start" : "Finish"}`
        : "";
      return { time, target, label, hint };
    },
    applyFeedRow(index) {
      const row = this.feedRow(index);
      if (!row.target) return;
      const prop = row.target === "start" ? "digitTimeStart" : "digitTimeFinish";
      this.$emit(`update:${prop}`, row.time);
      this.flashField = row.target;
      clearTimeout(this._flashTimer);
      this._flashTimer = setTimeout(() => {
        this.flashField = null;
      }, 700);
    },

    // Data tiap tile BIB utk satu buffer. `index` = posisi ASLI di
    // `participant` (dipakai emit update-time), tetap benar walau difilter.
    tilesFor(type, applyFilter = true) {
      const isStart = type === "start";
      const tiles = (this.participant || []).map((btn, index) => {
        const done = isStart ? this.hasStartTime(btn) : this.hasFinishTime(btn);
        const bye = this.isByeTeam(btn);
        const noHeat = this.needsHeat(btn);
        const name = String((btn && (btn.nameTeam || btn.teamName)) || "-");
        let state = "ready";
        let sub = name;
        let title = name;
        if (bye) {
          state = "blocked";
          sub = "BYE";
          title = "Tim BYE — tidak perlu waktu";
        } else if (noHeat) {
          state = "blocked";
          sub = "Belum Heat";
          title = "Heat belum ditentukan — assign dulu lewat bagan";
        } else if (done) {
          state = "done";
          const t = isStart ? btn.result.startTime : btn.result.finishTime;
          sub = this.formatTime(t);
          title = `${name} — ${isStart ? "start" : "finish"} ${sub}`;
        }
        return { index, bib: this.getBib(btn), state, sub, title };
      });
      if (applyFilter && this.filters[type] === "pending") {
        return tiles.filter((t) => t.state === "ready");
      }
      return tiles;
    },
    pendingCount(type) {
      return this.tilesFor(type, false).filter((t) => t.state === "ready")
        .length;
    },
    doneCount(type) {
      const isStart = type === "start";
      return (this.participant || []).filter((btn) =>
        isStart ? this.hasStartTime(btn) : this.hasFinishTime(btn)
      ).length;
    },
    hasStartTime(btn) {
      return btn && btn.result && !!btn.result.startTime;
    },
    hasFinishTime(btn) {
      return btn && btn.result && !!btn.result.finishTime;
    },
    getBib(btn) {
      return btn && typeof btn.bibTeam !== "undefined" ? btn.bibTeam : "-";
    },
    isByeTeam(btn) {
      if (!this.byeNames || !this.byeNames.length) return false;
      const nm = String((btn && (btn.nameTeam || btn.teamName)) || "").toUpperCase();
      if (!nm) return false;
      return this.byeNames.some((n) => String(n).toUpperCase() === nm);
    },
    needsHeat(btn) {
      if (!this.requireHeat || this.isByeTeam(btn)) return false;
      const heat = btn && btn.result && btn.result.heat;
      return heat === null || heat === undefined || heat === "";
    },
  },
};
</script>

<style scoped>
.form-control {
  border-radius: 12px;
}

.race-window {
  background: #2f2f2f;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.race-window:hover {
  box-shadow: 0 0 15px rgba(0, 180, 255, 0.6), 0 0 30px rgba(0, 180, 255, 0.5),
    0 0 60px rgba(0, 180, 255, 0.4);
}

.section-title {
  font-weight: 800;
  font-size: 1.2rem;
  color: #ffffff;
}

.section-desc {
  color: #ffffff;
  max-width: 1040px;
  margin: 0 auto;
}

.time-source-bar {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding: 6px 8px 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.time-source-bar__label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.card-time {
  border-radius: 20px;
}

/* Panel putih, ukuran tetap */
.feed-panel {
  background: #fff;
  border: 1px solid #e6ebf4;
  border-radius: 20px;
  overflow: hidden;
}

/* Tabel rapi + header lengket (opsional) */
.table-rounded {
  border-collapse: separate;
  border-spacing: 0;
}

.table-rounded thead th {
  background: #fff;
  color: #4a4a4a;
  font-weight: 700;
  padding: 12px 15px;
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 1px solid #e6ebf4;
}

.table-rounded thead th:first-child {
  border-top-left-radius: 18px;
}

.table-rounded thead th:last-child {
  border-top-right-radius: 18px;
}

.table-rounded tbody td {
  background: #fff;
  color: #111827;
  padding: 10px 15px;
  border-bottom: 1px solid #f3f4f6;
}

.table-rounded tbody tr:nth-child(odd) td {
  background: #fafafa;
}

.table-rounded th,
.table-rounded td {
  border: none;
}

/* ===== Layout tinggi tetap =====
   Feed (kiri) setinggi 2 card buffer + jarak di antaranya, supaya kolom
   kiri & kanan rata bawah. Tombol BIB scroll di dalam card-nya sendiri. */
.feed-scroll {
  height: 596px; /* 2 x 290 + 16 (mt-3) */
  overflow: auto;
}
.card-fixed {
  height: 290px;
  border-radius: 15px;
  overflow: hidden;
}
.card-fixed .card-body {
  height: 100%;
  padding: 16px 18px;
}
.card-fixed .row {
  height: 100%;
}
.min-h-0 {
  min-height: 0;
}
.btn-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px 4px 4px 2px;
  -webkit-overflow-scrolling: touch;
}

/* ===== Toolbar di atas grid: jumlah tercatat + filter Belum/Semua ===== */
.bib-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.bib-toolbar__count {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}
.bib-filter {
  display: inline-flex;
  background: #f1f5fb;
  border: 1px solid #e6edf6;
  border-radius: 9px;
  padding: 3px;
  gap: 2px;
}
.bib-filter__btn {
  border: none;
  background: transparent;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 7px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.bib-filter__btn:hover {
  color: #1c4c7a;
}
.bib-filter__btn.active {
  background: #ffffff;
  color: #1c4c7a;
  box-shadow: 0 1px 4px rgba(28, 76, 122, 0.15);
}

/* ===== Grid tile BIB ===== */
.bib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 8px;
}

.bib-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 64px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  transition: transform 0.08s ease, box-shadow 0.15s ease,
    filter 0.15s ease;
}
.bib-tile__num {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}
.bib-tile__check {
  font-size: 14px;
  margin-right: 2px;
}
.bib-tile__sub {
  max-width: 100%;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}

/* Siap dicatat — paling menonjol */
.bib-tile--ready {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(28, 76, 122, 0.25);
}
.bib-tile--ready .bib-tile__sub {
  color: rgba(255, 255, 255, 0.85);
}
.bib-tile--ready:hover {
  filter: brightness(1.08);
  box-shadow: 0 6px 14px rgba(28, 76, 122, 0.35);
}
.bib-tile--ready:active {
  transform: scale(0.96);
}
.bib-tile--ready:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 176, 235, 0.45);
}

/* Sudah tercatat — tampil waktunya */
.bib-tile--done {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
  cursor: default;
}
.bib-tile--done .bib-tile__sub {
  color: #059669;
}

/* BYE / belum Heat — tidak bisa diklik */
.bib-tile--blocked {
  background: repeating-linear-gradient(
    -45deg,
    #f1f5f9,
    #f1f5f9 6px,
    #e8edf3 6px,
    #e8edf3 12px
  );
  border-color: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

.bib-empty {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 24px 8px;
}

/* ===== Responsif ===== */
@media (max-width: 1199.98px) {
  .feed-scroll {
    height: 556px; /* 2 x 270 + 16 */
  }
  .card-fixed {
    height: 270px;
  }
}

/* < lg: judul/input di atas, grid di bawah — card butuh lebih tinggi */
@media (max-width: 991.98px) {
  .feed-panel {
    border-radius: 16px;
  }
  .feed-scroll {
    height: 320px;
  }
  .card-fixed {
    height: 380px;
  }
}

@media (max-width: 575.98px) {
  .feed-scroll {
    height: 260px;
  }
  .bib-grid {
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 6px;
  }
  .bib-tile {
    height: 56px;
  }
  .bib-tile__num {
    font-size: 17px;
  }
}

/* ===== Live Feed: baris yang bisa diklik ===== */
.feed-row--clickable {
  cursor: pointer;
}
.table-rounded tbody tr.feed-row--clickable:hover td {
  background: #e6f4fd !important;
}
.feed-time-cell {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.feed-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  vertical-align: middle;
}
.feed-tag--start {
  background: #e0f2fe;
  color: #0369a1;
}
.feed-tag--finish {
  background: #fee2e2;
  color: #b91c1c;
}

/* Kedip singkat pada field buffer yg baru diisi dari Live Feed */
.input-flash {
  animation: input-flash 0.7s ease;
}
@keyframes input-flash {
  0% {
    box-shadow: 0 0 0 0 rgba(37, 176, 235, 0.7);
    background: #e6f4fd;
  }
  100% {
    box-shadow: 0 0 0 8px rgba(37, 176, 235, 0);
    background: #ffffff;
  }
}

.highlight-row td {
  background-color: #eef58c !important;
  font-weight: 600;
}
</style>
