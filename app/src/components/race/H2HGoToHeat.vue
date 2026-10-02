<template>
  <div class="gth" @keydown.esc="open = false">
    <button
      type="button"
      class="gth-fab"
      :class="{ on: open }"
      v-b-tooltip.hover.right="open ? '' : 'Go to Heat — langsung buka Heat tertentu (kategori & babaknya ikut pindah)'"
      @click="toggle"
    >
      <Icon :icon="open ? icClose : icTarget" width="24" height="24" />
    </button>

    <transition name="gth-pop">
      <section v-if="open" class="gth-panel" role="dialog" aria-label="Go to Heat">
        <header class="gth-head">
          <span class="gth-head__icon"><Icon :icon="icTarget" width="18" height="18" /></span>
          <div class="gth-head__text">
            <strong>Go to Heat</strong>
            <small>{{ index.length ? `${heatCount} Heat di semua kategori H2H` : "Memuat daftar Heat…" }}</small>
          </div>
          <button type="button" class="gth-icon" title="Muat ulang" :disabled="loading" @click="load">
            <b-spinner v-if="loading" small /><Icon v-else :icon="icRefresh" width="18" height="18" />
          </button>
        </header>

        <form class="gth-jump" @submit.prevent="jump">
          <label class="gth-jump__field">
            <span>Heat</span>
            <input ref="num" v-model="num" type="number" min="1" inputmode="numeric" placeholder="No." />
          </label>
          <button type="submit" class="gth-go" :disabled="!num || busy">
            <b-spinner v-if="busy" small /><template v-else>Buka</template>
          </button>
        </form>
        <p v-if="message" class="gth-msg">{{ message }}</p>

        <label class="gth-search">
          <Icon :icon="icSearch" width="16" height="16" />
          <input v-model="query" placeholder="Cari tim / BIB / kategori…" />
        </label>

        <div class="gth-list">
          <p v-if="!loading && !shown.length" class="gth-empty">
            {{ index.length ? "Tidak ada yang cocok." : "Belum ada Heat yang ditentukan." }}
          </p>
          <button
            v-for="e in shown"
            :key="e.key"
            type="button"
            class="gth-item"
            :class="{ cur: isCurrent(e) }"
            :disabled="busy"
            @click="go(e)"
          >
            <span class="gth-item__no">{{ e.heat }}</span>
            <span class="gth-item__body">
              <span class="gth-item__teams">{{ e.team1 }} <em>vs</em> {{ e.team2 }}</span>
              <span class="gth-item__meta">{{ e.roundLabel }} · {{ e.categoryLabel }}</span>
            </span>
            <span v-if="isCurrent(e)" class="gth-item__here">Di sini</span>
          </button>
        </div>
      </section>
    </transition>
  </div>
</template>

<script>
// Widget mengambang "Go to Heat" (Head to Head): ketik/klik nomor Heat →
// halaman pindah ke kategori (Division/Race/Initial) & babak yang memuat Heat
// itu, lalu baris Heat tsb digulir & disorot. Navigasinya dikerjakan parent
// (event "go") memakai jalur pindah kategori yang sama dgn tab/select.
// Daftar Heat diambil dari dokumen bracket DB (h2h:brackets:get-all-for-event),
// sumber yang sama dgn widget "Assign Heat Lintas Kategori".
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import icTarget from "@iconify/icons-ic/baseline-my-location";
import icClose from "@iconify/icons-ic/baseline-close";
import icRefresh from "@iconify/icons-ic/baseline-refresh";
import icSearch from "@iconify/icons-ic/baseline-search";

export default {
  name: "H2HGoToHeat",
  components: { Icon },
  props: {
    eventId: { type: String, default: "" },
    /** Kunci bucket yg sedang dibuka: eventId|initialId|raceId|divisionId */
    currentBucketKey: { type: String, default: "" },
    currentRoundId: { type: String, default: "" },
    /** Dipanggil parent: async (entry) => true bila Heat ditemukan di tabel. */
    navigate: { type: Function, required: true },
  },
  data() {
    return {
      open: false, loading: false, busy: false, index: [], num: "", query: "", message: "",
      icTarget: icTarget, icClose: icClose, icRefresh: icRefresh, icSearch: icSearch,
    };
  },
  computed: {
    heatCount() {
      return new Set(this.index.map((e) => e.heat)).size;
    },
    shown() {
      const q = this.query.trim().toLowerCase();
      if (!q) return this.index;
      return this.index.filter((e) =>
        [String(e.heat), e.team1, e.team2, e.bib1, e.bib2, e.categoryLabel, e.roundLabel]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    },
  },
  methods: {
    toggle() {
      this.open = !this.open;
      if (this.open) {
        this.message = "";
        this.load();
        this.$nextTick(() => this.$refs.num && this.$refs.num.focus());
      }
    },
    isCurrent(e) {
      return e.bucketKey === this.currentBucketKey && String(e.roundId) === String(this.currentRoundId);
    },
    async load() {
      if (!this.eventId) return;
      this.loading = true;
      try {
        const reqId = "gth|" + Date.now() + "|" + Math.random();
        const res = await new Promise((resolve) => {
          let done = false;
          const finish = (r) => {
            if (done) return;
            done = true;
            ipcRenderer.removeListener("h2h:brackets:get-all-for-event-reply", onReply);
            resolve(r);
          };
          // balasan channel ini tidak membawa reqId — ambil balasan pertama
          // setelah permintaan ini (sama dgn pola widget Assign Heat).
          const onReply = (_e, r) => finish(r);
          ipcRenderer.on("h2h:brackets:get-all-for-event-reply", onReply);
          ipcRenderer.send("h2h:brackets:get-all-for-event", this.eventId, reqId);
          setTimeout(() => finish(null), 8000);
        });
        const docs = res && res.ok && Array.isArray(res.items) ? res.items : [];
        const out = [];
        docs.forEach((doc) => {
          const b = doc.bucket || {};
          const bucketKey = [b.eventId, b.initialId, b.raceId, b.divisionId].map((v) => String(v || "")).join("|");
          const categoryLabel = [b.divisionName, b.raceName].filter(Boolean).join(" ") + (b.initialName ? " – " + b.initialName : "");
          (doc.rounds || []).forEach((round) => {
            (round.matches || []).forEach((m, mi) => {
              const heat = Number(m && m.heat) || 0;
              if (!heat || !m || m.bye) return;
              out.push({
                key: bucketKey + "|" + round.id + "|" + mi,
                heat: heat,
                bucketKey: bucketKey,
                categoryLabel: categoryLabel.trim() || "-",
                roundId: String(round.id),
                roundLabel: round.bronze ? "Final B" : String(round.name || "-"),
                team1: (m.team1 && m.team1.name) || "TBD",
                team2: (m.team2 && m.team2.name) || "TBD",
                bib1: (m.team1 && m.team1.bibTeam) || "",
                bib2: (m.team2 && m.team2.bibTeam) || "",
              });
            });
          });
        });
        out.sort((a, b) => a.heat - b.heat || a.categoryLabel.localeCompare(b.categoryLabel));
        this.index = out;
      } finally {
        this.loading = false;
      }
    },
    async jump() {
      const n = Number(this.num);
      if (!n) return;
      if (!this.index.length) await this.load();
      const hits = this.index.filter((e) => e.heat === n);
      if (!hits.length) {
        this.message = `Heat ${n} belum ditentukan di kategori mana pun.`;
        return;
      }
      if (hits.length > 1) {
        // nomor sama di beberapa kategori — tampilkan pilihannya
        this.query = String(n);
        this.message = `Heat ${n} ada di ${hits.length} kategori — pilih salah satu.`;
        return;
      }
      await this.go(hits[0]);
    },
    async go(e) {
      this.busy = true;
      this.message = "";
      try {
        const found = await this.navigate(e);
        if (found) {
          this.open = false;
          this.num = "";
          this.query = "";
        } else {
          this.message = `Heat ${e.heat} dibuka, tapi barisnya tidak tampil di tabel babak ini.`;
        }
      } catch (err) {
        this.message = "Gagal membuka Heat: " + ((err && err.message) || err);
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style scoped>
.gth {
  position: fixed;
  left: 24px;
  bottom: 142px; /* di atas widget "Assign Heat Lintas Kategori" (bottom 70px) */
  z-index: 1049;
}
.gth-fab {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #1d8fbb 0%, #1874a5 60%, #13628d 100%);
  color: #fff;
  box-shadow: 0 10px 24px rgba(24, 116, 165, 0.38), 0 2px 6px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.gth-fab:hover {
  transform: translateY(-2px) scale(1.03);
}
.gth-fab.on {
  background: #0f172a;
}
.gth-panel {
  position: absolute;
  left: 72px;
  bottom: 0;
  width: 380px;
  max-height: min(70vh, 620px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}
.gth-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(90deg, #1874a5, #1d8fbb);
  color: #fff;
}
.gth-head__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
}
.gth-head__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.gth-head__text small {
  opacity: 0.85;
}
.gth-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #fff;
  cursor: pointer;
}
.gth-icon:hover {
  background: rgba(255, 255, 255, 0.16);
}
.gth-jump {
  display: flex;
  gap: 8px;
  padding: 12px 14px 6px;
}
.gth-jump__field {
  flex: 1;
  display: flex;
  align-items: center;
  margin: 0;
  border: 2px solid #1874a5;
  border-radius: 12px;
  overflow: hidden;
}
.gth-jump__field span {
  padding: 0 10px;
  font-weight: 800;
  color: #1874a5;
  background: #eaf4fa;
  align-self: stretch;
  display: flex;
  align-items: center;
}
.gth-jump__field input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  padding: 8px 10px;
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.gth-go {
  border: 0;
  border-radius: 12px;
  padding: 0 18px;
  font-weight: 800;
  background: #1874a5;
  color: #fff;
  cursor: pointer;
}
.gth-go:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.gth-msg {
  margin: 4px 14px 0;
  padding: 6px 10px;
  border-radius: 8px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 12.5px;
}
.gth-search {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 14px;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #94a3b8;
}
.gth-search input {
  flex: 1;
  border: 0;
  outline: 0;
  font-size: 13px;
  color: #0f172a;
}
.gth-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 10px;
}
.gth-empty {
  margin: 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
.gth-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  margin-bottom: 2px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.gth-item:hover {
  background: #f1f5f9;
}
.gth-item.cur {
  background: #eaf4fa;
  border-color: #9cc9e3;
}
.gth-item__no {
  flex: none;
  display: grid;
  place-items: center;
  min-width: 40px;
  height: 40px;
  padding: 0 6px;
  border-radius: 11px;
  background: #fff4e6;
  color: #c2570a;
  font-size: 17px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.gth-item.cur .gth-item__no {
  background: #1874a5;
  color: #fff;
}
.gth-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.gth-item__teams {
  font-weight: 700;
  font-size: 13px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gth-item__teams em {
  font-style: normal;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 2px;
}
.gth-item__meta {
  font-size: 11.5px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gth-item__here {
  flex: none;
  font-size: 10.5px;
  font-weight: 800;
  color: #1874a5;
}
.gth-pop-enter-active,
.gth-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.gth-pop-enter,
.gth-pop-leave-to {
  opacity: 0;
  transform: translateX(-8px) scale(0.98);
}
</style>
