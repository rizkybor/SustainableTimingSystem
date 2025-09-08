<template>
  <div style="height: 84vh" class="mt-4">
    <b-row>
      <b-col cols="10" offset="1" class="mb-4">
        <b-card
          title="Create New Team"
          sub-title="Create your main team and add sub-teams to represent different categories"
          class="team-card m-3 px-4 py-4"
        >
          <form ref="form-newTeam">
            <!-- Section Title -->
            <p class="h6 font-weight-bold text-dark mb-3">
              Main Team Information
            </p>

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
                required
              />
            </b-form-group>

            <!-- Actions -->
            <div class="d-flex mt-4 justify-content-end">
              <b-button
                variant="primary"
                class="btn-primary-pill"
                @click="save()"
                type="button"
              >
                Submit
              </b-button>
            </div>
          </form>
        </b-card>

        <!-- ✅ LIST TEAM -->
        <b-card title="Teams List" class="team-card m-3 px-4 py-4 mt-4">
          <div class="d-flex align-items-center mb-3">
            <label class="mb-0 mr-2 font-weight-bold">Filter:</label>
            <b-form-select
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
            >
              Reset
            </b-button>
          </div>
          <b-table
            striped
            hover
            small
            bordered
            head-variant="light"
            :items="filteredTeams"
            :fields="fields"
            responsive="md"
            class="teams-table"
          >
            <!-- Index Number -->
            <template #cell(index)="row">
              {{ row.index + 1 }}
            </template>

            <!-- Type -->
            <template #cell(typeTeam)="row">
              <span class="font-weight-bold text-dark">{{
                row.item.typeTeam
              }}</span>
            </template>

            <!-- Status -->
            <template #cell(statusId)="row">
              <b-badge
                :variant="row.item.statusId === 0 ? 'success' : 'secondary'"
              >
                {{ row.item.statusId === 0 ? "Active" : "Inactive" }}
              </b-badge>
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
        </b-card>
      </b-col>
    </b-row>
    <div class="ml-5">
      <b-button
        variant="outline-secondary"
        class="btn-outline-pill"
        @click="goTo()"
      >
        <Icon icon="ic:round-arrow-back" class="mr-2" />
        Back
      </b-button>
    </div>

    <!-- ✏️ Edit Team Modal -->
    <b-modal
      id="modal-edit-team"
      :title="`Edit Team: ${editForm.nameTeam || ''}`"
      ok-title="Save"
      cancel-title="Cancel"
      @ok="submitEdit"
      :no-close-on-esc="true"
      :no-close-on-backdrop="true"
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
      fields: [
        {
          key: "index",
          label: "#",
          thStyle: { width: "50px" },
          class: "text-center align-middle",
        },
        {
          key: "typeTeam",
          label: "Type Team",
          class: "text-center align-middle",
        },
        { key: "nameTeam", label: "Team Name", class: "align-middle" },
        {
          key: "bibTeam",
          label: "BIB",
          thStyle: { width: "80px" },
          class: "text-center align-middle",
        },
        {
          key: "statusId",
          label: "Status",
          thStyle: { width: "100px" },
          class: "text-center align-middle",
        },
        {
          key: "actions",
          label: "Actions",
          thStyle: { width: "90px" },
          class: "text-center align-middle",
        },
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
    } catch {}

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
<style scoped>
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

.teams-table {
  font-size: 0.9rem;
}

.teams-table th {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.3px;
}

.btn-icon {
  border-radius: 8px;
  padding: 4px 8px;
}
</style>
