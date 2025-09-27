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
                {{ $route.params.pageTitle || "All Teams" }}
              </b-breadcrumb-item>
            </b-breadcrumb>
            <div>{{ currentDateTime }}</div>
          </div>
        </div>

        <div
          class="card-wrapper mt-1"
          style="
            padding-left: 45px;
            padding-right: 45px;
            padding-bottom: 45px;
            padding-top: 25px;
          "
        >
          <div @click="goTo" class="btn-custom d-flex align-items-center mb-3">
            <Icon icon="mdi:chevron-left" class="mr-1" />
            <span>Back</span>
          </div>
          <div>
            <h2 class="page-title mb-1">Create New Team</h2>
            <p class="page-subtitle mb-3">Create new team data</p>
          </div>
          <form ref="form-newTeam">
            <!-- TEAM TYPE -->
            <b-form-group label="Team Type" label-class="label-strong">
              <b-form-select
                size="sm"
                v-model="formTeam.teamType"
                :options="optionTeamTypes"
                value-field="value"
                text-field="name"
                class="input-soft"
                required
                style="border-radius: 12px"
              >
                <template #first>
                  <b-form-select-option :value="null" disabled
                    >Select type</b-form-select-option
                  >
                </template>
              </b-form-select>
            </b-form-group>

            <!-- TEAM NAME -->
            <b-form-group label="Team Name" label-class="label-strong">
              <b-form-input
                size="sm"
                v-model="formTeam.teamName"
                placeholder="Enter team name"
                class="input-soft"
                style="border-radius: 12px"
                required
              />
            </b-form-group>

            <!-- Actions -->
            <div class="d-flex mt-4 justify-content-end">
              <b-button
                style="border-radius: 12px"
                variant="outline-info"
                @click="save()"
              >
                <Icon icon="mdi:plus" width="18" height="18" />
                Save New Team
              </b-button>
            </div>
          </form>

          <!-- Divider -->
          <div class="section-divider my-5">
            <span>Teams Overview</span>
          </div>

          <div>
            <h2 class="page-title mb-1">List All Teams</h2>
            <p class="page-subtitle mb-3">
              View, edit, and delete all teams that have been created.
            </p>
          </div>
          <!-- ✅ LIST TEAM -->
          <div class="d-flex align-items-center mb-3">
            <label class="mb-0 mr-2 font-weight-bold">Filter:</label>
            <b-form-select
              style="border-radius: 12px"
              v-model="filterType"
              :options="filterTypeOptions"
              class="input-soft w-auto"
              size="sm"
            />
            <b-button
              size="sm"
              class="ml-2 btn-outline-pill"
              variant="outline-secondary"
              @click="filterType = 'ALL'"
              style="border-radius: 12px"
            >
              Reset
            </b-button>
          </div>
          <!-- TABLE WRAPPER -->
          <div class="table-responsive mt-3 px-3 pb-3 table-rounded-wrapper">
            <b-table
              striped
              hover
              small
              head-variant="light"
              :items="filteredTeams"
              :fields="fields"
              :per-page="perPage"
              :current-page="currentPage"
              class="um-table mt-3"
              show-empty
              empty-text=""
              responsive="md"
              :busy="loadingTeams"
            >
              <!-- Busy -->
              <template #table-busy>
                <div class="text-center my-3">
                  <b-spinner small class="mr-2" /> Loading teams…
                </div>
              </template>

              <!-- No / Index -->
              <template #cell(index)="row">
                <span class="text-muted">
                  {{ (currentPage - 1) * perPage + row.index + 1 }}
                </span>
              </template>

              <!-- Team Name -->
              <template #cell(nameTeam)="row">
                <span class="font-weight-bold text-dark">
                  {{ row.item.nameTeam || "-" }}
                </span>
              </template>

              <!-- BIB -->
              <template #cell(bibTeam)="row">
                <span
                  v-if="row.item.bibTeam"
                  class="status-pill status-neutral"
                  title="BIB"
                >
                  <span class="dot"></span> {{ row.item.bibTeam }}
                </span>
                <span v-else class="text-muted">—</span>
              </template>

              <!-- Type -->
              <template #cell(typeTeam)="row">
                <span class="font-weight-bold text-dark">{{
                  row.item.typeTeam
                }}</span>
              </template>

              <!-- Status Pill (Active/Inactive) -->
              <template #cell(statusId)="row">
                <span
                  v-if="row.item.statusId === 0"
                  class="status-pill status-success"
                >
                  <span class="dot"></span> Active
                </span>
                <span v-else class="status-pill status-upcoming">
                  <span class="dot"></span> Inactive
                </span>
              </template>

              <!-- Actions -->
              <template #cell(actions)="row">
                <b-button
                  size="sm"
                  variant="outline-secondary"
                  class="btn-icon mr-2"
                  @click="openEdit(row.item)"
                >
                  <Icon icon="mdi:pencil" width="16" height="16" />
                </b-button>

                <b-button
                  size="sm"
                  variant="outline-danger"
                  class="btn-icon"
                  @click="deleteTeam(row.item)"
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
                {{ totalRows === 0 ? 0 : (currentPage - 1) * perPage + 1 }} –
                {{ Math.min(currentPage * perPage, totalRows) }}
                of {{ totalRows }} teams
              </small>

              <!-- tengah: pagination -->
              <b-pagination
                v-model="currentPage"
                :total-rows="totalRows"
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
                  style="width: 110px; border-radius: 12px"
                  v-model.number="perPage"
                  :options="[10, 20, 50]"
                  class="input-soft no-border-select"
                />
              </div>
            </div>
          </div>
        </div>
      </b-col>
    </b-row>

    <!-- ✏️ Edit Team Modal -->
    <b-modal
      id="modal-edit-team"
      :title="`Edit Team: ${editForm.nameTeam || ''}`"
      ok-title="Save"
      cancel-title="Cancel"
      @ok="submitEdit"
      :no-close-on-esc="true"
      :no-close-on-backdrop="true"
      modal-class="um-modal"
      content-class="um-modal-content"
      header-class="um-modal-header"
      body-class="um-modal-body"
      footer-class="um-modal-footer"
      centered
    >
      <b-form @submit.stop.prevent>
        <b-form-group label="Team Type" label-class="label-strong">
          <b-form-select
            v-model="editForm.typeTeam"
            :options="optionTeamTypes"
            value-field="value"
            text-field="name"
            class="input-soft"
            required
          >
            <template #first>
              <b-form-select-option :value="null" disabled
                >Select type</b-form-select-option
              >
            </template>
          </b-form-select>
        </b-form-group>

        <b-form-group label="Team Name" label-class="label-strong">
          <b-form-input
            v-model="editForm.nameTeam"
            class="input-soft"
            required
            placeholder="Enter team name"
          />
        </b-form-group>

        <b-form-group label="BIB" label-class="label-strong">
          <b-form-input
            v-model="editForm.bibTeam"
            class="input-soft"
            placeholder="Optional BIB"
          />
        </b-form-group>

        <b-form-group label="Status" label-class="label-strong">
          <b-form-select
            v-model="editForm.statusId"
            :options="[
              { value: 0, text: 'Active' },
              { value: 1, text: 'Inactive' },
            ]"
            class="input-soft"
          />
        </b-form-group>
      </b-form>
    </b-modal>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";

export default {
  name: "SustainableTimingSystemCreateTeam",
  components: { Icon },
  data() {
    return {
      optionTeamTypes: [
        { value: "club", name: "Club" },
        { value: "pengcab", name: "Pengcab" },
        { value: "pengprov", name: "Pengprov" },
        { value: "country", name: "Country" },
      ],
      formTeam: {
        teamType: null,
        teamName: "",
        statusTeam: "Active",
      },
      teams: [], // ✅ list teams
      filterType: "ALL",
      currentPage: 1,
      perPage: 10,
      fields: [
        {
          key: "index",
          label: "No",
          class: "text-muted",
          thClass: "text-uppercase",
        },
        { key: "nameTeam", label: "Team Name" },
        { key: "bibTeam", label: "BIB" },
        { key: "typeTeam", label: "Type" },
        { key: "statusId", label: "Status" },
        { key: "actions", label: "", class: "text-right" },
      ],
      editForm: {
        _id: null,
        typeTeam: null,
        nameTeam: "",
        bibTeam: "",
        statusId: 0,
      },
    };
  },
  computed: {
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

    totalRows() {
      return (this.filteredTeams || []).length;
    },
    // Opsi dropdown filter (All + dari optionTeamTypes)
    filterTypeOptions() {
      const base = [{ value: "ALL", text: "All Types" }];
      const mapped = (this.optionTeamTypes || []).map((o) => ({
        value: String(o.value),
        text: o.name,
      }));
      return base.concat(mapped);
    },
    // Hasil filter untuk tabel
    filteredTeams() {
      const list = Array.isArray(this.teams) ? this.teams : [];
      if (this.filterType === "ALL") return list;
      const sel = String(this.filterType).toLowerCase();
      return list.filter((t) => String(t.typeTeam || "").toLowerCase() === sel);
    },
  },
  async mounted() {
    try {
      ipcRenderer.send("option-team-types");
      ipcRenderer.once("option-team-types-reply", (_e, data) => {
        if (Array.isArray(data) && data.length) this.optionTeamTypes = data;
      });
    } catch (e) {
      // fallback: pastikan tetap berupa array agar UI tidak error
      if (!Array.isArray(this.optionTeamTypes)) this.optionTeamTypes = [];
    }

    const firstVisitKey = "visited_CreateTeam";
    const isFirstVisit = !sessionStorage.getItem(firstVisitKey);
    if (isFirstVisit) {
      sessionStorage.setItem(firstVisitKey, "1");
      this.resetForm();
      localStorage.removeItem("formNewTeam");
    } else {
      const draft = localStorage.getItem("formNewTeam");
      if (draft) this.formTeam = JSON.parse(draft);
    }

    // ✅ load list teams awal
    this.loadTeams();
  },
  watch: {
    formTeam: {
      deep: true,
      handler(v) {
        localStorage.setItem("formNewTeam", JSON.stringify(v));
      },
    },

    filterType() {
      this.currentPage = 1;
    },
    teams() {
      // jaga-jaga supaya halaman tidak “kosong” ketika data berubah
      const maxPage = Math.max(1, Math.ceil(this.totalRows / this.perPage));
      if (this.currentPage > maxPage) this.currentPage = maxPage;
    },
  },
  methods: {
    resetForm() {
      this.formTeam = {
        teamType: null,
        teamName: "",
        statusTeam: "Active",
      };
    },
    goTo() {
      localStorage.removeItem("formNewTeam");
      this.$router.push("/");
    },
    validateForm() {
      const f = this.formTeam;
      return !!(f.teamType && f.teamName && f.teamName.trim().length >= 2);
    },
    save() {
      if (!this.validateForm()) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Form incomplete",
          detail: "Team Type dan Team Name wajib diisi.",
        });
        return;
      }

      const doc = {
        typeTeam: String(this.formTeam.teamType || "").trim(),
        nameTeam: String(this.formTeam.teamName || "").trim(),
        bibTeam: "",
        startOrder: "",
        praStart: "",
        intervalRace: "",
        statusId: 0,
      };

      ipcRenderer.send("insert-new-team", doc);
      ipcRenderer.once("insert-new-team-reply", (_e, res) => {
        if (res && res.ok) {
          ipcRenderer.send("get-alert-saved", {
            type: "info",
            message: "Successfully",
            detail: "Team has been created.",
          });
          this.resetForm();
          localStorage.removeItem("formNewTeam");
          this.loadTeams(); // ✅ refresh list
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Failed",
            detail: (res && res.error) || "Gagal menyimpan team.",
          });
        }
      });
    },
    loadTeams() {
      ipcRenderer.send("teams:get-all");
      ipcRenderer.once("teams:get-all-reply", (_e, res) => {
        if (res && res.ok) this.teams = res.items || [];
        else this.teams = [];
      });
    },
    _toStringId(v) {
      if (!v) return "";
      if (typeof v === "string") return v;
      if (v.$oid) return v.$oid;
      if (v._id) return String(v._id);
      return String(v);
    },

    openEdit(item) {
      this.editForm = {
        _id: this._toStringId(item._id),
        typeTeam: item.typeTeam || null,
        nameTeam: item.nameTeam || "",
        bibTeam: item.bibTeam || "",
        statusId: Number(item.statusId) || 0, // ≤ pastikan number
      };
      this.$root.$emit("bv::show::modal", "modal-edit-team");
    },

    submitEdit(evt) {
      evt.preventDefault();
      if (
        !this.editForm.typeTeam ||
        !this.editForm.nameTeam ||
        this.editForm.nameTeam.trim().length < 2
      ) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          message: "Form incomplete",
          detail: "Team Type dan Team Name wajib diisi.",
        });
        return false; // jangan close modal
      }

      const payload = {
        _id: this._toStringId(this.editForm._id),
        typeTeam: String(this.editForm.typeTeam || "").trim(),
        nameTeam: String(this.editForm.nameTeam || "").trim(),
        bibTeam: String(this.editForm.bibTeam || "").trim(),
        statusId: Number(this.editForm.statusId) || 0,
      };

      ipcRenderer.send("teams:update", payload);
      ipcRenderer.once("teams:update-reply", (_e, res) => {
        if (res && res.ok) {
          this.$root.$emit("bv::hide::modal", "modal-edit-team");
          ipcRenderer.send("get-alert-saved", {
            type: "info",
            message: "Saved",
            detail: "Team has been updated.",
          });
          this.loadTeams();
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Failed",
            detail: (res && res.error) || "Gagal mengubah team.",
          });
        }
      });
    },

    deleteTeam(team) {
      ipcRenderer.send("teams:delete", { _id: this._toStringId(team._id) });
      ipcRenderer.once("teams:delete-reply", (_e, res) => {
        if (res && res.ok) this.loadTeams();
        else
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Failed",
            detail: (res && res.error) || "Gagal menghapus team.",
          });
      });
    },
  },
};
</script>

<!-- jadi -->
<style>
.team-card {
  border-radius: 24px;
  border: 1px solid #eef2f7;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.label-strong {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.95rem;
  margin-bottom: 0.35rem;
}

.input-soft,
.form-control,
.custom-select {
  height: 44px !important;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 0.5rem 0.875rem;
}
.input-soft::placeholder {
  color: #9aa5b1;
}
.input-soft:focus,
.custom-select:focus {
  background: #ffffff;
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.btn-primary-pill {
  border-radius: 10px;
  padding: 0.55rem 1.25rem;
  font-weight: 700;
}

.btn-outline-pill {
  border-radius: 10px;
  padding: 0.55rem 1.25rem;
  font-weight: 700;
}

.card-title {
  font-weight: 800;
  color: #0f172a;
}
.card-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

.btn-icon {
  border-radius: 8px;
  padding: 4px 8px;
}

/* Sudah kamu sediakan */
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

/* Tambahan agar identik dengan contoh kedua */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  font-weight: 600;
  font-size: 0.8rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  color: #0f172a;
}
.status-success {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}
.status-upcoming {
  background: #fff7ed;
  color: #9a3412;
  border-color: #fed7aa;
}
.status-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  display: inline-block;
}

.status-neutral {
  background: #eff6ff;
  color: rgb(0, 180, 255);
  border-color: #bfdbfe;
}

/* Ikon tombol kecil rapi */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.45rem;
  border-radius: 10px;
}

/* Pagination & select tampak halus */
.custom-pagination .page-item .page-link {
  border-radius: 10px;
}
.input-soft {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px 10px;
}
.no-border-select.form-control {
  box-shadow: none !important;
}

/* Modal wrapper */
.modal-content {
  border-radius: 20px !important;
  border: none;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
}

/* Modal header */
.modal-header {
  border-bottom: none;
  border-radius: 20px 20px 0 0 !important;
  background: #f8fafc;
  padding: 1rem 1.25rem;
}
.modal-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #0f172a;
}

/* Modal body */
.modal-body {
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 0 0 20px 20px;
}

/* Form group spacing */
.modal-body .form-group {
  margin-bottom: 1.25rem;
}

/* Input dan select dalam modal */
.modal-body .input-soft {
  border-radius: 12px !important;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}
.modal-body .input-soft:focus {
  background: #ffffff;
  border-color: #93c5fd;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

/* Footer (Save/Cancel buttons) */
.modal-footer {
  border-top: none;
  padding: 1rem 1.25rem;
  justify-content: flex-end;
}
.modal-footer .btn {
  border-radius: 10px;
  font-weight: 600;
  padding: 0.5rem 1.2rem;
}
.modal-footer .btn-primary {
  background: #2563eb;
  border-color: #2563eb;
}
.modal-footer .btn-primary:hover {
  background: #1d4ed8;
  border-color: rgb(0, 180, 255);
}
.modal-footer .btn-secondary {
  background: #f1f5f9;
  color: #374151;
  border: none;
}
.modal-footer .btn-secondary:hover {
  background: #e5e7eb;
}

.section-divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #6b7280; /* abu teks */
  font-weight: 600;
  font-size: 0.9rem;
}

.section-divider::before,
.section-divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}

.section-divider:not(:empty)::before {
  margin-right: 1rem;
}
.section-divider:not(:empty)::after {
  margin-left: 1rem;
}

/* Optional: buat teks divider lebih lembut */
.section-divider span {
  background: #fff;
  padding: 0 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  color: #9ca3af;
}
</style>
