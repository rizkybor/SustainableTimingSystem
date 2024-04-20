<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <div v-if="showNavbar">
      <Navbar />
    </div>
    <div>
      <br/>
      <br/>
      <br/>
      <br/>
      <router-view></router-view>
    </div>
    <FooterVue />
  </div>
</template>

<script>
import FooterVue from "./components/Footer.vue";
import Navbar from "./components/Navbar.vue";
import Banner from "./components/Banner.vue";

export default {
  name: "app",
  components: {
    Navbar,
    FooterVue,
    Banner
  },
  computed: {
    showNavbar() {
      let currentPath = this.$route.path;
      return !(currentPath.includes("sprint-race") || currentPath.includes("slalom"));
    }
  }


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
</style>
