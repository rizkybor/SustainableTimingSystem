<template>
  <div>
    <b-navbar
      toggleable="lg"
      type="dark"
      variant="primary"
      class="navbar navbar-expand-lg navbar-dark fixed-top"
      style="background-color: var(--blue)"
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
        

        <b-collapse id="nav-collapse" is-nav class="justify-content-end">
          <b-navbar-nav>
            <b-nav-item @click="goTo('home')">Home</b-nav-item>

            <b-nav-item @click="goTo('')">List Events</b-nav-item>
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
    goTo(payload) {
      if (payload == "home") {
        this.$router.push({ name: payload });
      }
    },
  },
};
</script>
