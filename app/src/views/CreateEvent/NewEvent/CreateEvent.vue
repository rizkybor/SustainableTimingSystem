<template>
  <div class="list-page">
    <PageHero
      title="Create New Event"
      crumb="Create New Event"
      :trail="[{ label: 'All Events', to: { name: 'events' } }]"
      icon="mdi:calendar-plus"
      subtitle="Informasi event, jadwal & lokasi, kategori lomba, dan komite"
    />

    <div class="ce-layout">
      <!-- ================= KOLOM UTAMA ================= -->
      <form ref="form-newEvent" class="ce-main" @submit.prevent="save()">
        <!-- EVENT INFORMATION -->
        <section class="lp-card ce-section">
          <header class="ce-section__head">
            <span class="ce-section__icon"><Icon icon="mdi:information-outline" /></span>
            <div>
              <h5 class="ce-section__title">Event Information</h5>
              <p class="ce-section__desc">Tingkat, nama event, dan sungai lokasi lomba.</p>
            </div>
          </header>
          <div class="ce-section__body">
            <b-form-group label-class="label-strong">
              <template #label>
                Event Level (Tingkat Event) <span class="text-danger">*</span>
              </template>
              <div class="ce-inline">
                <b-form-select
                  v-model="formEvent.levelName"
                  :options="sortedOptionLevels"
                  value-field="name"
                  text-field="name"
                  class="input-soft"
                >
                  <template #first>
                    <b-form-select-option :value="null" disabled>Pilih tingkat event</b-form-select-option>
                  </template>
                </b-form-select>
                <button
                  type="button"
                  class="ce-icon-btn"
                  v-b-tooltip.hover
                  title="Keterangan level event"
                  @click="showListModal = true"
                >
                  <Icon icon="mdi:help-circle-outline" />
                </button>
              </div>
            </b-form-group>

            <div class="ce-grid ce-grid--2">
              <b-form-group label-class="label-strong">
                <template #label>
                  Event Name (Nama Event) <span class="text-danger">*</span>
                </template>
                <b-form-input v-model="formEvent.eventName" placeholder="Enter your event name" class="input-soft" />
              </b-form-group>
              <b-form-group label-class="label-strong">
                <template #label>
                  River Name (Nama Sungai) <span class="text-danger">*</span>
                </template>
                <b-form-input v-model="formEvent.riverName" placeholder="Enter river name" class="input-soft" />
              </b-form-group>
            </div>
          </div>
        </section>

        <!-- SCHEDULE & VENUE -->
        <section class="lp-card ce-section">
          <header class="ce-section__head">
            <span class="ce-section__icon"><Icon icon="mdi:map-marker-radius-outline" /></span>
            <div>
              <h5 class="ce-section__title">Schedule &amp; Venue Details</h5>
              <p class="ce-section__desc">Alamat lengkap lokasi dan rentang tanggal event.</p>
            </div>
          </header>
          <div class="ce-section__body">
            <div class="ce-grid ce-grid--3">
              <b-form-group label-class="label-strong" class="ce-span-3">
                <template #label>District (Daerah) <span class="text-danger">*</span></template>
                <b-form-input v-model="formEvent.addressDistrict" placeholder="Enter District" class="input-soft" />
              </b-form-group>
              <b-form-group label-class="label-strong">
                <template #label>Sub District (Kecamatan) <span class="text-danger">*</span></template>
                <b-form-input v-model="formEvent.addressSubDistrict" placeholder="Enter Sub District" class="input-soft" />
              </b-form-group>
              <b-form-group label-class="label-strong">
                <template #label>Village (Desa) <span class="text-danger">*</span></template>
                <b-form-input v-model="formEvent.addressVillage" placeholder="Enter Village" class="input-soft" />
              </b-form-group>
              <b-form-group label-class="label-strong">
                <template #label>City (Kota) <span class="text-danger">*</span></template>
                <b-form-input v-model="formEvent.addressCity" placeholder="Enter City" class="input-soft" />
              </b-form-group>
              <b-form-group label-class="label-strong">
                <template #label>Province (Provinsi) <span class="text-danger">*</span></template>
                <b-form-input v-model="formEvent.addressProvince" placeholder="Enter Province" class="input-soft" />
              </b-form-group>
              <b-form-group label-class="label-strong">
                <template #label>ZIP Code (Kode Pos) <span class="text-danger">*</span></template>
                <b-form-input v-model="formEvent.addressZipCode" placeholder="Enter ZIP Code" class="input-soft" />
              </b-form-group>
              <b-form-group label-class="label-strong">
                <template #label>State (Negara) <span class="text-danger">*</span></template>
                <b-form-input v-model="formEvent.addressState" placeholder="Enter State" class="input-soft" />
              </b-form-group>
            </div>

            <!-- Kalender inline (BUKAN b-form-datepicker popup — popup-nya
                 ke-tutup <legend> field lain, kuirk Chromium yang tidak bisa
                 dibetulkan via CSS; lihat catatan di <style>). -->
            <div class="ce-grid ce-grid--2 mt-2">
              <b-form-group label-class="label-strong">
                <template #label>Start Date (Tanggal Mulai) <span class="text-danger">*</span></template>
                <div class="ce-date-value" :class="{ 'is-empty': !formEvent.startDateEvent }">
                  <Icon icon="mdi:calendar-start" />
                  {{ formEvent.startDateEvent || "Belum ada tanggal dipilih" }}
                </div>
                <b-calendar
                  v-model="formEvent.startDateEvent"
                  class="stx-inline-calendar"
                  :min="minDate"
                  block
                />
              </b-form-group>
              <b-form-group label-class="label-strong">
                <template #label>End Date (Tanggal Berakhir) <span class="text-danger">*</span></template>
                <div class="ce-date-value" :class="{ 'is-empty': !formEvent.endDateEvent }">
                  <Icon icon="mdi:calendar-end" />
                  {{ formEvent.endDateEvent || (formEvent.startDateEvent ? "Belum ada tanggal dipilih" : "Pilih Start Date dulu") }}
                </div>
                <b-calendar
                  :disabled="formEvent.startDateEvent === ''"
                  v-model="formEvent.endDateEvent"
                  class="stx-inline-calendar"
                  :min="formEvent.startDateEvent"
                  block
                />
              </b-form-group>
            </div>
          </div>
        </section>

        <!-- RACE DETAILS -->
        <section class="lp-card ce-section">
          <header class="ce-section__head">
            <span class="ce-section__icon"><Icon icon="mdi:flag-checkered" /></span>
            <div>
              <h5 class="ce-section__title">Race Details</h5>
              <p class="ce-section__desc">Nomor lomba, divisi, kelas race, dan initial yang dipertandingkan.</p>
            </div>
          </header>
          <div class="ce-section__body ce-grid ce-grid--2">
            <b-form-group label-class="label-strong">
              <template #label>Event Categories (Kategori Event) <span class="text-danger">*</span></template>
              <multiselect
                v-model="formEvent.categoriesEvent"
                :options="optionCategories"
                placeholder="Select event categories"
                multiple
                track-by="value"
                label="name"
              />
            </b-form-group>
            <b-form-group label-class="label-strong">
              <template #label>Division Categories (Kategori Divisi) <span class="text-danger">*</span></template>
              <multiselect
                v-model="formEvent.categoriesDivision"
                :options="optionDivisions"
                placeholder="Select division categories"
                multiple
                track-by="value"
                label="name"
              />
            </b-form-group>
            <b-form-group label-class="label-strong">
              <template #label>Race Categories (Kategori Lomba) <span class="text-danger">*</span></template>
              <multiselect
                v-model="formEvent.categoriesRace"
                :options="optionRaces"
                placeholder="Select race categories"
                multiple
                track-by="value"
                label="name"
              />
            </b-form-group>
            <b-form-group label-class="label-strong">
              <template #label>Initial Categories (Kategori Inisial) <span class="text-danger">*</span></template>
              <multiselect
                v-model="formEvent.categoriesInitial"
                :options="optionInitials"
                placeholder="Select initial categories"
                multiple
                track-by="value"
                label="name"
              />
            </b-form-group>
          </div>
        </section>

        <!-- COMMITTEE -->
        <section class="lp-card ce-section">
          <header class="ce-section__head">
            <span class="ce-section__icon"><Icon icon="mdi:account-tie-outline" /></span>
            <div>
              <h5 class="ce-section__title">Committee</h5>
              <p class="ce-section__desc">Opsional — nama & tanda tangan (PNG) utk dokumen hasil resmi.</p>
            </div>
          </header>
          <div class="ce-section__body ce-grid ce-grid--3">
            <!-- Technical Delegate -->
            <div class="ce-person">
              <b-form-group label="Technical Delegate (Delegasi Teknis)" label-class="label-strong">
                <b-form-input v-model="formEvent.technicalDelegate" placeholder="Enter name" class="input-soft" />
              </b-form-group>
              <div class="ce-sig">
                <img v-if="technicalDelegateSignaturePreview" :src="technicalDelegateSignaturePreview" class="ce-sig__thumb" alt="Technical Delegate signature" />
                <div v-else class="ce-sig__thumb ce-sig__thumb--empty"><Icon icon="mdi:draw" /> No signature</div>
                <input ref="tdSignatureInput" type="file" accept="image/png" class="d-none" @change="onTechnicalDelegateSignatureChange" />
                <div class="ce-sig__actions">
                  <button type="button" class="ce-mini-btn" @click="$refs.tdSignatureInput.click()">
                    <Icon icon="mdi:upload" /> {{ technicalDelegateSignaturePreview ? "Ganti" : "Choose PNG" }}
                  </button>
                  <button v-if="technicalDelegateSignaturePreview" type="button" class="ce-mini-btn ce-mini-btn--danger" @click="removeTechnicalDelegateSignatureFile">
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Race Director -->
            <div class="ce-person">
              <b-form-group label="Race Director (Direktur Lomba)" label-class="label-strong">
                <b-form-input v-model="formEvent.raceDirector" placeholder="Enter name" class="input-soft" />
              </b-form-group>
              <div class="ce-sig">
                <img v-if="raceDirectorSignaturePreview" :src="raceDirectorSignaturePreview" class="ce-sig__thumb" alt="Race Director signature" />
                <div v-else class="ce-sig__thumb ce-sig__thumb--empty"><Icon icon="mdi:draw" /> No signature</div>
                <input ref="rdSignatureInput" type="file" accept="image/png" class="d-none" @change="onRaceDirectorSignatureChange" />
                <div class="ce-sig__actions">
                  <button type="button" class="ce-mini-btn" @click="$refs.rdSignatureInput.click()">
                    <Icon icon="mdi:upload" /> {{ raceDirectorSignaturePreview ? "Ganti" : "Choose PNG" }}
                  </button>
                  <button v-if="raceDirectorSignaturePreview" type="button" class="ce-mini-btn ce-mini-btn--danger" @click="removeRaceDirectorSignatureFile">
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Chief Judge -->
            <div class="ce-person">
              <b-form-group label="Chief Judge (Ketua Juri)" label-class="label-strong">
                <b-form-input v-model="formEvent.chiefJudge" placeholder="Enter name" class="input-soft" />
              </b-form-group>
              <div class="ce-sig">
                <img v-if="chiefJudgeSignaturePreview" :src="chiefJudgeSignaturePreview" class="ce-sig__thumb" alt="Chief Judge signature" />
                <div v-else class="ce-sig__thumb ce-sig__thumb--empty"><Icon icon="mdi:draw" /> No signature</div>
                <input ref="cjSignatureInput" type="file" accept="image/png" class="d-none" @change="onChiefJudgeSignatureChange" />
                <div class="ce-sig__actions">
                  <button type="button" class="ce-mini-btn" @click="$refs.cjSignatureInput.click()">
                    <Icon icon="mdi:upload" /> {{ chiefJudgeSignaturePreview ? "Ganti" : "Choose PNG" }}
                  </button>
                  <button v-if="chiefJudgeSignaturePreview" type="button" class="ce-mini-btn ce-mini-btn--danger" @click="removeChiefJudgeSignatureFile">
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </form>

      <!-- ================= SIDEBAR ================= -->
      <aside class="ce-side">
        <!-- Poster -->
        <div class="lp-card ce-side__card">
          <div class="ce-side__title"><Icon icon="mdi:image-outline" /> Event Poster</div>
          <div class="ce-poster" :class="{ 'has-image': posterPreview }">
            <img v-if="posterPreview" :src="posterPreview" alt="Poster preview" />
            <div v-else class="ce-poster__empty">
              <Icon icon="mdi:image-plus-outline" width="34" height="34" />
              <span>Belum ada poster</span>
            </div>
          </div>
          <div class="ce-poster__actions">
            <button type="button" class="ce-mini-btn ce-mini-btn--primary" :disabled="isUploadingPoster" @click="pickAndUploadPoster">
              <b-spinner v-if="isUploadingPoster" small />
              <Icon v-else icon="mdi:upload" />
              {{ isUploadingPoster ? "Uploading…" : posterPreview ? "Ganti Poster" : "Upload Image" }}
            </button>
            <button v-if="formEvent.poster || posterTempPath" type="button" class="ce-mini-btn ce-mini-btn--danger" @click="clearPoster">
              <Icon icon="mdi:trash-can-outline" /> Remove
            </button>
          </div>
          <small class="lp-muted d-block mt-2">PNG/JPG, maksimum 10MB</small>
        </div>

        <!-- Kelengkapan + Submit -->
        <div class="lp-card ce-side__card">
          <div class="ce-side__title"><Icon icon="mdi:clipboard-check-outline" /> Kelengkapan</div>
          <div class="ce-progress">
            <div class="ce-progress__bar">
              <span :style="{ width: completion.percent + '%' }"></span>
            </div>
            <span class="ce-progress__text">{{ completion.done }}/{{ completion.total }} wajib</span>
          </div>
          <ul class="ce-checklist">
            <li v-for="g in completion.groups" :key="g.label" :class="{ done: g.done === g.total }">
              <Icon :icon="g.done === g.total ? 'mdi:check-circle' : 'mdi:circle-outline'" />
              <span class="ce-checklist__label">{{ g.label }}</span>
              <span class="ce-checklist__count">{{ g.done }}/{{ g.total }}</span>
            </li>
          </ul>
          <button type="button" class="ce-submit" :disabled="isSaving" @click="save()">
            <b-spinner v-if="isSaving" small />
            <Icon v-else icon="mdi:check-circle-outline" />
            {{ isSaving ? "Saving…" : "Create Event" }}
          </button>
          <small v-if="completion.done < completion.total" class="ce-submit__hint">
            Lengkapi semua field bertanda <span class="text-danger">*</span> sebelum submit.
          </small>
        </div>
      </aside>
    </div>

    <!-- Panduan Event Level -->
    <b-modal
      id="modal-list-event"
      v-model="showListModal"
      title="Event Level Guide"
      size="md"
      hide-footer
      centered
    >
      <div class="ce-guide">
        <div v-for="lvl in sortedOptionLevels" :key="lvl.name" class="ce-guide__item">
          <div class="ce-guide__name">{{ lvl.name }}</div>
          <ol class="ce-guide__scope">
            <li v-for="(item, i) in lvl.scope" :key="i">{{ item }}</li>
          </ol>
        </div>
      </div>
    </b-modal>
  </div>
</template>


<script>
import Multiselect from "vue-multiselect";
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import { uploadOne } from "@/utils/cloudinaryUpload";
import PageHero from "@/components/common/PageHero.vue";

var FOLDER_COMMITTEE_SIGNATURE = "sustainable-js/committee-signature";

export default {
  name: "SustainableTimingSystemCreateEvent",
  components: { Multiselect, Icon, PageHero },

  data() {
    return {
      showListModal: false,
      posterPreview: "",
      isUploadingPoster: false,
      // true selama save() -> handleAfterInsert() -> finishSave() berjalan
      // (insert DB, upload poster & signature ke Cloudinary, update DB
      // lagi — bisa beberapa detik). Dipakai utk menonaktifkan tombol
      // Submit supaya tidak bisa diklik dua kali sampai membuat event
      // duplikat di database (sebelumnya tidak ada pengaman sama sekali).
      isSaving: false,
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
    // Progress kelengkapan field wajib di sidebar — aturannya SAMA dgn
    // validateForm() (kalau salah satu diubah, ubah juga yang lain).
    completion() {
      const f = this.formEvent;
      const filled = (v) => (Array.isArray(v) ? v.length > 0 : !!v);
      const groups = [
        { label: "Event Information", keys: ["levelName", "eventName", "riverName"] },
        {
          label: "Schedule & Venue",
          keys: [
            "addressDistrict",
            "addressSubDistrict",
            "addressVillage",
            "addressCity",
            "addressProvince",
            "addressZipCode",
            "addressState",
            "startDateEvent",
            "endDateEvent",
          ],
        },
        {
          label: "Race Details",
          keys: ["categoriesEvent", "categoriesDivision", "categoriesRace", "categoriesInitial"],
        },
      ].map((g) => ({
        label: g.label,
        total: g.keys.length,
        done: g.keys.filter((k) => filled(f[k])).length,
      }));
      const total = groups.reduce((n, g) => n + g.total, 0);
      const done = groups.reduce((n, g) => n + g.done, 0);
      return { groups, total, done, percent: total ? Math.round((done / total) * 100) : 0 };
    },
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
        !(f.categoriesInitial && f.categoriesInitial.length)
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
        // BUG FIX: "Upload Image" hanya MEMILIH file lokal & preview-nya —
        // upload sungguhan ke Cloudinary baru terjadi belakangan di
        // handleAfterInsert() (setelah event ke-insert ke DB), yang cuma
        // mengecek `posterTempPath`. Tanpa baris ini, klik "Remove" cuma
        // membersihkan preview & formEvent.poster, tapi posterTempPath yang
        // masih menunjuk ke file lama tetap ikut ke-upload saat Submit —
        // poster yang "sudah dihapus" diam-diam muncul lagi di event.
        this.posterTempPath = null;
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
      if (this.isSaving) return; // cegah submit dobel selagi masih memproses
      const formValid = this.validateForm();
      if (!formValid) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail: "To create an event, all fields must be filled in",
          message: "Ups Sorry",
        });
        return;
      }

      this.isSaving = true;

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
        this.isSaving = false;
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
        self.$router.push("/");
      }, 1500);
    },
  },
};
</script>

<style scoped>
/* Header: PageHero.vue; .list-page/.lp-card: list-pages.css (global). */

.ce-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
  margin-top: 20px;
}
.ce-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.ce-main .lp-card,
.ce-side .lp-card {
  margin-top: 0;
}

/* ---------- Section ---------- */
.ce-section {
  overflow: visible; /* dropdown multiselect tidak boleh terpotong */
}
.ce-section__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 22px;
  border-bottom: 1px solid #eef2f7;
}
.ce-section__icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #e6f4fd;
  color: #1c4c7a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.ce-section__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}
.ce-section__desc {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: #64748b;
}
.ce-section__body {
  padding: 18px 22px 8px;
}

.ce-grid {
  display: grid;
  gap: 0 16px;
}
.ce-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.ce-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.ce-span-3 {
  grid-column: 1 / -1;
}

.ce-inline {
  display: flex;
  gap: 8px;
}
.ce-icon-btn {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #1c4c7a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
}
.ce-icon-btn:hover {
  border-color: #25b0eb;
  background: #f0f7ff;
}

/* Tanggal: nilai terpilih + kalender inline.
   BUG FIX lama: b-form-datepicker (popup) ke-tutup/klik ke-intercept field
   lain krn kuirk Chromium pada <legend>+fieldset yang tidak bisa dibetulkan
   via CSS — diganti <b-calendar> inline (tanpa popup sama sekali). */
.ce-date-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #e6f4fd;
  color: #1c4c7a;
  font-size: 13.5px;
  font-weight: 700;
}
.ce-date-value.is-empty {
  background: #f1f5f9;
  color: #94a3b8;
  font-weight: 600;
}
.stx-inline-calendar {
  border: 1px solid #e6edf6;
  border-radius: 12px;
  padding: 8px;
  background: #fff;
}

/* ---------- Committee ---------- */
.ce-person {
  padding: 14px 14px 4px;
  margin-bottom: 14px;
  border-radius: 14px;
  border: 1px solid #eef2f7;
  background: #fbfdff;
}
.ce-sig {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: -4px 0 12px;
}
.ce-sig__thumb {
  flex: none;
  width: 96px;
  height: 52px;
  object-fit: contain;
  padding: 4px;
  border-radius: 9px;
  background: #fff;
  border: 1px solid #e6edf6;
}
.ce-sig__thumb--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: #94a3b8;
  background: #f8fafc;
  border-style: dashed;
}
.ce-sig__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ce-mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 11px;
  border-radius: 9px;
  border: 1px solid #d6e3f1;
  background: #fff;
  color: #1c4c7a;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.ce-mini-btn:hover:not(:disabled) {
  border-color: #25b0eb;
  background: #f0f7ff;
}
.ce-mini-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ce-mini-btn--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
}
.ce-mini-btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #163d63, #1d9fd6);
  color: #fff;
}
.ce-mini-btn--danger {
  color: #dc2626;
  border-color: #fecaca;
}
.ce-mini-btn--danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
}

/* ---------- Sidebar ---------- */
.ce-side {
  position: sticky;
  top: calc(var(--nav-h, 64px) + 16px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ce-side__card {
  padding: 16px 18px 18px;
}
.ce-side__title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}
.ce-side__title svg {
  color: #25b0eb;
}

.ce-poster {
  height: 180px;
  border-radius: 14px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ce-poster.has-image {
  border-style: solid;
  border-color: #e6edf6;
}
.ce-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ce-poster__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #94a3b8;
  font-size: 12.5px;
}
.ce-poster__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.ce-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.ce-progress__bar {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}
.ce-progress__bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1c4c7a, #25b0eb);
  transition: width 0.3s ease;
}
.ce-progress__text {
  font-size: 12px;
  font-weight: 800;
  color: #475569;
  white-space: nowrap;
}

.ce-checklist {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ce-checklist li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}
.ce-checklist li svg {
  color: #cbd5e1;
  font-size: 17px;
}
.ce-checklist li.done {
  color: #0f172a;
}
.ce-checklist li.done svg {
  color: #16a34a;
}
.ce-checklist__label {
  flex: 1;
  font-weight: 600;
}
.ce-checklist__count {
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.ce-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  font-size: 14.5px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(28, 76, 122, 0.25);
  transition: filter 0.15s ease, transform 0.08s ease;
}
.ce-submit:hover:not(:disabled) {
  filter: brightness(1.07);
}
.ce-submit:active:not(:disabled) {
  transform: translateY(1px);
}
.ce-submit:disabled {
  opacity: 0.7;
  cursor: wait;
}
.ce-submit__hint {
  display: block;
  margin-top: 8px;
  text-align: center;
  font-size: 11.5px;
  color: #94a3b8;
}

/* ---------- Panduan Event Level (modal) ---------- */
.ce-guide {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ce-guide__item {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e6edf6;
  background: #fbfdff;
}
.ce-guide__name {
  font-weight: 800;
  color: #1c4c7a;
  margin-bottom: 4px;
}
.ce-guide__scope {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #475569;
}

@media (max-width: 1199.98px) {
  .ce-layout {
    grid-template-columns: 1fr;
  }
  .ce-side {
    position: static;
  }
  .ce-grid--3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 767.98px) {
  .ce-grid--2,
  .ce-grid--3 {
    grid-template-columns: 1fr;
  }
}
</style>
