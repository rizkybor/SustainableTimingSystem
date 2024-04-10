<template>
  <div>
    <CreateEvent @enterForm="enterForm" v-if="pageFormActive" />
    <AddTeam :open="pageSelectActive" @backForm="backForm" v-if="pageSelectActive" />
  </div>
</template>

<script>
import CreateEvent from "./NewEvent/CreateEvent.vue";
import AddTeam from "./AddTeamToEvent/AddTeam.vue";

export default {
  name: "SustainableTimingSystemRaftingIndex",
  components: {
    CreateEvent,
    AddTeam
  },
  data() {
    return {
      pageFormActive: true,
      pageSelectActive: false,
    };
  },

  mounted() {},

  methods: {
    enterForm() {
      this.pageSelectActive = true;
      this.pageFormActive = false;
    },
    backForm() {
      this.pageSelectActive = false;
      this.pageFormActive = true;
    }
  },
};
</script>
