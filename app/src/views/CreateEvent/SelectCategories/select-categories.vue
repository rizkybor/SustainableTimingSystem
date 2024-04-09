<template>
  <div class="m-4">
    <b-row>
      <b-col cols="10" offset="1" class="mb-5">
        <div>
          <b-row>
            <b-col>
              <div class="mx-2 mt-3">
                <p class="h6">Home / Add Team</p>
              </div>
              <div class="mx-2 my-5 mt-2">
                <p class="h2">Add Team</p>
              </div>
              <div class="my-4">
                <div class="text-left" style="display: flex; gap: 1vh">
                  <b-button style="border-radius: 20px" variant="primary">
                    DDR
                  </b-button>
                  <b-button style="border-radius: 20px" variant="primary">
                    SPRINT
                  </b-button>
                  <b-button style="border-radius: 20px" variant="primary">
                    H2H
                  </b-button>
                  <b-button style="border-radius: 20px" variant="primary">
                    SLALOM
                  </b-button>
                </div>
              </div>
              <b-card class="shadow" style="border-radius: 20px">
                <template #header>
                  <div style="display: flex; justify-content: space-between">
                    <div class="mx-2 mt-3">
                      <p class="h5 font-weight-bold">TEAM R4 - DDR MEN</p>
                    </div>
                    <b-button
                      style="border-radius: 20px"
                      class="btn-sm"
                      variant="primary"
                      @click="handleButtonClick"
                      >Add New Team</b-button
                    >
                  </div>
                </template>

                <b-table striped hover :items="teams" :fields="fields">
                  <template #cell(Action)="row">
                    <div style="display: flex; gap: 1vh">
                      <b-button
                        style="border-radius: 20px"
                        variant="warning"
                        size="sm"
                        @click="editTeam(row.item)"
                        >Edit</b-button
                      >
                      <b-button
                        style="border-radius: 20px"
                        variant="danger"
                        size="sm"
                        @click="deleteTeam(row.item)"
                        >Delete</b-button
                      >
                    </div>
                  </template>
                </b-table>
              </b-card>
            </b-col>
          </b-row>

          <div class="d-flex mt-5" style="justify-content: space-between">
            <div>
              <b-button
                style="border-radius: 20px"
                @click="goTo()"
                variant="secondary"
              >
                <Icon
                  icon="ic:baseline-keyboard-double-arrow-left"
                />Back</b-button
              >
            </div>
            <div>
              <b-button
                style="border-radius: 20px"
                @click="save()"
                type="input"
                variant="success"
              >
                Simpan Data Event
                <Icon icon="ic:baseline-keyboard-double-arrow-right"
              /></b-button>
            </div>
          </div>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
export default {
  name: "SustainableTimingSystemRaftingSelectCategories",

  data() {
    return {
      text: "",
      name: "",
      fields: ["No", "Nama Team", "BIB", "Categories", "Action"],
      teams: [
        { No: 1, "Nama Team": "Team A", BIB: "001", Categories: "R4" },
        { No: 2, "Nama Team": "Team B", BIB: "002", Categories: "R4" },
        { No: 3, "Nama Team": "Team C", BIB: "003", Categories: "R4" },
        // Tambahkan data tim lainnya sesuai kebutuhan
      ],
    };
  },

  mounted() {},

  methods: {
    goTo() {
      this.$emit("backForm");
    },
    handleButtonClick() {},
  },
};
</script>

<style scoped>
.cardHover {
  cursor: pointer;
  background-color: var(--black) !important;
}

.cardHover:hover {
  background-color: var(--black) !important;
}
</style>
