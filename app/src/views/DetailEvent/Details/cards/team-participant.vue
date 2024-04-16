<template>
  <div>
    <b-card class="shadow" style="border-radius: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between">
          <div class="mx-2 mt-3">
            <p class="h5 font-weight-bold">{{ teamTitle }}</p>
          </div>
          <b-button
            @click="goTo('sprint-race')"
            style="border-radius: 20px"
            class="btn-md"
            variant="primary"
          >
            <Icon icon="game-icons:checkered-flag" /> Start Timing
          </b-button>
        </div>
      </template>

      <b-table striped hover :items="teams" :fields="fields">
        <template v-slot:cell(No)="row">
          {{ row.index + 1 }}
        </template>
        <template v-slot:cell(startingTime)="row">
          <b-form-input
            v-model="row.praStart"
            type="time"
            step="0.001"
            pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}"
            placeholder="Input Start Time"
          ></b-form-input>
        </template>
        <template v-slot:cell(interval)="row">
          <b-form-input
            v-model="row.intervalRace"
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
    </b-card>
  </div>
</template>

<script>
export default {
  name: "SustainableTimingSystemRaftingSprintGameTable",
  props: {
    teamTitle: String,
    teams: Array,
    fields: Array,
  },
  data() {
    return {};
  },

  mounted() {},

  methods: {
    goTo(val) {
      this.$router.push(`/event-detail/${this.$route.params.id}/${val}`);
    },
  },
};
</script>
