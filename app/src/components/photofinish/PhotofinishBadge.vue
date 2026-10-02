<template>
  <span
    v-if="status.enabled"
    class="badge pf-badge"
    :class="status.connected ? 'badge-success' : 'badge-danger'"
    :title="title"
  >
    Photo Finish {{ status.connected ? "terhubung" : "terputus" }}
    <template v-if="status.outbox"> · {{ status.outbox }} sinyal antre</template>
    <template v-if="status.pending"> · {{ status.pending }} hasil menunggu</template>
  </span>
</template>

<script>
import { getStatus, onStatus } from "@/services/photofinish";

export default {
  name: "PhotofinishBadge",
  data() {
    return { status: { enabled: false, connected: false, outbox: 0, pending: 0, lastError: null } };
  },
  computed: {
    title() {
      if (this.status.lastError) return this.status.lastError;
      return "Sinyal finish RaceTime2 dikirim ke STS Photo Finish; hasil juri diterapkan otomatis.";
    },
  },
  async mounted() {
    this.status = await getStatus();
    this._off = onStatus((st) => {
      this.status = st;
    });
  },
  beforeDestroy() {
    if (this._off) this._off();
  },
};
</script>

<style scoped>
.pf-badge {
  font-size: 12px;
  padding: 4px 8px;
}
</style>
