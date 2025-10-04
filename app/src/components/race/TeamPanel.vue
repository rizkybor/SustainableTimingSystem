<template>
  <section class="panel-box">
    <div class="panel-head py-2">
      <b-row class="align-items-center justify-content-between">
        <!-- Left: Title -->
        <b-col cols="12" md="6" class="mb-2 mb-md-0">
          <div class="font-weight-bold">
            {{ title }} – {{ initialName || "—" }}
          </div>
        </b-col>

        <!-- Right: Actions -->
        <b-col cols="12" md="6" class="d-flex justify-content-md-end gap-2">
          <!-- 👇 BARU: tampil hanya jika ada result -->
          <b-button
            class="btn-add"
            @click="$emit('show-result')"
            title="Show saved results for this category"
          >
            <Icon icon="mdi:podium" class="mr-1" /> Show Result
          </b-button>

          <!-- <b-button
            size="sm"
            variant="primary"
            class="btn-add"
            @click="startRace()"
          >
            <Icon icon="mdi:flag-variant" class="mr-2" />
            Start Race
          </b-button> -->
          <b-button
            size="sm"
            variant="primary"
            class="btn-add"
            @click="$emit('add-draft')"
          >
            <Icon icon="mdi:plus" class="mr-1" /> Add Team
          </b-button>
        </b-col>
      </b-row>
    </div>

    <div class="panel-body">
      <table class="team-table">
        <thead>
          <tr>
            <th style="width: 64px">No</th>
            <th>Team Name</th>
            <th style="width: 180px">BIB Number</th>
            <th style="width: 120px" class="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <!-- baris input -->
          <tr v-if="draft" class="row-card">
            <td class="muted">1</td>
            <td>
              <b-form-group label="Pilih Tim" class="mb-2">
                <SearchableSelect
                  v-model="draft.teamId"
                  :options="selectOptions"
                  placeholder="Select team name"
                  search-placeholder="Select team name"
                  :clearable="true"
                  :show-empty-option="true"
                  @input="onPickTeam"
                  class="ss-inline"
                />
              </b-form-group>
            </td>
            <td>
              <input
                class="input"
                placeholder="Enter BIB number"
                :value="draft.bib || ''"
                @input="onBibChange"
              />
            </td>
            <td class="text-right">
              <button
                type="button"
                class="btn-ghost ok"
                @click="$emit('draft-save')"
                title="Save"
              >
                <Icon icon="mdi:check-bold" width="18" height="18" />
              </button>
              <button
                type="button"
                class="btn-ghost danger ml-2"
                @click="$emit('draft-cancel')"
                title="Cancel"
              >
                <Icon icon="mdi:trash-can-outline" width="18" height="18" />
              </button>
            </td>
          </tr>

          <!-- rows tersimpan -->
          <tr v-for="(r, idx) in rows" :key="r.bibTeam || idx" class="row-card">
            <td class="muted">{{ idx + 1 }}</td>
            <td>{{ r.nameTeam }}</td>
            <td>{{ r.bibTeam }}</td>
            <td class="text-right">
              <button
                type="button"
                class="btn-ghost danger"
                @click="onDelete(r)"
                title="Delete"
              >
                <Icon icon="mdi:trash-can-outline" width="18" height="18" />
              </button>
            </td>
          </tr>

          <tr v-if="!draft && !rows.length">
            <td colspan="4" class="text-center text-muted py-3">
              Belum ada tim pada kombinasi ini.
            </td>
          </tr>
        </tbody>
      </table>

      <!-- <div class="panel-footer">
        <b-button variant="light" class="btn-add" @click="$emit('add-draft')">
          <Icon icon="mdi:plus" class="mr-1" /> Add Team
        </b-button>
      </div> -->
    </div>
  </section>
</template>

<script>
import { Icon } from "@iconify/vue2";
import SearchableSelect from "@/components/SearchableSelect.vue";

export default {
  name: "TeamPanel",
  components: { Icon, SearchableSelect },
  props: {
    title: String,
    division: String,
    race: String,
    eventName: String,
    initialName: String,
    rows: { type: Array, default: () => [] },
    teamsAvailable: { type: Array, default: () => [] },
    draft: { type: Object, default: null },
  },
  computed: {
    selectOptions() {
      const base = Array.isArray(this.teamsAvailable)
        ? this.teamsAvailable
        : [];
      return base.map(function (t) {
        return {
          value: t.id !== undefined && t.id !== null ? t.id : null, // hindari '??'
          text: t.nameTeam + (t.bibTeam ? " — " + t.bibTeam : ""),
          meta: t.bibTeam ? `BIB: ${t.bibTeam}` : "",
          disabled: !!(t.disabled || t.bibConflict),
        };
      });
    },
  },
  methods: {
    onPickTeam(val) {
      this.$emit("draft-change", {
        ...(this.draft || {}),
        teamId: val,
      });
    },
    onBibChange(e) {
      this.$emit("draft-change", {
        ...(this.draft || {}),
        bib: e.target.value,
      });
    },
    async onDelete(row) {
      // pakai modal BV kalau ada; fallback ke confirm biasa
      let ok = true;
      if (this.$bvModal && this.$bvModal.msgBoxConfirm) {
        ok = await this.$bvModal
          .msgBoxConfirm(
            `Hapus tim "${row.nameTeam}" (BIB: ${
              row.bibTeam || "-"
            }) dari tabel ini?`,
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
        ok = window.confirm(
          `Hapus tim "${row.nameTeam}" (BIB: ${
            row.bibTeam || "-"
          }) dari tabel ini?`
        );
      }
      if (ok) this.$emit("delete-row", row); // ⬅️ emit objek row lengkap
    },
    startRace() {
      // kirim identity + rows milik panel ini
      this.$emit("start-race", {
        division: this.division,
        race: this.race,
        eventName: this.eventName,
        initialName: this.initialName,
        rows: Array.isArray(this.rows) ? this.rows : [],
      });
    },
  },
};
</script>

<style scoped>
:root {
  --line: #e6ebf4;
  --line-2: #edf2f7;
  --ink: #1f2940;
  --muted: #73809a;
  --header: #f6f7f9;
  --panel: #ffffff;
  --shadow: 0 12px 26px rgba(31, 56, 104, 0.08);
  --shadow-row: 0 6px 18px rgba(31, 56, 104, 0.06);
  --primary: #1f6fa3;
}

/* ===== Panel ===== */
.panel-box {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.panel-head {
  /* display:flex; align-items:center; justify-content:space-between; */
  padding: 14px 16px;
  border-bottom: 1px solid var(--line-2);
  background: #f9fbff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
/* opsional: spasi antar tombol bila Bootstrap < v5 */
.gap-2 > * + * {
  margin-left: 0.5rem;
}

/* konsisten padding panel */
.panel-body {
  padding: 10px 16px 6px 16px;
}
.panel-footer {
  padding: 8px 16px 14px 16px;
  border-top: 1px solid #f0f3f9;
}

/* ===== Table ===== */
.team-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
}
.team-table thead th {
  background: var(--header);
  color: #2b3445;
  font-weight: 700;
  font-size: 13px;
  padding: 12px;
  text-align: left;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}
.team-table thead .col-no {
  width: 64px;
}
.team-table thead .col-bib {
  width: 220px;
}
.team-table thead .col-action {
  width: 140px;
}

/* baris "kartu" */
.team-table tbody .row-card {
  background: #fff;
  border: 1px solid #e7ecf6;
  border-radius: 10px;
  box-shadow: var(--shadow-row);
}
.team-table tbody td {
  padding: 10px 12px;
  vertical-align: middle;
}
.team-table tbody td.muted {
  color: var(--muted);
}

/* ===== Input & Select (look lembut) ===== */
.input {
  width: 100%;
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #f7f9fc;
  padding: 6px 34px 6px 10px;
  outline: none;
  font-size: 14px;
}
.input:focus {
  background: #fff;
  border-color: #9ec5ff;
  box-shadow: 0 0 0 4px rgba(42, 104, 196, 0.15);
}

/* ===== Tombol aksi (kanan) ===== */
.text-right {
  text-align: right;
}
.btn-ghost {
  border: 1px solid #d5deec;
  background: #eef3fb;
  color: #325a8f;
  border-radius: 10px;
  height: 34px;
  width: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-ghost.ok {
  background: #e6f7ff;
  border-color: #c6e9ff;
  color: #0d789d;
}
.btn-ghost.danger {
  background: #fef2f2;
  border-color: #f1d1d1;
  color: #a11d1d;
}
.ml-2 {
  margin-left: 8px;
}

/* ===== Add Team ===== */
.btn-add {
  background: #ffffff;
  border: 1px solid #cfd8e6;
  color: #1c4c7a;
  font-weight: 700;
  border-radius: 10px;
  padding: 8px 14px;
  transition: all 0.25s ease;
}

/* Hover effect */
.btn-add:hover {
  background: #f0f8ff; /* biru muda lembut */
  border-color: #1c4c7a;
  color: #0d2f4f;
  box-shadow: 0 0 12px rgba(0, 180, 255, 0.5);
  cursor: pointer;
}

/* ==== SearchableSelect tweaks agar mirip mockup ==== */

/* lebar penuh di dalam sel tabel */
:deep(td) .ss-inline {
  width: 100%;
}

/* tombol tertutup = single border putih, rounded 12px */
:deep(.ss-inline .ss-toggle) {
  min-height: 46px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #d6dfea; /* lebih soft */
  padding: 10px 14px;
}
:deep(.ss-inline .ss-toggle:hover) {
  background: #ffffff;
  border-color: #c9d6e8;
}
:deep(.ss-inline .ss-toggle--open) {
  background: #ffffff;
  border-color: #9ec5ff;
  box-shadow: 0 0 0 3px rgba(42, 104, 196, 0.12);
}

/* posisi dropdown persis di bawah tombol */
:deep(.ss-inline .dropdown-menu) {
  margin-top: 6px !important;
}

/* panel dropdown = kartu putih dengan padding */
:deep(.ss-inline .ss-panel) {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e6ebf4;
  box-shadow: 0 16px 32px rgba(31, 56, 104, 0.12);
  background: #ffffff;
}

/* search bar di dalam panel (ikon di kiri, input rata) */
:deep(.ss-inline .ss-search) {
  background: #ffffff;
  border: 1px solid #e5ebf4;
  border-radius: 10px;
  padding: 8px 10px 8px 36px; /* ruang ikon kiri */
}
:deep(.ss-inline .ss-search__icon) {
  color: #7b8aa6;
  left: 12px;
}
:deep(.ss-inline .ss-search__input) {
  font-size: 14px;
  line-height: 1.2;
}

/* tombol Clear kecil di sisi kanan search */
:deep(.ss-inline .ss-search__clear) {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* list item = kartu tipis, rounded, tanpa border tebal */
:deep(.ss-inline .ss-list) {
  margin-top: 10px;
  max-height: 300px;
  overflow-y: auto;
}
:deep(.ss-inline .ss-item) {
  background: #ffffff;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  box-shadow: inset 0 0 0 1px #eef2f7; /* garis tipis */
}
:deep(.ss-inline .ss-item:hover) {
  box-shadow: inset 0 0 0 1px #dde7f4;
  background: #f9fbff;
}
:deep(.ss-inline .ss-item__text) {
  color: #1f2940;
  font-size: 14px;
}
:deep(.ss-inline .ss-item__meta) {
  color: #7a879a;
}

/* footer Kosongkan */
:deep(.ss-inline .ss-footer) {
  margin-top: 6px;
  padding: 8px;
  text-align: center;
  color: #1c4c7a;
  border-radius: 8px;
  cursor: pointer;
}
:deep(.ss-inline .ss-footer:hover) {
  background: #f5f9ff;
}

/* HAPUS efek lama dari wrapper .field & ikon suffix (tidak dipakai lagi) */
.field .suffix {
  display: none !important;
}

/* ===== Responsif kecil ===== */
@media (max-width: 576px) {
  .team-table thead .col-bib {
    width: auto;
  }
  .team-table thead .col-action {
    width: 110px;
  }
}
</style>
