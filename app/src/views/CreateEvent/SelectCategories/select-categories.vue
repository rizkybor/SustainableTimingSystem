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

                  <!-- BTN DRR  -->
                  <b-button
                    style="border-radius: 20px"
                    :style="{ background: isActivated == 'DRR' ? '#027BFE' : '#C4C4C4' }"
                    @click="loadTeams('DRR')"
                  >
                    <img
                      src="../../../assets/icons/drr.png"
                      alt="DRR"
                      style="height: 50px; margin-right: 5px"
                    />
                    DRR
                  </b-button>

                  <!-- BTN SPRINT  -->
                  <b-button
                    style="border-radius: 20px"
                    :style="{ background: isActivated == 'SPRINT' ? '#027BFE' : '#C4C4C4' }"
                    @click="loadTeams('SPRINT')"
                  >
                    <img
                      src="../../../assets/icons/sprint.png"
                      alt="SPRINT"
                      style="height: 50px; margin-right: 5px"
                    />
                    SPRINT
                  </b-button>

                  <!-- BTN H2H  -->
                  <b-button
                    style="border-radius: 20px"
                    :style="{ background: isActivated == 'H2H' ? '#027BFE' : '#C4C4C4' }"
                    @click="loadTeams('H2H')"
                  >
                    <img
                      src="../../../assets/icons/h2h.png"
                      alt="H2H"
                      style="height: 50px; margin-right: 5px"
                    />
                    H2H
                  </b-button>

                  <!-- BTN SLALOM  -->
                  <b-button
                    style="border-radius: 20px"
                    :style="{ background: isActivated == 'SLALOM' ? '#027BFE' : '#C4C4C4' }"
                    @click="loadTeams('SLALOM')"
                  >
                    <img
                      src="../../../assets/icons/slalom.png"
                      alt="SLALOM"
                      style="height: 50px; margin-right: 5px"
                    />
                    SLALOM
                  </b-button>
                </div>
              </div>

              <cardTeamVue
                :teamTitle="teamsComponent.title"
                :teams="teamsComponent.team"
                :fields="teamsComponent.fields"
                @open-modal="$bvModal.show('bv-modal-add-team')"
              />

              <br />

              <cardTeamVue
                :teamTitle="teamsComponentW.title"
                :teams="teamsComponentW.team"
                :fields="teamsComponent.fields"
                @open-modal="$bvModal.show('bv-modal-add-team')"
              />
            </b-col>
          </b-row>

          <div class="d-flex mt-5" style="justify-content: space-between">
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
                @click="save()"
                type="input"
                variant="success"
                class="btn-md"
              >
                <Icon icon="material-symbols-light:save" />
                Save Event
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
          class="btn-md"
          style="border-radius: 20px"
          block
          @click="$bvModal.hide('bv-modal-add-team')"
          >Close</b-button
        >
        <br />
        <b-button
          class="btn-md"
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
import cardTeamVue from "../../../components/cards/card-team.vue";
export default {
  name: "SustainableTimingSystemRaftingSelectCategories",
  components: {
    Multiselect,
    cardTeamVue,
  },
  data() {
    return {
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
      teamsComponent: {
        title: "",
        team: [],
        fields: ["No", "Nama Team", "BIB", "Categories", "Action"],
      },
      teamsComponentW: {
        title: "",
        team: [],
        fields: ["No", "Nama Team", "BIB", "Categories", "Action"],
      },
      isActivated: "",
    };
  },

  mounted() {
    this.isActivated == '' ? 'DRR' : '';
  },

  methods: {
    loadTeams(category) {
      this.isActivated = category
      this.teamsComponent.title = `TEAM R4 - ${category} MEN`;
      this.teamsComponent.team = this.teams[category];

      this.teamsComponentW.title = `TEAM R4 - ${category} WOMEN`;
      this.teamsComponentW.team = this.teams[category];
    },
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
