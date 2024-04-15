<template>
  <!-- <div class="mt-10">
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
  </div> -->
  <div class="m-4">
    <b-row>
      <b-col cols="10" offset="1" class="mb-5">
        <div class="mx-2 mt-3">
          <p class="h6 text-muted">Home / On Game</p>
        </div>

        <div style="display: flex; justify-content: space-between">
          <div class="mx-2 my-5 mt-2">
            <p class="h2">All Teams</p>
          </div>
          <div class="mx-2 my-5 mt-2">
            <div
              class="d-flex"
              style="justify-content: space-between; gap: 1vh"
            >
              <div>
                <b-button
                  style="border-radius: 20px"
                  @click="goTo()"
                  variant="secondary"
                  class="btn-md"
                >
                  <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
                </b-button>
              </div>
              <div>
                <b-button
                  style="border-radius: 20px"
                  @click="showResultCategories()"
                  type="input"
                  variant="success"
                  class="btn-md"
                >
                  <Icon icon="material-symbols-light:save" />
                  Result
                </b-button>
              </div>
            </div>
          </div>
        </div>

        <p>{{ events }}</p>

        <!-- <div class="my-4">
          <div class="text-left" style="display: flex; gap: 1vh">
            <b-button
              v-for="category in formEvent.categoriesEvent"
              :key="category.name"
              style="border-radius: 20px"
              :style="{
                background:
                  isActivated === category.name ? '#027BFE' : '#C4C4C4',
              }"
              @click="loadTeams(category)"
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
        </div> -->
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "SustainableTimingSystemRaftingDetails",

  data() {
    return {
      loading: false,
      events: {}
    };
  },

  async created() {
    const eventId = this.$route.params.id;
    this.loadData(eventId)
  },

  methods: {
    async loadData(payload) {
      this.loading = true;

      await setTimeout(() => {
        ipcRenderer.send("get-events-byid", payload);
        ipcRenderer.on("get-events-byid-reply", (event, data) => {
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
      this.$router.push(`/event-detail/${this.$route.params.id}/${val}`);
    },
    back(val) {
      this.$router.push(`${val}`);
    },
  },
};
</script>
