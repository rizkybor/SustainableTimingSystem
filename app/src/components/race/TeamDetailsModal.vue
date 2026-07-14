<template>
  <b-modal
    v-model="localShow"
    hide-footer
    centered
    size="lg"
    body-class="p-0"
    content-class="rounded-20 overflow-hidden td-modal"
  >
    <template #modal-header>
      <div class="d-flex justify-content-between align-items-center w-100">
        <div>
          <h5 class="mb-0 font-weight-bold">
            {{ (team && team.nameTeam) || "-" }}
            <CountryFlag v-if="countryCode" :code="countryCode" />
          </h5>
          <div class="text-muted small">{{ contextLine }}</div>
        </div>
        <b-button size="sm" class="btn-close-red" @click="localShow = false">✕</b-button>
      </div>
    </template>

    <div class="p-4" v-if="team">
      <!-- ===== Ringkasan ===== -->
      <section class="td-card mb-3">
        <div class="td-section-title">Team Info</div>
        <div class="td-grid">
          <div class="td-field">
            <div class="td-label">BIB</div>
            <div class="td-value">{{ team.bibTeam || "-" }}</div>
          </div>
          <div class="td-field">
            <div class="td-label">Type</div>
            <div class="td-value">{{ typeTeam || "-" }}</div>
          </div>
          <div class="td-field">
            <div class="td-label">Country</div>
            <div class="td-value">
              {{ countryName || "-" }}
              <CountryFlag v-if="countryCode" :code="countryCode" />
            </div>
          </div>
          <div class="td-field">
            <div class="td-label">Status</div>
            <div class="td-value">
              <span
                class="td-status-pill"
                :class="isActive ? 'td-status-active' : 'td-status-inactive'"
              >
                <span class="dot"></span> {{ isActive ? "Active" : "Inactive" }}
              </span>
            </div>
          </div>
          <div class="td-field">
            <div class="td-label">Start Order</div>
            <div class="td-value">{{ team.startOrder || "-" }}</div>
          </div>
          <div class="td-field">
            <div class="td-label">Pra Start</div>
            <div class="td-value">{{ team.praStart || "-" }}</div>
          </div>
          <div class="td-field">
            <div class="td-label">Interval Race</div>
            <div class="td-value">{{ team.intervalRace || "-" }}</div>
          </div>
        </div>
      </section>

      <!-- ===== Info khusus kategori (H2H/RX) ===== -->
      <section class="td-card mb-3" v-if="matchInfo.length">
        <div class="td-section-title">Match Info</div>
        <div class="td-grid">
          <div class="td-field" v-for="f in matchInfo" :key="f.label">
            <div class="td-label">{{ f.label }}</div>
            <div class="td-value">{{ f.value }}</div>
          </div>
        </div>
      </section>

      <!-- ===== Result per run/heat ===== -->
      <section class="td-card mb-3" v-for="(run, idx) in resultRuns" :key="'run-' + idx">
        <div class="td-section-title">{{ run.label }}</div>
        <div v-if="run.fields.length" class="td-grid">
          <div class="td-field" v-for="f in run.fields" :key="f.label">
            <div class="td-label">{{ f.label }}</div>
            <div class="td-value">{{ f.value }}</div>
          </div>
        </div>
        <div v-else class="text-muted small">Belum ada data hasil.</div>
      </section>
    </div>

    <div v-else class="p-5 text-center text-muted">Tidak ada data tim.</div>
  </b-modal>
</template>

<script>
import CountryFlag from "@/components/common/CountryFlag.vue";
import { getCountryName } from "@/utils/countries";
import {
  RESULT_FIELD_LABELS,
  MATCH_FIELD_LABELS,
  collectFields,
} from "@/utils/formatRaceResult";

export default {
  name: "TeamDetailsModal",
  components: { CountryFlag },
  props: {
    value: { type: Boolean, default: false },
    team: { type: Object, default: null },
    raceName: { type: String, default: "" },
    divisionName: { type: String, default: "" },
    raceCategoryName: { type: String, default: "" },
    initialName: { type: String, default: "" },
    teamsAvailable: { type: Array, default: () => [] },
  },
  computed: {
    localShow: {
      get: function () { return this.value; },
      set: function (v) { this.$emit("input", v); },
    },
    contextLine: function () {
      var parts = [this.raceName, this.divisionName, this.raceCategoryName, this.initialName]
        .filter(Boolean);
      return parts.join(" • ") || "-";
    },
    masterTeam: function () {
      if (!this.team) return null;
      var list = Array.isArray(this.teamsAvailable) ? this.teamsAvailable : [];
      var teamId = this.team.teamId ? String(this.team.teamId) : "";
      var name = String(this.team.nameTeam || "").trim().toUpperCase();
      for (var i = 0; i < list.length; i++) {
        var t = list[i] || {};
        var tid = t.id ? String(t.id) : "";
        var tname = String(t.nameTeam || "").trim().toUpperCase();
        if ((teamId && tid === teamId) || (!teamId && name && tname === name)) {
          return t;
        }
      }
      return null;
    },
    typeTeam: function () {
      return this.masterTeam && this.masterTeam.typeTeam ? this.masterTeam.typeTeam : "";
    },
    countryCode: function () {
      return this.masterTeam && this.masterTeam.countryCode ? String(this.masterTeam.countryCode).toUpperCase() : "";
    },
    countryName: function () {
      return this.countryCode ? getCountryName(this.countryCode) : "";
    },
    isActive: function () {
      return !!(this.team && Number(this.team.statusId) === 0);
    },
    matchInfo: function () {
      return collectFields(this.team, MATCH_FIELD_LABELS);
    },
    resultRuns: function () {
      if (!this.team || this.team.result === undefined) return [];
      var result = this.team.result;

      if (Array.isArray(result)) {
        return result.map(function (r, idx) {
          return {
            label: result.length > 1 ? "Result — Run " + (idx + 1) : "Result",
            fields: collectFields(r, RESULT_FIELD_LABELS),
          };
        });
      }
      return [
        {
          label: "Result",
          fields: collectFields(result, RESULT_FIELD_LABELS),
        },
      ];
    },
  },
};
</script>

<style scoped>
.rounded-20 { border-radius: 20px; }
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
.btn-close-red:hover { background: #f8d7da; color: #b71c1c; }

.td-modal .modal-body { overflow: auto; }

.td-card {
  border: 1px solid #e6ebf4;
  border-radius: 16px;
  background: #fff;
  padding: 16px;
  box-shadow: 0 12px 26px rgba(31, 56, 104, 0.06);
}
.td-section-title {
  font-weight: 800;
  font-size: 15px;
  margin-bottom: 12px;
  color: #1f2940;
}
.td-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}
.td-field {
  min-width: 0;
}
.td-label {
  font-size: 11px;
  color: #8a95a3;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 3px;
}
.td-value {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  word-break: break-word;
}

.td-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-weight: 700;
  font-size: 12px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
}
.td-status-pill .dot { width: 7px; height: 7px; border-radius: 999px; background: currentColor; display: inline-block; }
.td-status-active { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
.td-status-inactive { background: #fff7ed; color: #9a3412; border-color: #fed7aa; }
</style>
