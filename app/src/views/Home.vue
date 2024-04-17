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
              <template v-slot:cell(no)="row">
                {{ row.index + 1 }}
              </template>
              <template v-slot:cell(startDateEvent)="row">
                {{ formatDate(row.item.startDateEvent) }}
              </template>
              <template v-slot:cell(endDateEvent)="row">
                {{ formatDate(row.item.endDateEvent) }}
              </template>
            </b-table>

            <b-skeleton-table
              v-if="loading"
              :rows="3"
              :columns="6"
              :table-props="{ bordered: true, striped: true }"
            ></b-skeleton-table>
          </b-card>

          <div
            class="d-flex justify-content-center mt-5"
            style="align-items: center; gap: 5vh; z-index: 1"
          >
            <img
              src="@/assets/images/ic_makopala.png"
              alt="Logo"
              style="height: 110px"
            />
            <img
              src="@/assets/images/kikiaka-square.jpg"
              alt="Logo"
              style="height: 340px"
            />

            <img
              src="@/assets/images/faji.jpg"
              alt="Logo"
              style="height: 140px"
            />
          </div>
        </b-col>
      </div>
      <div></div>
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
        "no",
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
    formatDate(inputDate) {
      // Pisahkan tanggal, bulan, dan tahun dari inputDate
      const parts = inputDate.split("-");
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      // Buat objek Date dari tanggal yang diberikan
      const date = new Date(year, month - 1, day); // Perhatikan bahwa bulan dimulai dari 0, jadi kurangi 1 dari nilai bulan

      // Buat daftar nama bulan dalam Bahasa Indonesia
      const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];

      // Format tanggal dengan menggunakan nilai tanggal, nama bulan, dan tahun
      const formattedDate =
        day + " " + monthNames[date.getMonth()] + " " + year;

      return formattedDate;
    },
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
      //get id hexadecimal
      const idHex = Array.from(item._id.id).map((b) => b.toString(16).padStart(2, "0")).join("");;
      this.$router.push(`/event-detail/${idHex}`);
    },
  },
};
</script>

<style lang="scss" scoped></style>
