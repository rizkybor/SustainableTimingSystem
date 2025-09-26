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
                :show-empty-option="false"
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
                :show-empty-option="false"
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
                :show-empty-option="false"
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
                :show-empty-option="false"
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
                :show-empty-option="false"
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
                :show-empty-option="false"
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
                :show-empty-option="false"
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
                :show-empty-option="false"
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
                :show-empty-option="false"
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
  if (u.email && String(u.email).trim() !== "") return String(u.email).trim(); // utamakan email
  if (typeof u.idUser !== "undefined" && u.idUser !== null && u.idUser !== "")
    return String(u.idUser);
  if (typeof u.id !== "undefined" && u.id !== null && u.id !== "")
    return String(u.id);
  if (u._id && typeof u._id === "string") return u._id;
  if (u._id && typeof u._id === "object" && u._id.$oid) return u._id.$oid;
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

/* ========= pure helpers ========= */
function mergeWithDefaults(incoming) {
  var src = incoming && typeof incoming === "object" ? incoming : {};

  var fR1 = src.h2h && typeof src.h2h.R1 !== "undefined" ? !!src.h2h.R1 : false;
  var fR2 = src.h2h && typeof src.h2h.R2 !== "undefined" ? !!src.h2h.R2 : false;
  var fL1 = src.h2h && typeof src.h2h.L1 !== "undefined" ? !!src.h2h.L1 : false;
  var fL2 = src.h2h && typeof src.h2h.L2 !== "undefined" ? !!src.h2h.L2 : false;

  var hv =
    src.h2hValues && typeof src.h2hValues === "object" ? src.h2hValues : {};

  var totalGate = src.slalom && src.slalom.totalGate ? src.slalom.totalGate : 1;
  var totalSection = src.drr && src.drr.totalSection ? src.drr.totalSection : 1;

  return {
    sprint: {
      juryStart: src.sprint && src.sprint.juryStart ? src.sprint.juryStart : "",
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
      juryStart: src.slalom && src.slalom.juryStart ? src.slalom.juryStart : "",
      juryFinish:
        src.slalom && src.slalom.juryFinish ? src.slalom.juryFinish : "",
      totalGate: totalGate,
      gates: src.slalom && src.slalom.gates ? src.slalom.gates : {},
    },
    drr: {
      juryStart: src.drr && src.drr.juryStart ? src.drr.juryStart : "",
      juryFinish: src.drr && src.drr.juryFinish ? src.drr.juryFinish : "",
      totalSection: totalSection,
      sections: src.drr && src.drr.sections ? src.drr.sections : {},
    },
  };
}

function toStrId(v) {
  // normalisasi id jadi string aman
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    if (v.$oid) return String(v.$oid);
    if (v.oid) return String(v.oid);
    if (v._id && v._id.$oid) return String(v._id.$oid);
  }
  return String(v);
}

function userHasEvent(user, eventId) {
  if (!user || !Array.isArray(user.mainEvents) || !eventId) return false;
  const target = toStrId(eventId);
  for (let i = 0; i < user.mainEvents.length; i++) {
    const ev = toStrId(user.mainEvents[i]);
    if (ev && ev === target) return true;
  }
  return false;
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
      draft: mergeWithDefaults(this.settings), // ← use helper
      juryOptions: {
        type: Array,
        default: function () {
          return [];
        },
      },
      usersRaw: [],
      previousAssignedEmails: [],
      assignedInfoMap: {},
    };
  },

  computed: {
    // opsi untuk semua dropdown juri
    selectOptions: function () {
      var arr = Array.isArray(this.usersRaw) ? this.usersRaw : [];
      var out = [{ value: "", text: "Select Jury Name" }];
      for (var i = 0; i < arr.length; i++) {
        var u = arr[i];
        var id = pickId(u);
        var text = "Unknown";
        if (u && u.username) text = u.username;
        else if (u && u.email) text = u.email;

        out.push({ value: id, text: text, disabled: false });
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
        this.fetchAssignmentsByUserIPC();
        // this.fetchAssignmentsIPC();
      }
    },
    localShow: function (v) {
      this.$emit("input", v);
    },
    settings: {
      deep: true,
      handler: function (newVal) {
        if (!this.localShow) this.draft = mergeWithDefaults(newVal);
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
    /* ===== utils dasar ===== */
    getAllEmailsForUpsert: function () {
      var curr = this.collectAllEmailsForUpdate(); // dari draft saat ini
      var prev = Array.isArray(this.previousAssignedEmails)
        ? this.previousAssignedEmails
        : [];
      var set = {};
      var out = [];
      for (var i = 0; i < curr.length; i++) {
        var e1 = String(curr[i]).toLowerCase();
        if (!set[e1]) {
          set[e1] = true;
          out.push(curr[i]);
        }
      }
      for (var j = 0; j < prev.length; j++) {
        var e2 = String(prev[j]).toLowerCase();
        if (!set[e2]) {
          set[e2] = true;
          out.push(prev[j]);
        }
      }
      return out;
    },

    getUserInfoByEmail: function (email) {
      var out = { username: "", email: "" };
      if (!email) return out;

      var target = String(email);
      var targetLower = target.toLowerCase();

      // cari di usersRaw dulu
      var arr = Array.isArray(this.usersRaw) ? this.usersRaw : [];
      for (var i = 0; i < arr.length; i++) {
        var u = arr[i] || {};
        var em = u && u.email ? String(u.email) : "";
        if (em && (em === target || em.toLowerCase() === targetLower)) {
          out.email = em;
          out.username = u && u.username ? String(u.username) : em;
          return out;
        }
      }

      // fallback: pakai nama yang tersimpan sebelumnya (kalau ada)
      if (this.assignedInfoMap && this.assignedInfoMap[targetLower]) {
        out.email = target;
        out.username = this.assignedInfoMap[targetLower].username || target;
        return out;
      }

      // terakhir: pakai email sebagai nama
      out.email = target;
      out.username = target;
      return out;
    },

    isFilled: function (v) {
      return v !== null && v !== undefined && String(v).trim() !== "";
    },

    equalsEmail: function (a, b) {
      if (a === null || a === undefined || b === null || b === undefined)
        return false;
      return String(a).toLowerCase() === String(b).toLowerCase();
    },

    collectAllEmailsForUpdate: function () {
      var emails = [];

      function pushValue(v) {
        if (v && String(v).trim() !== "") {
          emails.push(String(v).trim());
        }
      }

      // Sprint
      if (this.draft && this.draft.sprint) {
        pushValue(this.draft.sprint.juryStart);
        pushValue(this.draft.sprint.juryFinish);
      }

      // H2H
      if (this.draft && this.draft.h2h) {
        pushValue(this.draft.h2h.juryStart);
        pushValue(this.draft.h2h.juryFinish);
      }
      if (this.draft && this.draft.h2hValues) {
        var keys = ["R1", "R2", "L1", "L2"];
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          pushValue(this.draft.h2hValues[k]);
        }
      }

      // Slalom
      if (this.draft && this.draft.slalom) {
        pushValue(this.draft.slalom.juryStart);
        pushValue(this.draft.slalom.juryFinish);
        if (this.draft.slalom.gates) {
          for (var g = 1; g <= this.gatesCount; g++) {
            pushValue(this.draft.slalom.gates[g]);
          }
        }
      }

      // DRR
      if (this.draft && this.draft.drr) {
        pushValue(this.draft.drr.juryStart);
        pushValue(this.draft.drr.juryFinish);
        if (this.draft.drr.sections) {
          for (var s = 1; s <= this.sectionsCount; s++) {
            pushValue(this.draft.drr.sections[s]);
          }
        }
      }

      // Unik
      var uniq = [];
      var seen = {};
      for (var j = 0; j < emails.length; j++) {
        var e = emails[j].toLowerCase();
        if (!seen[e]) {
          seen[e] = true;
          uniq.push(emails[j]);
        }
      }
      return uniq;
    },

    collectAllSelectedEmails: function () {
      var emails = [];

      if (this.draft && this.draft.sprint) {
        if (this.isFilled(this.draft.sprint.juryStart))
          emails.push(String(this.draft.sprint.juryStart));
        if (this.isFilled(this.draft.sprint.juryFinish))
          emails.push(String(this.draft.sprint.juryFinish));
      }

      if (this.draft && this.draft.h2h) {
        if (this.isFilled(this.draft.h2h.juryStart))
          emails.push(String(this.draft.h2h.juryStart));
        if (this.isFilled(this.draft.h2h.juryFinish))
          emails.push(String(this.draft.h2h.juryFinish));
      }
      if (this.draft && this.draft.h2hValues) {
        var keys = ["R1", "R2", "L1", "L2"];
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (this.isFilled(this.draft.h2hValues[k]))
            emails.push(String(this.draft.h2hValues[k]));
        }
      }

      if (this.draft && this.draft.slalom) {
        if (this.isFilled(this.draft.slalom.juryStart))
          emails.push(String(this.draft.slalom.juryStart));
        if (this.isFilled(this.draft.slalom.juryFinish))
          emails.push(String(this.draft.slalom.juryFinish));
        if (this.draft.slalom.gates) {
          for (var g = 1; g <= this.gatesCount; g++) {
            if (this.isFilled(this.draft.slalom.gates[g]))
              emails.push(String(this.draft.slalom.gates[g]));
          }
        }
      }

      if (this.draft && this.draft.drr) {
        if (this.isFilled(this.draft.drr.juryStart))
          emails.push(String(this.draft.drr.juryStart));
        if (this.isFilled(this.draft.drr.juryFinish))
          emails.push(String(this.draft.drr.juryFinish));
        if (this.draft.drr.sections) {
          for (var s = 1; s <= this.sectionsCount; s++) {
            if (this.isFilled(this.draft.drr.sections[s]))
              emails.push(String(this.draft.drr.sections[s]));
          }
        }
      }

      var set = {};
      var uniq = [];
      for (var j = 0; j < emails.length; j++) {
        var em = emails[j];
        var key = em.toLowerCase();
        if (!set[key]) {
          set[key] = true;
          uniq.push(em);
        }
      }
      uniq.sort();
      return uniq;
    },

    buildEventPositionsPayloadForEmail: function (email) {
      var sprint = { start: false, finish: false };
      if (this.draft && this.draft.sprint) {
        if (this.equalsEmail(this.draft.sprint.juryStart, email))
          sprint.start = true;
        if (this.equalsEmail(this.draft.sprint.juryFinish, email))
          sprint.finish = true;
      }

      var h2h = {
        start: false,
        finish: false,
        R1: false,
        R2: false,
        L1: false,
        L2: false,
      };
      if (this.draft && this.draft.h2h) {
        if (this.equalsEmail(this.draft.h2h.juryStart, email)) h2h.start = true;
        if (this.equalsEmail(this.draft.h2h.juryFinish, email))
          h2h.finish = true;
      }
      if (
        this.enabledBouyanKeys &&
        Array.isArray(this.enabledBouyanKeys) &&
        this.draft &&
        this.draft.h2hValues
      ) {
        for (var i = 0; i < this.enabledBouyanKeys.length; i++) {
          var k = this.enabledBouyanKeys[i];
          if (this.equalsEmail(this.draft.h2hValues[k], email)) h2h[k] = true;
        }
      }

      var gates = [];
      if (this.draft && this.draft.slalom && this.draft.slalom.gates) {
        for (var g = 1; g <= this.gatesCount; g++) {
          if (this.equalsEmail(this.draft.slalom.gates[g], email))
            gates.push(g);
        }
      }
      var uniqGates = Array.from(new Set(gates)).sort(function (a, b) {
        return a - b;
      });

      var slalom = { start: false, finish: false, gates: uniqGates };
      if (this.draft && this.draft.slalom) {
        if (this.equalsEmail(this.draft.slalom.juryStart, email))
          slalom.start = true;
        if (this.equalsEmail(this.draft.slalom.juryFinish, email))
          slalom.finish = true;
      }

      var sections = [];
      if (this.draft && this.draft.drr && this.draft.drr.sections) {
        for (var s = 1; s <= this.sectionsCount; s++) {
          if (this.equalsEmail(this.draft.drr.sections[s], email))
            sections.push(s);
        }
      }
      var uniqSecs = Array.from(new Set(sections)).sort(function (a, b) {
        return a - b;
      });

      var drr = { start: false, finish: false, sections: uniqSecs };
      if (this.draft && this.draft.drr) {
        if (this.equalsEmail(this.draft.drr.juryStart, email)) drr.start = true;
        if (this.equalsEmail(this.draft.drr.juryFinish, email))
          drr.finish = true;
      }

      return {
        eventId: String(this.eventId),
        sprint: sprint,
        h2h: h2h,
        slalom: slalom,
        drr: drr,
      };
    },

    /* ===== prefill dari backend ===== */
    ensureDraftContainers: function () {
      if (!this.draft) this.draft = {};

      if (!this.draft.sprint)
        this.draft.sprint = { juryStart: "", juryFinish: "" };
      else {
        if (typeof this.draft.sprint.juryStart === "undefined")
          this.draft.sprint.juryStart = "";
        if (typeof this.draft.sprint.juryFinish === "undefined")
          this.draft.sprint.juryFinish = "";
      }

      if (!this.draft.h2h) this.draft.h2h = { juryStart: "", juryFinish: "" };
      else {
        if (typeof this.draft.h2h.juryStart === "undefined")
          this.draft.h2h.juryStart = "";
        if (typeof this.draft.h2h.juryFinish === "undefined")
          this.draft.h2h.juryFinish = "";
      }
      if (!this.draft.h2hValues) this.draft.h2hValues = {};

      if (!this.draft.slalom)
        this.draft.slalom = { juryStart: "", juryFinish: "", gates: {} };
      else {
        if (typeof this.draft.slalom.juryStart === "undefined")
          this.draft.slalom.juryStart = "";
        if (typeof this.draft.slalom.juryFinish === "undefined")
          this.draft.slalom.juryFinish = "";
        if (!this.draft.slalom.gates) this.draft.slalom.gates = {};
      }

      if (!this.draft.drr)
        this.draft.drr = { juryStart: "", juryFinish: "", sections: {} };
      else {
        if (typeof this.draft.drr.juryStart === "undefined")
          this.draft.drr.juryStart = "";
        if (typeof this.draft.drr.juryFinish === "undefined")
          this.draft.drr.juryFinish = "";
        if (!this.draft.drr.sections) this.draft.drr.sections = {};
      }
    },

    applyAssignmentsToDraft: function (payload) {
      if (!payload || !Array.isArray(payload.assignments)) return;

      this.ensureDraftContainers();

      this.draft.sprint.juryStart = "";
      this.draft.sprint.juryFinish = "";
      this.draft.h2h.juryStart = "";
      this.draft.h2h.juryFinish = "";
      this.draft.h2hValues = {};
      this.draft.slalom.juryStart = "";
      this.draft.slalom.juryFinish = "";
      this.draft.slalom.gates = {};
      this.draft.drr.juryStart = "";
      this.draft.drr.juryFinish = "";
      this.draft.drr.sections = {};

      for (var i = 0; i < payload.assignments.length; i++) {
        var a = payload.assignments[i] || {};
        var disc = a.discipline || "";
        var pos = a.position || "";
        var uid = a.userId != null ? String(a.userId) : "";
        var idx = typeof a.index === "number" ? a.index : null;

        if (uid === "") continue;

        if (disc === "sprint") {
          if (pos === "start") this.draft.sprint.juryStart = uid;
          else if (pos === "finish") this.draft.sprint.juryFinish = uid;
        } else if (disc === "h2h") {
          if (pos === "start") this.draft.h2h.juryStart = uid;
          else if (pos === "finish") this.draft.h2h.juryFinish = uid;
          else if (
            pos === "R1" ||
            pos === "R2" ||
            pos === "L1" ||
            pos === "L2"
          ) {
            this.draft.h2hValues[pos] = uid;
          }
        } else if (disc === "slalom") {
          if (pos === "start") this.draft.slalom.juryStart = uid;
          else if (pos === "finish") this.draft.slalom.juryFinish = uid;
          else if (pos === "gate" && idx !== null) {
            if (idx >= 1 && idx <= this.gatesCount)
              this.draft.slalom.gates[idx] = uid;
          }
        } else if (disc === "drr") {
          if (pos === "start") this.draft.drr.juryStart = uid;
          else if (pos === "finish") this.draft.drr.juryFinish = uid;
          else if (pos === "section" && idx !== null) {
            if (idx >= 1 && idx <= this.sectionsCount)
              this.draft.drr.sections[idx] = uid;
          }
        }
      }
    },

    fetchAssignmentsIPC: function () {
      try {
        if (!this.eventId || typeof ipcRenderer === "undefined") return;

        ipcRenderer.removeAllListeners("judges-assignments:get-reply");
        ipcRenderer.send("judges-assignments:get", { eventId: this.eventId });

        ipcRenderer.once("judges-assignments:get-reply", (_e, res) => {
          if (
            res &&
            res.ok &&
            res.data &&
            Array.isArray(res.data.assignments)
          ) {
            this.applyAssignmentsToDraft(res.data);
          }
        });
      } catch (err) {
        // silent
      }
    },

    // ===== PREFILL: baca dokumen by-user, konversi ke flat, isi ke draft =====
    fetchAssignmentsByUserIPC: function () {
      try {
        if (!this.eventId || typeof ipcRenderer === "undefined") return;

        ipcRenderer.removeAllListeners(
          "users-judges-assignment:listByEvent:reply"
        );
        ipcRenderer.send("users-judges-assignment:listByEvent", {
          eventId: this.eventId,
        });

        ipcRenderer.once(
          "users-judges-assignment:listByEvent:reply",
          (_e, res) => {
            if (!(res && res.ok && Array.isArray(res.items))) return;

            // simpan daftar email yg sudah pernah tersimpan untuk event ini
            var prev = [];
            var infoMap = {};
            for (var i = 0; i < res.items.length; i++) {
              var doc = res.items[i] || {};
              var email = doc && doc.email ? String(doc.email) : "";
              if (!email) continue;
              prev.push(email);
              infoMap[email.toLowerCase()] = {
                username: doc && doc.username ? String(doc.username) : email,
              };
            }
            this.previousAssignedEmails = Array.from(new Set(prev));
            this.assignedInfoMap = infoMap;

            // bangun list flat -> isi draft (spt semula)
            var list = [];
            var evId = String(this.eventId);
            for (var i2 = 0; i2 < res.items.length; i2++) {
              var d = res.items[i2] || {};
              var email2 = d.email ? String(d.email) : "";
              if (!email2) continue;
              var judgesArr = Array.isArray(d.judges) ? d.judges : [];
              for (var j = 0; j < judgesArr.length; j++) {
                var jg = judgesArr[j] || {};
                if ((jg.eventId ? String(jg.eventId) : "") !== evId) continue;

                var sp = jg.sprint || null;
                if (sp && sp.start === true)
                  list.push({
                    discipline: "sprint",
                    position: "start",
                    userId: email2,
                    name: "",
                  });
                if (sp && sp.finish === true)
                  list.push({
                    discipline: "sprint",
                    position: "finish",
                    userId: email2,
                    name: "",
                  });

                var h = jg.h2h || null;
                if (h) {
                  if (h.start === true)
                    list.push({
                      discipline: "h2h",
                      position: "start",
                      userId: email2,
                      name: "",
                    });
                  if (h.finish === true)
                    list.push({
                      discipline: "h2h",
                      position: "finish",
                      userId: email2,
                      name: "",
                    });
                  if (h.R1 === true)
                    list.push({
                      discipline: "h2h",
                      position: "R1",
                      userId: email2,
                      name: "",
                    });
                  if (h.R2 === true)
                    list.push({
                      discipline: "h2h",
                      position: "R2",
                      userId: email2,
                      name: "",
                    });
                  if (h.L1 === true)
                    list.push({
                      discipline: "h2h",
                      position: "L1",
                      userId: email2,
                      name: "",
                    });
                  if (h.L2 === true)
                    list.push({
                      discipline: "h2h",
                      position: "L2",
                      userId: email2,
                      name: "",
                    });
                }

                var sl = jg.slalom || null;
                if (sl) {
                  if (sl.start === true)
                    list.push({
                      discipline: "slalom",
                      position: "start",
                      userId: email2,
                      name: "",
                    });
                  if (sl.finish === true)
                    list.push({
                      discipline: "slalom",
                      position: "finish",
                      userId: email2,
                      name: "",
                    });
                  var gates = Array.isArray(sl.gates) ? sl.gates : [];
                  for (var g = 0; g < gates.length; g++) {
                    var gateIndex = gates[g];
                    if (typeof gateIndex === "number") {
                      list.push({
                        discipline: "slalom",
                        position: "gate",
                        index: gateIndex,
                        userId: email2,
                        name: "",
                      });
                    }
                  }
                }

                var dr = jg.drr || null;
                if (dr) {
                  if (dr.start === true)
                    list.push({
                      discipline: "drr",
                      position: "start",
                      userId: email2,
                      name: "",
                    });
                  if (dr.finish === true)
                    list.push({
                      discipline: "drr",
                      position: "finish",
                      userId: email2,
                      name: "",
                    });
                  var secs = Array.isArray(dr.sections) ? dr.sections : [];
                  for (var s = 0; s < secs.length; s++) {
                    var secIndex = secs[s];
                    if (typeof secIndex === "number") {
                      list.push({
                        discipline: "drr",
                        position: "section",
                        index: secIndex,
                        userId: email2,
                        name: "",
                      });
                    }
                  }
                }
              }
            }
            this.applyAssignmentsToDraft({ eventId: evId, assignments: list });
          }
        );
      } catch (err) {
        // silent
      }
    },

    /* ===== load master data ===== */
    fetchUsers: function () {
      try {
        if (typeof ipcRenderer === "undefined") return;

        ipcRenderer.removeAllListeners("users:getAll:reply");
        ipcRenderer.send("users:getAll");

        ipcRenderer.once("users:getAll:reply", (_e, res) => {
          var list = [];
          if (res && Array.isArray(res.items)) list = res.items;
          else if (res && Array.isArray(res.users)) list = res.users;
          else if (res && res.data && Array.isArray(res.data.users))
            list = res.data.users;

          const evId = toStrId(this.eventId);
          const filtered = evId
            ? list.filter((u) => userHasEvent(u, evId))
            : list;

          this.usersRaw = filtered;
          this.internalJuryOptions = normalizeUsersToOptions(filtered);
        });
      } catch (err) {
        this.usersRaw = [];
        this.internalJuryOptions = [];
      }
    },

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
            this.draft = mergeWithDefaults(res.settings);
          } else {
            this.draft = mergeWithDefaults({});
          }
          this.loading = false;
        });
      } catch (err) {
        this.draft = mergeWithDefaults({});
        this.loading = false;
      }
    },

    /* ===== actions ===== */
    close: function () {
      if (this.saving) return;
      this.localShow = false;
    },

    confirm: function () {
      if (!this.eventId || this.saving) return;

      var emails = this.getAllEmailsForUpsert(); // ⬅️ PENTING
      var nowIso = new Date().toISOString();
      var docs = [];

      for (var i = 0; i < emails.length; i++) {
        var em = emails[i];
        var info = this.getUserInfoByEmail(em);
        var positionsForThisUser = this.buildEventPositionsPayloadForEmail(em);

        docs.push({
          id: String(this.eventId),
          username: info.username || em,
          email: info.email || em,
          judges: [positionsForThisUser],
          createdAt: { $date: nowIso },
          updatedAt: { $date: nowIso },
          __v: 0,
        });
      }

      if (typeof ipcRenderer === "undefined") {
        return;
      }

      this.saving = true;
      ipcRenderer.removeAllListeners(
        "users-judges-assignment:upsertMany:reply"
      );
      ipcRenderer.send("users-judges-assignment:upsertMany", { docs: docs });

      ipcRenderer.once(
        "users-judges-assignment:upsertMany:reply",
        (_e, res) => {
          this.saving = false;
          var ok = res && res.ok === true;
          if (ok) {
            if (this.$bvToast) {
              this.$bvToast.toast("Assignments berhasil disimpan.", {
                title: "Success",
                variant: "success",
                solid: true,
              });
            }
            this.fetchAssignmentsByUserIPC();
            this.localShow = false;
            this.$emit("assignments-updated", {
              eventId: String(this.eventId),
              count: docs.length,
            });
          } else {
            var msg =
              res && res.error
                ? String(res.error)
                : "Gagal menyimpan assignment";
            if (this.$bvToast) {
              this.$bvToast.toast(msg, {
                title: "Error",
                variant: "danger",
                solid: true,
              });
            }
          }
        }
      );
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
