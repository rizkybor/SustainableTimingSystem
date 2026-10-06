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
    // Halaman Race Category (Sprint/Slalom/DRR/H2H/Rafting Cross) + semua
    // halaman Result (per kategori & Event Overall) — widget chat dibuat
    // transparan di sini supaya tidak menutupi tabel; Event Detail biasa.
    isRaceCategoryRoute() {
      return [
        "sprint-race",
        "slalom-race",
        "drr-race",
        "head2head-race",
        "rx-race",
        "SprintResult",
        "SlalomResult",
        "DrrResult",
        "HeadToHeadResult",
        "RxResult",
        "EventOverallResult",
      ].includes(this.$route.name);
    },
  },

  mounted() {},

  methods: {},
};
</script>
