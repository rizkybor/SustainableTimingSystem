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
  
      <b-table striped hover :items="teams" :fields="fields">
        <template #cell(Action)="row">
          <div style="display: flex; gap: 1vh">
            <b-button
              style="border-radius: 20px"
              variant="warning"
              size="sm"
              @click="editTeam(row.item)"
              >Edit</b-button
            >
            <b-button
              style="border-radius: 20px"
              variant="danger"
              size="sm"
              @click="deleteTeam(row.item)"
              >Delete</b-button
            >
          </div>
        </template>
      </b-table>
    </b-card>
  </template>
  
  <script>
  export default {
    props: {
      teamTitle: String,
      teams: Array,
      fields: Array
    },
    methods: {
      editTeam(item) {
        // Logika edit team
      },
      deleteTeam(item) {
        // Logika delete team
      }
    }
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
  