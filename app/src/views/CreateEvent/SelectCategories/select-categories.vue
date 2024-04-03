<template>
  <div>
    <b-row>
      <b-col cols="10" offset="1" class="mb-5">
        <div>
          <b-card
            title="Add Teams"
            sub-title="Added Information Event Details"
            class="m-5"
            style="border-radius: 15px; border-color: black"
          >
         
            <!-- R4 MEN -->
            <b-row>
              <b-col>
                <b-card
                  title="R4 MEN"
                  sub-title="Added Information Event Details"
                  class="m-5 cardHover"
                  style="border-radius: 15px; border-color: black"
                >
                  <template #header>
                    <b-row class="justify-content-end">
                      <b-col cols="auto">
                        <b-button variant="primary" @click="handleButtonClick"
                          >Add New</b-button
                        >
                      </b-col>
                    </b-row>
                  </template>

                  <b-table striped hover :items="teams" :fields="fields">
                    <template #cell(Action)="row">
                      <b-button variant="primary" size="sm" @click="editTeam(row.item)">Edit</b-button>
                      <b-button variant="danger" size="sm" @click="deleteTeam(row.item)">Delete</b-button>
                    </template>
                  </b-table>
                </b-card>
              </b-col>
            </b-row>

            <!-- R4 WOMEN  -->
            <b-row>
              <b-col>
                <b-card
                  title="R4 WOMEN"
                  sub-title="Added Information Event Details"
                  class="m-5 cardHover"
                  style="border-radius: 15px; border-color: black"
                >
                  <template #header>
                    <b-row class="justify-content-end">
                      <b-col cols="auto">
                        <b-button variant="primary" @click="handleButtonClick"
                          >Add New</b-button
                        >
                      </b-col>
                    </b-row>
                  </template>

                  <b-table striped hover :items="teams" :fields="fields">
                    <template #cell(Action)="row">
                      <b-button variant="primary" size="sm" @click="editTeam(row.item)">Edit</b-button>
                      <b-button variant="danger" size="sm" @click="deleteTeam(row.item)">Delete</b-button>
                    </template>
                  </b-table>
                </b-card>
              </b-col>
            </b-row>

            <hr/>

            <!-- R6 MEN  -->
            <b-row>
              <b-col>
                <b-card
                  title="R6 MEN"
                  sub-title="Added Information Event Details"
                  class="m-5 cardHover"
                  style="border-radius: 15px; border-color: black"
                >
                  <template #header>
                    <b-row class="justify-content-end">
                      <b-col cols="auto">
                        <b-button variant="primary" @click="handleButtonClick"
                          >Add New</b-button
                        >
                      </b-col>
                    </b-row>
                  </template>

                  <b-table striped hover :items="teams" :fields="fields">
                    <template #cell(Action)="row">
                      <b-button variant="primary" size="sm" @click="editTeam(row.item)">Edit</b-button>
                      <b-button variant="danger" size="sm" @click="deleteTeam(row.item)">Delete</b-button>
                    </template>
                  </b-table>
                </b-card>
              </b-col>
            </b-row>

            <!-- R6 WOMEN  -->
            <b-row>
              <b-col>
                <b-card
                  title="R6 WOMEN"
                  sub-title="Added Information Event Details"
                  class="m-5 cardHover"
                  style="border-radius: 15px; border-color: black"
                >
                  <template #header>
                    <b-row class="justify-content-end">
                      <b-col cols="auto">
                        <b-button variant="primary" @click="handleButtonClick"
                          >Add New</b-button
                        >
                      </b-col>
                    </b-row>
                  </template>

                  <b-table striped hover :items="teams" :fields="fields">
                    <template #cell(Action)="row">
                      <b-button variant="primary" size="sm" @click="editTeam(row.item)">Edit</b-button>
                      <b-button variant="danger" size="sm" @click="deleteTeam(row.item)">Delete</b-button>
                    </template>
                  </b-table>
                </b-card>
              </b-col>
            </b-row>
        


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
                  Simpan Data Event <Icon icon="ic:baseline-keyboard-double-arrow-right"
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
    handleButtonClick() {
        
    }
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
