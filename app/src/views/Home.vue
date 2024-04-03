<template>
  <div>
    <!-- <h1>Halaman Home</h1> -->
    <Banner />
    <b-container fluid class="bv-example-row mb-5">
      <b-row>
        <b-col md="10" offset-md="1">
        </b-col>
      </b-row>
      <b-row class="justify-content-md-center m-5">
        <b-col cols="12" md="auto">
          <b-button @click="goTo('create-new')" variant="primary">
            <Icon icon="ic:baseline-add-circle" />
            Create New Event</b-button
          >
        </b-col>
      </b-row>

      <div>
        <b-col md="10" offset-md="1">
          <b-carousel
            id="carousel1"
            v-model="slide"
            :interval="3000"
            controls
            indicators
          >
            <b-carousel-slide
              v-for="(item, index) in items"
              :key="index"
              :img-src="item.img"
              :caption="item.caption"
            >
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </b-carousel-slide>
          </b-carousel>
        </b-col>
      </div>
    </b-container>

    <!-- <b-row>
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
    </b-row> -->
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import Banner from "../components/Banner.vue";

export default {
  name: "SustainableTimingSystemHome",
  components: {
    Icon,
    Banner,
  },
  data() {
    return {
      // items: [
      //   { event_name: "MUBLOC", date: "DD-MM-YYYY", status: "Done" },
      //   { event_name: "MOSTFEST", date: "DD-MM-YYYY", status: "Coming Soon" },
      //   { event_name: "MOC", date: "DD-MM-YYYY", status: "Coming Soon" },
      //   { event_name: "UBL Run", date: "DD-MM-YYYY", status: "Coming Soon" },
      // ],
      slide: 0,
      items: [
        {
          title: "Event Title 1",
          img: "https://via.placeholder.com/600x300",
          description: "Deskripsi Slide 1",
        },
        {
          title: "Event Title 2",
          img: "https://via.placeholder.com/600x300",
          description: "Deskripsi Slide 2",
        },
        {
          title: "Event Title 3",
          img: "https://via.placeholder.com/600x300",
          description: "Deskripsi Slide 3",
        },
      ],
    };
  },

  async mounted() {},

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
