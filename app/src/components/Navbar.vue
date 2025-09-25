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
              >All Events
            </b-nav-item>
            <b-nav-item
              :active="$route.name === 'create-team'"
              @click="goTo('team-create')"
              >All Teams
            </b-nav-item>
          </b-navbar-nav>

          <b-navbar-nav class="ml-auto">
            <!-- <b-nav-item @click="goTo('login')">Login/Create account</b-nav-item> -->
            <b-nav-item @click="exitApp">Exit</b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </div>
    </b-navbar>
  </div>
</template>

<script>
export default {
  name: "SustainableTimingSystemRaftingNavbar",

  data() {
    return {};
  },

  mounted() {},

  methods: {
    goTo(path) {
      if (!path) return this.$router.push("/");
      this.$router.push("/" + path);
    },
    exitApp() {
      window.app.exit();
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
</style>
