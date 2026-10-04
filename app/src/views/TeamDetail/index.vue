<template>
  <div class="list-page">
    <PageHero
      :title="teamName"
      crumb="Team Details"
      :subtitle="(primaryTypeTeam ? primaryTypeTeam + ' · ' : '') + 'Detail tim, registrasi race & hasilnya'"
      :stats="[
        { label: 'Events', value: eventsGrouped.length },
        { label: 'Race Registrations', value: registrations.length, tone: 'success' },
        { label: 'Team Records', value: masterRecords.length, tone: 'neutral' },
      ]"
    >
      <template #icon>
        <span class="td-avatar" :style="{ background: avatarColor(teamName) }">
          {{ initials(teamName) }}
        </span>
      </template>
      <template #title-suffix>
        <CountryFlag v-if="primaryCountryCode" :code="primaryCountryCode" class="td-title-flag" />
      </template>
    </PageHero>

    <div v-if="loading" class="lp-card td-state">
      <b-spinner variant="primary" class="mr-2" small /> Memuat data tim…
    </div>

    <div v-else-if="!masterRecords.length && !registrations.length" class="lp-card td-state">
      <Icon icon="mdi:account-search-outline" width="40" height="40" />
      <div class="lp-empty__title mt-2">Data tim "{{ teamName }}" tidak ditemukan.</div>
    </div>

    <div v-else class="td-layout">
      <!-- TEAM RECORDS -->
      <aside class="lp-card td-records">
        <div class="lp-card__head">
          <h5 class="lp-card__title">
            <Icon icon="mdi:card-account-details-outline" />
            Team Records
          </h5>
          <span class="lp-segment__count">{{ masterRecords.length }}</span>
        </div>
        <div class="td-records__body">
          <div v-if="!masterRecords.length" class="lp-muted small">Tidak ada data master tim.</div>
          <div v-for="(rec, i) in masterRecords" :key="i" class="td-record">
            <div class="td-record__top">
              <span class="td-record__name">{{ rec.nameTeam || "-" }}</span>
              <CountryFlag :code="rec.countryCode" />
            </div>
            <div class="td-record__meta">
              <span v-if="rec.typeTeam" class="lp-chip lp-chip--soft">{{ rec.typeTeam }}</span>
              <span v-if="rec.bibTeam" class="lp-chip">BIB {{ rec.bibTeam }}</span>
              <span v-if="rec.statusId === 0" class="lp-status lp-status--on">
                <span class="lp-status__dot"></span> Active
              </span>
              <span v-else class="lp-status lp-status--off">
                <span class="lp-status__dot"></span> Inactive
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- REGISTERED IN -->
      <section class="td-events">
        <div class="td-events__head">
          <h5 class="lp-card__title">
            <Icon icon="mdi:flag-checkered" />
            Registered In
          </h5>
          <span class="lp-muted small">{{ eventsGrouped.length }} event</span>
        </div>

        <div v-if="!eventsGrouped.length" class="lp-card td-state">
          <Icon icon="mdi:calendar-blank-outline" width="34" height="34" />
          <div>Tim ini belum terdaftar di race manapun.</div>
        </div>

        <article v-for="ev in eventsGrouped" :key="ev.eventId" class="lp-card td-event">
          <header class="td-event__head">
            <span class="td-event__icon"><Icon icon="mdi:calendar-star" /></span>
            <div class="td-event__text">
              <div class="td-event__name">
                {{ eventNameLoading(ev.eventId) ? "Memuat…" : (ev.eventName || "(Event tidak ditemukan)") }}
              </div>
              <div class="lp-muted small">
                {{ ev.categories.length }} race category registration(s)
              </div>
            </div>
            <button type="button" class="td-open" @click="openEvent(ev)">
              Open Event
              <Icon icon="mdi:arrow-top-right" />
            </button>
          </header>

          <div v-for="(cat, cIdx) in ev.categories" :key="cIdx" class="td-cat">
            <div class="td-cat__head">
              <span class="td-race" :class="'td-race--' + raceTone(cat.raceCategory)">
                {{ raceLabel(cat.raceCategory) }}
              </span>
              <span class="td-cat__bucket">
                {{ cat.divisionName || "-" }} · {{ cat.raceName || "-" }}
                <template v-if="cat.initialName"> · {{ cat.initialName }}</template>
              </span>
              <span v-if="cat.bibTeam" class="lp-chip td-cat__bib">BIB {{ cat.bibTeam }}</span>
            </div>

            <div v-if="cat.result" class="td-result">
              <div class="td-tile" :class="rankTone(cat.result.rankedByCats)">
                <span class="td-tile__label">
                  <Icon icon="mdi:podium" /> Ranked
                </span>
                <span class="td-tile__value">{{ displayValue(cat.result.rankedByCats) }}</span>
              </div>
              <div class="td-tile">
                <span class="td-tile__label">
                  <Icon icon="mdi:star-four-points-outline" /> Score
                </span>
                <span class="td-tile__value">{{ displayValue(cat.result.scored) }}</span>
              </div>
            </div>
            <div v-else class="td-note">
              {{ loadingResults ? "Memuat hasil…" : "Belum ada hasil." }}
            </div>

            <!-- Timing detail mentah (Sprint/Slalom/DRR saja) -->
            <template v-if="cat.supportsRawResult">
              <div v-if="cat.rawRuns.length" class="td-timing">
                <div v-for="(run, rIdx) in cat.rawRuns" :key="rIdx" class="td-run">
                  <div class="td-run__label">
                    <Icon icon="mdi:timer-outline" /> {{ run.label }}
                  </div>
                  <div v-if="run.fields.length" class="td-run__grid">
                    <div v-for="f in run.fields" :key="f.label" class="td-field">
                      <div class="td-label">{{ f.label }}</div>
                      <div class="td-value">{{ f.value }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="td-note">
                {{ loadingRawResults ? "Memuat timing detail…" : "Belum ada timing detail." }}
              </div>
            </template>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>


<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import CountryFlag from "@/components/common/CountryFlag.vue";
import PageHero from "@/components/common/PageHero.vue";
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
  components: { Icon, CountryFlag, PageHero },
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
    // ---- helper tampilan ----
    displayValue(v) {
      return v !== null && v !== undefined && v !== "" ? v : "-";
    },
    // Warna tile Ranked: emas/perak/perunggu utk juara 1-3.
    rankTone(v) {
      const n = Number(v);
      if (n === 1) return "td-tile--gold";
      if (n === 2) return "td-tile--silver";
      if (n === 3) return "td-tile--bronze";
      return "";
    },
    raceTone(raceCategory) {
      const k = normalizeCategoryKey(raceCategory);
      return (
        { SPRINT: "sprint", HEADTOHEAD: "h2h", SLALOM: "slalom", DRR: "drr", RX: "rx" }[k] ||
        "other"
      );
    },
    raceLabel(raceCategory) {
      const k = normalizeCategoryKey(raceCategory);
      return (
        {
          SPRINT: "Sprint",
          HEADTOHEAD: "Head to Head",
          SLALOM: "Slalom",
          DRR: "Down River",
          RX: "Rafting Cross",
        }[k] || raceCategory || "-"
      );
    },
    initials(name) {
      const words = String(name || "?").trim().split(/\s+/);
      return ((words[0] || "?").charAt(0) + (words[1] ? words[1].charAt(0) : "")).toUpperCase();
    },
    // Warna avatar stabil per nama tim (sama dgn Home.vue / All Teams).
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
    //
    // "event-results:get-all-by-event-reply" adalah channel yang dipakai
    // bersama — menembak semua eventId sekaligus secara paralel (dulu pakai
    // forEach + ipcRenderer.once per event) membuat SATU balasan pertama
    // yang tiba memicu SEMUA listener .once yang masih terdaftar sekaligus
    // (Node EventEmitter tidak membedakan listener mana milik request
    // mana), sehingga balasan utk event lain hilang begitu saja (tidak ada
    // listener tersisa) dan `pending` langsung habis dari 1 balasan itu.
    // Hasilnya: tim yang ikut lebih dari 1 event cuma dapat rekap dari
    // SATU event (siapa pun yang balasannya kebetulan tiba duluan), event
    // lainnya diam-diam kosong. Diperbaiki dgn fetch satu per satu
    // (sekuensial), sama seperti loadEventNames()/loadRawResults() di
    // bawah.
    async loadResultsForEvents() {
      const eventIds = Array.from(
        new Set(this.registrations.map((r) => r.eventId).filter(Boolean))
      );
      if (!eventIds.length) return;

      this.loadingResults = true;
      for (let i = 0; i < eventIds.length; i++) {
        const eventId = eventIds[i];
        // eslint-disable-next-line no-await-in-loop
        const res = await new Promise((resolve) => {
          ipcRenderer.send("event-results:get-all-by-event", eventId);
          ipcRenderer.once(
            "event-results:get-all-by-event-reply",
            (_e, r) => resolve(r)
          );
        });
        const items = res && res.ok && Array.isArray(res.items) ? res.items : [];
        items.forEach((doc) => {
          const key = String((doc && doc.eventId) || "");
          if (!key) return;
          if (!this.resultDocsByEventId[key]) {
            this.$set(this.resultDocsByEventId, key, []);
          }
          this.resultDocsByEventId[key].push(doc);
        });
      }
      this.loadingResults = false;
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
/* Header & kartu dasar: PageHero.vue + list-pages.css (global). */

.td-avatar {
  flex: none;
  width: 52px;
  height: 52px;
  border-radius: 15px;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
}
.td-title-flag {
  vertical-align: middle;
  margin-left: 6px;
}

.td-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 16px;
  color: #94a3b8;
}

.td-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  margin-top: 20px;
}
.td-layout .lp-card {
  margin-top: 0;
}

/* ---------- Team Records ---------- */
.td-records {
  position: sticky;
  top: calc(var(--nav-h, 64px) + 16px);
}
.td-records__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 16px;
}
.td-record {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #eef2f7;
  background: #fbfdff;
}
.td-record__top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.td-record__name {
  font-weight: 800;
  color: #0f172a;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.td-record__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ---------- Registered In ---------- */
.td-events {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.td-events__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.td-event {
  overflow: hidden;
}
.td-event__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
  border-bottom: 1px solid #eef2f7;
}
.td-event__icon {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: #e6f4fd;
  color: #1c4c7a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
}
.td-event__text {
  flex: 1;
  min-width: 0;
}
.td-event__name {
  font-weight: 800;
  font-size: 15px;
  color: #0f172a;
}
.td-open {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #d6e3f1;
  background: #fff;
  color: #1c4c7a;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.td-open:hover {
  border-color: #25b0eb;
  background: #f0f7ff;
}

.td-cat {
  padding: 14px 18px;
  border-top: 1px solid #f1f5f9;
}
.td-cat:first-of-type {
  border-top: none;
}
.td-cat__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.td-cat__bucket {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
.td-cat__bib {
  margin-left: auto;
}

.td-race {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #fff;
  background: #64748b;
}
.td-race--sprint {
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
}
.td-race--h2h {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
}
.td-race--slalom {
  background: linear-gradient(135deg, #0f766e, #2dd4bf);
}
.td-race--drr {
  background: linear-gradient(135deg, #c2410c, #fb923c);
}
.td-race--rx {
  background: linear-gradient(135deg, #be123c, #fb7185);
}

.td-result {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 160px));
  gap: 10px;
  margin-top: 12px;
}
.td-tile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e6edf6;
  background: #f8fafc;
}
.td-tile__label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
}
.td-tile__value {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.td-tile--gold {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-color: #fcd34d;
}
.td-tile--gold .td-tile__value {
  color: #b45309;
}
.td-tile--silver {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-color: #cbd5e1;
}
.td-tile--silver .td-tile__value {
  color: #475569;
}
.td-tile--bronze {
  background: linear-gradient(135deg, #fff7ed, #fed7aa);
  border-color: #fdba74;
}
.td-tile--bronze .td-tile__value {
  color: #9a3412;
}

.td-note {
  margin-top: 10px;
  font-size: 12.5px;
  color: #94a3b8;
}

.td-timing {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}
.td-run {
  padding: 10px 12px;
  border-radius: 12px;
  background: #fbfdff;
  border: 1px dashed #dbe3ee;
}
.td-run__label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 800;
  color: #1c4c7a;
}
.td-run__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px 14px;
}
.td-field {
  min-width: 0;
}
.td-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.td-value {
  font-size: 13.5px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1099.98px) {
  .td-layout {
    grid-template-columns: 1fr;
  }
  .td-records {
    position: static;
  }
}
</style>
