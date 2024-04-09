<template>
  <div class="m-4">
    <b-row>
      <b-col cols="10" offset="1" class="mb-5">
        <div>
          <b-row>
            <b-col>
              <div class="mx-2 mt-3">
                <p class="h6 text-muted">
                  Home / Create New Event / List All Teams
                </p>
              </div>
              <div class="mx-2 my-5 mt-2">
                <p class="h2">All Teams</p>
              </div>
              <div class="my-4">
                <div class="text-left" style="display: flex; gap: 1vh">
                  <b-button style="border-radius: 20px" variant="primary">
                    <img
                      src="../../../assets/icons/drr.png"
                      alt="DDR"
                      style="height: 50px; margin-right: 5px"
                    />
                    DRR
                  </b-button>
                  <b-button
                    style="border-radius: 20px"
                    variant="primary"
                    disabled
                  >
                    <img
                      src="../../../assets/icons/sprint.png"
                      alt="DDR"
                      style="height: 50px; margin-right: 5px"
                    />
                    SPRINT
                  </b-button>
                  <b-button
                    style="border-radius: 20px"
                    variant="primary"
                    disabled
                  >
                    <img
                      src="../../../assets/icons/h2h.png"
                      alt="DDR"
                      style="height: 50px; margin-right: 5px"
                    />
                    H2H
                  </b-button>
                  <b-button
                    style="border-radius: 20px"
                    variant="primary"
                    disabled
                  >
                    <img
                      src="../../../assets/icons/slalom.png"
                      alt="DDR"
                      style="height: 50px; margin-right: 5px"
                    />
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
                      @click="$bvModal.show('bv-modal-add-team')"
                    >
                      <Icon icon="ic:baseline-add-circle" /> Add New
                      Team</b-button
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
                <Icon icon="material-symbols-light:save" />
              </b-button>
            </div>
          </div>
        </div>
        <div></div>
      </b-col>
    </b-row>
    <!-- // AREA MODAL  -->
    <b-modal id="bv-modal-add-team" hide-footer no-close-on-backdrop centered>
      <template #modal-title> Add New Team </template>
      <div class="d-block text-left mx-4 my-3">
        <!-- TEAM NAME  -->
        <b-form-group label="Name Team">
          <b-form-input
            v-model="formModal.nameTeam"
            placeholder="Enter team"
          ></b-form-input>
        </b-form-group>

        <!-- TEAM BIB  -->
        <b-form-group label="BIB Number Team">
          <b-form-input
            v-model="formModal.bibTeam"
            placeholder="Enter bib"
          ></b-form-input>
        </b-form-group>

        <!-- TEAM CATEGORIES  -->
        <b-form-group label="Categories">
          <multiselect
            v-model="formModal.categoriesTeam"
            :options="optionCategories"
            placeholder="Select categories"
            multiple
            track-by="value"
            label="name"
          ></multiselect>
        </b-form-group>
      </div>
      <div class="mt-5 p-4" style="display: flex; gap: 2vh">
        <b-button
          style="border-radius: 20px"
          block
          @click="$bvModal.hide('bv-modal-add-team')"
          >Close</b-button
        >
        <br />
        <b-button
          style="border-radius: 20px"
          variant="primary"
          block
          @click="simpanNewTeam"
          >Save Team</b-button
        >
      </div>
    </b-modal>
    <!-- // AREA MODAL  -->
  </div>
</template>

<script>
import Multiselect from "vue-multiselect";

import modalAddTeamVue from "../../../components/modals/modal-addTeam.vue";
export default {
  name: "SustainableTimingSystemRaftingSelectCategories",
  components: {
    modalAddTeamVue,
    Multiselect,
  },
  data() {
    return {
      text: "",
      name: "",
      fields: ["No", "Nama Team", "BIB", "Categories", "Action"],
      teams: [
        { No: 1, "Nama Team": "Team A", BIB: "001", Categories: "R4" },
        { No: 2, "Nama Team": "Team B", BIB: "002", Categories: "R4" },
        { No: 3, "Nama Team": "Team C", BIB: "003", Categories: "R4" },
      ],
      optionCategories: [],
      formModal: {
        nameTeam: "",
        bibTeam: "",
        categoriesTeam: [],
      },
    };
  },

  mounted() {},

  methods: {
    goTo() {
      this.$emit("backForm");
    },
    simpanNewTeam() {
      console.log("simpan team");
    },
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
