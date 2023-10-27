<template>
  <div class="mt-5">
    <!-- <h1>Halaman Home</h1> -->
    <b-row>
      <b-col>
        <b-button @click="goTo('create-new')" variant="primary">
          <Icon icon="ic:baseline-add-circle" />
          Create New Event</b-button
        >
        <br />
        <br />

        <br />

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
      <b-col class="col-9">
        <div>
          <b-table striped hover :items="items"></b-table>
        </div>
      </b-col>
    </b-row>



  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";

export default {
  name: "SustainableTimingSystemHome",
  components: {
    Icon,
  },
  data() {
    return {
      items: [
        { event_name: "MUBLOC", date: "DD-MM-YYYY", status: "Done" },
        { event_name: "MOSTFEST", date: "DD-MM-YYYY", status: "Coming Soon" },
        { event_name: "MOC", date: "DD-MM-YYYY", status: "Coming Soon" },
        { event_name: "UBL Run", date: "DD-MM-YYYY", status: "Coming Soon" },
      ],
    };
  },

  async mounted() {
  
  },

  methods: {
    goTo(val) {
      this.$router.push(`${val}`);
    },
    copyTime() {
      // console.log(this.result)
      this.hasilValidasi = this.result;
    },
   
  },
};
</script>

<style lang="scss" scoped></style>
