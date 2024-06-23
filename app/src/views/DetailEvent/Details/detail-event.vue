<template>
  <div class="m-4">
    <b-row>
      <b-col cols="10" offset="1" class="mb-5">
        <div class="mx-2 mt-3">
          <p class="h6 text-muted">Home / On Game</p>
        </div>

        <div>
          <b-card
            header="Event Detail"
            class="shadow"
            style="border-radius: 20px"
          >
            <template #header>
              <div
                class="d-flex"
                style="justify-content: space-between; gap: 1vh"
              >
                <div class="mx-2 mt-3">
                  <p class="h6 text-muted">Event Detail</p>
                </div>
                <div>
                  <b-button
                    style="border-radius: 20px"
                    @click="back('/')"
                    variant="secondary"
                    class="btn-md mr-2"
                  >
                    <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
                  </b-button>
                  <b-button
                    style="border-radius: 20px"
                    @click="showResultCategories()"
                    type="input"
                    variant="success"
                    class="btn-md"
                  >
                    <Icon icon="system-uicons:document" />
                    Result
                  </b-button>
                </div>
              </div>
            </template>

            <b-row>
              <b-col cols="6">
                <div style="display: flex; flex-direction: row">
                  <b-col cols="3">
                    <label class="mr-3">Event Name </label>
                  </b-col>
                  <b-col>
                    <p>: {{ events.eventName }}</p>
                  </b-col>
                </div>
              </b-col>
              <b-col cols="6">
                <div style="display: flex; flex-direction: row">
                  <b-col cols="3">
                    <label class="mr-3">River Name </label>
                  </b-col>
                  <b-col>
                    <p>: {{ events.riverName }}</p>
                  </b-col>
                </div>
              </b-col>
            </b-row>

            <b-row>
              <b-col cols="6">
                <div style="display: flex; flex-direction: row">
                  <b-col cols="3">
                    <label class="mr-3">Start Date Event </label>
                  </b-col>
                  <b-col>
                    <p>: {{ formatDate(events.startDateEvent) }}</p>
                  </b-col>
                </div>
              </b-col>
              <b-col cols="6">
                <div style="display: flex; flex-direction: row">
                  <b-col cols="3">
                    <label class="mr-3">End Date Event </label>
                  </b-col>
                  <b-col>
                    <p>: {{ formatDate(events.endDateEvent) }}</p>
                  </b-col>
                </div>
              </b-col>
            </b-row>
          </b-card>
        </div>
        <br />
        <br />
        <div class="my-4">
          <div class="text-left" style="display: flex; gap: 1vh">
            <!-- <b-button
              @click="
                () => {
                  this.otr = true;
                }
              "
              style="border-radius: 20px"
              class="btn-md mr-2"
              variant="warning"
            >
              <Icon icon="game-icons:checkered-flag" /> Official Training Run
              {{ categories }}
            </b-button> -->
            <b-button
              @click="
                () => {
                  this.otr = false;
                }
              "
              style="border-radius: 20px"
              class="btn-md mr-2"
              variant="primary"
            >
              <Icon icon="game-icons:checkered-flag" /> Race Game
              {{ categories }}
            </b-button>
          </div>
        </div>

        <div v-if="!otr">
          <div class="my-4">
            <div class="text-left" style="display: flex; gap: 1vh">
              <b-button
                v-for="category in events.categoriesEvent"
                :key="category.name"
                style="border-radius: 20px"
                :style="{
                  background:
                    isActivated === category.name ? '#027BFE' : '#C4C4C4',
                }"
                @click="getEvent(category)"
              >
                <img
                  v-if="category.name == 'DRR'"
                  src="../../../assets/icons/drr.png"
                  alt="DRR"
                  style="height: 50px; margin-right: 5px"
                />
                <img
                  v-if="category.name == 'SPRINT'"
                  src="../../../assets/icons/sprint.png"
                  alt="SPRINT"
                  style="height: 50px; margin-right: 5px"
                />
                <img
                  v-if="category.name == 'HEAD2HEAD'"
                  src="../../../assets/icons/h2h.png"
                  alt="HEAD2HEAD"
                  style="height: 50px; margin-right: 5px"
                />
                <img
                  v-if="category.name == 'SLALOM'"
                  src="../../../assets/icons/slalom.png"
                  alt="SLALOM"
                  style="height: 50px; margin-right: 5px"
                />
                {{ category.name }}
              </b-button>
            </div>
          </div>

          <div class="my-4" v-if="eventActive.show">
            <div class="text-left" style="display: flex; gap: 1vh">
              <b-button
                v-for="category in events.categoriesInitial"
                :key="category.name"
                style="border-radius: 20px"
                :style="{
                  background:
                    isActivatedInitial === category.name
                      ? '#027BFE'
                      : '#C4C4C4',
                }"
                @click="getInitial(category)"
              >
                {{ category.name }}
              </b-button>
            </div>
          </div>

          <div class="my-4" v-if="eventActive.show && initialActive.show">
            <div class="text-left" style="display: flex; gap: 1vh">
              <b-button
                v-for="category in events.categoriesRace"
                :key="category.name"
                style="border-radius: 20px"
                :style="{
                  background:
                    isActivatedRace === category.name ? '#027BFE' : '#C4C4C4',
                }"
                @click="getRace(category)"
              >
                {{ category.name }}
              </b-button>
            </div>
          </div>

          <div
            class="my-4"
            v-if="eventActive.show && initialActive.show && raceActive.show"
          >
            <div class="text-left" style="display: flex; gap: 1vh">
              <b-button
                v-for="category in events.categoriesDivision"
                :key="category.name"
                style="border-radius: 20px"
                :style="{
                  background:
                    isActivatedDivision === category.name
                      ? '#027BFE'
                      : '#C4C4C4',
                }"
                @click="getDivision(category)"
              >
                {{ category.name }}
              </b-button>
            </div>
          </div>

          <div v-if="showEmptyCards">
            <cardEmptyVue />
          </div>
          <div v-else>
            <teamParticipantVue
              :teamTitle="titleTeams"
              :data="dataTeams"
              :filterEvent="eventActive.selected"
              :filterInitial="initialActive.selected"
              :filterRace="raceActive.selected"
              :filterDivision="divisionActive.selected"
              :fields="headersTable"
              @open-modal="openModal(formEvent.participant)"
            />
          </div>
        </div>

        <!-- <div v-if="otr"> -->
          <!-- <div class="my-4">
            <div class="text-left" style="display: flex; gap: 1vh">
              <b-button
                style="border-radius: 20px;  background:#027BFE"
                @click="getEvent()"
              >
                <img
                  src="../../../assets/icons/drr.png"
                  alt="DRR"
                  style="height: 50px; margin-right: 5px"
                />
                DRR
              </b-button>
            </div>
          </div>

          <div class="my-4" v-if="eventActive.show">
            <div class="text-left" style="display: flex; gap: 1vh">
              <b-button
                v-for="category in events.categoriesInitial"
                :key="category.name"
                style="border-radius: 20px"
                :style="{
                  background:
                    isActivatedInitial === category.name
                      ? '#027BFE'
                      : '#C4C4C4',
                }"
                @click="getInitial(category)"
              >
                {{ category.name }}
              </b-button>
            </div>
          </div>

          <div class="my-4" v-if="eventActive.show && initialActive.show">
            <div class="text-left" style="display: flex; gap: 1vh">
              <b-button
                v-for="category in events.categoriesRace"
                :key="category.name"
                style="border-radius: 20px"
                :style="{
                  background:
                    isActivatedRace === category.name ? '#027BFE' : '#C4C4C4',
                }"
                @click="getRace(category)"
              >
                {{ category.name }}
              </b-button>
            </div>
          </div>

          <div
            class="my-4"
            v-if="eventActive.show && initialActive.show && raceActive.show"
          >
            <div class="text-left" style="display: flex; gap: 1vh">
              <b-button
                v-for="category in events.categoriesDivision"
                :key="category.name"
                style="border-radius: 20px"
                :style="{
                  background:
                    isActivatedDivision === category.name
                      ? '#027BFE'
                      : '#C4C4C4',
                }"
                @click="getDivision(category)"
              >
                {{ category.name }}
              </b-button>
            </div>
          </div>

          <div v-if="showEmptyCards">
            <cardEmptyVue />
          </div>
          <div v-else>
            <teamOTR
              :teamTitle="titleTeams"
              :data="otrTeams"
              :filterEvent="eventActive.selected"
              :filterInitial="initialActive.selected"
              :filterRace="raceActive.selected"
              :filterDivision="divisionActive.selected"
              :fields="headersTable"
              @open-modal="openModal(formEvent.participant)"
            />
          </div> -->

        <!-- </div> -->
      </b-col>
    </b-row>
    <br />
    <br />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import teamParticipantVue from "./cards/team-participant.vue";
import teamOTR from "./cards/team-otr.vue";

import cardEmptyVue from "@/components/cards/card-must-filled.vue";

export default {
  name: "SustainableTimingSystemRaftingDetails",
  components: {
    teamParticipantVue,
    cardEmptyVue,
    teamOTR
  },
  data() {
    return {
      showEmptyCards: true,
      loading: false,
      events: {},
      headersTable: [
        { key: "No", label: "NO" },
        { key: "nameTeam", label: "TEAM NAME" },
        { key: "bibTeam", label: "BIB" },
        { key: "startingTime", label: "STARTING TIME" },
        { key: "interval", label: "INTERVAL" },
        { key: "Action", label: "ACTION", class: "text-right" },
      ],
      team: {
        R4men: false,
        R4women: false,
        R6men: false,
        R6women: false,
      },
      isActivated: "",
      events: {},
      nothingR4men: false,
      nothingR4women: false,
      nothingR6men: false,
      nothingR6women: false,
      showCategoriesSprint: false,
      showCategoriesHead2Head: false,
      showCategoriesSlalom: false,
      showCategoriesDRR: false,
      eventActive: {
        selected: {},
        show: false,
        actived: false,
      },
      initialActive: {
        selected: {},
        show: false,
        actived: false,
      },
      raceActive: {
        selected: {},
        show: false,
        actived: false,
      },
      divisionActive: {
        selected: {},
        show: false,
        actived: false,
      },
      dataTeams: [],
      otrTeams: [],
      titleTeams: "",
      filteredIndex: "",
      otr: false,
    };
  },
  async created() {
    const eventId = this.$route.params.id;
    await this.loadData(eventId);
  },
  methods: {
    getEvent(payload) {
      this.isActivatedInitial = "";
      this.showEmptyCards = true;
      this.raceActive.show = false;
      this.initialActive.show = false;

      this.eventActive.show = !this.eventActive.show;
      if (this.eventActive.show) {
        this.eventActive.selected = payload;
        this.isActivated = payload.name;
      } else {
        this.eventActive.selected = {};
        this.isActivated = "";
      }
    },
    getInitial(payload) {
      this.isActivatedRace = "";
      this.showEmptyCards = true;
      this.raceActive.show = false;

      this.initialActive.show = !this.initialActive.show;
      if (this.initialActive.show) {
        this.initialActive.selected = payload;
        this.isActivatedInitial = payload.name;
      } else {
        this.initialActive.selected = {};
        this.isActivatedInitial = "";
      }
    },
    getRace(payload) {
      this.isActivatedDivision = "";
      this.showEmptyCards = true;
      this.divisionActive.show = false;

      this.raceActive.show = !this.raceActive.show;
      if (this.raceActive.show) {
        this.raceActive.selected = payload;
        this.isActivatedRace = payload.name;
      } else {
        this.raceActive.selected = {};
        this.isActivatedRace = "";
      }
    },
    getDivision(payload) {
      console.log
      this.divisionActive.show = !this.divisionActive.show;
      if (this.divisionActive.show) {
        this.divisionActive.selected = payload;
        this.isActivatedDivision = payload.name;
        this.titleTeams = this.divisionActive.selected.name;
      } else {
        this.divisionActive.selected = {};
        this.isActivatedDivision = "";
      }
      this.showEmptyCards = !this.showEmptyCards;
    },
    async loadData(payload) {
      this.loading = true;
      await setTimeout(() => {
        ipcRenderer.send("get-events-byid", payload);
        ipcRenderer.on("get-events-byid-reply", (event, data) => {
          if (data) {
            this.events = data;
            this.dataTeams = this.events.participant;
            this.otrTeams = this.events.participant;
            console.log(this.dataTeams,'<< cek')
            localStorage.setItem("eventDetails", JSON.stringify(data));
          } else {
            console.error("Failed to retrieve data from events table");
          }
          this.loading = false;
        });
      }, 1000);
    },
    goTo(val) {
      this.$router.push(`/event-detail/${this.$route.params.id}/${val}`);
    },
    back(val) {
      this.$router.push(`${val}`);
    },
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
  },
};
</script>

<style scoped>
.name-team-width {
  width: 800px !important;
}
</style>
