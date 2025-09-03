<template>
  <div>
    <b-navbar
      toggleable="lg"
      type="dark"
      class="navbar navbar-expand-lg navbar-dark fixed-top shadow-s"
      style="background-color: #1874A5"
    >
      <div class="container">
        <a class="navbar-brand" @click="goTo()">
          <img
            src="@/assets/images/logo-sts.png"
            alt="Logo"
            style="height: 80px"
          />
        </a>

        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        

        <!-- <b-collapse id="nav-collapse" is-nav class="justify-content-end">
          <b-navbar-nav>
            <b-nav-item @click="goTo('home')">Homepage</b-nav-item>
          </b-navbar-nav>
        </b-collapse> -->

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
      // if (payload == "home") {
      //   localStorage.removeItem("formNewEvent");
      //   this.$router.push({ name: payload });
      // }
       if (!path) return this.$router.push("/");
      this.$router.push("/" + path);
    },
  },
};
</script>
