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
          <!-- <b-button
            size="sm"
            variant="outline-secondary rounded-pill"
            class="d-flex align-items-center"
            @click="printResult"
          >
            <Icon icon="mdi:printer-outline" class="mr-2" />
            Print Result
          </b-button> -->

          <b-button
            size="sm"
            variant="primary rounded-pill"
            class="d-flex align-items-center"
            @click="startRace(rows)"
          >
            <Icon icon="mdi:flag-variant" class="mr-2" />
            Start Race
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
              <div class="field">
                <select
                  class="input"
                  :value="draft.teamId || ''"
                  @change="onTeamChange"
                >
                  <option value="" disabled>Select team name</option>
                  <option
                    v-for="t in teamsAvailableAll"
                    :key="t.id"
                    :value="t.id"
                  >
                    {{ t.nameTeam }}
                  </option>
                </select>
                <Icon
                  icon="mdi:chevron-down"
                  width="18"
                  height="18"
                  class="suffix"
                />
              </div>
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

      <div class="panel-footer">
        <b-button variant="light" class="btn-add" @click="$emit('add-draft')">
          <Icon icon="mdi:plus" class="mr-1" /> Add Team
        </b-button>
      </div>
    </div>
  </section>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { ipcRenderer } from "electron";

export default {
  name: "TeamPanel",
  components: { Icon },
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
    teamsAvailableAll() {
      return Array.isArray(this.teamsAvailable) ? this.teamsAvailable : [];
    },
  },
  methods: {
    onTeamChange(e) {
      this.$emit("draft-change", {
        ...(this.draft || {}),
        teamId: e.target.value,
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
    startRace(params) {
      console.log(params, "<<< checked teams");
      // INSERT ICP to TABLE TEAMS
      // this.$router.push(`/event-detail/${this.$route.params.id}/sprint-race`);

      // Periksa apakah draft dan teamId tersedia
      //   if (this.draft && this.draft.teamId) {
      //     const selectedTeam = this.teamsAvailable.find(
      //       (team) => team.id === this.draft.teamId
      //     );

      //     if (selectedTeam) {
      //       console.log("Tim yang dipilih:", selectedTeam.nameTeam);
      //       // Kirim pesan atau logika lain jika diperlukan
      //       // ipcRenderer.send("get-alert-saved", { ... });
      //     } else {
      //       console.error("Tim tidak ditemukan!");
      //     }
      //   } else {
      //     console.error("Team ID belum dipilih!");
      //   }
    },
    goTo(val, payload, teamTitle) {
      // Validasi form
      let formValid = this.validateForm();
      if (formValid) {
        // Menentukan jenis kategori berdasarkan event
        val =
          val === "SPRINT"
            ? "sprint-race"
            : val == "SLALOM"
            ? "slalom-race"
            : val == "DRR"
            ? "drr-race"
            : val == "HEAD2HEAD"
            ? "head2head-race"
            : val;

        // Menyimpan data ke localStorage
        const obj = JSON.stringify(payload);
        localStorage.setItem("participantByCategories", obj);
        localStorage.setItem("currentCategories", teamTitle);

        // Navigasi ke halaman berdasarkan kategori
        this.$router.push(`/event-detail/${this.$route.params.id}/${val}`);
      } else {
        // Jika form tidak valid, kirim notifikasi
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail:
            "Fill in the pre-Start and interval first, before starting the race",
          message: "Ups Sorry",
        });
      }
    },
    //   ipcRenderer && ipcRenderer.send && ipcRenderer.send("get-alert-saved", {
    //     type:"info", message:"Start Race", detail:`${this.title} – ${this.eventName || ""} (${this.initialName || ""})`
    //   });
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
.btn-start {
  appearance: none;
  border: 1px solid #d0d9e8;
  background: #f4f7fb;
  color: #56627a;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
  line-height: 1;
}
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
.field {
  position: relative;
}
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
.suffix {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #7b8aa6;
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
