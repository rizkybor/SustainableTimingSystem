<template>
  <div>
    <b-card class="shadow" style="border-radius: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between">
          <div class="mx-2 mt-3">
            <p class="h5 font-weight-bold">{{ teamTitle }}</p>
          </div>
          <b-button
            @click="goTo(categories, teams)"
            style="border-radius: 20px"
            class="btn-md"
            variant="primary"
          >
            <Icon icon="game-icons:checkered-flag" /> Start Timing
            {{ categories }}
          </b-button>
        </div>
      </template>

      <template v-for="team in teams">
        <b-table hover striped hover :items="[team]" :fields="fields">
          <template v-slot:cell(No)="row">
            {{ row.index + 1 }}
          </template>
          <template v-slot:cell(startingTime)="row">
            <b-form-input
              v-model="team.praStart"
              type="time"
              step="0.001"
              pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}"
              placeholder="Input Start Time"
            ></b-form-input>
          </template>
          <template v-slot:cell(interval)="row">
            <b-form-input
              v-model="team.intervalRace"
              type="time"
              placeholder="Input Interval"
            ></b-form-input>
          </template>
          <template #cell(Action)="row">
            <div style="display: flex; gap: 1vh">
              <b-button
                style="border-radius: 20px"
                variant="warning"
                size="sm"
                @click="editTeam(row.item)"
              >
                <Icon icon="ph:note-pencil-bold" />
              </b-button>
              <b-button
                style="border-radius: 20px"
                variant="success"
                size="sm"
                @click="deleteTeam(row.item)"
              >
                <Icon icon="solar:restart-bold" />
              </b-button>
              <b-button
                style="border-radius: 20px"
                variant="danger"
                size="sm"
                @click="deleteTeam(row.item)"
              >
                <Icon icon="tabler:trash" />
              </b-button>
            </div>
          </template>
        </b-table>
      </template>
    </b-card>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
export default {
  name: "SustainableTimingSystemRaftingSprintGameTable",
  props: {
    teamTitle: String,
    teams: Array,
    fields: Array,
    categories: String,
  },
  data() {
    return {};
  },

  mounted() {},

  methods: {
    validateForm() {
      return this.teams.every((e) => {
        return e.praStart && e.intervalRace;
      });
    },
    goTo(val, payload) {
      let formValid = this.validateForm();
      if (formValid) {
        val =
          val === "SPRINT"
            ? "sprint-race"
            : val == "SLALOM"
            ? "slalom-race"
            : val == "DRR"
            ? "drr-race"
            : val == "H2H"
            ? "h2h-race"
            : val;

        console.log(JSON.stringify(this.teams))
            
        const obj = JSON.stringify(this.teams);
        localStorage.setItem("participantByCategories", obj);
        this.$router.push(`/event-detail/${this.$route.params.id}/${val}`);
      } else {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail:
            "Fill in the pre-Start and interval first, before starting the race",
          message: "Ups Sorry",
        });
      }
    },
  },
};
</script>
