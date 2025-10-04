<template>
  <div>
    <b-navbar
      toggleable="lg"
      type="dark"
      class="navbar navbar-expand-lg navbar-dark fixed-top shadow-s"
      style="background-color: #1874a5"
    >
      <div class="container">
        <a class="navbar-brand" @click="goTo()">
          <img
            src="@/assets/images/logo-sts.png"
            alt="Logo"
            style="height: 80px"
          />
        </a>

        <b-navbar-toggle target="main-nav"></b-navbar-toggle>
        <b-collapse id="main-nav" is-nav>
          <b-navbar-nav class="ml-3">
            <b-nav-item :active="$route.name === 'home'" @click="goTo('')"
              >Home</b-nav-item
            >
            <b-nav-item
              :active="$route.name === 'events'"
              @click="goTo('events')"
              >All Events</b-nav-item
            >
            <b-nav-item
              :active="$route.name === 'create-team'"
              @click="goTo('team-create')"
              >All Teams</b-nav-item
            >
          </b-navbar-nav>

          <b-navbar-nav class="ml-auto">
            <b-nav-item-dropdown right toggle-class="d-flex align-items-center">
              <template #button-content>
                <span
                  :class="['inline-block rounded-full mr-2', statusDotClass]"
                  style="width: 10px; height: 10px"
                ></span>
                <span class="font-weight-bold">Network : {{ modeLabel }}</span>
              </template>

              <b-dropdown-header disabled> Network Choice </b-dropdown-header>
              <b-dropdown-divider></b-dropdown-divider>

              <b-dropdown-item v-if="!isDevEnv" @click="setMode('ONLINE')"
                >🌐 Online (Internet)
              </b-dropdown-item>
              <b-dropdown-item @click="setMode('LAN')"
                >💻🔌💻 LAN (Local Network)
              </b-dropdown-item>
              <b-dropdown-item v-if="isDevEnv" @click="setMode('OFFLINE')"
                >👨🏽‍💻 Local Development
              </b-dropdown-item>

              <b-dropdown-divider></b-dropdown-divider>

              <b-dropdown-item
                disabled
                class="small text-muted"
                v-b-tooltip.hover.html="tooltipNetwork"
              >
                🔎 URL activated
              </b-dropdown-item>
            </b-nav-item-dropdown>

            <b-nav-item @click="lockAndExit">🔒 Lock Apps</b-nav-item>
            <b-nav-item @click="exitApp">Exit</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </div>
    </b-navbar>
  </div>
</template>

<script>
import { lock } from "@/utils/auth";
import { log } from "@/utils/logger";

// map UI → mode di main process
const toCore = { ONLINE: "online", LAN: "lan", OFFLINE: "auto" };
// map core → UI
const fromCore = { online: "ONLINE", lan: "LAN", auto: "OFFLINE" };

export default {
  name: "SustainableTimingSystemRaftingNavbar",

  data() {
    return {
      mode: localStorage.getItem("sts_network_mode") || "ONLINE",
      active: { apiBase: "-", realtime: "-", coreMode: "online" },
      urls: {},
    };
  },

  computed: {
    isDevEnv() {
      return (
        process.env.VUE_APP_ENV === "development" ||
        process.env.VUE_APP_ENV === "lan"
      );
    },
    modeLabel() {
      return this.mode === "ONLINE"
        ? "Online"
        : this.mode === "LAN"
        ? "LAN"
        : this.mode === "OFFLINE"
        ? "Offline"
        : "Unknown";
    },
    statusDotClass() {
      return this.mode === "ONLINE"
        ? "bg-success"
        : this.mode === "LAN"
        ? "bg-warning"
        : "bg-secondary";
    },
    tooltipNetwork() {
      const ls = JSON.parse(localStorage.getItem("network_urls") || "{}");
      const lsProfile =
        (this.mode === "LAN" && ls.LAN) ||
        (this.mode === "OFFLINE" && ls.OFFLINE) ||
        ls.ONLINE || { base: "-", realtime: "-" };

      const base = this.active.apiBase || lsProfile.base || "-";
      const rt = this.active.realtime || lsProfile.realtime || "-";

      return (
        "<div style='font-size: 0.85rem; line-height: 1.3'>" +
        "<strong>" + this.modeLabel + " Mode</strong><br>" +
        "🌐 <b>Base URL:</b> " + base + "<br>" +
        "🔄 <b>Realtime URL:</b> " + rt +
        "</div>"
      );
    },
  },

  async mounted() {
    // Cek ketersediaan IPC aman (tanpa optional chaining)
    const hasIpcGet =
      typeof window !== "undefined" &&
      window.netcfg &&
      typeof window.netcfg.get === "function";

    if (hasIpcGet) {
      try {
        const st = await window.netcfg.get(); // { mode, apiBase, realtime, config }
        this.mode = fromCore[st.mode] || this.mode;
        this.active = {
          apiBase: st.apiBase,
          realtime: st.realtime || "-",
          coreMode: st.mode,
        };

        localStorage.setItem("sts_network_mode", this.mode);
        localStorage.setItem("network_base_url", st.apiBase || "");
        localStorage.setItem("network_realtime_url", st.realtime || "");

        // map config tanpa optional chaining
        if (st.config) {
          const mapped = {
            ONLINE: {
              base:
                (st.config.api && st.config.api.online) || "",
              realtime:
                (st.config.realtime && st.config.realtime.online) || "",
            },
            LAN: {
              base:
                (st.config.api && st.config.api.lan) || "",
              realtime:
                (st.config.realtime && st.config.realtime.lan) || "",
            },
            OFFLINE: {
              base:
                (st.config.api && st.config.api.lan) || "",
              realtime:
                (st.config.realtime && st.config.realtime.lan) || "",
            },
          };
          localStorage.setItem("network_urls", JSON.stringify(mapped));
          this.urls = mapped;
        }
      } catch (e) {
        log.error("netcfg.get() gagal:", e && e.message ? e.message : e);
        this.applyNetworkMode(this.mode);
      }
    } else {
      this.applyNetworkMode(this.mode);
    }
  },

  methods: {
    goTo(path) {
      if (!path) return this.$router.push("/");
      this.$router.push("/" + path);
    },

    lockAndExit() {
      try {
        lock();
        this.$router.replace("/unlock");
      } catch (e) {
        log.error(e);
      }
    },

    exitApp() {
      try {
        if (window && window.app && typeof window.app.exit === "function") {
          window.app.exit();
        } else {
          window.close();
        }
      } catch (e) {
        log.error(e);
      }
    },

    applyNetworkMode(mode) {
      try {
        const urls = JSON.parse(localStorage.getItem("network_urls") || "{}") || {};
        const fallback = urls.ONLINE || { base: "", realtime: "" };
        const profile =
          (mode === "LAN" && urls.LAN) ||
          (mode === "OFFLINE" && urls.OFFLINE) ||
          (mode === "ONLINE" && urls.ONLINE) ||
          fallback;

        localStorage.setItem("sts_network_mode", mode);
        localStorage.setItem("network_base_url", profile.base || "");
        localStorage.setItem("network_realtime_url", profile.realtime || "");

        this.active = {
          apiBase: profile.base || "-",
          realtime: profile.realtime || "-",
          coreMode: toCore[mode] || "online",
        };
      } catch (e) {
        log.error(e);
      }
    },

    async setMode(nextMode) {
      if (this.mode === nextMode) return;

      const hasIpcSet =
        typeof window !== "undefined" &&
        window.netcfg &&
        typeof window.netcfg.set === "function";

      if (hasIpcSet) {
        try {
          const core = toCore[nextMode] || "online";
          const st = await window.netcfg.set({ mode: core }); // { mode, apiBase, realtime, config }
          this.mode = fromCore[st.mode] || nextMode;

          this.active = {
            apiBase: st.apiBase,
            realtime: st.realtime || "-",
            coreMode: st.mode,
          };
          localStorage.setItem("sts_network_mode", this.mode);
          localStorage.setItem("network_base_url", st.apiBase || "");
          localStorage.setItem("network_realtime_url", st.realtime || "");

          if (this.$bvToast) {
            this.$bvToast.toast(
              "Mode jaringan diubah ke " + this.modeLabel + " (" + (st.apiBase || "") + ")",
              { title: "Pengaturan Jaringan", variant: "info", solid: true, autoHideDelay: 2200 }
            );
          }
          return;
        } catch (e) {
          log.error("netcfg.set() gagal:", e && e.message ? e.message : e);
        }
      }

      // Fallback (tanpa IPC)
      this.mode = nextMode;
      this.applyNetworkMode(nextMode);
      if (this.$bvToast) {
        this.$bvToast.toast("Mode jaringan diubah ke " + this.modeLabel, {
          title: "Pengaturan Jaringan",
          variant: "info",
          solid: true,
          autoHideDelay: 2000,
        });
      }
    },
  },
};
</script>

<style>
.navbar-nav .nav-item .nav-link.active {
  background: linear-gradient(90deg, #1874a5, #1d8fbb);
  color: #fff !important;
  font-weight: 600;
  border-radius: 8px;
  padding-right: 10px;
  padding-left: 10px;
}
.bg-success {
  background-color: #28a745 !important;
}
.bg-warning {
  background-color: #ffc107 !important;
}
.bg-secondary {
  background-color: #6c757d !important;
}
.inline-block {
  display: inline-block;
}
.rounded-full {
  border-radius: 9999px;
}
.mr-2 {
  margin-right: 0.5rem;
}

/* --- Custom dropdown style --- */
.dropdown-header {
  text-align: center !important;
  justify-content: center !important;
  display: flex !important;
  align-items: center !important;
  font-weight: 600;
  color: #1874a5 !important;
  letter-spacing: 0.3px;
  padding-top: 6px;
  padding-bottom: 6px;
}

.dropdown-menu {
  border-radius: 16px !important;
  border: none !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
  overflow: hidden;
  padding: 0.5rem 0;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%) !important;
}

/* item text & spacing */
.dropdown-item {
  border-radius: 8px !important;
  margin: 24px 8px;
  transition: all 0.25s ease;
  font-weight: 500;
  color: #333;
}

/* hover effect dengan gradient biru */
.dropdown-item:hover {
  background: linear-gradient(90deg, #1874a5, #1d8fbb) !important;
  color: #fff !important;
  transform: translateX(3px);
  padding-top: 15px;
  padding-bottom: 15px;
}

/* divider tipis */
.dropdown-divider {
  border-top: 1px solid #e5e5e5 !important;
  margin: 6px 12px;
}

/* tooltip clarity */
.tooltip-inner {
  border-radius: 10px !important;
  background: #1d8fbb !important;
  font-size: 0.8rem;
  padding: 6px 10px;
}
</style>
