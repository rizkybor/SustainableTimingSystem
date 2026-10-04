<template>
  <div class="ph">
    <!-- Breadcrumb + jam -->
    <div class="ph-topbar">
      <nav class="ph-crumbs" aria-label="breadcrumb">
        <router-link to="/" class="ph-crumbs__link">
          <Icon icon="mdi:home-outline" />
          Dashboard
        </router-link>
        <Icon icon="mdi:chevron-right" class="ph-crumbs__sep" />
        <span class="ph-crumbs__current">{{ crumb || title }}</span>
      </nav>
      <span class="ph-clock">
        <Icon icon="mdi:clock-outline" />
        {{ now }}
      </span>
    </div>

    <!-- Banner -->
    <section class="ph-banner">
      <div class="ph-banner__bg"></div>
      <div class="ph-banner__inner">
        <div class="ph-head">
          <button v-if="showBack" type="button" class="ph-back" title="Kembali" @click="goBack">
            <Icon icon="mdi:arrow-left" />
          </button>
          <slot name="icon">
            <span class="ph-icon"><Icon :icon="icon" /></span>
          </slot>
          <div class="ph-text">
            <h1 class="ph-title">
              {{ title }}
              <slot name="title-suffix" />
            </h1>
            <p v-if="subtitle" class="ph-subtitle">{{ subtitle }}</p>
          </div>
          <div v-if="$slots.actions" class="ph-actions">
            <slot name="actions" />
          </div>
        </div>

        <div v-if="stats && stats.length" class="ph-stats">
          <div
            v-for="s in stats"
            :key="s.label"
            class="ph-stat"
            :class="s.tone ? 'ph-stat--' + s.tone : ''"
          >
            <span class="ph-stat__value">{{ s.value }}</span>
            <span class="ph-stat__label">
              <span class="ph-stat__dot"></span>
              {{ s.label }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
// Header halaman list (All Events / All Teams): breadcrumb + banner
// gradient brand — gaya sama dgn hero Home/Event Detail/Race Category.
export default {
  name: "PageHero",
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    crumb: { type: String, default: "" },
    icon: { type: String, default: "mdi:view-list" },
    // [{ label, value, tone: "success" | "warning" | "neutral" }]
    stats: { type: Array, default: () => [] },
    showBack: { type: Boolean, default: true },
  },
  computed: {
    now() {
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
  },
  methods: {
    // Halaman bisa pasang @back sendiri (mis. All Teams: hapus draft form
    // dulu); kalau tidak, default router.back().
    goBack() {
      if (this.$listeners.back) return this.$emit("back");
      if (window.history.length > 1) this.$router.back();
      else this.$router.push("/");
    },
  },
};
</script>

<style scoped>
.ph-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 14px;
}
.ph-crumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.ph-crumbs__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #64748b;
  font-weight: 600;
  text-decoration: none;
}
.ph-crumbs__link:hover {
  color: #1c4c7a;
  text-decoration: none;
}
.ph-crumbs__sep {
  color: #cbd5e1;
}
.ph-crumbs__current {
  color: #0f172a;
  font-weight: 700;
}
.ph-clock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #e6edf6;
  color: #475569;
  font-size: 12.5px;
  font-weight: 600;
}

.ph-banner {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 14px 34px rgba(15, 42, 67, 0.18);
}
.ph-banner__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
      600px 220px at 85% 0%,
      rgba(37, 176, 235, 0.45),
      transparent 70%
    ),
    linear-gradient(110deg, #0f2f52 0%, #1c4c7a 55%, #1d7fb8 100%);
}
.ph-banner__inner {
  position: relative;
  padding: 26px 28px;
  color: #fff;
}

.ph-head {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.ph-back {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.ph-back:hover {
  background: rgba(255, 255, 255, 0.18);
}
.ph-icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #bae6fd;
}
.ph-text {
  flex: 1;
  min-width: 200px;
}
.ph-title {
  margin: 0;
  font-size: clamp(22px, 2.6vw, 30px);
  font-weight: 800;
  letter-spacing: -0.01em;
}
.ph-subtitle {
  margin: 3px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
}
.ph-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ph-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 20px;
}
.ph-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(6px);
}
.ph-stat__value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.ph-stat__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}
.ph-stat__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7dd3fc;
}
.ph-stat--success .ph-stat__dot {
  background: #4ade80;
}
.ph-stat--warning .ph-stat__dot {
  background: #fbbf24;
}
.ph-stat--neutral .ph-stat__dot {
  background: #c4b5fd;
}

@media (max-width: 575.98px) {
  .ph-banner__inner {
    padding: 20px 16px;
  }
}
</style>

<style>
/* Tombol aksi di slot #actions (di atas latar gelap banner) */
.ph-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 16px;
  border-radius: 11px;
  font-size: 13.5px;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: filter 0.15s ease, background-color 0.15s ease,
    transform 0.08s ease;
}
.ph-btn:active {
  transform: translateY(1px);
}
.ph-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ph-btn--primary {
  background: linear-gradient(135deg, #25b0eb, #1c8fc7);
  color: #fff;
  box-shadow: 0 6px 16px rgba(37, 176, 235, 0.4);
}
.ph-btn--primary:hover:not(:disabled) {
  filter: brightness(1.07);
}
.ph-btn--ghost {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}
.ph-btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
}
</style>
