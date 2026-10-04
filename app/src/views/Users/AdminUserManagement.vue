<template>
  <div class="list-page">
    <PageHero
      title="User Management"
      crumb="User Management"
      icon="mdi:account-cog-outline"
      subtitle="Kelola akun juri, main events, dan riwayat tindakannya"
      :stats="[
        { label: 'Total Users', value: users.length },
        { label: 'With Main Events', value: usersWithEventsCount, tone: 'success' },
        { label: 'Events Available', value: eventOptions.length, tone: 'neutral' },
      ]"
      @back="goTo"
    >
      <template #actions>
        <button type="button" class="ph-btn ph-btn--ghost" @click="fetchEvents">
          <Icon icon="mdi:calendar-sync-outline" />
          Refresh Events
        </button>
        <button type="button" class="ph-btn ph-btn--primary" @click="fetchUsers">
          <Icon icon="mdi:account-sync-outline" />
          Refresh Users
        </button>
      </template>
    </PageHero>

    <div class="lp-card">
      <!-- TOOLBAR -->
      <div class="lp-toolbar">
        <div class="lp-search">
          <Icon icon="mdi:magnify" class="lp-search__icon" />
          <input
            v-model="userQuery"
            type="text"
            class="lp-search__input"
            placeholder="Cari username atau email…"
          />
          <button v-if="userQuery" type="button" class="lp-search__clear" @click="userQuery = ''">
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div class="lp-filters">
          <div class="lp-segment" role="group" aria-label="Filter main events">
            <button
              v-for="opt in userSegments"
              :key="opt.value"
              type="button"
              class="lp-segment__btn"
              :class="{ active: userFilter === opt.value }"
              @click="userFilter = opt.value"
            >
              {{ opt.text }}
              <span class="lp-segment__count">{{ opt.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-responsive lp-table-wrap">
        <b-table
          hover
          :items="filteredUsers"
          :fields="fields"
          responsive="md"
          class="lp-table mb-0"
          :per-page="perPage"
          :current-page="currentPage"
          sort-by="createdAt"
          sort-desc
          show-empty
          empty-text=""
        >
          <template #empty>
            <div class="lp-empty">
              <Icon icon="mdi:account-off-outline" width="40" height="40" />
              <div class="lp-empty__title">User tidak ditemukan</div>
              <small>Ubah pencarian/filter, atau klik "Refresh Users".</small>
            </div>
          </template>

          <template #cell(index)="row">
            <span class="lp-muted">{{ (currentPage - 1) * perPage + row.index + 1 }}</span>
          </template>

          <template #cell(username)="row">
            <div class="um-user">
              <img :src="row.item.image || fallbackAvatar" alt="avatar" class="um-user__avatar" />
              <div class="um-user__text">
                <div class="um-user__name">{{ row.item.username || "-" }}</div>
                <div class="um-user__email">{{ row.item.email || "-" }}</div>
              </div>
            </div>
          </template>

          <template #cell(mainEvents)="row">
            <div class="um-events">
              <span
                v-for="eid in (row.item.mainEvents || []).slice(0, 2)"
                :key="eid"
                class="lp-chip um-events__chip"
                :title="eventName(eid)"
              >
                {{ shortEventName(eid) }}
              </span>
              <span
                v-if="(row.item.mainEvents || []).length > 2"
                class="lp-chip lp-chip--soft"
                :title="(row.item.mainEvents || []).slice(2).map(eventName).join(', ')"
              >
                +{{ row.item.mainEvents.length - 2 }}
              </span>
              <span v-if="!row.item.mainEvents || !row.item.mainEvents.length" class="lp-muted">
                Belum ada event
              </span>
            </div>
          </template>

          <template #cell(createdAt)="row">
            <span class="lp-date">
              <Icon icon="mdi:calendar-plus-outline" />
              {{ _formatDateTime(row.item.createdAt) }}
            </span>
          </template>

          <template #cell(updatedAt)="row">
            <span class="lp-date">
              <Icon icon="mdi:update" />
              {{ _formatDateTime(row.item.updatedAt) }}
            </span>
          </template>

          <template #cell(actions)="row">
            <div class="um-actions">
              <UserJudgeHistoryModal :username="row.item.username" :event-dict="eventDict" />
              <button type="button" class="lp-icon-btn" title="Edit profil & main events" @click="openEdit(row.item)">
                <Icon icon="mdi:pencil-outline" />
              </button>
              <button type="button" class="lp-icon-btn lp-icon-btn--danger" title="Delete" @click="deleteUser(row.item.email)">
                <Icon icon="mdi:trash-can-outline" />
              </button>
            </div>
          </template>
        </b-table>
      </div>

      <div class="lp-footer">
        <small class="lp-muted">
          {{ filteredUsers.length === 0 ? 0 : (currentPage - 1) * perPage + 1 }} –
          {{ Math.min(currentPage * perPage, filteredUsers.length) }}
          of {{ filteredUsers.length }} users
        </small>
        <b-pagination
          v-model="currentPage"
          :total-rows="filteredUsers.length"
          :per-page="perPage"
          align="center"
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
    </div>

    <!-- MODAL: Judges Profile Configuration -->
    <b-modal
      v-model="showEdit"
      size="lg"
      hide-header
      hide-footer
      :no-close-on-esc="true"
      :no-close-on-backdrop="true"
      body-class="p-0"
      content-class="upm-content"
      centered
    >
      <!-- Header profil -->
      <div class="upm-head">
        <div class="upm-head__bg"></div>
        <button type="button" class="upm-close" aria-label="Close" @click="showEdit = false">
          <Icon icon="mdi:close" />
        </button>
        <div class="upm-head__inner">
          <img :src="editForm.image || fallbackAvatar" alt="Avatar" class="upm-avatar" />
          <div class="upm-head__text">
            <span class="upm-eyebrow">Judges Profile Configuration</span>
            <h4 class="upm-name">{{ editForm.username || "-" }}</h4>
            <div class="upm-email">
              <Icon icon="mdi:email-outline" />
              {{ editForm.email || "-" }}
            </div>
          </div>
        </div>
      </div>

      <!-- Main Events -->
      <div class="upm-body">
        <div class="upm-section-head">
          <div>
            <h5 class="upm-section-title">
              Main Events
              <span class="lp-segment__count">{{ mainEventRows.length }}</span>
            </h5>
            <p class="upm-section-sub">Event yang bisa diakses juri ini di sts-jurysystem.</p>
          </div>
        </div>

        <div class="upm-picker">
          <div class="lp-select upm-picker__select">
            <Icon icon="mdi:calendar-search" class="lp-select__icon" />
            <select v-model="selectedEventId" class="lp-select__input" :disabled="!eventOptions.length">
              <option value="" disabled>Pilih event…</option>
              <option v-for="o in eventOptions" :key="o.value" :value="o.value" :disabled="o.disabled">
                {{ o.text }}
              </option>
            </select>
            <Icon icon="mdi:chevron-down" class="lp-select__chev" />
          </div>
          <button type="button" class="upm-add" :disabled="!selectedEventId" @click="addMainEvent">
            <Icon icon="mdi:plus" />
            Add Event
          </button>
        </div>

        <div v-if="!mainEventRows.length" class="upm-empty">
          <Icon icon="mdi:calendar-blank-outline" width="32" height="32" />
          <div>Belum ada Main Event. Pilih event di atas lalu klik <strong>Add Event</strong>.</div>
        </div>

        <ul v-else class="upm-events">
          <li v-for="(item, i) in mainEventRows" :key="item.id" class="upm-event">
            <span class="upm-event__no">{{ i + 1 }}</span>
            <div class="upm-event__text">
              <div class="upm-event__name">{{ item.eventName }}</div>
              <div class="upm-event__meta">
                <span v-if="item.levelName && item.levelName !== '-'" class="lp-chip">{{ item.levelName }}</span>
                <span class="lp-date">
                  <Icon icon="mdi:calendar-blank-outline" />
                  {{ item.startDateEvent }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="lp-icon-btn lp-icon-btn--danger"
              title="Hapus dari Main Events"
              @click="removeEventById(item.id)"
            >
              <Icon icon="mdi:trash-can-outline" />
            </button>
          </li>
        </ul>
      </div>

      <div class="upm-foot">
        <button type="button" class="upm-btn upm-btn--ghost" @click="showEdit = false">Cancel</button>
        <button type="button" class="upm-btn upm-btn--primary" @click="saveUser">
          <Icon icon="mdi:content-save-outline" />
          Update
        </button>
      </div>
    </b-modal>
  </div>
</template>


<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import UserJudgeHistoryModal from "@/components/judge/UserJudgeHistoryModal.vue";
import PageHero from "@/components/common/PageHero.vue";

export default {
  name: "AdminUserManagement",
  components: { Icon, UserJudgeHistoryModal, PageHero },
  data() {
    return {
      perPage: 10,
      currentPage: 1,
      users: [],
      userQuery: "",
      userFilter: "ALL", // ALL | with | without (main events)
      editingUserId: "",
      fields: [
        {
          key: "index",
          label: "#",
          thStyle: { width: "60px" },
          class: "text-center align-middle",
        }, // ⬅️ NEW

        { key: "username", label: "User", class: "align-middle" },
        { key: "mainEvents", label: "Main Events", class: "align-middle" },
        {
          key: "createdAt",
          label: "Created At",
          class: "align-middle text-nowrap",
          sortable: true,
        },
        {
          key: "updatedAt",
          label: "Updated At",
          class: "align-middle text-nowrap",
          sortable: true,
        },
        {
          key: "actions",
          label: "Actions",
          class: "text-center align-middle",
          thStyle: { width: "150px" },
        },
      ],
      showEdit: false,
      editForm: {
        _id: "",
        username: "",
        image: "",
        mainEvents: [],
        email: "",
      },
      selectedEventId: "",
      eventDict: {},
      eventOptions: [],
      // SVG inline (bukan URL layanan eksternal) — sebelumnya memuat dari
      // ui-avatars.com, yang jadi gambar rusak (broken image) kalau jaringan
      // tidak bisa akses domain eksternal itu (mis. offline/firewall).
      // Placeholder lokal ini selalu tampil tanpa bergantung pada internet.
      fallbackAvatar:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
            '<rect width="64" height="64" fill="#E5E7EB"/>' +
            '<circle cx="32" cy="24" r="12" fill="#9CA3AF"/>' +
            '<path d="M8 58c0-13.3 10.7-22 24-22s24 8.7 24 22" fill="#9CA3AF"/>' +
            "</svg>"
        ),
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
    filteredUsers() {
      let list = Array.isArray(this.users) ? this.users : [];
      const hasEvents = (u) => Array.isArray(u.mainEvents) && u.mainEvents.length > 0;
      if (this.userFilter === "with") list = list.filter(hasEvents);
      else if (this.userFilter === "without") list = list.filter((u) => !hasEvents(u));
      const q = this.userQuery.trim().toLowerCase();
      if (q) {
        list = list.filter((u) =>
          [u.username, u.email].some((v) => String(v || "").toLowerCase().includes(q))
        );
      }
      return list;
    },
    userSegments() {
      const total = (this.users || []).length;
      return [
        { value: "ALL", text: "Semua", count: total },
        { value: "with", text: "Punya Event", count: this.usersWithEventsCount },
        { value: "without", text: "Belum Ada Event", count: total - this.usersWithEventsCount },
      ];
    },
    usersWithEventsCount() {
      return (this.users || []).filter(
        (u) => Array.isArray(u.mainEvents) && u.mainEvents.length > 0
      ).length;
    },
  },
  watch: {
    userQuery() {
      this.currentPage = 1;
    },
    userFilter() {
      this.currentPage = 1;
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

    // Format createdAt/updatedAt (Mongoose timestamps) utk kolom tabel User
    // Management — contoh output: "25 Sep 2025, 14:30".
    _formatDateTime(v) {
      if (!v) return "-";
      try {
        const d = new Date(v);
        if (isNaN(d.getTime())) return "-";
        const datePart = d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const timePart = d.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${datePart}, ${timePart}`;
      } catch {
        return "-";
      }
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
        let raw = [];
        if (res && Array.isArray(res.users)) raw = res.users;
        else if (res && Array.isArray(res.items)) raw = res.items;
        else if (res && res.data && Array.isArray(res.data.users))
          raw = res.data.users;
        else if (Array.isArray(res)) raw = res;

        // Normalisasi setiap user
        this.users = raw.map((u) => {
          const id = this._toStringId(u && u._id);
          return {
            ...u,
            _id: id,
            email: typeof u.email === "string" ? u.email.trim() : "",
            mainEvents: Array.isArray(u.mainEvents)
              ? u.mainEvents.map(this._toStringId).filter(Boolean)
              : [],
          };
        });

        this.currentPage = 1;
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
      this.editingUserId = this._toStringId(user && user._id);
      this.editForm = JSON.parse(JSON.stringify(user || {}));
      this.showEdit = true;
    },

    saveUser() {
      try {
        const form = JSON.parse(JSON.stringify(this.editForm));

        // pastikan id user valid
        const userId = this._toStringId(form._id);
        if (!userId) {
          this._toast("User ID tidak valid", "danger");
          return;
        }

        // normalisasi mainEvents. JANGAN ikut-ikutan menambahkan
        // `selectedEventId` di sini — itu cuma nilai dropdown "+ Add
        // Event" yang sedang dipilih (bisa saja belum diklik Add-nya).
        // Kalau ikut disertakan, event yang cuma sedang dilihat/dipilih
        // di dropdown (tanpa klik + Add Event) akan diam-diam ikut
        // tersimpan ke mainEvents user saat tombol Save utama diklik.
        // Penambahan event yang sah sudah ditangani sepenuhnya oleh
        // addMainEvent() yang push langsung ke editForm.mainEvents.
        const set = new Set(
          (Array.isArray(form.mainEvents) ? form.mainEvents : [])
            .map(this._toStringId)
            .filter(Boolean)
        );

        // ⚠️ KIRIM CUMA INI
        const payload = {
          mainEvents: Array.from(set),
          // optional kalau mau: updatedAt: new Date().toISOString()
        };

        ipcRenderer.removeAllListeners("users:update:reply");
        ipcRenderer.send("users:update", { userId, payload });
        ipcRenderer.once("users:update:reply", (_e, res) => {
          if (res && res.ok) {
            this._toast("User updated", "success");
            this.showEdit = false;
            this.fetchUsers();
          } else {
            this._toast((res && res.error) || "Failed to update", "danger");
          }
        });
      } catch (err) {
        this._toast("Unexpected error while updating user", "danger");
      }
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
    goTo() {
      this.$router.push(`/`);
    },
  },
};
</script>

<style scoped>
/* Header: PageHero.vue; kartu/toolbar/tabel: list-pages.css (global). */

/* ---------- Tabel user ---------- */
.um-user {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}
.um-user__avatar {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  object-fit: cover;
  background: #e5e7eb;
  border: 1px solid #e6edf6;
}
.um-user__text {
  min-width: 0;
}
.um-user__name {
  font-weight: 800;
  color: #0f172a;
}
.um-user__email {
  font-size: 12px;
  color: #64748b;
}

.um-events {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-width: 340px;
}
.um-events__chip {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Baris tombol aksi (Riwayat Judge/Edit/Delete) dalam satu flex row dgn
   gap seragam — UserJudgeHistoryModal membungkus tombolnya dlm <span>. */
.um-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
/* Samakan tombol Riwayat Judge (b-button di komponen anak) dgn .lp-icon-btn */
.um-actions ::v-deep .btn-icon {
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #0e7490;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.um-actions ::v-deep .btn-icon:hover {
  border-color: #25b0eb;
  background: #f0f7ff;
  color: #1c4c7a;
}

/* ---------- Modal Judges Profile Configuration ---------- */
.upm-head {
  position: relative;
  color: #fff;
}
.upm-head__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
      500px 200px at 90% 0%,
      rgba(37, 176, 235, 0.45),
      transparent 70%
    ),
    linear-gradient(110deg, #0f2f52 0%, #1c4c7a 55%, #1d7fb8 100%);
}
.upm-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
}
.upm-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
.upm-head__inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 28px 28px 24px;
}
.upm-avatar {
  flex: none;
  width: 84px;
  height: 84px;
  border-radius: 22px;
  object-fit: cover;
  background: #e5e7eb;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2),
    0 10px 24px rgba(0, 0, 0, 0.25);
}
.upm-head__text {
  min-width: 0;
}
.upm-eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #bae6fd;
}
.upm-name {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}
.upm-email {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.8);
}

.upm-body {
  padding: 22px 28px 8px;
}
.upm-section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
}
.upm-section-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}
.upm-section-sub {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: #64748b;
}

.upm-picker {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.upm-picker__select {
  flex: 1;
  min-width: 0;
}
.upm-picker__select .lp-select__input {
  width: 100%;
}
.upm-add {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 11px;
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  font-size: 13.5px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(28, 76, 122, 0.25);
}
.upm-add:hover:not(:disabled) {
  filter: brightness(1.07);
}
.upm-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.upm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 16px;
  border: 1px dashed #dbe3ee;
  border-radius: 14px;
  background: #fafcff;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}

.upm-events {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 46vh;
  overflow-y: auto;
}
.upm-event {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid #e6edf6;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.upm-event:hover {
  border-color: #b9d7f0;
  box-shadow: 0 4px 12px rgba(15, 42, 67, 0.06);
}
.upm-event__no {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: #e6f4fd;
  color: #1c4c7a;
  font-size: 12.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upm-event__text {
  flex: 1;
  min-width: 0;
}
.upm-event__name {
  font-weight: 800;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.upm-event__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12.5px;
}

.upm-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
  padding: 16px 28px;
  border-top: 1px solid #eef2f7;
  background: #fbfdff;
}
.upm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 20px;
  border-radius: 11px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
}
.upm-btn--ghost {
  background: #fff;
  border-color: #e2e8f0;
  color: #475569;
}
.upm-btn--ghost:hover {
  background: #f8fafc;
}
.upm-btn--primary {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #fff;
  box-shadow: 0 6px 14px rgba(28, 76, 122, 0.25);
}
.upm-btn--primary:hover {
  filter: brightness(1.07);
}

@media (max-width: 575.98px) {
  .upm-head__inner {
    flex-direction: column;
    align-items: flex-start;
  }
  .upm-picker {
    flex-direction: column;
  }
}
</style>

<style>
/* Global (bukan scoped): b-modal dipindah ke <body>, jadi .modal-content
   tidak punya ancestor ber-atribut scoped — ::v-deep tidak akan kena. */
.upm-content {
  border: none;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
}
</style>
