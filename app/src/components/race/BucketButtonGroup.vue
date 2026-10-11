<template>
  <!-- Switch Category sbg deretan tombol (pengganti <b-form-select>) —
       1 klik langsung pindah kategori, tanpa buka dropdown dulu. -->
  <div :id="id" class="bucket-btns" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="opt in visibleOptions"
      :key="opt.value"
      type="button"
      class="bucket-btn"
      :class="{ active: opt.value === value }"
      role="radio"
      :aria-checked="opt.value === value ? 'true' : 'false'"
      :title="opt.text"
      @click="pick(opt.value)"
    >
      {{ opt.text }}
    </button>
    <span v-if="!visibleOptions.length" class="bucket-btns__empty">
      Belum ada kategori.
    </span>
  </div>
</template>

<script>
// Kontrak SAMA dgn <b-form-select> yang digantikannya, supaya logika pindah
// kategori di tiap halaman Race Category (onSelect<X>Bucket, termasuk bagian
// yang sudah "dikunci") tidak perlu diubah sama sekali:
// - v-model (`value` + event `input`) diperbarui DULU,
// - event `change` menyusul di $nextTick dgn nilai baru (urutan sama dgn
//   b-form-select),
// - klik tombol yang SUDAH aktif tidak memicu apa pun (select juga tidak
//   memicu change kalau pilihannya sama).
export default {
  name: "BucketButtonGroup",
  props: {
    id: { type: String, default: "" },
    value: { type: [String, Number], default: null },
    // format sama dgn b-form-select: [{ value, text, disabled? }]
    options: { type: Array, default: () => [] },
    ariaLabel: { type: String, default: "Pilih kategori" },
  },
  computed: {
    visibleOptions() {
      return (this.options || []).filter(
        (o) => o && !o.disabled && o.value !== null && o.value !== undefined && o.value !== ""
      );
    },
  },
  methods: {
    pick(v) {
      if (v === this.value) return;
      this.$emit("input", v);
      this.$nextTick(() => this.$emit("change", v));
    },
  },
};
</script>
