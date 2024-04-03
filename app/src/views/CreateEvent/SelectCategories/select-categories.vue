<template>
  <div>
    <b-row>
      <b-col cols="10" offset="1" class="mb-5">
        <div>
          <b-card
            title="Select Categories"
            sub-title="Added Information Event Details"
            class="m-5"
            style="border-radius: 15px; border-color: black"
          >
            

            <div class="d-flex mt-5" style="justify-content: space-between">
              <div>
                <b-button @click="goTo()" variant="primary">
                  <Icon
                    icon="ic:baseline-keyboard-double-arrow-left"
                  />Back</b-button
                >
              </div>
              <div>
                <b-button @click="save()" type="input" variant="primary">
                  Next <Icon icon="ic:baseline-keyboard-double-arrow-right"
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
export default {
  name: 'SustainableTimingSystemRaftingSelectCategories',

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

  mounted() {
    
  },

  methods: {
    goTo() {
        this.$emit("backForm");
    }
  },
};
</script>