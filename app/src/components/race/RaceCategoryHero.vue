<template>
  <div class="rch">
    <!-- BREADCRUMB + jam -->
    <div class="rch-topbar">
      <nav class="rch-crumbs" aria-label="breadcrumb">
        <router-link to="/" class="rch-crumbs__link">
          <Icon icon="mdi:home-outline" />
          Home
        </router-link>
        <Icon icon="mdi:chevron-right" class="rch-crumbs__sep" />
        <router-link
          :to="{ name: 'detail-event', params: { id: $route.params.id } }"
          :title="event.eventName || 'Event'"
          class="rch-crumbs__link rch-crumbs__link--event"
        >
          {{ event.eventName || "Event" }}
        </router-link>
        <Icon icon="mdi:chevron-right" class="rch-crumbs__sep" />
        <span class="rch-crumbs__current">{{ raceLabel }}</span>
      </nav>
      <span v-if="currentDateTime" class="rch-clock">
        <Icon icon="mdi:clock-outline" />
        {{ currentDateTime }}
      </span>
    </div>

    <!-- HERO -->
    <section class="rch-hero">
      <div class="rch-hero__bg"></div>
      <div class="rch-hero__inner">
        <div class="rch-logo">
          <img :src="logoUrl" alt="Event Logo" />
        </div>

        <div class="rch-text">
          <div class="rch-topline">
            <span class="rch-race">
              <img v-if="raceIcon" :src="raceIcon" alt="" class="rch-race__icon" />
              {{ raceLabel }}
            </span>
            <span v-if="dateRange" class="rch-pill">
              <Icon icon="mdi:calendar-blank-outline" />
              {{ dateRange }}
            </span>
          </div>

          <h2 class="rch-title">{{ event.eventName || "-" }}</h2>

          <div class="rch-chips">
            <span class="rch-chip">
              <Icon icon="mdi:map-marker-outline" />
              <span class="rch-chip__label">Location</span>
              {{ location }}
            </span>
            <span class="rch-chip">
              <Icon icon="mdi:waves" />
              <span class="rch-chip__label">River</span>
              {{ event.riverName || "-" }}
            </span>
            <span class="rch-chip">
              <Icon icon="mdi:signal-cellular-3" />
              <span class="rch-chip__label">Level</span>
              {{ event.levelName || "-" }}
            </span>
          </div>

          <div v-if="activeCategory" class="rch-active">
            <span class="rch-active__label">Kategori aktif</span>
            {{ activeCategory }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
// Breadcrumb + hero bersama utk 5 halaman Race Category (Sprint/H2H/Slalom/
// DRR/Rafting Cross) — gaya sama dgn hero Event Detail & Home.
import sprintPng from "@/assets/images/Rectangle-3.png";
import h2hPng from "@/assets/images/Rectangle-4.png";
import slalomPng from "@/assets/images/Rectangle-4-1.png";
import drrPng from "@/assets/images/Rectangle-4-2.png";
import rxPng from "@/assets/images/Rectangle-5.png";

const RACE_ICONS = {
  SPRINT: sprintPng,
  HEAD2HEAD: h2hPng,
  SLALOM: slalomPng,
  DRR: drrPng,
  RX: rxPng,
};

export default {
  name: "RaceCategoryHero",
  props: {
    event: { type: Object, default: () => ({}) },
    raceKey: { type: String, default: "" }, // SPRINT/HEAD2HEAD/SLALOM/DRR/RX
    raceLabel: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    currentDateTime: { type: String, default: "" },
    activeCategory: { type: String, default: "" },
  },
  computed: {
    raceIcon() {
      return RACE_ICONS[this.raceKey] || "";
    },
    location() {
      const ev = this.event || {};
      const parts = [ev.addressCity, ev.addressProvince, ev.addressState]
        .map((v) => String(v || "").trim())
        .filter(Boolean);
      return parts.length ? parts.join(", ") : "-";
    },
    dateRange() {
      const ev = this.event || {};
      const fmt = (v) => {
        const d = new Date(v);
        if (!v || isNaN(d)) return "";
        return d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      };
      const a = fmt(ev.startDateEvent);
      const b = fmt(ev.endDateEvent);
      if (!a) return "";
      return b && b !== a ? `${a} – ${b}` : a;
    },
  },
};
</script>

<style scoped>
.rch {
  margin-top: 24px;
}

/* ---------- Breadcrumb + jam ---------- */
.rch-topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin: 0 3rem 14px;
}
.rch-crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
}
.rch-crumbs__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #64748b;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s ease;
}
.rch-crumbs__link:hover {
  color: #1c4c7a;
  text-decoration: none;
}
.rch-crumbs__link--event {
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}
.rch-crumbs__sep {
  color: #cbd5e1;
}
.rch-crumbs__current {
  color: #0f172a;
  font-weight: 700;
}
.rch-clock {
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
  box-shadow: 0 2px 6px rgba(15, 42, 67, 0.05);
}

/* ---------- Hero ---------- */
.rch-hero {
  position: relative;
  overflow: hidden;
}
.rch-hero__bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      100deg,
      rgba(12, 35, 60, 0.93) 0%,
      rgba(20, 62, 102, 0.82) 50%,
      rgba(37, 176, 235, 0.4) 100%
    ),
    url("https://images.unsplash.com/photo-1709810953776-ee6027ff8104?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
  background-size: cover;
  background-position: center;
}
.rch-hero__inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 28px 3rem;
  color: #fff;
}

.rch-logo {
  flex: none;
  width: 116px;
  height: 116px;
  padding: 9px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25),
    0 0 0 4px rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.rch-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
}

.rch-text {
  flex: 1;
  min-width: 0;
}
.rch-topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.rch-race {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 3px 12px 3px 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  color: #1c4c7a;
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.rch-race__icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
.rch-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12.5px;
  font-weight: 700;
}

.rch-title {
  margin: 0 0 12px;
  color: #fff;
  font-weight: 800;
  font-size: clamp(24px, 3.2vw, 36px);
  line-height: 1.12;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.35);
}

.rch-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.rch-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 5px 11px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  font-size: 13px;
  font-weight: 700;
}
.rch-chip svg {
  flex: none;
  color: #7dd3fc;
}
.rch-chip__label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.rch-active {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 13px;
  font-weight: 700;
}
.rch-active__label {
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(125, 211, 252, 0.2);
  color: #bae6fd;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

@media (max-width: 767px) {
  .rch-topbar {
    margin: 0 16px 12px;
  }
  .rch-hero__inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 22px 16px;
  }
  .rch-logo {
    width: 88px;
    height: 88px;
    border-radius: 18px;
  }
}
</style>
