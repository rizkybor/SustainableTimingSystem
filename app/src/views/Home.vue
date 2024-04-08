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
            <b-table striped hover :items="events" :fields="fields" style="cursor: pointer;" @row-clicked="clickRow"></b-table>
          </b-card>
        </b-col>
      </div>
    </b-container>
    <br/>
    <br/>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import Banner from "../components/Banner.vue";
import { ipcRenderer } from 'electron';


export default {
  name: "SustainableTimingSystemHome",
  components: {
    Icon,
    Banner,
  },
  data() {
    return {
      fields: ['ids', 'eventName', 'levelName', 'startDateEvent', 'endDateEvent', 'statusEvent'],
      events:{}
    };
  },

  async mounted() {
    this.getEvents()
  },
  methods: {
    async getEvents() {
    ipcRenderer.send('get-events');
    ipcRenderer.on('get-events-reply', (event, data) => {
      if (data) {
        console.log("Data from events table:", data);
        this.events = data
      } else {
        console.error("Failed to retrieve data from events table");
      }
    });
    },
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