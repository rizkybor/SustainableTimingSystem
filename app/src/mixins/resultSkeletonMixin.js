// Skeleton loader halaman Result: tampil selama `loading` ATAU selama
// rangkaian fetch awal di created() belum selesai (`bootDone` false).
// Perlu krn loadEventById() sudah menyetel loading=false di TENGAH rangkaian
// (sebelum data hasil diambil) — tanpa ini, "No data available" sempat
// berkedip di antara fetch. Halaman menyetel `this.bootDone = true` di akhir
// created(); pengaman: dilepas otomatis setelah 15 detik (mis. ada error di
// tengah rangkaian) supaya skeleton tidak tampil selamanya.
export default {
  data() {
    return { bootDone: false };
  },
  computed: {
    showResultSkeleton() {
      return !!this.loading || !this.bootDone;
    },
  },
  mounted() {
    this.$_bootTimer = setTimeout(() => {
      this.bootDone = true;
    }, 15000);
  },
  beforeDestroy() {
    clearTimeout(this.$_bootTimer);
  },
};
