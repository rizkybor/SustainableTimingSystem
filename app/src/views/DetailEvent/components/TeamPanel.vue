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
          <!-- Draft row -->
          <tr v-if="draft" class="row-card">
            <td class="muted">1</td>
            <td>
              <div class="field">
                <select class="input" :value="draft.teamId || ''" @change="onTeamChange">
                  <option value="" disabled>Select team name</option>
                  <option v-for="t in teamsAvailableAll" :key="t.id" :value="t.id">
                    {{ t.nameTeam }}
                  </option>
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

          <!-- Saved rows -->
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
    teamsAvailableAll() {
      return Array.isArray(this.teamsAvailable) ? this.teamsAvailable : [];
    },
  },
  methods: {
    onTeamChange(e) {
      this.$emit("draft-change", { ...(this.draft || {}), teamId: e.target.value });
    },
    onBibChange(e) {
      this.$emit("draft-change", { ...(this.draft || {}), bib: e.target.value });
    },
    start() {
      ipcRenderer && ipcRenderer.send && ipcRenderer.send("get-alert-saved", {
        type: "info",
        message: "Start Race",
        detail: `${this.title} – ${this.eventName || ""} (${this.initialName || ""})`,
      });
    },
  },
};
</script>