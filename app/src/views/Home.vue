<template>
  <div class="sts-page">
    <!-- 1) NAVBAR -->
    <!-- <b-navbar toggleable="lg" type="light" variant="white" class="sts-navbar shadow-sm">
      <b-container>
        <b-navbar-brand class="d-flex align-items-center">
          <div class="brand-box mr-2 d-flex align-items-center justify-content-center">
            <Icon icon="mdi:image" width="18" height="18" />
          </div>
          <span class="font-weight-bold">Sustainable Timing System</span>
        </b-navbar-brand>

        <b-navbar-toggle target="main-nav"></b-navbar-toggle>

        <b-collapse id="main-nav" is-nav>
          <b-navbar-nav class="ml-3">
            <b-nav-item @click="goTo('')" active>Home</b-nav-item>
            <b-nav-item @click="goTo('events')">Events</b-nav-item>
            <b-nav-item @click="goTo('team')">Team</b-nav-item>
          </b-navbar-nav>

          <b-navbar-nav class="ml-auto">
            <b-nav-item @click="goTo('login')">Login/Create account</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </b-container>
    </b-navbar> -->

    <!-- 2) JUMBOTRON -->
    <section class="sts-jumbotron">
      <b-container>
        <b-row>
          <b-col cols="12" md="7" class="py-4">
            <h1 class="display-5 font-weight-bold mb-3">
              Sustainable Timing System
            </h1>
            <p class="lead text-muted mb-4">
              Everything you need for a successful competition.
            </p>
            <b-button
              size="md"
              variant="primary"
              class="rounded-pill px-4"
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
            <div
              class="hero-image placeholder d-flex align-items-center justify-content-center"
            >
              <Icon icon="mdi:image" width="64" height="64" />
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>

    <b-container class="mt-4 mb-5">
      <!-- 3) ACTION CARDS -->
      <b-row>
        <b-col cols="12" md="6" class="mb-4">
          <b-card class="action-card shadow-sm">
            <div class="d-flex flex-column align-items-center text-center">
              <div
                class="action-icon mb-2 d-flex align-items-center justify-content-center"
              >
                <Icon icon="ic:baseline-add-circle" width="36" height="36" />
              </div>
              <h5 class="mb-1 font-weight-bold">Create a new Event</h5>
              <small class="text-muted d-block mb-3">
                Define event details and set up everything competition.
              </small>
              <b-button
                variant="secondary"
                class="w-100 rounded-pill"
                @click="goTo('create-new')"
              >
                Create Event
              </b-button>
            </div>
          </b-card>
        </b-col>

        <b-col cols="12" md="6" class="mb-4">
          <b-card class="action-card shadow-sm">
            <div class="d-flex flex-column align-items-center text-center">
              <div
                class="action-icon mb-2 d-flex align-items-center justify-content-center"
              >
                <Icon icon="mdi:account-group" width="36" height="36" />
              </div>
              <h5 class="mb-1 font-weight-bold">Create a new Teams</h5>
              <small class="text-muted d-block mb-3">
                Add team names, members, and their roles for easy organization.
              </small>
              <b-button
                variant="secondary"
                class="w-100 rounded-pill"
                @click="goTo('team-create')"
              >
                Create Team
              </b-button>
            </div>
          </b-card>
        </b-col>
      </b-row>

      <!-- 4) EVENTS LIST (SLIDER) -->
      <section class="d-flex align-items-center justify-content-between mb-2">
        <h5 class="font-weight-bold mb-0">Events List</h5>
        <b-button variant="link" class="p-0" @click="goTo('events')">
          See all
          <Icon icon="mdi:arrow-right" class="ml-1" />
        </b-button>
      </section>

      <div class="cards-slider">
        <div v-if="!loading && events.length" class="slider-track">
          <article
            v-for="(ev, idx) in events"
            :key="ev._id && ev._id.id ? ev._id.id : idx"
            class="event-card"
            @click="clickRow(ev)"
          >
            <div
              class="event-thumb placeholder d-flex align-items-center justify-content-center"
            >
              <Icon icon="mdi:image" width="40" height="40" />
            </div>

            <div class="event-body">
              <div class="font-weight-bold mb-1 text-truncate">
                {{ ev.eventName || "Event Name" }}
              </div>
              <small class="text-muted d-block">
                {{ formatDate(ev.startDateEvent) }} –
                {{ formatDate(ev.endDateEvent) }}
              </small>
              <small class="text-muted d-block mb-2">
                {{ ev.riverName || "Undefined" }} -
                {{ ev.addressState || "Colorado" }},
                {{ ev.addressCity || "USA" }}
              </small>

              <b-badge
                :variant="
                  String(ev.statusEvent).toLowerCase() === 'active'
                    ? 'success'
                    : 'secondary'
                "
                pill
              >
                {{ ev.statusEvent || "Active" }}
              </b-badge>
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
        <b-button variant="link" class="p-0" @click="goTo('team')">
          See all
          <Icon icon="mdi:arrow-right" class="ml-1" />
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
            <small class="text-muted d-block mb-3">{{ t.count }} team</small>
            <b-button
              size="sm"
              variant="secondary"
              class="rounded-pill w-100"
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

    <!-- 6) FOOTER -->
    <!-- <footer class="sts-footer text-center text-muted py-4">
      © {{ new Date().getFullYear() }} Sustainable Timing System. All rights reserved.
    </footer> -->
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { ipcRenderer } from "electron";

export default {
  name: "SustainableTimingSystemHome",
  components: { Icon },
  data() {
    return {
      events: [],
      loading: false,
      // contoh data untuk slider Teams; sambungkan ke sumber aslimu bila sudah ada
      teams: [
        { name: "FAJI DKI Jakarta", count: 4 },
        { name: "FAJI Jawa Barat", count: 3 },
        { name: "FAJI Jawa Tengah", count: 5 },
        { name: "FAJI DIY", count: 2 },
      ],
    };
  },
  mounted() {
    this.getEvents();
  },
  methods: {
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
    getEvents() {
      this.loading = true;
      var self = this;
      setTimeout(function () {
        ipcRenderer.send("get-events");
        // gunakan once agar listener tidak menumpuk saat HMR
        ipcRenderer.once("get-events-reply", function (_e, data) {
          self.events = Array.isArray(data) ? data : [];
          self.loading = false;
        });
      }, 400);
    },
    goTo(path) {
      if (!path) return this.$router.push("/");
      this.$router.push("/" + path);
    },
    clickRow(item) {
      // _id.id adalah Uint8Array → ubah ke hex
      var bytes = Array.prototype.slice.call(item._id.id);
      var idHex = bytes
        .map(function (b) {
          var h = b.toString(16);
          return h.length === 1 ? "0" + h : h;
        })
        .join("");
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
  --sts-blue: #2c5cff;
  --sts-muted: #8793b5;
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
  background: linear-gradient(180deg, #eef3ff 0%, #f5f7fb 100%);
  border-bottom: 1px solid #e9edf5;
}
.sts-jumbotron .hero-image {
  width: 320px;
  max-width: 100%;
  height: 220px;
  border-radius: 20px;
  background: #dfe7f7;
  box-shadow: 0 6px 24px rgba(31, 51, 117, 0.08);
}

/* ACTION CARDS */
.action-card {
  border-radius: 20px;
  border: 1px solid #eef0f6;
}
.action-icon {
  color: #2c5cff;
  background: #eff3ff;
  border-radius: 12px;
  width: 56px;
  height: 56px;
}
.btn.rounded-pill {
  border-radius: 999px;
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
.event-card {
  border: 1px solid #dfe5f2;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(44, 92, 255, 0.06);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(44, 92, 255, 0.1);
}
.event-thumb {
  height: 180px;
  background: #e8edf6;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
.event-body {
  padding: 12px 14px 16px;
}

/* TEAM CARD */
.team-card {
  border: 1px solid #dfe5f2;
  border-radius: 12px;
  background: #fff;
  padding: 14px;
  box-shadow: 0 6px 18px rgba(44, 92, 255, 0.06);
}
.team-avatar {
  height: 40px;
  width: 40px;
  border-radius: 999px;
  background: #eff3ff;
  color: #2c5cff;
}

/* FOOTER */
/* .sts-footer{ border-top:1px solid #e6eaf2; background:#eef3f7; } */

/* MISC */
.placeholder {
  color: #8793b5;
}
</style>
