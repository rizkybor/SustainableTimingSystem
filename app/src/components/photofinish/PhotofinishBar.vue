<template>
  <div v-if="status.enabled" class="pf-bar d-flex flex-wrap align-items-center">
    <PhotofinishBadge class="mr-2 mb-1" />
    <b-button
      size="sm"
      variant="primary"
      class="pf-send mb-1"
      :disabled="!status.connected || busy"
      title="Buat & aktifkan sesi STS Photo Finish untuk heat yang sedang tampil"
      @click="open"
    >
      <Icon icon="ic:baseline-sports-score" class="mr-1" />
      Kirim heat ke Photo Finish
    </b-button>

    <b-modal
      v-model="show"
      title="Kirim heat ke Photo Finish"
      size="lg"
      centered
      hide-footer
      body-class="p-0"
    >
      <p class="text-muted small px-3 pt-3 mb-2">
        Pilih heat yang akan berlomba. Sesi Photo Finish dibuat (atau dipakai
        ulang) dengan kategori, heat, dan tim di bawah, lalu langsung
        <strong>diaktifkan</strong> — impuls RaceTime2 berikutnya masuk ke sesi ini.
      </p>
      <div v-if="!heats.length" class="text-center text-muted py-4">
        Tidak ada heat yang bisa dikirim. Pastikan kategori spesifik terbuka
        dan tim sudah punya nomor Heat.
      </div>
      <ul v-else class="list-unstyled mb-0">
        <li v-for="h in heats" :key="h.key" class="pf-heat d-flex align-items-center">
          <div class="flex-grow-1 pr-3">
            <div class="font-weight-bold">{{ h.title }}</div>
            <div class="small text-muted">
              <span v-for="l in h.lanes.slice(0, 8)" :key="l.lane" class="mr-3">
                <span class="pf-lane">{{ l.lane }}</span>
                {{ l.teamName || l.teamId }}<span v-if="l.bib"> #{{ l.bib }}</span>
              </span>
              <span v-if="h.lanes.length > 8">+{{ h.lanes.length - 8 }} tim lain</span>
            </div>
          </div>
          <b-button size="sm" variant="success" :disabled="busy" @click="send(h)">
            {{ busyKey === h.key ? "Mengirim…" : "Kirim & aktifkan" }}
          </b-button>
        </li>
      </ul>
    </b-modal>
  </div>
</template>

<script>
import { getStatus, onStatus } from "@/services/photofinish";
import PhotofinishBadge from "./PhotofinishBadge.vue";

// Tombol "Kirim heat ke Photo Finish" + status koneksi. Halaman race
// menyediakan:
//   getHeats() → [{ key, title, heatId, label, lanes:[{lane,teamId,bib,teamName,crewExpected}] }]
//   sendHeat(heat) → Promise<{ ok, label?, created?, error? }>
export default {
  name: "PhotofinishBar",
  components: { PhotofinishBadge },
  props: {
    getHeats: { type: Function, required: true },
    sendHeat: { type: Function, required: true },
  },
  data() {
    return { status: { enabled: false, connected: false }, show: false, heats: [], busy: false, busyKey: null };
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
  methods: {
    open() {
      try {
        this.heats = this.getHeats() || [];
      } catch (_e) {
        this.heats = [];
      }
      this.show = true;
    },
    async send(heat) {
      this.busy = true;
      this.busyKey = heat.key;
      try {
        const res = await this.sendHeat(heat);
        if (res && res.ok) this.show = false;
      } finally {
        this.busy = false;
        this.busyKey = null;
      }
    },
  },
};
</script>

<style scoped>
.pf-bar { gap: 4px; }
.pf-send { border-radius: 10px; font-weight: 700; background: linear-gradient(90deg, #1874a5, #1d8fbb); border: 0; }
.pf-heat { padding: 12px 16px; border-top: 1px solid #f1f5f9; }
.pf-heat:hover { background: #f9fafb; }
.pf-lane { display: inline-block; min-width: 20px; padding: 0 5px; margin-right: 3px; border-radius: 6px; background: #eaf4fa; color: #1874a5; font-weight: 700; text-align: center; }
</style>
