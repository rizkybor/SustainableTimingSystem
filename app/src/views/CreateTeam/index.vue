<template>
  <div style="height: 86vh;">
    <b-row>
      <b-col cols="10" offset="1" class="mb-5">
        <div class="mx-5 mt-5">
          <p class="h6 text-muted mb-0">
            <Icon icon="ic:round-arrow-back" class="mr-1" />
            Back
          </p>
        </div>

        <b-card
          title="Create New Team"
          sub-title="Create your main team and add sub-teams to represent different categories"
          class="team-card m-3 px-4 py-4"
        >
          <form ref="form-newTeam">
            <!-- Section Title -->
            <p class="h6 font-weight-bold text-dark mb-3">Main Team Information</p>

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
                  <b-form-select-option :value="null" disabled>Select type</b-form-select-option>
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
            <div class="d-flex mt-4 justify-content-between">
              <b-button variant="outline-primary" class="btn-outline-pill" @click="goTo()">
                <Icon icon="ic:round-arrow-back" class="mr-2" />
                Back
              </b-button>

              <b-button variant="primary" class="btn-primary-pill" @click="save()" type="button">
                Submit
              </b-button>
            </div>
          </form>
        </b-card>
      </b-col>
    </b-row>
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
        // fallback jika belum ada dari IPC
        { value: "club", name: "Club" },
        { value: "school", name: "School" },
        { value: "regional", name: "Regional" },
        { value: "others", name: "Others" },
      ],
      formTeam: {
        teamType: null,
        teamName: "",
        statusTeam: "Active",
      },
    };
  },
  async mounted() {
    // load opsi dari main process (opsional)
    try {
      ipcRenderer.send("option-team-types");
      ipcRenderer.once("option-team-types-reply", (_e, data) => {
        if (Array.isArray(data) && data.length) this.optionTeamTypes = data;
      });
      // restore draft jika ada
      const draft = localStorage.getItem("formNewTeam");
      if (draft) this.formTeam = JSON.parse(draft);
    } catch (e) {}
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
      ipcRenderer.send("insert-new-team", { ...this.formTeam });
      ipcRenderer.once("insert-new-team-reply", (_e, _data) => {
        ipcRenderer.send("get-alert-saved", {
          type: "question",
          message: "Successfully",
          detail: "Team has been created.",
        });
      });
      setTimeout(() => {
        localStorage.removeItem("formNewTeam");
        this.$router.push("/");
      }, 1200);
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
</style>