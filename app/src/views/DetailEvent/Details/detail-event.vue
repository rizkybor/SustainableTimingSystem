<template>
  <div class="mt-10">
    <p>Event Details {{ this.$route.path }}</p>
    <b-button @click="back('/')" variant="primary">
      <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back</b-button
    >

    <b-row>
      <b-col>
        <b-button @click="goTo('sprint-race')" variant="primary">
          <Icon icon="ic:baseline-add-circle" />
          BY PASS SPRINT RACE</b-button
        >

        <br />

        <br />
        <br />

        <b-button @click="goTo('slalom-race')" variant="warning">
          <Icon icon="ic:baseline-add-circle" />
          BY PASS Slalom RACE</b-button
        >
        <br />
        <br />
      </b-col>
    </b-row>
  </div>
</template>

<script>
export default {
  name: "SustainableTimingSystemRaftingDetails",

  data() {
    return {};
  },

  mounted() {
    const eventId = this.$route.params.id;
  },

  methods: {
    goTo(val) {
      this.$router.push(`/event-detail/${this.$route.params.id}/${val}`);
    },
    back(val) {
      this.$router.push(`${val}`);
    },
  },
};
</script>
