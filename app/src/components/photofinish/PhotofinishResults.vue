<template>
  <b-modal
    :visible="value"
    size="xl"
    centered
    hide-header
    hide-footer
    body-class="p-0"
    content-class="pfr"
    dialog-class="pfr-dialog"
    @change="$emit('input', $event)"
    @shown="load"
  >
    <!-- ===== kepala ===== -->
    <header class="pfr-head">
      <span class="pfr-head__icon"><Icon :icon="icons.score" width="22" height="22" /></span>
      <div class="pfr-head__text">
        <h5>Hasil Photo Finish</h5>
        <small>{{ items.length }} kiriman · {{ count.menunggu }} menunggu · klik waktu untuk menyalin</small>
      </div>
      <button type="button" class="pfr-icon-btn" title="Muat ulang" @click="load"><Icon :icon="icons.refresh" width="20" height="20" /></button>
      <button type="button" class="pfr-icon-btn" title="Tutup" @click="$emit('input', false)"><Icon :icon="icons.close" width="22" height="22" /></button>
    </header>

    <!-- ===== alat ===== -->
    <div class="pfr-tools">
      <div class="pfr-seg" role="tablist">
        <button v-for="f in FILTERS" :key="f.key" type="button" :class="{ on: filter === f.key }" @click="filter = f.key">
          {{ f.label }} <span class="pfr-seg__n">{{ f.key === "all" ? items.length : count[f.key] || 0 }}</span>
        </button>
      </div>
      <label class="pfr-search">
        <Icon :icon="icons.search" width="18" height="18" />
        <input v-model="query" placeholder="Cari tim, BIB, sesi, keterangan…" />
      </label>
    </div>

    <div v-if="!items.length" class="pfr-empty">
      <Icon :icon="icons.inbox" width="44" height="44" />
      <strong>Belum ada hasil dari STS Photo Finish</strong>
      <span>Hasil yang dikonfirmasi juri muncul di sini secara otomatis.</span>
    </div>

    <div v-else class="pfr-body">
      <!-- ===== daftar ===== -->
      <ul class="pfr-list">
        <li v-if="!shown.length" class="pfr-list__none">Tidak ada hasil yang cocok.</li>
        <li
          v-for="h in shown" :key="keyOf(h)" class="pfr-item" :class="{ sel: keyOf(h) === selectedKey, old: h.status === 'diganti' }"
          @click="select(h)"
        >
          <span class="pfr-rank" :class="'r' + Math.min(h.rank, 4)">{{ h.rank }}</span>
          <div class="pfr-item__main">
            <div class="pfr-item__team">{{ h.teamName || h.teamId }}<small v-if="h.bib">#{{ h.bib }}</small></div>
            <div class="pfr-item__sub">{{ h.sessionNote || h.sessionLabel || "—" }}</div>
          </div>
          <div class="pfr-item__time">
            <span class="mono">{{ h.finishTime }}</span>
            <span class="pfr-pill" :class="'st-' + h.status">{{ STATUS[h.status] }}</span>
          </div>
        </li>
      </ul>

      <!-- ===== detail ===== -->
      <section v-if="selected" class="pfr-detail">
        <div class="pfr-detail__head">
          <div>
            <div class="pfr-detail__team">{{ selected.teamName || selected.teamId }}<small v-if="selected.bib">BIB {{ selected.bib }}</small></div>
            <div class="pfr-detail__sess">
              {{ selected.sessionLabel || "—" }}<template v-if="selected.sessionNote"> · <b>{{ selected.sessionNote }}</b></template>
            </div>
          </div>
          <span class="pfr-pill lg" :class="'st-' + selected.status">{{ STATUS[selected.status] }}</span>
        </div>
        <p v-if="selected.status === 'menunggu' && selected.note" class="pfr-wait">
          <Icon :icon="icons.wait" width="16" height="16" /> {{ selected.note }}
        </p>

        <div class="pfr-times">
          <div class="pfr-time main">
            <span class="pfr-time__label">Finish Time · urutan {{ selected.rank }}</span>
            <span class="pfr-time__value mono" title="Klik untuk menyalin" @click="copy(selected.finishTime, 'finish')">{{ selected.finishTime }}</span>
            <button type="button" class="pfr-copy" @click="copy(selected.finishTime, 'finish')">
              <Icon :icon="copied === 'finish' ? icons.check : icons.copy" width="16" height="16" />
              {{ copied === "finish" ? "Disalin" : "Salin" }}
            </button>
          </div>
          <div class="pfr-time">
            <span class="pfr-time__label">Waktu resmi</span>
            <span class="pfr-time__value mono" title="Klik untuk menyalin" @click="copy(selected.officialTime, 'official')">{{ selected.officialTime }}</span>
            <button type="button" class="pfr-copy ghost" @click="copy(selected.officialTime, 'official')">
              <Icon :icon="copied === 'official' ? icons.check : icons.copy" width="16" height="16" />
              {{ copied === "official" ? "Disalin" : "Salin" }}
            </button>
          </div>
        </div>

        <!-- gambar bukti -->
        <div class="pfr-evidence">
          <div class="pfr-evidence__bar">
            <span><Icon :icon="icons.image" width="16" height="16" /> Gambar Photo Finish</span>
            <div v-if="image && image.ok && image.frameUrl" class="pfr-seg sm">
              <button type="button" :class="{ on: view === 'slit' }" @click="view = 'slit'">Garis finish</button>
              <button type="button" :class="{ on: view === 'frame' }" @click="view = 'frame'">Foto kamera</button>
            </div>
          </div>
          <div v-if="imageLoading" class="pfr-evidence__state">Memuat gambar…</div>
          <div v-else-if="!image || !image.ok" class="pfr-evidence__state">
            <Icon :icon="icons.warn" width="22" height="22" />
            <span>{{ (image && image.error) || "Gambar tidak tersedia" }}</span>
            <button type="button" class="pfr-btn sm" @click="loadImage(selected)"><Icon :icon="icons.refresh" width="16" height="16" /> Coba lagi</button>
          </div>
          <template v-else>
            <div v-show="view === 'slit'" ref="strip" class="pfr-strip">
              <div class="pfr-strip__inner" :style="{ width: stripWidth + 'px' }">
                <img :src="image.url" alt="Gambar slit-scan Photo Finish" draggable="false" @load="centerMark" />
                <span
                  v-for="m in image.marks" :key="m.rank + '-' + m.column" class="pfr-mark" :class="{ self: m.self }"
                  :style="{ left: (m.column / image.width) * 100 + '%' }"
                ><b>{{ m.rank }}</b></span>
              </div>
            </div>
            <div v-if="view === 'frame' && image.frameUrl" class="pfr-frame">
              <div class="pfr-frame__stage">
                <img :src="image.frameUrl" alt="Foto kamera saat finish" @load="onFrameLoad" />
                <svg v-if="frameSize && showGuide" :viewBox="`0 0 ${frameSize.w} ${frameSize.h}`" preserveAspectRatio="none">
                  <line
                    v-if="image.finishLine" class="pfr-ln-finish"
                    :x1="image.finishLine.x1" :y1="image.finishLine.y1" :x2="image.finishLine.x2" :y2="image.finishLine.y2"
                  />
                  <line class="pfr-ln-guide" :x1="guideX" :x2="guideX" y1="0" :y2="frameSize.h" />
                </svg>
              </div>
            </div>
            <div class="pfr-evidence__foot">
              <p class="pfr-evidence__hint">
                <template v-if="view === 'slit'">Garis merah = perahu ini; abu-abu = perahu lain di rekaman yang sama. Geser untuk melihat.</template>
                <template v-else>
                  <span class="pfr-key"></span>garis finish
                  <span class="pfr-key cyan"></span>garis imajiner tegak lurus{{ image.finishLine ? "" : " (tengah gambar)" }}
                </template>
              </p>
              <label v-if="view === 'frame'" class="pfr-toggle"><input v-model="showGuide" type="checkbox" /> Tampilkan garis</label>
            </div>
          </template>
        </div>

        <dl class="pfr-meta">
          <div><dt>Event</dt><dd>{{ selected.eventName || selected.eventId || "—" }}</dd></div>
          <div><dt>Sumber waktu</dt><dd>{{ SOURCE[selected.timeSource] || selected.timeSource }}</dd></div>
          <div><dt>Juri</dt><dd>{{ selected.verifiedByName || "—" }}</dd></div>
          <div><dt>Diterima</dt><dd>{{ fmtDateTime(selected.receivedAt) }}</dd></div>
          <div v-if="selected.revision > 1" class="wide"><dt>Koreksi ke-{{ selected.revision - 1 }}</dt><dd>{{ selected.reason || "—" }}</dd></div>
          <div class="wide">
            <dt>Penalti</dt>
            <dd>
              <span v-for="p in penalties(selected)" :key="p" class="pfr-pen">{{ p }}</span>
              <span v-if="!penalties(selected).length">Tidak ada</span>
            </dd>
          </div>
        </dl>

        <footer class="pfr-detail__foot">
          <span class="pfr-foot__hint">Menghapus hanya dari daftar ini — data di STS Photo Finish tetap ada.</span>
          <button type="button" class="pfr-btn danger" @click="remove(selected)">
            <Icon :icon="icons.del" width="18" height="18" /> Hapus dari daftar
          </button>
        </footer>
      </section>
      <section v-else class="pfr-detail pfr-detail--empty">Pilih hasil di sebelah kiri.</section>
    </div>
  </b-modal>
</template>

<script>
// Panel "Hasil Photo Finish": riwayat hasil juri dari STS Photo Finish —
// HANYA DILIHAT (hasil tetap diterapkan otomatis oleh photofinishMixin).
// Admin bisa menyalin waktu, melihat gambar bukti (slit-scan + foto kamera),
// dan menghapus baris dari daftar lokal.
import { Icon } from "@iconify/vue2";
import icCopy from "@iconify/icons-ic/baseline-content-copy";
import icDel from "@iconify/icons-ic/baseline-delete-outline";
import icSearch from "@iconify/icons-ic/baseline-search";
import icClose from "@iconify/icons-ic/baseline-close";
import icRefresh from "@iconify/icons-ic/baseline-refresh";
import icImage from "@iconify/icons-ic/baseline-image";
import icScore from "@iconify/icons-ic/baseline-sports-score";
import icWait from "@iconify/icons-ic/baseline-hourglass-empty";
import icCheck from "@iconify/icons-ic/baseline-check-circle";
import icInbox from "@iconify/icons-ic/baseline-inbox";
import icWarn from "@iconify/icons-ic/baseline-warning-amber";
import { copyText, deleteHistory, getHistory, getResultImage, onHistoryChanged } from "@/services/photofinish";

const STATUS = { menunggu: "Menunggu", diterapkan: "Diterapkan", dipertahankan: "Dipertahankan", diganti: "Diganti revisi" };
const SOURCE = { impulse: "Sinyal RaceTime2", camera: "Waktu kamera", manual: "Input manual" };
const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "menunggu", label: "Menunggu" },
  { key: "diterapkan", label: "Diterapkan" },
];
const STRIP_H = 220; // tinggi tampilan gambar slit-scan (px)

export default {
  name: "PhotofinishResults",
  components: { Icon },
  props: { value: { type: Boolean, default: false } },
  data() {
    return {
      items: [], filter: "all", query: "", selectedKey: null,
      image: null, imageLoading: false, view: "slit", copied: null, panelWidth: 600,
      frameSize: null, showGuide: true,
      STATUS: STATUS, SOURCE: SOURCE, FILTERS: FILTERS,
      icons: {
        copy: icCopy, del: icDel, search: icSearch, close: icClose, refresh: icRefresh, image: icImage,
        score: icScore, wait: icWait, check: icCheck, inbox: icInbox, warn: icWarn,
      },
    };
  },
  computed: {
    count() {
      const c = {};
      this.items.forEach((h) => (c[h.status] = (c[h.status] || 0) + 1));
      return c;
    },
    shown() {
      const q = this.query.trim().toLowerCase();
      return this.items.filter((h) => {
        if (this.filter !== "all" && h.status !== this.filter) return false;
        if (!q) return true;
        return [h.teamName, h.teamId, h.bib, h.sessionLabel, h.sessionNote, h.eventName, h.finishTime]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
    },
    selected() {
      return this.items.find((h) => this.keyOf(h) === this.selectedKey) || null;
    },
    /** Garis imajiner: tegak lurus di tengah garis finish (sama seperti Standby Kamera). */
    guideX() {
      const fl = this.image && this.image.finishLine;
      if (fl) return (fl.x1 + fl.x2) / 2;
      return this.frameSize ? this.frameSize.w / 2 : 0;
    },
    stripWidth() {
      // Sumbu horizontal slit-scan = waktu → boleh direntangkan. Rekaman pendek
      // / fps rendah (mis. 109 kolom) tetap terbaca: min. 4 px per kolom dan
      // selebar panel.
      const im = this.image;
      if (!im || !im.ok || !im.height) return 0;
      return Math.max(Math.round((im.width / im.height) * STRIP_H), im.width * 4, this.panelWidth);
    },
  },
  watch: {
    // Filter/cari berubah → detail mengikuti baris yang terlihat.
    shown(list) {
      if (list.length && !list.some((h) => this.keyOf(h) === this.selectedKey)) this.select(list[0]);
    },
  },
  mounted() {
    this._off = onHistoryChanged(() => {
      if (this.value) this.load();
    });
  },
  beforeDestroy() {
    if (this._off) this._off();
    clearTimeout(this._copyTimer);
  },
  methods: {
    keyOf(h) {
      return h.crossingId + ":" + h.revision;
    },
    async load() {
      this.items = (await getHistory()) || [];
      if (!this.selected) {
        const first = this.items.find((h) => h.status === "menunggu") || this.items[0];
        if (first) this.select(first);
      }
    },
    select(h) {
      if (this.keyOf(h) === this.selectedKey && this.image) return;
      this.selectedKey = this.keyOf(h);
      this.view = "slit";
      this.copied = null;
      this.loadImage(h);
    },
    async loadImage(h) {
      const key = this.keyOf(h);
      this.imageLoading = true;
      this.image = null;
      this.frameSize = null;
      const res = await getResultImage(h.crossingId);
      if (this.selectedKey !== key) return; // pindah baris saat menunggu
      this.image = res;
      this.imageLoading = false;
    },
    onFrameLoad(ev) {
      const img = ev.target;
      this.frameSize = { w: img.naturalWidth, h: img.naturalHeight };
    },
    async centerMark() {
      const el = this.$refs.strip;
      if (el && el.clientWidth) this.panelWidth = el.clientWidth;
      await this.$nextTick(); // lebar gambar dihitung ulang dari lebar panel
      const im = this.image;
      if (!el || !im || !im.ok) return;
      el.scrollLeft = Math.max(0, (im.column / im.width) * this.stripWidth - el.clientWidth / 2);
    },
    copy(text, which) {
      if (!text) return;
      copyText(text);
      this.copied = which;
      clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(() => (this.copied = null), 1500);
    },
    async remove(h) {
      const waiting = h.status === "menunggu";
      const ok = await this.$bvModal.msgBoxConfirm(
        `Hapus hasil ${h.teamName || h.teamId} (${h.finishTime}) dari daftar?` +
          (waiting ? " Hasil ini BELUM diterapkan — setelah dihapus tidak akan diterapkan otomatis." : "") +
          " Data di STS Photo Finish tidak ikut terhapus.",
        { title: "Hapus dari daftar", okTitle: "Hapus", okVariant: "danger", cancelTitle: "Batal", centered: true }
      );
      if (!ok) return;
      await deleteHistory(h.crossingId, h.revision);
      const idx = this.shown.findIndex((x) => this.keyOf(x) === this.keyOf(h));
      const next = this.shown[idx + 1] || this.shown[idx - 1] || null;
      this.selectedKey = null;
      this.image = null;
      await this.load();
      if (next && next !== h) this.select(next);
    },
    penalties(h) {
      const p = h.penalties || {};
      const out = [];
      if (p.crewIncomplete) out.push("Awak kurang");
      if (p.capsized) out.push("Perahu terbalik");
      if (p.secondCrossing) out.push("Melintas 2×");
      return out;
    },
    fmtDateTime(iso) {
      if (!iso) return "—";
      const d = new Date(iso);
      return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) + ", " +
        d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    },
  },
};
</script>

<style>
/* tidak scoped: kelas ini dipasang pada elemen milik b-modal */
.pfr-dialog {
  max-width: 1180px;
}
.pfr {
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
}
</style>

<style scoped>
.mono {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}
/* ---------- kepala ---------- */
.pfr-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: linear-gradient(90deg, #1874a5, #1d8fbb);
  color: #fff;
}
.pfr-head__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
}
.pfr-head__text {
  flex: 1;
  min-width: 0;
}
.pfr-head__text h5 {
  margin: 0;
  font-weight: 800;
}
.pfr-head__text small {
  opacity: 0.85;
}
.pfr-icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #fff;
  cursor: pointer;
}
.pfr-icon-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}
/* ---------- alat ---------- */
.pfr-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}
.pfr-seg {
  display: inline-flex;
  padding: 3px;
  border-radius: 12px;
  background: #e8eef4;
}
.pfr-seg button {
  border: 0;
  background: transparent;
  padding: 6px 12px;
  border-radius: 9px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}
.pfr-seg button.on {
  background: #fff;
  color: #1874a5;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}
.pfr-seg__n {
  display: inline-block;
  min-width: 20px;
  margin-left: 4px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(24, 116, 165, 0.12);
  font-size: 11px;
}
.pfr-seg.sm button {
  padding: 3px 10px;
  font-size: 12px;
}
.pfr-search {
  flex: 1;
  min-width: 220px;
  max-width: 380px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 7px 12px;
  border: 1px solid #cfd8e6;
  border-radius: 12px;
  background: #fff;
  color: #94a3b8;
}
.pfr-search input {
  flex: 1;
  border: 0;
  outline: 0;
  font-size: 14px;
  color: #0f172a;
}
/* ---------- kosong ---------- */
.pfr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 64px 16px;
  color: #64748b;
  text-align: center;
}
.pfr-empty strong {
  color: #0f172a;
}
/* ---------- tubuh ---------- */
.pfr-body {
  display: grid;
  grid-template-columns: minmax(300px, 40%) 1fr;
  height: min(70vh, 720px);
}
.pfr-list {
  list-style: none;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
  border-right: 1px solid #e5e7eb;
  background: #fbfcfe;
}
.pfr-list__none {
  padding: 24px;
  text-align: center;
  color: #94a3b8;
}
.pfr-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
}
.pfr-item:hover {
  background: #f1f5f9;
}
.pfr-item.sel {
  background: #eaf4fa;
  border-color: #9cc9e3;
}
.pfr-item.old {
  opacity: 0.55;
}
.pfr-rank {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  font-weight: 800;
  background: #e2e8f0;
  color: #334155;
}
.pfr-rank.r1 {
  background: #fde68a;
  color: #78350f;
}
.pfr-rank.r2 {
  background: #e5e7eb;
  color: #374151;
}
.pfr-rank.r3 {
  background: #fed7aa;
  color: #7c2d12;
}
.pfr-item__main {
  flex: 1;
  min-width: 0;
}
.pfr-item__team {
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pfr-item__team small,
.pfr-detail__team small {
  margin-left: 6px;
  font-weight: 600;
  color: #64748b;
}
.pfr-item__sub {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pfr-item__time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.pfr-item__time .mono {
  font-weight: 700;
  color: #0f172a;
}
/* ---------- status ---------- */
.pfr-pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.pfr-pill.lg {
  padding: 4px 12px;
  font-size: 12px;
}
.st-menunggu {
  background: #fdf1de;
  color: #b4630a;
}
.st-diterapkan {
  background: #e6f7ed;
  color: #1a7f4b;
}
.st-dipertahankan {
  background: #eef2ff;
  color: #3730a3;
}
.st-diganti {
  background: #f3f4f6;
  color: #6b7280;
}
/* ---------- detail ---------- */
.pfr-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  overflow-y: auto;
}
/* isi panel tidak boleh menyusut (gambar bukti tetap setinggi aslinya) — panel yang menggulir */
.pfr-detail > * {
  flex-shrink: 0;
}
.pfr-detail--empty {
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
.pfr-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.pfr-detail__team {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}
.pfr-detail__sess {
  color: #475569;
  font-size: 13px;
}
.pfr-detail__sess b {
  color: #1c4c7a;
}
.pfr-wait {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -6px 0 0;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fff7ed;
  color: #9a3412;
  font-size: 13px;
}
.pfr-times {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 10px;
}
.pfr-time {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
}
.pfr-time.main {
  border-color: #9cc9e3;
  background: #f3f9fd;
}
.pfr-time__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}
.pfr-time__value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  user-select: all;
  cursor: copy;
}
.pfr-time:not(.main) .pfr-time__value {
  font-size: 20px;
}
.pfr-copy,
.pfr-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #1874a5;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
  font-size: 13px;
  background: #1874a5;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}
.pfr-copy:hover {
  background: #1f6fa3;
}
.pfr-copy.ghost {
  background: #fff;
  color: #1874a5;
}
.pfr-copy.ghost:hover {
  background: #eaf4fa;
}
.pfr-btn {
  background: #fff;
  color: #1874a5;
}
.pfr-btn.sm {
  padding: 4px 10px;
  font-size: 12px;
}
.pfr-btn.danger {
  border-color: #fecaca;
  color: #b91c1c;
}
.pfr-btn.danger:hover {
  background: #fef2f2;
  border-color: #dc2626;
}
/* ---------- gambar bukti ---------- */
.pfr-evidence {
  border-radius: 14px;
  overflow: hidden;
  background: #1f1f1f;
  color: #cbd5e1;
}
.pfr-evidence__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
}
.pfr-evidence__bar .pfr-seg {
  background: rgba(255, 255, 255, 0.1);
}
.pfr-evidence__bar .pfr-seg button {
  color: #cbd5e1;
}
.pfr-evidence__bar .pfr-seg button.on {
  background: #fff;
  color: #1874a5;
}
.pfr-evidence__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  font-size: 13px;
}
.pfr-strip {
  overflow-x: auto;
  background: #111;
}
.pfr-strip__inner {
  position: relative;
  height: 220px;
}
.pfr-strip__inner img {
  display: block;
  width: 100%;
  height: 100%;
}
.pfr-mark {
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 2px dashed rgba(203, 213, 225, 0.8);
  pointer-events: none;
}
.pfr-mark b {
  position: absolute;
  top: 6px;
  left: 4px;
  padding: 1px 6px;
  border-radius: 6px;
  background: #64748b;
  color: #fff;
  font-size: 11px;
}
.pfr-mark.self {
  border-left: 2px solid #ff3b30;
}
.pfr-mark.self b {
  background: #ff3b30;
}
.pfr-frame {
  background: #111;
  text-align: center;
}
.pfr-frame__stage {
  position: relative;
  display: inline-block;
  line-height: 0;
  max-width: 100%;
}
.pfr-frame__stage img {
  max-width: 100%;
  max-height: 320px;
}
.pfr-frame__stage svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.pfr-ln-finish {
  stroke: #ff3b30;
  stroke-width: 2.5;
  vector-effect: non-scaling-stroke;
}
.pfr-ln-guide {
  stroke: #22d3ee;
  stroke-width: 2.5;
  stroke-dasharray: 12 7;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 2px #000);
}
.pfr-evidence__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 12px 10px;
}
.pfr-evidence__hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}
.pfr-key {
  display: inline-block;
  width: 16px;
  height: 0;
  margin: 0 6px 3px 2px;
  vertical-align: middle;
  border-top: 2.5px solid #ff3b30;
}
.pfr-key.cyan {
  border-top: 2.5px dashed #22d3ee;
  margin-left: 10px;
}
.pfr-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  white-space: nowrap;
  cursor: pointer;
}
/* ---------- meta ---------- */
.pfr-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin: 0;
}
.pfr-meta .wide {
  grid-column: 1 / -1;
}
.pfr-meta dt {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #94a3b8;
}
.pfr-meta dd {
  margin: 2px 0 0;
  color: #0f172a;
  font-weight: 600;
}
.pfr-pen {
  display: inline-block;
  margin-right: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
}
.pfr-detail__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #eef2f6;
}
.pfr-foot__hint {
  font-size: 12px;
  color: #94a3b8;
}
@media (max-width: 900px) {
  .pfr-body {
    grid-template-columns: 1fr;
    height: auto;
  }
  .pfr-list {
    max-height: 260px;
    border-right: 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .pfr-times {
    grid-template-columns: 1fr;
  }
}
</style>
