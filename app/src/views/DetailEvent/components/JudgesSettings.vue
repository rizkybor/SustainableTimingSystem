<template>
  <b-modal
    :id="id"
    v-model="localShow"
    hide-footer
    centered
    size="lg"
    body-class="p-0"
    content-class="rounded-20 overflow-hidden"
  >
    <!-- Header -->
    <template #modal-header>
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="mb-0 font-weight-bold">Judges Setting</h5>
        <b-button size="sm" class="btn-close-red" @click="close">✕</b-button>
      </div>
    </template>

    <!-- Body -->
    <div v-if="!loading" class="p-4">
      <div class="p-2 p-md-3">
        <!-- SPRINT -->
        <section class="rs-card mb-3">
          <div class="rs-section-title">Sprint</div>
          <b-row>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Start</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.sprint.juryStart"
              />
            </b-col>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Finish</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.sprint.juryFinish"
              />
            </b-col>
          </b-row>
        </section>

        <!-- HEAD TO HEAD -->
        <section class="rs-card mb-3">
          <div class="rs-section-title">Head to Head</div>
          <b-row>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Start</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.h2h.juryStart"
              />
            </b-col>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Finish</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.h2h.juryFinish"
              />
            </b-col>
          </b-row>

          <b-row>
            <b-col
              md="3"
              class="mb-3"
              v-for="key in enabledBouyanKeys"
              :key="key"
            >
              <label class="form-label">Bouyan {{ key }}</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.h2hValues[key]"
              />
            </b-col>
          </b-row>
        </section>

        <!-- SLALOM -->
        <section class="rs-card mb-3">
          <div class="rs-section-title">Slalom</div>
          <b-row>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Start</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.slalom.juryStart"
              />
            </b-col>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Finish</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.slalom.juryFinish"
              />
            </b-col>
          </b-row>

          <b-row>
            <b-col
              md="3"
              class="mb-3"
              v-for="n in gatesCount"
              :key="'gate-' + n"
            >
              <label class="form-label">Gate {{ n }}</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.slalom.gates[n]"
              />
            </b-col>
          </b-row>
        </section>

        <!-- DOWN RIVER RACE -->
        <section class="rs-card mb-3">
          <div class="rs-section-title">Down River Race</div>
          <b-row>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Start</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.drr.juryStart"
              />
            </b-col>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Finish</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.drr.juryFinish"
              />
            </b-col>
          </b-row>

          <b-row>
            <b-col
              md="3"
              class="mb-3"
              v-for="n in sectionsCount"
              :key="'section-' + n"
            >
              <label class="form-label">Section {{ n }}</label>
              <b-form-select
                class="rs-select"
                :disabled="saving"
                :options="resolvedJuryOptions"
                v-model="draft.drr.sections[n]"
              />
            </b-col>
          </b-row>
        </section>

        <!-- Footer -->
        <div class="d-flex justify-content-between align-items-center mt-4">
          <b-button
            variant="outline-danger"
            class="px-4 rounded-12"
            :disabled="saving"
            @click="close"
          >
            Cancel
          </b-button>
          <b-button
            variant="primary"
            class="px-4 rounded-12"
            :disabled="saving"
            @click="confirm"
          >
            {{ saving ? "Saving…" : "Update" }}
          </b-button>
        </div>
      </div>
    </div>

    <div v-else class="p-5 text-center text-muted">Loading…</div>
  </b-modal>
</template>

<script>
import { ipcRenderer } from "electron";

function makeIndexedMap(n, fill) {
  const obj = {};
  for (let i = 1; i <= n; i++) {
    obj[i] = fill;
  }
  return obj;
}

export default {
  name: "JudgesSettings",
  props: {
    id: { type: String, default: "judges-settings-modal" },
    value: { type: Boolean, default: false },
    settings: {
      type: Object,
      default: function () {
        return {};
      },
    },
    maxGate: { type: Number, default: 8 },
    maxSection: { type: Number, default: 4 },
    eventId: { type: String, default: "" },
    eventName: { type: String, default: "" },
    juryOptions: {
      type: Array,
      default: function () {
        return [];
      },
    },
  },

  data: function () {
    return {
      localShow: this.value,
      loading: false,
      saving: false,
      internalJuryOptions: [],
      draft: this.mergeWithDefaults(this.settings),
    };
  },

  computed: {
    enabledBouyanKeys() {
      var out = [];
      var flags = this.draft && this.draft.h2hFlags ? this.draft.h2hFlags : {};
      var keys = ["R1", "R2", "L1", "L2"];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (flags[k] === true) out.push(k);
      }
      return out;
    },
    gatesCount() {
      var n = this.draft && this.draft.slalom ? this.draft.slalom.totalGate : 0;
      return n && n > 0 ? n : 1;
    },
    sectionsCount() {
      var n = this.draft && this.draft.drr ? this.draft.drr.totalSection : 0;
      return n && n > 0 ? n : 1;
    },
    resolvedJuryOptions: function () {
      let base = [];
      if (
        Array.isArray(this.internalJuryOptions) &&
        this.internalJuryOptions.length > 0
      ) {
        base = this.internalJuryOptions;
      } else if (Array.isArray(this.juryOptions)) {
        base = this.juryOptions;
      }

      let normalized = [];
      if (Array.isArray(base)) {
        normalized = base.map(function (x) {
          if (typeof x === "string") {
            return { value: x, text: x };
          }
          const val =
            x &&
            (x.value !== undefined ? x.value : x.id !== undefined ? x.id : "");
          const txt =
            x &&
            (x.text !== undefined
              ? x.text
              : x.name !== undefined
              ? x.name
              : "");
          return { value: val, text: txt };
        });
      }
      return [{ value: "", text: "Select jury name" }].concat(normalized);
    },
  },

  watch: {
    value: function (v) {
      this.localShow = v;
      if (v) {
        this.loading = true;
        this.fetchSettingsIPC();
        this.fetchJuryOptionsIPC();
      }
    },
    localShow: function (v) {
      this.$emit("input", v);
    },
    settings: {
      deep: true,
      handler: function (newVal) {
        if (!this.localShow) {
          this.draft = this.mergeWithDefaults(newVal);
        }
      },
    },
    // bila angka gate yang dipakai berubah, rebuild map gates
    "draft.slalom.totalGate": function (val) {
      var total = clampInt(val, 1, this.maxGate, this.maxGate);
      this.draft.slalom.totalGate = total;
      this.draft.slalom.gates = trimIndexedMap(
        Object.assign({}, makeIndexedMap(total, ""), this.draft.slalom.gates),
        total
      );
    },

    // bila angka section berubah, rebuild map sections (opsional, simetri)
    "draft.drr.totalSection": function (val) {
      var total = clampInt(val, 1, this.maxSection, this.maxSection);
      this.draft.drr.totalSection = total;
      this.draft.drr.sections = trimIndexedMap(
        Object.assign({}, makeIndexedMap(total, ""), this.draft.drr.sections),
        total
      );
    },

    // kalau kamu masih ingin mempertahankan watcher pada prop maxGate/maxSection dari parent:
    maxGate: function () {
      var total = clampInt(
        this.draft.slalom.totalGate,
        1,
        this.maxGate,
        this.maxGate
      );
      this.draft.slalom.totalGate = total;
      this.draft.slalom.gates = trimIndexedMap(
        Object.assign({}, makeIndexedMap(total, ""), this.draft.slalom.gates),
        total
      );
    },
    maxSection: function () {
      var total = clampInt(
        this.draft.drr.totalSection,
        1,
        this.maxSection,
        this.maxSection
      );
      this.draft.drr.totalSection = total;
      this.draft.drr.sections = trimIndexedMap(
        Object.assign({}, makeIndexedMap(total, ""), this.draft.drr.sections),
        total
      );
    },
  },

  mounted: function () {
    if (this.eventId) {
      this.fetchSettingsIPC();
    }
    if (!(Array.isArray(this.juryOptions) && this.juryOptions.length > 0)) {
      this.fetchJuryOptionsIPC();
    }
  },

  methods: {
    drrExists: function () {
      return !!(this.draft && this.draft.drr && this.draft.drr.sections);
    },
    _clone: function (obj) {
      return JSON.parse(JSON.stringify(obj || {}));
    },
    mergeWithDefaults(incoming) {
      var src = incoming && typeof incoming === "object" ? incoming : {};

      // ---- H2H flags dari Race Settings (true/false)
      var fR1 =
        src.h2h && typeof src.h2h.R1 !== "undefined" ? !!src.h2h.R1 : false;
      var fR2 =
        src.h2h && typeof src.h2h.R2 !== "undefined" ? !!src.h2h.R2 : false;
      var fL1 =
        src.h2h && typeof src.h2h.L1 !== "undefined" ? !!src.h2h.L1 : false;
      var fL2 =
        src.h2h && typeof src.h2h.L2 !== "undefined" ? !!src.h2h.L2 : false;

      // ---- Nilai jurinya (kalau sudah pernah disimpan)
      var hv =
        src.h2hValues && typeof src.h2hValues === "object" ? src.h2hValues : {};

      // ---- Slalom & DRR counts dari Race Settings
      var totalGate =
        src.slalom && src.slalom.totalGate ? src.slalom.totalGate : 1;
      var totalSection =
        src.drr && src.drr.totalSection ? src.drr.totalSection : 1;

      // ---- Build
      return {
        sprint: {
          juryStart: (src.sprint && src.sprint.juryStart) || "",
          juryFinish: (src.sprint && src.sprint.juryFinish) || "",
        },
        h2h: {
          juryStart: (src.h2h && src.h2h.juryStart) || "",
          juryFinish: (src.h2h && src.h2h.juryFinish) || "",
        },
        h2hFlags: { R1: fR1, R2: fR2, L1: fL1, L2: fL2 },
        h2hValues: {
          R1: hv.R1 || "",
          R2: hv.R2 || "",
          L1: hv.L1 || "",
          L2: hv.L2 || "",
        },
        slalom: {
          juryStart: (src.slalom && src.slalom.juryStart) || "",
          juryFinish: (src.slalom && src.slalom.juryFinish) || "",
          totalGate: totalGate,
          gates: src.slalom && src.slalom.gates ? src.slalom.gates : {}, // optional: kalau kamu juga simpan juri per gate
        },
        drr: {
          juryStart: (src.drr && src.drr.juryStart) || "",
          juryFinish: (src.drr && src.drr.juryFinish) || "",
          totalSection: totalSection,
          sections: src.drr && src.drr.sections ? src.drr.sections : {}, // optional: kalau kamu juga simpan juri per section
        },
      };
    },
    fetchSettingsIPC: function () {
      try {
        if (!this.eventId || typeof ipcRenderer === "undefined") {
          this.loading = false;
          return;
        }
        const token = Date.now();
        this._lastFetchToken = token;

        ipcRenderer.send("race-settings:get", this.eventId);
        ipcRenderer.once("race-settings:get-reply", (_e, res) => {
          console.log(res, "<< cek res");
          if (this._lastFetchToken !== token) return;
          if (res && res.ok && res.settings) {
            this.draft = this.mergeWithDefaults(res.settings);
          } else {
            this.draft = this.mergeWithDefaults({});
          }

          console.log(this.draft, "<< cek draft");
          this.loading = false;
        });
      } catch (err) {
        this.draft = this.mergeWithDefaults({});
        this.loading = false;
      }
    },
    fetchJuryOptionsIPC: function () {
      try {
        if (typeof ipcRenderer === "undefined") return;
        ipcRenderer.send("jury:list");
        ipcRenderer.once("jury:list-reply", (_e, res) => {
          if (res && res.ok && Array.isArray(res.items)) {
            this.internalJuryOptions = res.items.map(function (u) {
              return {
                value:
                  u.id || (u._id && u._id.$oid) || u._id || u.email || u.name,
                text: u.name || u.fullName || u.email || String(u.id || ""),
              };
            });
          } else {
            this.internalJuryOptions = [];
          }
        });
      } catch {
        this.internalJuryOptions = [];
      }
    },
    close: function () {
      if (this.saving) return;
      this.localShow = false;
    },
    confirm: function () {
      if (!this.eventId || this.saving) return;
      const payload = {
        eventId: String(this.eventId),
        eventName: String(this.eventName || ""),
        settings: this._clone(this.draft),
      };
      try {
        if (typeof ipcRenderer === "undefined") return;
        this.saving = true;
        ipcRenderer.send("race-settings:upsert", {
          eventId: payload.eventId,
          settings: payload.settings,
        });
        ipcRenderer.once("race-settings:upsert-reply", (_e, res) => {
          this.saving = false;
          if (res && res.ok) {
            const saved = res.settings || payload.settings;
            this.draft = this.mergeWithDefaults(saved);
            this.$emit("update-judges", {
              eventId: payload.eventId,
              eventName: payload.eventName,
              settings: saved,
            });
            if (this.$bvToast) {
              this.$bvToast.toast("Judges settings updated", {
                title: "Success",
                variant: "success",
                solid: true,
              });
            }
            this.localShow = false;
          } else {
            const errMsg = (res && res.error) || "Failed to update settings";
            if (this.$bvToast) {
              this.$bvToast.toast(errMsg, {
                title: "Update Failed",
                variant: "danger",
                solid: true,
              });
            }
          }
        });
      } catch {
        this.saving = false;
      }
    },
  },
};
</script>

<style>
.rounded-20 {
  border-radius: 20px;
}
.btn-close-red {
  background: #ffe5e5;
  border: none;
  color: #c62828;
  font-weight: bold;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.btn-close-red:hover {
  background: #f8d7da;
  color: #b71c1c;
}
.rounded-12 {
  border-radius: 12px;
}
.rs-card {
  border: 1px solid #e6ebf4;
  border-radius: 16px;
  background: #fff;
  padding: 18px 16px;
  box-shadow: 0 12px 26px rgba(31, 56, 104, 0.08);
}
.rs-section-title {
  font-weight: 800;
  font-size: 20px;
  margin-bottom: 12px;
  color: #1f2940;
}
.form-label {
  margin-bottom: 6px;
  font-weight: 700;
  color: #2b3445;
}
.rs-select {
  height: 42px;
  border-radius: 10px !important;
  border: 1px solid #e6ebf4 !important;
  background: #f7f9fc !important;
  padding: 6px 12px !important;
}
.rs-select:focus {
  background: #fff !important;
  border-color: #9ec5ff !important;
  box-shadow: 0 0 0 4px rgba(42, 104, 196, 0.15) !important;
}
</style>
