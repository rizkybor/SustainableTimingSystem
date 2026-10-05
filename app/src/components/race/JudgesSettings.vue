<template>
  <b-modal
    :id="id"
    v-model="localShow"
    centered
    size="xl"
    body-class="p-0 jsm-body"
    header-class="p-0 border-0"
    footer-class="jsm-footer"
    content-class="jsm-content"
    scrollable
  >
    <!-- Header -->
    <template #modal-header>
      <div class="jsm-head">
        <div class="jsm-head__bg"></div>
        <button type="button" class="jsm-close" aria-label="Close" @click="close">
          <Icon icon="mdi:close" />
        </button>
        <div class="jsm-head__inner">
          <span class="jsm-head__icon"><Icon icon="mdi:gavel" /></span>
          <div class="jsm-head__text">
            <span class="jsm-eyebrow">Judges Configuration</span>
            <h5 class="jsm-title">{{ eventName || "Penugasan Juri" }}</h5>
            <p class="jsm-sub">Tetapkan juri untuk setiap posisi di tiap nomor lomba.</p>
          </div>
          <div v-if="!loading && assignmentSummary.total" class="jsm-head__summary">
            <span class="jsm-summary__value">
              {{ assignmentSummary.done }}<small>/{{ assignmentSummary.total }}</small>
            </span>
            <span class="jsm-summary__label">posisi terisi</span>
            <div class="jsm-summary__bar">
              <span :style="{ width: assignmentSummary.percent + '%' }"></span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Body -->
    <div v-if="!loading" class="jsm-wrap">
      <!-- Panel kategori (Sprint/H2H/Slalom/DRR/RX) — flex column supaya
           urutan tampilnya bisa diatur lewat CSS `order` (lihat
           categoryOrder()): ikut urutan array Event Categories di Event
           Settings, bukan selalu Sprint→H2H→Slalom→DRR→RX. -->
      <div class="rs-category-panels">
        <!-- SPRINT -->
        <section class="jsm-cat" v-if="showSprint" :style="{ order: categoryOrder('SPRINT') }">
          <header class="jsm-cat__head" @click="toggleSection('sprint')">
            <img :src="raceIcons.SPRINT" alt="" class="jsm-cat__icon" />
            <div class="jsm-cat__titles">
              <div class="jsm-cat__title">Sprint</div>
              <div class="jsm-cat__desc">Juri Start &amp; Finish</div>
            </div>
            <span class="jsm-count" :class="countTone(categoryFill.sprint)">
              {{ categoryFill.sprint.done }}/{{ categoryFill.sprint.total }} terisi
            </span>
            <Icon icon="mdi:chevron-down" class="jsm-chev" :class="{ 'is-collapsed': collapsedSections.sprint }" />
          </header>
          <div v-show="!collapsedSections.sprint" class="jsm-cat__body">
            <div class="jsm-group">Start &amp; Finish</div>
            <div class="jsm-grid jsm-grid--2">
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-variant-outline" /> Jury Start</label>
                <SearchableSelect
                  v-model="draft.sprint.juryStart"
                  @input="hasLocalEdits = true"
                  :options="selectOptions"
                  placeholder="Select jury name"
                  search-placeholder="Search jury…"
                  :clearable="true"
                  :show-empty-option="false"
                />
              </div>
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-checkered" /> Jury Finish</label>
                <SearchableSelect
                  v-model="draft.sprint.juryFinish"
                  @input="hasLocalEdits = true"
                  :options="selectOptions"
                  placeholder="Select jury name"
                  search-placeholder="Search jury…"
                  :clearable="true"
                  :show-empty-option="false"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- HEAD TO HEAD -->
        <section class="jsm-cat" v-if="showH2H" :style="{ order: categoryOrder('HEAD2HEAD') }">
          <header class="jsm-cat__head" @click="toggleSection('h2h')">
            <img :src="raceIcons.HEAD2HEAD" alt="" class="jsm-cat__icon" />
            <div class="jsm-cat__titles">
              <div class="jsm-cat__title">Head to Head</div>
              <div class="jsm-cat__desc">Juri Start &amp; Finish + Bouyan</div>
            </div>
            <span class="jsm-count" :class="countTone(categoryFill.h2h)">
              {{ categoryFill.h2h.done }}/{{ categoryFill.h2h.total }} terisi
            </span>
            <Icon icon="mdi:chevron-down" class="jsm-chev" :class="{ 'is-collapsed': collapsedSections.h2h }" />
          </header>
          <div v-show="!collapsedSections.h2h" class="jsm-cat__body">
            <div class="jsm-group">Start &amp; Finish</div>
            <div class="jsm-grid jsm-grid--2">
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-variant-outline" /> Jury Start</label>
                <SearchableSelect
                  v-model="draft.h2h.juryStart"
                  @input="hasLocalEdits = true"
                  :options="selectOptions"
                  placeholder="Select jury name"
                  search-placeholder="Search jury…"
                  :clearable="true"
                  :show-empty-option="false"
                />
              </div>
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-checkered" /> Jury Finish</label>
                <SearchableSelect
                  v-model="draft.h2h.juryFinish"
                  @input="hasLocalEdits = true"
                  :options="selectOptions"
                  placeholder="Select jury name"
                  search-placeholder="Search jury…"
                  :clearable="true"
                  :show-empty-option="false"
                />
              </div>
            </div>
            <template v-if="enabledBouyanKeys.length">
              <div class="jsm-group">Posisi Bouyan</div>
              <div class="jsm-grid jsm-grid--4">
                <div class="jsm-field" v-for="key in enabledBouyanKeys" :key="key">
                  <label class="jsm-label"><Icon icon="mdi:map-marker-radius-outline" /> Bouyan {{ key }}</label>
                  <SearchableSelect
                    v-model="draft.h2hValues[key]"
                    @input="hasLocalEdits = true"
                    :options="selectOptions"
                    placeholder="Select jury name"
                    search-placeholder="Search jury…"
                    :clearable="true"
                    :show-empty-option="false"
                  />
                </div>
              </div>
            </template>
          </div>
        </section>

        <!-- SLALOM -->
        <section class="jsm-cat" v-if="showSlalom" :style="{ order: categoryOrder('SLALOM') }">
          <header class="jsm-cat__head" @click="toggleSection('slalom')">
            <img :src="raceIcons.SLALOM" alt="" class="jsm-cat__icon" />
            <div class="jsm-cat__titles">
              <div class="jsm-cat__title">Slalom</div>
              <div class="jsm-cat__desc">Juri Start &amp; Finish + {{ gatesCount }} Gate</div>
            </div>
            <span class="jsm-count" :class="countTone(categoryFill.slalom)">
              {{ categoryFill.slalom.done }}/{{ categoryFill.slalom.total }} terisi
            </span>
            <Icon icon="mdi:chevron-down" class="jsm-chev" :class="{ 'is-collapsed': collapsedSections.slalom }" />
          </header>
          <div v-show="!collapsedSections.slalom" class="jsm-cat__body">
            <div class="jsm-group">Start &amp; Finish</div>
            <div class="jsm-grid jsm-grid--2">
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-variant-outline" /> Jury Start</label>
                <SearchableSelect
                  v-model="draft.slalom.juryStart"
                  @input="hasLocalEdits = true"
                  :options="selectOptions"
                  placeholder="Select jury name"
                  search-placeholder="Search jury…"
                  :clearable="true"
                  :show-empty-option="false"
                />
              </div>
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-checkered" /> Jury Finish</label>
                <SearchableSelect
                  v-model="draft.slalom.juryFinish"
                  @input="hasLocalEdits = true"
                  :options="selectOptions"
                  placeholder="Select jury name"
                  search-placeholder="Search jury…"
                  :clearable="true"
                  :show-empty-option="false"
                />
              </div>
            </div>
            <template v-if="gatesCount">
              <div class="jsm-group">Posisi Gate</div>
              <div class="jsm-grid jsm-grid--4">
                <div class="jsm-field" v-for="n in gatesCount" :key="'gate-' + n">
                  <label class="jsm-label"><Icon icon="mdi:gate" /> Gate {{ n }}</label>
                  <SearchableSelect
                    :key="
                      'gate-' +
                      n +
                      '-' +
                      (draft.slalom.gates && draft.slalom.gates[n]
                        ? String(draft.slalom.gates[n])
                        : '')
                    "
                    :value="getGateValue(n)"
                    @input="onGateInput(n, $event)"
                    @change="onGateInput(n, $event)"
                    @clear="onGateClear(n)"
                    :options="selectOptions"
                    placeholder="Select jury name"
                    search-placeholder="Search jury…"
                    :clearable="true"
                    :show-empty-option="false"
                  />
                </div>
              </div>
            </template>
          </div>
        </section>

        <!-- RAFTING CROSS -->
        <section class="jsm-cat" v-if="showRx" :style="{ order: categoryOrder('RX') }">
          <header class="jsm-cat__head" @click="toggleSection('rx')">
            <img :src="raceIcons.RX" alt="" class="jsm-cat__icon" />
            <div class="jsm-cat__titles">
              <div class="jsm-cat__title">Rafting Cross</div>
              <div class="jsm-cat__desc">Juri Start &amp; Finish + Gate</div>
            </div>
            <span class="jsm-count" :class="countTone(categoryFill.rx)">
              {{ categoryFill.rx.done }}/{{ categoryFill.rx.total }} terisi
            </span>
            <Icon icon="mdi:chevron-down" class="jsm-chev" :class="{ 'is-collapsed': collapsedSections.rx }" />
          </header>
          <div v-show="!collapsedSections.rx" class="jsm-cat__body">
            <div class="jsm-group">Start &amp; Finish</div>
            <div class="jsm-grid jsm-grid--2">
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-variant-outline" /> Jury Start</label>
                <SearchableSelect
                  v-model="draft.rx.juryStart"
                  @input="hasLocalEdits = true"
                  :options="selectOptions"
                  placeholder="Select jury name"
                  search-placeholder="Search jury…"
                  :clearable="true"
                  :show-empty-option="false"
                />
              </div>
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-checkered" /> Jury Finish</label>
                <SearchableSelect
                  v-model="draft.rx.juryFinish"
                  @input="hasLocalEdits = true"
                  :options="selectOptions"
                  placeholder="Select jury name"
                  search-placeholder="Search jury…"
                  :clearable="true"
                  :show-empty-option="false"
                />
              </div>
            </div>
            <template v-if="enabledRxGateKeys.length">
              <div class="jsm-group">Posisi Gate</div>
              <div class="jsm-grid jsm-grid--4">
                <div class="jsm-field" v-for="key in enabledRxGateKeys" :key="key">
                  <label class="jsm-label"><Icon icon="mdi:gate" /> {{ rxGateLabel(key) }}</label>
                  <SearchableSelect
                    v-model="draft.rxValues[key]"
                    @input="hasLocalEdits = true"
                    :options="selectOptions"
                    placeholder="Select jury name"
                    search-placeholder="Search jury…"
                    :clearable="true"
                    :show-empty-option="false"
                  />
                </div>
              </div>
            </template>
          </div>
        </section>

        <!-- DOWN RIVER RACE -->
        <section class="jsm-cat" v-if="showDrr" :style="{ order: categoryOrder('DRR') }">
          <header class="jsm-cat__head" @click="toggleSection('drr')">
            <img :src="raceIcons.DRR" alt="" class="jsm-cat__icon" />
            <div class="jsm-cat__titles">
              <div class="jsm-cat__title">Down River Race</div>
              <div class="jsm-cat__desc">Juri Start &amp; Finish + {{ sectionsCount }} Section</div>
            </div>
            <span class="jsm-count" :class="countTone(categoryFill.drr)">
              {{ categoryFill.drr.done }}/{{ categoryFill.drr.total }} terisi
            </span>
            <Icon icon="mdi:chevron-down" class="jsm-chev" :class="{ 'is-collapsed': collapsedSections.drr }" />
          </header>
          <div v-show="!collapsedSections.drr" class="jsm-cat__body">
            <div class="jsm-group">Start &amp; Finish</div>
            <div class="jsm-grid jsm-grid--2">
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-variant-outline" /> Jury Start</label>
                <b-form-select
                  class="rs-select"
                  :disabled="saving"
                  :options="resolvedJuryOptions"
                  v-model="draft.drr.juryStart"
                  @change="hasLocalEdits = true"
                />
              </div>
              <div class="jsm-field">
                <label class="jsm-label"><Icon icon="mdi:flag-checkered" /> Jury Finish</label>
                <b-form-select
                  class="rs-select"
                  :disabled="saving"
                  :options="resolvedJuryOptions"
                  v-model="draft.drr.juryFinish"
                  @change="hasLocalEdits = true"
                />
              </div>
            </div>
            <template v-if="sectionsCount">
              <div class="jsm-group">Posisi Section</div>
              <div class="jsm-grid jsm-grid--4">
                <div class="jsm-field" v-for="n in sectionsCount" :key="'section-' + n">
                  <label class="jsm-label"><Icon icon="mdi:map-marker-path" /> Section {{ n }}</label>
                  <SearchableSelect
                    :key="
                      'section-' +
                      n +
                      '-' +
                      (draft.drr.sections && draft.drr.sections[n]
                        ? String(draft.drr.sections[n])
                        : '')
                    "
                    :value="getSectionValue(n)"
                    @input="onSectionInput(n, $event)"
                    @change="onSectionInput(n, $event)"
                    @clear="onSectionClear(n)"
                    :options="selectOptions"
                    placeholder="Select jury name"
                    search-placeholder="Search jury…"
                    :clearable="true"
                    :show-empty-option="false"
                  />
                </div>
              </div>
            </template>
          </div>
        </section>
      </div>

      <div
        v-if="!showSprint && !showH2H && !showSlalom && !showDrr && !showRx"
        class="jsm-empty"
      >
        <Icon icon="mdi:clipboard-alert-outline" width="34" height="34" />
        <div>
          Belum ada Race Category yang dipilih untuk event ini. Atur dulu di
          Event Settings.
        </div>
      </div>
    </div>

    <div v-else class="jsm-loading">
      <b-spinner small class="mr-2" /> Memuat konfigurasi juri…
    </div>

    <!-- Footer (menempel di bawah modal) -->
    <template #modal-footer>
      <div class="jsm-foot">
        <span class="jsm-foot__hint">
          <Icon icon="mdi:information-outline" />
          Perubahan baru tersimpan setelah klik Update.
        </span>
        <div class="jsm-foot__actions">
          <button type="button" class="jsm-btn jsm-btn--ghost" :disabled="saving" @click="close">
            Cancel
          </button>
          <button type="button" class="jsm-btn jsm-btn--primary" :disabled="saving || loading" @click="confirm">
            <b-spinner v-if="saving" small />
            <Icon v-else icon="mdi:content-save-outline" />
            {{ saving ? "Saving…" : "Update" }}
          </button>
        </div>
      </div>
    </template>
  </b-modal>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import SearchableSelect from "@/components/SearchableSelect.vue";
import { loadEnabledCategoryKeys } from "@/utils/eventCategories";
import sprintPng from "@/assets/images/Rectangle-3.png";
import h2hPng from "@/assets/images/Rectangle-4.png";
import slalomPng from "@/assets/images/Rectangle-4-1.png";
import drrPng from "@/assets/images/Rectangle-4-2.png";
import rxPng from "@/assets/images/Rectangle-5.png";

// Ikon nomor lomba di header tiap kartu kategori (gambar yg sama dgn kartu
// Race Categories di Event Detail).
const RACE_ICONS = {
  SPRINT: sprintPng,
  HEAD2HEAD: h2hPng,
  SLALOM: slalomPng,
  DRR: drrPng,
  RX: rxPng,
};

function isFilled(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

/* ========= helpers ========= */
function pickId(u) {
  if (!u) return "";
  if (u.email && String(u.email).trim() !== "") return String(u.email).trim(); // utamakan email
  if (typeof u.idUser !== "undefined" && u.idUser !== null && u.idUser !== "")
    return String(u.idUser);
  if (typeof u.id !== "undefined" && u.id !== null && u.id !== "")
    return String(u.id);
  if (u._id && typeof u._id === "string") return u._id;
  if (u._id && typeof u._id === "object" && u._id.$oid) return u._id.$oid;
  return "";
}

function normalizeUsersToOptions(arr) {
  var out = [];
  if (!Array.isArray(arr)) return out;
  for (var i = 0; i < arr.length; i++) {
    var u = arr[i];
    out.push({
      value: pickId(u), // yang disimpan di v-model
      text: u && u.username ? u.username : u && u.email ? u.email : "Unknown",
      email: u && u.email ? u.email : "",
      username: u && u.username ? u.username : "",
    });
  }
  return out;
}

/* ========= pure helpers ========= */
function mergeWithDefaults(incoming) {
  var src = incoming && typeof incoming === "object" ? incoming : {};

  var fR1 = src.h2h && typeof src.h2h.R1 !== "undefined" ? !!src.h2h.R1 : false;
  var fR2 = src.h2h && typeof src.h2h.R2 !== "undefined" ? !!src.h2h.R2 : false;
  var fL1 = src.h2h && typeof src.h2h.L1 !== "undefined" ? !!src.h2h.L1 : false;
  var fL2 = src.h2h && typeof src.h2h.L2 !== "undefined" ? !!src.h2h.L2 : false;

  var hv =
    src.h2hValues && typeof src.h2hValues === "object" ? src.h2hValues : {};

  var fGate1 =
    src.rx && src.rx.gate1 && typeof src.rx.gate1.enabled !== "undefined"
      ? !!src.rx.gate1.enabled
      : false;
  var fGate2 =
    src.rx && src.rx.gate2 && typeof src.rx.gate2.enabled !== "undefined"
      ? !!src.rx.gate2.enabled
      : false;

  var rv =
    src.rxValues && typeof src.rxValues === "object" ? src.rxValues : {};

  var totalGate = src.slalom && src.slalom.totalGate ? src.slalom.totalGate : 1;
  var totalSection = src.drr && src.drr.totalSection ? src.drr.totalSection : 1;

  return {
    sprint: {
      juryStart: src.sprint && src.sprint.juryStart ? src.sprint.juryStart : "",
      juryFinish:
        src.sprint && src.sprint.juryFinish ? src.sprint.juryFinish : "",
    },
    h2h: {
      juryStart: src.h2h && src.h2h.juryStart ? src.h2h.juryStart : "",
      juryFinish: src.h2h && src.h2h.juryFinish ? src.h2h.juryFinish : "",
    },
    h2hFlags: { R1: fR1, R2: fR2, L1: fL1, L2: fL2 },
    h2hValues: {
      R1: hv.R1 ? hv.R1 : "",
      R2: hv.R2 ? hv.R2 : "",
      L1: hv.L1 ? hv.L1 : "",
      L2: hv.L2 ? hv.L2 : "",
    },
    rx: {
      juryStart: src.rx && src.rx.juryStart ? src.rx.juryStart : "",
      juryFinish: src.rx && src.rx.juryFinish ? src.rx.juryFinish : "",
    },
    rxFlags: { gate1: fGate1, gate2: fGate2 },
    rxValues: {
      gate1: rv.gate1 ? rv.gate1 : "",
      gate2: rv.gate2 ? rv.gate2 : "",
    },
    slalom: {
      juryStart: src.slalom && src.slalom.juryStart ? src.slalom.juryStart : "",
      juryFinish:
        src.slalom && src.slalom.juryFinish ? src.slalom.juryFinish : "",
      totalGate: totalGate,
      gates: src.slalom && src.slalom.gates ? src.slalom.gates : {},
    },
    drr: {
      juryStart: src.drr && src.drr.juryStart ? src.drr.juryStart : "",
      juryFinish: src.drr && src.drr.juryFinish ? src.drr.juryFinish : "",
      totalSection: totalSection,
      sections: src.drr && src.drr.sections ? src.drr.sections : {},
    },
  };
}

function toStrId(v) {
  // normalisasi id jadi string aman
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    if (v.$oid) return String(v.$oid);
    if (v.oid) return String(v.oid);
    if (v._id && v._id.$oid) return String(v._id.$oid);
  }
  return String(v);
}

function userHasEvent(user, eventId) {
  if (!user || !Array.isArray(user.mainEvents) || !eventId) return false;
  const target = toStrId(eventId);
  for (let i = 0; i < user.mainEvents.length; i++) {
    const ev = toStrId(user.mainEvents[i]);
    if (ev && ev === target) return true;
  }
  return false;
}

export default {
  name: "JudgesSettings",
  components: { SearchableSelect, Icon },
  props: {
    id: { type: String, default: "judges-settings-modal" },
    value: { type: Boolean, default: false },
    settings: {
      type: Object,
      default: function () {
        return {};
      },
    },
    maxGate: { type: Number, default: 8 },
    maxSection: { type: Number, default: 4 },
    eventId: { type: String, default: "" },
    eventName: { type: String, default: "" },
    // BUG FIX (2026-10-05): sama pola dgn RaceSettings.vue — opsional,
    // categoriesEvent event ini kalau parent SUDAH punya di memory, dipakai
    // langsung (sinkron) menghindari race channel "get-events-byid-reply"
    // yang dipakai bersama banyak komponen lain.
    categoriesEvent: { type: Array, default: null },
  },

  data: function () {
    return {
      hasLocalEdits: false,
      localShow: this.value,
      loading: false,
      saving: false,
      internalJuryOptions: [],
      draft: mergeWithDefaults(this.settings),
      juryOptions: {
        type: Array,
        default: function () {
          return [];
        },
      },
      usersRaw: [],
      previousAssignedEmails: [],
      assignedInfoMap: {},
      // null = belum dimuat/gagal dimuat -> fail-open (tampilkan semua
      // kategori) supaya kegagalan fetch tidak diam-diam menyembunyikan
      // konfigurasi yang valid.
      enabledCategoryKeys: null,
      // per-kategori: true = konten config-nya sedang disembunyikan
      // (chevron kanan). Default SEMUA true (tersembunyi) — beda dari
      // Race Settings yang default terbuka — supaya modal ini tidak
      // langsung penuh saat dibuka.
      raceIcons: RACE_ICONS,
      collapsedSections: {
        sprint: true,
        h2h: true,
        slalom: true,
        rx: true,
        drr: true,
      },
    };
  },

  computed: {
    // Jumlah posisi juri yang sudah terisi per kategori (badge "x/y terisi").
    categoryFill: function () {
      const d = this.draft || {};
      const count = (vals) => ({
        done: vals.filter(isFilled).length,
        total: vals.length,
      });
      const range = (n) => Array.from({ length: Number(n) || 0 }, (_, i) => i + 1);
      return {
        sprint: count([d.sprint && d.sprint.juryStart, d.sprint && d.sprint.juryFinish]),
        h2h: count(
          [d.h2h && d.h2h.juryStart, d.h2h && d.h2h.juryFinish].concat(
            (this.enabledBouyanKeys || []).map((k) => d.h2hValues && d.h2hValues[k])
          )
        ),
        slalom: count(
          [d.slalom && d.slalom.juryStart, d.slalom && d.slalom.juryFinish].concat(
            range(this.gatesCount).map((n) => this.getGateValue(n))
          )
        ),
        rx: count(
          [d.rx && d.rx.juryStart, d.rx && d.rx.juryFinish].concat(
            (this.enabledRxGateKeys || []).map((k) => d.rxValues && d.rxValues[k])
          )
        ),
        drr: count(
          [d.drr && d.drr.juryStart, d.drr && d.drr.juryFinish].concat(
            range(this.sectionsCount).map((n) => this.getSectionValue(n))
          )
        ),
      };
    },
    // Ringkasan total di header — cuma kategori yang tampil di event ini.
    assignmentSummary: function () {
      const f = this.categoryFill;
      const parts = [
        this.showSprint && f.sprint,
        this.showH2H && f.h2h,
        this.showSlalom && f.slalom,
        this.showRx && f.rx,
        this.showDrr && f.drr,
      ].filter(Boolean);
      const done = parts.reduce((n, p) => n + p.done, 0);
      const total = parts.reduce((n, p) => n + p.total, 0);
      return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
    },
    showSprint: function () {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("SPRINT");
    },
    showH2H: function () {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("HEAD2HEAD");
    },
    showSlalom: function () {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("SLALOM");
    },
    showDrr: function () {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("DRR");
    },
    showRx: function () {
      return !this.enabledCategoryKeys || this.enabledCategoryKeys.has("RX");
    },
    // opsi untuk semua dropdown juri
    selectOptions: function () {
      var arr = Array.isArray(this.usersRaw) ? this.usersRaw : [];
      var out = [{ value: "", text: "Select Jury Name" }];
      for (var i = 0; i < arr.length; i++) {
        var u = arr[i];
        var id = pickId(u);
        var text = "Unknown";
        if (u && u.username) text = u.username;
        else if (u && u.email) text = u.email;

        out.push({ value: id, text: text, disabled: false });
      }
      return out;
    },
    // tampilkan hanya bouyan yang enabled (true) dari race-settings
    enabledBouyanKeys: function () {
      var out = [];
      var flags = this.draft && this.draft.h2hFlags ? this.draft.h2hFlags : {};
      var keys = ["R1", "R2", "L1", "L2"];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (flags[k] === true) out.push(k);
      }
      return out;
    },
    // tampilkan hanya gate RX yang enabled (true) dari race-settings
    enabledRxGateKeys: function () {
      var out = [];
      var flags = this.draft && this.draft.rxFlags ? this.draft.rxFlags : {};
      var keys = ["gate1", "gate2"];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (flags[k] === true) out.push(k);
      }
      return out;
    },
    // jumlah gate/section mengikuti angka dari draft (fallback 1)
    gatesCount: function () {
      var n =
        this.draft && this.draft.slalom && this.draft.slalom.totalGate
          ? this.draft.slalom.totalGate
          : 0;
      return n > 0 ? n : 1;
    },
    sectionsCount: function () {
      var n =
        this.draft && this.draft.drr && this.draft.drr.totalSection
          ? this.draft.drr.totalSection
          : 0;
      return n > 0 ? n : 1;
    },
    // opsi akhir untuk select
    resolvedJuryOptions: function () {
      if (
        Array.isArray(this.internalJuryOptions) &&
        this.internalJuryOptions.length > 0
      ) {
        var base = [{ value: "", text: "Select jury name" }];
        return base.concat(this.internalJuryOptions);
      }
      return [{ value: "", text: "Select jury name" }];
    },
  },

  watch: {
    gatesCount: function () {
      this.ensureDraftContainers();
    },
    sectionsCount: function () {
      this.ensureDraftContainers();
    },
    value: function (v) {
      this.localShow = v;
      if (v) {
        // setiap kali modal dibuka ulang, mulai dari kondisi bersih supaya
        // prefill dari backend (race-settings & assignments) tidak pernah
        // terus-menerus terblokir oleh edit lokal dari sesi sebelumnya
        this.hasLocalEdits = false;
        this.loading = true;
        this.fetchSettingsIPC();
        this.fetchUsers();
        this.fetchAssignmentsByUserIPC();
        this.fetchEnabledCategories();
        // this.fetchAssignmentsIPC();
      }
    },
    localShow: function (v) {
      this.$emit("input", v);
    },
    settings: {
      deep: true,
      handler: function (newVal) {
        if (!this.localShow) this.draft = mergeWithDefaults(newVal);
      },
    },
    categoriesEvent: function () {
      this.fetchEnabledCategories();
    },
  },

  mounted: function () {
    if (this.eventId) {
      this.fetchSettingsIPC();
      this.fetchEnabledCategories();
    }
    if (!(Array.isArray(this.juryOptions) && this.juryOptions.length > 0)) {
      this.fetchUsers();
    } else {
      // kalau parent sudah kirim list user, normalisasi juga
      this.internalJuryOptions = normalizeUsersToOptions(this.juryOptions);
    }
  },

  methods: {
    countTone: function (fill) {
      if (!fill || !fill.total) return "is-empty";
      if (fill.done === fill.total) return "is-full";
      return fill.done ? "is-partial" : "is-empty";
    },
    toggleSection: function (key) {
      this.$set(this.collapsedSections, key, !this.collapsedSections[key]);
    },
    fetchEnabledCategories: async function () {
      if (Array.isArray(this.categoriesEvent) && this.categoriesEvent.length) {
        this.enabledCategoryKeys = new Set(
          this.categoriesEvent.map(function (c) {
            return String((c && c.name) || "").toUpperCase();
          })
        );
        return;
      }
      this.enabledCategoryKeys = await loadEnabledCategoryKeys(this.eventId);
    },
    // FITUR (2026-10-05, atas permintaan user): urutan tampil panel
    // kategori ikut urutan array `categoriesEvent` di Event Settings —
    // sama persis dgn categoryOrder() di RaceSettings.vue. Urutan insersi
    // Set JS (enabledCategoryKeys) mengikuti urutan array sumbernya.
    categoryOrder: function (key) {
      var DEFAULT_ORDER = { SPRINT: 0, HEAD2HEAD: 1, SLALOM: 2, DRR: 3, RX: 4 };
      if (!this.enabledCategoryKeys) {
        return DEFAULT_ORDER[key] != null ? DEFAULT_ORDER[key] : 99;
      }
      var idx = Array.from(this.enabledCategoryKeys).indexOf(key);
      return idx === -1 ? 99 : idx;
    },
    getSectionValue: function (n) {
      var s = "";
      if (
        this.draft &&
        this.draft.drr &&
        this.draft.drr.sections &&
        this.draft.drr.sections.hasOwnProperty(n)
      ) {
        s = this.draft.drr.sections[n];
      }
      return s ? String(s) : "";
    },
    onSectionInput: function (n, val) {
      var v = this.normalizeOptionValue(val);
      this.$set(this.draft.drr.sections, n, v);
      this.hasLocalEdits = true;
    },
    onSectionClear: function (n) {
      this.$set(this.draft.drr.sections, n, "");
    },
    // normalisasi aman (string-kan value apapun)
    normalizeOptionValue: function (val) {
      if (val && typeof val === "object" && val.hasOwnProperty("value")) {
        return String(val.value == null ? "" : val.value);
      }
      if (val == null) return "";
      return String(val);
    },

    // SLALOM getter/setter
    getGateValue: function (n) {
      var g = "";
      if (
        this.draft &&
        this.draft.slalom &&
        this.draft.slalom.gates &&
        this.draft.slalom.gates.hasOwnProperty(n)
      ) {
        g = this.draft.slalom.gates[n];
      }
      return g ? String(g) : "";
    },
    onGateInput: function (n, val) {
      var v = this.normalizeOptionValue(val);
      this.$set(this.draft.slalom.gates, n, v);
      this.hasLocalEdits = true;
    },
    onGateClear: function (n) {
      this.$set(this.draft.slalom.gates, n, "");
    },
    /* ===== utils dasar ===== */
    getAllEmailsForUpsert: function () {
      var curr = this.collectAllEmailsForUpdate(); // dari draft saat ini
      var prev = Array.isArray(this.previousAssignedEmails)
        ? this.previousAssignedEmails
        : [];
      var set = {};
      var out = [];
      for (var i = 0; i < curr.length; i++) {
        var e1 = String(curr[i]).toLowerCase();
        if (!set[e1]) {
          set[e1] = true;
          out.push(curr[i]);
        }
      }
      for (var j = 0; j < prev.length; j++) {
        var e2 = String(prev[j]).toLowerCase();
        if (!set[e2]) {
          set[e2] = true;
          out.push(prev[j]);
        }
      }
      return out;
    },

    getUserInfoByEmail: function (email) {
      var out = { username: "", email: "" };
      if (!email) return out;

      var target = String(email);
      var targetLower = target.toLowerCase();

      // cari di usersRaw dulu
      var arr = Array.isArray(this.usersRaw) ? this.usersRaw : [];
      for (var i = 0; i < arr.length; i++) {
        var u = arr[i] || {};
        var em = u && u.email ? String(u.email) : "";
        if (em && (em === target || em.toLowerCase() === targetLower)) {
          out.email = em;
          out.username = u && u.username ? String(u.username) : em;
          return out;
        }
      }

      // fallback: pakai nama yang tersimpan sebelumnya (kalau ada)
      if (this.assignedInfoMap && this.assignedInfoMap[targetLower]) {
        out.email = target;
        out.username = this.assignedInfoMap[targetLower].username || target;
        return out;
      }

      // terakhir: pakai email sebagai nama
      out.email = target;
      out.username = target;
      return out;
    },

    rxGateLabel: function (key) {
      return key === "gate1" ? "Gate 1" : key === "gate2" ? "Gate 2" : key;
    },

    isFilled: function (v) {
      return v !== null && v !== undefined && String(v).trim() !== "";
    },

    equalsEmail: function (a, b) {
      if (a === null || a === undefined || b === null || b === undefined)
        return false;
      return String(a).toLowerCase() === String(b).toLowerCase();
    },

    collectAllEmailsForUpdate: function () {
      var emails = [];

      function pushValue(v) {
        if (v && String(v).trim() !== "") {
          emails.push(String(v).trim());
        }
      }

      // Sprint
      if (this.draft && this.draft.sprint) {
        pushValue(this.draft.sprint.juryStart);
        pushValue(this.draft.sprint.juryFinish);
      }

      // H2H
      if (this.draft && this.draft.h2h) {
        pushValue(this.draft.h2h.juryStart);
        pushValue(this.draft.h2h.juryFinish);
      }
      if (this.draft && this.draft.h2hValues) {
        var keys = ["R1", "R2", "L1", "L2"];
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          pushValue(this.draft.h2hValues[k]);
        }
      }

      // Slalom
      if (this.draft && this.draft.slalom) {
        pushValue(this.draft.slalom.juryStart);
        pushValue(this.draft.slalom.juryFinish);
        if (this.draft.slalom.gates) {
          for (var g = 1; g <= this.gatesCount; g++) {
            pushValue(this.draft.slalom.gates[g]);
          }
        }
      }

      // DRR
      if (this.draft && this.draft.drr) {
        pushValue(this.draft.drr.juryStart);
        pushValue(this.draft.drr.juryFinish);
        if (this.draft.drr.sections) {
          for (var s = 1; s <= this.sectionsCount; s++) {
            pushValue(this.draft.drr.sections[s]);
          }
        }
      }

      // RX
      if (this.draft && this.draft.rx) {
        pushValue(this.draft.rx.juryStart);
        pushValue(this.draft.rx.juryFinish);
      }
      if (this.draft && this.draft.rxValues) {
        var rxKeys = ["gate1", "gate2"];
        for (var ri = 0; ri < rxKeys.length; ri++) {
          pushValue(this.draft.rxValues[rxKeys[ri]]);
        }
      }

      // Unik
      var uniq = [];
      var seen = {};
      for (var j = 0; j < emails.length; j++) {
        var e = emails[j].toLowerCase();
        if (!seen[e]) {
          seen[e] = true;
          uniq.push(emails[j]);
        }
      }
      return uniq;
    },

    collectAllSelectedEmails: function () {
      var emails = [];

      if (this.draft && this.draft.sprint) {
        if (this.isFilled(this.draft.sprint.juryStart))
          emails.push(String(this.draft.sprint.juryStart));
        if (this.isFilled(this.draft.sprint.juryFinish))
          emails.push(String(this.draft.sprint.juryFinish));
      }

      if (this.draft && this.draft.h2h) {
        if (this.isFilled(this.draft.h2h.juryStart))
          emails.push(String(this.draft.h2h.juryStart));
        if (this.isFilled(this.draft.h2h.juryFinish))
          emails.push(String(this.draft.h2h.juryFinish));
      }
      if (this.draft && this.draft.h2hValues) {
        var keys = ["R1", "R2", "L1", "L2"];
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (this.isFilled(this.draft.h2hValues[k]))
            emails.push(String(this.draft.h2hValues[k]));
        }
      }

      if (this.draft && this.draft.slalom) {
        if (this.isFilled(this.draft.slalom.juryStart))
          emails.push(String(this.draft.slalom.juryStart));
        if (this.isFilled(this.draft.slalom.juryFinish))
          emails.push(String(this.draft.slalom.juryFinish));
        if (this.draft.slalom.gates) {
          for (var g = 1; g <= this.gatesCount; g++) {
            if (this.isFilled(this.draft.slalom.gates[g]))
              emails.push(String(this.draft.slalom.gates[g]));
          }
        }
      }

      if (this.draft && this.draft.drr) {
        if (this.isFilled(this.draft.drr.juryStart))
          emails.push(String(this.draft.drr.juryStart));
        if (this.isFilled(this.draft.drr.juryFinish))
          emails.push(String(this.draft.drr.juryFinish));
        if (this.draft.drr.sections) {
          for (var s = 1; s <= this.sectionsCount; s++) {
            if (this.isFilled(this.draft.drr.sections[s]))
              emails.push(String(this.draft.drr.sections[s]));
          }
        }
      }

      if (this.draft && this.draft.rx) {
        if (this.isFilled(this.draft.rx.juryStart))
          emails.push(String(this.draft.rx.juryStart));
        if (this.isFilled(this.draft.rx.juryFinish))
          emails.push(String(this.draft.rx.juryFinish));
      }
      if (this.draft && this.draft.rxValues) {
        var rxKeys2 = ["gate1", "gate2"];
        for (var rj = 0; rj < rxKeys2.length; rj++) {
          var rk = rxKeys2[rj];
          if (this.isFilled(this.draft.rxValues[rk]))
            emails.push(String(this.draft.rxValues[rk]));
        }
      }

      var set = {};
      var uniq = [];
      for (var j = 0; j < emails.length; j++) {
        var em = emails[j];
        var key = em.toLowerCase();
        if (!set[key]) {
          set[key] = true;
          uniq.push(em);
        }
      }
      uniq.sort();
      return uniq;
    },

    buildEventPositionsPayloadForEmail: function (email) {
      var sprint = { start: false, finish: false };
      if (this.draft && this.draft.sprint) {
        if (this.equalsEmail(this.draft.sprint.juryStart, email))
          sprint.start = true;
        if (this.equalsEmail(this.draft.sprint.juryFinish, email))
          sprint.finish = true;
      }

      var h2h = {
        start: false,
        finish: false,
        R1: false,
        R2: false,
        L1: false,
        L2: false,
      };
      if (this.draft && this.draft.h2h) {
        if (this.equalsEmail(this.draft.h2h.juryStart, email)) h2h.start = true;
        if (this.equalsEmail(this.draft.h2h.juryFinish, email))
          h2h.finish = true;
      }
      if (
        this.enabledBouyanKeys &&
        Array.isArray(this.enabledBouyanKeys) &&
        this.draft &&
        this.draft.h2hValues
      ) {
        for (var i = 0; i < this.enabledBouyanKeys.length; i++) {
          var k = this.enabledBouyanKeys[i];
          if (this.equalsEmail(this.draft.h2hValues[k], email)) h2h[k] = true;
        }
      }

      var gates = [];
      if (this.draft && this.draft.slalom && this.draft.slalom.gates) {
        for (var g = 1; g <= this.gatesCount; g++) {
          if (this.equalsEmail(this.draft.slalom.gates[g], email))
            gates.push(g);
        }
      }
      var uniqGates = Array.from(new Set(gates)).sort(function (a, b) {
        return a - b;
      });

      var slalom = { start: false, finish: false, gates: uniqGates };
      if (this.draft && this.draft.slalom) {
        if (this.equalsEmail(this.draft.slalom.juryStart, email))
          slalom.start = true;
        if (this.equalsEmail(this.draft.slalom.juryFinish, email))
          slalom.finish = true;
      }

      var sections = [];
      if (this.draft && this.draft.drr && this.draft.drr.sections) {
        for (var s = 1; s <= this.sectionsCount; s++) {
          if (this.equalsEmail(this.draft.drr.sections[s], email))
            sections.push(s);
        }
      }
      var uniqSecs = Array.from(new Set(sections)).sort(function (a, b) {
        return a - b;
      });

      var drr = { start: false, finish: false, sections: uniqSecs };
      if (this.draft && this.draft.drr) {
        if (this.equalsEmail(this.draft.drr.juryStart, email)) drr.start = true;
        if (this.equalsEmail(this.draft.drr.juryFinish, email))
          drr.finish = true;
      }

      // rx.gate1/gate2 tetap disimpan untuk kompatibilitas dengan draft lama
      // di komponen ini, tapi konsumen di sts-jurysystem (app/judges/page.jsx
      // & app/judges/raftingcross/page.jsx) HANYA membaca `rx.gates` sebagai
      // array angka gate (persis pola slalom.gates / drr.sections di atas) —
      // tanpa `gates`, tombol Rafting Cross judge selalu abu-abu walau sudah
      // di-assign.
      var rxGateKeyToNumber = { gate1: 1, gate2: 2 };
      var rxGates = [];
      var rx = { start: false, finish: false, gate1: false, gate2: false };
      if (this.draft && this.draft.rx) {
        if (this.equalsEmail(this.draft.rx.juryStart, email)) rx.start = true;
        if (this.equalsEmail(this.draft.rx.juryFinish, email))
          rx.finish = true;
      }
      if (
        this.enabledRxGateKeys &&
        Array.isArray(this.enabledRxGateKeys) &&
        this.draft &&
        this.draft.rxValues
      ) {
        for (var ri2 = 0; ri2 < this.enabledRxGateKeys.length; ri2++) {
          var rk2 = this.enabledRxGateKeys[ri2];
          if (this.equalsEmail(this.draft.rxValues[rk2], email)) {
            rx[rk2] = true;
            if (rxGateKeyToNumber[rk2]) rxGates.push(rxGateKeyToNumber[rk2]);
          }
        }
      }
      rx.gates = Array.from(new Set(rxGates)).sort(function (a, b) {
        return a - b;
      });

      return {
        eventId: String(this.eventId),
        sprint: sprint,
        h2h: h2h,
        slalom: slalom,
        drr: drr,
        rx: rx,
      };
    },

    /* ===== prefill dari backend ===== */
    ensureDraftContainers: function () {
      if (!this.draft) this.draft = {};

      if (!this.draft.sprint)
        this.draft.sprint = { juryStart: "", juryFinish: "" };
      if (!this.draft.h2h) this.draft.h2h = { juryStart: "", juryFinish: "" };
      if (!this.draft.h2hValues) this.draft.h2hValues = {};
      if (!this.draft.slalom)
        this.draft.slalom = { juryStart: "", juryFinish: "", gates: {} };
      if (!this.draft.slalom.gates) this.draft.slalom.gates = {};
      if (!this.draft.drr)
        this.draft.drr = { juryStart: "", juryFinish: "", sections: {} };
      if (!this.draft.drr.sections) this.draft.drr.sections = {};
      if (!this.draft.rx) this.draft.rx = { juryStart: "", juryFinish: "" };
      if (!this.draft.rxValues) this.draft.rxValues = {};
      if (!this.draft.rxFlags)
        this.draft.rxFlags = { gate1: false, gate2: false };

      // siapkan minimal 1 gate & 1 section agar binding aman
      var gTotal = this.gatesCount || 1;
      for (var g = 1; g <= gTotal; g++) {
        if (!this.draft.slalom.gates.hasOwnProperty(g)) {
          this.$set(this.draft.slalom.gates, g, "");
        }
      }

      var sTotal = this.sectionsCount || 1;
      for (var s = 1; s <= sTotal; s++) {
        if (!this.draft.drr.sections.hasOwnProperty(s)) {
          this.$set(this.draft.drr.sections, s, "");
        }
      }
    },

    applyAssignmentsToDraft: function (payload) {
      if (this.hasLocalEdits) return;
      if (!payload || !Array.isArray(payload.assignments)) return;

      this.ensureDraftContainers();

      for (var i = 0; i < payload.assignments.length; i++) {
        var a = payload.assignments[i] || {};
        var disc = a.discipline || "";
        var pos = a.position || "";
        var uid = a.userId != null ? String(a.userId) : "";
        var idx = typeof a.index === "number" ? a.index : null;

        if (uid === "") continue;

        if (disc === "sprint") {
          if (pos === "start" && !this.isFilled(this.draft.sprint.juryStart)) {
            this.draft.sprint.juryStart = uid;
          } else if (
            pos === "finish" &&
            !this.isFilled(this.draft.sprint.juryFinish)
          ) {
            this.draft.sprint.juryFinish = uid;
          }
        } else if (disc === "h2h") {
          if (pos === "start" && !this.isFilled(this.draft.h2h.juryStart)) {
            this.draft.h2h.juryStart = uid;
          } else if (
            pos === "finish" &&
            !this.isFilled(this.draft.h2h.juryFinish)
          ) {
            this.draft.h2h.juryFinish = uid;
          } else if (
            pos === "R1" ||
            pos === "R2" ||
            pos === "L1" ||
            pos === "L2"
          ) {
            if (!this.draft.h2hValues) this.draft.h2hValues = {};
            if (!this.isFilled(this.draft.h2hValues[pos])) {
              this.$set(this.draft.h2hValues, pos, uid);
            }
          }
        } else if (disc === "slalom") {
          if (pos === "start" && !this.isFilled(this.draft.slalom.juryStart)) {
            this.draft.slalom.juryStart = uid;
          } else if (
            pos === "finish" &&
            !this.isFilled(this.draft.slalom.juryFinish)
          ) {
            this.draft.slalom.juryFinish = uid;
          } else if (pos === "gate" && idx != null) {
            if (idx >= 1 && idx <= this.gatesCount) {
              if (!this.isFilled(this.draft.slalom.gates[idx])) {
                this.$set(this.draft.slalom.gates, idx, uid);
              }
            }
          }
        } else if (disc === "drr") {
          if (pos === "start" && !this.isFilled(this.draft.drr.juryStart)) {
            this.draft.drr.juryStart = uid;
          } else if (
            pos === "finish" &&
            !this.isFilled(this.draft.drr.juryFinish)
          ) {
            this.draft.drr.juryFinish = uid;
          } else if (pos === "section" && idx != null) {
            if (idx >= 1 && idx <= this.sectionsCount) {
              if (!this.isFilled(this.draft.drr.sections[idx])) {
                this.$set(this.draft.drr.sections, idx, uid);
              }
            }
          }
        } else if (disc === "rx") {
          if (pos === "start" && !this.isFilled(this.draft.rx.juryStart)) {
            this.draft.rx.juryStart = uid;
          } else if (
            pos === "finish" &&
            !this.isFilled(this.draft.rx.juryFinish)
          ) {
            this.draft.rx.juryFinish = uid;
          } else if (pos === "gate1" || pos === "gate2") {
            if (!this.draft.rxValues) this.draft.rxValues = {};
            if (!this.isFilled(this.draft.rxValues[pos])) {
              this.$set(this.draft.rxValues, pos, uid);
            }
          }
        }
      }
    },

    fetchAssignmentsIPC: function () {
      try {
        if (!this.eventId || typeof ipcRenderer === "undefined") return;

        ipcRenderer.removeAllListeners("judges-assignments:get-reply");
        ipcRenderer.send("judges-assignments:get", { eventId: this.eventId });

        ipcRenderer.once("judges-assignments:get-reply", (_e, res) => {
          if (
            res &&
            res.ok &&
            res.data &&
            Array.isArray(res.data.assignments)
          ) {
            this.applyAssignmentsToDraft(res.data);
          }
        });
      } catch (err) {
        // silent
      }
    },

    // ===== PREFILL: baca dokumen by-user, konversi ke flat, isi ke draft =====
    fetchAssignmentsByUserIPC: function () {
      try {
        if (!this.eventId || typeof ipcRenderer === "undefined") return;

        ipcRenderer.removeAllListeners(
          "users-judges-assignment:listByEvent:reply"
        );
        ipcRenderer.send("users-judges-assignment:listByEvent", {
          eventId: this.eventId,
        });

        ipcRenderer.once(
          "users-judges-assignment:listByEvent:reply",
          (_e, res) => {
            if (!(res && res.ok && Array.isArray(res.items))) return;

            // simpan daftar email yg sudah pernah tersimpan untuk event ini
            var prev = [];
            var infoMap = {};
            for (var i = 0; i < res.items.length; i++) {
              var doc = res.items[i] || {};
              var email = doc && doc.email ? String(doc.email) : "";
              if (!email) continue;
              prev.push(email);
              infoMap[email.toLowerCase()] = {
                username: doc && doc.username ? String(doc.username) : email,
              };
            }
            this.previousAssignedEmails = Array.from(new Set(prev));
            this.assignedInfoMap = infoMap;

            // bangun list flat -> isi draft (spt semula)
            var list = [];
            var evId = String(this.eventId);
            for (var i2 = 0; i2 < res.items.length; i2++) {
              var d = res.items[i2] || {};
              var email2 = d.email ? String(d.email) : "";
              if (!email2) continue;
              var judgesArr = Array.isArray(d.judges) ? d.judges : [];
              for (var j = 0; j < judgesArr.length; j++) {
                var jg = judgesArr[j] || {};
                if ((jg.eventId ? String(jg.eventId) : "") !== evId) continue;

                var sp = jg.sprint || null;
                if (sp && sp.start === true)
                  list.push({
                    discipline: "sprint",
                    position: "start",
                    userId: email2,
                    name: "",
                  });
                if (sp && sp.finish === true)
                  list.push({
                    discipline: "sprint",
                    position: "finish",
                    userId: email2,
                    name: "",
                  });

                var h = jg.h2h || null;
                if (h) {
                  if (h.start === true)
                    list.push({
                      discipline: "h2h",
                      position: "start",
                      userId: email2,
                      name: "",
                    });
                  if (h.finish === true)
                    list.push({
                      discipline: "h2h",
                      position: "finish",
                      userId: email2,
                      name: "",
                    });
                  if (h.R1 === true)
                    list.push({
                      discipline: "h2h",
                      position: "R1",
                      userId: email2,
                      name: "",
                    });
                  if (h.R2 === true)
                    list.push({
                      discipline: "h2h",
                      position: "R2",
                      userId: email2,
                      name: "",
                    });
                  if (h.L1 === true)
                    list.push({
                      discipline: "h2h",
                      position: "L1",
                      userId: email2,
                      name: "",
                    });
                  if (h.L2 === true)
                    list.push({
                      discipline: "h2h",
                      position: "L2",
                      userId: email2,
                      name: "",
                    });
                }

                var sl = jg.slalom || null;
                if (sl) {
                  if (sl.start === true)
                    list.push({
                      discipline: "slalom",
                      position: "start",
                      userId: email2,
                      name: "",
                    });
                  if (sl.finish === true)
                    list.push({
                      discipline: "slalom",
                      position: "finish",
                      userId: email2,
                      name: "",
                    });
                  var gates = Array.isArray(sl.gates) ? sl.gates : [];
                  for (var g = 0; g < gates.length; g++) {
                    var gateIndex = gates[g];
                    if (typeof gateIndex === "number") {
                      list.push({
                        discipline: "slalom",
                        position: "gate",
                        index: gateIndex,
                        userId: email2,
                        name: "",
                      });
                    }
                  }
                }

                var dr = jg.drr || null;
                if (dr) {
                  if (dr.start === true)
                    list.push({
                      discipline: "drr",
                      position: "start",
                      userId: email2,
                      name: "",
                    });
                  if (dr.finish === true)
                    list.push({
                      discipline: "drr",
                      position: "finish",
                      userId: email2,
                      name: "",
                    });
                  var secs = Array.isArray(dr.sections) ? dr.sections : [];
                  for (var s = 0; s < secs.length; s++) {
                    var secIndex = secs[s];
                    if (typeof secIndex === "number") {
                      list.push({
                        discipline: "drr",
                        position: "section",
                        index: secIndex,
                        userId: email2,
                        name: "",
                      });
                    }
                  }
                }

                var rx = jg.rx || null;
                if (rx) {
                  if (rx.start === true)
                    list.push({
                      discipline: "rx",
                      position: "start",
                      userId: email2,
                      name: "",
                    });
                  if (rx.finish === true)
                    list.push({
                      discipline: "rx",
                      position: "finish",
                      userId: email2,
                      name: "",
                    });
                  // Format baru: rx.gates = [1, 2, ...] (lihat
                  // buildJudgeObjectForEmail). Tetap fallback ke gate1/gate2
                  // boolean supaya assignment lama (sebelum fix ini) masih
                  // ter-prefill dengan benar saat modal dibuka ulang.
                  var rxGatesArr = Array.isArray(rx.gates) ? rx.gates : [];
                  var hasGate1 =
                    rxGatesArr.indexOf(1) !== -1 || rx.gate1 === true;
                  var hasGate2 =
                    rxGatesArr.indexOf(2) !== -1 || rx.gate2 === true;
                  if (hasGate1)
                    list.push({
                      discipline: "rx",
                      position: "gate1",
                      userId: email2,
                      name: "",
                    });
                  if (hasGate2)
                    list.push({
                      discipline: "rx",
                      position: "gate2",
                      userId: email2,
                      name: "",
                    });
                }
              }
            }
            this.applyAssignmentsToDraft({ eventId: evId, assignments: list });
          }
        );
      } catch (err) {
        // silent
      }
    },

    /* ===== load master data ===== */
    fetchUsers: function () {
      try {
        if (typeof ipcRenderer === "undefined") return;

        ipcRenderer.removeAllListeners("users:getAll:reply");
        ipcRenderer.send("users:getAll");

        ipcRenderer.once("users:getAll:reply", (_e, res) => {
          var list = [];
          if (res && Array.isArray(res.items)) list = res.items;
          else if (res && Array.isArray(res.users)) list = res.users;
          else if (res && res.data && Array.isArray(res.data.users))
            list = res.data.users;

          const evId = toStrId(this.eventId);
          const filtered = evId
            ? list.filter((u) => userHasEvent(u, evId))
            : list;

          this.usersRaw = filtered;
          this.internalJuryOptions = normalizeUsersToOptions(filtered);
        });
      } catch (err) {
        this.usersRaw = [];
        this.internalJuryOptions = [];
      }
    },

    fetchSettingsIPC: function () {
      try {
        if (!this.eventId || typeof ipcRenderer === "undefined") {
          this.loading = false;
          return;
        }
        ipcRenderer.removeAllListeners("race-settings:get-reply");
        ipcRenderer.send("race-settings:get", this.eventId);

        ipcRenderer.once("race-settings:get-reply", (_e, res) => {
          var incoming =
            res && res.ok && res.settings
              ? mergeWithDefaults(res.settings)
              : mergeWithDefaults({});

          if (this.hasLocalEdits) {
            this.loading = false;
            return;
          }
          this.ensureDraftContainers();

          // Sprint
          if (!this.isFilled(this.draft.sprint.juryStart))
            this.draft.sprint.juryStart = incoming.sprint.juryStart || "";
          if (!this.isFilled(this.draft.sprint.juryFinish))
            this.draft.sprint.juryFinish = incoming.sprint.juryFinish || "";

          // H2H
          if (!this.isFilled(this.draft.h2h.juryStart))
            this.draft.h2h.juryStart = incoming.h2h.juryStart || "";
          if (!this.isFilled(this.draft.h2h.juryFinish))
            this.draft.h2h.juryFinish = incoming.h2h.juryFinish || "";
          // sinkronkan flag bouyan mana yang aktif dari Race Settings
          // event ini (bukan dari default statis di parent), supaya
          // dropdown Bouyan yang tampil selalu sesuai konfigurasi terkini
          if (incoming.h2hFlags) this.draft.h2hFlags = incoming.h2hFlags;
          if (!this.draft.h2hValues) this.draft.h2hValues = {};
          var keys = ["R1", "R2", "L1", "L2"];
          for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (
              !this.isFilled(this.draft.h2hValues[k]) &&
              incoming.h2hValues &&
              incoming.h2hValues[k]
            ) {
              this.$set(this.draft.h2hValues, k, incoming.h2hValues[k]);
            }
          }

          // Slalom
          if (!this.isFilled(this.draft.slalom.juryStart))
            this.draft.slalom.juryStart = incoming.slalom.juryStart || "";
          if (!this.isFilled(this.draft.slalom.juryFinish))
            this.draft.slalom.juryFinish = incoming.slalom.juryFinish || "";

          // >>> tambahkan ini:
          var maxG =
            incoming.slalom && incoming.slalom.totalGate
              ? incoming.slalom.totalGate
              : 1;
          this.draft.slalom.totalGate = maxG; // penting: supaya v-for n in gatesCount ikut update
          this.ensureDraftContainers(); // siapkan key sesuai jumlah baru

          for (var g = 1; g <= maxG; g++) {
            var incGate =
              incoming.slalom && incoming.slalom.gates
                ? incoming.slalom.gates[g]
                : "";
            if (!this.isFilled(this.draft.slalom.gates[g]) && incGate) {
              this.$set(this.draft.slalom.gates, g, incGate);
            }
          }

          // DRR
          if (!this.isFilled(this.draft.drr.juryStart))
            this.draft.drr.juryStart = incoming.drr.juryStart || "";
          if (!this.isFilled(this.draft.drr.juryFinish))
            this.draft.drr.juryFinish = incoming.drr.juryFinish || "";

          // >>> tambahkan ini:
          var maxS =
            incoming.drr && incoming.drr.totalSection
              ? incoming.drr.totalSection
              : 1;
          this.draft.drr.totalSection = maxS; 
          this.ensureDraftContainers();

          for (var s = 1; s <= maxS; s++) {
            var incSec =
              incoming.drr && incoming.drr.sections
                ? incoming.drr.sections[s]
                : "";
            if (!this.isFilled(this.draft.drr.sections[s]) && incSec) {
              this.$set(this.draft.drr.sections, s, incSec);
            }
          }

          // RX
          if (!this.draft.rx) this.draft.rx = { juryStart: "", juryFinish: "" };
          // sinkronkan flag gate mana yang aktif dari Race Settings event ini
          if (incoming.rxFlags) this.draft.rxFlags = incoming.rxFlags;
          if (!this.isFilled(this.draft.rx.juryStart))
            this.draft.rx.juryStart = incoming.rx.juryStart || "";
          if (!this.isFilled(this.draft.rx.juryFinish))
            this.draft.rx.juryFinish = incoming.rx.juryFinish || "";
          if (!this.draft.rxValues) this.draft.rxValues = {};
          var rxKeys3 = ["gate1", "gate2"];
          for (var ri3 = 0; ri3 < rxKeys3.length; ri3++) {
            var rk3 = rxKeys3[ri3];
            if (
              !this.isFilled(this.draft.rxValues[rk3]) &&
              incoming.rxValues &&
              incoming.rxValues[rk3]
            ) {
              this.$set(this.draft.rxValues, rk3, incoming.rxValues[rk3]);
            }
          }

          this.loading = false;
        });
      } catch (err) {
        this.draft = mergeWithDefaults({});
        this.loading = false;
      }
    },

    /* ===== actions ===== */
    close: function () {
      if (this.saving) return;
      this.localShow = false;
    },

    confirm: function () {
      if (!this.eventId || this.saving) return;

      var emails = this.getAllEmailsForUpsert(); // ⬅️ PENTING
      var nowIso = new Date().toISOString();
      var docs = [];

      for (var i = 0; i < emails.length; i++) {
        var em = emails[i];
        var info = this.getUserInfoByEmail(em);
        var positionsForThisUser = this.buildEventPositionsPayloadForEmail(em);

        docs.push({
          id: String(this.eventId),
          username: info.username || em,
          email: info.email || em,
          judges: [positionsForThisUser],
          createdAt: { $date: nowIso },
          updatedAt: { $date: nowIso },
          __v: 0,
        });
      }

      if (typeof ipcRenderer === "undefined") {
        return;
      }

      this.saving = true;
      ipcRenderer.removeAllListeners(
        "users-judges-assignment:upsertMany:reply"
      );
      ipcRenderer.send("users-judges-assignment:upsertMany", { docs: docs });

      ipcRenderer.once(
        "users-judges-assignment:upsertMany:reply",
        (_e, res) => {
          this.saving = false;
          var ok = res && res.ok === true;
          if (ok) {
            if (this.$bvToast) {
              this.$bvToast.toast("Assignments berhasil disimpan.", {
                title: "Success",
                variant: "success",
                solid: true,
              });
            }
            this.fetchAssignmentsByUserIPC();
            this.localShow = false;
            this.$emit("assignments-updated", {
              eventId: String(this.eventId),
              count: docs.length,
            });
          } else {
            var msg =
              res && res.error
                ? String(res.error)
                : "Gagal menyimpan assignment";
            if (this.$bvToast) {
              this.$bvToast.toast(msg, {
                title: "Error",
                variant: "danger",
                solid: true,
              });
            }
          }
        }
      );
    },
  },
};
</script>

<style>
.rounded-20 {
  border-radius: 20px;
}

/* Panel kategori (Sprint/H2H/Slalom/DRR/RX) — flex column supaya CSS
   `order` (lihat categoryOrder() di methods) bisa menata ulang urutan
   tampilnya ikut array Event Categories. Didefinisikan juga di
   RaceSettings.vue (unscoped, jadi sebenarnya sudah global) — diulang di
   sini supaya tidak diam-diam bergantung pada file lain itu dimuat lebih
   dulu. */
.rs-category-panels {
  display: flex;
  flex-direction: column;
}

.btn-close-red {
  background: #ffe5e5;
  border: none;
  color: #c62828;
  font-weight: bold;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.btn-close-red:hover {
  background: #f8d7da;
  color: #b71c1c;
}

.rounded-12 {
  border-radius: 12px;
}

.rs-card {
  border: 1px solid #e6ebf4;
  border-radius: 16px;
  background: #fff;
  padding: 18px 16px;
  box-shadow: 0 12px 26px rgba(31, 56, 104, 0.08);
}

.rs-section-title {
  font-weight: 800;
  font-size: 20px;
  margin-bottom: 12px;
  color: #1f2940;
}

.rs-section-toggle {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
}
.rs-section-toggle:hover {
  color: #1c4c7a;
}

/* Batasi tinggi modal & jadikan layout fleksibel.
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

/* Header tetap terlihat saat scroll */
.rs-modal .modal-header {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #fff;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.06);
}

/* Area body bisa discroll */
.rs-modal .modal-body {
  overflow: auto;
}

.form-label {
  margin-bottom: 6px;
  font-weight: 700;
  color: #2b3445;
}

.rs-select {
  height: 42px;
  border-radius: 10px !important;
  border: 1px solid #e6ebf4 !important;
  background: #f7f9fc !important;
  padding: 6px 12px !important;
}

.rs-select:focus {
  background: #fff !important;
  border-color: #9ec5ff !important;
  box-shadow: 0 0 0 4px rgba(42, 104, 196, 0.15) !important;
}

/* base */
.btn.btn-confirm {
  background: #f0f8ff;
  color: #325a8f;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
  transition: all 0.25s ease;
  border: 1px solid #cfd8e6;
}

/* hover */
.btn.btn-confirm:hover {
  background: #325a8f;
  color: #ffffff;
  border-color: #325a8f;
  box-shadow: 0 0 12px rgba(0, 180, 255, 0.5);
  cursor: pointer;
}

/* active (klik/tahan) */
.btn.btn-confirm:active,
.btn.btn-confirm:focus {
  background: #0d789d;
  color: #ffffff;
  border-color: #0d789d;
}
</style>

<style>
/* ===== Judges Configuration (redesign) =====
   Global (bukan scoped) krn b-modal dirender di <body> & elemen pembungkus
   (.modal-content/.modal-body/.modal-footer) dibuat BootstrapVue, bukan
   template ini. Semua kelas berawalan `jsm-` supaya tidak bentrok. */

.jsm-content {
  border: none;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
}
.jsm-body {
  background: #f5f8fc;
}

/* ---------- Header ---------- */
.jsm-head {
  position: relative;
  width: 100%;
  color: #fff;
}
.jsm-head__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(520px 200px at 88% 0%, rgba(37, 176, 235, 0.45), transparent 70%),
    linear-gradient(110deg, #0f2f52 0%, #1c4c7a 55%, #1d7fb8 100%);
}
.jsm-close {
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
.jsm-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
.jsm-head__inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 64px 20px 26px;
}
.jsm-head__icon {
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
.jsm-head__text {
  flex: 1;
  min-width: 0;
}
.jsm-eyebrow {
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
.jsm-title {
  margin: 5px 0 0;
  font-size: 20px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.jsm-sub {
  margin: 2px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}
.jsm-head__summary {
  flex: none;
  min-width: 150px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  text-align: right;
}
.jsm-summary__value {
  display: block;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.jsm-summary__value small {
  font-size: 14px;
  opacity: 0.7;
}
.jsm-summary__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}
.jsm-summary__bar {
  margin-top: 6px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}
.jsm-summary__bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #4ade80;
  transition: width 0.3s ease;
}

/* ---------- Body ---------- */
.jsm-wrap {
  padding: 20px 22px 8px;
}
.jsm-wrap .rs-category-panels {
  gap: 14px;
}
.jsm-loading,
.jsm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 48px 16px;
  color: #94a3b8;
  text-align: center;
}
.jsm-loading {
  flex-direction: row;
  justify-content: center;
}

/* Kartu kategori */
.jsm-cat {
  background: #ffffff;
  border: 1px solid #e6edf6;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(15, 42, 67, 0.05);
}
.jsm-cat__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  user-select: none;
  border-radius: 16px;
  transition: background-color 0.15s ease;
}
.jsm-cat__head:hover {
  background: #f8fbff;
}
.jsm-cat__icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #e6edf6;
}
.jsm-cat__titles {
  flex: 1;
  min-width: 0;
}
.jsm-cat__title {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}
.jsm-cat__desc {
  font-size: 12px;
  color: #64748b;
}
.jsm-count {
  flex: none;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  border: 1px solid transparent;
}
.jsm-count.is-full {
  background: #dcfce7;
  color: #15803d;
  border-color: #bbf7d0;
}
.jsm-count.is-partial {
  background: #fef3c7;
  color: #b45309;
  border-color: #fde68a;
}
.jsm-count.is-empty {
  background: #f1f5f9;
  color: #64748b;
  border-color: #e2e8f0;
}
.jsm-chev {
  flex: none;
  font-size: 22px;
  color: #94a3b8;
  transition: transform 0.2s ease;
}
.jsm-chev.is-collapsed {
  transform: rotate(-90deg);
}
.jsm-cat__body {
  padding: 4px 18px 18px;
  border-top: 1px solid #eef2f7;
}
.jsm-group {
  margin: 14px 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #94a3b8;
}
.jsm-grid {
  display: grid;
  gap: 12px 14px;
}
.jsm-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.jsm-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.jsm-field {
  min-width: 0;
}
.jsm-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
}
.jsm-label svg {
  color: #25b0eb;
  font-size: 15px;
}

/* ---------- Footer ---------- */
.jsm-footer {
  padding: 0;
  border-top: 1px solid #e6edf6;
  background: #ffffff;
}
.jsm-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 14px 22px;
}
.jsm-foot__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #64748b;
}
.jsm-foot__actions {
  display: flex;
  gap: 8px;
}
.jsm-btn {
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
  transition: filter 0.15s ease, background-color 0.15s ease;
}
.jsm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.jsm-btn--ghost {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #475569;
}
.jsm-btn--ghost:hover:not(:disabled) {
  background: #f8fafc;
}
.jsm-btn--primary {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(28, 76, 122, 0.25);
}
.jsm-btn--primary:hover:not(:disabled) {
  filter: brightness(1.07);
}

@media (max-width: 991.98px) {
  .jsm-grid--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .jsm-head__summary {
    display: none;
  }
}
@media (max-width: 575.98px) {
  .jsm-grid--2,
  .jsm-grid--4 {
    grid-template-columns: 1fr;
  }
}
</style>
