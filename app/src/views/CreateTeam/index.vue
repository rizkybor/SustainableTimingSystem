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
            <b-form-group label-class="label-strong">
              <template #label>
                Team Type <span class="text-danger">*</span>
              </template>
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
            <b-form-group label-class="label-strong">
              <template #label>
                Team Name <span class="text-danger">*</span>
              </template>
              <b-form-input
                size="sm"
                v-model="formTeam.teamName"
                placeholder="Enter team name"
                class="input-soft"
                style="border-radius: 12px"
                required
              />
            </b-form-group>

            <!-- COUNTRY (optional) -->
            <b-form-group label="Country (optional)" label-class="label-strong">
              <b-form-select
                size="sm"
                v-model="formTeam.countryCode"
                :options="countryOptions"
                value-field="code"
                text-field="name"
                class="input-soft"
                style="border-radius: 12px"
              >
                <template #first>
                  <b-form-select-option :value="''"
                    >No country</b-form-select-option
                  >
                </template>
              </b-form-select>
            </b-form-group>

            <!-- Actions -->
            <div class="d-flex mt-4 justify-content-end">
              <input
                ref="bulkFileInput"
                type="file"
                accept=".xlsx,.xls"
                class="d-none"
                @change="onBulkFileSelected"
              />
              <b-button
                style="border-radius: 12px"
                variant="outline-secondary"
                class="mr-2"
                :disabled="bulkParsing"
                @click="$refs.bulkFileInput.click()"
              >
                <b-spinner small v-if="bulkParsing" class="mr-1" />
                <Icon v-else icon="mdi:file-excel-outline" width="18" height="18" />
                {{ bulkParsing ? "Membaca file..." : "Import from Excel" }}
              </b-button>
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

          <!-- STAT SUMMARY -->
          <div class="stat-strip">
            <div class="stat-card">
              <div class="stat-card__icon">
                <Icon icon="mdi:account-group-outline" />
              </div>
              <div>
                <div class="stat-card__value">{{ teams.length }}</div>
                <div class="stat-card__label">Total Teams</div>
              </div>
            </div>
            <div class="stat-card stat-card--success">
              <div class="stat-card__icon">
                <Icon icon="mdi:check-circle-outline" />
              </div>
              <div>
                <div class="stat-card__value">{{ activeTeamCount }}</div>
                <div class="stat-card__label">Active</div>
              </div>
            </div>
            <div class="stat-card stat-card--warning">
              <div class="stat-card__icon">
                <Icon icon="mdi:close-circle-outline" />
              </div>
              <div>
                <div class="stat-card__value">{{ inactiveTeamCount }}</div>
                <div class="stat-card__label">Inactive</div>
              </div>
            </div>
            <div class="stat-card stat-card--neutral">
              <div class="stat-card__icon">
                <Icon icon="mdi:shape-outline" />
              </div>
              <div>
                <div class="stat-card__value">{{ teamTypeCount }}</div>
                <div class="stat-card__label">Team Types</div>
              </div>
            </div>
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
              v-if="filterType !== 'ALL'"
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
            >
            

              <!-- ✅ Empty State -->
              <template #empty>
                <div class="stx-empty-state">
                  <Icon icon="mdi:account-group-outline" width="40" height="40" />
                  <div>No team data found</div>
                  <small>Try adjusting your filter or add a new team.</small>
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
                <CountryFlag :code="row.item.countryCode" />
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
                  title="View Details"
                  @click="viewTeamDetails(row.item)"
                >
                  <Icon icon="mdi:eye-outline" width="16" height="16" />
                </b-button>

                <b-button
                  size="sm"
                  variant="outline-secondary"
                  class="btn-icon mr-2"
                  title="Edit"
                  @click="openEdit(row.item)"
                >
                  <Icon icon="mdi:pencil" width="16" height="16" />
                </b-button>

                <b-button
                  size="sm"
                  variant="outline-danger"
                  class="btn-icon"
                  title="Delete"
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
      :no-close-on-esc="true"
      :no-close-on-backdrop="true"
      hide-header
      hide-footer
      body-class="p-0"
      content-class="stx-modal-content"
      centered
    >
      <div class="stx-modal-header">
        <h5>Edit Team: {{ editForm.nameTeam || "" }}</h5>
        <button
          type="button"
          class="stx-modal-close"
          aria-label="Close"
          @click="$bvModal.hide('modal-edit-team')"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div class="stx-modal-body">
        <b-form @submit.stop.prevent="submitEdit">
          <b-form-group label-class="label-strong">
            <template #label>
              Team Type <span class="text-danger">*</span>
            </template>
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

          <b-form-group label-class="label-strong">
            <template #label>
              Team Name <span class="text-danger">*</span>
            </template>
            <b-form-input
              v-model="editForm.nameTeam"
              class="input-soft"
              required
              placeholder="Enter team name"
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

          <b-form-group label="Country (optional)" label-class="label-strong">
            <b-form-select
              v-model="editForm.countryCode"
              :options="countryOptions"
              value-field="code"
              text-field="name"
              class="input-soft"
            >
              <template #first>
                <b-form-select-option :value="''"
                  >No country</b-form-select-option
                >
              </template>
            </b-form-select>
          </b-form-group>
        </b-form>
      </div>

      <div class="stx-modal-footer">
        <b-button
          variant="outline-secondary"
          class="btn-pill"
          @click="$bvModal.hide('modal-edit-team')"
        >
          Cancel
        </b-button>
        <b-button variant="primary" class="btn-pill" @click="submitEdit">
          Save
        </b-button>
      </div>
    </b-modal>

    <!-- Import from Excel: preview + konfirmasi -->
    <b-modal
      id="modal-bulk-import-team"
      v-model="showBulkImportModal"
      size="lg"
      scrollable
      :no-close-on-backdrop="bulkImporting"
      :no-close-on-esc="bulkImporting"
      hide-header
      hide-footer
      body-class="p-0"
      content-class="stx-modal-content"
      centered
    >
      <div class="stx-modal-header">
        <h5>Import Teams from Excel</h5>
        <button
          type="button"
          class="stx-modal-close"
          aria-label="Close"
          :disabled="bulkImporting"
          @click="showBulkImportModal = false"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div class="stx-modal-body">
        <p class="mb-2 text-muted small">
          File: <strong>{{ bulkFileName || "-" }}</strong> — kolom
          <strong>Asal PENGPROV</strong> diambil sebagai nama tim.
        </p>

        <b-form-group label-class="label-strong">
          <template #label>
            Team Type untuk semua tim di bawah <span class="text-danger">*</span>
          </template>
          <b-form-select
            size="sm"
            v-model="bulkTeamType"
            :options="optionTeamTypes"
            value-field="value"
            text-field="name"
            class="input-soft"
            style="border-radius: 12px"
            :disabled="bulkImporting"
          >
            <template #first>
              <b-form-select-option :value="null" disabled
                >Select type</b-form-select-option
              >
            </template>
          </b-form-select>
        </b-form-group>

        <div v-if="!bulkRows.length" class="text-center text-muted py-4">
          Tidak ada nilai "Asal PENGPROV" yang ditemukan di file ini.
        </div>
        <div v-else class="table-responsive table-rounded-wrapper">
          <b-table
            striped
            small
            hover
            :items="bulkRows"
            :fields="bulkFields"
            class="um-table mb-0"
          >
            <template #head(selected)>
              <b-form-checkbox
                :checked="allNewSelected"
                :indeterminate="someNewSelected && !allNewSelected"
                :disabled="bulkImporting"
                @change="toggleSelectAllBulkRows"
              />
            </template>
            <template #cell(selected)="row">
              <b-form-checkbox
                v-model="row.item.selected"
                :disabled="row.item.duplicate || bulkImporting"
              />
            </template>
            <template #cell(nameTeam)="row">
              {{ row.item.nameTeam }}
            </template>
            <template #cell(status)="row">
              <span v-if="row.item.duplicate" class="status-pill status-upcoming">
                Sudah ada
              </span>
              <span v-else class="status-pill status-success">Baru</span>
            </template>
          </b-table>
        </div>
      </div>

      <div class="stx-modal-footer">
        <b-button
          variant="outline-secondary"
          class="btn-pill"
          :disabled="bulkImporting"
          @click="showBulkImportModal = false"
        >
          Batal
        </b-button>
        <b-button
          variant="primary"
          class="btn-pill"
          :disabled="!canConfirmBulkImport"
          @click="confirmBulkImport"
        >
          <b-spinner small v-if="bulkImporting" class="mr-1" />
          {{ bulkImporting ? "Mengimpor..." : `Import ${selectedBulkCount} Team${selectedBulkCount === 1 ? "" : "s"}` }}
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import CountryFlag from "@/components/common/CountryFlag.vue";
import { COUNTRIES } from "@/utils/countries";
import * as XLSX from "xlsx";

// Nama kolom di file Excel (Google Form response) yang jadi sumber nama tim
// bulk import — dicocokkan case-insensitive/trim, bukan posisi kolom, supaya
// tahan kalau urutan kolom lain berubah.
const BULK_IMPORT_SOURCE_HEADER = "asal pengprov";

export default {
  name: "SustainableTimingSystemCreateTeam",
  components: { Icon, CountryFlag },
  data() {
    return {
      countryOptions: COUNTRIES,
      optionTeamTypes: [],
      formTeam: {
        teamType: null,
        teamName: "",
        countryCode: "",
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
        { key: "typeTeam", label: "Type" },
        { key: "statusId", label: "Status" },
        { key: "actions", label: "", class: "text-right" },
      ],
      editForm: {
        _id: null,
        typeTeam: null,
        nameTeam: "",
        statusId: 0,
        countryCode: "",
      },

      // ---- Bulk Import from Excel ----
      bulkParsing: false,
      bulkImporting: false,
      showBulkImportModal: false,
      bulkFileName: "",
      bulkTeamType: null,
      bulkRows: [], // [{ nameTeam, duplicate, selected }]
      bulkFields: [
        { key: "selected", label: "" },
        { key: "nameTeam", label: "Team Name (Asal PENGPROV)" },
        { key: "status", label: "Status" },
      ],
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

    activeTeamCount() {
      return (this.teams || []).filter((t) => Number(t.statusId) === 0)
        .length;
    },
    inactiveTeamCount() {
      return (this.teams || []).filter((t) => Number(t.statusId) !== 0)
        .length;
    },
    teamTypeCount() {
      const set = new Set(
        (this.teams || [])
          .map((t) => String(t.typeTeam || "").trim().toUpperCase())
          .filter(Boolean)
      );
      return set.size;
    },

    selectedBulkCount() {
      return (this.bulkRows || []).filter((r) => r.selected).length;
    },
    canConfirmBulkImport() {
      return (
        !this.bulkImporting &&
        !!this.bulkTeamType &&
        this.selectedBulkCount > 0
      );
    },
    allNewSelected() {
      const selectable = (this.bulkRows || []).filter((r) => !r.duplicate);
      return selectable.length > 0 && selectable.every((r) => r.selected);
    },
    someNewSelected() {
      const selectable = (this.bulkRows || []).filter((r) => !r.duplicate);
      return selectable.some((r) => r.selected);
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
        countryCode: "",
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
        countryCode: String(this.formTeam.countryCode || "").trim(),
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
          this.loadTeams();
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

    viewTeamDetails(item) {
      this.$router.push("/team?name=" + encodeURIComponent(item.nameTeam || ""));
    },

    openEdit(item) {
      this.editForm = {
        _id: this._toStringId(item._id),
        typeTeam: item.typeTeam || null,
        nameTeam: item.nameTeam || "",
        statusId: Number(item.statusId) || 0, // ≤ pastikan number
        countryCode: item.countryCode || "",
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
        statusId: Number(this.editForm.statusId) || 0,
        countryCode: String(this.editForm.countryCode || "").trim(),
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

    // ---- Bulk Import from Excel ----
    onBulkFileSelected(e) {
      const file = e && e.target && e.target.files && e.target.files[0];
      // reset value supaya pilih file yang SAMA lagi tetap memicu @change
      if (e && e.target) e.target.value = "";
      if (!file) return;

      this.bulkParsing = true;
      this.bulkFileName = file.name;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

          const existingNames = new Set(
            (this.teams || []).map((t) =>
              String(t.nameTeam || "").trim().toUpperCase()
            )
          );

          const seen = new Set();
          const names = [];
          rows.forEach((row) => {
            // cari key kolom "Asal PENGPROV" case-insensitive/trim (header
            // asli bisa beda kapitalisasi/spasi antar-export Google Form)
            const key = Object.keys(row || {}).find(
              (k) => k.trim().toLowerCase() === BULK_IMPORT_SOURCE_HEADER
            );
            if (!key) return;
            const val = String(row[key] || "").trim().toUpperCase();
            if (!val || seen.has(val)) return;
            seen.add(val);
            names.push(val);
          });

          this.bulkRows = names.map((nameTeam) => {
            const duplicate = existingNames.has(nameTeam);
            return { nameTeam, duplicate, selected: !duplicate };
          });

          if (!this.bulkRows.length) {
            ipcRenderer.send("get-alert", {
              type: "warning",
              message: "Tidak ada data",
              detail:
                'Kolom "Asal PENGPROV" tidak ditemukan atau kosong di file ini.',
            });
          }

          this.bulkTeamType = null;
          this.showBulkImportModal = true;
        } catch (err) {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Gagal membaca file",
            detail: err && err.message ? err.message : String(err),
          });
        } finally {
          this.bulkParsing = false;
        }
      };
      reader.onerror = () => {
        this.bulkParsing = false;
        ipcRenderer.send("get-alert", {
          type: "error",
          message: "Gagal membaca file",
          detail: "File tidak bisa dibaca.",
        });
      };
      reader.readAsArrayBuffer(file);
    },

    toggleSelectAllBulkRows(checked) {
      (this.bulkRows || []).forEach((r) => {
        if (!r.duplicate) r.selected = checked;
      });
    },

    confirmBulkImport() {
      if (!this.canConfirmBulkImport) return;

      const docs = (this.bulkRows || [])
        .filter((r) => r.selected && !r.duplicate)
        .map((r) => ({
          typeTeam: String(this.bulkTeamType || "").trim(),
          nameTeam: r.nameTeam,
          bibTeam: "",
          startOrder: "",
          praStart: "",
          intervalRace: "",
          statusId: 0,
          countryCode: "",
        }));

      if (!docs.length) return;

      this.bulkImporting = true;
      ipcRenderer.send("teams:bulk-insert", docs);
      ipcRenderer.once("teams:bulk-insert-reply", (_e, res) => {
        this.bulkImporting = false;
        if (res && res.ok) {
          const skipped = res.skippedCount || 0;
          ipcRenderer.send("get-alert-saved", {
            type: "info",
            message: "Import selesai",
            detail: `${res.insertedCount || 0} tim berhasil dibuat${
              skipped ? `, ${skipped} dilewati (sudah ada)` : ""
            }.`,
          });
          this.showBulkImportModal = false;
          this.bulkRows = [];
          this.loadTeams();
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            message: "Import gagal",
            detail: (res && res.error) || "Gagal mengimpor data tim.",
          });
        }
      });
    },

    async deleteTeam(team) {
      let ok = true;
      if (this.$bvModal && this.$bvModal.msgBoxConfirm) {
        ok = await this.$bvModal
          .msgBoxConfirm(
            `Hapus tim "${team.nameTeam || "-"}" dari daftar tim?`,
            {
              title: "Confirm Delete",
              okTitle: "Delete",
              okVariant: "danger",
              cancelTitle: "Cancel",
              centered: true,
              noCloseOnEsc: true,
              noCloseOnBackdrop: true,
            }
          )
          .catch(() => false);
      } else {
        ok = window.confirm(`Hapus tim "${team.nameTeam || "-"}" dari daftar tim?`);
      }
      if (!ok) return;

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

