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
            style="border-radius: 25px"
          >
            <form ref="form-newEvent">
              <br />
              <div>
                <p class="h5 my-2">Event Information</p>

                <!-- EVENT LEVEL  -->
                <b-form-group label="Event Level">
                  <b-form-select
                    size="sm"
                    v-model="formEvent.levelName"
                    :options="optionLevels"
                    value-field="name"
                    text-field="name"
                  />
                </b-form-group>

                <!-- EVENT NAME  -->
                <b-form-group label="Event Name">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.eventName"
                    placeholder="Enter your event name"
                  />
                </b-form-group>

                <!-- RIVER NAME  -->
                <b-form-group label="River Name">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.riverName"
                    placeholder="Enter river name"
                  />
                </b-form-group>

                <br />
                <p class="h5 my-2">Date & Location</p>

                <!-- DISTRICT  -->
                <b-form-group label="District">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.addressDistrict"
                    placeholder="Enter District"
                  />
                </b-form-group>

                <b-row>
                  <!-- SUBDISTRICT  -->
                  <b-col cols="6">
                    <b-form-group label="Sub District">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressSubDistrict"
                        placeholder="Enter Sub District"
                      />
                    </b-form-group>
                  </b-col>

                  <!-- VILLAGE  -->
                  <b-col cols="6">
                    <b-form-group label="Village">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressVillage"
                        placeholder="Enter Village"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <!-- CITY  -->
                  <b-col cols="6">
                    <b-form-group label="City">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressCity"
                        placeholder="Enter City"
                      />
                    </b-form-group>
                  </b-col>

                  <!-- PROVINCE  -->
                  <b-col cols="6">
                    <b-form-group label="Province">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressProvince"
                        placeholder="Enter Province"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <!-- ZIP CODE  -->
                  <b-col cols="6">
                    <b-form-group label="ZIP Code">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressZipCode"
                        placeholder="Enter ZIP Code"
                      />
                    </b-form-group>
                  </b-col>

                  <b-col>
                    <!-- STATE -->
                    <b-form-group label="State">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressState"
                        placeholder="Enter State"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <b-col cols="6">
                    <!-- START DATE -->
                    <b-form-group label="Start Date">
                      <b-form-datepicker
                        size="sm"
                        v-model="formEvent.startDateEvent"
                        placeholder="Select start date"
                        class="mb-2"
                        :min="minDate"
                      />
                    </b-form-group>
                  </b-col>
                  <b-col cols="6">
                    <!-- END DATE -->
                    <b-form-group label="End Date">
                      <b-form-datepicker
                        :disabled="formEvent.startDateEvent === ''"
                        size="sm"
                        v-model="formEvent.endDateEvent"
                        placeholder="Select end date"
                        class="mb-2"
                        :min="formEvent.startDateEvent"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <br />
                <p class="h5 my-2">Race Details</p>

                <!-- EVENT CATEGORIES -->
                <b-form-group label="Event Categories" label-cols="3">
                  <multiselect
                    v-model="formEvent.categoriesEvent"
                    :options="optionCategories"
                    placeholder="Select event categories"
                    multiple
                    track-by="value"
                    label="name"
                  />
                </b-form-group>

                <!-- DIVISION CATEGORIES -->
                <b-form-group label="Division Categories" label-cols="3">
                  <multiselect
                    v-model="formEvent.categoriesDivision"
                    :options="optionDivisions"
                    placeholder="Select division categories"
                    multiple
                    track-by="value"
                    label="name"
                  />
                </b-form-group>

                <!-- RACE CATEGORIES -->
                <b-form-group label="Race Categories" label-cols="3">
                  <multiselect
                    v-model="formEvent.categoriesRace"
                    :options="optionRaces"
                    placeholder="Select race categories"
                    multiple
                    track-by="value"
                    label="name"
                  />
                </b-form-group>

                <!-- INITIAL CATEGORIES -->
                <b-form-group label="Initial Categories" label-cols="3">
                  <multiselect
                    v-model="formEvent.categoriesInitial"
                    :options="optionInitials"
                    placeholder="Select initial categories"
                    multiple
                    track-by="value"
                    label="name"
                  />
                </b-form-group>

                <!-- POSTER (OPTIONAL) -->
                <p class="h5 my-3">Poster (Optional)</p>
                <b-form-group label="Event Poster">
                  <div class="d-flex align-items-start">
                    <div class="mr-3">
                      <img
                        v-if="posterPreview"
                        :src="posterPreview"
                        alt="Poster preview"
                        style="width: 220px; max-height: 140px; object-fit: cover; border-radius: 12px; border:1px solid #eee;"
                      />
                      <div
                        v-else
                        class="d-flex align-items-center justify-content-center"
                        style="width:220px;height:140px;border:1px dashed #cbd5e1;border-radius:12px;color:#94a3b8;"
                      >
                        No image
                      </div>
                    </div>

                    <div>
                      <b-button
                        size="sm"
                        variant="primary"
                        class="mb-2"
                        :disabled="isUploadingPoster"
                        @click="pickAndUploadPoster"
                      >
                        {{ isUploadingPoster ? "Uploading…" : "Upload to Cloudinary" }}
                      </b-button>

                      <div class="text-muted small" v-if="formEvent.poster && formEvent.poster.secure_url">
                        Saved URL: <code>{{ formEvent.poster.secure_url }}</code>
                      </div>
                      <div class="text-muted small" v-if="formEvent.poster && formEvent.poster.public_id">
                        Public ID: <code>{{ formEvent.poster.public_id }}</code>
                      </div>

                      <div>
                        <b-button
                          v-if="formEvent.poster"
                          size="sm"
                          variant="outline-danger"
                          @click="clearPoster"
                        >
                          Remove Poster
                        </b-button>
                      </div>
                    </div>
                  </div>
                </b-form-group>

                <br />

                <b-row>
                  <b-col cols="6">
                    <b-form-group label="Chief Judge">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.chiefJudge"
                        placeholder="Enter chief judge name"
                      />
                    </b-form-group>
                  </b-col>
                  <b-col>
                    <b-form-group label="Race Director">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.raceDirector"
                        placeholder="Enter race director name"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <b-col cols="6">
                    <b-form-group label="Safety Director">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.safetyDirector"
                        placeholder="Enter safety director name"
                      />
                    </b-form-group>
                  </b-col>
                  <b-col>
                    <b-form-group label="Event Director">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.eventDirector"
                        placeholder="Enter event director name"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>
              </div>
            </form>

            <br />

            <div class="d-flex mt-5" style="justify-content: space-between">
              <div>
                <b-button
                  class="btn-md"
                  style="border-radius: 20px"
                  @click="goTo()"
                  variant="secondary"
                >
                  <Icon icon="ic:baseline-keyboard-double-arrow-left" />
                  Back
                </b-button>
              </div>
              <div>
                <b-button
                  class="btn-md"
                  style="border-radius: 20px"
                  @click="save()"
                  type="input"
                  variant="primary"
                >
                  Create Event
                  <Icon icon="ic:baseline-check-circle" />
                </b-button>
              </div>
            </div>
          </b-card>
        </div>
      </b-col>
    </b-row>

    <br /><br /><br />
  </div>
</template>

<script>
import Multiselect from "vue-multiselect";
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";

export default {
  name: "SustainableTimingSystemCreateEvent",
  components: { Multiselect, Icon },

  data() {
    return {
      posterPreview: "",
      isUploadingPoster: false,

      text: "",
      name: "",

      formEvent: {
        levelName: null,
        eventName: "",
        riverName: "",
        addressDistrict: "",
        addressSubDistrict: "",
        addressVillage: "",
        addressCity: "",
        addressProvince: "",
        addressZipCode: "",
        addressState: "",
        startDateEvent: "",
        endDateEvent: "",
        categoriesEvent: [],
        categoriesDivision: [],
        categoriesRace: [],
        categoriesInitial: [],
        chiefJudge: "",
        raceDirector: "",
        safetyDirector: "",
        eventDirector: "",
        participant: [],
        statusEvent: "Activated",
        poster: null, // { public_id, secure_url, ... } dari Cloudinary
      },

      optionLevels: [],
      optionCategories: [],
      optionDivisions: [],
      optionRaces: [],
      optionInitials: [],
      minDate: new Date(),
    };
  },

  async mounted() {
    await this.loadOptions();
    await this.checkValueStorage();
  },

  computed: {
    state() {
      return this.name.length >= 4;
    },
    invalidFeedback() {
      if (this.name.length > 0) return "Enter at least 4 characters.";
      return "Please enter something.";
    },
  },

  methods: {
    async checkValueStorage() {
      const dataStorage = localStorage.getItem("formNewEvent");
      const datas = dataStorage ? JSON.parse(dataStorage) : null;
      if (datas) {
        this.formEvent = datas;
        if (datas.poster && datas.poster.secure_url) {
          this.posterPreview = datas.poster.secure_url;
        }
      }
    },

    async loadOptions() {
      await this.setOptionLevel();
      await this.setOptionCategoriesEvent();
      await this.setOptionCategoriesDivision();
      await this.setOptionCategoriesInitial();
      await this.setOptionCategoriesRace();
    },

    async setOptionLevel() {
      ipcRenderer.send("option-level");
      ipcRenderer.on("option-level-reply", (_e, data) => {
        this.optionLevels = data || [];
      });
    },
    async setOptionCategoriesEvent() {
      ipcRenderer.send("option-categories-event");
      ipcRenderer.on("option-categories-event-reply", (_e, data) => {
        this.optionCategories = data || [];
      });
    },
    async setOptionCategoriesDivision() {
      ipcRenderer.send("option-categories-division");
      ipcRenderer.on("option-categories-division-reply", (_e, data) => {
        this.optionDivisions = data || [];
      });
    },
    async setOptionCategoriesInitial() {
      ipcRenderer.send("option-categories-initial");
      ipcRenderer.on("option-categories-initial-reply", (_e, data) => {
        this.optionInitials = data || [];
      });
    },
    async setOptionCategoriesRace() {
      ipcRenderer.send("option-categories-race");
      ipcRenderer.on("option-categories-race-reply", (_e, data) => {
        this.optionRaces = data || [];
      });
    },

    goTo() {
      localStorage.removeItem("formNewEvent");
      this.$router.push("/");
    },

    validateForm() {
      const f = this.formEvent;
      if (
        !f.levelName ||
        !f.eventName ||
        !f.riverName ||
        !f.addressDistrict ||
        !f.addressSubDistrict ||
        !f.addressVillage ||
        !f.addressCity ||
        !f.addressProvince ||
        !f.addressZipCode ||
        !f.addressState ||
        !f.startDateEvent ||
        !f.endDateEvent ||
        !(f.categoriesEvent && f.categoriesEvent.length) ||
        !(f.categoriesDivision && f.categoriesDivision.length) ||
        !(f.categoriesRace && f.categoriesRace.length) ||
        !(f.categoriesInitial && f.categoriesInitial.length) ||
        !f.chiefJudge ||
        !f.raceDirector ||
        !f.safetyDirector ||
        !f.eventDirector
      ) {
        return false;
      }
      return true;
    },

    async pickAndUploadPoster() {
      try {
        // cek preload file picker
        if (!window.fileAPI || typeof window.fileAPI.pickImage !== "function") {
          ipcRenderer.send("get-alert", {
            type: "warning",
            message: "Unavailable",
            detail: "File picker belum diexpose dari preload.",
          });
          return;
        }

        // pilih file
        const pick = await window.fileAPI.pickImage();
        if (!pick || !pick.ok || pick.canceled) return;

        // cek cloudinary bridge
        if (!window.cloud || typeof window.cloud.uploadImage !== "function") {
          ipcRenderer.send("get-alert", {
            type: "warning",
            message: "Unavailable",
            detail: "Cloudinary API belum diexpose dari preload.",
          });
          return;
        }

        this.isUploadingPoster = true;

        // upload ke cloudinary
        const up = await window.cloud.uploadImage(pick.path, {
          folder: "sts-rafter/events",
        });

        this.isUploadingPoster = false;

        if (!up || !up.ok || !up.result) {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Upload failed",
            detail: (up && up.error) || "Unknown error",
          });
          return;
        }

        // simpan metadata & preview
        this.formEvent.poster = up.result; // { public_id, secure_url, ... }
        this.posterPreview = up.result.secure_url || "";

        ipcRenderer.send("get-alert-saved", {
          type: "info",
          message: "Upload success",
          detail: "Poster berhasil diupload ke Cloudinary.",
        });
      } catch (err) {
        this.isUploadingPoster = false;
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "Upload error",
          detail: (err && err.message) || String(err),
        });
      }
    },

    async clearPoster() {
      try {
        const pub =
          this.formEvent && this.formEvent.poster
            ? this.formEvent.poster.public_id
            : null;

        if (pub && window.cloud && typeof window.cloud.deleteImage === "function") {
          await window.cloud.deleteImage(pub);
        }
      } catch (e) {
        console.warn("Failed to delete from Cloudinary:", e);
      } finally {
        this.formEvent.poster = null;
        this.posterPreview = "";
      }
    },

    save() {
      const formValid = this.validateForm();
      if (!formValid) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail: "To create an event, all fields must be filled in",
          message: "Ups Sorry",
        });
        return;
      }

      const payload = { ...this.formEvent, participant: [] }; // participant selalu kosong saat create
      ipcRenderer.send("insert-new-event", payload);

      ipcRenderer.once("insert-new-event-reply", (_e, _data) => {
        ipcRenderer.send("get-alert-saved", {
          type: "question",
          detail: "Event data has been successfully saved",
          message: "Successfully",
        });
      });

      setTimeout(() => {
        localStorage.removeItem("formNewEvent");
        this.$router.push("/");
      }, 1500);
    },
  },
};
</script>

<style lang="scss" scoped></style>