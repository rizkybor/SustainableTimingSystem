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
                        <Icon
                          icon="ic:baseline-keyboard-double-arrow-left"
                        />Back
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
              </div>

              <div class="my-4">
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
              </div>
              <!-- {{ formEvent }} -->
              <div v-if="showEmptyCards">
                <cardEmptyVue />
              </div>
              <div v-else>
                <cardTeamVue
                  :teamTitle="'R4 - MEN'"
                  :teams="teamsR4men"
                  :fields="headersTable"
                  @open-modal="openModal(formEvent.participant, 'R4men')"
                />

                <br />

                <cardTeamVue
                  v-if="team.R4women"
                  :teamTitle="'R4 - WOMEN'"
                  :teams="teamsR4women"
                  :fields="headersTable"
                  @open-modal="openModal(formEvent.participant, 'R4women')"
                />

                <br />

                <cardTeamVue
                  v-if="team.R6men"
                  :teamTitle="'R6 - MEN'"
                  :teams="teamsR6men"
                  :fields="headersTable"
                  @open-modal="openModal(formEvent.participant, 'R6men')"
                />

                <br />

                <cardTeamVue
                  v-if="team.R6women"
                  :teamTitle="'R6 - WOMEN'"
                  :teams="teamsR6women"
                  :fields="headersTable"
                  @open-modal="openModal(formEvent.participant, 'R6women')"
                />
              </div>
            </b-col>
          </b-row>
        </div>
      </b-col>
    </b-row>

    <br />
    <br />

    <!-- // AREA MODAL  -->
    <b-modal id="bv-modal-add-team" hide-footer no-close-on-backdrop centered>
      <template #modal-title>
        Add New Team -
        {{
          isActivated == "SPRINT"
            ? "Sprint Categories"
            : isActivated == "DRR"
            ? "DRR Categories"
            : isActivated == "HEAD2HEAD"
            ? "Head 2 Head Categories"
            : isActivated == "SLALOM"
            ? "Slalom Categories"
            : ""
        }}</template
      >
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
import cardEmptyVue from "../../../components/cards/card-empty.vue";
import cardTeamVue from "../../../components/cards/card-team.vue";

export default {
  name: "SustainableTimingSystemRaftingSelectCategories",
  props: {
    open: Boolean,
  },
  components: {
    Multiselect,
    cardTeamVue,
    cardEmptyVue,
  },
  data() {
    return {
      modalRaceCategories: "",
      modalDivision: "",
      modalDatas: [],
      showEmptyCards: true,
      teams: [
        { No: 1, "Nama Team": "Team A", BIB: "001" },
        { No: 2, "Nama Team": "Team B", BIB: "002" },
        { No: 3, "Nama Team": "Team C", BIB: "003" },
      ],
      headersTable: ["No", "name", "bib", "Action"],
      optionCategories: [],
      formModal: {
        nameTeam: "",
        bibTeam: "",
      },
      team: {
        R4men: [],
        R4women: [],
        R6men: [],
        R6women: [],
      },
      isActivated: "",
      indexCategories: 0,
      formEvent: {},
      showCategoriesSprint: false,
      showCategoriesHead2Head: false,
      showCategoriesSlalom: false,
      showCategoriesDRR: false,
      showTable: {
        showR4MenSprint: false,
        showR4WomenSprint: false,
        showR6MenSprint: false,
        showR6WomenSprint: false,
        showR4MenDDR: false,
        showR4WomenDDR: false,
        showR6MenDDR: false,
        showR6WomenDDR: false,
        showR4MenH2H: false,
        showR4WomenH2H: false,
        showR6MenH2H: false,
        showR6WomenH2H: false,
        showR4MenSlalom: false,
        showR4WomenSlalom: false,
        showR6MenSlalom: false,
        showR6WomenSlalom: false,
      },
    };
  },
  computed: {
    teamsR4men() {
      return this.formEvent.participant.find(
        (item) =>
          item.divisiType === "R4men" && item.categories === this.isActivated
      ).teams;
    },
    teamsR4women() {
      return this.formEvent.participant.find(
        (item) =>
          item.divisiType === "R4women" && item.categories === this.isActivated
      ).teams;
    },
    teamsR6men() {
      return this.formEvent.participant.find(
        (item) =>
          item.divisiType === "R6men" && item.categories === this.isActivated
      ).teams;
    },
    teamsR6women() {
      return this.formEvent.participant.find(
        (item) =>
          item.divisiType === "R6women" && item.categories === this.isActivated
      ).teams;
    },
  },
  async mounted() {
    if (this.open) {
      await this.checkValueStorage();
    }
    this.isActivated == "" ? "DRR" : "";
  },
  methods: {
    loadOptions() {},
    checkValueStorage() {
      const dataStorage = localStorage.getItem("formNewEvent");
      const datas = JSON.parse(dataStorage);
      if (datas) {
        this.formEvent = datas;
      }

      // Definisikan kategori baru
      const newCategories = ["SPRINT", "SLALOM", "HEAD2HEAD", "DRR"];

      newCategories.forEach((category) => {
        // Periksa apakah kategori baru tersebut ada dalam data
        const categoryData = datas.categoriesEvent.find(
          (e) => e.name === category
        );
        if (categoryData) {
          // Jika ada, tampilkan kategori tersebut
          if (category === "SPRINT") {
            this.showCategoriesSprint = true;
          } else if (category === "DRR") {
            this.showCategoriesDRR = true;
          } else if (category === "HEAD2HEAD") {
            this.showCategoriesHead2Head = true;
          } else if (category === "SLALOM") {
            this.showCategoriesSlalom = true;
          }

          // Buat array baru untuk setiap divisi dengan kategori baru
          const divisiTypes = ["R4men", "R4women", "R6men", "R6women"];
          const result = divisiTypes.map((divisiType) => ({
            categories: category,
            divisiType: divisiType,
            teams: [],
          }));

          // Tambahkan array hasil ke formEvent.participant
          this.formEvent.participant.push(...result);
        }
      });
    },
    getIndex(payload) {
      console.log(payload, "<< pay");
    },
    loadTeams(payload) {
      this.showEmptyCards = false;
      let ev = this.formEvent.participant;

      this.isActivated = payload.name; //get current name categories

      for (const obj of ev) {
        for (const [key, value] of Object.entries(obj)) {
          if (key === payload.name.toLowerCase()) {
            // R4 Men
            value[0].details[0].teams;

            // R4 Women
            value[0].details[1].teams;

            // R6 Men
            value[1].details[0].teams;

            // R6 Women
            value[1].details[1].teams;
          }
        }
      }
    },
    goTo() {
      this.$emit("backForm");
    },
    openModal(datas, division) {
      this.modalDivision = division;
      this.modalDatas = datas;
      this.$bvModal.show("bv-modal-add-team");
    },
    simpanNewTeam() {
      // Data tim yang akan ditambahkan
      const addTeams = {
        name: this.formModal.nameTeam,
        bib: this.formModal.bibTeam,
      };

      // Mencari objek yang memiliki divisiType yang sama dengan this.modalDivision
      const matchingData = this.modalDatas.find(
        (data) =>
          data.divisiType === this.modalDivision &&
          data.categories == this.isActivated
      );

      // Jika ditemukan objek yang sesuai, tambahkan tim baru ke dalam array teams
      if (matchingData) {
        matchingData.teams.push(addTeams);
      }
    },
    save(){
      console.log(JSON.stringify(this.formEvent))
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
