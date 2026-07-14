<template>
  <div>
    <b-row>
      <b-col cols="10" offset="1" class="mb-5">
        <div style="margin-top: 48px">
          <div class="card-wrapper p-3 mb-2">
            <!-- TOP BAR (breadcrumb + datetime) -->
            <div
              class="d-flex align-items-center justify-content-between text-muted small"
            >
              <b-breadcrumb class="mb-0">
                <b-breadcrumb-item to="/">
                  <Icon icon="mdi:home-outline" class="mr-1" />
                  Dashboard
                </b-breadcrumb-item>
                <b-breadcrumb-item active>
                  {{ $route.params.pageTitle || "Create New Event" }}
                </b-breadcrumb-item>
              </b-breadcrumb>
              <div>{{ currentDateTime }}</div>
            </div>
          </div>

          <b-card
            title="Create New Event"
            sub-title="Added Information Event Information, Schedule & Race Details"
            class="m-3 shadow px-3 py-2"
            style="border-radius: 25px"
          >
            <form ref="form-newEvent">
              <br />
              <div>
                <!-- ===== Event Information ===== -->
                <p style="font-weight: 700" class="h4 my-2 mb-3">
                  Event Information
                </p>

                <b-row>
                  <!-- KIRI: field level, event name, river name -->
                  <b-col md="8">
                    <b-form-group label="Event Level (Tingkat Event)">
                      <b-input-group size="sm">
                        <!-- Dropdown Event Level -->
                        <b-form-select
                          v-model="formEvent.levelName"
                          :options="sortedOptionLevels"
                          value-field="name"
                          text-field="name"
                          class="br-15"
                        />
                        <!-- Button Hint -->
                        <b-input-group-append>
                          <b-button
                            v-b-tooltip.hover
                            title="Keterangan level event"
                            variant="outline-info"
                            size="sm"
                            class="br-15"
                            @click="showListModal = true"
                          >
                            <Icon
                              icon="ic:outline-remove-red-eye"
                              width="18"
                              height="18"
                            />
                          </b-button>
                        </b-input-group-append>
                      </b-input-group>
                    </b-form-group>

                    <!-- Modal List -->
                    <b-modal
                      id="modal-list-event"
                      v-model="showListModal"
                      title="Event Level Guide"
                      size="md"
                      hide-footer
                      centered
                    >
                      <b-table
                        striped
                        hover
                        small
                        :items="sortedOptionLevels"
                        :fields="['name', 'scope']"
                        head-variant="light"
                        style="width: 100%; text-align: start"
                      >
                        <!-- 🔹 Atur vertical align di semua cell -->
                        <template #cell(name)="data">
                          <div
                            style="
                              display: flex;
                              justify-content: start;
                              align-items: center;
                              height: 100%;
                              min-height: 40px;
                            "
                          >
                            {{ data.item.name }}
                          </div>
                        </template>

                        <template #cell(scope)="data">
                          <div
                            style="
                              display: flex;
                              flex-direction: column;
                              justify-content: start;
                              align-items: start;
                              height: 100%;
                              min-height: 40px;
                            "
                          >
                            <ol style="margin: 0; padding: 0">
                              <li
                                v-for="(item, i) in data.item.scope"
                                :key="i"
                                style="padding: 2px 0"
                              >
                                {{ item }}
                              </li>
                            </ol>
                          </div>
                        </template>
                      </b-table>
                    </b-modal>

                    <!-- EVENT NAME  -->
                    <b-form-group label="Event Name (Nama Event)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.eventName"
                        placeholder="Enter your event name"
                        class="br-15"
                      />
                    </b-form-group>

                    <!-- RIVER NAME  -->
                    <b-form-group label="River Name (Nama Sungai)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.riverName"
                        placeholder="Enter river name"
                        class="br-15"
                      />
                    </b-form-group>
                  </b-col>

                  <!-- KANAN: upload (Event Poster) -->
                  <b-col md="4">
                    <b-form-group label="Event Poster (Poster Event)">
                      <div class="d-flex flex-column align-items-stretch">
                        <div class="mb-2">
                          <img
                            v-if="posterPreview"
                            :src="posterPreview"
                            alt="Poster preview"
                            style="
                              width: 100%;
                              height: 180px;
                              object-fit: cover;
                              border-radius: 12px;
                              border: 1px solid #e5e7eb;
                            "
                          />
                          <div
                            v-else
                            class="d-flex align-items-center justify-content-center"
                            style="
                              width: 100%;
                              height: 180px;
                              border: 1px dashed #cbd5e1;
                              border-radius: 12px;
                              color: #94a3b8;
                              background: #fafafa;
                            "
                          >
                            Drag & Drop or Choose file to upload
                          </div>
                        </div>

                        <b-button
                          size="sm"
                          variant="primary"
                          class="btn-action"
                          :disabled="isUploadingPoster"
                          @click="pickAndUploadPoster"
                        >
                          {{
                            isUploadingPoster ? "Uploading…" : "Upload Image"
                          }}
                        </b-button>

                        <b-button
                          v-if="formEvent.poster"
                          size="sm"
                          variant="outline-danger"
                          class="mt-2"
                          @click="clearPoster"
                        >
                          Remove
                        </b-button>

                        <small class="text-muted mt-2">
                          PNG/JPG, maksimum 10MB
                        </small>
                      </div>
                    </b-form-group>
                  </b-col>
                </b-row>

                <hr />
                <p style="font-weight: 700" class="h4 my-2 mb-3">
                  Schedule & Venue Details
                </p>

                <!-- DISTRICT  -->
                <b-form-group label="District (Daerah)">
                  <b-form-input
                    size="sm"
                    v-model="formEvent.addressDistrict"
                    placeholder="Enter District"
                    class="br-15"
                    v-b-tooltip.hover
                    title="Daerah"
                  />
                </b-form-group>

                <b-row>
                  <!-- SUBDISTRICT  -->
                  <b-col cols="6">
                    <b-form-group label="Sub District (Kecamatan)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressSubDistrict"
                        placeholder="Enter Sub District"
                        class="br-15"
                        v-b-tooltip.hover
                        title="Kecamatan"
                      />
                    </b-form-group>
                  </b-col>

                  <!-- VILLAGE  -->
                  <b-col cols="6">
                    <b-form-group label="Village (Desa)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressVillage"
                        placeholder="Enter Village"
                        class="br-15"
                        v-b-tooltip.hover
                        title="Desa"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <!-- CITY  -->
                  <b-col cols="6">
                    <b-form-group label="City (Kota)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressCity"
                        placeholder="Enter City"
                        class="br-15"
                        v-b-tooltip.hover
                        title="Kota"
                      />
                    </b-form-group>
                  </b-col>

                  <!-- PROVINCE  -->
                  <b-col cols="6">
                    <b-form-group label="Province (Provinsi)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressProvince"
                        placeholder="Enter Province"
                        class="br-15"
                        v-b-tooltip.hover
                        title="Provinsi"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <!-- ZIP CODE  -->
                  <b-col cols="6">
                    <b-form-group label="ZIP Code (Kode Pos)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressZipCode"
                        placeholder="Enter ZIP Code"
                        class="br-15"
                        v-b-tooltip.hover
                        title="Kode Pos"
                      />
                    </b-form-group>
                  </b-col>

                  <b-col>
                    <!-- STATE -->
                    <b-form-group label="State (Negara)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.addressState"
                        placeholder="Enter State"
                        class="br-15"
                        v-b-tooltip.hover
                        title="Negara"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <b-col cols="6">
                    <!-- START DATE -->
                    <b-form-group label="Start Date (Tanggal Mulai)">
                      <b-form-datepicker
                        size="sm"
                        v-model="formEvent.startDateEvent"
                        placeholder="Select start date"
                        class="mb-2 br-15"
                        :min="minDate"
                        v-b-tooltip.hover
                        title="Tanggal Mulai"
                      />
                    </b-form-group>
                  </b-col>
                  <b-col cols="6">
                    <!-- END DATE -->
                    <b-form-group label="End Date (Tanggal Berakhir)">
                      <b-form-datepicker
                        :disabled="formEvent.startDateEvent === ''"
                        size="sm"
                        v-model="formEvent.endDateEvent"
                        placeholder="Select end date"
                        class="mb-2 br-15"
                        :min="formEvent.startDateEvent"
                        v-b-tooltip.hover
                        title="Tanggal Berakhir"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <hr />
                <p style="font-weight: 700" class="h4 my-2 mb-3">
                  Race Details
                </p>

                <!-- EVENT CATEGORIES -->
                <b-form-group label="Event Categories (Kategori Event)" label-cols="3">
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
                <b-form-group label="Division Categories (Kategori Divisi)" label-cols="3">
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
                <b-form-group label="Race Categories (Kategori Lomba)" label-cols="3">
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
                <b-form-group label="Initial Categories (Kategori Inisial)" label-cols="3">
                  <multiselect
                    v-model="formEvent.categoriesInitial"
                    :options="optionInitials"
                    placeholder="Select initial categories"
                    multiple
                    track-by="value"
                    label="name"
                  />
                </b-form-group>

                <br />
                <hr />
                <p style="font-weight: 700" class="h4 my-2 mb-3">Comitte</p>

                <b-row>
                  <b-col cols="6">
                    <b-form-group label="Technical Delegate (Delegasi Teknis)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.technicalDelegate"
                        placeholder="Enter technical delegate name"
                        class="br-15"
                      />
                    </b-form-group>

                    <div class="sig-upload">
                      <div class="sig-upload-label">Signature (optional, PNG)</div>
                      <div class="sig-upload-row">
                        <img
                          v-if="technicalDelegateSignaturePreview"
                          :src="technicalDelegateSignaturePreview"
                          class="sig-thumb"
                          alt="Technical Delegate signature"
                        />
                        <div v-else class="sig-thumb sig-thumb-empty">No signature</div>

                        <div class="sig-upload-actions">
                          <input
                            ref="tdSignatureInput"
                            type="file"
                            accept="image/png"
                            class="d-none"
                            @change="onTechnicalDelegateSignatureChange"
                          />
                          <b-button size="sm" variant="outline-primary" @click="$refs.tdSignatureInput.click()">
                            Choose PNG
                          </b-button>
                          <b-button
                            v-if="technicalDelegateSignaturePreview"
                            size="sm"
                            variant="outline-danger"
                            @click="removeTechnicalDelegateSignatureFile"
                          >
                            Remove
                          </b-button>
                        </div>
                      </div>
                    </div>
                  </b-col>
                  <b-col>
                    <b-form-group label="Race Director (Direktur Lomba)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.raceDirector"
                        placeholder="Enter race director name"
                        class="br-15"
                      />
                    </b-form-group>

                    <div class="sig-upload">
                      <div class="sig-upload-label">Signature (optional, PNG)</div>
                      <div class="sig-upload-row">
                        <img
                          v-if="raceDirectorSignaturePreview"
                          :src="raceDirectorSignaturePreview"
                          class="sig-thumb"
                          alt="Race Director signature"
                        />
                        <div v-else class="sig-thumb sig-thumb-empty">No signature</div>

                        <div class="sig-upload-actions">
                          <input
                            ref="rdSignatureInput"
                            type="file"
                            accept="image/png"
                            class="d-none"
                            @change="onRaceDirectorSignatureChange"
                          />
                          <b-button size="sm" variant="outline-primary" @click="$refs.rdSignatureInput.click()">
                            Choose PNG
                          </b-button>
                          <b-button
                            v-if="raceDirectorSignaturePreview"
                            size="sm"
                            variant="outline-danger"
                            @click="removeRaceDirectorSignatureFile"
                          >
                            Remove
                          </b-button>
                        </div>
                      </div>
                    </div>
                  </b-col>
                </b-row>

                <b-row>
                  <b-col cols="6">
                    <b-form-group label="Chief Judge (Ketua Juri)">
                      <b-form-input
                        size="sm"
                        v-model="formEvent.chiefJudge"
                        placeholder="Enter chief judge name"
                        class="br-15"
                      />
                    </b-form-group>

                    <div class="sig-upload">
                      <div class="sig-upload-label">Signature (optional, PNG)</div>
                      <div class="sig-upload-row">
                        <img
                          v-if="chiefJudgeSignaturePreview"
                          :src="chiefJudgeSignaturePreview"
                          class="sig-thumb"
                          alt="Chief Judge signature"
                        />
                        <div v-else class="sig-thumb sig-thumb-empty">No signature</div>

                        <div class="sig-upload-actions">
                          <input
                            ref="cjSignatureInput"
                            type="file"
                            accept="image/png"
                            class="d-none"
                            @change="onChiefJudgeSignatureChange"
                          />
                          <b-button size="sm" variant="outline-primary" @click="$refs.cjSignatureInput.click()">
                            Choose PNG
                          </b-button>
                          <b-button
                            v-if="chiefJudgeSignaturePreview"
                            size="sm"
                            variant="outline-danger"
                            @click="removeChiefJudgeSignatureFile"
                          >
                            Remove
                          </b-button>
                        </div>
                      </div>
                    </div>
                  </b-col>
                  <b-col> </b-col>
                </b-row>
              </div>
            </form>

            <br />

            <div class="d-flex justify-content-end mt-5">
              <b-button
                class="btn-action"
                style="border-radius: 10px"
                @click="save()"
                type="input"
                variant="primary"
              >
                Submit
                <Icon icon="ic:baseline-check-circle" />
              </b-button>
            </div>
          </b-card>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import Multiselect from "vue-multiselect";
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import { uploadOne } from "@/utils/cloudinaryUpload";

var FOLDER_COMMITTEE_SIGNATURE = "sustainable-js/committee-signature";

export default {
  name: "SustainableTimingSystemCreateEvent",
  components: { Multiselect, Icon },

  data() {
    return {
      showListModal: false,
      posterPreview: "",
      isUploadingPoster: false,
      posterTempPath: null,
      text: "",
      name: "",

      // Comitte signature (opsional, PNG) — file lokal, diupload setelah event tersimpan
      technicalDelegateSignatureFile: null,
      chiefJudgeSignatureFile: null,
      raceDirectorSignatureFile: null,
      technicalDelegateSignaturePreview: "",
      chiefJudgeSignaturePreview: "",
      raceDirectorSignaturePreview: "",
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
        technicalDelegate: "",
        statusEvent: "Activated",
        poster: null,
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

  watch: {
    "formEvent.startDateEvent": function (newStart) {
      // kalau start date digeser jadi setelah end date yang sudah dipilih,
      // end date lama jadi tidak valid (range terbalik) — kosongkan supaya
      // user memilih ulang, daripada diam-diam tersimpan dengan range salah
      if (
        newStart &&
        this.formEvent.endDateEvent &&
        this.formEvent.endDateEvent < newStart
      ) {
        this.formEvent.endDateEvent = "";
      }
    },
  },

  computed: {
    sortedOptionLevels() {
      // Urutkan agar 'Classification' muncul paling atas
      return [...this.optionLevels].sort((a, b) => {
        if (a.name === "Classification") return -1;
        if (b.name === "Classification") return 1;
        return a.name.localeCompare(b.name);
      });
    },
    currentDateTime() {
      const d = new Date();
      return (
        d.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " | " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
    },
    state() {
      return this.name.length >= 4;
    },
    invalidFeedback() {
      if (this.name.length > 0) return "Enter at least 4 characters.";
      return "Please enter something.";
    },
  },

  methods: {
    async pickAndUploadPoster() {
      try {
        if (!window.fileAPI || typeof window.fileAPI.pickImage !== "function") {
          ipcRenderer.send("get-alert", {
            type: "warning",
            message: "Unavailable",
            detail: "File picker belum tersedia",
          });
          return;
        }
        const pick = await window.fileAPI.pickImage();
        if (!pick || !pick.ok || pick.canceled) return;

        this.posterTempPath = pick.path;

        if (window.fileAPI && typeof window.fileAPI.toDataURL === "function") {
          this.posterPreview = await window.fileAPI.toDataURL(pick.path);
        } else if (pick.path) {
          this.posterPreview = "file://" + pick.path;
        }

        this.formEvent.poster = null; // belum upload
      } catch (err) {
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "Picker error",
          detail: err && err.message ? err.message : String(err),
        });
      }
    },
    async checkValueStorage() {
      const dataStorage = localStorage.getItem("formNewEvent");
      let datas = null;
      try {
        datas = dataStorage ? JSON.parse(dataStorage) : null;
      } catch (_e) {
        // draft rusak/tidak valid → abaikan, jangan sampai mounted() gagal total
        localStorage.removeItem("formNewEvent");
      }
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
      ipcRenderer.once("option-level-reply", (_e, data) => {
        this.optionLevels = data || [];
      });
    },
    async setOptionCategoriesEvent() {
      ipcRenderer.send("option-categories-event");
      ipcRenderer.once("option-categories-event-reply", (_e, data) => {
        this.optionCategories = data || [];
      });
    },
    async setOptionCategoriesDivision() {
      ipcRenderer.send("option-categories-division");
      ipcRenderer.once("option-categories-division-reply", (_e, data) => {
        this.optionDivisions = data || [];
      });
    },
    async setOptionCategoriesInitial() {
      ipcRenderer.send("option-categories-initial");
      ipcRenderer.once("option-categories-initial-reply", (_e, data) => {
        this.optionInitials = data || [];
      });
    },
    async setOptionCategoriesRace() {
      ipcRenderer.send("option-categories-race");
      ipcRenderer.once("option-categories-race-reply", (_e, data) => {
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
        !f.technicalDelegate
      ) {
        return false;
      }
      return true;
    },

    /* ---------------- Comitte signature (opsional, PNG) ---------------- */
    _pickPngFile: function (e) {
      var file = e && e.target && e.target.files ? e.target.files[0] : null;
      if (e && e.target) e.target.value = "";
      if (!file) return null;

      var isPng = /image\/png/i.test(file.type || "") || /\.png$/i.test(file.name || "");
      if (!isPng) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Format tidak didukung",
          detail: "Signature harus berformat PNG",
        });
        return null;
      }

      var sizeOk = file.size <= 10 * 1024 * 1024;
      if (!sizeOk) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Ukuran terlalu besar",
          detail: "Ukuran signature maksimum 10MB",
        });
        return null;
      }

      return file;
    },
    onTechnicalDelegateSignatureChange: function (e) {
      var file = this._pickPngFile(e);
      if (!file) return;
      if (this.technicalDelegateSignaturePreview) URL.revokeObjectURL(this.technicalDelegateSignaturePreview);
      this.technicalDelegateSignatureFile = file;
      this.technicalDelegateSignaturePreview = URL.createObjectURL(file);
    },
    removeTechnicalDelegateSignatureFile: function () {
      if (this.technicalDelegateSignaturePreview) URL.revokeObjectURL(this.technicalDelegateSignaturePreview);
      this.technicalDelegateSignatureFile = null;
      this.technicalDelegateSignaturePreview = "";
    },
    onChiefJudgeSignatureChange: function (e) {
      var file = this._pickPngFile(e);
      if (!file) return;
      if (this.chiefJudgeSignaturePreview) URL.revokeObjectURL(this.chiefJudgeSignaturePreview);
      this.chiefJudgeSignatureFile = file;
      this.chiefJudgeSignaturePreview = URL.createObjectURL(file);
    },
    removeChiefJudgeSignatureFile: function () {
      if (this.chiefJudgeSignaturePreview) URL.revokeObjectURL(this.chiefJudgeSignaturePreview);
      this.chiefJudgeSignatureFile = null;
      this.chiefJudgeSignaturePreview = "";
    },
    onRaceDirectorSignatureChange: function (e) {
      var file = this._pickPngFile(e);
      if (!file) return;
      if (this.raceDirectorSignaturePreview) URL.revokeObjectURL(this.raceDirectorSignaturePreview);
      this.raceDirectorSignatureFile = file;
      this.raceDirectorSignaturePreview = URL.createObjectURL(file);
    },
    removeRaceDirectorSignatureFile: function () {
      if (this.raceDirectorSignaturePreview) URL.revokeObjectURL(this.raceDirectorSignaturePreview);
      this.raceDirectorSignatureFile = null;
      this.raceDirectorSignaturePreview = "";
    },

    // upload signature (kalau ada yang dipilih) & simpan ke event yang baru dibuat
    async uploadSignaturesIfAny(insertedId) {
      var hasAny =
        this.technicalDelegateSignatureFile ||
        this.chiefJudgeSignatureFile ||
        this.raceDirectorSignatureFile;
      if (!hasAny) return;

      var assetsDoc = { _id: insertedId, eventFiles: [], sponsorFiles: [] };

      if (this.technicalDelegateSignatureFile) {
        var upTd = await uploadOne(this.technicalDelegateSignatureFile, FOLDER_COMMITTEE_SIGNATURE);
        if (upTd && upTd.ok) assetsDoc.technicalDelegateSignature = upTd.result;
      }
      if (this.chiefJudgeSignatureFile) {
        var upCj = await uploadOne(this.chiefJudgeSignatureFile, FOLDER_COMMITTEE_SIGNATURE);
        if (upCj && upCj.ok) assetsDoc.chiefJudgeSignature = upCj.result;
      }
      if (this.raceDirectorSignatureFile) {
        var upRd = await uploadOne(this.raceDirectorSignatureFile, FOLDER_COMMITTEE_SIGNATURE);
        if (upRd && upRd.ok) assetsDoc.raceDirectorSignature = upRd.result;
      }

      ipcRenderer.send("services:update:event-assets", assetsDoc);
      await new Promise(function (resolve) {
        ipcRenderer.once("services:update:event-assets:reply", function (_e, resp) {
          if (!resp || resp.ok !== true) {
            ipcRenderer.send("get-alert", {
              type: "warning",
              message: "Saved without some signatures",
              detail: "Event tersimpan, tapi update signature komite gagal.",
            });
          }
          resolve();
        });
      });
    },

    async clearPoster() {
      try {
        const pub =
          this.formEvent && this.formEvent.poster
            ? this.formEvent.poster.public_id
            : null;

        if (
          pub &&
          window.cloud &&
          typeof window.cloud.deleteImage === "function"
        ) {
          await window.cloud.deleteImage(pub);
        }
      } catch (e) {
        if (process.env.VUE_APP_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn("Failed to delete from Cloudinary:", e);
        }

        this.lastError = e && e.message ? e.message : String(e);
        this.$emit("cloudinary-delete-error", this.lastError);
      } finally {
        this.formEvent.poster = null;
        this.posterPreview = "";
      }
    },

    // ===== helper upload khusus Cloudinary =====
    async uploadPosterToCloudinary() {
      if (!this.posterTempPath) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "No File Selected",
          detail: "Pilih gambar dulu",
        });
        return { ok: false, error: "no-local-file" };
      }
      if (!window.cloud) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Unavailable",
          detail: "Cloudinary bridge belum tersedia",
        });
        return { ok: false, error: "no-bridge" };
      }

      this.isUploadingPoster = true;

      var up;
      if (typeof window.cloud.uploadEventImage === "function") {
        up = await window.cloud.uploadEventImage(this.posterTempPath);
      } else if (typeof window.cloud.uploadImage === "function") {
        up = await window.cloud.uploadImage(this.posterTempPath, {
          folder: "sustainable-js/event",
        });
      } else {
        this.isUploadingPoster = false;
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Unavailable",
          detail: "Cloudinary API tidak ditemukan",
        });
        return { ok: false, error: "no-method" };
      }

      this.isUploadingPoster = false;

      if (!up || !up.ok || !up.result) {
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "Upload failed",
          detail: up && up.error ? up.error : "Unknown error",
        });
        return {
          ok: false,
          error: up && up.error ? up.error : "upload-failed",
        };
      }

      // simpan metadata ke form & ganti preview
      this.formEvent.poster = up.result; // { public_id, secure_url, ... }
      this.posterPreview = up.result.secure_url;

      return { ok: true, result: up.result };
    },

    // ===== SAVE: insert → (upload) → (update) → finish =====
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

      // Jangan paksa null; biarkan seperti di form.
      const payload = JSON.parse(JSON.stringify(this.formEvent));

      // 1) INSERT
      ipcRenderer.send("insert-new-event", payload);

      const self = this;
      ipcRenderer.once("insert-new-event-reply", function (_e, data) {
        self.handleAfterInsert(data);
      });
    },

    _asIdString: function (x) {
      if (!x) return null;

      // jika sudah string
      if (typeof x === "string") return x;

      // jika bentuk { insertedId: ... } atau { _id: ... } → rekursif
      if (typeof x === "object") {
        if (x.insertedId) return this._asIdString(x.insertedId);
        if (x._id) return this._asIdString(x._id);
        if (x.$oid) return String(x.$oid);

        // ObjectId mentah dari BSON: {_bsontype:"ObjectID", id: Uint8Array(12)}
        if (x._bsontype === "ObjectID" && x.id) {
          try {
            var arr = Array.prototype.slice.call(x.id); // Uint8Array → array
            var hex = arr
              .map(function (b) {
                var s = b.toString(16);
                return s.length === 1 ? "0" + s : s;
              })
              .join("");
            return hex;
          } catch (e) {
            return null;
          }
        }
      }
      return null;
    },

    async handleAfterInsert(data) {
      var insertedId = this._asIdString(data);
      if (!insertedId) {
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "DB Save Failed",
          detail: "insertedId tidak ditemukan",
        });
        return;
      }

      // 2) Kalau user pilih gambar lokal, upload dulu ke Cloudinary
      if (this.posterTempPath) {
        const up = await this.uploadPosterToCloudinary();
        if (up && up.ok && up.result) {
          // 3) Update DB dengan metadata poster
          const updatePayload = {
            _id: insertedId,
            poster: up.result,
            poster_url: up.result.url,
            eventFiles: [],
            sponsorFiles: [],
          };
          ipcRenderer.send("update-event-poster", updatePayload);
          const resp = await new Promise(function (resolve) {
            ipcRenderer.once("update-event-poster-reply", function (_e2, r) {
              resolve(r);
            });
          });

          var ok = resp !== null && resp !== undefined && resp.ok === true;
          if (!ok) {
            var detail =
              resp !== null && resp !== undefined && typeof resp.error === "string"
                ? resp.error
                : "Unknown error";
            ipcRenderer.send("get-alert", {
              type: "error",
              message: "Update poster gagal",
              detail: detail,
            });
          } else {
            var matched =
              resp !== null && resp !== undefined && typeof resp.matchedCount === "number"
                ? resp.matchedCount
                : 0;
            if (matched === 0) {
              ipcRenderer.send("get-alert", {
                type: "error",
                message: "Update poster gagal",
                detail: "Document tidak ditemukan (matchedCount=0)",
              });
            }
          }
        } else {
          // Upload gagal tapi event sudah tersimpan
          ipcRenderer.send("get-alert", {
            type: "warning",
            message: "Saved without poster",
            detail: "Event tersimpan. Upload poster gagal.",
          });
        }
      }

      // 4) Upload signature Comitte kalau ada yang dipilih (opsional)
      await this.uploadSignaturesIfAny(insertedId);

      this.finishSave();
    },

    finishSave() {
      ipcRenderer.send("get-alert-saved", {
        type: "question",
        detail: "Event data has been successfully saved",
        message: "Successfully",
      });
      const self = this;
      setTimeout(function () {
        localStorage.removeItem("formNewEvent");
        self.$router.push("/");
      }, 1500);
    },
  },
};
</script>

<style scoped>
.btn-action {
  background: #d7eafb;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
}

.btn-action:hover {
  background-color: #1f6fa3 !important;
  border: none;
}

.br-15 {
  border-radius: 10px;
}

hr {
  border: none; /* hilangkan default border */
  height: 1px; /* ketebalan garis */
  background-color: #a1a1a1; /* warna garis */
  border-radius: 2px; /* opsional: biar sudutnya halus */
  width: 100%;
  margin-bottom: 30px;
}

/* Comitte signature upload */
.sig-upload { margin: -8px 0 16px; }
.sig-upload-label { font-size: 12px; color: #64748b; font-weight: 700; margin-bottom: 6px; }
.sig-upload-row { display: flex; align-items: center; gap: 12px; }
.sig-thumb {
  width: 90px;
  height: 50px;
  object-fit: contain;
  background: #fff;
  border: 1px solid #e6ebf4;
  border-radius: 8px;
  padding: 4px;
}
.sig-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 11px;
  background: #fafafa;
  border: 1px dashed #cbd5e1;
}
.sig-upload-actions { display: flex; align-items: center; gap: 8px; }
</style>
