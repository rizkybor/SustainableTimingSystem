<template>
  <div>
    <CreateEvent @enterForm="enterForm" v-if="pageFormActive" />
    <selectCategories @backForm="backForm" v-if="pageSelectActive" />
  </div>
</template>

<script>
import CreateEvent from "./NewEvent/CreateEvent.vue";
import selectCategories from './SelectCategories/select-categories.vue';

export default {
  name: "SustainableTimingSystemRaftingIndex",
  components: {
    CreateEvent,
    selectCategories
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
