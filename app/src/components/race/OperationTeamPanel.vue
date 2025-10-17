<template>
  <div class="px-5 py-2">
    <div class="card p-3 race-window">
      <div class="mb-3 text-center">
        <h5 class="section-title">STiming System 424 v2.0.0</h5>
        <small class="section-desc">
          Modul ini menampilkan live feed registrasi dan buffer timer untuk
          start dan finish. Gunakan tombol BIB untuk mencatat waktu secara
          real-time.
        </small>
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
                    <tr
                      v-else
                      v-for="(id, index) in digitId"
                      :key="'feed-' + index"
                      :class="{ 'highlight-row': index === 0 }"
                    >
                      <td>{{ id }}</td>
                      <td>{{ digitTime[index] }}</td>
                      <td>{{ formatTime(digitTime[index]) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </b-col>

          <!-- RIGHT: Start / Finish Buffer & Buttons -->
          <b-col cols="12" md class="pl-md-3">
            <!-- START -->
            <div class="card card-fixed">
              <!-- tingginya tetap -->
              <div class="card-body h-100 d-flex flex-column">
                <b-row no-gutters class="h-100">
                  <!-- kiri: judul + input (tetap) -->
                  <b-col class="d-flex flex-column pr-md-3">
                    <h5 class="card-title" style="font-weight: 800">
                      Buffer-Timer-Start
                    </h5>
                    <b-row>
                      <b-col>
                        <p>Get Time Start</p>
                        <div class="input-group mb-3">
                          <input
                            :value="digitTimeStart"
                            @input="
                              $emit(
                                'update:digitTimeStart',
                                $event.target.value
                              )
                            "
                            type="text"
                            class="form-control"
                            placeholder="Timer"
                          />
                        </div>
                      </b-col>
                    </b-row>
                  </b-col>

                  <!-- kanan: tombol (scroll di sini) -->
                  <b-col
                    cols="12"
                    md="4"
                    class="d-flex flex-column h-100 min-h-0 mt-3 mt-md-0"
                  >
                    <div class="btn-scroll">
                      <button
                        v-for="(button, index) in participant"
                        :key="'start-' + index"
                        type="button"
                        class="btn custom-btn btn-block"
                        :disabled="hasStartTime(button)"
                        :class="
                          hasStartTime(button) ? 'btn-secondary' : 'btn-info'
                        "
                        @click="
                          $emit('update-time', digitTimeStart, index, 'start')
                        "
                      >
                        {{ "BIB " + getBib(button) }}
                      </button>
                    </div>
                  </b-col>
                </b-row>
              </div>
            </div>
            <!-- END START -->

            <br />

            <!-- FINISH -->
            <div class="card card-fixed">
              <div class="card-body h-100 d-flex flex-column">
                <b-row no-gutters class="h-100">
                  <b-col class="d-flex flex-column pr-md-3">
                    <h5 class="card-title" style="font-weight: 800">
                      Buffer-Timer-Finish
                    </h5>
                    <b-row>
                      <b-col>
                        <p>Get Time Finish</p>
                        <div class="input-group mb-3">
                          <input
                            :value="digitTimeFinish"
                            @input="
                              $emit(
                                'update:digitTimeFinish',
                                $event.target.value
                              )
                            "
                            type="text"
                            class="form-control"
                            placeholder="Timer"
                          />
                        </div>
                      </b-col>
                    </b-row>
                  </b-col>

                  <!-- kanan: tombol (scroll di sini) -->
                  <b-col
                    cols="12"
                    md="4"
                    class="d-flex flex-column h-100 min-h-0 mt-3 mt-md-0"
                  >
                    <div class="btn-scroll">
                      <button
                        v-for="(button, index) in participant"
                        :key="'finish-' + index"
                        type="button"
                        class="btn custom-btn btn-block"
                        :disabled="hasFinishTime(button)"
                        :class="
                          hasFinishTime(button) ? 'btn-secondary' : 'btn-info'
                        "
                        @click="
                          $emit('update-time', digitTimeFinish, index, 'finish')
                        "
                      >
                        {{ "BIB " + getBib(button) }}
                      </button>
                    </div>
                  </b-col>
                </b-row>
              </div>
            </div>
            <!-- END FINISH -->
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "OperationTimePanel",
  data() {
    return {
      a: null,
    };
  },
  props: {
    digitId: { type: Array, default: () => [] },
    digitTime: { type: Array, default: () => [] },
    participant: { type: Array, default: () => [] },
    digitTimeStart: { type: String, default: "" },
    digitTimeFinish: { type: String, default: "" },
  },
  computed: {},
  methods: {
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
    hasStartTime(btn) {
      return btn && btn.result && !!btn.result.startTime;
    },
    hasFinishTime(btn) {
      return btn && btn.result && !!btn.result.finishTime;
    },
    getBib(btn) {
      return btn && typeof btn.bibTeam !== "undefined" ? btn.bibTeam : "-";
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

.card-time {
  border-radius: 20px;
}

.custom-btn {
  margin: 5px;
  width: 120px;
}

/* Panel putih, ukuran tetap */
.feed-panel {
  background: #fff;
  border: 1px solid #e6ebf4;
  border-radius: 20px;
  overflow: hidden;
}

/* Tinggi SELALU tetap; scroll jika konten lebih */
.feed-scroll {
  height: 500px;
  overflow: auto;
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

.card-fixed.finish {
  height: 300px;
}

/* default (≥992px: md ke atas) */
.feed-scroll {
  height: 500px;
  overflow: auto;
}
.card-fixed {
  height: 260px;
  border-radius: 15px;
  overflow: hidden;
}
.card-fixed .card-body {
  height: 100%;
}
.card-fixed .row {
  height: 100%;
}
.min-h-0 {
  min-height: 0;
}
.btn-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  -webkit-overflow-scrolling: touch;
}

/* ≤1199px (lg ke bawah): sedikit lebih pendek */
@media (max-width: 1199.98px) {
  .feed-scroll {
    height: 420px;
  }
  .card-fixed {
    height: 240px;
  }
}

/* ≤991px (md ke bawah / tablet & mobile): stack vertikal */
@media (max-width: 991.98px) {
  .feed-panel {
    border-radius: 16px;
  }
  .feed-scroll {
    height: 320px;
  } /* feed jadi sedikit lebih rendah */
  .card-fixed {
    height: 260px;
  } /* card tetap fixed */
  .btn-scroll {
    max-height: 100%;
  } /* pastikan tetap scroll */
}

/* ≤575px (xs): lebih kompak di ponsel kecil */
@media (max-width: 575.98px) {
  .feed-scroll {
    height: 260px;
  }
  .card-fixed {
    height: 240px;
  }
  .custom-btn {
    margin: 4px 0;
  } /* tombol lebih rapat */
}

/* Card START fixed height */
.card-fixed {
  border-radius: 15px;
  height: 240px;
  /* atur sesuai selera */
  overflow: hidden;
  /* cegah isi mendorong card */
}

.card-fixed .card-body {
  height: 100%;
}

.card-fixed .row {
  height: 100%;
}

/* supaya kolom kanan bisa menyusut & jadi container scroll */
.min-h-0 {
  min-height: 0;
}

/* area tombol yang scroll */
.btn-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  -webkit-overflow-scrolling: touch;
}

/* tombol rapi */
.custom-btn {
  margin: 6px 0;
  border-radius: 10px;
  font-size: 18px;
}

.btn-block {
  width: 100%;
}

.highlight-row td {
  background-color: #eef58c !important;
  font-weight: 600;
}
</style>
