<template>
  <div>
    <router-view :key="$route.fullPath"></router-view>
    <EventChatWidget :event-id="String($route.params.id || '')" />
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

  mounted() {},

  methods: {},
};
</script>
