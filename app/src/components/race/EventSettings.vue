<template>
  <b-modal
    :id="id"
    v-model="show"
    centered
    size="xl"
    body-class="p-0 esm-body"
    header-class="p-0 border-0"
    footer-class="esm-footer"
    content-class="esm-content"
    scrollable
  >
    <!-- Header -->
    <template #modal-header>
      <div class="esm-head">
        <div class="esm-head__bg"></div>
        <button type="button" class="esm-close" aria-label="Close" @click="show = false">
          <Icon icon="mdi:close" />
        </button>
        <div class="esm-head__inner">
          <span class="esm-head__icon"><Icon icon="mdi:calendar-edit-outline" /></span>
          <div class="esm-head__text">
            <span class="esm-eyebrow">Event Setting</span>
            <h5 class="esm-title">{{ eventName || form.eventName || "-" }}</h5>
            <p class="esm-sub">ID: {{ eventId || "-" }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Body: navigasi tab (kiri) + konten (kanan). Semua panel tetap
         ter-render (v-show), jadi isian & input file tidak hilang saat
         pindah tab. -->
    <div class="esm-layout">
      <nav class="esm-nav" aria-label="Bagian Event Setting">
        <button
          v-for="t in esmTabs"
          :key="t.key"
          type="button"
          class="esm-nav__item"
          :class="{ active: esmTab === t.key }"
          @click="esmTab = t.key"
        >
          <Icon :icon="t.icon" class="esm-nav__icon" />
          <span class="esm-nav__label">{{ t.label }}</span>
          <span v-if="t.badge" class="esm-nav__badge">{{ t.badge }}</span>
        </button>
      </nav>

      <div class="esm-panels">
        <!-- ===================== Informasi Event ===================== -->
        <section v-show="esmTab === 'info'" class="esm-panel">
          <header class="esm-panel__head">
            <h6 class="esm-panel__title">Informasi Event</h6>
            <p class="esm-panel__desc">Tingkat, nama event, sungai, dan alamat lengkap lokasi.</p>
          </header>
          <div class="esm-grid esm-grid--3">
            <b-form-group label="Event Level" label-class="esm-label">
              <b-form-select
                v-model="form.levelName"
                :options="sortedOptionLevels"
                value-field="name"
                text-field="name"
                class="br-15"
              />
            </b-form-group>
            <b-form-group label="Event Name" label-class="esm-label">
              <b-form-input v-model="form.eventName" placeholder="Enter your event name" class="br-15" />
            </b-form-group>
            <b-form-group label="River Name" label-class="esm-label">
              <b-form-input v-model="form.riverName" placeholder="Enter river name" class="br-15" />
            </b-form-group>
          </div>

          <div class="esm-subhead"><Icon icon="mdi:map-marker-outline" /> Alamat Lokasi</div>
          <div class="esm-grid esm-grid--3">
            <b-form-group label="District" label-class="esm-label">
              <b-form-input v-model="form.addressDistrict" placeholder="Enter District" class="br-15" />
            </b-form-group>
            <b-form-group label="Sub District" label-class="esm-label">
              <b-form-input v-model="form.addressSubDistrict" placeholder="Enter Sub District" class="br-15" />
            </b-form-group>
            <b-form-group label="Village" label-class="esm-label">
              <b-form-input v-model="form.addressVillage" placeholder="Enter Village" class="br-15" />
            </b-form-group>
          </div>
          <div class="esm-grid esm-grid--4">
            <b-form-group label="City" label-class="esm-label">
              <b-form-input v-model="form.addressCity" placeholder="Enter City" class="br-15" />
            </b-form-group>
            <b-form-group label="Province" label-class="esm-label">
              <b-form-input v-model="form.addressProvince" placeholder="Enter Province" class="br-15" />
            </b-form-group>
            <b-form-group label="ZIP Code" label-class="esm-label">
              <b-form-input v-model="form.addressZipCode" placeholder="Enter ZIP Code" class="br-15" />
            </b-form-group>
            <b-form-group label="State" label-class="esm-label">
              <b-form-input v-model="form.addressState" placeholder="Enter State" class="br-15" />
            </b-form-group>
          </div>
        </section>

        <!-- ===================== Jadwal & Zona Waktu ===================== -->
        <section v-show="esmTab === 'schedule'" class="esm-panel">
          <header class="esm-panel__head">
            <h6 class="esm-panel__title">Jadwal &amp; Zona Waktu</h6>
            <p class="esm-panel__desc">Rentang tanggal event dan zona waktu untuk semua tampilan waktu resmi.</p>
          </header>
          <!-- BUG FIX lama: b-form-datepicker (dropdown) ke-tutup/klik
               ke-intercept field lain (kuirk Chromium <legend>/fieldset) —
               diganti <b-calendar> inline (TANPA popup), sama fix pattern
               dgn CreateEvent.vue. -->
          <div class="esm-grid esm-grid--2">
            <b-form-group label="Start Date" label-class="esm-label">
              <div class="esm-date" :class="{ 'is-empty': !form.startDateEvent }">
                <Icon icon="mdi:calendar-start" />
                {{ form.startDateEvent || "Belum ada tanggal dipilih" }}
              </div>
              <b-calendar v-model="form.startDateEvent" class="br-15 stx-inline-calendar" block />
            </b-form-group>
            <b-form-group label="End Date" label-class="esm-label">
              <div class="esm-date" :class="{ 'is-empty': !form.endDateEvent }">
                <Icon icon="mdi:calendar-end" />
                {{ form.endDateEvent || (form.startDateEvent ? "Belum ada tanggal dipilih" : "Pilih Start Date dulu") }}
              </div>
              <b-calendar
                :disabled="form.startDateEvent === ''"
                v-model="form.endDateEvent"
                class="br-15 stx-inline-calendar"
                :min="form.startDateEvent"
                block
              />
            </b-form-group>
          </div>

          <!-- Zona Waktu Event — 1 pengaturan utk SEMUA tampilan Protest/
               Unofficial/Official Time (badge Result, stempel PDF, Live
               Result sts-jurysystem). Lihat officialStamp.js. -->
          <div class="esm-subhead"><Icon icon="mdi:earth" /> Zona Waktu Event</div>
          <div class="esm-tz">
            <button
              v-for="tz in ['WIB', 'WITA', 'WIT']"
              :key="tz"
              type="button"
              class="esm-tz__btn"
              :class="{ active: form.resultTimezone === tz }"
              @click="form.resultTimezone = tz"
            >
              {{ tz }}
            </button>
          </div>
          <small class="esm-help">
            Dipakai utk semua tampilan waktu Provisional/Unofficial/Official
            (badge Result, stempel PDF, Live Result di sts-jurysystem).
          </small>
        </section>

        <!-- ===================== Kategori Lomba ===================== -->
        <section v-show="esmTab === 'categories'" class="esm-panel esm-panel--overflow">
          <header class="esm-panel__head">
            <h6 class="esm-panel__title">Kategori Lomba</h6>
            <p class="esm-panel__desc">
              Urutan Event Categories menentukan urutan kartu di Event Detail serta
              panel di Race/Judges Settings.
            </p>
          </header>
          <div class="esm-grid esm-grid--2">
            <b-form-group label="Event Categories" label-class="esm-label">
              <multiselect
                v-model="form.categoriesEvent"
                :options="optionCategories"
                placeholder="Select event categories"
                multiple
                track-by="value"
                label="name"
              />
            </b-form-group>
            <b-form-group label="Division Categories" label-class="esm-label">
              <multiselect
                v-model="form.categoriesDivision"
                :options="optionDivisions"
                placeholder="Select division categories"
                multiple
                track-by="value"
                label="name"
              />
            </b-form-group>
            <b-form-group label="Race Categories" label-class="esm-label">
              <multiselect
                v-model="form.categoriesRace"
                :options="optionRaces"
                placeholder="Select race categories"
                multiple
                track-by="value"
                label="name"
              />
            </b-form-group>
            <b-form-group label="Initial Categories" label-class="esm-label">
              <multiselect
                v-model="form.categoriesInitial"
                :options="optionInitials"
                placeholder="Select initial categories"
                multiple
                track-by="value"
                label="name"
              />
            </b-form-group>
          </div>
        </section>

        <!-- ===================== Media ===================== -->
        <section v-show="esmTab === 'media'" class="esm-panel">
          <header class="esm-panel__head">
            <h6 class="esm-panel__title">Media</h6>
            <p class="esm-panel__desc">Poster untuk kartu event, logo event, dan logo sponsor.</p>
          </header>

          <!-- Poster -->
          <div class="esm-subhead"><Icon icon="mdi:image-outline" /> Poster Event</div>
          <div class="esm-poster">
            <img
              v-if="posterPreview || posterUrl"
              :src="posterPreview || posterUrl"
              class="poster-thumb"
              alt="Poster preview"
            />
            <div v-else class="poster-thumb poster-thumb-empty">
              <Icon icon="mdi:image-plus-outline" width="26" height="26" />
              No poster
            </div>
            <div class="esm-poster__side">
              <div class="esm-help mb-2">Ditampilkan sebagai gambar kartu event di halaman Events List.</div>
              <div class="sig-upload-actions">
                <input
                  ref="posterInput"
                  type="file"
                  accept="image/png,image/jpeg"
                  class="d-none"
                  @change="onPosterFileChange"
                />
                <button type="button" class="esm-mini" @click="$refs.posterInput.click()">
                  <Icon icon="mdi:upload" /> {{ posterPreview || posterUrl ? "Ganti" : "Choose Image" }}
                </button>
                <button
                  v-if="posterPreview || posterUrl"
                  type="button"
                  class="esm-mini esm-mini--danger"
                  @click="removePosterFile"
                >
                  <Icon icon="mdi:trash-can-outline" /> Remove
                </button>
              </div>
              <div class="esm-hint">PNG/JPEG, maksimum {{ maxSizeMB }}MB</div>
            </div>
          </div>

          <!-- Event Logo -->
          <div class="esm-subhead"><Icon icon="mdi:shield-star-outline" /> Event Logo</div>
          <div
            class="dropzone"
            :class="{ 'is-dragover': dzEventDragover }"
            @dragenter.prevent="onDragEnter('event')"
            @dragover.prevent="onDragOver('event')"
            @dragleave.prevent="onDragLeave('event')"
            @drop.prevent="onDrop('event', $event)"
            @click="onBrowse('event')"
          >
            <div class="dz-invite">
              <Icon icon="mdi:cloud-upload-outline" class="dz-icon" />
              <div class="dz-title">Drag &amp; Drop atau klik untuk pilih file</div>
              <div class="dz-sub">PNG maksimum {{ maxSizeMB }}MB · max {{ maxFiles }} file (termasuk yang sudah ada)</div>
            </div>
            <input
              ref="eventInput"
              type="file"
              accept="image/png"
              multiple
              class="d-none"
              @change="onFileChange('event', $event)"
            />
          </div>
          <div v-if="eventFiles.length" class="file-list">
            <div
              class="file-pill"
              v-for="(f, idx) in eventFiles"
              :key="'evt-' + idx + '-' + f.name + '-' + f.size"
            >
              <span class="file-ext">PNG</span>
              <span class="file-name" :title="f.name">{{ f.name }}</span>
              <span class="file-size">{{ formatBytes(f.size) }}</span>
              <button class="file-del" @click.stop="removeFile('event', idx)" title="Remove">
                <Icon icon="mdi:close" />
              </button>
            </div>
          </div>
          <div v-if="keepEventUrls.length" class="gallery">
            <div v-for="(u, i) in keepEventUrls" :key="'evt-thumb-' + i" class="thumb">
              <img class="thumb-img" :src="thumbFromUrl(u)" :alt="fileNameFromUrl(u)" loading="lazy" />
              <div class="thumb-caption" :title="fileNameFromUrl(u)">{{ fileNameFromUrl(u) }}</div>
              <button class="thumb-del" @click.stop="deleteExisting('event', u)" title="Delete">
                <Icon icon="mdi:trash-can-outline" />
              </button>
            </div>
          </div>

          <!-- Sponsorship Logo -->
          <div class="esm-subhead"><Icon icon="mdi:handshake-outline" /> Sponsorship Logo</div>
          <div
            class="dropzone"
            :class="{ 'is-dragover': dzSponsorDragover }"
            @dragenter.prevent="onDragEnter('sponsor')"
            @dragover.prevent="onDragOver('sponsor')"
            @dragleave.prevent="onDragLeave('sponsor')"
            @drop.prevent="onDrop('sponsor', $event)"
            @click="onBrowse('sponsor')"
          >
            <div class="dz-invite">
              <Icon icon="mdi:cloud-upload-outline" class="dz-icon" />
              <div class="dz-title">Drag &amp; Drop atau klik untuk pilih file</div>
              <div class="dz-sub">PNG maksimum {{ maxSizeMB }}MB · max {{ maxFiles }} file (termasuk yang sudah ada)</div>
            </div>
            <input
              ref="sponsorInput"
              type="file"
              accept="image/png"
              multiple
              class="d-none"
              @change="onFileChange('sponsor', $event)"
            />
          </div>
          <div v-if="sponsorFiles.length" class="file-list">
            <div
              class="file-pill"
              v-for="(f, idx) in sponsorFiles"
              :key="'spn-' + idx + '-' + f.name + '-' + f.size"
            >
              <span class="file-ext">PNG</span>
              <span class="file-name" :title="f.name">{{ f.name }}</span>
              <span class="file-size">{{ formatBytes(f.size) }}</span>
              <button class="file-del" @click.stop="removeFile('sponsor', idx)" title="Remove">
                <Icon icon="mdi:close" />
              </button>
            </div>
          </div>
          <div v-if="keepSponsorUrls.length" class="gallery">
            <div v-for="(u, i) in keepSponsorUrls" :key="'spn-thumb-' + i" class="thumb">
              <img class="thumb-img" :src="thumbFromUrl(u)" :alt="fileNameFromUrl(u)" loading="lazy" />
              <div class="thumb-caption" :title="fileNameFromUrl(u)">{{ fileNameFromUrl(u) }}</div>
              <button class="thumb-del" @click.stop="deleteExisting('sponsor', u)" title="Delete">
                <Icon icon="mdi:trash-can-outline" />
              </button>
            </div>
          </div>
        </section>

        <!-- ===================== Komite & Tanda Tangan ===================== -->
        <section v-show="esmTab === 'committee'" class="esm-panel">
          <header class="esm-panel__head">
            <h6 class="esm-panel__title">Komite &amp; Tanda Tangan</h6>
            <p class="esm-panel__desc">Nama & tanda tangan (PNG, opsional) untuk dokumen hasil resmi.</p>
          </header>

          <div class="esm-grid esm-grid--3">
            <!-- Technical Delegate -->
            <div class="esm-person">
              <b-form-group label="Technical Delegate" label-class="esm-label">
                <b-form-input v-model="form.technicalDelegate" placeholder="Enter name" class="br-15" />
              </b-form-group>
              <div class="esm-sig">
                <img
                  v-if="technicalDelegateSignaturePreview || technicalDelegateSignatureUrl"
                  :src="technicalDelegateSignaturePreview || technicalDelegateSignatureUrl"
                  class="sig-thumb"
                  alt="Technical Delegate signature"
                />
                <div v-else class="sig-thumb sig-thumb-empty"><Icon icon="mdi:draw" /> No signature</div>
                <input ref="tdSignatureInput" type="file" accept="image/png" class="d-none" @change="onTechnicalDelegateSignatureChange" />
                <div class="sig-upload-actions">
                  <button type="button" class="esm-mini" @click="$refs.tdSignatureInput.click()">
                    <Icon icon="mdi:upload" />
                    {{ technicalDelegateSignaturePreview || technicalDelegateSignatureUrl ? "Ganti" : "Choose PNG" }}
                  </button>
                  <button
                    v-if="technicalDelegateSignaturePreview || technicalDelegateSignatureUrl"
                    type="button"
                    class="esm-mini esm-mini--danger"
                    @click="removeTechnicalDelegateSignatureFile"
                  >
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Race Director -->
            <div class="esm-person">
              <b-form-group label="Race Director" label-class="esm-label">
                <b-form-input v-model="form.raceDirector" placeholder="Enter name" class="br-15" />
              </b-form-group>
              <div class="esm-sig">
                <img
                  v-if="raceDirectorSignaturePreview || raceDirectorSignatureUrl"
                  :src="raceDirectorSignaturePreview || raceDirectorSignatureUrl"
                  class="sig-thumb"
                  alt="Race Director signature"
                />
                <div v-else class="sig-thumb sig-thumb-empty"><Icon icon="mdi:draw" /> No signature</div>
                <input ref="rdSignatureInput" type="file" accept="image/png" class="d-none" @change="onRaceDirectorSignatureChange" />
                <div class="sig-upload-actions">
                  <button type="button" class="esm-mini" @click="$refs.rdSignatureInput.click()">
                    <Icon icon="mdi:upload" />
                    {{ raceDirectorSignaturePreview || raceDirectorSignatureUrl ? "Ganti" : "Choose PNG" }}
                  </button>
                  <button
                    v-if="raceDirectorSignaturePreview || raceDirectorSignatureUrl"
                    type="button"
                    class="esm-mini esm-mini--danger"
                    @click="removeRaceDirectorSignatureFile"
                  >
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Chief Judge -->
            <div class="esm-person">
              <b-form-group label="Chief Judge" label-class="esm-label">
                <b-form-input v-model="form.chiefJudge" placeholder="Enter name" class="br-15" />
              </b-form-group>
              <div class="esm-sig">
                <img
                  v-if="chiefJudgeSignaturePreview || chiefJudgeSignatureUrl"
                  :src="chiefJudgeSignaturePreview || chiefJudgeSignatureUrl"
                  class="sig-thumb"
                  alt="Chief Judge signature"
                />
                <div v-else class="sig-thumb sig-thumb-empty"><Icon icon="mdi:draw" /> No signature</div>
                <input ref="cjSignatureInput" type="file" accept="image/png" class="d-none" @change="onChiefJudgeSignatureChange" />
                <div class="sig-upload-actions">
                  <button type="button" class="esm-mini" @click="$refs.cjSignatureInput.click()">
                    <Icon icon="mdi:upload" />
                    {{ chiefJudgeSignaturePreview || chiefJudgeSignatureUrl ? "Ganti" : "Choose PNG" }}
                  </button>
                  <button
                    v-if="chiefJudgeSignaturePreview || chiefJudgeSignatureUrl"
                    type="button"
                    class="esm-mini esm-mini--danger"
                    @click="removeChiefJudgeSignatureFile"
                  >
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="esm-subhead"><Icon icon="mdi:file-sign" /> Tanda Tangan di Hasil Cetak (PDF)</div>
          <div class="esm-help mb-2">Pilih tanda tangan mana yang ikut ditampilkan di hasil cetak (PDF).</div>
          <div class="esm-toggles">
            <label class="esm-toggle" :class="{ on: signatureTechnicalDelegate }">
              <input type="checkbox" v-model="signatureTechnicalDelegate" />
              <span class="esm-toggle__box"><Icon icon="mdi:check" /></span>
              Technical Delegate
            </label>
            <label class="esm-toggle" :class="{ on: signatureChiefJudge }">
              <input type="checkbox" v-model="signatureChiefJudge" />
              <span class="esm-toggle__box"><Icon icon="mdi:check" /></span>
              Chief Judge
            </label>
            <label class="esm-toggle" :class="{ on: signatureRaceDirector }">
              <input type="checkbox" v-model="signatureRaceDirector" />
              <span class="esm-toggle__box"><Icon icon="mdi:check" /></span>
              Race Director
            </label>
          </div>
        </section>
      </div>
    </div>

    <!-- Footer (menempel di bawah modal) -->
    <template #modal-footer>
      <div class="esm-foot">
        <span class="esm-foot__hint">
          <Icon icon="mdi:information-outline" />
          Perubahan baru tersimpan setelah klik Update.
        </span>
        <div class="esm-foot__actions">
          <button type="button" class="esm-btn esm-btn--ghost" :disabled="saving" @click="show = false">
            Cancel
          </button>
          <button type="button" class="esm-btn esm-btn--primary" :disabled="saving" @click="onUpdate">
            <b-spinner v-if="saving" small />
            <Icon v-else icon="mdi:content-save-outline" />
            {{ saving ? "Updating…" : "Update" }}
          </button>
        </div>
      </div>
    </template>
  </b-modal>
</template>

<script>
import { ipcRenderer } from "electron";
import Multiselect from "vue-multiselect";
import { logger } from "@/utils/logger";

export default {
  name: "EventSettingsModal",
  components: { Multiselect },
  props: {
    value: { type: Boolean, default: false },
    id: { type: String, default: "event-settings-modal" },
    eventId: { type: String, default: "" },
    eventName: { type: String, default: "" },
    maxFiles: { type: Number, default: 10 },
    maxSizeMB: { type: Number, default: 100 },
    // true selama parent (Details/index.vue) masih memproses simpan (upload
    // file ke Cloudinary, update DB, dll — bisa beberapa detik). Dipakai
    // utk menahan modal tetap terbuka sampai proses itu benar-benar
    // selesai, bukan langsung tertutup begitu tombol Update diklik.
    saving: { type: Boolean, default: false },
  },
  data() {
    return {
      // Tab aktif di navigasi kiri modal (lihat esmTabs).
      esmTab: "info",
      // ===== Event Information (eventsCollection) =====
      form: {
        levelName: "",
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
        // Comitte
        technicalDelegate: "",
        chiefJudge: "",
        raceDirector: "",
        resultTimezone: "WIB",
      },
      optionLevels: [],
      optionCategories: [],
      optionDivisions: [],
      optionRaces: [],
      optionInitials: [],

      // file baru (File[])
      eventFiles: [],
      sponsorFiles: [],

      // URL existing dari DB
      existingEventUrls: [],
      existingSponsorUrls: [],

      // URL existing yang dipertahankan (bisa berkurang jika dihapus di UI)
      keepEventUrls: [],
      keepSponsorUrls: [],

      dzEventDragover: false,
      dzSponsorDragover: false,

      signatureTechnicalDelegate: false,
      signatureChiefJudge: false,
      signatureRaceDirector: false,

      // ===== Comitte signature (opsional, PNG tunggal per role) =====
      // File yang dipilih tapi belum diupload (diupload saat Update ditekan)
      technicalDelegateSignatureFile: null,
      chiefJudgeSignatureFile: null,
      raceDirectorSignatureFile: null,
      // URL signature yang sudah tersimpan di DB (untuk preview)
      technicalDelegateSignatureUrl: "",
      chiefJudgeSignatureUrl: "",
      raceDirectorSignatureUrl: "",
      // preview lokal (object URL) untuk file yang baru dipilih
      technicalDelegateSignaturePreview: "",
      chiefJudgeSignaturePreview: "",
      raceDirectorSignaturePreview: "",
      // ditandai true kalau user menghapus signature yang sudah ada
      removeTechnicalDelegateSignature: false,
      removeChiefJudgeSignature: false,
      removeRaceDirectorSignature: false,

      // ===== Poster Event (opsional, gambar tunggal) =====
      posterFile: null, // File baru yang dipilih, belum diupload
      posterUrl: "", // URL yang sudah tersimpan di DB
      posterPreview: "", // object URL lokal utk file yang baru dipilih
      removePoster: false, // true kalau user menghapus poster yang sudah ada

      // true sesaat setelah tombol Update diklik, sampai prop `saving`
      // (dikendalikan parent) kembali ke false — dipakai watcher `saving`
      // di bawah utk tahu kapan boleh menutup modal.
      waitingForSave: false,
    };
  },

  computed: {
    // Navigasi tab modal — badge = jumlah item (kategori terpilih / file media).
    esmTabs() {
      const f = this.form || {};
      const len = (a) => (Array.isArray(a) ? a.length : 0);
      const catCount =
        len(f.categoriesEvent) + len(f.categoriesDivision) + len(f.categoriesRace) + len(f.categoriesInitial);
      const mediaCount =
        (this.posterPreview || this.posterUrl ? 1 : 0) +
        len(this.keepEventUrls) +
        len(this.eventFiles) +
        len(this.keepSponsorUrls) +
        len(this.sponsorFiles);
      return [
        { key: "info", label: "Informasi Event", icon: "mdi:information-outline" },
        { key: "schedule", label: "Jadwal & Zona Waktu", icon: "mdi:calendar-clock" },
        { key: "categories", label: "Kategori Lomba", icon: "mdi:flag-checkered", badge: catCount || null },
        { key: "media", label: "Media", icon: "mdi:image-multiple-outline", badge: mediaCount || null },
        { key: "committee", label: "Komite & Tanda Tangan", icon: "mdi:account-tie-outline" },
      ];
    },
    show: {
      get: function () { return this.value; },
      set: function (v) { this.$emit("input", v); },
    },
    sortedOptionLevels() {
      return [...this.optionLevels].sort((a, b) => {
        if (a.name === "Classification") return -1;
        if (b.name === "Classification") return 1;
        return a.name.localeCompare(b.name);
      });
    },
  },

  mounted() {
    this.loadOptions();
  },

  beforeDestroy() {
    this._clearEventDataListener();
    if (this.technicalDelegateSignaturePreview) URL.revokeObjectURL(this.technicalDelegateSignaturePreview);
    if (this.chiefJudgeSignaturePreview) URL.revokeObjectURL(this.chiefJudgeSignaturePreview);
    if (this.raceDirectorSignaturePreview) URL.revokeObjectURL(this.raceDirectorSignaturePreview);
    if (this.posterPreview) URL.revokeObjectURL(this.posterPreview);
  },

  watch: {
    show: {
      immediate: true,
      handler: function (v) {
        // selalu bersihkan listener/timeout dari pembukaan sebelumnya lebih
        // dulu — sebelumnya kalau modal ditutup sebelum balasan datang,
        // listener "get-events-byid-reply" dibiarkan menggantung (hanya
        // dibersihkan oleh timeout 3 detik), sehingga buka-tutup modal
        // dengan cepat bisa menumpuk beberapa listener sekaligus di channel
        // bersama ini
        this._clearEventDataListener();
        if (!v || !this.eventId) return;

        // reset state setiap modal dibuka
        this.esmTab = "info";
        this.eventFiles = [];
        this.sponsorFiles = [];
        this.existingEventUrls = [];
        this.existingSponsorUrls = [];
        this.keepEventUrls = [];
        this.keepSponsorUrls = [];

        this.technicalDelegateSignatureFile = null;
        this.chiefJudgeSignatureFile = null;
        this.raceDirectorSignatureFile = null;
        this.technicalDelegateSignaturePreview = "";
        this.chiefJudgeSignaturePreview = "";
        this.raceDirectorSignaturePreview = "";
        this.removeTechnicalDelegateSignature = false;
        this.removeChiefJudgeSignature = false;
        this.removeRaceDirectorSignature = false;

        if (this.posterPreview) URL.revokeObjectURL(this.posterPreview);
        this.posterFile = null;
        this.posterPreview = "";
        this.removePoster = false;

        var self = this;
        function onReply(_e, ev) {
          self._clearEventDataListener();

          var sig = ev && ev.signature ? ev.signature : {};
          self.signatureTechnicalDelegate = !!sig.technicalDelegate;
          self.signatureChiefJudge = !!sig.chiefJudge;
          self.signatureRaceDirector = !!sig.raceDirector;

          self.form = {
            levelName: ev && ev.levelName ? String(ev.levelName) : "",
            eventName: ev && ev.eventName ? String(ev.eventName) : "",
            riverName: ev && ev.riverName ? String(ev.riverName) : "",
            addressDistrict: ev && ev.addressDistrict ? String(ev.addressDistrict) : "",
            addressSubDistrict: ev && ev.addressSubDistrict ? String(ev.addressSubDistrict) : "",
            addressVillage: ev && ev.addressVillage ? String(ev.addressVillage) : "",
            addressCity: ev && ev.addressCity ? String(ev.addressCity) : "",
            addressProvince: ev && ev.addressProvince ? String(ev.addressProvince) : "",
            addressZipCode: ev && ev.addressZipCode ? String(ev.addressZipCode) : "",
            addressState: ev && ev.addressState ? String(ev.addressState) : "",
            startDateEvent: ev && ev.startDateEvent ? String(ev.startDateEvent) : "",
            endDateEvent: ev && ev.endDateEvent ? String(ev.endDateEvent) : "",
            categoriesEvent: ev && Array.isArray(ev.categoriesEvent) ? ev.categoriesEvent.slice() : [],
            categoriesDivision: ev && Array.isArray(ev.categoriesDivision) ? ev.categoriesDivision.slice() : [],
            categoriesRace: ev && Array.isArray(ev.categoriesRace) ? ev.categoriesRace.slice() : [],
            categoriesInitial: ev && Array.isArray(ev.categoriesInitial) ? ev.categoriesInitial.slice() : [],
            technicalDelegate: ev && ev.technicalDelegate ? String(ev.technicalDelegate) : "",
            chiefJudge: ev && ev.chiefJudge ? String(ev.chiefJudge) : "",
            raceDirector: ev && ev.raceDirector ? String(ev.raceDirector) : "",
            resultTimezone:
              ev && ["WIB", "WITA", "WIT"].includes(ev.resultTimezone)
                ? ev.resultTimezone
                : "WIB",
          };

          self.technicalDelegateSignatureUrl =
            ev && ev.technicalDelegateSignature && ev.technicalDelegateSignature.secure_url
              ? String(ev.technicalDelegateSignature.secure_url)
              : "";
          self.chiefJudgeSignatureUrl =
            ev && ev.chiefJudgeSignature && ev.chiefJudgeSignature.secure_url
              ? String(ev.chiefJudgeSignature.secure_url)
              : "";
          self.raceDirectorSignatureUrl =
            ev && ev.raceDirectorSignature && ev.raceDirectorSignature.secure_url
              ? String(ev.raceDirectorSignature.secure_url)
              : "";

          self.posterUrl =
            ev && ev.poster && ev.poster.secure_url
              ? String(ev.poster.secure_url)
              : ev && ev.poster_url
              ? String(ev.poster_url)
              : "";

          self.existingEventUrls   = ev && ev.eventFiles && Array.isArray(ev.eventFiles) ? ev.eventFiles.slice() : [];
          self.existingSponsorUrls = ev && ev.sponsorFiles && Array.isArray(ev.sponsorFiles) ? ev.sponsorFiles.slice() : [];

          self.keepEventUrls = self.existingEventUrls.slice();
          self.keepSponsorUrls = self.existingSponsorUrls.slice();
        }

        this._eventDataReplyHandler = onReply;
        ipcRenderer.on("get-events-byid-reply", onReply);
        ipcRenderer.send("get-events-byid", this.eventId);

        // guard timeout supaya listener tidak menggantung
        this._eventDataReplyTimeout = setTimeout(function () {
          self._clearEventDataListener();
        }, 3000);
      },
    },
    "form.startDateEvent": function (newStart) {
      // kalau start date digeser jadi setelah end date yang sudah dipilih,
      // end date lama jadi tidak valid (range terbalik) — kosongkan supaya
      // user memilih ulang, daripada diam-diam tersimpan dengan range salah
      if (
        newStart &&
        this.form.endDateEvent &&
        this.form.endDateEvent < newStart
      ) {
        this.form.endDateEvent = "";
      }
    },
    // Tutup modal HANYA setelah parent benar-benar selesai memproses simpan
    // (saving balik ke false) — sebelumnya modal ditutup seketika begitu
    // tombol Update diklik, padahal upload file & update DB di parent masih
    // berjalan di background tanpa terlihat sedang berlangsung di modal ini.
    saving: function (v) {
      if (!v && this.waitingForSave) {
        this.waitingForSave = false;
        this.show = false;
      }
    },
  },

  methods: {
    _clearEventDataListener: function () {
      if (this._eventDataReplyHandler) {
        ipcRenderer.removeListener(
          "get-events-byid-reply",
          this._eventDataReplyHandler
        );
        this._eventDataReplyHandler = null;
      }
      if (this._eventDataReplyTimeout) {
        clearTimeout(this._eventDataReplyTimeout);
        this._eventDataReplyTimeout = null;
      }
    },

    /* ---------------- Options (Event Information) ---------------- */
    loadOptions: function () {
      var self = this;
      ipcRenderer.send("option-level");
      ipcRenderer.once("option-level-reply", function (_e, data) {
        self.optionLevels = data || [];
      });
      ipcRenderer.send("option-categories-event");
      ipcRenderer.once("option-categories-event-reply", function (_e, data) {
        self.optionCategories = data || [];
      });
      ipcRenderer.send("option-categories-division");
      ipcRenderer.once("option-categories-division-reply", function (_e, data) {
        self.optionDivisions = data || [];
      });
      ipcRenderer.send("option-categories-initial");
      ipcRenderer.once("option-categories-initial-reply", function (_e, data) {
        self.optionInitials = data || [];
      });
      ipcRenderer.send("option-categories-race");
      ipcRenderer.once("option-categories-race-reply", function (_e, data) {
        self.optionRaces = data || [];
      });
    },

    /* ---------------- Existing thumbnail helpers ---------------- */
    fileNameFromUrl: function (url) {
      try {
        var u = new URL(String(url));
        var last = u.pathname.split("/").pop() || "";
        return decodeURIComponent(last);
      } catch (_e) {
        var s = String(url || "");
        var q = s.split("?")[0];
        return decodeURIComponent(q.split("/").pop() || s);
      }
    },
    thumbFromUrl: function (url) {
      // Jika Cloudinary: sisipkan transformasi thumbnail
      try {
        var u = new URL(String(url));
        // cari "/upload/"
        var p = u.pathname;
        var idx = p.indexOf("/upload/");
        if (idx !== -1) {
          var prefix = p.substring(0, idx + 8); // termasuk "/upload/"
          var suffix = p.substring(idx + 8);
          // transformasi ringan: lebar 240, tinggi 160, format otomatis, quality auto, crop fit
          var trans = "c_limit,w_240,h_160,q_auto,f_auto/";
          u.pathname = prefix + trans + suffix;
          return u.toString();
        }
        return url; // bukan Cloudinary
      } catch (_e) {
        return url;
      }
    },

    /* ---------------- Delete satu URL existing ---------------- */
    deleteExisting: async function (zone, url) {
      var list = zone === "event" ? this.keepEventUrls : this.keepSponsorUrls;
      var idx = list.indexOf(url);
      if (idx < 0) return;

      var publicId = this._publicIdFromUrl(url);

      try {
        if (window.cloud && typeof window.cloud.deleteByPublicId === "function" && publicId) {
          await window.cloud.deleteByPublicId(publicId);
        }
      } catch (e) {
        logger.warn("Cloudinary delete failed:", e);
      }

      try {
        if (ipcRenderer && typeof ipcRenderer.send === "function") {
          ipcRenderer.send("services:event-assets:remove-one", {
            _id: this.eventId,
            field: zone === "event" ? "eventFiles" : "sponsorFiles",
            url: url,
            public_id: publicId,
          });
        }
      } catch (_e) {
        logger.warn("Gagal mengirim remove-one asset ke backend:", _e);
      }

      list.splice(idx, 1);
      if (zone === "event") this.keepEventUrls = list.slice();
      else this.keepSponsorUrls = list.slice();
    },

    _publicIdFromUrl: function (url) {
      try {
        // contoh: /image/upload/v1760692994/sustainable-js/abc.png
        var u = new URL(String(url));
        var parts = u.pathname.split("/upload/");
        var afterUpload = parts.length > 1 ? parts[1] : "";
        var noVersion = afterUpload.replace(/^v\d+\//, "");
        return noVersion.replace(/\.[a-z0-9]+$/i, "");
      } catch (_e) {
        return "";
      }
    },

    /* ---------------- Dropzone helpers ---------------- */
    onBrowse: function (zone) {
      var refName = zone === "event" ? "eventInput" : "sponsorInput";
      var el = this.$refs[refName];
      if (el) el.click();
    },
    onFileChange: function (zone, e) {
      var list = e && e.target && e.target.files ? e.target.files : null;
      var files = [];
      if (list) { for (var i = 0; i < list.length; i++) files.push(list[i]); }
      this.addFiles(zone, files);
      if (e && e.target) e.target.value = "";
    },
    onDragEnter: function (zone) {
      if (zone === "event") this.dzEventDragover = true;
      else this.dzSponsorDragover = true;
    },
    onDragOver: function (zone) {
      if (zone === "event") this.dzEventDragover = true;
      else this.dzSponsorDragover = true;
    },
    onDragLeave: function (zone) {
      if (zone === "event") this.dzEventDragover = false;
      else this.dzSponsorDragover = false;
    },
    onDrop: function (zone, e) {
      if (zone === "event") this.dzEventDragover = false;
      else this.dzSponsorDragover = false;

      var list = e && e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files : null;
      var files = [];
      if (list) { for (var i = 0; i < list.length; i++) files.push(list[i]); }
      this.addFiles(zone, files);
    },

    addFiles: function (zone, files) {
      var target = zone === "event" ? this.eventFiles : this.sponsorFiles;
      var keptCount = zone === "event" ? this.keepEventUrls.length : this.keepSponsorUrls.length;

      var accepted = [];
      var errors = [];

      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var name = f && f.name ? String(f.name) : "";
        var type = f && f.type ? String(f.type) : "";
        var size = Number((f && f.size) || 0);

        var isPng = /image\/png/i.test(type) || /\.png$/i.test(name);
        var sizeOk = size <= this.maxSizeMB * 1024 * 1024;

        if (!isPng) { errors.push(name + ": hanya PNG"); continue; }
        if (!sizeOk) { errors.push(name + ": > " + this.maxSizeMB + "MB"); continue; }

        accepted.push(f);
      }

      var remaining = this.maxFiles - (keptCount + target.length);
      if (remaining < 0) remaining = 0;

      var toAdd = accepted.slice(0, remaining);
      for (var j = 0; j < toAdd.length; j++) target.push(toAdd[j]);

      if (zone === "event") this.eventFiles = target.slice();
      else this.sponsorFiles = target.slice();

      if (errors.length) {
        var msg = errors.join("\n");
        if (this.$bvToast) this.$bvToast.toast(msg, { title: "Upload warning", variant: "warning", solid: true });
        else alert(msg);
      }

      if (accepted.length > toAdd.length) {
        var overMsg = "Max " + this.maxFiles + " file per section (termasuk yang sudah ada).";
        if (this.$bvToast) this.$bvToast.toast(overMsg, { title: "Limit reached", variant: "danger", solid: true });
        else alert(overMsg);
      }
    },

    removeFile: function (zone, idx) {
      var target = zone === "event" ? this.eventFiles : this.sponsorFiles;
      if (idx >= 0 && idx < target.length) {
        target.splice(idx, 1);
        if (zone === "event") this.eventFiles = target.slice();
        else this.sponsorFiles = target.slice();
      }
    },

    formatBytes: function (bytes) {
      if (!isFinite(bytes)) return "-";
      var units = ["B", "KB", "MB", "GB"];
      var i = 0;
      var n = bytes;
      while (n >= 1024 && i < units.length - 1) { n = n / 1024; i = i + 1; }
      var fixed = n >= 10 || i === 0 ? 0 : 1;
      return n.toFixed(fixed) + " " + units[i];
    },

    /* ---------------- Comitte signature (opsional, PNG) ---------------- */
    _pickPngFile: function (e) {
      var file = e && e.target && e.target.files ? e.target.files[0] : null;
      if (e && e.target) e.target.value = "";
      if (!file) return null;

      var isPng = /image\/png/i.test(file.type || "") || /\.png$/i.test(file.name || "");
      if (!isPng) {
        var msg1 = "Signature harus berformat PNG";
        if (this.$bvToast) this.$bvToast.toast(msg1, { title: "Format tidak didukung", variant: "warning", solid: true });
        else alert(msg1);
        return null;
      }

      var sizeOk = file.size <= this.maxSizeMB * 1024 * 1024;
      if (!sizeOk) {
        var msg2 = "Ukuran signature maksimum " + this.maxSizeMB + "MB";
        if (this.$bvToast) this.$bvToast.toast(msg2, { title: "Ukuran terlalu besar", variant: "warning", solid: true });
        else alert(msg2);
        return null;
      }

      return file;
    },

    onTechnicalDelegateSignatureChange: function (e) {
      var file = this._pickPngFile(e);
      if (!file) return;
      if (this.technicalDelegateSignaturePreview) {
        URL.revokeObjectURL(this.technicalDelegateSignaturePreview);
      }
      this.technicalDelegateSignatureFile = file;
      this.technicalDelegateSignaturePreview = URL.createObjectURL(file);
      this.removeTechnicalDelegateSignature = false;
    },
    removeTechnicalDelegateSignatureFile: function () {
      if (this.technicalDelegateSignaturePreview) {
        URL.revokeObjectURL(this.technicalDelegateSignaturePreview);
      }
      this.technicalDelegateSignatureFile = null;
      this.technicalDelegateSignaturePreview = "";
      if (this.technicalDelegateSignatureUrl) {
        this.removeTechnicalDelegateSignature = true;
        this.technicalDelegateSignatureUrl = "";
      }
    },

    onChiefJudgeSignatureChange: function (e) {
      var file = this._pickPngFile(e);
      if (!file) return;
      if (this.chiefJudgeSignaturePreview) {
        URL.revokeObjectURL(this.chiefJudgeSignaturePreview);
      }
      this.chiefJudgeSignatureFile = file;
      this.chiefJudgeSignaturePreview = URL.createObjectURL(file);
      this.removeChiefJudgeSignature = false;
    },
    removeChiefJudgeSignatureFile: function () {
      if (this.chiefJudgeSignaturePreview) {
        URL.revokeObjectURL(this.chiefJudgeSignaturePreview);
      }
      this.chiefJudgeSignatureFile = null;
      this.chiefJudgeSignaturePreview = "";
      if (this.chiefJudgeSignatureUrl) {
        this.removeChiefJudgeSignature = true;
        this.chiefJudgeSignatureUrl = "";
      }
    },

    onRaceDirectorSignatureChange: function (e) {
      var file = this._pickPngFile(e);
      if (!file) return;
      if (this.raceDirectorSignaturePreview) {
        URL.revokeObjectURL(this.raceDirectorSignaturePreview);
      }
      this.raceDirectorSignatureFile = file;
      this.raceDirectorSignaturePreview = URL.createObjectURL(file);
      this.removeRaceDirectorSignature = false;
    },
    removeRaceDirectorSignatureFile: function () {
      if (this.raceDirectorSignaturePreview) {
        URL.revokeObjectURL(this.raceDirectorSignaturePreview);
      }
      this.raceDirectorSignatureFile = null;
      this.raceDirectorSignaturePreview = "";
      if (this.raceDirectorSignatureUrl) {
        this.removeRaceDirectorSignature = true;
        this.raceDirectorSignatureUrl = "";
      }
    },

    onPosterFileChange: function (e) {
      var file = e && e.target && e.target.files ? e.target.files[0] : null;
      if (e && e.target) e.target.value = "";
      if (!file) return;

      var isImg = /image\/(png|jpeg)/i.test(file.type || "") || /\.(png|jpe?g)$/i.test(file.name || "");
      if (!isImg) {
        var msg1 = "Poster harus berformat PNG atau JPEG";
        if (this.$bvToast) this.$bvToast.toast(msg1, { title: "Format tidak didukung", variant: "warning", solid: true });
        else alert(msg1);
        return;
      }
      var sizeOk = file.size <= this.maxSizeMB * 1024 * 1024;
      if (!sizeOk) {
        var msg2 = "Ukuran poster maksimum " + this.maxSizeMB + "MB";
        if (this.$bvToast) this.$bvToast.toast(msg2, { title: "File terlalu besar", variant: "warning", solid: true });
        else alert(msg2);
        return;
      }

      if (this.posterPreview) URL.revokeObjectURL(this.posterPreview);
      this.posterFile = file;
      this.posterPreview = URL.createObjectURL(file);
      this.removePoster = false;
    },
    removePosterFile: function () {
      if (this.posterPreview) URL.revokeObjectURL(this.posterPreview);
      this.posterFile = null;
      this.posterPreview = "";
      if (this.posterUrl) {
        this.removePoster = true;
        this.posterUrl = "";
      }
    },

    onUpdate: function () {
      this.waitingForSave = true;

      var payload = {
        eventId: this.eventId,
        eventName: this.form.eventName || this.eventName,
        signature: {
          technicalDelegate: this.signatureTechnicalDelegate,
          chiefJudge: this.signatureChiefJudge,
          raceDirector: this.signatureRaceDirector,
        },
        eventFiles: this.eventFiles,       // File[] baru
        sponsorFiles: this.sponsorFiles,   // File[] baru
        keepEventUrls: this.keepEventUrls, // URL lama yang dipertahankan
        keepSponsorUrls: this.keepSponsorUrls,

        // ===== Event Information =====
        levelName: this.form.levelName,
        riverName: this.form.riverName,
        addressDistrict: this.form.addressDistrict,
        addressSubDistrict: this.form.addressSubDistrict,
        addressVillage: this.form.addressVillage,
        addressCity: this.form.addressCity,
        addressProvince: this.form.addressProvince,
        addressZipCode: this.form.addressZipCode,
        addressState: this.form.addressState,
        startDateEvent: this.form.startDateEvent,
        endDateEvent: this.form.endDateEvent,
        categoriesEvent: this.form.categoriesEvent,
        categoriesDivision: this.form.categoriesDivision,
        categoriesRace: this.form.categoriesRace,
        categoriesInitial: this.form.categoriesInitial,

        // ===== Comitte =====
        technicalDelegate: this.form.technicalDelegate,
        chiefJudge: this.form.chiefJudge,
        raceDirector: this.form.raceDirector,

        // ===== Zona Waktu =====
        resultTimezone: this.form.resultTimezone,

        // ===== Comitte signature (File baru, opsional) =====
        technicalDelegateSignatureFile: this.technicalDelegateSignatureFile,
        chiefJudgeSignatureFile: this.chiefJudgeSignatureFile,
        raceDirectorSignatureFile: this.raceDirectorSignatureFile,
        removeTechnicalDelegateSignature: this.removeTechnicalDelegateSignature,
        removeChiefJudgeSignature: this.removeChiefJudgeSignature,
        removeRaceDirectorSignature: this.removeRaceDirectorSignature,

        // ===== Poster Event (File baru, opsional) =====
        posterFile: this.posterFile,
        removePoster: this.removePoster,
      };

      this.$emit("update-settings", payload);
      // JANGAN tutup modal di sini — upload file & update DB di parent
      // (handleUpdateSettings) masih async dan bisa makan waktu beberapa
      // detik. Modal ditutup otomatis oleh watcher `saving` di atas begitu
      // parent selesai (baik sukses maupun gagal — parent sudah punya
      // notifikasi get-alert/get-alert-saved sendiri utk itu).
    },
  },
};
</script>

<!-- unscoped: .modal-header/.modal-body dirender BootstrapVue di luar root
     komponen ini, jadi <style scoped> di bawah tidak bisa menjangkaunya -->
<style>
/* Batasi tinggi modal & jadikan layout fleksibel supaya bisa discroll saat
   konten melebihi tinggi layar — sama dgn Race Settings & Judges Configuration.
   PENTING: pakai !important — BootstrapVue's `centered` + `scrollable`
   sekaligus menghasilkan class `.modal-dialog-centered.modal-dialog-
   scrollable .modal-content { max-height: none }` yang spesifisitasnya
   (3 class) lebih tinggi dari .rs-modal (1 class). */
.rs-modal {
  display: flex;
  flex-direction: column;
  max-height: 65vh !important;
  overflow: hidden;
}

.rs-modal .modal-header {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #fff;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.06);
}

.rs-modal .modal-body {
  overflow: auto;
}

/* Start/End Date sekarang <b-calendar> inline (bukan lagi
   b-form-datepicker dropdown, lihat catatan di template) — styling
   kosmetik saja, tidak ada lagi kebutuhan z-index/overflow khusus krn
   tidak ada popup yang perlu escape batas modal. */
.stx-inline-calendar-value {
  font-weight: 600;
  color: #1c4c7a;
  padding: 6px 2px;
  font-size: 0.9rem;
}
.stx-inline-calendar {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
</style>

<style scoped>
.modal-inner { background: #f5f7fb; }
.cardish {
  background: #fff; border: 1px solid #e8edf5; border-radius: 14px;
  padding: 16px; box-shadow: 0 6px 16px rgba(16, 24, 40, 0.04);
}
.section-title { font-weight: 800; color: #222; margin-bottom: 8px; }

/* Dropzone */
.dropzone {
  border: 2px dashed #d6dee9; border-radius: 12px; background: #fcfdff;
  min-height: 120px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s ease;
}
.dropzone:hover { border-color: rgb(0, 180, 255); box-shadow: 0 0 20px rgba(0, 180, 255, 0.2); }
.dropzone.is-dragover { background: #eef6ff; border-color: rgb(0, 180, 255); }
.dz-invite { text-align: center; padding: 16px 8px; }
.dz-icon { font-size: 22px; opacity: 0.7; }
.dz-title { font-weight: 700; color: #3b3b3b; }
.dz-sub { color: #9aa6b2; font-size: 12px; }

.hint-danger { color: #e53935; font-size: 12px; margin-top: 6px; }

/* File list (baru) */
.file-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.file-pill {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #e6ebf4; border-radius: 12px;
  padding: 8px 12px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
}
.file-ext {
  background: #eef6ff; color: rgb(0, 180, 255);
  border: 1px solid #dbeafe; border-radius: 8px; font-weight: 800; font-size: 12px; padding: 2px 6px;
}
.file-name { max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700; }
.file-size { color: #64748b; font-size: 12px; }
.file-del { border: none; background: transparent; cursor: pointer; color: #e53935; font-size: 16px; line-height: 1; }

/* Gallery existing */
.gallery {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.thumb {
  position: relative;
  background: #fff;
  border: 1px solid #e6ebf4;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
}
.thumb-img {
  width: 100%;
  height: 120px;
  object-fit: contain;
  background: #f8fafc;
}
.thumb-caption {
  font-size: 12px;
  padding: 6px 10px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}
.thumb-del {
  position: absolute;
  top: 6px;
  right: 6px;
  border: none;
  background: rgba(229, 57, 53, 0.9);
  color: #fff;
  border-radius: 8px;
  width: 28px;
  height: 24px;
  line-height: 24px;
  font-size: 14px;
  cursor: pointer;
}

/* Signature */
.signature .sig-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 12px;
}
.sig-item { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.sig-item input[type="checkbox"] { transform: scale(1.1); }

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

.poster-thumb {
  width: 90px;
  height: 120px;
  object-fit: cover;
  background: #fff;
  border: 1px solid #e6ebf4;
  border-radius: 8px;
  padding: 2px;
}
.poster-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 11px;
  background: #fafafa;
  border: 1px dashed #cbd5e1;
  text-align: center;
}

/* Footer */
.footer-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.btn-outline, .btn-primary {
  border-radius: 10px; padding: 10px 18px; font-weight: 800;
  border: 1px solid #cfd8e6; background: #fff; color: #1c4c7a;
}
.btn-outline:hover { box-shadow: 0 0 20px rgba(0, 180, 255, 0.2); }
.btn-primary { background: #2f6ea5; color: #fff; border-color: #2f6ea5; }
.btn-primary:disabled { opacity: .65; cursor: not-allowed; }

/* Header close button */
.btn-icon {
  background: #f6f7fb; border: 1px solid #e6ebf4; border-radius: 999px;
  width: 32px; height: 32px; font-weight: 700; line-height: 1;
}
</style>

<style>
/* ===== Event Setting (redesign) — pembungkus modal =====
   Global krn b-modal dirender di <body> (.modal-content/.modal-body/
   .modal-footer dibuat BootstrapVue). Kelas berawalan `esm-`. */
.esm-content {
  border: none;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
}
.esm-body {
  background: #f5f8fc;
}
.esm-footer {
  padding: 0;
  border-top: 1px solid #e6edf6;
  background: #ffffff;
}
</style>

<style scoped>
/* ===== Event Setting (redesign) — isi modal (ditaruh SETELAH style
   scoped lama supaya menang atas .dropzone/.gallery/.sig-thumb lama). ===== */

/* Header */
.esm-head {
  position: relative;
  width: 100%;
  color: #fff;
}
.esm-head__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(520px 200px at 88% 0%, rgba(37, 176, 235, 0.45), transparent 70%),
    linear-gradient(110deg, #0f2f52 0%, #1c4c7a 55%, #1d7fb8 100%);
}
.esm-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
}
.esm-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
.esm-head__inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 64px 20px 26px;
}
.esm-head__icon {
  flex: none;
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #bae6fd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.esm-head__text {
  min-width: 0;
}
.esm-eyebrow {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #bae6fd;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.esm-title {
  margin: 5px 0 0;
  font-size: 20px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.esm-sub {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.65);
}

/* Layout: nav kiri + konten */
.esm-layout {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  min-height: 100%;
}
.esm-nav {
  position: sticky;
  top: 0;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 12px;
}
.esm-nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: #475569;
  font-size: 13.5px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.esm-nav__item:hover {
  background: #ffffff;
  color: #1c4c7a;
}
.esm-nav__item.active {
  background: #ffffff;
  border-color: #d6e8fb;
  color: #1c4c7a;
  box-shadow: 0 4px 12px rgba(28, 76, 122, 0.1);
}
.esm-nav__icon {
  flex: none;
  font-size: 18px;
  color: #94a3b8;
}
.esm-nav__item.active .esm-nav__icon {
  color: #25b0eb;
}
.esm-nav__label {
  flex: 1;
}
.esm-nav__badge {
  min-width: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  background: #e6f4fd;
  color: #1c4c7a;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
}

.esm-panels {
  padding: 18px 22px 22px 6px;
  min-width: 0;
}
.esm-panel {
  background: #ffffff;
  border: 1px solid #e6edf6;
  border-radius: 16px;
  padding: 18px 20px 6px;
  box-shadow: 0 6px 18px rgba(15, 42, 67, 0.05);
}
.esm-panel__head {
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
}
.esm-panel__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}
.esm-panel__desc {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: #64748b;
}
.esm-subhead {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 16px 0 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #1c4c7a;
}
.esm-subhead svg {
  color: #25b0eb;
  font-size: 16px;
}
.esm-grid {
  display: grid;
  gap: 0 14px;
}
.esm-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.esm-grid--3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.esm-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.esm-panel ::v-deep .esm-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  padding-bottom: 4px;
}
.esm-help {
  display: block;
  font-size: 12px;
  color: #64748b;
}
.esm-hint {
  margin-top: 6px;
  font-size: 11.5px;
  color: #94a3b8;
}

/* Tanggal */
.esm-date {
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
.esm-date.is-empty {
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

/* Zona waktu (segmented) */
.esm-tz {
  display: inline-flex;
  padding: 4px;
  gap: 4px;
  border-radius: 12px;
  background: #f1f5fb;
  border: 1px solid #e6edf6;
  margin-bottom: 8px;
}
.esm-tz__btn {
  min-width: 72px;
  height: 34px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}
.esm-tz__btn.active {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  box-shadow: 0 4px 10px rgba(28, 76, 122, 0.25);
}

/* Media */
.esm-poster {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.poster-thumb {
  width: 180px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e6edf6;
  background: #f8fafc;
}
.poster-thumb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #94a3b8;
  font-size: 12px;
  border-style: dashed;
  border-color: #cbd5e1;
}
.dropzone {
  border: 1.5px dashed #cbd5e1;
  border-radius: 14px;
  background: #fafcff;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.dropzone:hover,
.dropzone.is-dragover {
  border-color: #25b0eb;
  background: #f0f7ff;
  box-shadow: none;
}
.dz-invite {
  padding: 18px 8px;
}
.dz-icon {
  font-size: 28px;
  color: #25b0eb;
  opacity: 1;
}
.dz-title {
  margin-top: 4px;
  font-size: 13.5px;
  color: #334155;
}
.dz-sub {
  font-size: 11.5px;
}
.file-pill {
  border-radius: 10px;
}
.file-del {
  color: #dc2626;
  display: inline-flex;
  align-items: center;
}
.gallery {
  margin-top: 12px;
}
.thumb {
  border-radius: 12px;
  border: 1px solid #e6edf6;
  overflow: hidden;
}
.thumb-del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Komite */
.esm-person {
  padding: 14px 14px 4px;
  margin-bottom: 12px;
  border-radius: 14px;
  border: 1px solid #eef2f7;
  background: #fbfdff;
}
.esm-sig {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: -4px 0 12px;
  flex-wrap: wrap;
}
.sig-thumb {
  width: 96px;
  height: 52px;
  border-radius: 9px;
  border: 1px solid #e6edf6;
}
.sig-thumb-empty {
  gap: 4px;
  border-style: dashed;
}
.esm-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 14px;
}
.esm-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 9px 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.esm-toggle input {
  display: none;
}
.esm-toggle__box {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1.5px solid #cbd5e1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  font-size: 13px;
}
.esm-toggle.on {
  border-color: #b9d7f0;
  background: #f0f7ff;
  color: #1c4c7a;
}
.esm-toggle.on .esm-toggle__box {
  border-color: transparent;
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
}

.esm-mini {
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
}
.esm-mini:hover {
  border-color: #25b0eb;
  background: #f0f7ff;
}
.esm-mini--danger {
  color: #dc2626;
  border-color: #fecaca;
}
.esm-mini--danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

/* Footer */
.esm-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 14px 22px;
}
.esm-foot__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #64748b;
}
.esm-foot__actions {
  display: flex;
  gap: 8px;
}
.esm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 20px;
  border-radius: 11px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
}
.esm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.esm-btn--ghost {
  background: #fff;
  border-color: #e2e8f0;
  color: #475569;
}
.esm-btn--ghost:hover:not(:disabled) {
  background: #f8fafc;
}
.esm-btn--primary {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  box-shadow: 0 6px 14px rgba(28, 76, 122, 0.25);
}
.esm-btn--primary:hover:not(:disabled) {
  filter: brightness(1.07);
}

@media (max-width: 991.98px) {
  .esm-layout {
    grid-template-columns: 1fr;
  }
  .esm-nav {
    position: static;
    flex-direction: row;
    overflow-x: auto;
    padding: 12px 16px 0;
  }
  .esm-nav__item {
    width: auto;
    white-space: nowrap;
  }
  .esm-panels {
    padding: 12px 16px 18px;
  }
  .esm-grid--3,
  .esm-grid--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 575.98px) {
  .esm-grid--2,
  .esm-grid--3,
  .esm-grid--4 {
    grid-template-columns: 1fr;
  }
}
</style>

