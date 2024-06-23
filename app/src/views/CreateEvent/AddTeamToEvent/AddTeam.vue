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
                    @click="getEvent(category)"
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

              <div class="my-4" v-if="eventActive.show">
                <div class="text-left" style="display: flex; gap: 1vh">
                  <b-button
                    v-for="category in formEvent.categoriesInitial"
                    :key="category.name"
                    style="border-radius: 20px"
                    :style="{
                      background:
                        isActivatedInitial === category.name
                          ? '#027BFE'
                          : '#C4C4C4',
                    }"
                    @click="getInitial(category)"
                  >
                    {{ category.name }}
                  </b-button>
                </div>
              </div>

              <div class="my-4" v-if="eventActive.show && initialActive.show">
                <div class="text-left" style="display: flex; gap: 1vh">
                  <b-button
                    v-for="category in formEvent.categoriesRace"
                    :key="category.name"
                    style="border-radius: 20px"
                    :style="{
                      background:
                        isActivatedRace === category.name
                          ? '#027BFE'
                          : '#C4C4C4',
                    }"
                    @click="getRace(category)"
                  >
                    {{ category.name }}
                  </b-button>
                </div>
              </div>

              <div
                class="my-4"
                v-if="eventActive.show && initialActive.show && raceActive.show"
              >
                <div class="text-left" style="display: flex; gap: 1vh">
                  <b-button
                    v-for="category in formEvent.categoriesDivision"
                    :key="category.name"
                    style="border-radius: 20px"
                    :style="{
                      background:
                        isActivatedDivision === category.name
                          ? '#027BFE'
                          : '#C4C4C4',
                    }"
                    @click="getDivision(category)"
                  >
                    {{ category.name }}
                  </b-button>
                </div>
              </div>

              <div v-if="showEmptyCards">
                <cardEmptyVue />
              </div>
              <div v-else>
                <table-team-vue
                  :teamTitle="titleTeams"
                  :data="dataTeams"
                  :filterEvent="eventActive.selected"
                  :filterInitial="initialActive.selected"
                  :filterRace="raceActive.selected"
                  :filterDivision="divisionActive.selected"
                  :fields="headersTable"
                  @open-modal="openModal(formEvent.participant)"
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
import tableTeamVue from "../../../components/cards/table-team.vue";
import { ipcRenderer } from "electron";

export default {
  name: "SustainableTimingSystemRaftingSelectCategories",
  props: {
    open: Boolean,
  },
  components: {
    Multiselect,
    cardEmptyVue,
    tableTeamVue,
  },
  data() {
    return {
      showEmptyCards: true,
      headersTable: [
        { key: "no", label: "No" },
        { key: "nameTeam", label: "Team Name" },
        { key: "bibTeam", label: "Bib Number" },
        { key: "Action" },
      ],
      formModal: {
        nameTeam: "",
        bibTeam: "",
      },
      isActivated: "",
      formEvent: {},
      showCategoriesSprint: false,
      showCategoriesHead2Head: false,
      showCategoriesSlalom: false,
      showCategoriesDRR: false,
      eventActive: {
        selected: {},
        show: false,
        actived: false,
      },
      initialActive: {
        selected: {},
        show: false,
        actived: false,
      },
      raceActive: {
        selected: {},
        show: false,
        actived: false,
      },
      divisionActive: {
        selected: {},
        show: false,
        actived: false,
      },
      dataTeams: [],
      titleTeams: "",
      filteredIndex: "",
    };
  },
  async mounted() {
    if (this.open) {
      await this.checkValueStorage();
    }
    this.isActivated == "" ? "DRR" : "";
  },
  methods: {
    async checkValueStorage() {
      const dataStorage = localStorage.getItem("formNewEvent");
      const datas = JSON.parse(dataStorage);
      if (datas) {
        this.formEvent = datas;
      }
    },
    getEvent(payload) {
      this.isActivatedInitial = "";
      this.showEmptyCards = true;
      this.raceActive.show = false;
      this.initialActive.show = false;

      this.eventActive.show = !this.eventActive.show;
      if (this.eventActive.show) {
        this.eventActive.selected = payload;
        this.isActivated = payload.name;
      } else {
        this.eventActive.selected = {};
        this.isActivated = "";
      }
    },
    getInitial(payload) {
      this.isActivatedRace = "";
      this.showEmptyCards = true;
      this.raceActive.show = false;

      this.initialActive.show = !this.initialActive.show;
      if (this.initialActive.show) {
        this.initialActive.selected = payload;
        this.isActivatedInitial = payload.name;
      } else {
        this.initialActive.selected = {};
        this.isActivatedInitial = "";
      }
    },
    getRace(payload) {
      this.isActivatedDivision = "";
      this.showEmptyCards = true;
      this.divisionActive.show = false;

      this.raceActive.show = !this.raceActive.show;
      if (this.raceActive.show) {
        this.raceActive.selected = payload;
        this.isActivatedRace = payload.name;
      } else {
        this.raceActive.selected = {};
        this.isActivatedRace = "";
      }
    },
    getDivision(payload) {
      this.divisionActive.show = !this.divisionActive.show;
      if (this.divisionActive.show) {
        this.divisionActive.selected = payload;
        this.isActivatedDivision = payload.name;
        this.titleTeams = this.divisionActive.selected.name;
      } else {
        this.divisionActive.selected = {};
        this.isActivatedDivision = "";
      }
      this.showEmptyCards = !this.showEmptyCards;
    },
    goTo() {
      this.$emit("backForm");
    },
    openModal() {
      this.formModal.nameTeam = "";
      this.formModal.bibTeam = "";
      this.$bvModal.show("bv-modal-add-team");
    },
    validateForm() {
      if (!this.formModal.nameTeam || !this.formModal.bibTeam) {
        return false;
      }
      return true;
    },
    simpanNewTeam() {
      const formValid = this.validateForm();
      if (formValid) {
        // Data tim yang akan ditambahkan
        const defaultTeams = {
          nameTeam: this.formModal.nameTeam,
          bibTeam: this.formModal.bibTeam,
          startOrder: "",
          praStart: "",
          intervalRace: "",
          statusId: 0,
          result: {
            startTime: "",
            finishTime: "",
            raceTime: "",
            penaltyTime: "",
            penalty: "",
            totalTime: "",
            ranked: "",
            score: "",
          },
          otr: {
            startTime: "",
            finishTime: "",
            raceTime: "",
            penaltyTime: "",
            penalty: "",
            totalTime: "",
            ranked: "",
            score: "",
          },
        };

        const slalomTeams = {
          nameTeam: this.formModal.nameTeam,
          bibTeam: this.formModal.bibTeam,
          startOrder: "",
          praStart: "",
          intervalRace: "",
          statusId: 0,
          result: [
            {
              startTime: "",
              finishTime: "",
              raceTime: "",
              penaltyTime: "",
              penalty: "",
              totalTime: "",
              ranked: "",
              score: "",
            },
            {
              startTime: "",
              finishTime: "",
              raceTime: "",
              penaltyTime: "",
              penalty: "",
              totalTime: "",
              ranked: "",
              score: "",
            },
          ],
        };

        const head2headTeams = {
          nameTeam: this.formModal.nameTeam,
          bibTeam: this.formModal.bibTeam,
          startOrder: "",
          praStart: "",
          intervalRace: "",
          statusId: 0,
          result: [
            {
              startTime: "",
              finishTime: "",
              raceTime: "",
              penaltyTime: "",
              penalty: "",
              totalTime: "",
              ranked: "",
              score: "",
              bracket: 16,
            },
          ],
        };

        const existingTeam = this.dataTeams.find((team) => {
          return (
            team.eventId === this.eventActive.selected.value &&
            team.initialId === this.initialActive.selected.value &&
            team.raceId === this.raceActive.selected.value &&
            team.divisionId === this.divisionActive.selected.value
          );
        });

        if (existingTeam) {
          // Add new team to existing object
          this.filteredIndex = this.dataTeams.findIndex((item) => {
            return (
              item.eventId === this.eventActive.selected.value &&
              item.initialId === this.initialActive.selected.value &&
              item.raceId === this.raceActive.selected.value &&
              item.divisionId === this.divisionActive.selected.value
            );
          });

          if (this.eventActive.selected.value == "3") {
            this.dataTeams[this.filteredIndex].teams.push(slalomTeams);
          } else if (this.eventActive.selected.value == "2") {
            this.dataTeams[this.filteredIndex].teams.push(head2headTeams);
          } else {
            this.dataTeams[this.filteredIndex].teams.push(defaultTeams);
          }
        } else {
          let payload = {
            eventId: this.eventActive.selected.value,
            initialId: this.initialActive.selected.value,
            raceId: this.raceActive.selected.value,
            divisionId: this.divisionActive.selected.value,
            eventName: this.eventActive.selected.name,
            initialName: this.initialActive.selected.name,
            raceName: this.raceActive.selected.name,
            divisionName: this.divisionActive.selected.name,
            teams: [],
          };

          if (this.eventActive.selected.value == "3") {
            payload.teams.push(slalomTeams);
          } else if (this.eventActive.selected.value == "2") {
            payload.teams.push(head2headTeams);
          } else {
            payload.teams.push(defaultTeams);
          }
          this.dataTeams.push(payload);
        }

        this.$bvModal.hide("bv-modal-add-team");
      } else {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail: "Fields Name Team and BIB Number Team must be filled",
          message: "Ups Sorry",
        });
      }
    },
    validateSave() {
      return this.formEvent.participant.every((item) => item.teams.length > 0);
    },
    save() {
      const saveValid = this.validateSave();
      if (saveValid) {
        let payload = this.formEvent;
        payload.participant = this.dataTeams;
        ipcRenderer.send("insert-new-event", payload);
        ipcRenderer.on("insert-new-event-reply", (event, data) => {
          ipcRenderer.send("get-alert-saved", {
            type: "question",
            detail: `Event data has been successfully saved`,
            message: "Successfully",
          });
        });
        setTimeout(() => {
          localStorage.removeItem("formNewEvent");
          this.$router.push("/");
        }, 1500);
      } else {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail: "Kategoris belum meemiliki tim",
          message: "Ups Sorry",
        });
      }
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
