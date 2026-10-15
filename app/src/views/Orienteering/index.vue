<template>
  <div class="ori-page">
    <PageHero
      title="Orienteering"
      crumb="Orienteering"
      icon="mdi:compass-outline"
      subtitle="Event orienteering mandiri — kelas & course, registrasi SI Card, readout kartu, dan hasil per kelas"
      :stats="stats"
    >
      <template #actions>
        <button type="button" class="ori-btn ori-btn--primary" @click="openCreate">
          <Icon icon="mdi:plus" /> Event Baru
        </button>
      </template>
    </PageHero>

    <div class="ori-wrap">
      <div v-if="loading" class="ori-empty">Memuat event…</div>
      <div v-else-if="error" class="ori-empty ori-empty--error">
        {{ error }}
        <button type="button" class="ori-btn ori-btn--ghost ml-2" @click="load">Coba lagi</button>
      </div>
      <div v-else-if="!events.length" class="ori-empty">
        <Icon icon="mdi:compass-outline" class="ori-empty__icon" />
        <p class="mb-1 font-weight-bold">Belum ada event orienteering</p>
        <p class="text-muted mb-3">Buat event pertama untuk mulai mendaftarkan peserta & SI Card.</p>
        <button type="button" class="ori-btn ori-btn--primary" @click="openCreate">
          <Icon icon="mdi:plus" /> Event Baru
        </button>
      </div>

      <div v-else class="ori-grid">
        <article v-for="ev in events" :key="ev._id" class="oc" @click="open(ev)">
          <!-- Cover -->
          <div class="oc-cover" :class="{ 'oc-cover--empty': !(ev.image && ev.image.url) }">
            <img v-if="ev.image && ev.image.url" :src="ev.image.url" :alt="ev.name" loading="lazy" />
            <div v-else class="oc-cover__placeholder">
              <Icon icon="mdi:compass-rose" />
            </div>
            <div class="oc-cover__shade"></div>
            <span class="oc-status" :class="'oc-status--' + statusOf(ev).key">
              <span class="oc-status__dot"></span>{{ statusOf(ev).label }}
            </span>
            <span v-if="ev.logo && ev.logo.url" class="oc-logo"><img :src="ev.logo.url" :alt="'Logo ' + ev.name" /></span>
            <span v-if="ev.startDate || ev.date" class="oc-date">
              <span class="oc-date__day">{{ dayOf(ev.startDate || ev.date) }}</span>
              <span class="oc-date__mon">{{ monthOf(ev.startDate || ev.date) }}</span>
            </span>
          </div>

          <!-- Body -->
          <div class="oc-body">
            <h3 class="oc-title" :title="ev.name">{{ ev.name }}</h3>
            <div class="oc-meta">
              <Icon icon="mdi:calendar-range" />
              {{ dateRange(ev) || "Tanggal belum diatur" }}
            </div>

            <ul v-if="(ev.races || []).length" class="oc-races">
              <li v-for="r in ev.races" :key="r.id">
                <span class="oc-race__name"><Icon icon="mdi:run-fast" /> {{ r.name }}</span>
                <span class="oc-race__loc">
                  <Icon icon="mdi:map-marker-outline" />
                  {{ r.location || ev.location || "Lokasi belum diatur" }}
                </span>
              </li>
            </ul>
            <div v-else-if="ev.location" class="oc-meta">
              <Icon icon="mdi:map-marker-outline" /> {{ ev.location }}
            </div>

            <!-- peserta per Type Event + kategorinya (orang unik, Sprint & Middle dihitung 1x) -->
            <div v-if="breakdownOf(ev).length" class="oc-tbreak">
              <div
                v-for="t in breakdownOf(ev)"
                :key="t.typeId || 'none'"
                class="oc-tb"
                :class="{ 'oc-tb--wre': /world ranking/i.test(t.name) }"
              >
                <div class="oc-tb__head">
                  <span class="oc-type" :class="{ 'oc-type--wre': /world ranking/i.test(t.name) }">{{ t.name }}</span>
                  <span class="oc-tb__count">
                    <b>{{ t.participants }}</b> peserta · {{ t.classes.length }} kategori
                  </span>
                </div>
                <div v-if="t.classes.length" class="oc-tb__cats">
                  <span v-for="c in t.classes" :key="c.id" class="oc-tb__cat" :class="{ 'is-empty': !c.participants }">
                    {{ c.name }} <b>{{ c.participants }}</b>
                  </span>
                </div>
              </div>
            </div>

            <div class="oc-stats">
              <div class="oc-stat">
                <span class="oc-stat__value">{{ (ev.races || []).length || 1 }}</span>
                <span class="oc-stat__label">Jenis</span>
              </div>
              <div class="oc-stat">
                <span class="oc-stat__value">{{ (ev.classes || []).length }}</span>
                <span class="oc-stat__label">Kategori</span>
              </div>
              <div class="oc-stat" title="Orang unik — yang ikut lebih dari satu jenis dihitung sekali">
                <span class="oc-stat__value">{{ ev.participantCount || 0 }}</span>
                <span class="oc-stat__label">Peserta</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="oc-actions" @click.stop>
            <button type="button" class="oc-icon-btn" title="Edit event" @click="openEdit(ev)">
              <Icon icon="mdi:pencil-outline" />
            </button>
            <button
              type="button"
              class="oc-icon-btn"
              title="Duplikat event beserta seluruh datanya"
              :disabled="duplicatingId === ev._id"
              @click="confirmDuplicate(ev)"
            >
              <Icon :icon="duplicatingId === ev._id ? 'mdi:loading' : 'mdi:content-copy'" :class="{ 'oc-spin': duplicatingId === ev._id }" />
            </button>
            <button type="button" class="oc-icon-btn oc-icon-btn--danger" title="Hapus event" @click="confirmDelete(ev)">
              <Icon icon="mdi:trash-can-outline" />
            </button>
            <button type="button" class="ori-btn ori-btn--primary ml-auto" @click="open(ev)">
              Buka Event <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        </article>
      </div>
    </div>

    <b-modal
      v-model="showForm"
      :title="form._id ? 'Edit Event Orienteering' : 'Event Orienteering Baru'"
      size="xl"
      centered
      scrollable
      ok-title="Simpan"
      cancel-title="Batal"
      :ok-disabled="saving || formUploading || !form.name.trim() || !form.startDate"
      @ok.prevent="saveForm"
    >
      <!-- :key -> form dibuat ulang tiap modal dibuka (Create vs Edit) -->
      <OriEventForm
        v-if="showForm"
        :key="formKey"
        v-model="form"
        :participant-count="formParticipantCount"
        @uploading="formUploading = $event"
      />
      <p v-if="formError" class="text-danger small mt-2 mb-0">{{ formError }}</p>
    </b-modal>
  </div>
</template>

<script>
import PageHero from "@/components/common/PageHero.vue";
import OriEventForm from "@/components/orienteering/OriEventForm.vue";
import { ipcRequest } from "@/utils/ipcRequest";

import { PRESET_RACES } from "@/lib/orienteering";

// Event baru: Sprint & Middle Distance langsung terpilih (bisa dihapus/ditambah)
const EMPTY_FORM = () => ({
  _id: "",
  name: "",
  startDate: "",
  endDate: "",
  location: "",
  image: null,
  logo: null,
  liveVisible: true,
  races: PRESET_RACES.map((name, i) => ({ id: `R${Date.now().toString(36)}${i}`, name })),
  types: [],
  classes: [],
});

export default {
  name: "OrienteeringEvents",
  components: { PageHero, OriEventForm },
  data() {
    return {
      events: [],
      loading: true,
      error: "",
      showForm: false,
      saving: false,
      formError: "",
      form: EMPTY_FORM(),
      formKey: 0,
      formParticipantCount: {},
      formUploading: false,
      duplicatingId: "",
    };
  },
  computed: {
    stats() {
      const participants = this.events.reduce((n, e) => n + (e.participantCount || 0), 0);
      return [
        { label: "Event", value: this.events.length },
        { label: "Peserta", value: participants, tone: "info" },
      ];
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = "";
      const res = await ipcRequest("ori:events:list", {});
      this.loading = false;
      if (!res || !res.ok) {
        this.error = (res && res.error) || "Gagal memuat event (cek koneksi database).";
        return;
      }
      this.events = res.data || [];
    },
    formatDate(v) {
      const d = new Date(v);
      return isNaN(d) ? v : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    },
    // Akan datang / Berlangsung / Selesai — dari tanggal hari ini (lokal)
    statusOf(ev) {
      const a = ev.startDate || ev.date;
      const b = ev.endDate || a;
      if (!a) return { key: "draft", label: "Draft" };
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (today < a) return { key: "upcoming", label: "Akan datang" };
      if (today > b) return { key: "done", label: "Selesai" };
      return { key: "live", label: "Berlangsung" };
    },
    dayOf(v) {
      const d = new Date(v);
      return isNaN(d) ? "" : String(d.getDate()).padStart(2, "0");
    },
    monthOf(v) {
      const d = new Date(v);
      return isNaN(d) ? "" : d.toLocaleDateString("id-ID", { month: "short" }).replace(".", "");
    },
    dateRange(ev) {
      const a = ev.startDate || ev.date;
      const b = ev.endDate;
      return b && b !== a ? `${this.formatDate(a)} – ${this.formatDate(b)}` : this.formatDate(a);
    },
    open(ev) {
      this.$router.push({ name: "orienteering-event", params: { id: ev._id } });
    },
    openCreate() {
      this.form = EMPTY_FORM();
      this.formParticipantCount = {};
      this.formError = "";
      this.formKey += 1;
      this.showForm = true;
    },
    async openEdit(ev) {
      this.form = {
        _id: ev._id,
        name: ev.name || "",
        image: ev.image || null,
        liveVisible: ev.liveVisible !== false,
        logo: ev.logo || null,
        startDate: ev.startDate || ev.date || "",
        endDate: ev.endDate || "",
        location: ev.location || "",
        races: ev.races || [],
        types: ev.types || [],
        classes: ev.classes || [],
      };
      this.formError = "";
      // jumlah peserta per kategori -> peringatan saat menghapus kategori
      const ps = await ipcRequest("ori:participants:list", { eventId: ev._id });
      const counts = {};
      ((ps && ps.ok && ps.data) || []).forEach((p) => (counts[p.classId] = (counts[p.classId] || 0) + 1));
      this.formParticipantCount = counts;
      this.formKey += 1;
      this.showForm = true;
    },
    async saveForm() {
      this.saving = true;
      this.formError = "";
      const res = await ipcRequest("ori:event:save", { event: this.form });
      this.saving = false;
      if (!res || !res.ok) {
        this.formError = (res && res.error) || "Gagal menyimpan (cek koneksi database).";
        return;
      }
      this.showForm = false;
      await this.load();
      if (!this.form._id && res.data && res.data._id) this.open(res.data);
    },
    breakdownOf(ev) {
      if (ev.breakdown && ev.breakdown.types) return ev.breakdown.types;
      return (ev.types || []).map((t) => ({ typeId: t.id, name: t.name, participants: 0, classes: [] }));
    },
    async confirmDuplicate(ev) {
      const h = this.$createElement;
      const msg = h("div", [
        h("p", { class: "mb-2" }, [`Buat salinan "${ev.name}" beserta seluruh datanya:`]),
        h("ul", { class: "mb-2 pl-3" }, [
          h("li", "info event, poster & logo, jenis + lokasi"),
          h("li", `Type Event, ${(ev.classes || []).length} kategori & course`),
          h("li", `${ev.participantCount || 0} peserta (semua jenis, termasuk SI Card) & hasil baca kartu`),
        ]),
        h("small", { class: "text-muted" }, "Salinan tidak ditampilkan di Live Result sampai diaktifkan di Edit Event."),
      ]);
      const ok = await this.$bvModal.msgBoxConfirm([msg], {
        title: "Duplikat Event",
        okTitle: "Duplikat",
        cancelTitle: "Batal",
        centered: true,
      });
      if (!ok) return;
      this.duplicatingId = ev._id;
      const res = await ipcRequest("ori:event:duplicate", { id: ev._id }, { timeoutMs: 60000 });
      this.duplicatingId = "";
      if (!res || !res.ok) {
        this.$bvToast.toast((res && res.error) || "Gagal menduplikat event.", { variant: "danger", title: "Gagal" });
        return;
      }
      const d = res.data;
      this.$bvToast.toast(`"${d.event.name}" dibuat — ${d.participants} peserta & ${d.readouts} hasil baca kartu ikut disalin.`, {
        variant: "success",
        title: "Duplikat Event",
        solid: true,
      });
      await this.load();
    },
    async confirmDelete(ev) {
      const ok = await this.$bvModal.msgBoxConfirm(
        `Hapus "${ev.name}" beserta ${ev.participantCount || 0} peserta & seluruh hasil baca kartunya? Tidak bisa dibatalkan.`,
        {
          title: "Hapus Event",
          okTitle: "Hapus",
          cancelTitle: "Batal",
          okVariant: "danger",
          centered: true,
        }
      );
      if (!ok) return;
      const res = await ipcRequest("ori:event:delete", { id: ev._id });
      if (!res || !res.ok) {
        this.$bvToast.toast((res && res.error) || "Gagal menghapus.", { variant: "danger", title: "Gagal" });
        return;
      }
      this.load();
    },
  },
};
</script>

<style scoped>
/* Jarak atas/kiri/kanan & lebar maksimum — sama dgn halaman list lain
   (.list-page di list-pages.css: All Events / All Teams). */
.ori-page {
  max-width: 1320px;
  margin: 28px auto 48px;
  padding: 0 24px;
}
.ori-wrap {
  margin-top: 20px;
}
@media (max-width: 767.98px) {
  .ori-page {
    margin-top: 16px;
    padding: 0 14px;
  }
}
.ori-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}
/* ===== Kartu event ===== */
.oc {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e6edf6;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(15, 42, 67, 0.06);
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}
.oc:hover {
  transform: translateY(-3px);
  border-color: #cfe0f1;
  box-shadow: 0 16px 34px rgba(15, 42, 67, 0.14);
}
.oc-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #0f2f52;
  overflow: hidden;
}
.oc-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}
.oc:hover .oc-cover img {
  transform: scale(1.04);
}
.oc-cover--empty {
  background: radial-gradient(circle at 75% 20%, rgba(37, 176, 235, 0.55), transparent 55%),
    linear-gradient(135deg, #0f2f52 0%, #1c4c7a 55%, #1d7fb8 100%);
}
.oc-cover__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.22);
  font-size: 92px;
}
.oc-cover__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, transparent 38%, transparent 65%, rgba(15, 23, 42, 0.25) 100%);
  pointer-events: none;
}
.oc-status {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
}
.oc-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}
.oc-status--upcoming .oc-status__dot {
  background: #2563eb;
}
.oc-status--live {
  color: #047857;
}
.oc-status--live .oc-status__dot {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}
.oc-status--done {
  color: #64748b;
}
.oc-logo {
  position: absolute;
  left: 14px;
  bottom: 12px;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #fff;
  padding: 5px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.28);
  border: 2px solid #fff;
}
.oc-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.oc-date {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 52px;
  border-radius: 12px;
  overflow: hidden;
  text-align: center;
  background: #fff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  line-height: 1;
}
.oc-date__day {
  display: block;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  padding: 6px 0 2px;
}
.oc-date__mon {
  display: block;
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #fff;
  background: #1c4c7a;
  padding: 3px 0;
}
.oc-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 12px;
  flex: 1;
}
.oc-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.oc-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  color: #64748b;
  font-weight: 600;
}
.oc-races {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.oc-races li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 10px;
  background: #f0fdf9;
  border: 1px solid #d1fae5;
  font-size: 0.82rem;
}
.oc-race__name {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 800;
  color: #047857;
  white-space: nowrap;
}
.oc-race__loc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #475569;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.oc-types {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.oc-type {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 999px;
  background: #eef4fb;
  color: #1c4c7a;
  border: 1px solid #d6e4f3;
}
.oc-type--wre {
  background: #fff7e6;
  color: #b45309;
  border-color: #fde3b0;
}
.oc-tbreak {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.oc-tb {
  padding: 7px 9px;
  border-radius: 10px;
  background: #f6f9fd;
  border: 1px solid #e3ecf6;
}
.oc-tb--wre {
  background: #fffaf0;
  border-color: #fbe6bf;
}
.oc-tb__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.oc-tb__count {
  font-size: 11.5px;
  color: #64748b;
  white-space: nowrap;
}
.oc-tb__count b {
  color: #0f172a;
  font-size: 13px;
}
.oc-tb__cats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.oc-tb__cat {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #334155;
}
.oc-tb__cat b {
  color: #1c4c7a;
  margin-left: 2px;
}
.oc-tb__cat.is-empty {
  color: #94a3b8;
}
.oc-tb__cat.is-empty b {
  color: #94a3b8;
}
.oc-spin {
  animation: oc-spin 0.9s linear infinite;
}
@keyframes oc-spin {
  to { transform: rotate(360deg); }
}
.oc-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #eef2f7;
}
.oc-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.oc-stat__value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1c4c7a;
  line-height: 1.1;
}
.oc-stat__label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}
.oc-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 14px;
}
.oc-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #dde6f1;
  background: #fff;
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.oc-icon-btn:hover {
  border-color: #9cc3e6;
  color: #1c4c7a;
}
.oc-icon-btn--danger {
  color: #b91c3c;
  border-color: #f5d0d8;
}
.oc-icon-btn--danger:hover {
  background: #fdf2f4;
  color: #9f1239;
  border-color: #f0b6c2;
}
.ori-empty {
  background: #fff;
  border: 1px dashed #d6e0ec;
  border-radius: 16px;
  padding: 40px 16px;
  text-align: center;
  color: #475569;
}
.ori-empty--error {
  color: #b91c3c;
}
.ori-empty__icon {
  font-size: 42px;
  color: #94a3b8;
  margin-bottom: 8px;
}
.ori-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  background: transparent;
}
.ori-btn--primary {
  background: linear-gradient(135deg, #1c4c7a, #2b7fc0);
  color: #fff;
}
.ori-btn--primary:hover {
  filter: brightness(1.08);
}
.ori-btn--ghost {
  border-color: #dde6f1;
  color: #334155;
  background: #fff;
}
.ori-btn--ghost:hover {
  border-color: #9cc3e6;
  color: #1c4c7a;
}
.ori-btn--danger-ghost {
  border-color: #f5d0d8;
  color: #b91c3c;
  background: #fff;
}
.ori-btn--danger-ghost:hover {
  background: #fdf2f4;
}
</style>
