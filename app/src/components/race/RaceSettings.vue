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
    <template #modal-header>
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="mb-0 font-weight-bold">Race Setting</h5>
        <!-- 🔸 pakai class custom agar sesuai desain -->
        <b-button size="sm" class="btn-close-red" @click="localShow = false">
          ✕
        </b-button>
      </div>
    </template>

    <!-- Body -->
    <div class="p-4" v-if="!loading">
      <div class="p-4">
        <!-- HEAD TO HEAD -->
        <div class="rs-card mb-3">
          <div class="px-3 py-3">
            <div class="h4 font-weight-bold mb-3">Head to Head</div>
            <div class="font-weight-bold mb-2">Bouyan Setting</div>
            <div class="d-flex flex-wrap align-items-center" style="gap: 28px">
              <b-form-checkbox class="rs-switch" switch v-model="draft.h2h.R1"
                >R1</b-form-checkbox
              >
              <b-form-checkbox class="rs-switch" switch v-model="draft.h2h.R2"
                >R2</b-form-checkbox
              >
              <b-form-checkbox class="rs-switch" switch v-model="draft.h2h.L1"
                >L1</b-form-checkbox
              >
              <b-form-checkbox class="rs-switch" switch v-model="draft.h2h.L2"
                >L2</b-form-checkbox
              >
            </div>
          </div>
        </div>

        <!-- SLALOM -->
        <div class="rs-card mb-3">
          <div class="px-3 py-3">
            <div class="h4 font-weight-bold mb-3">Slalom</div>
            <div class="font-weight-bold mb-2">Gates Setting</div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="mb-0 font-weight-500">Total Gate</label>
            </div>
            <b-form-spinbutton
              v-model="draft.slalom.totalGate"
              :max="maxGate"
              :min="minGate"
              step="1"
              class="w-100"
            />
            <div class="d-flex justify-content-between">
              <small class="text-danger">Min {{ minGate }} Gate</small>
              <small class="text-danger">Max {{ maxGate }} Gate</small>
            </div>
          </div>
        </div>

        <!-- DOWN RIVER RACE -->
        <div class="rs-card mb-3">
          <div class="px-3 py-3">
            <div class="h4 font-weight-bold mb-3">Down River Race</div>
            <div class="font-weight-bold mb-2">Section Setting</div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="mb-0 font-weight-500">Total Section</label>
            </div>
            <b-form-spinbutton
              v-model="draft.drr.totalSection"
              :min="minSection"
              :max="maxSection"
              step="1"
              class="w-100"
            />
            <div class="d-flex justify-content-between">
              <small class="text-danger">Min {{ minSection }} Section</small>
              <small class="text-danger">Max {{ maxSection }} Section</small>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="d-flex justify-content-between align-items-center mt-4">
          <b-button
            style="border-radius: 12px"
            variant="outline-danger"
            @click="close"
            >Cancel</b-button
          >
          <b-button
            style="border-radius: 12px"
            variant="primary"
            class="px-4"
            @click="confirm"
            >Update</b-button
          >
        </div>
      </div>
    </div>

    <div v-else class="p-5 text-center text-muted">Loading…</div>
  </b-modal>
</template>

<script>
import { ipcRenderer } from "electron";

const DEFAULT_SETTINGS = {
  h2h: { R1: true, R2: true, L1: true, L2: true },
  slalom: { totalGate: 14 },
  drr: { totalSection: 5 },
};

export default {
  name: "RaceSettingsModal",
  props: {
    id: { type: String, default: "race-settings-modal" },
    value: { type: Boolean, default: false },
    settings: { type: Object, default: () => ({ ...DEFAULT_SETTINGS }) },
    minGate: { type: Number, default: 8 },
    maxGate: { type: Number, default: 14 },
    minSection: { type: Number, default: 3 },
    maxSection: { type: Number, default: 6 },
    eventId: { type: String, default: "" },
    eventName: { type: String, default: "" },
  },
  data() {
    return {
      localShow: this.value,
      loading: false,
      saving: false, // <-- untuk disable tombol Update
      draft: this.mergeWithDefaults(this.settings),
    };
  },
  watch: {
    value(v) {
      this.localShow = v;
      if (v) {
        this.loading = true;
        this.fetchSettingsIPC();
      }
    },
    localShow(v) {
      this.$emit("input", v);
    },
    settings: {
      deep: true,
      handler(newVal) {
        if (!this.localShow) {
          this.draft = this.mergeWithDefaults(newVal);
        }
      },
    },
  },
  mounted() {
    if (this.eventId) this.fetchSettingsIPC();
  },
  methods: {
    _clone(obj) {
      try {
        return JSON.parse(JSON.stringify(obj || {}));
      } catch {
        return this.mergeWithDefaults({});
      }
    },

    mergeWithDefaults(incoming) {
      const src = incoming && typeof incoming === "object" ? incoming : {};
      const toInt = (v, fb) => {
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : fb;
      };
      return {
        h2h: {
          R1: !!(src.h2h && src.h2h.R1),
          R2: !!(src.h2h && src.h2h.R2),
          L1: !!(src.h2h && src.h2h.L1),
          L2: !!(src.h2h && src.h2h.L2),
        },
        slalom: {
          totalGate: toInt(src.slalom && src.slalom.totalGate, 14),
        },
        drr: {
          totalSection: toInt(src.drr && src.drr.totalSection, 5),
        },
      };
    },

    async fetchSettingsIPC() {
      try {
        if (typeof ipcRenderer === "undefined" || !this.eventId) {
          this.loading = false;
          return;
        }
        const token = Date.now();
        this._lastFetchToken = token;

        ipcRenderer.send("race-settings:get", this.eventId);
        ipcRenderer.once("race-settings:get-reply", (_e, res) => {
          if (this._lastFetchToken !== token) return; // abaikan balasan lama
          if (res && res.ok && res.settings) {
            this.draft = this.mergeWithDefaults(res.settings);
          } else {
            this.draft = this.mergeWithDefaults({});
          }
          this.loading = false;
        });
      } catch (err) {
        this.draft = this.mergeWithDefaults({});
        this.loading = false;
      }
    },

    close() {
      if (this.saving) return; // hindari menutup saat sedang simpan
      this.localShow = false;
    },

    confirm() {
      if (!this.eventId) {
        return;
      }

      // 1) Clamp nilai lokal
      const gRaw =
        this.draft && this.draft.slalom && this.draft.slalom.totalGate;
      const sRaw = this.draft && this.draft.drr && this.draft.drr.totalSection;
      const g = Number.isFinite(parseInt(gRaw, 10)) ? parseInt(gRaw, 10) : 14;
      const s = Number.isFinite(parseInt(sRaw, 10)) ? parseInt(sRaw, 10) : 5;

      // Clamp dengan minGate & maxGate
      this.draft.slalom.totalGate = Math.max(
        this.minGate,
        Math.min(this.maxGate, g)
      );

      this.draft.drr.totalSection = Math.max(
        this.minSection,
        Math.min(this.maxSection, s)
      );

      const payload = {
        eventId: String(this.eventId),
        eventName: String(this.eventName || ""),
        settings: this._clone(this.draft),
      };

      // 2) IPC upsert
      try {
        if (typeof ipcRenderer === "undefined") {
          return;
        }

        this.saving = true;

        ipcRenderer.send("race-settings:upsert", {
          eventId: payload.eventId,
          settings: payload.settings,
        });

        ipcRenderer.once("race-settings:upsert-reply", (_e, res) => {
          this.saving = false;

          if (res && res.ok) {
            // Sinkronkan draft dengan apa yg tersimpan di DB
            const saved = res.settings || payload.settings;
            this.draft = this.mergeWithDefaults(saved);

            // 3) Emit ke parent supaya state induk ikut ter-update
            this.$emit("update-settings", {
              eventId: payload.eventId,
              eventName: payload.eventName,
              settings: saved,
            });

            // (opsional) toast sukses
            this.$bvToast &&
              this.$bvToast.toast("Race settings updated", {
                title: "Success",
                variant: "success",
                solid: true,
              });

            // 4) Tutup modal
            this.localShow = false;
          } else {
            const errMsg = res && res.error ? res.error : "Unknown error";
            this.$bvToast &&
              this.$bvToast.toast(errMsg, {
                title: "Update Failed",
                variant: "danger",
                solid: true,
              });
          }
        });
      } catch (err) {
        this.saving = false;
      }
    },
  },
};
</script>

<style>
/* Konten modal (kena karena global) */
.rounded-20 {
  border-radius: 20px;
}

/* Tombol close bulat merah */
.btn-close-red {
  background: #ffe5e5;
  border: none;
  color: #c62828;
  font-weight: bold;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.btn-close-red:hover {
  background: #f8d7da;
  color: #b71c1c;
}

.rs-switch {
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  margin-right: 12px;
}

.rs-switch .custom-control-label {
  cursor: pointer;
}
</style>
