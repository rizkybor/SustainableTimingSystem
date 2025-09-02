<template>
  <section class="panel-box">
    <div class="panel-head">
      <div class="font-weight-bold">{{ title }} – {{ initialName || '—' }}</div>
      <b-button size="sm" variant="light" class="btn-start" @click="start">
        <Icon icon="mdi:flag-variant" class="mr-1" /> Start Race
      </b-button>
    </div>

    <div class="panel-body">
      <table class="team-table">
        <thead>
          <tr>
            <th style="width:64px">No</th>
            <th>Team Name</th>
            <th style="width:180px">BIB Number</th>
            <th style="width:120px" class="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <!-- baris input -->
          <tr v-if="draft" class="row-card">
            <td class="muted">1</td>
            <td>
              <div class="field">
                <select class="input" :value="draft.teamId || ''" @change="onTeamChange">
                  <option value="" disabled>Select team name</option>
                  <option v-for="t in teamsAvailableAll" :key="t.id" :value="t.id">{{ t.nameTeam }}</option>
                </select>
                <Icon icon="mdi:chevron-down" width="18" height="18" class="suffix" />
              </div>
            </td>
            <td>
              <input class="input" placeholder="Enter BIB number" :value="draft.bib || ''" @input="onBibChange" />
            </td>
            <td class="text-right">
              <button type="button" class="btn-ghost ok" @click="$emit('draft-save')" title="Save">
                <Icon icon="mdi:check-bold" width="18" height="18" />
              </button>
              <button type="button" class="btn-ghost danger ml-2" @click="$emit('draft-cancel')" title="Cancel">
                <Icon icon="mdi:trash-can-outline" width="18" height="18" />
              </button>
            </td>
          </tr>

          <!-- rows tersimpan -->
          <tr v-for="(r, idx) in rows" :key="r.bibTeam || idx" class="row-card">
            <td class="muted">{{ idx + 1 }}</td>
            <td>{{ r.nameTeam }}</td>
            <td>{{ r.bibTeam }}</td>
            <td class="text-right">
              <button type="button" class="btn-ghost danger" @click="$emit('delete-row', r.bibTeam)" title="Delete">
                <Icon icon="mdi:trash-can-outline" width="18" height="18" />
              </button>
            </td>
          </tr>

          <tr v-if="!draft && !rows.length">
            <td colspan="4" class="text-center text-muted py-3">Belum ada tim pada kombinasi ini.</td>
          </tr>
        </tbody>
      </table>

      <div class="panel-footer">
        <b-button variant="light" class="btn-add" @click="$emit('add-draft')">
          <Icon icon="mdi:plus" class="mr-1" /> Add Team
        </b-button>
      </div>
    </div>
  </section>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { ipcRenderer } from "electron";

export default {
  name: "TeamPanel",
  components: { Icon },
  props: {
    title: String,
    division: String,
    race: String,
    eventName: String,
    initialName: String,
    rows: { type: Array, default: () => [] },
    teamsAvailable: { type: Array, default: () => [] },
    draft: { type: Object, default: null },
  },
  computed: {
    teamsAvailableAll(){ return Array.isArray(this.teamsAvailable) ? this.teamsAvailable : []; },
  },
  methods: {
    onTeamChange(e){ this.$emit("draft-change", { ...(this.draft||{}), teamId: e.target.value }); },
    onBibChange(e){ this.$emit("draft-change", { ...(this.draft||{}), bib: e.target.value }); },
    start(){
      ipcRenderer && ipcRenderer.send && ipcRenderer.send("get-alert-saved", {
        type:"info", message:"Start Race", detail:`${this.title} – ${this.eventName || ""} (${this.initialName || ""})`
      });
    },
  },
};
</script>

<style scoped>
:root{
  --line:#e6ebf4;
  --line-2:#edf2f7;
  --ink:#1f2940;
  --muted:#73809a;
  --header:#f6f7f9;
  --panel:#ffffff;
  --shadow:0 12px 26px rgba(31,56,104,.08);
  --shadow-row:0 6px 18px rgba(31,56,104,.06);
  --primary:#1f6fa3;
}

/* ===== Panel ===== */
.panel-box{
  border:1px solid var(--line);
  border-radius:16px;
  background:var(--panel);
  box-shadow:var(--shadow);
}
.panel-head{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 16px;
  border-bottom:1px solid var(--line-2);
  background:#f9fbff;
  border-top-left-radius:16px; border-top-right-radius:16px;
}
.btn-start{
  appearance:none; border:1px solid #d0d9e8; background:#f4f7fb; color:#56627a;
  border-radius:10px; padding:6px 12px; font-weight:700; line-height:1;
}
.panel-body{ padding:10px 16px 6px 16px; }
.panel-footer{ padding:8px 16px 14px 16px; border-top:1px solid #f0f3f9; }

/* ===== Table ===== */
.team-table{
  width:100%;
  border-collapse:separate;   /* biar bisa spacing antar baris */
  border-spacing:0 10px;      /* jarak antar baris (floating row) */
}
.team-table thead th{
  background:var(--header);
  color:#2b3445; font-weight:700; font-size:13px;
  padding:12px; text-align:left;
  border-top-left-radius:10px; border-top-right-radius:10px;
}
.team-table thead .col-no{ width:64px; }
.team-table thead .col-bib{ width:220px; }
.team-table thead .col-action{ width:140px; }

/* baris "kartu" */
.team-table tbody .row-card{
  background:#fff;
  border:1px solid #e7ecf6;
  border-radius:10px;
  box-shadow:var(--shadow-row);
}
.team-table tbody td{
  padding:10px 12px;
  vertical-align:middle;
}
.team-table tbody td.muted{ color:var(--muted); }

/* ===== Input & Select (look lembut) ===== */
.field{ position:relative; }
.input{
  width:100%; height:38px;
  border-radius:10px;
  border:1px solid var(--line);
  background:#f7f9fc;
  padding:6px 34px 6px 10px;
  outline:none; font-size:14px;
}
.input:focus{
  background:#fff; border-color:#9ec5ff;
  box-shadow:0 0 0 4px rgba(42,104,196,.15);
}
.suffix{
  position:absolute; right:10px; top:50%; transform:translateY(-50%);
  pointer-events:none; color:#7b8aa6;
}

/* ===== Tombol aksi (kanan) ===== */
.text-right{ text-align:right; }
.btn-ghost{
  border:1px solid #d5deec;
  background:#eef3fb; color:#325a8f;
  border-radius:10px; height:34px; width:34px;
  display:inline-flex; align-items:center; justify-content:center;
}
.btn-ghost.ok{ background:#e6f7ff; border-color:#c6e9ff; color:#0d789d; }
.btn-ghost.danger{ background:#fef2f2; border-color:#f1d1d1; color:#a11d1d; }
.ml-2{ margin-left:8px; }

/* ===== Add Team ===== */
.btn-add{
  background:#ffffff; border:1px solid #cfd8e6; color:#1c4c7a;
  font-weight:700; border-radius:10px; padding:8px 14px;
}

/* ===== Responsif kecil ===== */
@media (max-width: 576px){
  .team-table thead .col-bib{ width:auto; }
  .team-table thead .col-action{ width:110px; }
}
</style>