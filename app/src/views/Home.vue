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
        </b-col>
        {{ events }}
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
      fields: ['No', 'Event Name', 'Level Name', 'Date', 'Status'],
      items: [
        { No: 1, "Event Name": 'PON', "Level Name": 'Classification - F', Date: '01 Januari 2025', Status: 'Active' },
        { No: 2, "Event Name": 'Kejurda', "Level Name": 'Classification - E', Date: '01 Januari 2026', Status: 'Inactive' },
        { No: 3, "Event Name": 'Kejurnas', "Level Name": 'Classification - D', Date: '01 Januari 2027', Status: 'Active' },
        // Tambahkan item lain sesuai kebutuhan
      ],
      events:{}
    };
  },

  async mounted() {
  },

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