<template>
  <div class="list-page">
    <PageHero
      title="All Teams"
      crumb="All Teams"
      icon="mdi:account-group-outline"
      subtitle="Buat tim baru dan kelola seluruh tim yang terdaftar"
      :stats="[
        { label: 'Total Teams', value: teams.length },
        { label: 'Active', value: activeTeamCount, tone: 'success' },
        { label: 'Inactive', value: inactiveTeamCount, tone: 'warning' },
        { label: 'Team Types', value: teamTypeCount, tone: 'neutral' },
      ]"
      @back="goTo"
    >
      <template #actions>
        <button
          type="button"
          class="ph-btn ph-btn--ghost"
          title="Download template Excel utk Import from Excel"
          @click="downloadBulkTemplate"
        >
          <Icon icon="mdi:file-download-outline" />
          Download Template
        </button>
        <button
          type="button"
          class="ph-btn ph-btn--primary"
          :disabled="bulkParsing"
          @click="$refs.bulkFileInput.click()"
        >
          <b-spinner v-if="bulkParsing" small />
          <Icon v-else icon="mdi:file-excel-outline" />
          {{ bulkParsing ? "Membaca file..." : "Import from Excel" }}
        </button>
      </template>
    </PageHero>

    <input
      ref="bulkFileInput"
      type="file"
      accept=".xlsx,.xls"
      class="d-none"
      @change="onBulkFileSelected"
    />

    <div class="teams-layout">
      <!-- CREATE NEW TEAM -->
      <aside class="lp-card teams-form">
        <div class="lp-card__head">
          <h5 class="lp-card__title">
            <Icon icon="mdi:account-plus-outline" />
            Create New Team
          </h5>
        </div>

        <form ref="form-newTeam" class="teams-form__body" @submit.prevent="save()">
          <b-form-group label-class="label-strong">
            <template #label>
              Team Type <span class="text-danger">*</span>
            </template>
            <b-form-select
              v-model="formTeam.teamType"
              :options="optionTeamTypes"
              value-field="value"
              text-field="name"
              class="input-soft"
              required
            >
              <template #first>
                <b-form-select-option :value="null" disabled>Select type</b-form-select-option>
              </template>
            </b-form-select>
          </b-form-group>

          <b-form-group label-class="label-strong">
            <template #label>
              Team Name <span class="text-danger">*</span>
            </template>
            <b-form-input
              v-model="formTeam.teamName"
              placeholder="Enter team name"
              class="input-soft"
              required
            />
          </b-form-group>

          <b-form-group label="Country (optional)" label-class="label-strong">
            <b-form-select
              v-model="formTeam.countryCode"
              :options="countryOptions"
              value-field="code"
              text-field="name"
              class="input-soft"
            >
              <template #first>
                <b-form-select-option :value="''">No country</b-form-select-option>
              </template>
            </b-form-select>
          </b-form-group>

          <button type="submit" class="teams-save">
            <Icon icon="mdi:plus" />
            Save New Team
          </button>

          <p class="teams-form__hint">
            <Icon icon="mdi:lightbulb-on-outline" />
            Banyak tim sekaligus? Pakai <strong>Import from Excel</strong> di
            atas (format: Team Name, Team Type, Country).
          </p>
        </form>
      </aside>

      <!-- LIST ALL TEAMS -->
      <section class="lp-card teams-list">
        <div class="lp-toolbar">
          <div class="lp-search">
            <Icon icon="mdi:magnify" class="lp-search__icon" />
            <input
              v-model="teamQuery"
              type="text"
              class="lp-search__input"
              placeholder="Cari nama tim…"
            />
            <button v-if="teamQuery" type="button" class="lp-search__clear" @click="teamQuery = ''">
              <Icon icon="mdi:close" />
            </button>
          </div>

          <div class="lp-filters">
            <div class="lp-select">
              <Icon icon="mdi:shape-outline" class="lp-select__icon" />
              <select v-model="filterType" class="lp-select__input">
                <option v-for="o in filterTypeOptions" :key="o.value" :value="o.value">
                  {{ o.text }}
                </option>
              </select>
              <Icon icon="mdi:chevron-down" class="lp-select__chev" />
            </div>

            <div class="lp-segment" role="group" aria-label="Filter status">
              <button
                v-for="opt in teamStatusSegments"
                :key="opt.value"
                type="button"
                class="lp-segment__btn"
                :class="{ active: filterStatus === opt.value }"
                @click="filterStatus = opt.value"
              >
                {{ opt.text }}
                <span class="lp-segment__count">{{ opt.count }}</span>
              </button>
            </div>

            <button
              v-if="teamQuery || filterType !== 'ALL' || filterStatus !== 'ALL'"
              type="button"
              class="lp-reset"
              @click="resetTeamFilters"
            >
              <Icon icon="mdi:filter-remove-outline" />
              Reset
            </button>
          </div>
        </div>

        <div class="table-responsive lp-table-wrap">
          <b-table
            hover
            :items="filteredTeams"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
            class="lp-table mb-0"
            show-empty
            empty-text=""
            responsive="md"
          >
            <template #empty>
              <div class="lp-empty">
                <Icon icon="mdi:account-group-outline" width="40" height="40" />
                <div class="lp-empty__title">Tim tidak ditemukan</div>
                <small>Coba ubah pencarian/filter, atau tambahkan tim baru.</small>
              </div>
            </template>

            <template #cell(index)="row">
              <span class="lp-muted">{{ (currentPage - 1) * perPage + row.index + 1 }}</span>
            </template>

            <template #cell(nameTeam)="row">
              <div class="lp-team" @click="viewTeamDetails(row.item)">
                <span class="lp-team__avatar" :style="{ background: avatarColor(row.item.nameTeam) }">
                  {{ initials(row.item.nameTeam) }}
                </span>
                <span class="lp-team__name">{{ row.item.nameTeam || "-" }}</span>
                <CountryFlag :code="row.item.countryCode" />
              </div>
            </template>

            <template #cell(typeTeam)="row">
              <span v-if="row.item.typeTeam" class="lp-chip lp-chip--soft">{{ row.item.typeTeam }}</span>
              <span v-else class="lp-muted">-</span>
            </template>

            <template #cell(statusId)="row">
              <span v-if="row.item.statusId === 0" class="lp-status lp-status--on">
                <span class="lp-status__dot"></span> Active
              </span>
              <span v-else class="lp-status lp-status--off">
                <span class="lp-status__dot"></span> Inactive
              </span>
            </template>

            <template #cell(actions)="row">
              <div class="lp-actions justify-content-end">
                <button type="button" class="lp-icon-btn" title="View Details" @click="viewTeamDetails(row.item)">
                  <Icon icon="mdi:eye-outline" />
                </button>
                <button type="button" class="lp-icon-btn" title="Edit" @click="openEdit(row.item)">
                  <Icon icon="mdi:pencil-outline" />
                </button>
                <button type="button" class="lp-icon-btn lp-icon-btn--danger" title="Delete" @click="deleteTeam(row.item)">
                  <Icon icon="mdi:trash-can-outline" />
                </button>
              </div>
            </template>
          </b-table>
        </div>

        <div class="lp-footer">
          <small class="lp-muted">
            {{ totalRows === 0 ? 0 : (currentPage - 1) * perPage + 1 }} –
            {{ Math.min(currentPage * perPage, totalRows) }}
            of {{ totalRows }} teams
          </small>
          <b-pagination
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
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
      </section>
    </div>

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
          File: <strong>{{ bulkFileName || "-" }}</strong> — format kolom:
          <strong>Team Name</strong>, <strong>Team Type</strong>,
          <strong>Country</strong> (lihat
          <a href="#" @click.prevent="downloadBulkTemplate">template</a>).
        </p>

        <b-form-group label-class="label-strong">
          <template #label>
            Default Team Type
            <span v-if="bulkNeedsDefaultType" class="text-danger">*</span>
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
              <b-form-select-option :value="null">-</b-form-select-option>
            </template>
          </b-form-select>
          <small class="text-muted">
            Dipakai utk baris yang kolom Team Type-nya kosong.
          </small>
        </b-form-group>

        <div v-if="!bulkRows.length" class="text-center text-muted py-4">
          Tidak ada data tim yang ditemukan di file ini. Pastikan file memakai
          format template (kolom <strong>Team Name</strong> wajib ada).
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
                :disabled="!isBulkRowSelectable(row.item) || bulkImporting"
              />
            </template>
            <template #cell(rowNo)="row">
              <span class="text-muted">{{ row.item.rowNo }}</span>
            </template>
            <template #cell(typeTeam)="row">
              <span v-if="row.item.typeTeam">
                {{ teamTypeLabel(row.item.typeTeam) }}
              </span>
              <span v-else-if="bulkTeamType" class="text-muted">
                {{ teamTypeLabel(bulkTeamType) }} (default)
              </span>
              <span v-else class="text-danger small">Belum diisi</span>
            </template>
            <template #cell(countryCode)="row">
              <span v-if="row.item.countryCode" class="d-inline-flex align-items-center">
                <CountryFlag :code="row.item.countryCode" class="mr-1" />
                {{ row.item.countryCode }}
              </span>
              <span v-else class="text-muted">-</span>
            </template>
            <template #cell(status)="row">
              <span v-if="row.item.error" class="status-pill status-danger" :title="row.item.error">
                {{ row.item.error }}
              </span>
              <span v-else-if="row.item.duplicate" class="status-pill status-upcoming">
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
import PageHero from "@/components/common/PageHero.vue";
import { COUNTRIES } from "@/utils/countries";
import * as XLSX from "xlsx";

// Format Import from Excel (bulk Create New Team) — 1 baris = 1 tim, kolom
// sama dgn form Create New Team. Header dicocokkan setelah dinormalisasi
// (huruf kecil, tanpa spasi/tanda `*`), bukan posisi kolom, supaya tahan
// urutan kolom/kapitalisasi beda. "Asal PENGPROV" tetap diterima sbg alias
// Team Name supaya export Google Form lama masih bisa dipakai.
const BULK_HEADER_ALIASES = {
  nameTeam: ["teamname", "namatim", "team", "asalpengprov"],
  typeTeam: ["teamtype", "tipetim", "type", "jenistim"],
  countryCode: ["country", "countrycode", "negara", "kodenegara"],
};
const BULK_TEMPLATE_HEADERS = ["Team Name", "Team Type", "Country"];

function normalizeHeader(h) {
  return String(h || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export default {
  name: "SustainableTimingSystemCreateTeam",
  components: { Icon, CountryFlag, PageHero },
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
      filterStatus: "ALL", // ALL | active | inactive
      teamQuery: "",
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
      // [{ rowNo, nameTeam, typeTeam, countryCode, error, duplicate, selected }]
      bulkRows: [],
      bulkFields: [
        { key: "selected", label: "" },
        { key: "rowNo", label: "Row" },
        { key: "nameTeam", label: "Team Name" },
        { key: "typeTeam", label: "Team Type" },
        { key: "countryCode", label: "Country" },
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
      let list = Array.isArray(this.teams) ? this.teams : [];
      if (this.filterType !== "ALL") {
        const sel = String(this.filterType).toLowerCase();
        list = list.filter((t) => String(t.typeTeam || "").toLowerCase() === sel);
      }
      if (this.filterStatus !== "ALL") {
        const wantActive = this.filterStatus === "active";
        list = list.filter((t) => (Number(t.statusId) === 0) === wantActive);
      }
      const q = this.teamQuery.trim().toLowerCase();
      if (q) {
        list = list.filter((t) => String(t.nameTeam || "").toLowerCase().includes(q));
      }
      return list;
    },
    teamStatusSegments() {
      return [
        { value: "ALL", text: "Semua", count: this.teams.length },
        { value: "active", text: "Active", count: this.activeTeamCount },
        { value: "inactive", text: "Inactive", count: this.inactiveTeamCount },
      ];
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
    // Default Team Type wajib dipilih hanya kalau ada baris terpilih yang
    // kolom Team Type-nya kosong.
    bulkNeedsDefaultType() {
      return (this.bulkRows || []).some((r) => r.selected && !r.typeTeam);
    },
    canConfirmBulkImport() {
      return (
        !this.bulkImporting &&
        this.selectedBulkCount > 0 &&
        (!this.bulkNeedsDefaultType || !!this.bulkTeamType)
      );
    },
    allNewSelected() {
      const selectable = (this.bulkRows || []).filter(this.isBulkRowSelectable);
      return selectable.length > 0 && selectable.every((r) => r.selected);
    },
    someNewSelected() {
      const selectable = (this.bulkRows || []).filter(this.isBulkRowSelectable);
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
    filterStatus() {
      this.currentPage = 1;
    },
    teamQuery() {
      this.currentPage = 1;
    },
    teams() {
      // jaga-jaga supaya halaman tidak “kosong” ketika data berubah
      const maxPage = Math.max(1, Math.ceil(this.totalRows / this.perPage));
      if (this.currentPage > maxPage) this.currentPage = maxPage;
    },
  },
  methods: {
    resetTeamFilters() {
      this.teamQuery = "";
      this.filterType = "ALL";
      this.filterStatus = "ALL";
    },
    initials(name) {
      const words = String(name || "?").trim().split(/\s+/);
      return ((words[0] || "?").charAt(0) + (words[1] ? words[1].charAt(0) : "")).toUpperCase();
    },
    // Warna avatar stabil per nama tim (sama dgn Home.vue).
    avatarColor(name) {
      const palette = [
        "linear-gradient(135deg,#1c4c7a,#25b0eb)",
        "linear-gradient(135deg,#0f766e,#2dd4bf)",
        "linear-gradient(135deg,#7c3aed,#a78bfa)",
        "linear-gradient(135deg,#c2410c,#fb923c)",
        "linear-gradient(135deg,#be123c,#fb7185)",
        "linear-gradient(135deg,#1d4ed8,#60a5fa)",
      ];
      let h = 0;
      const str = String(name || "");
      for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
      return palette[h % palette.length];
    },
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

          // Petakan header asli file -> field (lihat BULK_HEADER_ALIASES)
          const headerKeys = Object.keys(rows[0] || {});
          const colOf = {};
          Object.keys(BULK_HEADER_ALIASES).forEach((field) => {
            colOf[field] = headerKeys.find((k) =>
              BULK_HEADER_ALIASES[field].includes(normalizeHeader(k))
            );
          });

          if (!colOf.nameTeam) {
            this.bulkRows = [];
            ipcRenderer.send("get-alert", {
              type: "warning",
              message: "Format tidak sesuai",
              detail:
                'Kolom "Team Name" tidak ditemukan. Gunakan tombol "Download Template" lalu isi sesuai format.',
            });
            return;
          }

          const seen = new Set();
          const parsed = [];
          rows.forEach((row, idx) => {
            const nameTeam = String(row[colOf.nameTeam] || "").trim();
            if (!nameTeam) return;
            const nameKey = nameTeam.toUpperCase();
            if (seen.has(nameKey)) return; // duplikat di dalam file -> ambil yg pertama
            seen.add(nameKey);

            const rawType = colOf.typeTeam ? row[colOf.typeTeam] : "";
            const rawCountry = colOf.countryCode ? row[colOf.countryCode] : "";
            const typeTeam = this.resolveTeamType(rawType);
            const countryCode = this.resolveCountryCode(rawCountry);

            let error = "";
            if (nameTeam.length < 2) error = "Nama terlalu pendek";
            else if (String(rawType || "").trim() && !typeTeam)
              error = `Team Type "${String(rawType).trim()}" tidak dikenal`;
            else if (String(rawCountry || "").trim() && !countryCode)
              error = `Country "${String(rawCountry).trim()}" tidak dikenal`;

            const duplicate = existingNames.has(nameKey);
            parsed.push({
              rowNo: idx + 2, // +1 header, +1 karena Excel mulai dari 1
              nameTeam,
              typeTeam: typeTeam || "",
              countryCode: countryCode || "",
              error,
              duplicate,
              selected: !duplicate && !error,
            });
          });
          this.bulkRows = parsed;

          if (!this.bulkRows.length) {
            ipcRenderer.send("get-alert", {
              type: "warning",
              message: "Tidak ada data",
              detail: 'Kolom "Team Name" kosong di file ini.',
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
        if (this.isBulkRowSelectable(r)) r.selected = checked;
      });
    },

    isBulkRowSelectable(r) {
      return !!r && !r.duplicate && !r.error;
    },

    // Cocokkan isi kolom Team Type dgn optionTeamTypes, by value ATAU name
    // (case-insensitive) — mis. "pengprov" / "Pengprov" / "PENGPROV".
    resolveTeamType(raw) {
      const v = String(raw || "").trim().toLowerCase();
      if (!v) return "";
      const found = (this.optionTeamTypes || []).find(
        (o) =>
          String(o.value || "").toLowerCase() === v ||
          String(o.name || "").toLowerCase() === v
      );
      return found ? String(found.value) : "";
    },

    teamTypeLabel(value) {
      const found = (this.optionTeamTypes || []).find(
        (o) => String(o.value) === String(value)
      );
      return found ? found.name : value;
    },

    // Kolom Country boleh kode ISO 2 huruf ("ID") atau nama ("Indonesia").
    resolveCountryCode(raw) {
      const v = String(raw || "").trim();
      if (!v) return "";
      const upper = v.toUpperCase();
      const found = COUNTRIES.find(
        (c) => c.code === upper || String(c.name).toUpperCase() === upper
      );
      return found ? found.code : "";
    },

    // Template .xlsx: sheet "Teams" (header + contoh) + sheet "Petunjuk"
    // (aturan kolom + daftar Team Type & kode Country yang valid).
    downloadBulkTemplate() {
      const types = (this.optionTeamTypes || []).length
        ? this.optionTeamTypes
        : [{ value: "pengprov", name: "Pengprov" }];
      const exampleType = (types[0] && types[0].name) || "";

      const teamsSheet = XLSX.utils.aoa_to_sheet([
        BULK_TEMPLATE_HEADERS,
        ["JAWA BARAT", exampleType, "ID"],
        ["DKI JAKARTA", exampleType, "ID"],
      ]);
      teamsSheet["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 12 }];

      const guide = [
        ["PETUNJUK IMPORT TEAM"],
        [],
        ["Kolom", "Wajib", "Keterangan"],
        ["Team Name", "Ya", "Nama tim, minimal 2 karakter. Nama yang sudah ada di sistem otomatis dilewati."],
        ["Team Type", "Tidak", "Salah satu Team Type di bawah. Kalau kosong, pakai Default Team Type yang dipilih saat import."],
        ["Country", "Tidak", "Kode negara ISO 2 huruf (mis. ID) atau nama negara (mis. Indonesia)."],
        [],
        ["Hapus baris contoh di sheet Teams sebelum mengisi data asli. Jangan ubah nama kolom di baris pertama."],
        [],
        ["Team Type yang valid"],
        ...types.map((t) => [t.name]),
        [],
        ["Kode Country", "Nama"],
        ...COUNTRIES.map((c) => [c.code, c.name]),
      ];
      const guideSheet = XLSX.utils.aoa_to_sheet(guide);
      guideSheet["!cols"] = [{ wch: 22 }, { wch: 28 }, { wch: 90 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, teamsSheet, "Teams");
      XLSX.utils.book_append_sheet(wb, guideSheet, "Petunjuk");
      XLSX.writeFile(wb, "Template_Import_Teams.xlsx");
    },

    confirmBulkImport() {
      if (!this.canConfirmBulkImport) return;

      const docs = (this.bulkRows || [])
        .filter((r) => r.selected && this.isBulkRowSelectable(r))
        .map((r) => ({
          typeTeam: String(r.typeTeam || this.bulkTeamType || "").trim(),
          nameTeam: r.nameTeam,
          bibTeam: "",
          startOrder: "",
          praStart: "",
          intervalRace: "",
          statusId: 0,
          countryCode: r.countryCode || "",
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

