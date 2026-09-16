<template>
  <div class="mt-5">
    <b-row>
      <b-col cols="10" offset="1" class="mb-4">
        <div class="card-wrapper p-3 mb-2">
          <!-- TOP BAR (breadcrumb + datetime) -->
          <div
            class="d-flex align-items-center justify-content-between text-muted small"
          >
            <b-breadcrumb class="mb-0">
              <b-breadcrumb-item to="/">
                <Icon icon="mdi:home-outline" class="mr-1" />
                Dashboard
              </b-breadcrumb-item>
              <b-breadcrumb-item active>
                {{ $route.params.pageTitle || "List Event" }}
              </b-breadcrumb-item>
            </b-breadcrumb>
            <div>{{ currentDateTime }}</div>
          </div>
        </div>

        <!-- HEADER -->
        <div
          class="card-wrapper mt-1"
          style="
            padding-left: 45px;
            padding-right: 45px;
            padding-bottom: 45px;
            padding-top: 25px;
          "
        >
          <div
            @click="goBack"
            class="btn-custom d-flex align-items-center mb-3"
          >
            <Icon icon="mdi:chevron-left" class="mr-1" />
            <span>Back</span>
          </div>
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h2 class="page-title mb-1">All Events</h2>
              <p class="page-subtitle mb-0">
                Kelola daftar event, level, tanggal, status, dan aksi
              </p>
            </div>
            <div class="d-flex align-items-center">
              <b-button
                style="border-radius: 12px"
                variant="outline-info"
                class="w-100"
                @click="goTo('create-new')"
              >
                <Icon icon="mdi:plus" width="18" height="18" />
                Create New Event
              </b-button>
            </div>
          </div>

          <!-- STAT SUMMARY -->
          <div class="stat-strip">
            <div class="stat-card">
              <div class="stat-card__icon">
                <Icon icon="mdi:calendar-multiple" />
              </div>
              <div>
                <div class="stat-card__value">{{ normalizedEvents.length }}</div>
                <div class="stat-card__label">Total Events</div>
              </div>
            </div>
            <div class="stat-card stat-card--success">
              <div class="stat-card__icon">
                <Icon icon="mdi:calendar-check-outline" />
              </div>
              <div>
                <div class="stat-card__value">{{ activeEventCount }}</div>
                <div class="stat-card__label">Active</div>
              </div>
            </div>
            <div class="stat-card stat-card--warning">
              <div class="stat-card__icon">
                <Icon icon="mdi:calendar-remove-outline" />
              </div>
              <div>
                <div class="stat-card__value">{{ inactiveEventCount }}</div>
                <div class="stat-card__label">Inactive</div>
              </div>
            </div>
          </div>

          <!-- TOOLBAR: Search (pojok kiri) + Filters (pojok kanan) — satu
               baris, sejajar. Filter by Event & Filter by Status
               bersebelahan di grup kanan (margin-left:auto, BUKAN
               justify-content-between, supaya kalau window sempit & baris
               ke-wrap, grup filter tetap nempel kanan — bukan malah balik
               ke kiri krn cuma sendirian di barisnya). -->
          <div
            class="d-flex align-items-center flex-wrap pt-3 pb-1"
            style="gap: 12px"
          >
            <!-- Search -->
            <b-input-group class="input-group-soft" style="max-width: 320px">
              <template #prepend>
                <span class="input-icon-left">
                  <Icon icon="mdi:magnify" />
                </span>
              </template>
              <b-form-input
                v-model="query"
                placeholder="Search event name, level, date…"
                class="no-border-input"
              />
            </b-input-group>

            <div
              class="d-flex align-items-center flex-nowrap ml-auto"
              style="gap: 12px"
            >
              <!-- Filter Level -->
              <b-input-group class="input-group-soft" style="max-width: 220px">
                <template #prepend>
                  <span class="input-icon-left">
                    <Icon icon="mdi:filter-variant" />
                  </span>
                </template>
                <b-form-select
                  v-model="levelFilter"
                  :options="levelOptionsUI"
                  class="no-border-select"
                />
                <template #append>
                  <span class="input-icon-right">
                    <Icon icon="mdi:chevron-down" />
                  </span>
                </template>
              </b-input-group>

              <!-- Filter Status -->
              <b-input-group class="input-group-soft" style="max-width: 220px">
                <template #prepend>
                  <span class="input-icon-left">
                    <Icon icon="mdi:filter-variant" />
                  </span>
                </template>
                <b-form-select
                  v-model="statusFilter"
                  :options="statusOptionsUI"
                  class="no-border-select"
                />
                <template #append>
                  <span class="input-icon-right">
                    <Icon icon="mdi:chevron-down" />
                  </span>
                </template>
              </b-input-group>

              <b-button
                v-if="query || levelFilter || statusFilter"
                size="sm"
                variant="outline-secondary"
                style="border-radius: 12px"
                @click="resetFilters"
              >
                Reset
              </b-button>
            </div>
          </div>

          <!-- TABLE WRAPPER -->
          <div class="table-responsive mt-3 px-3 pb-3 table-rounded-wrapper">
            <b-table
              striped
              hover
              small
              head-variant="light"
              :items="filteredEvents"
              :fields="fields"
              :per-page="perPage"
              :current-page="currentPage"
              class="um-table mt-3"
              show-empty
              empty-text=""
              responsive="md"
              :busy="loading"
            >
              <template #table-busy>
                <div class="text-center my-3">
                  <b-spinner small class="mr-2" /> Loading events…
                </div>
              </template>

              <template #empty>
                <div class="stx-empty-state">
                  <Icon icon="mdi:calendar-blank-outline" width="40" height="40" />
                  <div>No event data found</div>
                  <small
                    >Try adjusting your search/filter or create a new
                    event.</small
                  >
                </div>
              </template>

              <!-- Kolom No -->
              <template #cell(no)="row">
                <span class="text-muted">
                  {{ (currentPage - 1) * perPage + row.index + 1 }}
                </span>
              </template>

              <!-- Status Pill -->
              <template #cell(status)="row">
                <span
                  v-if="row.item && row.item.status === 'inactive'"
                  class="status-pill status-upcoming"
                >
                  <span class="dot"></span> Inactive
                </span>
                <span v-else class="status-pill status-success">
                  <span class="dot"></span> Active
                </span>
              </template>

              <!-- Actions -->
              <template #cell(actions)="row">
                <b-button
                  size="sm"
                  variant="outline-danger"
                  class="btn-icon"
                  @click="confirmDeleteEvent(row.item)"
                >
                  <Icon icon="mdi:delete" width="16" height="16" />
                </b-button>
              </template>
            </b-table>

            <!-- PAGINATION (real, sejajar) -->
            <div
              class="d-flex align-items-center justify-content-between mt-3 px-2 flex-wrap"
              style="gap: 12px"
            >
              <!-- kiri: jumlah row ditampilkan -->
              <small class="text-muted">
                {{ filteredEvents.length === 0 ? 0 : (currentPage - 1) * perPage + 1 }} –
                {{ Math.min(currentPage * perPage, filteredEvents.length) }}
                of {{ filteredEvents.length }} events
              </small>

              <!-- tengah: pagination -->
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

              <!-- kanan: select rows per page -->
              <div class="d-flex align-items-center">
                <span class="mr-2 text-muted">Rows per page</span>
                <b-form-select
                  v-model.number="perPage"
                  :options="[10, 20, 50]"
                  class="input-soft no-border-select"
                  style="width: 110px; border-radius: 12px"
                />
              </div>
            </div>
          </div>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { ipcRenderer } from "electron";

export default {
  name: "AllEvents",
  components: { Icon },
  data() {
    return {
      loading: false,
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
          thStyle: { width: "110px" },
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
  },
};
</script>

