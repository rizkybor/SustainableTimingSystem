<template>
  <div class="sts-page">
    <!-- INTRO OVERLAY: muncul hanya sekali per sesi -->
    <div
      v-if="showIntro"
      class="intro-overlay"
      :class="{ 'intro-hide': introHiding }"
      role="dialog"
      aria-modal="true"
      aria-label="Opening"
      @animationend.self="onIntroAnimEnd"
    >
      <div class="intro-glow-bg"></div>

      <div class="intro-box">
        <img src="@/assets/icons/icon.png" alt="App Logo" class="intro-logo" />
        <h2 class="intro-title">Sustainable Timing System</h2>
        <p class="intro-sub">Preparing your workspace…</p>

        <div class="intro-progress">
          <div class="bar"></div>
        </div>

        <button class="intro-skip" @click="hideIntro()">Skip</button>
      </div>
    </div>

    <!-- HERO -->
    <section class="home-hero">
      <div class="home-hero__bg"></div>
      <b-container class="home-hero__inner">
        <b-row class="align-items-center">
          <b-col cols="12" lg="7" class="py-2">
            <span class="home-hero__eyebrow">
              <Icon icon="mdi:timer-outline" class="mr-1" />
              Timing &amp; Scoring · FAJI Unofficial
            </span>
            <h1 class="home-hero__title">Sustainable Timing System</h1>
            <p class="home-hero__lead">
              Everything you need for a successful competition — dari
              registrasi tim, timing RaceTime2, penalty juri realtime, sampai
              hasil resmi.
            </p>
            <div class="home-hero__cta">
              <button type="button" class="hero-btn hero-btn--primary" @click="goTo('events')">
                <Icon icon="mdi:calendar-search" />
                Explore Events
              </button>
              <button type="button" class="hero-btn hero-btn--ghost" @click="goTo('create-new')">
                <Icon icon="mdi:plus" />
                Create Event
              </button>
            </div>
          </b-col>

          <!-- Statistik ringkas -->
          <b-col cols="12" lg="5" class="mt-4 mt-lg-0">
            <div class="hero-stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ loading ? "–" : activeEventCount }}</span>
                <span class="hero-stat__label">Event Aktif</span>
              </div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ loading ? "–" : events.length }}</span>
                <span class="hero-stat__label">Total Event</span>
              </div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ teams.length }}</span>
                <span class="hero-stat__label">Tim Terdaftar</span>
              </div>
              <div
                class="hero-stat hero-stat--wide"
                :class="{ 'hero-stat--clickable': !!nextEvent }"
                @click="nextEvent && onClickEvent(nextEvent.ev)"
              >
                <span class="hero-stat__label">Event Terdekat</span>
                <template v-if="nextEvent">
                  <span class="hero-stat__name">{{ nextEvent.ev.eventName || "-" }}</span>
                  <span class="hero-stat__meta">
                    <span class="status-dot" :class="'status-dot--' + nextEvent.status.key"></span>
                    {{ nextEvent.status.text }} ·
                    {{ formatDateShort(nextEvent.ev.startDateEvent) }}
                  </span>
                </template>
                <span v-else class="hero-stat__meta">
                  {{ loading ? "Memuat…" : "Belum ada event aktif" }}
                </span>
              </div>
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>

    <b-container class="home-body">
      <!-- QUICK ACTIONS -->
      <div class="section-head">
        <h5 class="section-head__title">Quick Actions</h5>
      </div>
      <div class="quick-grid">
        <button type="button" class="quick-card" @click="goTo('create-new')">
          <span class="quick-card__icon">
            <img src="@/assets/images/ico-create-new-events.png" alt="" />
          </span>
          <span class="quick-card__text">
            <span class="quick-card__title">Create a new Event</span>
            <span class="quick-card__desc">Atur detail event & seluruh kebutuhan kompetisi.</span>
          </span>
          <Icon icon="mdi:chevron-right" class="quick-card__chev" />
        </button>

        <button type="button" class="quick-card" @click="goTo('team-create')">
          <span class="quick-card__icon">
            <img src="@/assets/images/ico-create-new-teams.png" alt="" />
          </span>
          <span class="quick-card__text">
            <span class="quick-card__title">Manage All Teams</span>
            <span class="quick-card__desc">Tambah tim, tipe tim, dan negara — satu per satu atau import Excel.</span>
          </span>
          <Icon icon="mdi:chevron-right" class="quick-card__chev" />
        </button>

        <button type="button" class="quick-card" @click="goTo('admin/users')">
          <span class="quick-card__icon">
            <img src="@/assets/images/ico-jury-accounts.png" alt="" />
          </span>
          <span class="quick-card__text">
            <span class="quick-card__title">Jury's Account Management</span>
            <span class="quick-card__desc">Kelola akun juri & assignment tugasnya per event.</span>
          </span>
          <Icon icon="mdi:chevron-right" class="quick-card__chev" />
        </button>

        <button type="button" class="quick-card quick-card--dev" @click="goTo('si-test')">
          <span class="quick-card__icon quick-card__icon--glyph">
            <Icon icon="mdi:card-account-details-outline" width="26" height="26" />
          </span>
          <span class="quick-card__text">
            <span class="quick-card__title">
              SI Card Reader Test
              <span class="quick-card__tag">temp</span>
            </span>
            <span class="quick-card__desc">Percobaan integrasi SPORTident card reader (dev only).</span>
          </span>
          <Icon icon="mdi:chevron-right" class="quick-card__chev" />
        </button>
      </div>

      <!-- EVENTS LIST (SLIDER) -->
      <div class="section-head mt-5">
        <h5 class="section-head__title">
          Events List
          <span v-if="!loading && events.length" class="section-head__count">{{ events.length }}</span>
        </h5>
        <b-button variant="link" class="see-all-link p-0" @click="goTo('events')">
          See all
          <Icon icon="mdi:arrow-right" class="ml-1 see-all-icon" />
        </b-button>
      </div>

      <div class="cards-slider">
        <div v-if="!loading && events.length" class="slider-track">
          <article
            v-for="(ev, idx) in sortedEvents"
            :key="_idToHex(ev._id) || idx"
            class="event-card"
            :class="{ 'is-inactive': isInactive(ev) }"
            :aria-disabled="isInactive(ev)"
            :tabindex="isInactive(ev) ? -1 : 0"
            :title="isInactive(ev) ? 'Event inactive — aktifkan lewat backdoor' : ''"
            @click="onClickEvent(ev)"
            @keydown.enter="onClickEvent(ev)"
          >
            <div class="event-thumb">
              <img
                :src="posterSrc(ev) || defaultImg"
                alt="Poster"
                class="event-img"
                @error="onPosterError"
              />
              <span class="event-status" :class="'event-status--' + eventStatus(ev).key">
                <span class="status-dot" :class="'status-dot--' + eventStatus(ev).key"></span>
                {{ eventStatus(ev).text }}
              </span>
            </div>
            <div class="event-body">
              <div class="event-title">{{ ev.eventName || "Event Name" }}</div>
              <div class="event-meta">
                <Icon icon="mdi:map-marker-outline" />
                <span class="text-truncate">{{ eventLocation(ev) }}</span>
              </div>
              <div class="event-meta">
                <Icon icon="mdi:calendar-blank-outline" />
                <span>
                  {{ formatDateShort(ev.startDateEvent) }} –
                  {{ formatDateShort(ev.endDateEvent) }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <div v-if="loading" class="slider-track">
          <div v-for="n in 4" :key="'sk-' + n" class="event-card event-card--skeleton">
            <b-skeleton-img height="150px" no-aspect />
            <div class="event-body">
              <b-skeleton width="80%" />
              <b-skeleton width="60%" />
              <b-skeleton width="50%" />
            </div>
          </div>
        </div>

        <div v-if="!loading && !events.length" class="empty-state">
          <Icon icon="mdi:calendar-remove-outline" width="34" height="34" />
          <div>Belum ada event.</div>
          <button type="button" class="hero-btn hero-btn--soft mt-2" @click="goTo('create-new')">
            <Icon icon="mdi:plus" /> Create Event
          </button>
        </div>
      </div>

      <!-- TEAMS REGISTERED (SLIDER) -->
      <div class="section-head mt-5">
        <h5 class="section-head__title">
          Teams Registered
          <span v-if="teams.length" class="section-head__count">{{ teams.length }}</span>
        </h5>
        <b-button variant="link" class="see-all-link p-0" @click="goTo('team-create')">
          See all
          <Icon icon="mdi:arrow-right" class="ml-1 see-all-icon" />
        </b-button>
      </div>

      <div class="cards-slider">
        <div v-if="teams.length" class="slider-track slider-track--teams">
          <article
            v-for="(t, tIdx) in teams"
            :key="tIdx"
            class="team-card"
            tabindex="0"
            @click="viewTeam(t)"
            @keydown.enter="viewTeam(t)"
          >
            <span class="team-avatar" :style="{ background: avatarColor(t.name) }">
              {{ initials(t.name) }}
            </span>
            <div class="team-info">
              <div class="team-name" :title="t.name">{{ t.name }}</div>
              <span class="team-type">{{ t.typeTeam }}</span>
            </div>
            <Icon icon="mdi:chevron-right" class="team-chev" />
          </article>
        </div>
        <div v-else class="empty-state">
          <Icon icon="mdi:account-group-outline" width="34" height="34" />
          <div>Belum ada team terdaftar.</div>
          <button type="button" class="hero-btn hero-btn--soft mt-2" @click="goTo('team-create')">
            <Icon icon="mdi:plus" /> Tambah Team
          </button>
        </div>
      </div>
    </b-container>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { ipcRenderer } from "electron";
import defaultImg from "@/assets/images/default-first.jpeg";

export default {
  name: "SustainableTimingSystemHome",
  components: { Icon },
  data() {
    return {
      showIntro: false,
      introHiding: false,
      events: [],
      loading: false,
      teams: [],
      defaultImg,
    };
  },
  mounted() {
    const KEY = "sts_home_visited_session";
    const firstVisitThisSession = !sessionStorage.getItem(KEY);

    if (firstVisitThisSession) {
      this.showIntro = true;
      sessionStorage.setItem(KEY, "1");
      setTimeout(() => this.hideIntro(), 5000);
    }
    this.getEvents();
    this.loadTeamsRegistered();
  },
  computed: {
    activeEventCount() {
      return (this.events || []).filter((ev) => !this.isInactive(ev)).length;
    },
    // Event aktif terdekat utk kartu "Event Terdekat" di hero: yang sedang
    // berlangsung dulu, lalu upcoming paling dekat.
    nextEvent() {
      const rank = { live: 0, upcoming: 1 };
      const list = (this.events || [])
        .filter((ev) => !this.isInactive(ev))
        .map((ev) => ({ ev, status: this.eventStatus(ev) }))
        .filter((x) => x.status.key in rank);
      list.sort((a, b) => {
        if (rank[a.status.key] !== rank[b.status.key]) {
          return rank[a.status.key] - rank[b.status.key];
        }
        return (
          new Date(a.ev.startDateEvent).getTime() -
          new Date(b.ev.startDateEvent).getTime()
        );
      });
      return list[0] || null;
    },
    sortedEvents() {
      var now = new Date();

      function parseDate(v) {
        if (!v) return null;
        var d = new Date(v);
        if (isNaN(d)) return null;
        return d;
      }

      function isActivated(ev) {
        var st = ev && ev.statusEvent ? String(ev.statusEvent) : "";
        return st.toLowerCase() === "activated";
      }

      function startAt(ev) {
        return parseDate(ev && ev.startDateEvent ? ev.startDateEvent : null);
      }

      // clone array
      var arr = Array.isArray(this.events) ? this.events.slice() : [];

      arr.sort(function (a, b) {
        var aActivated = isActivated(a);
        var bActivated = isActivated(b);

        // Activated di depan, Inactive di belakang
        if (aActivated && !bActivated) return -1;
        if (!aActivated && bActivated) return 1;

        // Keduanya Activated → urut berdasarkan kedekatan ke hari ini
        if (aActivated && bActivated) {
          var sa = startAt(a);
          var sb = startAt(b);

          var saDiff = sa
            ? Math.abs(sa.getTime() - now.getTime())
            : Number.POSITIVE_INFINITY;
          var sbDiff = sb
            ? Math.abs(sb.getTime() - now.getTime())
            : Number.POSITIVE_INFINITY;

          if (saDiff !== sbDiff) return saDiff - sbDiff;

          // tie-breaker 1: prioritaskan future (>= today)
          var saFuture = sa ? (sa.getTime() >= now.getTime() ? 0 : 1) : 1;
          var sbFuture = sb ? (sb.getTime() >= now.getTime() ? 0 : 1) : 1;
          if (saFuture !== sbFuture) return saFuture - sbFuture;

          // tie-breaker 2: startDate ASC
          var saNum = sa ? sa.getTime() : Number.POSITIVE_INFINITY;
          var sbNum = sb ? sb.getTime() : Number.POSITIVE_INFINITY;
          return saNum - sbNum;
        }

        // Keduanya Inactive → pertahankan urutan asli
        return 0;
      });

      return arr;
    },
  },
  methods: {
    hideIntro() {
      // mulai animasi keluar + nonaktifkan interaksi
      this.introHiding = true;

      // fallback: kalau animationend tidak datang, force remove
      clearTimeout(this._introKillTimer);
      this._introKillTimer = setTimeout(() => {
        this.showIntro = false;
      }, 600); // > durasi introFadeOut (400ms)
    },
    onIntroAnimEnd() {
      if (this.introHiding) {
        this.showIntro = false;
      }
    },
    formatDateShort(inputDate) {
      if (!inputDate) return "-";

      var dt = new Date(inputDate);
      if (isNaN(dt)) return "-";

      var monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];

      var day = String(dt.getDate()).padStart(2, "0");
      var month = monthNames[dt.getMonth()];
      var year = dt.getFullYear();

      return day + " " + month + " " + year;
    },
    // Status tampilan event: inactive (statusEvent bukan "activated"),
    // live (hari ini di antara start..end), upcoming, atau done.
    eventStatus(ev) {
      if (this.isInactive(ev)) return { key: "inactive", text: "Inactive" };
      const start = new Date(ev.startDateEvent);
      const end = new Date(ev.endDateEvent || ev.startDateEvent);
      if (isNaN(start)) return { key: "upcoming", text: "Upcoming" };
      const now = new Date();
      const dayStart = new Date(start);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(isNaN(end) ? start : end);
      dayEnd.setHours(23, 59, 59, 999);
      if (now >= dayStart && now <= dayEnd) {
        return { key: "live", text: "Berlangsung" };
      }
      if (now < dayStart) {
        const days = Math.ceil((dayStart - now) / 86400000);
        return {
          key: "upcoming",
          text: days <= 1 ? "Besok" : `${days} hari lagi`,
        };
      }
      return { key: "done", text: "Selesai" };
    },
    eventLocation(ev) {
      const parts = [ev.riverName, ev.addressCity, ev.addressState]
        .map((v) => String(v || "").trim())
        .filter(Boolean);
      return parts.length ? parts.join(" · ") : "Lokasi belum diisi";
    },
    initials(name) {
      const words = String(name || "?").trim().split(/\s+/);
      return (
        (words[0] || "?").charAt(0) + (words[1] ? words[1].charAt(0) : "")
      ).toUpperCase();
    },
    // Warna avatar stabil per nama tim (hash sederhana -> palet brand).
    avatarColor(name) {
      const palette = [
        "linear-gradient(135deg,#1c4c7a,#25b0eb)",
        "linear-gradient(135deg,#0f766e,#2dd4bf)",
        "linear-gradient(135deg,#7c3aed,#a78bfa)",
        "linear-gradient(135deg,#c2410c,#fb923c)",
        "linear-gradient(135deg,#be123c,#fb7185)",
        "linear-gradient(135deg,#1d4ed8,#60a5fa)",
      ];
      let h = 0;
      const str = String(name || "");
      for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
      return palette[h % palette.length];
    },
    isInactive(ev) {
      var st = ev && ev.statusEvent ? String(ev.statusEvent) : "";
      return st.toLowerCase() !== "activated";
    },

    onClickEvent(ev) {
      if (this.isInactive(ev)) return; // blok klik utk Inactive
      this.clickRow(ev);
    },
    posterSrc: function (ev) {
      if (!ev) return "";

      // prioritas 1: field yang sudah kamu simpan
      if (
        ev.poster &&
        ev.poster.secure_url &&
        String(ev.poster.secure_url) !== ""
      )
        return String(ev.poster.secure_url);

      // prioritas 2: poster_url langsung (kalau kamu simpan juga)
      if (ev.poster_url && String(ev.poster_url) !== "")
        return String(ev.poster_url);

      // prioritas 3: bangun dari metadata (jaga-jaga)
      var p = ev.poster || {};
      var cloud = "kikiaka"; // ganti sesuai CLOUDINARY_CLOUD_NAME kamu
      var pub = p.public_id ? String(p.public_id) : "";
      if (pub === "") return "";
      var ver =
        p.version !== undefined && p.version !== null
          ? "v" + p.version + "/"
          : "";
      var ext = p.format ? "." + String(p.format) : "";
      return (
        "https://res.cloudinary.com/" +
        cloud +
        "/image/upload/" +
        ver +
        pub +
        ext
      );
    },

    onPosterError: function (e) {
      if (e && e.target) {
        e.target.onerror = null;
        e.target.src = this.defaultImg;
      }
    },
    _idToHex(_id) {
      return typeof _id === "string" ? _id : "";
    },
    formatDate(inputDate) {
      if (!inputDate) return "-";

      const dt = new Date(inputDate);
      if (isNaN(dt)) return "-";

      const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];

      const day = String(dt.getDate()).padStart(2, "0");
      const month = monthNames[dt.getMonth()];
      const year = dt.getFullYear();

      return `${day} ${month} ${year}`;
    },
    getEvents() {
      this.loading = true;
      var self = this;
      setTimeout(function () {
        ipcRenderer.send("get-events");
        ipcRenderer.once("get-events-reply", function (_e, data) {
          self.events = Array.isArray(data) ? data : [];
          self.loading = false;
        });
      }, 400);
    },
    loadTeamsRegistered() {
      ipcRenderer.send("teams:get-all");
      ipcRenderer.once("teams:get-all-reply", (_e, res) => {
        const items =
          res && res.ok && Array.isArray(res.items) ? res.items : [];

        const grouped = items.reduce((acc, t) => {
          const name = String(t.nameTeam || "Unknown").trim();
          const typeTeam = String(t.typeTeam || "Unknown").trim();
          const key = `${name}__${typeTeam}`;

          if (!acc[key]) {
            acc[key] = { name, typeTeam, count: 0 };
          }
          acc[key].count += 1;
          return acc;
        }, {});

        this.teams = Object.values(grouped);
      });
    },
    goTo(path) {
      if (!path) return this.$router.push("/");
      this.$router.push("/" + path);
    },
    clickRow(item) {
      const idHex = this._idToHex(item._id);
      this.$router.push("/event-detail/" + idHex);
    },
    viewTeam(team) {
      this.$router.push("/team?name=" + encodeURIComponent(team.name));
    },
  },
};
</script>

<!-- PLAIN CSS (NO SCSS) -->
<style scoped>
/* ===================== HOME (redesign) =====================
   Palet brand sama dgn halaman lain (#1c4c7a navy, #25b0eb sky). */

.sts-page {
  background: #f5f8fc;
  min-height: 100%;
  padding-bottom: 48px;
}

/* ---------- HERO ---------- */
.home-hero {
  position: relative;
  overflow: hidden;
  color: #fff;
  padding: 56px 0;
}
.home-hero__bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      100deg,
      rgba(12, 35, 60, 0.92) 0%,
      rgba(20, 62, 102, 0.8) 45%,
      rgba(37, 176, 235, 0.35) 100%
    ),
    url("https://images.unsplash.com/uploads/141327328038701afeede/eda0fb7c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
  background-size: cover;
  background-position: center;
}
.home-hero__inner {
  position: relative;
}
.home-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
}
.home-hero__title {
  margin: 16px 0 10px;
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.home-hero__lead {
  max-width: 560px;
  margin-bottom: 26px;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
}
.home-hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.18s ease,
    background-color 0.18s ease, filter 0.18s ease;
}
.hero-btn:active {
  transform: translateY(1px);
}
.hero-btn--primary {
  background: linear-gradient(135deg, #25b0eb, #1c8fc7);
  color: #fff;
  box-shadow: 0 8px 22px rgba(37, 176, 235, 0.4);
}
.hero-btn--primary:hover {
  filter: brightness(1.07);
  box-shadow: 0 10px 26px rgba(37, 176, 235, 0.5);
}
.hero-btn--ghost {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
}
.hero-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.18);
}
.hero-btn--soft {
  height: 38px;
  padding: 0 16px;
  background: #e6f4fd;
  color: #1c4c7a;
  border-color: #cfe4fb;
}
.hero-btn--soft:hover {
  background: #d7edfb;
}

/* Statistik (glass cards) */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
}
.hero-stat--wide {
  grid-column: 1 / -1;
}
.hero-stat--clickable {
  cursor: pointer;
  transition: background-color 0.18s ease;
}
.hero-stat--clickable:hover {
  background: rgba(255, 255, 255, 0.16);
}
.hero-stat__value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.hero-stat__label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}
.hero-stat__name {
  margin-top: 4px;
  font-size: 17px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hero-stat__meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

/* ---------- STATUS DOT (dipakai hero & kartu event) ---------- */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
  background: #94a3b8;
}
.status-dot--live {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
  animation: home-pulse 1.8s ease-in-out infinite;
}
.status-dot--upcoming {
  background: #38bdf8;
}
.status-dot--done {
  background: #94a3b8;
}
.status-dot--inactive {
  background: #ef4444;
}
@keyframes home-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.08);
  }
}

/* ---------- BODY / SECTION HEAD ---------- */
.home-body {
  margin-top: 28px;
  position: relative;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-head__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-weight: 800;
  font-size: 1.1rem;
  color: #0f172a;
}
.section-head__count {
  padding: 2px 9px;
  border-radius: 999px;
  background: #e6f4fd;
  color: #1c4c7a;
  font-size: 12px;
  font-weight: 800;
}

/* ---------- QUICK ACTIONS ---------- */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  text-align: left;
  border-radius: 16px;
  border: 1px solid #e6edf6;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 42, 67, 0.08);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease,
    border-color 0.15s ease;
}
.quick-card:hover {
  transform: translateY(-3px);
  border-color: #b9d7f0;
  box-shadow: 0 14px 30px rgba(15, 42, 67, 0.14);
}
.quick-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 176, 235, 0.4);
}
.quick-card__icon {
  flex: none;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eaf6ff, #dcefff);
  display: flex;
  align-items: center;
  justify-content: center;
}
.quick-card__icon img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}
.quick-card__icon--glyph {
  color: #1c4c7a;
}
.quick-card__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.quick-card__title {
  font-weight: 800;
  font-size: 14px;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.quick-card__desc {
  font-size: 12px;
  line-height: 1.45;
  color: #64748b;
}
.quick-card__tag {
  padding: 1px 7px;
  border-radius: 6px;
  background: #fef3c7;
  color: #b45309;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}
.quick-card__chev {
  flex: none;
  font-size: 20px;
  color: #94a3b8;
  transition: transform 0.15s ease, color 0.15s ease;
}
.quick-card:hover .quick-card__chev {
  transform: translateX(3px);
  color: #25b0eb;
}
.quick-card--dev {
  border-style: dashed;
}

/* ---------- SLIDER ---------- */
.cards-slider {
  position: relative;
}
.slider-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc((100% - 3 * 16px) / 4);
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 4px 2px 14px;
  scrollbar-width: thin;
}
.slider-track > * {
  scroll-snap-align: start;
}
.slider-track--teams {
  grid-auto-columns: calc((100% - 4 * 12px) / 5);
  gap: 12px;
}

/* ---------- EVENT CARD ---------- */
.event-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid #e6edf6;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(15, 42, 67, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.event-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(15, 42, 67, 0.14);
}
.event-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 176, 235, 0.4);
}
.event-card.is-inactive {
  cursor: not-allowed;
}
.event-card.is-inactive:hover {
  transform: none;
  box-shadow: 0 6px 18px rgba(15, 42, 67, 0.06);
}
.event-card.is-inactive .event-img {
  filter: grayscale(1) brightness(0.85);
}
.event-card.is-inactive .event-body {
  opacity: 0.6;
}
.event-card--skeleton {
  cursor: default;
}

.event-thumb {
  position: relative;
  height: 150px;
  background: #e8edf6;
  overflow: hidden;
}
.event-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}
.event-card:not(.is-inactive):hover .event-img {
  transform: scale(1.05);
}
.event-status {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 11.5px;
  font-weight: 800;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.event-status--inactive {
  color: #b91c1c;
}

.event-body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 14px 14px;
}
.event-title {
  font-weight: 800;
  font-size: 14.5px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.event-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 12.5px;
  color: #64748b;
}
.event-meta svg {
  flex: none;
  color: #94a3b8;
}

/* ---------- TEAM CARD ---------- */
.team-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid #e6edf6;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(15, 42, 67, 0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease,
    border-color 0.15s ease;
}
.team-card:hover {
  transform: translateY(-2px);
  border-color: #b9d7f0;
  box-shadow: 0 10px 22px rgba(15, 42, 67, 0.1);
}
.team-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 176, 235, 0.4);
}
.team-avatar {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.team-info {
  flex: 1;
  min-width: 0;
}
.team-name {
  font-weight: 800;
  font-size: 13.5px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.team-type {
  display: inline-block;
  margin-top: 3px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
}
.team-chev {
  flex: none;
  color: #cbd5e1;
  font-size: 18px;
}
.team-card:hover .team-chev {
  color: #25b0eb;
}

/* ---------- EMPTY STATE ---------- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 36px 16px;
  border: 1px dashed #dbe3ee;
  border-radius: 16px;
  background: #fafcff;
  color: #94a3b8;
  font-size: 14px;
}

/* ---------- RESPONSIVE ---------- */
@media (max-width: 1199.98px) {
  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .slider-track--teams {
    grid-auto-columns: calc((100% - 3 * 12px) / 4);
  }
}
@media (max-width: 991.98px) {
  .home-hero {
    padding: 40px 0 56px;
  }
  .slider-track {
    grid-auto-columns: calc((100% - 2 * 16px) / 3);
  }
  .slider-track--teams {
    grid-auto-columns: calc((100% - 2 * 12px) / 3);
  }
}
@media (max-width: 767.98px) {
  .slider-track {
    grid-auto-columns: calc((100% - 16px) / 2);
  }
  .slider-track--teams {
    grid-auto-columns: calc((100% - 12px) / 2);
  }
}
@media (max-width: 575.98px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
  .hero-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .slider-track,
  .slider-track--teams {
    grid-auto-columns: 82%;
  }
}

/* ===== Intro fullscreen ===== */
.intro-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  overflow: hidden;
  animation: introFadeIn 300ms ease-out both;
  pointer-events: auto;
}

.intro-overlay.intro-hide {
  animation: introFadeOut 400ms ease-in forwards;
  pointer-events: none;
}

.intro-glow-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
      1200px 600px at 20% 30%,
      rgba(66, 153, 225, 0.22),
      transparent 60%
    ),
    radial-gradient(
      900px 500px at 80% 70%,
      rgba(99, 102, 241, 0.2),
      transparent 60%
    ),
    linear-gradient(180deg, #0f172a, #0b1220 40%, #0b1220);
  filter: blur(0.2px);
}

/* kartu intro */
.intro-box {
  position: relative;
  width: min(680px, 92vw);
  padding: 28px 28px 22px;
  text-align: center;
  border-radius: 22px;
  background: rgba(16, 24, 40, 0.78);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 10px 40px rgba(2, 8, 23, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  color: #e5e7eb;
  animation: introLift 380ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.intro-logo {
  width: 84px;
  height: 84px;
  object-fit: contain;
  margin-bottom: 10px;
  filter: drop-shadow(0 6px 18px rgba(59, 130, 246, 0.35));
}

.intro-title {
  margin: 0 0 6px;
  font-size: clamp(18px, 3.3vw, 26px);
  font-weight: 800;
  letter-spacing: 0.2px;
}

.intro-sub {
  margin: 0 0 16px;
  font-size: 14px;
  color: #cbd5e1;
  opacity: 0.9;
}

/* progress bar anim */
.intro-progress {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
  margin: 0 auto 14px;
  width: min(460px, 86%);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
}
.intro-progress .bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0%;
  background: linear-gradient(90deg, #60a5fa, #22d3ee, #a78bfa);
  animation: introBar 5s ease-in-out forwards; /* sebelumnya 1.4s */
  border-radius: 999px;
  box-shadow: 0 0 14px rgba(96, 165, 250, 0.55),
    0 0 22px rgba(34, 211, 238, 0.35);
}

/* tombol skip */
.intro-skip {
  margin-top: 6px;
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #cbd5e1;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.18s ease;
}
.intro-skip:hover {
  border-color: transparent;
  color: #0b1220;
  background: #e2e8f0;
}

/* ===== Keyframes ===== */
@keyframes introFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes introFadeOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.985);
  }
}
@keyframes introLift {
  from {
    transform: translateY(10px) scale(0.985);
    opacity: 0.8;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
@keyframes introBar {
  0% {
    width: 0%;
  }
  60% {
    width: 86%;
  }
  100% {
    width: 100%;
  }
}

/* responsive kecil */
@media (max-width: 480px) {
  .intro-box {
    padding: 22px 18px 18px;
  }
  .intro-logo {
    width: 68px;
    height: 68px;
  }
}

/* see all styling  */
.see-all-link {
  position: relative;
  padding: 0; /* rapih seperti link */
  font-weight: 700;
  color: #0d789d; /* brand biru */
  text-decoration: none !important;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 160ms ease;
}

.see-all-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  height: 2px;
  width: 100%;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms ease;
  opacity: 0.85;
}

/* ikon panah geser sedikit saat hover/focus */
.see-all-icon {
  transition: transform 180ms ease;
}

.see-all-link:hover,
.see-all-link:focus,
.see-all-link:focus-visible {
  color: #095a73; /* sedikit lebih gelap saat hover */
  outline: none;
}

.see-all-link:hover::after,
.see-all-link:focus::after,
.see-all-link:focus-visible::after {
  transform: scaleX(1);
}

.see-all-link:hover .see-all-icon,
.see-all-link:focus .see-all-icon {
  transform: translateX(3px);
}

/* state disabled (kalau suatu saat dipakai) */
.see-all-link.disabled,
.see-all-link[disabled] {
  color: #9aa9c2 !important;
  pointer-events: none;
}

/* dukungan dark background (opsional) */
.dark .see-all-link {
  color: #7dd3fc;
}
.dark .see-all-link:hover {
  color: #38bdf8;
}

/* prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .see-all-link,
  .see-all-icon,
  .see-all-link::after {
    transition: none;
  }
}
</style>
