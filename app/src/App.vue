<template>
  <div id="app" class="app-shell">
    <!-- Header / Navbar -->
    <!-- <header v-if="showNavbar" class="app-header" role="banner"> -->
    <header class="app-header" role="banner">

      <Navbar />
    </header>

    <!-- Main content -->
    <main class="app-main" role="main">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="app-footer" role="contentinfo">
      <FooterVue />
    </footer>
  </div>
</template>

<script>
import FooterVue from "./components/Footer.vue";
import Navbar from "./components/Navbar.vue";

export default {
  name: "app",
  components: { Navbar, FooterVue },
  // computed: {
  //   showNavbar() {
  //     const currentPath = this.$route.path;
  //     console.log(currentPath,'<<<< ROUTE')
  //     return !(
  //       currentPath.includes("sprint-race") || currentPath.includes("slalom")
  //     );
  //   },
  // },
};
</script>

<style>
/* ===== Base ===== */
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
html,
body,
#app {
  height: 100%;
}

:root {
  /* Sesuaikan tinggi aktual komponen Anda */
  --nav-h: 64px; /* tinggi Navbar */
  --footer-h: 56px; /* tinggi Footer */
}

/* ===== Shell ===== */
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ===== Header (Navbar) fixed di atas ===== */
.app-header {
  position: fixed;
  inset: 0 0 auto 0; /* top:0; left:0; right:0 */
  height: var(--nav-h);
  z-index: 1000; /* pastikan di atas konten */
  background: #fff; /* atau sesuai tema Navbar */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* ===== Main: beri padding agar tidak ketutup header/footer ===== */
.app-main {
  flex: 1 0 auto;
  padding-top: var(--nav-h);
  padding-bottom: var(--footer-h);
}

/* Jika navbar tampil, tambahkan padding-top sesuai tinggi navbar */
.has-navbar .app-main {
  padding-top: calc(var(--nav-h) + env(safe-area-inset-top, 0px));
}

/* ===== Footer fixed di bawah ===== */
.app-footer {
  position: fixed;
  inset: auto 0 0 0; /* bottom:0; left:0; right:0 */
  height: var(--footer-h);
  z-index: 1000;
  background: #fff; /* atau sesuai tema Footer */
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.06);
  margin-top: 0; /* override gaya lama */
}

/* ===== Optional: konten halaman yang butuh padding tambahan ===== */
.content {
  padding: 24px;
}
</style>
