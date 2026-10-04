// Bar "Switch Category + Connect Racetime" di 5 halaman Race Category
// Details (Sprint/H2H/Slalom/DRR/Rafting Cross).
//
// Perilaku "sticky" manual: bar tetap di posisi normalnya (TIDAK menutupi
// breadcrumb + hero di atasnya) dan baru jadi position:fixed (class
// `is-stuck`, lihat race-category-stickybar.css) begitu di-scroll melewati
// bawah Navbar. `position: sticky` CSS tidak bisa dipakai karena parent bar
// terlalu pendek (lihat MEMORY project_slalom_sticky_category_switch.md).
//
// Template yang dibutuhkan di tiap halaman:
//   <div ref="stickySentinel"></div>               (tepat sebelum bar)
//   <div class="card-body race-sticky-bar" ref="stickyBar"
//        :class="{ 'is-stuck': isBarStuck }">...</div>
//   <div :style="{ height: stickySpacerHeight + 'px' }"></div>  (sesudahnya)
export default {
  data() {
    return {
      stickyBarHeight: 0,
      isBarStuck: false,
    };
  },

  computed: {
    // Spacer cuma diisi saat bar lepas dari normal flow (fixed), supaya
    // konten di bawahnya tidak loncat ke atas / ketutupan.
    stickySpacerHeight() {
      return this.isBarStuck ? this.stickyBarHeight : 0;
    },
  },

  mounted() {
    this.$nextTick(() => {
      const bar = this.$refs.stickyBar;
      const sentinel = this.$refs.stickySentinel;
      if (!bar || !sentinel) return;

      // Tinggi bar di posisi normal (bukan saat fixed — lebar & padding-nya
      // beda) = tinggi spacer yang menggantikannya.
      if (typeof ResizeObserver !== "undefined") {
        this.$_stickyResizeObserver = new ResizeObserver(() => {
          if (!this.isBarStuck) {
            this.stickyBarHeight = Math.ceil(bar.offsetHeight);
          }
        });
        this.$_stickyResizeObserver.observe(bar);
      }

      this.$_stickyOnScroll = () => {
        const navH =
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--nav-h"
            )
          ) || 64;
        const stuck = sentinel.getBoundingClientRect().top < navH;
        if (stuck && !this.isBarStuck) {
          this.stickyBarHeight = Math.ceil(bar.offsetHeight);
        }
        this.isBarStuck = stuck;
      };
      // capture: true supaya scroll dari container dalam (bukan cuma
      // window) juga tertangkap.
      window.addEventListener("scroll", this.$_stickyOnScroll, {
        passive: true,
        capture: true,
      });
      window.addEventListener("resize", this.$_stickyOnScroll);
      this.$_stickyOnScroll();
    });
  },

  beforeDestroy() {
    if (this.$_stickyResizeObserver) this.$_stickyResizeObserver.disconnect();
    if (this.$_stickyOnScroll) {
      window.removeEventListener("scroll", this.$_stickyOnScroll, {
        capture: true,
      });
      window.removeEventListener("resize", this.$_stickyOnScroll);
    }
  },
};
