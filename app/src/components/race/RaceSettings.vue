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
              style="border-radius: 10px"
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
              style="border-radius: 10px"
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

        <!-- RAFTING CROSS -->
        <div class="rs-card mb-3">
          <div class="px-3 py-3">
            <div class="h4 font-weight-bold mb-3">Rafting Cross</div>
            <div class="font-weight-bold mb-2">Heat Setting</div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="mb-0 font-weight-500">Teams per Heat</label>
            </div>
            <b-form-spinbutton
              style="border-radius: 10px"
              v-model="draft.rx.teamsPerHeat"
              :min="minTeamsPerHeat"
              :max="maxTeamsPerHeat"
              step="1"
              class="w-100"
            />
            <div class="d-flex justify-content-between mb-3">
              <small class="text-danger">Min {{ minTeamsPerHeat }} Teams</small>
              <small class="text-danger">Max {{ maxTeamsPerHeat }} Teams</small>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="mb-0 font-weight-500">Qualifiers per Heat</label>
            </div>
            <b-form-spinbutton
              style="border-radius: 10px"
              v-model="draft.rx.qualifiersPerHeat"
              :min="1"
              :max="draft.rx.teamsPerHeat - 1"
              step="1"
              class="w-100"
            />
            <div class="d-flex justify-content-between mb-3">
              <small class="text-muted"
                >Must be less than Teams per Heat</small
              >
            </div>
            <div class="font-weight-bold mb-2">Gate Penalty</div>
            <div class="d-flex flex-wrap align-items-center" style="gap: 28px">
              <b-form-checkbox
                class="rs-switch"
                switch
                v-model="draft.rx.gate1.enabled"
                >Gate 1</b-form-checkbox
              >
              <b-form-checkbox
                class="rs-switch"
                switch
                v-model="draft.rx.gate2.enabled"
                >Gate 2</b-form-checkbox
              >
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
            class="px-4 btn-confirm"
            variant="outline-primary"
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
  rx: {
    teamsPerHeat: 4,
    qualifiersPerHeat: 2,
    gate1: { enabled: true },
    gate2: { enabled: true },
  },
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
    minTeamsPerHeat: { type: Number, default: 3 },
    maxTeamsPerHeat: { type: Number, default: 8 },
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
    "draft.rx.teamsPerHeat"(v) {
      // qualifiers per heat harus selalu < teams per heat; clamp langsung
      // (bukan cuma pas confirm()) supaya tampilan spinbutton tidak pernah
      // menunjukkan nilai yang sudah melebihi batas max-nya sendiri.
      const max = Number(v) - 1;
      if (this.draft.rx.qualifiersPerHeat > max) {
        this.draft.rx.qualifiersPerHeat = Math.max(1, max);
      }
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
        rx: (() => {
          const teamsPerHeat = Math.max(
            this.minTeamsPerHeat,
            Math.min(
              this.maxTeamsPerHeat,
              toInt(src.rx && src.rx.teamsPerHeat, 4)
            )
          );
          const qualifiersPerHeat = Math.max(
            1,
            Math.min(
              teamsPerHeat - 1,
              toInt(src.rx && src.rx.qualifiersPerHeat, 2)
            )
          );
          const gate1Enabled =
            src.rx && src.rx.gate1 && src.rx.gate1.enabled !== undefined
              ? !!src.rx.gate1.enabled
              : true;
          const gate2Enabled =
            src.rx && src.rx.gate2 && src.rx.gate2.enabled !== undefined
              ? !!src.rx.gate2.enabled
              : true;
          return {
            teamsPerHeat,
            qualifiersPerHeat,
            gate1: { enabled: gate1Enabled },
            gate2: { enabled: gate2Enabled },
          };
        })(),
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

      const tRaw = this.draft && this.draft.rx && this.draft.rx.teamsPerHeat;
      const t = Number.isFinite(parseInt(tRaw, 10)) ? parseInt(tRaw, 10) : 4;
      this.draft.rx.teamsPerHeat = Math.max(
        this.minTeamsPerHeat,
        Math.min(this.maxTeamsPerHeat, t)
      );

      const qRaw =
        this.draft && this.draft.rx && this.draft.rx.qualifiersPerHeat;
      const q = Number.isFinite(parseInt(qRaw, 10)) ? parseInt(qRaw, 10) : 2;
      this.draft.rx.qualifiersPerHeat = Math.max(
        1,
        Math.min(this.draft.rx.teamsPerHeat - 1, q)
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

/* base */
.btn.btn-confirm {
  background: #f0f8ff;
  color: #325a8f;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
  transition: all 0.25s ease;
  border: 1px solid #cfd8e6;
}

/* hover */
.btn.btn-confirm:hover {
  background: #325a8f;
  color: #ffffff;
  border-color: #325a8f;
  box-shadow: 0 0 12px rgba(0, 180, 255, 0.5);
  cursor: pointer;
}

/* active (klik/tahan) */
.btn.btn-confirm:active,
.btn.btn-confirm:focus {
  background: #0d789d;
  color: #ffffff;
  border-color: #0d789d;
}
</style>
