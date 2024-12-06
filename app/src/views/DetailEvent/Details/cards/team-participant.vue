<template>
  <div>
    <b-card class="shadow" style="border-radius: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between">
          <div class="mx-2 mt-3">
            <p class="h5 font-weight-bold">{{ teamTitle }}</p>
          </div>
          <div>
          <!-- <b-button
            @click="goTo(categories, data, teamTitle)"
            style="border-radius: 20px"
            class="btn-md mr-2"
            variant="warning"
          >
            <Icon icon="game-icons:checkered-flag" /> Official Training Run
            {{ categories }}
          </b-button> -->
          <b-button
            @click="goTo(filterEvent.name, dataTable, teamTitle)"
            style="border-radius: 20px"
            class="btn-md"
            variant="primary"
          >
            <Icon icon="game-icons:checkered-flag" /> Start Timing
            {{ filterEvent.name }}
          </b-button>
        </div>
        </div>
      </template>

      <template v-for="(team, index) in dataTable">
        <b-table
        fixed
          hover
          striped
          :items="[team]"
          :fields="fields"
          :key="index"
        >
          <template v-slot:cell(No)="row">
            <div>
              {{ index + 1 }}
            </div>
          </template>
          <template v-slot:cell(startingTime)="row">
            <div style="display: flex;">
              <b-form-input
                v-model="team.praStart"
                type="time"
                step="0.001"
                pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}"
                placeholder="Input Start Time"
              ></b-form-input>
            </div>
          </template>
          <template v-slot:cell(interval)="row">
            <div style="display: flex;">
              <b-form-input
                v-model="team.intervalRace"
                type="time"
                placeholder="Input Interval"
              ></b-form-input>
            </div>
          </template>
          <template #cell(Action)="row">
            <div style="display: flex; justify-content: flex-end; gap: 1vh;">
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
    data: Array,
    fields: Array,
    filterEvent: Object,
    filterInitial: Object,
    filterRace: Object,
    filterDivision: Object,
  },
  data() {
    return {
      dataTable: []
    };
  },

  mounted() {
    this.comparison()
  },

  methods: {
    comparison() {
      console.log(this.filterEvent.value,'<< cek')
      console.log(this.filterInitial.value,'<< cek')
      console.log(this.filterRace.value,'<< cek')
      console.log(this.filterDivision.value,'<< cek')
      const teams = this.data.find((item) => {
        return (
          item.eventId === this.filterEvent.value &&
          item.initialId === this.filterInitial.value &&
          item.raceId === this.filterRace.value &&
          item.divisionId === this.filterDivision.value
        );
      }).teams;
      console.log(teams,'<< cek')

      this.dataTable = teams;
    },
    validateForm() {
      return this.dataTable.every((e) => {
        return e.praStart && e.intervalRace;
      });
    },
    goTo(val, payload, teamTitle) {
      let formValid = this.validateForm();
      if (formValid) {
        val =
          val === "SPRINT"
            ? "sprint-race"
            : val == "SLALOM"
            ? "slalom-race"
            : val == "DRR"
            ? "drr-race"
            : val == "HEAD2HEAD"
            ? "head2head-race"
            : val;

        const obj = JSON.stringify(payload);
        localStorage.setItem("participantByCategories", obj);
        localStorage.setItem("currentCategories", teamTitle);
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

<style scoped>
.name-team-width {
  width: 800px !important;
}
</style>

