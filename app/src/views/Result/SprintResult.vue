<template>
  <div class="sprint-result-page">
    <b-container class="mt-3">
      <div class="text-muted small mb-2">
        <router-link :to="`/event-detail/${$route.params.id}`">Events</router-link>
        / Sprint Result
      </div>

      <h2 class="h3 font-weight-bold mb-3">Sprint Result</h2>

      <b-card>
        <b-table
          :items="results"
          :fields="fields"
          striped
          hover
          small
          responsive="sm"
        >
          <template #cell(ranked)="row">
            <b-badge variant="primary">{{ row.item.result.ranked }}</b-badge>
          </template>
          <template #cell(nameTeam)="row">
            <strong>{{ row.item.nameTeam }}</strong>
            <div class="text-muted small">Bib: {{ row.item.bibTeam }}</div>
          </template>
          <template #cell(totalTime)="row">
            {{ row.item.result.totalTime }}
          </template>
        </b-table>
      </b-card>
    </b-container>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "SprintResult",
  data() {
    return {
      results: [],
      fields: [
        { key: "result.ranked", label: "Rank", sortable: true },
        { key: "nameTeam", label: "Team" },
        { key: "result.startTime", label: "Start" },
        { key: "result.finishTime", label: "Finish" },
        { key: "result.raceTime", label: "Race Time" },
        { key: "result.penaltyTime", label: "Penalty" },
        { key: "result.totalTime", label: "Total Time" },
        { key: "result.score", label: "Score" },
      ],
    };
  },
  async created() {
    await this.loadSprintResult();
  },
  methods: {
    async loadSprintResult() {
      const eventId = this.$route.params.id;
      ipcRenderer.send("get-sprint-result", eventId);

      await new Promise((resolve) => {
        ipcRenderer.once("get-sprint-result-reply", (_e, res) => {
          if (res && res.ok && Array.isArray(res.items)) {
            // ambil array result dari DB, flatten tiap tim
            this.results = res.items.flatMap((doc) =>
              Array.isArray(doc.result) ? doc.result : []
            );
          } else {
            this.results = [];
          }
          resolve();
        });
      });
    },
  },
};
</script>