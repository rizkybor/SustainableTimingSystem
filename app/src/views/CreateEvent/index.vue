<template>
  <div>
    <CreateEvent @enterForm="enterForm" v-if="pageFormActive" />
  </div>
</template>

<script>
import CreateEvent from "./NewEvent/CreateEvent.vue";

export default {
  name: "SustainableTimingSystemRaftingIndex",
  components: {
    CreateEvent,
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
