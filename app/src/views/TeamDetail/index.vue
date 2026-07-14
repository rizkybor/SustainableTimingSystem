<template>
  <div class="mt-5">
    <b-row>
      <b-col cols="10" offset="1" class="mb-4">
        <div class="card-wrapper p-3 mb-2">
          <div
            class="d-flex align-items-center justify-content-between text-muted small"
          >
            <b-breadcrumb class="mb-0">
              <b-breadcrumb-item to="/">
                <Icon icon="mdi:home-outline" class="mr-1" />
                Dashboard
              </b-breadcrumb-item>
              <b-breadcrumb-item active>Team Details</b-breadcrumb-item>
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
          <div @click="goBack" class="btn-custom d-flex align-items-center mb-3">
            <Icon icon="mdi:chevron-left" class="mr-1" />
            <span>Back</span>
          </div>

          <div v-if="loading" class="text-center text-muted py-5">
            <b-spinner variant="primary" class="mr-2" /> Memuat data tim…
          </div>

          <div v-else-if="!masterRecords.length && !registrations.length" class="text-center text-muted py-5">
            <Icon icon="mdi:account-search-outline" width="40" height="40" style="opacity: 0.5" />
            <div class="mt-2">Data tim "{{ teamName }}" tidak ditemukan.</div>
          </div>

          <div v-else>
            <!-- Header -->
            <div class="d-flex align-items-center mb-4">
              <div
                class="team-avatar mr-3 d-flex align-items-center justify-content-center"
              >
                <Icon icon="mdi:account-circle" width="36" height="36" />
              </div>
              <div>
                <h2 class="page-title mb-1">
                  {{ teamName }}
                  <CountryFlag v-if="primaryCountryCode" :code="primaryCountryCode" />
                </h2>
                <p class="page-subtitle mb-0">
                  {{ primaryTypeTeam || "-" }} ·
                  {{ registrations.length }} race registration(s)
                </p>
              </div>
            </div>

            <!-- Master records -->
            <div class="section-divider my-4"><span>Team Records</span></div>
            <div class="table-responsive px-1 pb-2 table-rounded-wrapper mb-4">
              <b-table
                striped
                hover
                small
                head-variant="light"
                :items="masterRecords"
                :fields="masterFields"
                class="um-table mt-0"
                show-empty
                empty-text="Tidak ada data master tim."
              >
                <template #cell(nameTeam)="row">
                  <span class="font-weight-bold text-dark">{{ row.item.nameTeam || "-" }}</span>
                  <CountryFlag :code="row.item.countryCode" />
                </template>
                <template #cell(bibTeam)="row">
                  <span v-if="row.item.bibTeam" class="status-pill status-neutral">
                    <span class="dot"></span> {{ row.item.bibTeam }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </template>
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
              </b-table>
            </div>

            <!-- Registered events -->
            <div class="section-divider my-4"><span>Registered In</span></div>

            <div v-if="!eventsGrouped.length" class="text-center text-muted py-4">
              Tim ini belum terdaftar di race manapun.
            </div>

            <div
              v-for="ev in eventsGrouped"
              :key="ev.eventId"
              class="event-card mb-3"
            >
              <div class="event-card-header">
                <div>
                  <div class="font-weight-bold text-dark">
                    {{ eventNameLoading(ev.eventId) ? "Memuat…" : (ev.eventName || "(Event tidak ditemukan)") }}
                  </div>
                  <div class="text-muted small">
                    {{ ev.categories.length }} race category registration(s)
                  </div>
                </div>
                <b-button
                  size="sm"
                  variant="outline-secondary"
                  class="btn-icon"
                  @click="openEvent(ev)"
                >
                  Open Event
                  <Icon icon="mdi:open-in-new" width="14" height="14" class="ml-1" />
                </b-button>
              </div>

              <div
                v-for="(cat, cIdx) in ev.categories"
                :key="cIdx"
                class="category-row"
              >
                <div class="category-row-head">
                  <div>
                    <span class="cat-badge">{{ cat.raceCategory || "-" }}</span>
                    <span class="text-muted small ml-2">
                      {{ cat.divisionName || "-" }} · {{ cat.raceName || "-" }}
                      <span v-if="cat.initialName"> • {{ cat.initialName }}</span>
                    </span>
                  </div>
                  <span v-if="cat.bibTeam" class="status-pill status-neutral">
                    <span class="dot"></span> BIB {{ cat.bibTeam }}
                  </span>
                </div>

                <div v-if="cat.result" class="result-grid mt-2">
                  <div class="td-field">
                    <div class="td-label">Ranked</div>
                    <div class="td-value">{{ cat.result.rankedByCats != null && cat.result.rankedByCats !== "" ? cat.result.rankedByCats : "-" }}</div>
                  </div>
                  <div class="td-field">
                    <div class="td-label">Score</div>
                    <div class="td-value">{{ cat.result.scored != null && cat.result.scored !== "" ? cat.result.scored : "-" }}</div>
                  </div>
                </div>
                <div v-else class="text-muted small mt-2">
                  {{ loadingResults ? "Memuat hasil…" : "Belum ada hasil." }}
                </div>

                <!-- Timing detail mentah (Sprint/Slalom/DRR saja) -->
                <template v-if="cat.supportsRawResult">
                  <div v-if="cat.rawRuns.length" class="timing-detail mt-2">
                    <div
                      v-for="(run, rIdx) in cat.rawRuns"
                      :key="rIdx"
                      class="timing-run"
                    >
                      <div class="timing-run-label">{{ run.label }}</div>
                      <div v-if="run.fields.length" class="result-grid">
                        <div
                          class="td-field"
                          v-for="f in run.fields"
                          :key="f.label"
                        >
                          <div class="td-label">{{ f.label }}</div>
                          <div class="td-value">{{ f.value }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-muted small mt-2">
                    {{ loadingRawResults ? "Memuat timing detail…" : "Belum ada timing detail." }}
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import CountryFlag from "@/components/common/CountryFlag.vue";
import { RESULT_FIELD_LABELS, collectFields } from "@/utils/formatRaceResult";

// teamsRegisteredCollection & temporaryOverallEventResults kadang memakai
// key discipline yang beda ejaan untuk kategori yang sama (mis. Head to Head
// disimpan sebagai "HEAD2HEAD" saat registrasi tim, tapi "HEADTOHEAD" saat
// hasil race di-merge ke rekap ranked/score). Normalisasi di sini supaya
// join dua sumber data itu tidak diam-diam gagal untuk H2H.
var CATEGORY_KEY_ALIASES = { HEAD2HEAD: "HEADTOHEAD" };
function normalizeCategoryKey(raceCategory) {
  var up = String(raceCategory || "").toUpperCase();
  return CATEGORY_KEY_ALIASES[up] || up;
}

// Timing detail mentah per-run baru ada endpoint bacanya untuk 3 kategori
// ini (lihat getRaceCategoryResultForTeam di controllers/GET/getResult.js).
// H2H & RX belum punya endpoint baca-per-tim dari koleksi hasilnya.
var RAW_RESULT_CATEGORIES = ["SPRINT", "SLALOM", "DRR"];

function registrationIdentityKey(r) {
  return [r.eventId, r.initialId, r.raceId, r.divisionId].join("|");
}

// Normalisasi field "result" milik satu tim jadi daftar run yang siap
// dirender — bentuknya beda per kategori: Sprint/DRR = objek tunggal,
// Slalom = array per-run (biasanya 2 run).
function normalizeRawRuns(rawResult) {
  if (!rawResult || rawResult.result === undefined) return [];
  var result = rawResult.result;
  if (Array.isArray(result)) {
    return result.map(function (r, idx) {
      return {
        label: result.length > 1 ? "Run " + (idx + 1) : "Result",
        fields: collectFields(r, RESULT_FIELD_LABELS),
      };
    });
  }
  return [{ label: "Result", fields: collectFields(result, RESULT_FIELD_LABELS) }];
}

export default {
  name: "SustainableTimingSystemTeamDetail",
  components: { Icon, CountryFlag },
  data() {
    return {
      loading: true,
      loadingResults: false,
      masterRecords: [],
      registrations: [],
      // judul asli tiap event (eventsCollection.eventName), di-lookup
      // terpisah per eventId karena teamsRegisteredCollection cuma
      // menyimpan eventId + nama RACE CATEGORY-nya, bukan judul event
      eventInfoById: {},
      pendingEventInfoIds: {},
      // hasil rank/score per eventId, diisi via event-results:get-all-by-event
      // (diindeks dari eventId yang ADA DI DALAM tiap balasan, bukan dari
      // urutan pengiriman request — supaya aman kalau balasan datang tidak
      // berurutan karena beberapa event di-query sekaligus)
      resultDocsByEventId: {},
      // hasil timing MENTAH per-run (Sprint/Slalom/DRR saja — H2H/RX belum
      // ada endpoint baca per-tim), diindeks per identity key registrasi
      rawResultByKey: {},
      loadingRawResults: false,
      masterFields: [
        { key: "nameTeam", label: "Team Name" },
        { key: "typeTeam", label: "Type" },
        { key: "bibTeam", label: "BIB" },
        { key: "statusId", label: "Status" },
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
    teamName() {
      return String(this.$route.query.name || "-");
    },
    primaryCountryCode() {
      const withCountry = this.masterRecords.find((t) => t.countryCode);
      return withCountry ? withCountry.countryCode : "";
    },
    primaryTypeTeam() {
      const withType = this.masterRecords.find((t) => t.typeTeam);
      return withType ? withType.typeTeam : "";
    },
    eventsGrouped() {
      const nameUpper = this.teamName.trim().toUpperCase();
      const map = {};
      const order = [];

      this.registrations.forEach((r) => {
        const key = r.eventId;
        if (!map[key]) {
          map[key] = {
            eventId: r.eventId,
            eventName: (this.eventInfoById[r.eventId] && this.eventInfoById[r.eventId].eventName) || "",
            categories: [],
          };
          order.push(key);
        }

        // Cari dokumen rekap ranked/score untuk bracket (division+race+initial)
        // ini — identitas dokumen di temporaryOverallEventResults TIDAK
        // menyertakan discipline, karena satu dokumen menampung hasil semua
        // race category sekaligus untuk bracket yang sama.
        const docs = this.resultDocsByEventId[r.eventId] || [];
        const doc = docs.find(
          (d) =>
            String(d.raceName || "").toUpperCase() === String(r.raceName || "").toUpperCase() &&
            String(d.divisionName || "").toUpperCase() === String(r.divisionName || "").toUpperCase() &&
            String(d.initialName || "").toUpperCase() === String(r.initialName || "").toUpperCase()
        );

        let team = null;
        if (doc && Array.isArray(doc.eventResult)) {
          team =
            doc.eventResult.find(
              (e) => String(e.teamName || "").trim().toUpperCase() === nameUpper
            ) || null;
        }

        // Dari entry tim itu, ambil rank/score KHUSUS discipline race
        // category baris ini (bukan agregat semua discipline).
        let resultEntry = null;
        if (team && Array.isArray(team.categories)) {
          const wantedKey = normalizeCategoryKey(r.raceCategory);
          resultEntry =
            team.categories.find(
              (c) => normalizeCategoryKey(c.name) === wantedKey
            ) || null;
        }

        const supportsRawResult =
          RAW_RESULT_CATEGORIES.indexOf(String(r.raceCategory || "").toUpperCase()) !== -1;
        const rawResult = supportsRawResult
          ? this.rawResultByKey[registrationIdentityKey(r)] || null
          : null;

        map[key].categories.push({
          raceCategory: r.raceCategory,
          raceName: r.raceName,
          divisionName: r.divisionName,
          initialName: r.initialName,
          bibTeam: r.bibTeam,
          result: resultEntry,
          supportsRawResult: supportsRawResult,
          rawRuns: supportsRawResult ? normalizeRawRuns(rawResult) : [],
        });
      });

      return order.map((k) => map[k]);
    },
  },
  mounted() {
    this.loadData();
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    openEvent(item) {
      if (!item || !item.eventId) return;
      this.$router.push("/event-detail/" + item.eventId);
    },
    eventNameLoading(eventId) {
      return !!this.pendingEventInfoIds[eventId];
    },
    loadData() {
      this.loading = true;
      const name = String(this.$route.query.name || "").trim();
      const nameUpper = name.toUpperCase();

      let pending = 2;
      const done = () => {
        pending -= 1;
        if (pending <= 0) this.loading = false;
      };

      ipcRenderer.send("teams:get-all");
      ipcRenderer.once("teams:get-all-reply", (_e, res) => {
        const items = res && res.ok && Array.isArray(res.items) ? res.items : [];
        this.masterRecords = items.filter(
          (t) => String((t && t.nameTeam) || "").trim().toUpperCase() === nameUpper
        );
        done();
      });

      ipcRenderer.send("teams-registered:find-by-name", name);
      ipcRenderer.once("teams-registered:find-by-name-reply", (_e, res) => {
        this.registrations = res && res.ok && Array.isArray(res.items) ? res.items : [];
        this.loadResultsForEvents();
        this.loadEventNames();
        this.loadRawResults();
        done();
      });
    },

    // Ambil rekap ranked/score (temporaryOverallEventResults) untuk tiap
    // event unik yang diikuti tim ini, lalu di-join ke registrations lewat
    // computed `eventsGrouped` (match by raceName+divisionName+initialName).
    loadResultsForEvents() {
      const eventIds = Array.from(
        new Set(this.registrations.map((r) => r.eventId).filter(Boolean))
      );
      if (!eventIds.length) return;

      this.loadingResults = true;
      let pending = eventIds.length;
      const self = this;

      eventIds.forEach(function (eventId) {
        ipcRenderer.send("event-results:get-all-by-event", eventId);
        ipcRenderer.once(
          "event-results:get-all-by-event-reply",
          function (_e, res) {
            const items = res && res.ok && Array.isArray(res.items) ? res.items : [];
            items.forEach(function (doc) {
              const key = String((doc && doc.eventId) || "");
              if (!key) return;
              if (!self.resultDocsByEventId[key]) {
                self.$set(self.resultDocsByEventId, key, []);
              }
              self.resultDocsByEventId[key].push(doc);
            });
            pending -= 1;
            if (pending <= 0) self.loadingResults = false;
          }
        );
      });
    },

    // Ambil judul asli (eventsCollection.eventName) untuk tiap eventId unik.
    // "get-events-byid-reply" adalah channel yang dipakai bersama banyak
    // komponen lain di aplikasi ini — supaya tidak ada beberapa request
    // bersamaan yang balasannya bisa saling tertukar, di-fetch SATU per
    // SATU (await tiap balasan) alih-alih dikirim sekaligus paralel.
    async loadEventNames() {
      const eventIds = Array.from(
        new Set(this.registrations.map((r) => r.eventId).filter(Boolean))
      );
      for (let i = 0; i < eventIds.length; i++) {
        const eventId = eventIds[i];
        if (this.eventInfoById[eventId]) continue;
        this.$set(this.pendingEventInfoIds, eventId, true);
        // eslint-disable-next-line no-await-in-loop
        const data = await new Promise((resolve) => {
          ipcRenderer.send("get-events-byid", eventId);
          ipcRenderer.once("get-events-byid-reply", (_e, res) => resolve(res));
        });
        this.$set(this.eventInfoById, eventId, data || {});
        this.$delete(this.pendingEventInfoIds, eventId);
      }
    },

    // Timing detail mentah per-run (Sprint/Slalom/DRR saja). Sekuensial,
    // satu per satu, karena "team-result-detail:get-reply" adalah channel
    // sendiri untuk fitur ini tapi tetap lebih aman dipanggil berurutan
    // daripada banyak request bersamaan yang balasannya cuma dibedakan
    // lewat urutan .once() pendaftaran.
    async loadRawResults() {
      const targets = this.registrations.filter(
        (r) => RAW_RESULT_CATEGORIES.indexOf(String(r.raceCategory || "").toUpperCase()) !== -1
      );
      if (!targets.length) return;

      this.loadingRawResults = true;
      for (let i = 0; i < targets.length; i++) {
        const r = targets[i];
        const key = registrationIdentityKey(r);
        if (this.rawResultByKey[key] !== undefined) continue;

        // eslint-disable-next-line no-await-in-loop
        const res = await new Promise((resolve) => {
          ipcRenderer.send("team-result-detail:get", {
            eventId: r.eventId,
            initialId: r.initialId,
            raceId: r.raceId,
            divisionId: r.divisionId,
            raceCategory: r.raceCategory,
            nameTeam: this.teamName,
          });
          ipcRenderer.once("team-result-detail:get-reply", (_e, data) => resolve(data));
        });

        this.$set(this.rawResultByKey, key, (res && res.ok && res.team) || null);
      }
      this.loadingRawResults = false;
    },
  },
};
</script>

<style scoped>
.team-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #eef3fb;
  color: #325a8f;
}
.btn-custom { cursor: pointer; color: #1c4c7a; font-weight: 600; }
.page-title { font-weight: 800; color: #0f172a; }
.page-subtitle { color: #6b7280; font-size: 0.95rem; }

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
.status-success { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
.status-upcoming { background: #fff7ed; color: #9a3412; border-color: #fed7aa; }
.status-neutral { background: #eff6ff; color: rgb(0, 180, 255); border-color: #bfdbfe; }
.status-pill .dot { width: 8px; height: 8px; border-radius: 999px; background: currentColor; display: inline-block; }

.section-divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9rem;
}
.section-divider::before,
.section-divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
}
.section-divider:not(:empty)::before { margin-right: 1rem; }
.section-divider:not(:empty)::after { margin-left: 1rem; }
.section-divider span {
  background: #fff;
  padding: 0 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  color: #9ca3af;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.45rem;
  border-radius: 10px;
}

/* Event > Race Category > Result hierarchy */
.event-card {
  border: 1px solid #e6ebf4;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}
.event-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2f7;
}
.category-row {
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
}
.category-row:last-child { border-bottom: none; }
.category-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.cat-badge {
  display: inline-block;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.4px;
  color: #1c4c7a;
  background: #eef6ff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 3px 8px;
}
.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.td-field { min-width: 0; }
.td-label {
  font-size: 11px;
  color: #8a95a3;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 3px;
}
.td-value {
  font-weight: 600;
  font-size: 13px;
  color: #1f2937;
}

.timing-detail {
  border-top: 1px dashed #e6ebf4;
  padding-top: 10px;
}
.timing-run + .timing-run { margin-top: 10px; }
.timing-run-label {
  font-weight: 800;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #1c4c7a;
  margin-bottom: 6px;
}
</style>
