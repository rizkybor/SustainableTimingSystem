<template>
  <div>
    <b-row>
      <b-col cols="10" offset="1">
        <div>
          <b-card
            title="Create New Event"
            sub-title="Added Information Event Details"
            class="m-5"
            style="border-radius: 15px; border-color: black"
          >
            <form ref="form-newEvent" @click="save()">
              <br />
              <div>
                <!-- EVENT LEVEL  -->
                <b-form-group label="Event Level">
                  <b-form-select
                    size="sm"
                    placeholder="Event Level"
                    v-model="formEvent.eventLevel"
                    :options="optionLevels"
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

                <!-- LOCATION  -->
                <b-form-group label="Location">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.location"
                    placeholder="Enter event location"
                  ></b-form-input>
                </b-form-group>

                <!-- EVENT DATE -->
                <b-form-group label="Event Date">
                  <b-form-datepicker
                    size="sm"
                    v-model="formEvent.eventDate"
                    placeholder="Select event date"
                    class="mb-2"
                  ></b-form-datepicker>
                </b-form-group>

                <!-- EVENT CATEGORY -->
                <b-form-group label="Event Category">
                  <multiselect
                    v-model="formEvent.eventCategory"
                    :options="optionCategorys"
                    placeholder="Select event category"
                    multiple
                    track-by="value"
                    label="name"
                  ></multiselect>
                </b-form-group>

                <!-- DIVISION CATEGORY -->
                <b-form-group label="Division Category">
                  <multiselect
                    v-model="formEvent.divisionCategory"
                    :options="optionDivisions"
                    placeholder="Select division category"
                    multiple
                    track-by="value"
                    label="text"
                  ></multiselect>
                </b-form-group>

                <!-- RACE CATEGORY -->
                <b-form-group label="Race Category">
                  <multiselect
                    v-model="formEvent.raceCategory"
                    :options="optionRaces"
                    placeholder="Select race category"
                    multiple
                    track-by="value"
                    label="text"
                  ></multiselect>
                </b-form-group>

                <!-- INITIAL CATEGORY -->
                <b-form-group label="Initial Category">
                  <multiselect
                    v-model="formEvent.initialCategory"
                    :options="optionInitials"
                    placeholder="Select initial category"
                    multiple
                    track-by="value"
                    label="text"
                  ></multiselect>
                </b-form-group>

                <!-- CHIEF JUDGE  -->
                <b-form-group label="Chief Judge">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.chiefJudge"
                    placeholder="Enter chief judge name"
                  ></b-form-input>
                </b-form-group>

                <!-- RACE DIRECTOR  -->
                <b-form-group label="Race Director">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.raceDirector"
                    placeholder="Enter race director name"
                  ></b-form-input>
                </b-form-group>

                <!-- SAFETY DIRECTOR  -->
                <b-form-group label="Safety Director">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.safetyDirector"
                    placeholder="Enter safety director name"
                  ></b-form-input>
                </b-form-group>

                <!-- EVENT DIRECTOR  -->
                <b-form-group label="Event Director">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.eventDirector"
                    placeholder="Enter event director name"
                  ></b-form-input>
                </b-form-group>
              </div>
            </form>

            <div class="d-flex mt-5" style="justify-content: space-between">
              <div>
                <b-button @click="goTo()" variant="primary">
                  <Icon
                    icon="ic:baseline-keyboard-double-arrow-left"
                  />Back</b-button
                >
              </div>
              <div>
                <!-- <b-button @click="goTo()" variant="primary">
                  <Icon
                    icon="ic:baseline-keyboard-double-arrow-left"
                  />Back</b-button
                > -->
                <b-button type="input" variant="primary">
                  Simpan <Icon icon="ic:baseline-keyboard-double-arrow-right"
                /></b-button>
              </div>
            </div>
          </b-card>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import Multiselect from "vue-multiselect";

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
        eventCategory: [],
        divisionCategory: [],
        raceCategory: [],
        initialCategory: [],
        chiefJudge: "",
        raceDirector: "",
        safetyDirector: "",
        eventDirector: "",
      },
      optionLevels: [
        { name: "select", text: "Select Level Event" },
        { value: 0, text: "PON" },
        { value: 1, text: "KEJURNAS" },
        { value: 2, text: "KEJURDA" },
      ],
      optionCategorys: [
        { value: null, name: "Select Event Category" },
        { value: 0, name: "SPRINT" },
        { value: 1, name: "H2H" },
        { value: 2, name: "SLALOM" },
        { value: 3, name: "DRR" },
      ],
      optionDivisions: [
        { value: null, text: "Select Division Category" },
        { value: 0, text: "R4" },
        { value: 1, text: "R6" },
      ],
      optionRaces: [
        { value: null, text: "Select Race Category" },
        { value: 0, text: "MEN" },
        { value: 1, text: "WOMEN" },
      ],
      optionInitials: [
        { value: null, text: "Select Initial Category" },
        { value: 0, text: "OPEN" },
      ],
    };
  },

  mounted() {},

  methods: {
    goTo() {
      this.$router.push("/");
    },
    save() {
      console.log(this.formEvent, "<< cek form Event");
    },
  },
};
</script>

<style lang="scss" scoped></style>
