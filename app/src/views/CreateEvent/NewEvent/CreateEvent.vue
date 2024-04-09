<template>
  <div>
    <b-row>
      <b-col cols="10" offset="1" class="mb-5">
        <div>
          <div class="mx-5 mt-5">
                <p class="h6 text-muted">Home / Create New Event</p>
              </div>
          <b-card
            title="Create New Event"
            sub-title="Added Information Event Details"
            class="m-3 shadow px-3 py-4"
            style="border-radius: 25px;"
          >
            <form ref="form-newEvent">
              <br />
              <div>
                <p class="h5 my-2">Event Information</p>
                <!-- EVENT LEVEL  -->
                <b-form-group label="Event Level">
                  <b-form-select
                    size="sm"
                    placeholder="Event Level"
                    v-model="formEvent.eventLevel"
                    :options="optionLevels"
                    value-field="id"
                    text-field="name"
                  ></b-form-select>
                </b-form-group>

                <!-- EVENT NAME  -->
                <b-form-group label="Event Name">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.eventName"
                    placeholder="Enter your event name"
                  ></b-form-input>
                </b-form-group>

                <!-- RIVER NAME  -->
                <b-form-group label="River Name">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.location"
                    placeholder="Enter river name"
                  ></b-form-input>
                </b-form-group>

                <br />
                <p class="h5 my-2">Date & Location</p>

                <!-- DISTRICT  -->
                <b-form-group label="District">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.location"
                    placeholder="Enter District"
                  ></b-form-input>
                </b-form-group>

                <b-row>
                  <!-- SUBDISTRICT  -->
                  <b-col cols="6">
                    <b-form-group label="Sub District">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.location"
                        placeholder="Enter Sub District"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>

                  <!-- VILLAGE  -->
                  <b-col cols="6">
                    <b-form-group label="Village">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.location"
                        placeholder="Enter Village"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <!-- CITY  -->
                  <b-col cols="6">
                    <b-form-group label="City">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.location"
                        placeholder="Enter City"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>

                  <!-- PROVINCE  -->
                  <b-col cols="6">
                    <b-form-group label="Province">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.location"
                        placeholder="Enter Province"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <!-- ZIP CODE  -->
                  <b-col cols="6">
                    <b-form-group label="ZIP Code">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.location"
                        placeholder="Enter ZIP Code"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>

                  <b-col>
                    <!-- STATE -->
                    <b-form-group label="State">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.location"
                        placeholder="Enter State"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <b-col cols="6">
                    <!-- EVENT DATE -->
                    <b-form-group label="Start Date">
                      <b-form-datepicker
                        size="sm"
                        v-model="formEvent.eventDate"
                        placeholder="Select start date"
                        class="mb-2"
                      ></b-form-datepicker>
                    </b-form-group>
                  </b-col>
                  <b-col cols="6">
                    <!-- EVENT DATE -->
                    <b-form-group label="End Date">
                      <b-form-datepicker
                        size="sm"
                        v-model="formEvent.eventDate"
                        placeholder="Select end date"
                        class="mb-2"
                      ></b-form-datepicker>
                    </b-form-group>
                  </b-col>
                </b-row>

                <br />
                <p class="h5 my-2">Race Details</p>

                <!-- EVENT CATEGORIES -->
                <b-form-group label="Event Categories" label-cols="3">
                  <multiselect
                    v-model="formEvent.eventCategories"
                    :options="optionCategories"
                    placeholder="Select event categories"
                    multiple
                    track-by="value"
                    label="name"
                  ></multiselect>
                </b-form-group>

                <!-- DIVISION CATEGORIES -->
                <b-form-group label="Division Categories" label-cols="3">
                  <multiselect
                    v-model="formEvent.divisionCategories"
                    :options="optionDivisions"
                    placeholder="Select division categories"
                    multiple
                    track-by="value"
                    label="name"
                  ></multiselect>
                </b-form-group>

                <!-- RACE CATEGORIES -->
                <b-form-group label="Race Categories" label-cols="3">
                  <multiselect
                    v-model="formEvent.raceCategories"
                    :options="optionRaces"
                    placeholder="Select race categories"
                    multiple
                    track-by="value"
                    label="name"
                  ></multiselect>
                </b-form-group>

                <!-- INITIAL CATEGORIES -->
                <b-form-group label="Initial Categories" label-cols="3">
                  <multiselect
                    v-model="formEvent.initialCategories"
                    :options="optionInitials"
                    placeholder="Select initial categories"
                    multiple
                    track-by="value"
                    label="name"
                  ></multiselect>
                </b-form-group>

                <br />

                <b-row>
                  <b-col cols="6">
                    <!-- CHIEF JUDGE  -->
                    <b-form-group label="Chief Judge">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.chiefJudge"
                        placeholder="Enter chief judge name"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>

                  <b-col>
                    <!-- RACE DIRECTOR  -->
                    <b-form-group label="Race Director">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.raceDirector"
                        placeholder="Enter race director name"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <b-col cols="6">
                    <!-- SAFETY DIRECTOR  -->
                    <b-form-group label="Safety Director">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.safetyDirector"
                        placeholder="Enter safety director name"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>

                  <b-col>
                    <!-- EVENT DIRECTOR  -->
                    <b-form-group label="Event Director">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.eventDirector"
                        placeholder="Enter event director name"
                      ></b-form-input>
                    </b-form-group>
                  </b-col>
                </b-row>
              </div>
            </form>

            <br />

            <div class="d-flex mt-5" style="justify-content: space-between">
              <div>
                <b-button style="border-radius: 20px" @click="goTo()" variant="secondary">
                  <Icon
                    icon="ic:baseline-keyboard-double-arrow-left"
                  />Back</b-button
                >
              </div>
              <div>
                <b-button style="border-radius: 20px" @click="save()" type="input" variant="primary">
                  Next <Icon icon="ic:baseline-keyboard-double-arrow-right"
                /></b-button>
              </div>
            </div>
          </b-card>
        </div>
      </b-col>
    </b-row>
    <br/>
    <br/>
    <br/>
  </div>
</template>

<script>
import Multiselect from "vue-multiselect";
import { ipcRenderer } from "electron";

export default {
  name: "SustainableTimingSystemCreateEvent",
  components: {
    Multiselect,
  },
  computed: {
    state() {
      return this.name.length >= 4;
    },
    invalidFeedback() {
      if (this.name.length > 0) {
        return "Enter at least 4 characters.";
      }
      return "Please enter something.";
    },
  },
  data() {
    return {
      text: "",
      name: "",
      formEvent: {
        eventLevel: null,
        eventName: "",
        location: "",
        eventDate: null,
        eventCategories: [],
        divisionCategories: [],
        raceCategories: [],
        initialCategories: [],
        chiefJudge: "",
        raceDirector: "",
        safetyDirector: "",
        eventDirector: "",
      },
      optionLevels: [],
      optionCategories: [],
      optionDivisions: [],
      optionRaces: [],
      optionInitials: [],
    };
  },

  async mounted() {
    await this.loadOptions();
  },

  methods: {
    async loadOptions() {
      await this.setOptionLevel();
      await this.setOptionCategoriesEvent();
      await this.setOptionCategoriesDivision();
      await this.setOptionCategoriesInitial();
      await this.setOptionCategoriesRace();
    },
    async setOptionLevel() {
      ipcRenderer.send("option-level");
      ipcRenderer.on("option-level-reply", (event, data) => {
        if (data) {
          this.optionLevels = data;
        } else {
          console.error("Failed to retrieve data from events table");
        }
      });
    },
    async setOptionCategoriesEvent() {
      ipcRenderer.send("option-categories-event");
      ipcRenderer.on("option-categories-event-reply", (event, data) => {
        if (data) {
          this.optionCategories = data;
        } else {
          console.error("Failed to retrieve data from events table");
        }
      });
    },
    async setOptionCategoriesDivision() {
      ipcRenderer.send("option-categories-division");
      ipcRenderer.on("option-categories-division-reply", (event, data) => {
        if (data) {
          this.optionDivisions = data;
        } else {
          console.error("Failed to retrieve data from events table");
        }
      });
    },
    async setOptionCategoriesInitial() {
      ipcRenderer.send("option-categories-initial");
      ipcRenderer.on("option-categories-initial-reply", (event, data) => {
        if (data) {
          this.optionInitials = data;
        } else {
          console.error("Failed to retrieve data from events table");
        }
      });
    },
    async setOptionCategoriesRace() {
      ipcRenderer.send("option-categories-race");
      ipcRenderer.on("option-categories-race-reply", (event, data) => {
        if (data) {
          this.optionRaces = data;
        } else {
          console.error("Failed to retrieve data from events table");
        }
      });
    },
    goTo() {
      localStorage.removeItem('formNewEvent');
      this.$router.push("/");
    },
    validateForm() {
      const {
        eventLevel,
        eventName,
        location,
        eventDate,
        chiefJudge,
        raceDirector,
        safetyDirector,
        eventDirector,
      } = this.formEvent;

      if (
        !eventLevel ||
        !eventName ||
        !location ||
        !eventDate ||
        !chiefJudge ||
        !raceDirector ||
        !safetyDirector ||
        !eventDirector
      ) {
        return false;
      }
      return true; 
    },
    save() {
      this.$emit("enterForm");

      // const formValid = this.validateForm();
      // if (formValid) {
      //   localStorage.setItem('formNewEvent', this.formEvent);
      //   this.$emit("enterForm");
      // } else {
      //   console.error("Please fill out all the form fields.");
      // }
    },
  },
};
</script>

<style lang="scss" scoped></style>
