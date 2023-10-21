<template>
  <div>
    <h4>Create New Event</h4>
    <b-row>
      <b-col>
        <b-button @click="goTo()" variant="primary">
          <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back</b-button
        >
      </b-col>
      <b-col class="col-9">
        <div>
          <b-card
            title="Added Event"
            sub-title="Menambahkan Informasi Kegiatan Disini"
          >
            <form>
              <div>
                <b-form-group
                  id="fieldset-1"
                  description="Let us know your name."
                  label="Event Name"
                  label-for="input-1"
                  valid-feedback="Thank you!"
                  :invalid-feedback="invalidFeedback"
                  :state="state"
                >
                  <b-form-input
                    v-model="name"
                    placeholder="Enter your event name"
                  ></b-form-input>
                </b-form-group>

                <!-- Datepicker -->
                <b-form-group
                  id="fieldset-1"
                  description="Let us know your name."
                  label="Date"
                  label-for="input-1"
                  valid-feedback="Thank you!"
                  :invalid-feedback="invalidFeedback"
                  :state="state"
                >
                  <b-form-input
                    v-model="name"
                    placeholder="Enter your name"
                  ></b-form-input>
                </b-form-group>


                <b-form-group
                  id="fieldset-1"
                  description="Let us know your name."
                  label="Place"
                  label-for="input-1"
                  valid-feedback="Thank you!"
                  :invalid-feedback="invalidFeedback"
                  :state="state"
                >
                  <b-form-input
                    v-model="name"
                    placeholder="Enter your name"
                  ></b-form-input>
                </b-form-group>

                <!-- Dropdown  -->
                <b-form-group
                  id="fieldset-1"
                  description="Let us know your name."
                  label="Level"
                  label-for="input-1"
                  valid-feedback="Thank you!"
                  :invalid-feedback="invalidFeedback"
                  :state="state"
                >
                  <b-form-input
                    v-model="name"
                    placeholder="Enter your name"
                  ></b-form-input>
                </b-form-group>

                <!-- Multiple Selected  -->
                <b-form-group
                  id="fieldset-1"
                  description="Let us know your name."
                  label="Categories"
                  label-for="input-1"
                  valid-feedback="Thank you!"
                  :invalid-feedback="invalidFeedback"
                  :state="state"
                >
                  <b-form-input
                    v-model="name"
                    placeholder="Enter your name"
                  ></b-form-input>
                </b-form-group>
              </div>
            </form>
          </b-card>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
export default {
  name: "SustainableTimingSystemCreateEvent",
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
    };
  },

  mounted() {},

  methods: {
    goTo() {
      this.$router.push("/");
    },
  },
};
</script>

<style lang="scss" scoped></style>
