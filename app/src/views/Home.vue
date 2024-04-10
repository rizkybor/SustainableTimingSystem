<template>
  <div>
    <Banner />
    <b-container fluid class="bv-example-row mb-5">
      <b-row>
        <b-col md="10" offset-md="1"> </b-col>
      </b-row>
      <br />
      <br />
      <br />
      <br />

      <div>
        <b-col md="10" offset-md="1">
          <b-card class="shadow" style="border-radius: 20px">
            <template #header>
              <div style="display: flex; justify-content: space-between">
                <div class="mx-2 mt-3">
                  <p class="h5 font-weight-bold">All Event</p>
                </div>
                <b-button
                  style="border-radius: 20px"
                  class="btn-md"
                  variant="primary"
                  @click="goTo('create-new')"
                >
                  <Icon icon="ic:baseline-add-circle" />
                  Create New Event</b-button
                >
              </div>
            </template>
            <b-table
              v-if="!loading"
              striped
              hover
              :items="events"
              :fields="fields"
              style="cursor: pointer"
              @row-clicked="clickRow"
            >
            </b-table>

            <b-skeleton-table
              v-if="loading"
              :rows="3"
              :columns="6"
              :table-props="{ bordered: true, striped: true }"
            ></b-skeleton-table>
          </b-card>
        </b-col>
      </div>
    </b-container>
    <br />
    <br />
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import Banner from "../components/Banner.vue";
import { ipcRenderer } from "electron";

export default {
  name: "SustainableTimingSystemHome",
  components: {
    Icon,
    Banner,
  },
  data() {
    return {
      fields: [
        "ids",
        "eventName",
        "levelName",
        "startDateEvent",
        "endDateEvent",
        "statusEvent",
      ],
      events: {},
      loading: false,
    };
  },

  async mounted() {
    this.getEvents();
  },
  methods: {
    async getEvents() {
      this.loading = true;
      setTimeout(() => {
        ipcRenderer.send("get-events");
        ipcRenderer.on("get-events-reply", (event, data) => {
          if (data) {
            this.events = data;
          } else {
            console.error("Failed to retrieve data from events table");
          }
          this.loading = false;
        });
      }, 1000);
    },
    goTo(val) {
      this.$router.push(`${val}`);
    },
    copyTime() {
      this.hasilValidasi = this.result;
    },
    clickRow(item) {
      console.log(item.No);
      this.$router.push(`/event-detail/${item.Nama}`);
    },
  },
};
</script>

<style lang="scss" scoped></style>
