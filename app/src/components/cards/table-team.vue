<!-- TeamCard.vue -->
<template>
  <b-card class="shadow" style="border-radius: 20px">
    <template #header>
      <div style="display: flex; justify-content: space-between">
        <div class="mx-2 mt-3">
          <p class="h5 font-weight-bold">{{ teamTitle }}</p>
        </div>
        <b-button
          style="border-radius: 20px"
          class="btn-md"
          variant="primary"
          @click="$emit('open-modal')"
        >
          <Icon icon="ic:baseline-add-circle" /> New Team
        </b-button>
      </div>
    </template>
    
    <b-table striped hover :items="dataTable" :fields="fields">
      <template v-slot:cell(no)="row">
        {{ row.index + 1 }}
      </template>

      <template v-slot:cell(nameTeam)="row">
        {{ row.item.nameTeam }}
      </template>
      <template v-slot:cell(bibTeam)="row">
        {{ row.item.bibTeam }}
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
</template>

<script>
export default {
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
      dataTable: [],
    };
  },
  mounted() {
    this.comparison();
  },
  methods: {
    comparison() {
      const teams = this.data.find((item) => {
        return (
          item.eventId === this.filterEvent.value &&
          item.initialId === this.filterInitial.value &&
          item.raceId === this.filterRace.value &&
          item.divisionId === this.filterDivision.value
        );
      }).teams;
      this.dataTable = teams;

    },
    editTeam(item) {
      // Logika edit team
    },
    deleteTeam(item) {
      // Logika delete team
    },
  },
};
</script>

<style scoped>
.cardHover {
  cursor: pointer;
  background-color: var(--black) !important;
}

.cardHover:hover {
  background-color: var(--black) !important;
}
</style>
