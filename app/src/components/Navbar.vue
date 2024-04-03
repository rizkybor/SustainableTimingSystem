<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-light fixed-top" style="background-color: var(--blue);">
      <div class="container">
        <a style="color: var(--white);" class="navbar-brand" href="#">DBTS</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link link-to" href="#">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link link-to" href="#">List Events</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'SustainableTimingSystemRaftingNavbar',

  data() {
    return {
      
    };
  },

  mounted() {
    
  },

  methods: {
    
  },
};
</script>