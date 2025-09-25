<template>
  <div style="height: 70vh" class="mt-4">
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
                variant="outline-info"
                class="btn-action w-100 rounded-pill"
                @click="goTo('create-new')"
              >
                <Icon icon="mdi:plus" width="18" height="18" />
                Create New Event
              </b-button>
            </div>
          </div>

          <!-- TOOLBAR (Search + Filters) -->
          <div
            class="d-flex justify-content-between align-items-center pt-3 flex-wrap"
            style="gap: 12px"
          >
            <div>
              <!-- Search -->
              <b-input-group class="input-soft" style="max-width: 320px">
                <template #prepend>
                  <span class="input-icon-left">
                    <Icon icon="mdi:magnify" />
                  </span>
                </template>
                <b-form-input
                  v-model="query"
                  placeholder="Input some text..."
                  class="no-border-input"
                />
              </b-input-group>
            </div>

            <div class="d-flex align-items-center" style="gap: 12px">
              <!-- Filter Level -->
              <b-input-group class="input-soft" style="max-width: 220px">
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
              <b-input-group class="input-soft" style="max-width: 220px">
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
                <!-- <b-button
                  size="sm"
                  variant="outline-secondary"
                  class="btn-icon mr-2"
                  @click="$emit('edit', row.item)"
                >
                  <Icon icon="mdi:pencil" width="16" height="16" />
                </b-button> -->
                <b-button
                  size="sm"
                  variant="outline-danger"
                  class="btn-icon"
                  @click="$emit('delete', row.item)"
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
              <!-- kiri: jumlah row -->
              <small class="text-muted">{{ perPage }} Row</small>

              <!-- tengah: pagination -->
              <b-pagination
                v-model="currentPage"
                :total-rows="filteredEvents.length"
                :per-page="perPage"
                align="center"
                size="md"
                class="custom-pagination mb-0"
              />

              <!-- kanan: select rows per page -->
              <div class="d-flex align-items-center">
                <span class="mr-2 text-muted">Rows per page</span>
                <b-form-select
                  v-model.number="perPage"
                  :options="[10, 20, 50]"
                  class="input-soft no-border-select"
                  style="width: 110px"
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
        console.log(ev, "<<");
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
  },
};
</script>

<style>
/* Top text */
.page-title {
  font-weight: 800;
  color: #0f172a;
}
.page-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

/* Inputs with icons */
.input-soft {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 0;
  overflow: hidden;
}
.input-soft .form-control,
.input-soft .custom-select {
  border: 0;
  background: transparent;
  height: 44px;
}
.input-soft:focus-within {
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  border-color: #93c5fd;
}
.input-icon-left,
.input-icon-right {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  color: #94a3b8;
}
.no-border-input:focus,
.no-border-select:focus {
  box-shadow: none;
}

/* Create button */
.btn-primary-pill {
  border-radius: 10px;
  padding: 0.55rem 1.25rem;
  font-weight: 700;
}
.btn-icon {
  border-radius: 8px;
  padding: 4px 8px;
}

/* Table wrapper */
.table-rounded-wrapper {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
  background: #fff;
}
.um-table thead th {
  background: #f1f5f9 !important;
  color: #1e293b;
  font-weight: 700;
  font-size: 0.9rem;
  border-bottom: 2px solid #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.um-table tbody td {
  background: #fff;
  color: #374151;
  font-size: 0.9rem;
  padding: 0.9rem 0.75rem;
  vertical-align: middle;
  border-color: #f1f5f9;
}
.um-table tbody tr:hover td {
  background: #f9fafb;
  transition: background 0.2s;
}

/* Status pill */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 12px;
  border: 1px solid transparent;
}
.status-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-upcoming {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}
.status-upcoming .dot {
  background: #f59e0b;
}
.status-success {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}
.status-success .dot {
  background: #10b981;
}

/* Dummy pager (visual mimic) */
.dummy-pager {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dummy-pager .page {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 10px;
  padding: 0.35rem 0.7rem;
  color: #374151;
  font-weight: 600;
}
.dummy-pager .page.current {
  background: #e8f1ff;
  color: #2563eb;
  border-color: #93c5fd;
}
.dummy-pager .nav-ctrl {
  color: #9ca3af;
}

.btn-action {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
}

.btn-action:hover {
  background-color: #1f6fa3 !important;
  border: none;
}

.card-wrapper {
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
}

.btn-custom {
  cursor: pointer;
}

.btn-custom:hover {
  color: #1f6fa3;
}

.breadcrumb {
  background-color: transparent !important;
  padding: 0;
  margin-bottom: 0;
}
.breadcrumb-item + .breadcrumb-item::before {
  color: #9ca3af;
}
</style>
