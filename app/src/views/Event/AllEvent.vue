<template>
  <div class="list-page">
    <PageHero
      title="All Events"
      crumb="All Events"
      icon="mdi:calendar-multiple"
      subtitle="Kelola daftar event, level, tanggal, status, dan aksi"
      :stats="[
        { label: 'Total Events', value: normalizedEvents.length },
        { label: 'Active', value: activeEventCount, tone: 'success' },
        { label: 'Inactive', value: inactiveEventCount, tone: 'warning' },
      ]"
    >
      <template #actions>
        <button type="button" class="ph-btn ph-btn--primary" @click="goTo('create-new')">
          <Icon icon="mdi:plus" />
          Create New Event
        </button>
      </template>
    </PageHero>

    <div class="lp-card">
      <!-- TOOLBAR -->
      <div class="lp-toolbar">
        <div class="lp-search">
          <Icon icon="mdi:magnify" class="lp-search__icon" />
          <input
            v-model="query"
            type="text"
            class="lp-search__input"
            placeholder="Cari nama event, level, atau tanggal…"
          />
          <button v-if="query" type="button" class="lp-search__clear" @click="query = ''">
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div class="lp-filters">
          <div class="lp-select">
            <Icon icon="mdi:filter-variant" class="lp-select__icon" />
            <select v-model="levelFilter" class="lp-select__input">
              <option v-for="o in levelOptionsUI" :key="o.value" :value="o.value">
                {{ o.value ? o.text : "Semua level" }}
              </option>
            </select>
            <Icon icon="mdi:chevron-down" class="lp-select__chev" />
          </div>

          <div class="lp-segment" role="group" aria-label="Filter status">
            <button
              v-for="opt in statusSegments"
              :key="opt.value"
              type="button"
              class="lp-segment__btn"
              :class="{ active: statusFilter === opt.value }"
              @click="statusFilter = opt.value"
            >
              {{ opt.text }}
              <span class="lp-segment__count">{{ opt.count }}</span>
            </button>
          </div>

          <button
            v-if="query || levelFilter || statusFilter"
            type="button"
            class="lp-reset"
            @click="resetFilters"
          >
            <Icon icon="mdi:filter-remove-outline" />
            Reset
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-responsive lp-table-wrap">
        <b-table
          hover
          :items="filteredEvents"
          :fields="fields"
          :per-page="perPage"
          :current-page="currentPage"
          class="lp-table mb-0"
          show-empty
          empty-text=""
          responsive="md"
          :busy="loading"
        >
          <template #table-busy>
            <div class="text-center my-4 text-muted">
              <b-spinner small class="mr-2" /> Loading events…
            </div>
          </template>

          <template #empty>
            <div class="lp-empty">
              <Icon icon="mdi:calendar-blank-outline" width="40" height="40" />
              <div class="lp-empty__title">Event tidak ditemukan</div>
              <small>Coba ubah pencarian/filter, atau buat event baru.</small>
            </div>
          </template>

          <template #cell(no)="row">
            <span class="lp-muted">
              {{ (currentPage - 1) * perPage + row.index + 1 }}
            </span>
          </template>

          <!-- Event: poster + nama (klik = buka detail) + lokasi -->
          <template #cell(name)="row">
            <div
              class="lp-event"
              :class="{ 'lp-event--disabled': row.item.status !== 'activated' }"
              :title="row.item.status !== 'activated' ? 'Event inactive — aktifkan dulu utk membuka detail' : 'Buka detail event'"
              @click="openEvent(row.item)"
            >
              <img
                :src="posterSrc(row.item) || defaultImg"
                alt=""
                class="lp-event__thumb"
                @error="onPosterError"
              />
              <div class="lp-event__text">
                <div class="lp-event__name">{{ row.item.name }}</div>
                <div class="lp-event__loc">
                  <Icon icon="mdi:map-marker-outline" />
                  {{ eventLocation(row.item) }}
                </div>
              </div>
            </div>
          </template>

          <template #cell(level)="row">
            <span v-if="row.item.level" class="lp-chip">{{ row.item.level }}</span>
            <span v-else class="lp-muted">-</span>
          </template>

          <template #cell(date)="row">
            <span class="lp-date">
              <Icon icon="mdi:calendar-blank-outline" />
              {{ row.item.date || "-" }}
            </span>
          </template>

          <template #cell(status)="row">
            <span v-if="row.item.status === 'inactive'" class="lp-status lp-status--off">
              <span class="lp-status__dot"></span> Inactive
            </span>
            <span v-else class="lp-status lp-status--on">
              <span class="lp-status__dot"></span> Active
            </span>
          </template>

          <template #cell(actions)="row">
            <div class="lp-actions">
              <b-form-checkbox
                switch
                size="lg"
                :checked="row.item.status === 'activated'"
                :disabled="togglingId === String(row.item._id)"
                :title="row.item.status === 'activated' ? 'Klik utk set Inactive' : 'Klik utk set Active'"
                @change="toggleEventStatus(row.item)"
              />
              <button
                type="button"
                class="lp-icon-btn lp-icon-btn--danger"
                title="Hapus event"
                @click="confirmDeleteEvent(row.item)"
              >
                <Icon icon="mdi:trash-can-outline" />
              </button>
            </div>
          </template>
        </b-table>
      </div>

      <!-- PAGINATION -->
      <div class="lp-footer">
        <small class="lp-muted">
          {{ filteredEvents.length === 0 ? 0 : (currentPage - 1) * perPage + 1 }} –
          {{ Math.min(currentPage * perPage, filteredEvents.length) }}
          of {{ filteredEvents.length }} events
        </small>

        <b-pagination
          v-model="currentPage"
          :total-rows="filteredEvents.length"
          :per-page="perPage"
          align="center"
          size="md"
          class="custom-pagination mb-0"
          first-number
          last-number
        />

        <div class="lp-perpage">
          <span class="lp-muted">Rows per page</span>
          <select v-model.number="perPage" class="lp-perpage__select">
            <option v-for="n in [10, 20, 50]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { ipcRenderer } from "electron";
import PageHero from "@/components/common/PageHero.vue";
import defaultImg from "@/assets/images/default-first.jpeg";

export default {
  name: "AllEvents",
  components: { Icon, PageHero },
  data() {
    return {
      loading: false,
      defaultImg,
      // _id (string) event yg lagi diproses toggle status-nya — dipakai
      // disable switch itu doang selama IPC round-trip, bukan seluruh tabel.
      togglingId: "",
      events: [],
      query: "",
      statusFilter: "",
      levelFilter: "",
      perPage: 10,
      currentPage: 1,
      fields: [
        {
          key: "no",
          label: "#",
          thStyle: { width: "64px" },
          class: "text-center align-middle",
        },
        { key: "name", label: "Event Name", class: "align-middle" },
        { key: "level", label: "Event Level", class: "align-middle" },
        { key: "date", label: "Event Date", class: "align-middle text-nowrap" },
        { key: "status", label: "Status", class: "align-middle" },
        {
          key: "actions",
          label: "Action",
          class: "text-center align-middle",
          thStyle: { width: "150px" },
        },
      ],
      levelOptionsUI: [
        { value: "", text: "Filter by event level" },
        { value: "Classification - A", text: "Classification - A" },
        { value: "Classification - B", text: "Classification - B" },
        { value: "Classification - C", text: "Classification - C" },
        { value: "Classification - D", text: "Classification - D" },
        { value: "Classification - E", text: "Classification - E" },
        { value: "Classification - F", text: "Classification - F" },
        { value: "Classification - G", text: "Classification - G" },
      ],
      statusOptionsUI: [
        { value: "", text: "Filter by status" },
        { value: "inactive", text: "Inactive" },
        { value: "activated", text: "Active" },
      ],
    };
  },

  mounted() {
    this.getEvents(); // load saat halaman dibuka
  },

  watch: {
    // Filter/pencarian berubah -> balik ke halaman 1 supaya hasil tidak
    // "kosong" krn masih di halaman yg sudah tidak ada.
    query() {
      this.currentPage = 1;
    },
    levelFilter() {
      this.currentPage = 1;
    },
    statusFilter() {
      this.currentPage = 1;
    },
  },

  computed: {
    // normalisasi raw event → { name, level, date, status }
    normalizedEvents() {
      const fmtDate = (v) => {
        if (!v) return "";
        const d = new Date(v);
        return isNaN(d.getTime())
          ? String(v)
          : d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
      };
      const range = (s, e) => {
        const L = fmtDate(s),
          R = fmtDate(e);
        return L && R ? `${L} - ${R}` : L || R || "";
      };

      return (this.events || []).map((ev) => {
        // dukung berbagai skema field
        const name = ev.eventName || ev.name || ev.title || "(untitled)";
        const level =
          ev.eventLevel || ev.levelName || ev.level || ev.category || "";
        const start =
          ev.startDateEvent ||
          ev.start ||
          ev.eventStart ||
          ev.dateStart ||
          ev.beginDate;
        const end =
          ev.endDateEvent ||
          ev.end ||
          ev.eventEnd ||
          ev.dateEnd ||
          ev.finishDate;
        const date = ev.date || range(start, end);
        const status =
          ev.statusEvent && String(ev.statusEvent).toLowerCase() == "activated"
            ? "activated"
            : "inactive"; // fallback sederhana

        return { ...ev, name, level, date, status };
      });
    },

    // apply search + filter
    filteredEvents() {
      let rows = this.normalizedEvents.slice();

      if (this.query) {
        const q = this.query.toLowerCase();
        rows = rows.filter((r) =>
          [r.name, r.level, r.date].some((t) =>
            String(t).toLowerCase().includes(q)
          )
        );
      }
      if (this.levelFilter)
        rows = rows.filter((r) => r.level === this.levelFilter);
      if (this.statusFilter)
        rows = rows.filter((r) => r.status === this.statusFilter);

      return rows;
    },

    // Tombol segmen filter status (value sama dgn statusFilter lama).
    statusSegments() {
      return [
        { value: "", text: "Semua", count: this.normalizedEvents.length },
        { value: "activated", text: "Active", count: this.activeEventCount },
        { value: "inactive", text: "Inactive", count: this.inactiveEventCount },
      ];
    },
    activeEventCount() {
      return this.normalizedEvents.filter((e) => e.status === "activated")
        .length;
    },
    inactiveEventCount() {
      return this.normalizedEvents.filter((e) => e.status !== "activated")
        .length;
    },

    currentDateTime() {
      const d = new Date();
      return (
        d.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
        " | " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
    },
  },

  methods: {
    // === ambil events dari IPC ===
    getEvents() {
      this.loading = true;
      // hindari listener menumpuk saat HMR
      ipcRenderer.removeAllListeners("get-events-reply");
      ipcRenderer.send("get-events");
      ipcRenderer.once("get-events-reply", (_e, data) => {
        this.events = Array.isArray(data) ? data : (data && data.events) || [];
        this.loading = false;
      });
    },

    goTo(path) {
      if (!path) return this.$router.push("/");
      this.$router.push("/" + path);
    },
    goBack() {
      if (this.$router) this.$router.back();
      else this.$emit("back");
    },

    // Klik nama event -> detail (event inactive diblokir, sama dgn Home).
    openEvent(item) {
      if (!item || item.status !== "activated") return;
      const id = item._id ? String(item._id) : "";
      if (id) this.$router.push("/event-detail/" + id);
    },
    eventLocation(ev) {
      const parts = [ev.riverName, ev.addressCity, ev.addressState]
        .map((v) => String(v || "").trim())
        .filter(Boolean);
      return parts.length ? parts.join(" · ") : "Lokasi belum diisi";
    },
    // Sama dgn posterSrc() di Home.vue.
    posterSrc(ev) {
      if (!ev) return "";
      if (ev.poster && ev.poster.secure_url) return String(ev.poster.secure_url);
      if (ev.poster_url) return String(ev.poster_url);
      const p = ev.poster || {};
      const pub = p.public_id ? String(p.public_id) : "";
      if (!pub) return "";
      const ver = p.version !== undefined && p.version !== null ? "v" + p.version + "/" : "";
      const ext = p.format ? "." + String(p.format) : "";
      return "https://res.cloudinary.com/kikiaka/image/upload/" + ver + pub + ext;
    },
    onPosterError(e) {
      if (e && e.target) {
        e.target.onerror = null;
        e.target.src = this.defaultImg;
      }
    },

    resetFilters() {
      this.query = "";
      this.levelFilter = "";
      this.statusFilter = "";
    },

    async confirmDeleteEvent(item) {
      const id = item && item._id ? String(item._id) : "";
      if (!id) return;

      const name = (item && item.name) || "event ini";
      let ok = false;
      try {
        ok = await this.$bvModal.msgBoxConfirm(
          `Hapus "${name}"? Tindakan ini tidak bisa dibatalkan.`,
          {
            title: "Konfirmasi Hapus",
            okVariant: "danger",
            okTitle: "Hapus",
            cancelTitle: "Batal",
            centered: true,
          }
        );
      } catch (e) {
        ok = false;
      }
      if (!ok) return;

      this.loading = true;
      ipcRenderer.removeAllListeners("delete-event-reply");
      ipcRenderer.send("delete-event", id);
      ipcRenderer.once("delete-event-reply", (_e, res) => {
        this.loading = false;
        if (res && res.ok) {
          this.getEvents();
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Gagal menghapus event",
            detail: res && res.error ? res.error : "Terjadi kesalahan.",
          });
        }
      });
    },

    // Toggle Active <-> Inactive dari switch di kolom Action — lihat
    // setEventStatus() di insertNewEvent.js. Update optimistik field
    // statusEvent di array lokal on success (tanpa reload penuh via
    // getEvents()), sama pola ringan dgn toggle Official/Provisional di
    // Result pages.
    toggleEventStatus(item) {
      const id = item && item._id ? String(item._id) : "";
      if (!id || typeof ipcRenderer === "undefined") return;

      const nextStatus = item.status === "activated" ? "Inactive" : "Activated";

      this.togglingId = id;
      ipcRenderer.removeAllListeners("event:set-status-reply");
      ipcRenderer.once("event:set-status-reply", (_e, res) => {
        this.togglingId = "";
        if (res && res.ok) {
          const target = this.events.find((e) => String(e._id) === id);
          if (target) target.statusEvent = res.status;
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Gagal mengubah status event",
            detail: res && res.error ? res.error : "Terjadi kesalahan.",
          });
        }
      });
      ipcRenderer.send("event:set-status", { eventId: id, status: nextStatus });
    },
  },
};
</script>

