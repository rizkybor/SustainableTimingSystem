<template>
  <div class="sprint-result-page">
    <b-container class="mt-3">
      <div class="text-muted small mb-2">
        <router-link :to="`/event-detail/${$route.params.id}`"
          >Events</router-link
        >
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
            <b-badge variant="primary">{{ row.item.ranked }}</b-badge>
          </template>
          <template #cell(nameTeam)="row">
            <strong>{{ row.item.nameTeam }}</strong>
            <div class="text-muted small">Bib: {{ row.item.bibTeam }}</div>
          </template>
          <!-- <template #cell(totalTime)="row">
            {{ row.item.result.totalTime }}
          </template> -->
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
      loading: false,
      error: "",
      results: [],
      fields: [
        { key: "ranked", label: "Rank", sortable: true },
        { key: "team", label: "Team" },
        { key: "startTime", label: "Start" },
        { key: "finishTime", label: "Finish" },
        { key: "raceTime", label: "Race Time" },
        { key: "penaltyTime", label: "Penalty" },
        { key: "totalTime", label: "Total Time" },
        { key: "score", label: "Score" },
        { key: "ranked", label: "Ranked" },
      ],
    };
  },
  async created() {
    await this.loadSprintResult();
  },
  methods: {
    async loadSprintResult() {
      const q = this.$route.query || {};
      // minimal harus punya ke-4 id ini
      if (!q.eventId || !q.initialId || !q.raceId || !q.divisionId) {
        this.error = "Parameter hasil tidak lengkap.";
        return;
      }

      this.loading = true;
      this.error = "";
      ipcRenderer.send("get-sprint-result", {
        eventId: q.eventId,
        initialId: q.initialId,
        raceId: q.raceId,
        divisionId: q.divisionId,
        eventName: q.eventName,
        initialName: q.initialName,
        raceName: q.raceName,
        divisionName: q.divisionName,
      });

      await new Promise((resolve) => {
        ipcRenderer.once("get-sprint-result-reply", (_e, res) => {
          this.loading = false;
          if (res && res.ok && Array.isArray(res.items)) {
            const rows = [];
            res.items.forEach((doc) => {
              const arr = Array.isArray(doc.result) ? doc.result : [];
              arr.forEach((r) => {
                rows.push({
                  team:
                    (r.nameTeam || doc.nameTeam || "") +
                    (r.bibTeam || doc.bibTeam
                      ? ` (BIB ${r.bibTeam || doc.bibTeam})`
                      : ""),
                  nameTeam: r.nameTeam || doc.nameTeam || "",
                  bibTeam: r.bibTeam || doc.bibTeam || "",
                  ranked: r.result.ranked || "",
                  startTime: r.result.startTime || "",
                  finishTime: r.result.finishTime || "",
                  raceTime: r.result.raceTime || "",
                  penaltyTime: r.result.penaltyTime || "",
                  totalTime: r.result.totalTime || "",
                  score: r.result.score || "",
                });
              });
            });
            this.results = rows;
          } else {
            this.results = [];
            this.error = (res && res.error) || "Gagal memuat hasil.";
          }
          resolve();
        });
      });
    },
  },
};
</script>
