<template>
  <b-dropdown
    ref="dd"
    class="ss w-100"
    :disabled="disabled"
    no-caret
    @show="onShow"
    @hidden="onHidden"
    :offset="6"
    :right="false"
  >
    <!-- Tombol: tampak seperti input -->
    <template #button-content>
      <div :class="['ss-toggle', isOpen && 'ss-toggle--open']">
        <span class="ss-toggle__label text-truncate">
          {{ selectedLabel || placeholder }}
        </span>
        <span class="ss-toggle__chevron" :class="{ open: isOpen }" aria-hidden="true">
          <!-- chevron svg, biar tak bergantung mdi -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>
      </div>
    </template>

    <!-- Panel dropdown -->
    <div class="ss-panel">
      <!-- Search di dalam panel -->
      <div class="ss-search">
        <span class="ss-search__icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </span>
        <input
          ref="search"
          v-model="search"
          class="ss-search__input"
          :placeholder="searchPlaceholder || placeholder"
          autocomplete="off"
        />
        <button
          v-if="clearable"
          type="button"
          class="ss-search__clear"
          @click.stop="clearSelection"
          title="Clear"
        >
          Clear
        </button>
      </div>

      <!-- List opsi -->
      <div class="ss-list">
        <div
          v-for="opt in filtered"
          :key="String(opt.value)"
          :class="['ss-item', opt.disabled && 'is-disabled']"
          @click.prevent="!opt.disabled && select(opt)"
          :aria-disabled="!!opt.disabled"
          role="button"
          tabindex="-1"
        >
          <span class="ss-item__text text-truncate">{{ opt.text }}</span>
          <small v-if="opt.meta" class="ss-item__meta">{{ opt.meta }}</small>
        </div>

        <div v-if="!filtered.length" class="ss-empty text-muted">
          Tidak ada hasil
        </div>
      </div>

      <!-- Footer -->
      <div v-if="showEmptyOption" class="ss-footer" @click.prevent="setEmpty">
        — Kosongkan pilihan —
      </div>
    </div>
  </b-dropdown>
</template>

<script>
export default {
  name: 'SearchableSelect',
  props: {
    value: [String, Number, null],
    options: { type: Array, default: () => [] }, // [{ value, text, disabled?, meta? }]
    placeholder: { type: String, default: 'Select team name' },
    searchPlaceholder: String,
    clearable: { type: Boolean, default: true },
    showEmptyOption: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
  },
  data() {
    return { search: '', isOpen: false };
  },
  computed: {
    selectedLabel() {
      const f = this.options.find(o => o.value === this.value);
      return f ? f.text : '';
    },
    filtered() {
      const q = (this.search || '').toLowerCase();
      if (!q) return this.options;
      return this.options.filter(o => {
        if (o.disabled) return false;
        const t = (o.text || '').toLowerCase();
        const m = (o.meta || '').toLowerCase();
        return t.includes(q) || m.includes(q);
      });
    },
  },
  methods: {
    onShow() { this.isOpen = true; this.$nextTick(() => this.$refs.search && this.$refs.search.focus()); },
    onHidden() { this.isOpen = false; this.search = ''; },
    select(opt) { this.$emit('input', opt.value); this.$emit('change', opt); this.$refs.dd.hide(true); },
    clearSelection() { this.$emit('input', null); this.$emit('change', null); },
    setEmpty() { this.$emit('input', ''); this.$emit('change', null); this.$refs.dd.hide(true); },
  },
};
</script>

<style scoped>
/* ==== Closed state (button as input) ==== */
.ss :deep(.dropdown-toggle) {
  /* hilangkan default toggle */
  padding: 0; border: 0; background: transparent !important;
}
.ss-toggle{
  width: 100%;
  min-height: 48px;
  display:flex; align-items:center; justify-content:space-between;
  padding: 10px 14px;
  border: 1px solid #D0D7E2;
  background: #F7F9FC;
  border-radius: 12px;
  color: #1F2940;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.ss-toggle:hover{ background:#f2f6fb; }
.ss-toggle--open{
  background:#fff;
  border-color:#9EC5FF;
  box-shadow: 0 0 0 4px rgba(42,104,196,0.15);
}
.ss-toggle__label{ font-size:14px; line-height:1.2; }
.ss-toggle__chevron{ color:#7b8aa6; display:flex; }
.ss-toggle__chevron.open{ transform: rotate(180deg); }

/* ==== Dropdown panel ==== */
.ss :deep(.dropdown-menu){
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent; /* biar panel kita yang tampil */
}
.ss-panel{
  background:#fff;
  border:1px solid #E6EBF4;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 16px 32px rgba(31,56,104,0.12);
}

/* Search bar di panel */
.ss-search{
  position:relative;
  display:flex; align-items:center;
  border:1px solid #D0D7E2;
  border-radius:10px;
  background:#F7F9FC;
  padding: 6px 8px 6px 36px;
}
.ss-search__icon{
  position:absolute; left:10px;
  color:#7b8aa6; display:flex;
}
.ss-search__input{
  width:100%; border:0; outline:none; background:transparent;
  font-size:14px; padding:0;
}
.ss-search__clear{
  margin-left:8px;
  border:1px solid #E2E8F0;
  background:#fff;
  border-radius:8px;
  padding:4px 8px;
  font-size:12px; color:#1c4c7a;
}

/* List */
.ss-list{
  margin-top:10px; max-height: 300px; overflow-y:auto;
}
.ss-item{
  display:flex; justify-content:space-between; align-items:center;
  border:1px solid #EEF2F7;
  background:#FFFFFF;
  border-radius:10px;
  padding:12px 14px;
  margin-bottom:8px;
  cursor:pointer; user-select:none;
  transition: background .12s, border-color .12s;
}
.ss-item:hover{ background:#F9FBFF; border-color:#DDE7F4; }
.ss-item.is-disabled{ opacity:.55; cursor:not-allowed; }
.ss-item__text{ font-size:14px; color:#1F2940; }
.ss-item__meta{ color:#7A879A; }

/* Footer */
.ss-footer{
  margin-top:6px; padding:8px 6px; text-align:center;
  color:#1c4c7a; cursor:pointer; border-radius:8px;
}
.ss-footer:hover{ background:#F5F9FF; }

/* Kompatibel di dalam sel tabel */
:deep(td) .ss{ width:100%; }
</style>