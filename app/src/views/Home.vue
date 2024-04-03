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
          <b-card> 
            <b-table striped hover :items="items" :fields="fields" style="cursor: pointer;" @row-clicked="clickRow"></b-table>
          </b-card>
          <!-- <b-carousel
            id="carousel1"
            v-model="slide"
            :interval="3000"
            controls
            indicators
            style="margin-bottom: 10vh;"
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
          </b-carousel> -->
        </b-col>
      </div>
    </b-container>
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
      fields: ['No', 'Nama', 'Status', 'Description'],
      items: [
        { No: 1, Nama: 'PON', Status: 'Active', Description: 'Deskripsi Item 1' },
        { No: 2, Nama: 'Kejurda', Status: 'Inactive', Description: 'Deskripsi Item 2' },
        { No: 3, Nama: 'Kejurnas', Status: 'Active', Description: 'Deskripsi Item 3' },
        // Tambahkan item lain sesuai kebutuhan
      ]
    };
  },

  async mounted() {},

  methods: {
    goTo(val) {
      this.$router.push(`${val}`);
    },
    copyTime() {
      this.hasilValidasi = this.result;
    },
    clickRow(item) {
      console.log(item.No)
      this.$router.push(`/event-detail/${item.Nama}`);
    }
  },
};
</script>

<style lang="scss" scoped></style>
