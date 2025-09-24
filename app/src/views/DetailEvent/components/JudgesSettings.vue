<template>
  <b-modal
    :id="id"
    v-model="localShow"
    hide-footer
    centered
    size="xl"
    body-class="p-0"
    content-class="rounded-20 overflow-hidden"
  >
    <!-- Header -->
    <template #modal-header>
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="mb-0 font-weight-bold">Judges Configuration</h5>
        <b-button size="sm" class="btn-close-red" @click="close">✕</b-button>
      </div>
    </template>

    <!-- Body -->
    <div v-if="!loading" class="p-4">
      <div class="p-2 p-md-3">
        <!-- SPRINT -->
        <section class="rs-card mb-3">
          <div class="rs-section-title">Sprint Judges</div>
          <b-row>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Start</label>
              <SearchableSelect
                v-model="draft.sprint.juryStart"
                :options="selectOptions"
                placeholder="Select jury name"
                search-placeholder="Search jury…"
                :clearable="true"
                :show-empty-option="true"
              />
            </b-col>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Finish</label>
              <SearchableSelect
                v-model="draft.sprint.juryFinish"
                :options="selectOptions"
                placeholder="Select jury name"
                search-placeholder="Search jury…"
                :clearable="true"
                :show-empty-option="true"
              />
            </b-col>
          </b-row>
        </section>

        <!-- HEAD TO HEAD -->
        <section class="rs-card mb-3">
          <div class="rs-section-title">Head to Head Judges</div>
          <b-row>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Start</label>
              <SearchableSelect
                v-model="draft.h2h.juryStart"
                :options="selectOptions"
                placeholder="Select jury name"
                search-placeholder="Search jury…"
                :clearable="true"
                :show-empty-option="true"
              />
            </b-col>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Finish</label>
              <SearchableSelect
                v-model="draft.h2h.juryFinish"
                :options="selectOptions"
                placeholder="Select jury name"
                search-placeholder="Search jury…"
                :clearable="true"
                :show-empty-option="true"
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
              <SearchableSelect
                v-model="draft.h2hValues[key]"
                :options="selectOptions"
                placeholder="Select jury name"
                search-placeholder="Search jury…"
                :clearable="true"
                :show-empty-option="true"
              />
            </b-col>
          </b-row>
        </section>

        <!-- SLALOM -->
        <section class="rs-card mb-3">
          <div class="rs-section-title">Slalom Judges</div>
          <b-row>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Start</label>
              <SearchableSelect
                v-model="draft.slalom.juryStart"
                :options="selectOptions"
                placeholder="Select jury name"
                search-placeholder="Search jury…"
                :clearable="true"
                :show-empty-option="true"
              />
            </b-col>
            <b-col md="6" class="mb-3">
              <label class="form-label">Jury Finish</label>
              <SearchableSelect
                v-model="draft.slalom.juryFinish"
                :options="selectOptions"
                placeholder="Select jury name"
                search-placeholder="Search jury…"
                :clearable="true"
                :show-empty-option="true"
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
              <SearchableSelect
                v-model="draft.slalom.gates[n]"
                :options="selectOptions"
                placeholder="Select jury name"
                search-placeholder="Search jury…"
                :clearable="true"
                :show-empty-option="true"
              />
            </b-col>
          </b-row>
        </section>

        <!-- DOWN RIVER RACE -->
        <section class="rs-card mb-3">
          <div class="rs-section-title">Down River Race Judges</div>
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
              <SearchableSelect
                v-model="draft.drr.sections[n]"
                :options="selectOptions"
                placeholder="Select jury name"
                search-placeholder="Search jury…"
                :clearable="true"
                :show-empty-option="true"
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
import SearchableSelect from "@/components/SearchableSelect.vue";

/* ========= helpers ========= */
function pickId(u) {
  if (!u) return "";
  // urutan prioritas id yang mungkin
  if (typeof u.id !== "undefined" && u.id !== null && u.id !== "") return u.id;
  if (u._id && typeof u._id === "string") return u._id;
  if (u._id && typeof u._id === "object" && u._id.$oid) return u._id.$oid;
  if (u.email) return u.email;
  return "";
}

function normalizeUsersToOptions(arr) {
  var out = [];
  if (!Array.isArray(arr)) return out;
  for (var i = 0; i < arr.length; i++) {
    var u = arr[i];
    out.push({
      value: pickId(u), // yang disimpan di v-model
      text: u && u.username ? u.username : u && u.email ? u.email : "Unknown",
      email: u && u.email ? u.email : "",
      username: u && u.username ? u.username : "",
    });
  }
  return out;
}

export default {
  name: "JudgesSettings",
  components: { SearchableSelect },
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
  },

  data: function () {
    return {
      localShow: this.value,
      loading: false,
      saving: false,
      internalJuryOptions: [],
      draft: this.mergeWithDefaults(this.settings),
      juryOptions: {
        type: Array,
        default: function () {
          return [];
        },
      },
      usersRaw: [],
    };
  },

  computed: {
    // opsi untuk semua dropdown juri
    selectOptions: function () {
      var arr = [];
      if (Array.isArray(this.usersRaw)) {
        arr = this.usersRaw;
      }

      var out = [];
      for (var i = 0; i < arr.length; i++) {
        var u = arr[i];
        var id = "";

        if (u && typeof u.id !== "undefined" && u.id !== null && u.id !== "") {
          id = u.id;
        } else if (u && typeof u._id === "string") {
          id = u._id;
        } else if (u && typeof u._id === "object" && u._id.$oid) {
          id = u._id.$oid;
        } else if (u && u.email) {
          id = u.email;
        }

        var text = "Unknown";
        if (u && u.username) {
          text = u.username;
        } else if (u && u.email) {
          text = u.email;
        }

        var opt = {
          value: id,
          text: text,
          disabled: false,
        };
        out.push(opt);
      }

      return out;
    },
    // tampilkan hanya bouyan yang enabled (true) dari race-settings
    enabledBouyanKeys: function () {
      var out = [];
      var flags = this.draft && this.draft.h2hFlags ? this.draft.h2hFlags : {};
      var keys = ["R1", "R2", "L1", "L2"];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (flags[k] === true) out.push(k);
      }
      return out;
    },
    // jumlah gate/section mengikuti angka dari draft (fallback 1)
    gatesCount: function () {
      var n =
        this.draft && this.draft.slalom && this.draft.slalom.totalGate
          ? this.draft.slalom.totalGate
          : 0;
      return n > 0 ? n : 1;
    },
    sectionsCount: function () {
      var n =
        this.draft && this.draft.drr && this.draft.drr.totalSection
          ? this.draft.drr.totalSection
          : 0;
      return n > 0 ? n : 1;
    },
    // opsi akhir untuk select
    resolvedJuryOptions: function () {
      if (
        Array.isArray(this.internalJuryOptions) &&
        this.internalJuryOptions.length > 0
      ) {
        var base = [{ value: "", text: "Select jury name" }];
        return base.concat(this.internalJuryOptions);
      }
      return [{ value: "", text: "Select jury name" }];
    },
  },

  watch: {
    value: function (v) {
      this.localShow = v;
      if (v) {
        this.loading = true;
        this.fetchSettingsIPC();
        this.fetchUsers();
      }
    },
    localShow: function (v) {
      this.$emit("input", v);
    },
    settings: {
      deep: true,
      handler: function (newVal) {
        if (!this.localShow) this.draft = this.mergeWithDefaults(newVal);
      },
    },
  },

  mounted: function () {
    if (this.eventId) this.fetchSettingsIPC();
    if (!(Array.isArray(this.juryOptions) && this.juryOptions.length > 0)) {
      this.fetchUsers();
    } else {
      // kalau parent sudah kirim list user, normalisasi juga
      this.internalJuryOptions = normalizeUsersToOptions(this.juryOptions);
    }
  },

  methods: {
    /* ========== LOAD USERS FOR OPTIONS ========== */
    fetchUsers: function () {
      try {
        if (typeof ipcRenderer === "undefined") {
          return;
        }

        ipcRenderer.removeAllListeners("users:getAll:reply");
        ipcRenderer.send("users:getAll");

        ipcRenderer.once("users:getAll:reply", (_e, res) => {
          var list = [];

          if (res && Array.isArray(res.items)) {
            list = res.items;
          } else if (res && Array.isArray(res.users)) {
            list = res.users;
          } else if (res && res.data && Array.isArray(res.data.users)) {
            list = res.data.users;
          }

          this.usersRaw = list;
        });
      } catch (err) {
        console.error("fetchUsers error:", err);
        this.usersRaw = [];
      }
    },

    /* ========== LOAD SETTINGS ========== */
    fetchSettingsIPC: function () {
      try {
        if (!this.eventId || typeof ipcRenderer === "undefined") {
          this.loading = false;
          return;
        }
        ipcRenderer.removeAllListeners("race-settings:get-reply");
        ipcRenderer.send("race-settings:get", this.eventId);

        ipcRenderer.once("race-settings:get-reply", (_e, res) => {
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

    /* ========== HELPERS ========== */
    _clone: function (obj) {
      return JSON.parse(JSON.stringify(obj || {}));
    },

    mergeWithDefaults: function (incoming) {
      var src = incoming && typeof incoming === "object" ? incoming : {};

      // flags bouyan dari race-setting (true/false)
      var fR1 =
        src.h2h && typeof src.h2h.R1 !== "undefined" ? !!src.h2h.R1 : false;
      var fR2 =
        src.h2h && typeof src.h2h.R2 !== "undefined" ? !!src.h2h.R2 : false;
      var fL1 =
        src.h2h && typeof src.h2h.L1 !== "undefined" ? !!src.h2h.L1 : false;
      var fL2 =
        src.h2h && typeof src.h2h.L2 !== "undefined" ? !!src.h2h.L2 : false;

      // nilai juri yang mungkin sudah pernah disimpan
      var hv =
        src.h2hValues && typeof src.h2hValues === "object" ? src.h2hValues : {};

      // jumlah gate/section dari race-setting
      var totalGate =
        src.slalom && src.slalom.totalGate ? src.slalom.totalGate : 1;
      var totalSection =
        src.drr && src.drr.totalSection ? src.drr.totalSection : 1;

      return {
        sprint: {
          juryStart:
            src.sprint && src.sprint.juryStart ? src.sprint.juryStart : "",
          juryFinish:
            src.sprint && src.sprint.juryFinish ? src.sprint.juryFinish : "",
        },
        h2h: {
          juryStart: src.h2h && src.h2h.juryStart ? src.h2h.juryStart : "",
          juryFinish: src.h2h && src.h2h.juryFinish ? src.h2h.juryFinish : "",
        },
        h2hFlags: { R1: fR1, R2: fR2, L1: fL1, L2: fL2 },
        h2hValues: {
          R1: hv.R1 ? hv.R1 : "",
          R2: hv.R2 ? hv.R2 : "",
          L1: hv.L1 ? hv.L1 : "",
          L2: hv.L2 ? hv.L2 : "",
        },
        slalom: {
          juryStart:
            src.slalom && src.slalom.juryStart ? src.slalom.juryStart : "",
          juryFinish:
            src.slalom && src.slalom.juryFinish ? src.slalom.juryFinish : "",
          totalGate: totalGate,
          // jika Anda juga simpan judge per-gate, ambil; kalau tidak, pakai objek kosong
          gates: src.slalom && src.slalom.gates ? src.slalom.gates : {},
        },
        drr: {
          juryStart: src.drr && src.drr.juryStart ? src.drr.juryStart : "",
          juryFinish: src.drr && src.drr.juryFinish ? src.drr.juryFinish : "",
          totalSection: totalSection,
          // jika Anda juga simpan judge per-section, ambil; kalau tidak, pakai objek kosong
          sections: src.drr && src.drr.sections ? src.drr.sections : {},
        },
      };
    },

    /* ========== ACTIONS ========== */
    close: function () {
      if (this.saving) return;
      this.localShow = false;
    },

    confirm: function () {
      if (!this.eventId || this.saving) return;

      var payload = {
        eventId: String(this.eventId),
        eventName: String(this.eventName || ""),
        settings: this._clone(this.draft),
      };

      // 👉 sementara hanya logging JSON payload
      console.log("=== PAYLOAD UPDATE JUDGES ===");
      console.log(JSON.stringify(payload, null, 2));

      /* 
        try {
            if (typeof ipcRenderer === "undefined") return;

            this.saving = true;
            ipcRenderer.removeAllListeners("race-settings:upsert-reply");
            ipcRenderer.send("race-settings:upsert", {
            eventId: payload.eventId,
            settings: payload.settings,
            });

            ipcRenderer.once("race-settings:upsert-reply", (_e, res) => {
            this.saving = false;
            if (res && res.ok) {
                var saved = res.settings ? res.settings : payload.settings;
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
                var errMsg =
                res && res.error ? res.error : "Failed to update settings";
                if (this.$bvToast) {
                this.$bvToast.toast(errMsg, {
                    title: "Update Failed",
                    variant: "danger",
                    solid: true,
                });
                }
            }
            });
        } catch (err) {
            this.saving = false;
        }
        */
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
