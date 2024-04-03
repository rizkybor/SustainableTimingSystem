<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
    <Navbar />
    <div>
      <HelloWorld msg="Desktop Based Timing System" />
      <router-view></router-view>
    </div>
    <FooterVue />
  </div>
</template>

<script>
import FooterVue from "./components/Footer.vue";
import HelloWorld from "./components/HelloWorld.vue";
import Navbar from "./components/Navbar.vue";
import Banner from "./components/Banner.vue";

export default {
  name: "app",
  components: {
    HelloWorld,
    Navbar,
    FooterVue,
    Banner
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
</style>
