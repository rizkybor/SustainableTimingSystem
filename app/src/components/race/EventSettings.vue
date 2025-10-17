<template>
  <b-modal
    :id="id"
    v-model="show"            
    hide-footer
    centered
    size="lg"
    body-class="p-0"
    content-class="rounded-20 overflow-hidden"
  >
    <template #modal-header>
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="mb-0 font-weight-bold">Event Setting</h5>
      </div>
    </template>

    <!-- Body -->
    <div class="p-4">
      <!-- isi konten -->
      <div class="text-muted">Event: {{ eventName }} (ID: {{ eventId }})</div>
    </div>
  </b-modal>
</template>

<script>
export default {
  name: "EventSettingsModal",
  props: {
    value: { type: Boolean, default: false },
    id: { type: String, default: "event-settings-modal" },
    eventId: { type: String, default: "" },
    eventName: { type: String, default: "" },
  },
  computed: {
    // Proxy untuk v-model (prop 'value' <-> event 'input')
    show: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit("input", v);
      },
    },
  },
};
</script>

<style scoped>
/* opsional */
</style>