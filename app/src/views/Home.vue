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

    <!-- 2) JUMBOTRON -->
    <section class="sts-jumbotron">
      <b-container>
        <b-row>
          <b-col cols="12" md="7" class="py-4">
            <h1 class="display-5 font-weight-bold mb-3">
              Sustainable Timing System
            </h1>
            <p class="lead mb-4">
              Everything you need for a successful competition.
            </p>
            <b-button
              size="md"
              variant="warning"
              class="btn-action px-4"
              @click="goTo('events')"
            >
              Explore Event
            </b-button>
          </b-col>
          <b-col
            cols="12"
            md="5"
            class="d-flex align-items-center justify-content-center mt-4 mt-md-0"
          >
            <!-- <div
              class="hero-image placeholder d-flex align-items-center justify-content-center m-5"
            >
            </div> -->
          </b-col>
        </b-row>
      </b-container>
    </section>

    <b-container class="mt-4 mb-5">
      <!-- 3) ACTION CARDS -->
      <b-row>
        <b-col cols="12" md="4" class="mb-4">
          <b-card class="action-card">
            <div class="d-flex flex-column align-items-center text-center p-2">
              <div
                class="mb-2 d-flex align-items-center justify-content-center"
              >
                <img
                  src="@/assets/images/ico-create-new-events.png"
                  alt="See all"
                  class="ml-1 icon-see-all"
                />
              </div>
              <h5 class="mb-1 mt-3 font-weight-bold">Create a new Events</h5>
              <small class="text-muted d-block mb-3">
                Define event details and set up everything competition.
              </small>
              <b-button
                variant="secondary"
                class="btn-action w-100"
                @click="goTo('create-new')"
              >
                Create Event
              </b-button>
            </div>
          </b-card>
        </b-col>

        <b-col cols="12" md="4" class="mb-4">
          <b-card class="action-card">
            <div class="d-flex flex-column align-items-center text-center p-2">
              <div
                class="mb-2 d-flex align-items-center justify-content-center"
              >
                <img
                  src="@/assets/images/ico-create-new-teams.png"
                  alt="See all"
                  class="ml-1 icon-see-all"
                />
              </div>
              <h5 class="mb-1 mt-3 font-weight-bold">Create a new Teams</h5>
              <small class="text-muted d-block mb-3">
                Add team names, members, and their roles for easy organization.
              </small>
              <b-button
                variant="secondary"
                class="btn-action btn-outline-info w-100"
                @click="goTo('team-create')"
              >
                Manage All Teams
              </b-button>
            </div>
          </b-card>
        </b-col>

        <b-col cols="12" md="4" class="mb-4">
          <b-card class="action-card">
            <div class="d-flex flex-column align-items-center text-center p-2">
              <div
                class="mb-2 d-flex align-items-center justify-content-center"
              >
                <img
                  src="@/assets/images/ico-jury-accounts.png"
                  alt="See all"
                  class="ml-1 icon-see-all"
                />
              </div>
              <h5 class="mb-1 mt-3 font-weight-bold">
                Jury's Account Management
              </h5>
              <small class="text-muted d-block mb-3">
                Management jury accounts and assign roles to manage evaluation
                efficiently.
              </small>
              <b-button
                variant="secondary"
                class="btn-action btn-outline-info w-100"
                @click="goTo('admin/users')"
              >
                Manage Accounts
              </b-button>
            </div>
          </b-card>
        </b-col>
      </b-row>

      <!-- 4) EVENTS LIST (SLIDER) -->
      <section class="d-flex align-items-center justify-content-between mb-2">
        <h5 class="font-weight-bold mb-0">Events List</h5>
        <b-button
          variant="link"
          class="see-all-link p-0"
          @click="goTo('events')"
        >
          See all
          <Icon icon="mdi:arrow-right" class="ml-1 see-all-icon" />
        </b-button>
      </section>

      <div class="cards-slider">
        <div v-if="!loading && events.length" class="slider-track">
          <article
            v-for="(ev, idx) in sortedEvents"
            :key="_idToHex(ev._id) || idx"
            class="event-card"
            :class="{ 'is-inactive': isInactive(ev) }"
            :aria-disabled="isInactive(ev)"
            :tabindex="isInactive(ev) ? -1 : 0"
            @click="onClickEvent(ev)"
          >
            <div v-if="isInactive(ev)" class="expired-overlay">
              <div class="expired-text">
                <div class="expired-title">Expired Date</div>
                <small class="expired-sub"
                  >change activated event on backdoors</small
                >
              </div>
            </div>

            <div
              class="event-thumb d-flex align-items-center justify-content-center"
            >
              <img
                :src="posterSrc(ev) || defaultImg"
                alt="Poster"
                class="event-img"
                @error="onPosterError"
              />
            </div>
            <div class="event-body">
              <div class="font-weight-bold mb-1 text-truncate">
                {{ ev.eventName || "Event Name" }}
              </div>
              <small class="text-muted d-block mb-2">
                {{ ev.riverName || "Undefined" }} -
                {{ ev.addressState || "Colorado" }},
                {{ ev.addressCity || "USA" }}
              </small>
              <div class="event-separator"></div>
              <small class="text-muted d-block">
                Date : {{ formatDateShort(ev.startDateEvent) }} –
                {{ formatDateShort(ev.endDateEvent) }}
              </small>
            </div>
          </article>
        </div>

        <div v-if="loading" class="w-100">
          <b-skeleton-img height="180px" class="mr-3 mb-3" />
          <b-skeleton-img height="180px" class="mr-3 mb-3" />
          <b-skeleton-img height="180px" class="mr-3 mb-3" />
        </div>

        <div
          v-if="!loading && !events.length"
          class="text-center text-muted py-5"
        >
          Belum ada event.
        </div>
      </div>

      <!-- 5) TEAMS REGISTERED (SLIDER) -->
      <section
        class="d-flex align-items-center justify-content-between mt-4 mb-2"
      >
        <h5 class="font-weight-bold mb-0">Teams Registered</h5>
        <b-button
          variant="link"
          class="see-all-link p-0"
          @click="goTo('team-create')"
        >
          See all
          <Icon icon="mdi:arrow-right" class="ml-1 see-all-icon" />
        </b-button>
      </section>

      <div class="cards-slider">
        <div v-if="teams.length" class="slider-track">
          <article v-for="(t, tIdx) in teams" :key="tIdx" class="team-card">
            <div class="d-flex align-items-center mb-2">
              <div
                class="team-avatar mr-2 d-flex align-items-center justify-content-center"
              >
                <Icon icon="mdi:account-circle" width="28" height="28" />
              </div>
              <div class="font-weight-bold text-truncate">{{ t.name }}</div>
            </div>
            <small class="text-muted d-block mb-3">{{ t.typeTeam }}</small>
            <b-button
              size="sm"
              variant="secondary"
              class="btn-action w-100"
              @click.stop="viewTeam(t)"
            >
              View Details
            </b-button>
          </article>
        </div>
        <div v-else class="text-center text-muted py-5">
          Belum ada team terdaftar.
        </div>
      </div>
    </b-container>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { ipcRenderer } from "electron";
import defaultImg from "@/assets/images/default-first.jpeg";

function getIpc() {
  try {
    if (typeof window !== "undefined" && window.require) {
      var e = window.require("electron");
      if (e && e.ipcRenderer) return e.ipcRenderer;
    }
  } catch (e) {}
  return null;
}

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
      currentApiBase: localStorage.getItem("network_base_url") || "",
      _unsubFlagBound: false,
    };
  },
  mounted() {
    if (window.netcfg && typeof window.netcfg.onChanged === "function") {
      window.netcfg.onChanged((pick) => {
        // simpan base yg aktif → dipakai service HTTP atau IPC
        localStorage.setItem("network_base_url", pick.apiBase || "");
        localStorage.setItem("network_realtime_url", pick.realtime || "");
        // refresh data agar ikut jaringan baru
        this.getEvents();
        this.loadTeamsRegistered();
      });
    }
    // pertama kali
    this.getEvents();
    this.loadTeamsRegistered();
  },
  computed: {
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

      const dt = new Date(inputDate); // langsung parse string "YYYY-MM-DD"
      if (isNaN(dt)) return "-"; // jaga-jaga kalau input bukan tanggal valid

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
    _applyNetworkPick(pick, source) {
      // pick: { mode, apiBase, realtime, ... }
      try {
        this.currentApiBase = pick && pick.apiBase ? pick.apiBase : "";
        localStorage.setItem("network_base_url", this.currentApiBase || "");
        localStorage.setItem(
          "network_realtime_url",
          pick && pick.realtime ? pick.realtime : ""
        );

        // feedback kecil (opsional)
        if (this.$bvToast) {
          this.$bvToast.toast(
            "Network " +
              (source === "boot" ? "ready" : "switched") +
              " → " +
              (pick.mode || "-") +
              " (" +
              (this.currentApiBase || "-") +
              ")",
            {
              title: "Network",
              variant: "info",
              solid: true,
              autoHideDelay: 1800,
            }
          );
        }

        // re-fetch data agar sesuai jaringan aktif
        this.getEvents();
        this.loadTeamsRegistered();
      } catch (e) {}
    },

    getEvents() {
      this.loading = true;
      var self = this;
      setTimeout(function () {
        const ipc = getIpc();
        if (!ipc) {
          self.loading = false;
          return;
        }
        ipc.send("get-events");
        ipc.once("get-events-reply", function (_e, data) {
          self.events = Array.isArray(data) ? data : [];
          self.loading = false;
        });
      }, 200);
    },

    loadTeamsRegistered() {
      const ipc = getIpc();
      if (!ipc) return;
      ipc.send("teams:get-all");
      ipc.once("teams:get-all-reply", (_e, res) => {
        const items =
          res && res.ok && Array.isArray(res.items) ? res.items : [];
        const grouped = items.reduce(function (acc, t) {
          var name = String(t.nameTeam || "Unknown").trim();
          var typeTeam = String(t.typeTeam || "Unknown").trim();
          var key = name + "__" + typeTeam;
          if (!acc[key])
            acc[key] = { name: name, typeTeam: typeTeam, count: 0 };
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
:root {
  --sts-blue: red;
  --sts-muted: #8793b5;
}

.btn-action {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 12px;
}

.btn-action:hover {
  background-color: #1f6fa3 !important;
  border: none;
}

/* NAVBAR */
.sts-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
}

.brand-box {
  height: 28px;
  width: 28px;
  border-radius: 6px;
  background: #e9eefb;
  color: #6b7bb6;
}

/* JUMBOTRON */
.sts-jumbotron {
  padding: 120px;
  position: relative;
  background-image: url("https://images.unsplash.com/uploads/141327328038701afeede/eda0fb7c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
  background-size: cover;
  background-position: center;
  border-bottom: 1px solid #e9edf5;
  color: #fff;
  /* agar teks tetap terlihat */
}

.sts-jumbotron::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  /* overlay hitam transparan */
  z-index: 1;
}

.sts-jumbotron > * {
  position: relative;
  z-index: 2;
  /* konten tetap di atas overlay */
}

.sts-jumbotron .hero-image {
  max-width: 100%;
  border-radius: 20px;
  /* background: #dfe7f7; */
  background-image: url("https://images.unsplash.com/photo-1709810953776-ee6027ff8104?q=40&w=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
  box-shadow: 0 6px 24px rgba(31, 51, 117, 0.08);
}

/* ACTION CARDS */
.action-card {
  border-radius: 20px;
  border: 1px solid #eef0f6;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.06); /* base tipis */
  transition: box-shadow 160ms ease, transform 160ms ease,
    border-color 160ms ease;
  will-change: transform, box-shadow;
}
.action-card:hover,
.action-card:focus-within {
  border-color: rgba(0, 180, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.1),
    0 10px 24px rgba(17, 24, 39, 0.08), 0 0 0 1px rgba(0, 180, 255, 0.18),
    0 8px 32px rgba(0, 180, 255, 0.2);
  z-index: 1;
}

.btn-secondary {
  background: #cfd6e6;
  border-color: #cfd6e6;
  color: #2b3450;
}

.btn-primary {
  background: var(--sts-blue);
  border-color: var(--sts-blue);
}

/* SLIDER (Events & Teams) */
.cards-slider {
  overflow: hidden;
}

.slider-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc(33.333% - 12px);
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x mandatory;
}

.slider-track > * {
  scroll-snap-align: start;
}

@media (min-width: 1200px) {
  .slider-track {
    grid-auto-columns: calc(25% - 12px);
  }
}

@media (max-width: 991.98px) {
  .slider-track {
    grid-auto-columns: calc(50% - 10px);
  }
}

@media (max-width: 575.98px) {
  .slider-track {
    grid-auto-columns: 85%;
  }
}

/* EVENT CARD */
/* Pastikan semua card punya tinggi seragam */
.event-card {
  position: relative; /* ADD */
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #dfe5f2;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(44, 92, 255, 0.06);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease,
    filter 0.12s ease;
}

/* state Inactive: gelap, tidak bisa di-hover/klik */
.event-card.is-inactive {
  filter: grayscale(1);
  opacity: 0.55;
  pointer-events: none; /* disable klik & hover */
  cursor: not-allowed;
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
}

/* overlay tulisan Expired di tengah card */
.expired-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column; /* biar stacked */
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 12px;
  font-weight: 700;
  font-size: 1.1rem;
  text-transform: uppercase;
  color: #fff;
  background: rgba(0, 0, 0, 0.38);
  z-index: 3;
}

.expired-text .expired-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.expired-text .expired-sub {
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: none;
  opacity: 0.9;
}

/* optional: matikan efek zoom gambar ketika inactive */
.event-card.is-inactive .event-img:hover {
  transform: none;
}

.event-card:hover {
  border-color: rgba(0, 180, 255, 0.6);
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.1),
    0 10px 24px rgba(17, 24, 39, 0.08), 0 0 0 1px rgba(0, 180, 255, 0.18),
    0 8px 32px rgba(0, 180, 255, 0.2);
  z-index: 1;
}

/* Bagian gambar tetap fix */
.event-thumb {
  height: 160px;
  /* lebih kecil biar space text cukup */
  background: #e8edf6;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  flex-shrink: 0;
}

/* Bagian body isi teks fleksibel */
.event-body {
  flex-grow: 1;
  /* isi text isi space sisa */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* biar badge tetap di bawah */
  padding: 12px 18px 18px;
}

/* Pastikan teks rapi */
.event-body small {
  line-height: 1.5;
  display: block;
}

/* TEAM CARD */
.team-card {
  border: 1px solid #dfe5f2;
  border-radius: 12px;
  background: #fff;
  padding: 14px;
  box-shadow: 0 6px 18px rgba(44, 92, 255, 0.06);
}

.team-card:hover {
  border-color: rgba(0, 180, 255, 0.6);
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.1),
    0 10px 24px rgba(17, 24, 39, 0.08), 0 0 0 1px rgba(0, 180, 255, 0.18),
    0 8px 32px rgba(0, 180, 255, 0.2);
  z-index: 1;
}

.team-avatar {
  height: 40px;
  width: 40px;
  border-radius: 999px;
  background: #eff3ff;
  color: #5da0da;
}

/* FOOTER */
/* .sts-footer{ border-top:1px solid #e6eaf2; background:#eef3f7; } */

/* MISC */
.placeholder {
  color: #8793b5;
}

.event-thumb {
  width: 100%;
  height: 180px;
  overflow: hidden;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-img {
  width: 100%;
  height: 100%;
  border-radius: 8%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.6s ease;
}
.event-img:hover {
  transform: scale(1.2);
}

.event-separator {
  border-top: 1px solid #e0e6f0;
  margin: 6px 0;
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
  pointer-events: auto; /* visible => tangkap klik */
}

.intro-overlay.intro-hide {
  animation: introFadeOut 400ms ease-in forwards;
  pointer-events: none; /* ⬅️ klik langsung tembus saat hide */
}

/* latar glowing lembut */
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
