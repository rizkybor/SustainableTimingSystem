<template>
  <div>
    <router-view :key="$route.fullPath"></router-view>
    <EventChatWidget
      :event-id="String($route.params.id || '')"
      :fade-when-idle="isRaceCategoryRoute"
    />
  </div>
</template>

<script>
import EventChatWidget from "@/components/chat/EventChatWidget.vue";

export default {
  name: "SustainableTimingSystemRaftingIndex",
  components: {
    EventChatWidget,
  },
  data() {
    return {};
  },

  computed: {
    // Halaman Race Category (Sprint/Slalom/DRR/H2H/Rafting Cross) — widget
    // chat dibuat transparan di sini supaya tidak menutupi tabel Output
    // Racetime; halaman lain (Event Detail/Result) tetap seperti biasa.
    isRaceCategoryRoute() {
      return ["sprint-race", "slalom-race", "drr-race", "head2head-race", "rx-race"].includes(
        this.$route.name
      );
    },
  },

  mounted() {},

  methods: {},
};
</script>
