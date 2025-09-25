<template>
  <div style="height: 70vh" class="mt-5">
    <b-row>
      <b-col cols="10" offset="1" class="mb-4">
        <!-- HEADER -->
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h2 class="page-title mb-1">List Event</h2>
            <p class="page-subtitle mb-0">
              Kelola daftar event, level, tanggal, status, dan aksi
            </p>
          </div>
          <div class="d-flex align-items-center">
            <b-button
              variant="primary"
              class="btn-primary-pill"
              @click="onCreate"
            >
              <Icon icon="mdi:plus" width="18" height="18" />
              <span class="ml-1">Create New Event</span>
            </b-button>
          </div>
        </div>

        <!-- TOOLBAR -->
        <div
          class="d-flex align-items-center px-3 pt-3 flex-wrap"
          style="gap: 12px"
        >
          <b-form-input
            v-model="query"
            class="input-soft"
            placeholder="Input some text..."
            style="max-width: 320px"
          />
          <b-form-select
            v-model="levelFilter"
            :options="levelOptionsUI"
            class="input-soft"
            style="max-width: 220px"
          />
          <b-form-select
            v-model="statusFilter"
            :options="statusOptionsUI"
            class="input-soft"
            style="max-width: 220px"
          />
        </div>

        <!-- TABLE WRAPPER -->
        <div class="table-responsive mt-3 px-3 pb-3 table-rounded-wrapper">
          <b-table
            striped
            hover
            small
            head-variant="light"
            :items="rows"
            :fields="fields"
            class="um-table mt-3"
            :per-page="perPage"
            :current-page="currentPage"
            responsive="md"
          >
            <!-- No -->
            <template #cell(no)="row">
              <span class="text-muted">{{
                (currentPage - 1) * perPage + row.index + 1
              }}</span>
            </template>

            <!-- Status Pill -->
            <template #cell(status)="row">
              <span
                v-if="row.item.status === 'upcoming'"
                class="status-pill status-upcoming"
              >
                <span class="dot"></span> Upcoming
              </span>
              <span v-else class="status-pill status-success">
                <span class="dot"></span> Success
              </span>
            </template>

            <!-- Actions -->
            <template #cell(actions)="row">
              <b-button
                size="sm"
                variant="outline-secondary"
                class="btn-icon mr-2"
                @click="onEdit(row.item)"
              >
                <Icon icon="mdi:pencil" width="16" height="16" />
              </b-button>
              <b-button
                size="sm"
                variant="outline-danger"
                class="btn-icon"
                @click="onDelete(row.item)"
              >
                <Icon icon="mdi:delete" width="16" height="16" />
              </b-button>
            </template>
          </b-table>

          <b-pagination
            v-model="currentPage"
            :total-rows="filtered.length"
            :per-page="perPage"
            align="center"
            size="md"
            class="mt-3 custom-pagination"
          />

          <div
            class="d-flex align-items-center justify-content-between mt-2 px-2"
          >
            <small class="text-muted">{{ perPage }} Row</small>
            <div class="d-flex align-items-center">
              <span class="mr-2 text-muted">Rows per page</span>
              <b-form-select
                v-model.number="perPage"
                :options="[10, 20, 50]"
                class="input-soft"
                style="width: 100px"
              />
            </div>
          </div>
        </div>

        <b-button @click="goBack" variant="outline-info" class="btn-action">
          <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
        </b-button>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";

export default {
  name: "AllEvents",
  components: { Icon },
  data() {
    return {
      // table
      perPage: 10,
      currentPage: 1,
      query: "",
      statusFilter: "",
      levelFilter: "",
      fields: [
        {
          key: "no",
          label: "#",
          thStyle: { width: "56px" },
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
        { value: "Level A", text: "Level A" },
        { value: "Level B", text: "Level B" },
        { value: "Level C", text: "Level C" },
        { value: "Level D", text: "Level D" },
      ],
      statusOptionsUI: [
        { value: "", text: "Filter by status" },
        { value: "upcoming", text: "Upcoming" },
        { value: "success", text: "Success" },
      ],
      // mock data
      events: Array.from({ length: 23 }).map((_, i) => ({
        id: i + 1,
        name: "Kejurnas Arung Jeram 2025",
        level: "Level D",
        date: "25 - 30 Sept 2025",
        status: i === 0 ? "upcoming" : "success",
      })),
    };
  },
  computed: {
    filtered() {
      let r = this.events.slice();
      if (this.query) {
        const q = this.query.toLowerCase();
        r = r.filter((it) =>
          [it.name, it.level, it.date].some((t) =>
            String(t).toLowerCase().includes(q)
          )
        );
      }
      if (this.levelFilter) r = r.filter((it) => it.level === this.levelFilter);
      if (this.statusFilter)
        r = r.filter((it) => it.status === this.statusFilter);
      return r;
    },
    rows() {
      // b-table will paginate; just feed filtered
      return this.filtered;
    },
  },
  methods: {
    onCreate() {
      this.$emit("create");
    },
    onEdit(row) {
      this.$emit("edit", row);
    },
    onDelete(row) {
      if (confirm(`Delete event: ${row.name}?`)) this.$emit("delete", row);
    },
    goBack() {
      if (this.$router) this.$router.back();
    },
  },
};
</script>

<style>
/* ===== Page header ===== */
.page-title {
  font-weight: 800;
  color: #0f172a;
}
.page-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

/* ===== Buttons ===== */
.btn-primary-pill {
  border-radius: 10px;
  padding: 0.55rem 1.25rem;
  font-weight: 700;
}
.btn-icon {
  border-radius: 8px;
  padding: 4px 8px;
}
.btn-action {
  margin-top: 18px;
  border-radius: 10px;
}

/* ===== Inputs ===== */
.input-soft {
  height: 44px !important;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 0.5rem 0.875rem;
}
.input-soft:focus {
  background: #fff;
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

/* ===== Table Wrapper ===== */
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
  padding: 0.75rem;
  vertical-align: middle;
  border-color: #f1f5f9;
}
.um-table tbody tr:hover td {
  background: #f9fafb;
  transition: background 0.2s ease-in-out;
}
.um-table td:first-child,
.um-table th:first-child {
  text-align: center;
  font-weight: 600;
  color: #6b7280;
}

/* ===== Status pill ===== */
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

/* ===== Pagination ===== */
.custom-pagination .page-item {
  margin: 0 4px;
}
.custom-pagination .page-link {
  border-radius: 999px !important;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 0.5rem 1rem;
  transition: all 0.2s;
}
.custom-pagination .page-link:hover {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #93c5fd;
}
.custom-pagination .page-item.active .page-link {
  background: #3b82f6 !important;
  color: #fff !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
}
.custom-pagination .page-item.disabled .page-link {
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #e5e7eb;
  cursor: not-allowed;
}
</style>
