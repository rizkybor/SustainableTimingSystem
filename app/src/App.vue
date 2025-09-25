<template>
  <div id="app" class="app-shell">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <div v-if="showNavbar">
      <Navbar />
    </div>
    <div>
      <Navbar />
      <br />
      <br />
      <br />
      <br />
      <main class="app-main">
        <router-view />
      </main>
    </div>
    <FooterVue class="app-footer" />
  </div>
</template>

<script>
import FooterVue from "./components/Footer.vue";
import Navbar from "./components/Navbar.vue";

export default {
  name: "app",
  components: {
    Navbar,
    FooterVue,
  },
  computed: {
    showNavbar() {
      let currentPath = this.$route.path;
      return !(
        currentPath.includes("sprint-race") || currentPath.includes("slalom")
      );
    },
  },
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.content {
  padding: 50px;
  margin-top: 10vh;
}

html,
body,
#app {
  height: 100%;
}

.app-shell {
  min-height: 100vh; /* setinggi viewport */
  display: flex;
  flex-direction: column; /* kolom: header, main, footer */
}

.app-main {
  flex: 1 0 auto; /* isi mengembang mendorong footer ke bawah */
}

.app-footer {
  margin-top: auto; /* pastikan footer selalu di dasar */
}
</style>
