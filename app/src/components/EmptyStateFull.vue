<template>
  <div class="empty-full">
    <img :src="imgToShow" :alt="title" class="empty-illustration" />
    <h2 class="empty-title">{{ title }}</h2>
    <p v-if="subtitle" class="empty-subtitle">{{ subtitle }}</p>

    <div v-if="$slots.default" class="empty-actions">
      <slot></slot>
    </div>

    <div v-else-if="primaryText" class="empty-actions">
      <b-button
        :variant="primaryVariant"
        class="px-4 py-2"
        @click="$emit('primary')"
      >
        {{ primaryText }}
      </b-button>
    </div>
  </div>
</template>

<script>
import emptyState from "@/assets/images/404.png";
export default {
  name: "EmptyStateFull",
  computed: {
    imgToShow() {
      return this.imgSrc || emptyState; // kalau prop kosong, pakai default
    },
  },
  props: {
    title: { type: String, default: "No data available" },
    subtitle: { type: String, default: "" },
    imgSrc: { type: String, default: "" },
    primaryText: { type: String, default: "" },
    primaryVariant: { type: String, default: "primary" },
  },
};
</script>

<style scoped>
.empty-full {
  min-height: calc(100vh - 120px); /* sisakan area header app jika ada */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: 20px;
}
.empty-illustration {
  width: min(680px, 86vw);
  max-width: 100%;
  height: auto;
  margin-bottom: 16px;
  filter: grayscale(25%);
}
.empty-title {
  font-weight: 800;
  font-size: 28px;
  color: #3b3f4a;
  margin-bottom: 8px;
}
.empty-subtitle {
  color: #7a808c;
  margin-bottom: 16px;
}
.empty-actions {
  margin-top: 6px;
}
</style>
