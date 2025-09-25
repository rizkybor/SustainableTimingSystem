<template>
  <div style="height: 70vh" class="mt-5">
    <b-row>
      <b-col cols="10" offset="1" class="mb-4">
        <!-- HEADER -->
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h2 class="page-title mb-1">User Management</h2>
            <p class="page-subtitle mb-0">
              Kelola akun, main events, dan role judges
            </p>
          </div>
          <div class="d-flex align-items-center">
            <b-button
              variant="outline-secondary"
              class="btn-outline-pill mr-2"
              @click="fetchEvents"
            >
              Refresh Events
            </b-button>
            <b-button
              variant="primary"
              class="btn-primary-pill"
              @click="fetchUsers"
            >
              Refresh Users
            </b-button>
          </div>
        </div>

        <!-- LIST USERS -->

        <div
          class="d-flex align-items-center justify-content-between px-3 pt-3"
        >
          <div class="d-flex align-items-center">
            <span class="label-strong mr-2 mb-0">Total Users:</span>
            <b-badge variant="primary" pill>{{ users.length }}</b-badge>
          </div>
        </div>

        <div class="table-responsive mt-3 px-3 pb-3 table-rounded-wrapper">
          <b-table
            striped
            hover
            small
            head-variant="light"
            :items="users"
            :fields="fields"
            responsive="md"
            class="um-table mt-3"
            :per-page="perPage"
            :current-page="currentPage"
          >
            <template #cell(index)="row">
              <span class="text-muted">
                {{ (currentPage - 1) * perPage + row.index + 1 }}
              </span>
            </template>

            <!-- Username w/ avatar -->
            <template #cell(username)="row">
              <div class="d-flex align-items-center">
                <img
                  :src="row.item.image || fallbackAvatar"
                  alt="avatar"
                  class="avatar mr-2"
                />
                <div class="text-left">
                  <div class="font-weight-bold text-dark">
                    {{ row.item.username || "-" }}
                  </div>
                  <small class="text-muted">{{ row.item.email }}</small>
                </div>
              </div>
            </template>

            <!-- Email column -->
            <template #cell(email)="row">
              <div class="text-dark font-weight-medium">
                {{ row.item.email || "-" }}
              </div>
            </template>

            <!-- Main Events (chips) -->
            <template #cell(mainEvents)="row">
              <div class="event-list">
                <div
                  v-for="eid in row.item.mainEvents || []"
                  :key="eid"
                  class="event-item"
                  :title="eventName(eid)"
                >
                  • {{ shortEventName(eid) }}
                </div>
                <div
                  v-if="!row.item.mainEvents || !row.item.mainEvents.length"
                  class="text-muted"
                >
                  -
                </div>
              </div>
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
                @click="deleteUser(row.item.email)"
              >
                <Icon icon="mdi:delete" width="16" height="16" />
              </b-button>
            </template>
          </b-table>

          <b-pagination
            v-model="currentPage"
            :total-rows="users.length"
            :per-page="perPage"
            align="center"
            size="md"
            class="mt-3 custom-pagination"
          />
        </div>

        <b-button @click="goTo()" variant="outline-info" class="btn-action">
          <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
        </b-button>
      </b-col>
    </b-row>

    <!-- MODAL EDIT -->
    <b-modal
      v-model="showEdit"
      size="xl"
      hide-header
      hide-footer
      :no-close-on-esc="true"
      :no-close-on-backdrop="true"
      body-class="p-0"
      content-class="custom-modal"
    >
      <!-- Header -->
      <div class="modal-header-custom">
        <h5 class="mb-0">Judges Profil Configuration</h5>
        <button
          type="button"
          class="btn-close-x"
          aria-label="Close"
          @click="showEdit = false"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body-custom">
        <!-- User Detail -->
        <div class="text-center py-4">
          <img
            :src="editForm.image || fallbackAvatar"
            alt="Avatar"
            class="avatar-xl mb-3"
          />
          <h4 class="fw-bold mb-1">{{ editForm.username }}</h4>
          <div class="text-muted">{{ editForm.email }}</div>
        </div>

        <!-- Main Events -->
        <div class="section-box">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0">Main Events</h5>

            <!-- Picker + Add -->
            <div class="d-flex align-items-center" style="gap: 8px">
              <b-form-select
                v-model="selectedEventId"
                :options="eventOptions"
                class="input-soft"
                :disabled="!eventOptions.length"
                style="min-width: 250px"
              />
              <b-button
                size="md"
                style="min-width: 150px"
                class="btn-add"
                @click="addMainEvent"
              >
                + Add Event
              </b-button>
            </div>
          </div>

          <!-- Tabel render dari computed rows -->
          <b-table
            :items="mainEventRows"
            :fields="mainEventFields"
            responsive
            bordered
            class="event-table"
            show-empty
            empty-text="Belum ada Main Event"
          >
            <!-- kolom No -->
            <template #cell(no)="row">
              <span class="text-muted">{{ row.index + 1 }}</span>
            </template>

            <template #cell(action)="{ item }">
              <b-button
                size="sm"
                variant="outline-danger"
                class="btn-icon"
                @click="removeEventById(item.id)"
                title="Remove"
              >
                <Icon icon="mdi:trash-can-outline" width="18" height="18" />
              </b-button>
            </template>
          </b-table>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer-custom">
        <b-button
          variant="outline-danger"
          class="btn-pill"
          @click="showEdit = false"
        >
          Cancel
        </b-button>
        <b-button variant="primary" class="btn-pill" @click="/* saveUser() */">
          Update
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";

export default {
  name: "AdminUserManagement",
  components: { Icon },
  data() {
    return {
      perPage: 10,
      currentPage: 1,
      users: [],
      fields: [
        {
          key: "index",
          label: "#",
          thStyle: { width: "60px" },
          class: "text-center align-middle",
        }, // ⬅️ NEW

        { key: "username", label: "User", class: "align-middle" },
        { key: "email", label: "Email", class: "align-middle" }, // 🔑 Tambah email
        { key: "mainEvents", label: "Main Events", class: "align-middle" },
        {
          key: "actions",
          label: "Actions",
          class: "text-center align-middle",
          thStyle: { width: "110px" },
        },
      ],
      showEdit: false,
      editForm: {
        _id: "",
        username: "",
        image: "",
        mainEvents: [],
        judges: [],
        email: "",
      },
      selectedEventId: "",
      eventDict: {},
      eventOptions: [],
      fallbackAvatar:
        "https://ui-avatars.com/api/?name=User&background=E5E7EB&color=374151&bold=true",
    };
  },
  computed: {
    // field untuk table main events di modal
    mainEventFields() {
      return [
        {
          key: "no",
          label: "No",
          thStyle: { width: "56px" },
          class: "text-center align-middle",
        },
        { key: "eventName", label: "Event Name" },
        { key: "levelName", label: "Event Level", class: "text-nowrap" },
        { key: "startDateEvent", label: "Event Date", class: "text-nowrap" },
        {
          key: "action",
          label: "Action",
          class: "text-center",
          thStyle: { width: "90px" },
        },
      ];
    },

    // baris tabel yang dibentuk dari array of IDs di editForm.mainEvents
    mainEventRows() {
      const ids = Array.isArray(this.editForm.mainEvents)
        ? this.editForm.mainEvents
        : [];
      return ids.map((id) => {
        const key = this._toStringId(id);
        const meta = this.eventDict[key] || {};
        console.log(meta, "<<");
        return {
          id: key,
          eventName: meta.name || this.eventName(key) || key || "-",
          levelName: meta.level || "-",
          startDateEvent: this._formatDateRange(meta.start, meta.end) || "-",
        };
      });
    },
    eventMap() {
      const map = {};
      const opts = Array.isArray(this.eventOptions) ? this.eventOptions : [];
      for (let i = 0; i < opts.length; i++) {
        const o = opts[i];
        map[String(o.value)] = o.text;
      }
      return map;
    },
  },
  mounted() {
    this.fetchEvents();
  },
  methods: {
    // ====== MAIN EVENTS (Modal) ======
    addMainEvent() {
      const id = this._toStringId(this.selectedEventId);
      if (!id) {
        this._toast("Pilih event terlebih dahulu", "warning");
        return;
      }
      if (!Array.isArray(this.editForm.mainEvents))
        this.editForm.mainEvents = [];
      if (this.editForm.mainEvents.some((e) => this._toStringId(e) === id)) {
        this._toast("Event sudah ada di daftar", "info");
        return;
      }
      this.editForm.mainEvents.push(id);
      this.selectedEventId = "";
    },

    removeEventById(id) {
      const key = this._toStringId(id);
      if (!Array.isArray(this.editForm.mainEvents)) return;
      this.editForm.mainEvents = this.editForm.mainEvents.filter(
        (e) => this._toStringId(e) !== key
      );
    },

    _formatDateRange(start, end) {
      // toleran dengan berbagai nama properti tanggal (string/timestamp)
      const fmt = (v) => {
        if (!v) return "";
        try {
          const d = new Date(v);
          if (isNaN(d.getTime())) return String(v);
          // contoh output: 25 Sep 2025
          return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } catch {
          return String(v);
        }
      };
      const s = fmt(start),
        e = fmt(end);
      if (s && e) return `${s} - ${e}`;
      return s || e || "";
    },
    addEvent() {
      this.editForm.mainEvents.push({
        name: "New Event",
        level: "Level X",
        date: "TBD",
      });
    },
    removeEvent(idx) {
      this.editForm.mainEvents.splice(idx, 1);
    },
    // saveUser() {
    //   // TODO: implement update logic here
    // }
    _toast(msg, variant = "info") {
      if (this.$bvToast) {
        this.$bvToast.toast(msg, { variant, solid: true });
      } else {
        // fallback kalau plugin toast belum ada (dev/build lama)
        alert(msg);
      }
    },
    /** Robust converter to 24-hex string (or "") */
    _toStringId(v) {
      if (!v) return "";
      if (typeof v === "string") return v.trim();
      // Mongo shell/driver bentuk { $oid: "..." }
      if (v.$oid && typeof v.$oid === "string") return v.$oid.trim();
      // Jika nested lagi
      if (v._id) return this._toStringId(v._id);

      // BSON ObjectId (browser/renderer bisa tampil sebagai object)
      if (typeof v === "object") {
        if (typeof v.toHexString === "function") {
          return v.toHexString();
        }
        // beberapa impl hanya punya toString() yang mengandung 24-hex
        if (typeof v.toString === "function") {
          const s = v.toString(); // coba ambil 24-hex dari stringnya
          const m = s.match(/[0-9a-fA-F]{24}/);
          if (m) return m[0];
        }
        // fallback _bsontype
        if (v._bsontype === "ObjectID" && v.id && v.id.buffer) {
          // terakhir banget (jarang kepakai)
          try {
            // bangun hex manual
            const bytes = new Uint8Array(v.id.buffer, v.id.byteOffset || 0, 12);
            let hex = "";
            for (let i = 0; i < bytes.length; i++) {
              hex += bytes[i].toString(16).padStart(2, "0");
            }
            return hex;
          } catch (err) {
            alert.err;
          }
        }
      }
      return "";
    },
    fetchUsers() {
      ipcRenderer.removeAllListeners("users:getAll:reply");
      ipcRenderer.send("users:getAll");
      ipcRenderer.once("users:getAll:reply", (_e, res) => {
        if (res && res.ok) {
          this.users = (res.users || []).map((u) => {
            return {
              ...u,
              _id: this._toStringId(u._id), // 🔑 pastikan string
              mainEvents: Array.isArray(u.mainEvents)
                ? u.mainEvents.map(this._toStringId).filter(Boolean)
                : [],
              judges: Array.isArray(u.judges)
                ? u.judges.map((j) => ({
                    eventId: this._toStringId(j.eventId),
                    judgesSprint: String(j.judgesSprint || ""),
                    judgesHeadtoHead: String(j.judgesHeadtoHead || ""),
                    judgesSlalom: String(j.judgesSlalom || ""),
                    judgesDRR: String(j.judgesDRR || ""),
                  }))
                : [],
            };
          });
          this.currentPage = 1;
        } else {
          this._toast((res && res.error) || "Failed to load users", "danger");
        }
      });
    },

    // ====== EVENTS LOADER (edit agar simpan meta lengkap) ======
    fetchEvents() {
      if (typeof this.loading !== "undefined") this.loading = true;
      ipcRenderer.removeAllListeners("get-events-reply");
      ipcRenderer.send("get-events");
      ipcRenderer.once("get-events-reply", (_e, payload) => {
        const eventsArray = Array.isArray(payload)
          ? payload
          : payload && Array.isArray(payload.events)
          ? payload.events
          : [];

        const opts = [];
        const dict = {};

        for (let i = 0; i < eventsArray.length; i++) {
          const ev = eventsArray[i] || {};
          const id = this._toStringId(ev._id);
          const name = ev.eventName || ev.name || "(untitled)";

          // fleksibel ke berbagai skema field:
          const level = ev.eventLevel || ev.levelName || ev.category || "";
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

          if (id) {
            opts.push({ value: id, text: name });
            dict[id] = { name, level, start, end };
          }
        }

        this.eventOptions = opts;
        this.eventDict = dict;

        this.fetchUsers();
        if (typeof this.loading !== "undefined") this.loading = false;
      });
    },

    eventName(id) {
      const key = this._toStringId(id);
      return this.eventMap && this.eventMap[key]
        ? this.eventMap[key]
        : key || "-";
    },
    shortEventName(id) {
      const name = this.eventName(id);
      return name && name.length > 22 ? name.slice(0, 20) + "…" : name;
    },

    openEdit(user) {
      // user dari table sudah dinormalisasi → tinggal clone
      this.editForm = JSON.parse(JSON.stringify(user || {}));
      this.showEdit = true;
    },

    saveUser() {
      const payload = JSON.parse(JSON.stringify(this.editForm));
      // jaga-jaga: normalisasi lagi sebelum kirim
      payload._id = this._toStringId(payload._id);
      payload.mainEvents = Array.isArray(payload.mainEvents)
        ? payload.mainEvents.map(this._toStringId).filter(Boolean)
        : [];
      payload.judges = Array.isArray(payload.judges)
        ? payload.judges.map((j) => ({
            eventId: this._toStringId(j.eventId),
            judgesSprint: String(j.judgesSprint || ""),
            judgesHeadtoHead: String(j.judgesHeadtoHead || ""),
            judgesSlalom: String(j.judgesSlalom || ""),
            judgesDRR: String(j.judgesDRR || ""),
          }))
        : [];

      ipcRenderer.removeAllListeners("users:update:reply");
      ipcRenderer.send("users:update", { userId: payload._id, payload });
      ipcRenderer.once("users:update:reply", (_e, res) => {
        if (res && res.ok) {
          this._toast("User updated", "success");
          this.showEdit = false;
          this.fetchUsers();
        } else {
          this._toast((res && res.error) || "Failed to update", "danger");
        }
      });
    },

    deleteUser(email) {
      if (!email || typeof email !== "string") {
        this._toast("Invalid email", "danger");
        return;
      }
      if (!confirm(`Delete users with email: ${email} ?`)) return;

      ipcRenderer.removeAllListeners("users:delete:reply");
      ipcRenderer.send("users:delete", { email }); // kirim sebagai object supaya extensible
      ipcRenderer.once("users:delete:reply", (_e, res) => {
        if (res && res.ok) {
          const n = (res.result && res.result.deletedCount) || 0;
          this._toast(`Deleted ${n} user(s) with email ${email}`, "info");
          this.fetchUsers();
        } else {
          this._toast((res && res.error) || "Failed to delete", "danger");
        }
      });
    },

    addJudge() {
      if (!Array.isArray(this.editForm.judges)) this.editForm.judges = [];
      this.editForm.judges.push({
        eventId: "",
        judgesSprint: "",
        judgesHeadtoHead: "",
        judgesSlalom: "",
        judgesDRR: "",
      });
    },
    removeJudge(idx) {
      if (!Array.isArray(this.editForm.judges)) return;
      this.editForm.judges.splice(idx, 1);
    },
    goTo() {
      this.$router.push(`/`);
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

/* ===== Cards ===== */
.um-card {
  border-radius: 24px;
  border: 1px solid #eef2f7;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

/* ===== Labels & inputs (match Create Team) ===== */
.label-strong {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.95rem;
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

/* ===== Buttons (match Create Team) ===== */
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
.btn-icon {
  border-radius: 8px;
  padding: 4px 8px;
}

/* ===== Table Wrapper ===== */
.table-rounded-wrapper {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
  background: #ffffff;
}

/* Header soft modern */
.um-table thead th {
  background: #f1f5f9 !important; /* abu soft */
  color: #1e293b;
  font-weight: 700;
  font-size: 0.9rem;
  border-bottom: 2px solid #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Body cells */
.um-table tbody td {
  background: #ffffff;
  color: #374151;
  font-size: 0.9rem;
  padding: 0.75rem;
  vertical-align: middle;
  border-color: #f1f5f9;
}

/* Hover effect row */
.um-table tbody tr:hover td {
  background: #f9fafb;
  transition: background 0.2s ease-in-out;
}

/* First column (index) styling */
.um-table td:first-child,
.um-table th:first-child {
  text-align: center;
  font-weight: 600;
  color: #6b7280;
}

/* Rounded corners only top header & bottom last row */
.um-table thead tr:first-child th:first-child {
  border-top-left-radius: 18px;
}
.um-table thead tr:first-child th:last-child {
  border-top-right-radius: 18px;
}
.um-table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 18px;
}
.um-table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 18px;
}

/* Action buttons spacing in cell */
.um-table .btn-icon {
  margin: 0 2px;
}

/* ===== Events list ===== */
.event-list {
  display: flex;
  flex-wrap: wrap; /* otomatis ke baris baru kalau panjang */
  gap: 6px 16px; /* jarak antar item */
  max-width: 100%; /* batasi di dalam kolom tabel */
}

.event-item {
  font-size: 0.85rem;
  color: #374151;
  white-space: nowrap; /* tiap item jangan terpotong */
  overflow: hidden;
  text-overflow: ellipsis; /* kalau super panjang */
  max-width: 220px; /* atur max width tiap item */
}

/* ===== Avatars & chips ===== */
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e7eb;
}
.avatar.lg {
  width: 56px;
  height: 56px;
  border-radius: 14px;
}
.chip {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
  line-height: 1;
}

/* ===== Custom Pagination ===== */
.custom-pagination .page-item {
  margin: 0 4px;
}

.custom-pagination .page-link {
  border-radius: 999px !important; /* full rounded pill */
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease-in-out;
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

/* ===== Judge row box ===== */
.judge-row {
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 12px;
  background: #ffffff;
}

/* ===== Modal Styling ===== */
.custom-modal {
  border-radius: 16px;
  overflow: hidden;
}

.modal-header-custom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e6ebf4;
  background: #f9fafb;
}

.modal-body-custom {
  padding: 20px 24px;
  background: #fff;
}

.modal-footer-custom {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid #e6ebf4;
  background: #f9fafb;
}

.avatar-xl {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.section-box {
  border: 1px solid #e6ebf4;
  border-radius: 12px;
  padding: 16px;
  margin-top: 24px;
  background: #fafafa;
}

.btn-add {
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6);
  color: #fff;
  font-weight: 500;
  padding: 6px 14px;
}

.btn-pill {
  border-radius: 24px;
  padding: 6px 20px;
  font-weight: 500;
}

.btn-icon {
  border-radius: 8px;
  padding: 6px 8px;
}

.event-table {
  font-size: 0.9rem;
}
</style>
