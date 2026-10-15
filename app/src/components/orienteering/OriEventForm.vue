<template>
  <div class="oef">
    <!-- ===== Info event ===== -->
    <div class="oef-section">
      <div class="oef-section__title"><Icon icon="mdi:information-outline" /> Informasi Event</div>

      <!-- Poster (cover kartu) & Logo (badge kartu + header halaman event) -->
      <div class="oef-images">
        <div v-for="slot in imageSlots" :key="slot.field" class="oef-image" :class="['is-' + slot.field, { 'has-image': hasImage(slot.field) }]">
          <div class="oef-image__preview">
            <img v-if="hasImage(slot.field)" :src="local[slot.field].url" :alt="slot.label" />
            <div v-else class="oef-image__empty">
              <Icon :icon="slot.icon" />
              <span>Belum ada {{ slot.short }}</span>
            </div>
            <div v-if="uploading === slot.field" class="oef-image__busy"><b-spinner small /> Mengunggah…</div>
          </div>
          <div class="oef-image__side">
            <div class="font-weight-bold">{{ slot.label }}</div>
            <div class="oef-muted">{{ slot.hint }}</div>
            <div class="d-flex flex-wrap mt-2" style="gap: 6px">
              <button type="button" class="oef-btn oef-btn--primary" :disabled="!!uploading" @click="pickImage(slot.field)">
                <Icon icon="mdi:upload-outline" /> {{ hasImage(slot.field) ? "Ganti" : "Upload" }}
              </button>
              <button v-if="hasImage(slot.field)" type="button" class="oef-btn" :disabled="!!uploading" @click="local[slot.field] = null">
                <Icon icon="mdi:close" /> Hapus
              </button>
            </div>
            <p v-if="uploadError[slot.field]" class="text-danger small mt-2 mb-0">{{ uploadError[slot.field] }}</p>
          </div>
        </div>
        <input ref="imageFile" type="file" accept="image/png,image/jpeg,image/webp" class="d-none" @change="onImageFile" />
      </div>

      <div class="oef-grid">
        <b-form-group label-for="oef-name">
          <template #label>Nama Event <span class="text-danger" title="Wajib diisi">*</span></template>
          <b-form-input id="oef-name" v-model="local.name" placeholder="mis. Kejurnas Orienteering 2026" autofocus />
        </b-form-group>
        <b-form-group label="Lokasi umum (opsional)" label-for="oef-loc" description="Lokasi tiap jenis Orienteering diisi di bawah.">
          <b-form-input id="oef-loc" v-model="local.location" placeholder="mis. Jawa Barat" />
        </b-form-group>
      </div>
      <label class="oef-live">
        <b-form-checkbox v-model="local.liveVisible" switch />
        <span>
          <b>Tampilkan di Live Result</b>
          <small>Hasil event ini bisa dilihat publik di Live Result sts-jurysystem (diperbarui otomatis tiap kartu dibaca).</small>
        </span>
      </label>
      <!-- Kalender inline (bukan dropdown) — sama dgn Create New Event rafting;
           popup datepicker pernah tidak bisa diklik di app ini. -->
      <div class="oef-grid">
        <b-form-group>
          <template #label>Start Date (Tanggal Mulai) <span class="text-danger" title="Wajib diisi">*</span></template>
          <div class="oef-date-value" :class="{ 'is-empty': !local.startDate }">
            <Icon icon="mdi:calendar-start" />
            {{ local.startDate ? formatDate(local.startDate) : "Belum ada tanggal dipilih" }}
          </div>
          <b-calendar v-model="local.startDate" class="stx-inline-calendar" locale="id-ID" block />
        </b-form-group>
        <b-form-group>
          <template #label>End Date (Tanggal Berakhir)</template>
          <div class="oef-date-value" :class="{ 'is-empty': !local.endDate }">
            <Icon icon="mdi:calendar-end" />
            {{
              local.endDate
                ? formatDate(local.endDate)
                : local.startDate
                ? "Sama dgn Start Date (event 1 hari)"
                : "Pilih Start Date dulu"
            }}
          </div>
          <b-calendar
            v-model="local.endDate"
            class="stx-inline-calendar"
            locale="id-ID"
            :min="local.startDate || undefined"
            :disabled="!local.startDate"
            block
          />
        </b-form-group>
      </div>
      <p v-if="durationLabel" class="oef-duration"><Icon icon="mdi:timer-outline" /> {{ durationLabel }}</p>
    </div>

    <!-- ===== Jenis Orienteering ===== -->
    <div class="oef-section">
      <div class="oef-section__title">
        <Icon icon="mdi:run-fast" /> Jenis Orienteering
        <span class="oef-muted">— course, start list, readout & hasil terpisah per jenis</span>
      </div>
      <div class="oef-type-picker">
        <button
          v-for="name in presetRaces"
          :key="name"
          type="button"
          class="oef-toggle"
          :class="{ on: hasRace(name) }"
          @click="toggleRace(name)"
        >
          <Icon :icon="hasRace(name) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" />
          {{ name }}
        </button>
        <span
          v-for="r in customRaces"
          :key="r.id"
          class="oef-toggle on"
        >
          <Icon icon="mdi:checkbox-marked" /> {{ r.name }}
          <button type="button" class="oef-cat__x" title="Hapus jenis" @click="removeRace(r)">×</button>
        </span>
        <div class="oef-inline-add">
          <b-form-input
            v-model="newRace"
            size="sm"
            placeholder="Jenis lain (mis. Long Distance)…"
            @keydown.enter.prevent="addCustomRace"
          />
          <button type="button" class="oef-btn" :disabled="!newRace.trim()" @click="addCustomRace">
            <Icon icon="mdi:plus" /> Tambah
          </button>
        </div>
      </div>
      <p v-if="!local.races.length" class="oef-empty">Pilih minimal satu jenis Orienteering.</p>
      <div v-else class="oef-races">
        <div v-for="r in local.races" :key="r.id" class="oef-race">
          <span class="oef-race__name"><Icon icon="mdi:run-fast" /> {{ r.name }}</span>
          <b-input-group size="sm" class="oef-race__loc">
            <b-input-group-prepend is-text><Icon icon="mdi:map-marker-outline" /></b-input-group-prepend>
            <b-form-input v-model="r.location" :placeholder="`Lokasi ${r.name} (mis. Jakarta)`" />
          </b-input-group>
        </div>
      </div>
    </div>

    <!-- ===== Type Event ===== -->
    <div class="oef-section">
      <div class="oef-section__title">
        <Icon icon="mdi:shape-outline" /> Type Event
        <span class="oef-muted">— boleh lebih dari satu</span>
      </div>
      <div class="oef-type-picker">
        <button
          v-for="name in presetTypes"
          :key="name"
          type="button"
          class="oef-toggle"
          :class="{ on: hasType(name) }"
          @click="toggleType(name)"
        >
          <Icon :icon="hasType(name) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" />
          {{ name }}
        </button>
        <div class="oef-inline-add">
          <b-form-input
            v-model="newType"
            size="sm"
            placeholder="Type lain…"
            @keydown.enter.prevent="addCustomType"
          />
          <button type="button" class="oef-btn" :disabled="!newType.trim()" @click="addCustomType">
            <Icon icon="mdi:plus" /> Tambah
          </button>
        </div>
      </div>

      <p v-if="!local.types.length" class="oef-empty">Pilih minimal satu Type Event untuk menambahkan kategori.</p>

      <!-- ===== Kategori per Type ===== -->
      <div v-for="t in local.types" :key="t.id" class="oef-type">
        <div class="oef-type__head">
          <span class="oef-type__badge"><Icon icon="mdi:shape-outline" /></span>
          <b-form-input v-model="t.name" size="sm" class="oef-type__name" />
          <span class="oef-muted">{{ classesOf(t.id).length }} kategori</span>
          <button type="button" class="oef-icon-btn oef-icon-btn--danger ml-auto" title="Hapus type" @click="removeType(t)">
            <Icon icon="mdi:trash-can-outline" />
          </button>
        </div>
        <!-- jenis tempat type ini dipertandingkan (mis. World Ranking hanya Middle) -->
        <div v-if="local.races.length > 1" class="oef-type__races">
          <span class="oef-builder__label">Dipertandingkan di</span>
          <div class="oef-chips">
            <button
              v-for="r in local.races"
              :key="r.id"
              type="button"
              class="oef-chip oef-chip--race"
              :class="{ on: typeHasRace(t, r.id) }"
              :title="typeHasRace(t, r.id) && typeRaceCount(t) === 1 ? 'Minimal satu jenis' : ''"
              @click="toggleTypeRace(t, r.id)"
            >
              <Icon :icon="typeHasRace(t, r.id) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'" />
              {{ r.name || "Jenis tanpa nama" }}
            </button>
          </div>
          <span class="oef-muted">
            {{ typeRaceCount(t) === local.races.length ? "Semua jenis" : `Hanya ${typeRaceNames(t)}` }}
          </span>
        </div>

        <div class="oef-builder">
          <div class="oef-builder__row">
            <span class="oef-builder__label">Kelompok umur</span>
            <div class="oef-chips">
              <button
                v-for="age in ageGroupsOf(t)"
                :key="age"
                type="button"
                class="oef-chip"
                :class="{ on: isWorldRanking(t) || builderOf(t.id).ages.includes(age) }"
                :disabled="isWorldRanking(t)"
                @click="toggleAge(t.id, age)"
              >
                {{ age }}
              </button>
            </div>
            <span v-if="isWorldRanking(t)" class="oef-muted">World Ranking Event hanya kelompok umur 21 (M21E / W21E)</span>
          </div>
          <div class="oef-builder__row">
            <span class="oef-builder__label">Gender</span>
            <div class="oef-chips">
              <button
                v-for="g in genders"
                :key="g"
                type="button"
                class="oef-chip"
                :class="{ on: builderOf(t.id).genders.includes(g) }"
                @click="toggleGender(t.id, g)"
              >
                {{ g }}
              </button>
            </div>
            <button
              type="button"
              class="oef-btn oef-btn--primary ml-auto"
              :disabled="!previewOf(t).length"
              @click="addGenerated(t)"
            >
              <Icon icon="mdi:playlist-plus" /> Tambahkan {{ previewOf(t).length || "" }} kategori
            </button>
          </div>
          <div v-if="previewOf(t).length" class="oef-builder__row">
            <span class="oef-builder__label">Akan dibuat</span>
            <span class="oef-muted">
              {{ previewOf(t).join(", ") }}
              <span v-if="isWorldRanking(t)"> (akhiran <b>E</b> = World Ranking Event)</span>
            </span>
          </div>
          <div v-if="!isWorldRanking(t)" class="oef-builder__row">
            <span class="oef-builder__label">Kategori lain</span>
            <div class="oef-inline-add">
              <b-form-input
                v-model="builderOf(t.id).custom"
                size="sm"
                placeholder="mis. M21 Novice"
                @keydown.enter.prevent="addCustomCategory(t.id)"
              />
              <button type="button" class="oef-btn" :disabled="!builderOf(t.id).custom.trim()" @click="addCustomCategory(t.id)">
                <Icon icon="mdi:plus" /> Tambah
              </button>
            </div>
          </div>
        </div>

        <div class="oef-cats">
          <span v-if="!classesOf(t.id).length" class="oef-muted">Belum ada kategori.</span>
          <span v-for="c in classesOf(t.id)" :key="c.id" class="oef-cat">
            <span v-if="genderOf(c.name)" class="oef-cat__g" :class="'is-' + genderOf(c.name)">{{ genderOf(c.name) }}</span>
            {{ c.name }}
            <span v-if="participantCount[c.id]" class="oef-cat__count" :title="participantCount[c.id] + ' peserta'">
              {{ participantCount[c.id] }}
            </span>
            <button type="button" class="oef-cat__x" title="Hapus kategori" @click="removeClass(c)">×</button>
          </span>
        </div>
      </div>

      <div v-if="orphanClasses.length" class="oef-type oef-type--orphan">
        <div class="oef-type__head">
          <span class="oef-muted">Tanpa Type ({{ orphanClasses.length }})</span>
        </div>
        <div class="oef-cats">
          <span v-for="c in orphanClasses" :key="c.id" class="oef-cat">
            {{ c.name }}
            <button type="button" class="oef-cat__x" title="Hapus kategori" @click="removeClass(c)">×</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Form Create/Edit Event Orienteering: info event + Type Event (bisa lebih
// dari satu, mis. National Event & World Ranking Event) + kategori per type
// (mis. "M20 Men", "M20 Women", "M21 Men", "M21 Women") lewat pembuat
// kategori (kelompok umur × gender) atau isian bebas.
// v-model = { name, date, location, types:[{id,name}], classes:[{id,name,typeId,controls}] }
import { uploadOne, MAX_UPLOAD_BYTES } from "@/utils/cloudinaryUpload";
import {
  PRESET_RACES,
  PRESET_EVENT_TYPES,
  PRESET_GENDERS,
  mergeCategoryNames,
  genderOfCategory,
  ageGroupsForType,
  buildCategoryNamesForType,
  isWorldRankingType,
} from "@/lib/orienteering";

let uid = 0;
const newId = (prefix) => `${prefix}${Date.now().toString(36)}${(uid++).toString(36)}`;

export default {
  name: "OriEventForm",
  props: {
    value: { type: Object, required: true },
    // { classId: jumlah peserta } — utk peringatan saat menghapus kategori
    participantCount: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      local: this.clone(this.value),
      newType: "",
      newRace: "",
      uploading: "", // "" | "image" | "logo"
      uploadField: "",
      uploadError: { image: "", logo: "" },
      imageSlots: [
        {
          field: "image",
          label: "Poster Event",
          short: "poster",
          icon: "mdi:image-outline",
          hint: "Tampil sbg cover kartu event. JPG/PNG/WebP, maks 5 MB, disarankan landscape 16:9.",
        },
        {
          field: "logo",
          label: "Logo Event",
          short: "logo",
          icon: "mdi:shield-star-outline",
          hint: "Tampil di kartu & header halaman event. Disarankan persegi (1:1), latar transparan/putih.",
        },
      ],
      presetRaces: PRESET_RACES,
      builders: {}, // typeId -> { ages:[], genders:[], custom:"" }
      presetTypes: PRESET_EVENT_TYPES,
      genders: PRESET_GENDERS,
    };
  },
  computed: {
    durationLabel() {
      const a = this.local.startDate;
      const b = this.local.endDate || a;
      if (!a) return "";
      const days = Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
      return days > 0 ? `${days} hari` : "";
    },
    customRaces() {
      const presets = PRESET_RACES.map((n) => n.toUpperCase());
      return this.local.races.filter((r) => !presets.includes(r.name.toUpperCase()));
    },
    orphanClasses() {
      const ids = new Set(this.local.types.map((t) => t.id));
      return this.local.classes.filter((c) => !ids.has(c.typeId));
    },
  },
  watch: {
    // Start Date digeser melewati End Date -> End Date dikosongkan.
    "local.startDate"(v) {
      if (v && this.local.endDate && this.local.endDate < v) this.local.endDate = "";
    },
    // State pembuat kategori per type disiapkan DI SINI (bukan saat render).
    "local.types": {
      immediate: true,
      handler(types) {
        (types || []).forEach((t) => {
          if (!this.builders[t.id]) {
            this.$set(this.builders, t.id, { ages: [], genders: PRESET_GENDERS.slice(), custom: "" });
          }
        });
      },
    },
    local: {
      deep: true,
      handler(v) {
        this.$emit("input", this.clone(v));
      },
    },
    uploading(v) {
      this.$emit("uploading", !!v);
    },
  },
  methods: {
    hasImage(field) {
      return !!(this.local[field] && this.local[field].url);
    },
    pickImage(field) {
      this.uploadField = field;
      this.$refs.imageFile.click();
    },
    // Upload poster/logo ke Cloudinary begitu file dipilih.
    async onImageFile(e) {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      const field = this.uploadField;
      if (!file || !field) return;
      this.uploadError[field] = "";
      if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
        this.uploadError[field] = "Format harus JPG, PNG, atau WebP.";
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        this.uploadError[field] = "Ukuran gambar maksimal 5 MB.";
        return;
      }
      this.uploading = field;
      try {
        const res = await uploadOne(file, field === "logo" ? "orienteering/logos" : "orienteering/posters");
        if (!res || !res.ok || !res.result || !res.result.secure_url) {
          this.uploadError[field] = "Upload gagal" + (res && res.error ? `: ${res.error}` : " (cek koneksi internet).");
          return;
        }
        this.local[field] = {
          url: res.result.secure_url,
          publicId: res.result.public_id,
          width: res.result.width,
          height: res.result.height,
        };
      } catch (err) {
        this.uploadError[field] = "Upload gagal: " + ((err && err.message) || err);
      } finally {
        this.uploading = "";
      }
    },
    formatDate(v) {
      const d = new Date(v);
      return isNaN(d)
        ? v
        : d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    },
    clone(v) {
      const src = v || {};
      return {
        _id: src._id || "",
        name: src.name || "",
        image: src.image && src.image.url ? { ...src.image } : null,
        logo: src.logo && src.logo.url ? { ...src.logo } : null,
        // event lama cuma punya `date` -> dipakai sbg Start Date
        startDate: src.startDate || src.date || "",
        endDate: src.endDate || "",
        location: src.location || "",
        liveVisible: src.liveVisible !== false,
        races: (src.races || []).map((r) => ({ id: r.id, name: r.name, location: r.location || "" })),
        types: (src.types || []).map((t) => ({
          id: t.id,
          name: t.name,
          raceIds: Array.isArray(t.raceIds) ? t.raceIds.slice() : [], // [] = semua jenis
        })),
        classes: (src.classes || []).map((c) => ({
          id: c.id,
          name: c.name,
          typeId: c.typeId || "",
          // course per jenis ikut dibawa apa adanya (diedit di tab Kategori & Course)
          courses: c.courses && typeof c.courses === "object" ? JSON.parse(JSON.stringify(c.courses)) : {},
          controls: Array.isArray(c.controls) ? c.controls.slice() : [],
        })),
      };
    },
    builderOf(typeId) {
      return this.builders[typeId] || { ages: [], genders: [], custom: "" };
    },
    // raceIds kosong = semua jenis
    typeHasRace(t, raceId) {
      return !(t.raceIds || []).length || t.raceIds.includes(raceId);
    },
    typeRaceCount(t) {
      return this.local.races.filter((r) => this.typeHasRace(t, r.id)).length;
    },
    typeRaceNames(t) {
      return this.local.races.filter((r) => this.typeHasRace(t, r.id)).map((r) => r.name).join(" & ");
    },
    toggleTypeRace(t, raceId) {
      const all = this.local.races.map((r) => r.id);
      let set = all.filter((id) => this.typeHasRace(t, id));
      if (set.includes(raceId)) {
        if (set.length === 1) return; // minimal satu jenis
        set = set.filter((id) => id !== raceId);
      } else {
        set = set.concat(raceId);
      }
      this.$set(t, "raceIds", set.length === all.length ? [] : all.filter((id) => set.includes(id)));
    },
    classesOf(typeId) {
      return this.local.classes.filter((c) => c.typeId === typeId);
    },
    hasRace(name) {
      return this.local.races.some((r) => r.name.toUpperCase() === name.toUpperCase());
    },
    async toggleRace(name) {
      const r = this.local.races.find((x) => x.name.toUpperCase() === name.toUpperCase());
      if (r) await this.removeRace(r);
      else this.local.races.push({ id: newId("R"), name, location: "" });
    },
    addCustomRace() {
      const name = this.newRace.trim();
      if (name && !this.hasRace(name)) this.local.races.push({ id: newId("R"), name, location: "" });
      this.newRace = "";
    },
    async removeRace(r) {
      if (this.local._id && this.$bvModal) {
        const ok = await this.$bvModal.msgBoxConfirm(
          `Hapus jenis "${r.name}"? Course jenis ini ikut terhapus; start list & hasil bacanya tidak lagi tampil.`,
          { title: "Hapus Jenis", okTitle: "Hapus", cancelTitle: "Batal", okVariant: "danger", centered: true, size: "sm" }
        );
        if (!ok) return;
      }
      this.local.races = this.local.races.filter((x) => x.id !== r.id);
    },
    hasType(name) {
      return this.local.types.some((t) => t.name.toUpperCase() === name.toUpperCase());
    },
    toggleType(name) {
      const t = this.local.types.find((x) => x.name.toUpperCase() === name.toUpperCase());
      if (t) this.removeType(t);
      else this.local.types.push({ id: newId("T"), name, raceIds: [] });
    },
    addCustomType() {
      const name = this.newType.trim();
      if (!name || this.hasType(name)) {
        this.newType = "";
        return;
      }
      this.local.types.push({ id: newId("T"), name, raceIds: [] });
      this.newType = "";
    },
    async removeType(t) {
      const cats = this.classesOf(t.id);
      const used = cats.reduce((n, c) => n + (this.participantCount[c.id] || 0), 0);
      if (cats.length && this.$bvModal) {
        const ok = await this.$bvModal.msgBoxConfirm(
          `Hapus type "${t.name}" beserta ${cats.length} kategorinya?` +
            (used ? ` ${used} peserta di kategori tersebut perlu dipindah ke kategori lain.` : ""),
          { title: "Hapus Type", okTitle: "Hapus", cancelTitle: "Batal", okVariant: "danger", centered: true, size: "sm" }
        );
        if (!ok) return;
      }
      this.local.classes = this.local.classes.filter((c) => c.typeId !== t.id);
      this.local.types = this.local.types.filter((x) => x.id !== t.id);
    },
    toggleAge(typeId, age) {
      const b = this.builderOf(typeId);
      b.ages = b.ages.includes(age) ? b.ages.filter((a) => a !== age) : b.ages.concat(age);
    },
    toggleGender(typeId, g) {
      const b = this.builderOf(typeId);
      b.genders = b.genders.includes(g) ? b.genders.filter((x) => x !== g) : PRESET_GENDERS.filter((x) => x === g || b.genders.includes(x));
    },
    genderOf(name) {
      const g = genderOfCategory(name);
      return g === "Men" ? "M" : g === "Women" ? "W" : "";
    },
    isWorldRanking(t) {
      return isWorldRankingType(t.name);
    },
    ageGroupsOf(t) {
      return ageGroupsForType(t.name);
    },
    // M/W + umur (+ "E" kalau type World Ranking Event)
    previewOf(t) {
      const b = this.builderOf(t.id);
      const existing = this.classesOf(t.id).map((c) => c.name);
      return mergeCategoryNames(
        existing,
        buildCategoryNamesForType(t.name, b.ages, b.genders)
      ).slice(existing.length);
    },
    pushCategories(typeId, names) {
      names.forEach((name) => this.local.classes.push({ id: newId("C"), name, typeId, courses: {}, controls: [] }));
    },
    addGenerated(t) {
      this.pushCategories(t.id, this.previewOf(t));
      this.builderOf(t.id).ages = [];
    },
    addCustomCategory(typeId) {
      const b = this.builderOf(typeId);
      const existing = this.classesOf(typeId).map((c) => c.name);
      this.pushCategories(typeId, mergeCategoryNames(existing, [b.custom]).slice(existing.length));
      b.custom = "";
    },
    async removeClass(c) {
      const n = this.participantCount[c.id] || 0;
      if (n && this.$bvModal) {
        const ok = await this.$bvModal.msgBoxConfirm(
          `Kategori "${c.name}" dipakai ${n} peserta. Hapus? (Peserta tetap ada, tapi perlu dipindah ke kategori lain.)`,
          { title: "Hapus Kategori", okTitle: "Hapus", cancelTitle: "Batal", okVariant: "danger", centered: true, size: "sm" }
        );
        if (!ok) return;
      }
      this.local.classes = this.local.classes.filter((x) => x.id !== c.id);
    },
  },
};
</script>

<style scoped>
.oef-section + .oef-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #eef2f7;
}
.oef-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 10px;
}
.oef-muted {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 500;
}
.oef-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}
.oef-live {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 2px 0 12px;
  padding: 10px 14px;
  border: 1px solid #e6edf6;
  border-radius: 12px;
  background: #f8fbff;
  cursor: pointer;
}
.oef-live b {
  display: block;
  color: #0f172a;
  font-size: 0.9rem;
}
.oef-live small {
  color: #64748b;
}
.oef-images {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}
.oef-image {
  display: flex;
  gap: 14px;
  align-items: stretch;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 10px;
  background: #fbfdff;
}
.oef-image.is-logo .oef-image__preview {
  width: 110px;
  aspect-ratio: 1 / 1;
  background: #fff;
}
.oef-image.is-logo .oef-image__preview img {
  object-fit: contain;
  padding: 6px;
}
.oef-image__preview {
  position: relative;
  flex: none;
  width: 220px;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #e6f0fa, #f5faff);
  border: 1px dashed #b9d4ee;
}
.oef-image.has-image .oef-image__preview {
  border-style: solid;
  border-color: #e6edf6;
}
.oef-image__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.oef-image__empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #7f97b2;
  font-size: 0.82rem;
  font-weight: 600;
}
.oef-image__empty svg {
  font-size: 28px;
}
.oef-image__busy {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.82);
  font-size: 0.85rem;
  font-weight: 700;
  color: #1c4c7a;
}
.oef-image__side {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.oef-date-value {
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
.oef-date-value.is-empty {
  background: #f1f5f9;
  color: #64748b;
  font-weight: 600;
}
.stx-inline-calendar {
  border: 1px solid #e6edf6;
  border-radius: 12px;
  padding: 8px;
  background: #fff;
}
.oef-duration {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1c4c7a;
  margin: 0;
}
.oef-type-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.oef-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #dde6f1;
  background: #fff;
  color: #334155;
  font-weight: 700;
  font-size: 0.88rem;
  padding: 7px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.oef-toggle.on {
  border-color: #1c4c7a;
  background: #e6f4fd;
  color: #1c4c7a;
}
.oef-inline-add {
  display: flex;
  gap: 6px;
  align-items: center;
}
.oef-empty {
  font-size: 0.86rem;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #d6e0ec;
  border-radius: 10px;
  padding: 10px 12px;
  margin: 0;
}
.oef-type {
  border: 1px solid #e6edf6;
  border-radius: 12px;
  padding: 12px;
  background: #fbfdff;
  margin-top: 10px;
}
.oef-type__races {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 2px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.oef-chip--race {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.oef-type--orphan {
  background: #fffbeb;
  border-color: #fde68a;
}
.oef-type__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.oef-type__badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  flex: none;
}
.oef-type__name {
  max-width: 260px;
  font-weight: 700;
}
.oef-builder {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.oef-builder__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.oef-builder__label {
  width: 110px;
  flex: none;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}
.oef-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.oef-chip {
  border: 1px solid #dde6f1;
  background: #fff;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 8px;
  cursor: pointer;
}
.oef-chip.on {
  background: #1c4c7a;
  border-color: #1c4c7a;
  color: #fff;
}
.oef-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.oef-cat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 3px 4px 3px 10px;
  border-radius: 999px;
  background: #eef4fb;
  color: #1c4c7a;
  border: 1px solid #d6e4f3;
}
.oef-races {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.oef-race {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #d1fae5;
  background: #f0fdf9;
  border-radius: 10px;
  padding: 8px 10px;
}
.oef-race__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 170px;
  font-weight: 800;
  color: #047857;
}
.oef-race__loc {
  max-width: 420px;
}
.oef-cat__g {
  font-size: 10px;
  font-weight: 800;
  border-radius: 4px;
  padding: 0 4px;
  color: #fff;
}
.oef-cat__g.is-M {
  background: #2563eb;
}
.oef-cat__g.is-W {
  background: #db2777;
}
.oef-cat__count {
  font-size: 10.5px;
  background: #1c4c7a;
  color: #fff;
  border-radius: 999px;
  padding: 0 6px;
}
.oef-cat__x {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 15px;
  line-height: 1;
  padding: 0 5px;
  border-radius: 999px;
  cursor: pointer;
}
.oef-cat__x:hover {
  background: #fee2e2;
  color: #b91c1c;
}
.oef-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #dde6f1;
  background: #fff;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 9px;
  cursor: pointer;
  white-space: nowrap;
}
.oef-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.oef-btn--primary {
  background: linear-gradient(135deg, #1c4c7a, #2b7fc0);
  color: #fff;
  border-color: transparent;
}
.oef-icon-btn {
  border: 1px solid #dde6f1;
  background: #fff;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.oef-icon-btn--danger {
  color: #b91c3c;
  border-color: #f5d0d8;
}
</style>
