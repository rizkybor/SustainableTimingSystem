<template>
  <div>
    <!-- ================== SINGLE PAGE (ROUND / OVERALL) ================== -->
    <div v-if="pdfMode !== 'allround'" class="page">
      <!-- HEADER -->
      <header class="head">
        <div class="trademark">
          @STiming.System.424.Timestamp {{ timestamp }} #-
        </div>

        <div class="band">
          <div class="band-left">
            <strong>SCORE BOARD</strong>
            <span class="dot">•</span>
            <span class="cat">HEAD TO HEAD</span>
            <span class="dot">•</span>
            <span class="cat">
              {{
                eventData && eventData.levelName
                  ? eventData.levelName
                  : "Classification"
              }}
            </span>
          </div>
          <div class="band-right">
            <strong>
              {{ headToHeadCats.initial || "H2H" }} -
              {{ headToHeadCats.division || "DIV" }}
              {{ headToHeadCats.race || "RACE" }}
            </strong>
            <span class="dot">•</span>
            <span>{{ today }}</span>
          </div>
        </div>

        <!-- LOGO ATAS -->
        <div
          class="mid-image-row"
          v-if="
            eventData && eventData.eventFiles && eventData.eventFiles.length > 0
          "
        >
          <div
            v-for="(url, index) in eventData.eventFiles"
            :key="index"
            class="mid-image py-4"
          >
            <img :src="url" alt="Event Poster" />
          </div>
        </div>

        <!-- EVENT INFO -->
        <div class="event">
          <div class="event-name">
            {{ eventData && eventData.eventName ? eventData.eventName : "-" }}
          </div>
          <div class="event-meta">
            Kp/Ds.
            {{
              eventData && eventData.addressVillage
                ? eventData.addressVillage
                : "-"
            }}, Kel.
            {{
              eventData && eventData.addressDistrict
                ? eventData.addressDistrict
                : "-"
            }}, Kec.
            {{
              eventData && eventData.addressSubDistrict
                ? eventData.addressSubDistrict
                : "-"
            }}, Kota
            {{
              eventData && eventData.addressCity ? eventData.addressCity : "-"
            }},
            {{
              eventData && eventData.addressProvince
                ? eventData.addressProvince
                : "-"
            }}
            –
            {{
              eventData && eventData.addressState ? eventData.addressState : "-"
            }}
            ({{
              eventData && eventData.addressZipCode
                ? eventData.addressZipCode
                : "-"
            }}) •
            {{ eventData && eventData.riverName ? eventData.riverName : "-" }}
          </div>
        </div>
      </header>

      <!-- CONTENT -->
      <section class="table-wrap">
        <!-- MODE ROUND -->
        <div v-if="pdfMode === 'round'">
          <h3 class="sheet-title">
            {{ pdfRound && (pdfRound.bronze ? "Final B" : pdfRound.name) }} —
            Result
          </h3>

          <table class="score-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Heat</th>
                <th>Team Name</th>
                <th>BIB</th>
                <th class="pen-col">PS</th>
                <th class="pen-col">CL</th>
                <th class="pen-col">R1</th>
                <th class="pen-col">R2</th>
                <th class="pen-col">L1</th>
                <th class="pen-col">L2</th>
                <th class="pen-col">PB</th>
                <th class="pen-col">PF</th>
                <th class="pen-col">PO</th>
                <th>Penalty Time</th>
                <th>Penalty Sum</th>
                <th>Start Time</th>
                <th>Finish Time</th>
                <th>Race Time</th>
                <th>Total Time</th>
                <th>Win or Lose</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in pdfRoundRows || []" :key="r.no">
                <td class="text-center">{{ r.no }}</td>
                <td class="text-center">{{ r.heat || "" }}</td>
                <td class="text-strong">
                  {{ r.team }}
                  <CountryFlag :code="flagFor(r.team)" />
                  <span v-if="r.flag" class="flag-badge">{{ r.flag }}</span>
                </td>
                <td class="text-center">{{ r.bib }}</td>
                <td class="pen-col text-center">{{ penVal(r, "s") }}</td>
                <td class="pen-col text-center">{{ penVal(r, "cl") }}</td>
                <td class="pen-col text-center" :class="penClass(r, 'r1')">{{ penVal(r, "r1") }}</td>
                <td class="pen-col text-center" :class="penClass(r, 'r2')">{{ penVal(r, "r2") }}</td>
                <td class="pen-col text-center" :class="penClass(r, 'l1')">{{ penVal(r, "l1") }}</td>
                <td class="pen-col text-center" :class="penClass(r, 'l2')">{{ penVal(r, "l2") }}</td>
                <td class="pen-col text-center">{{ penVal(r, "pb") }}</td>
                <td class="pen-col text-center">{{ penVal(r, "f") }}</td>
                <td class="pen-col text-center">{{ penVal(r, "o") }}</td>
                <td class="mono pen-time-red">{{ r.penaltyTime }}</td>
                <td class="text-center">{{ r.penaltySum }}</td>
                <td class="mono">{{ r.start }}</td>
                <td class="mono">{{ r.finish }}</td>
                <td class="mono">{{ r.race }}</td>
                <td class="mono text-strong total-time-green">{{ r.total }}</td>
                <td class="text-center" :class="winLoseClass(r.winLose)">{{ r.winLose || "" }}</td>
              </tr>
              <tr v-if="!pdfRoundRows || pdfRoundRows.length === 0">
                <td class="empty" colspan="20">No data</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- MODE OVERALL -->
        <div v-else>
          <h3 class="sheet-title">Overall Result</h3>

          <!-- Overall Accumulation (rata tengah) -->
          <table
            v-if="
              pdfOverallPkg &&
              pdfOverallPkg.overallRows &&
              pdfOverallPkg.overallRows.length
            "
            class="score-table score-table--center"
            style="margin-bottom: 10px"
          >
            <thead>
              <tr>
                <th class="text-center">No</th>
                <th class="text-center">Team</th>
                <th class="text-center">BIB</th>
                <th class="text-center">Score</th>
                <th class="text-center">Rank</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in pdfOverallPkg.overallRows"
                :key="'ovr-' + (r.ranked || i)"
              >
                <td class="text-center">{{ i + 1 }}</td>
                <td class="text-center text-strong">
                  {{ r.name }}
                  <CountryFlag :code="flagFor(r.name)" />
                </td>
                <td class="text-center">{{ r.bib }}</td>
                <td class="text-center">{{ r.score }}</td>
                <td class="text-center">{{ r.ranked }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="sign">
        <!-- Technical Delegate / Chief Judge / Race Director — masing2 bisa
             di-on/off-kan per kategori lewat Race Settings
             (showTechnicalDelegate/showChiefJudge/showRaceDirector, default
             tampil kalau tidak diatur); nama default "—" kalau data belum
             diisi di Event Detail. -->
        <div class="sign-col" v-if="eventData && eventData.showTechnicalDelegate !== false">
          <div class="sign-title">Technical Delegate</div>
          <img
            v-if="eventData && eventData.technicalDelegateSignature && eventData.technicalDelegateSignature.secure_url"
            :src="eventData.technicalDelegateSignature.secure_url"
            class="sign-img"
            alt="Technical Delegate signature"
          />
          <div v-else class="sign-line"></div>
          <div class="sign-name">
            {{ eventData && eventData.technicalDelegate ? eventData.technicalDelegate : "—" }}
          </div>
        </div>
        <div class="sign-col" v-if="eventData && eventData.showChiefJudge !== false">
          <div class="sign-title">Chief Judge</div>
          <img
            v-if="eventData && eventData.chiefJudgeSignature && eventData.chiefJudgeSignature.secure_url"
            :src="eventData.chiefJudgeSignature.secure_url"
            class="sign-img"
            alt="Chief Judge signature"
          />
          <div v-else class="sign-line"></div>
          <div class="sign-name">
            {{ eventData && eventData.chiefJudge ? eventData.chiefJudge : "—" }}
          </div>
        </div>
        <div class="sign-col" v-if="eventData && eventData.showRaceDirector !== false">
          <div class="sign-title">Race Director</div>
          <img
            v-if="eventData && eventData.raceDirectorSignature && eventData.raceDirectorSignature.secure_url"
            :src="eventData.raceDirectorSignature.secure_url"
            class="sign-img"
            alt="Race Director signature"
          />
          <div v-else class="sign-line"></div>
          <div class="sign-name">
            {{ eventData && eventData.raceDirector ? eventData.raceDirector : "—" }}
          </div>
        </div>
        <div class="sign-col stamp-col">
          <span
            class="unofficial-stamp"
            :class="{ 'official-stamp': isOfficial }"
          >
            {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
          </span>
        </div>
      </footer>

      <!-- SPONSOR -->
      <div
        class="mid-image-sponsor-row"
        v-if="
          eventData && eventData.sponsorFiles && eventData.sponsorFiles.length > 0
        "
      >
        <div
          v-for="(url, index) in eventData.sponsorFiles"
          :key="'sponsor-' + index"
          class="mid-image-sponsor py-4"
        >
          <img :src="url" alt="Event Sponsor" />
        </div>
      </div>
    </div>

    <!-- ================== MULTI PAGE (ALLROUND) ================== -->
    <div v-else>
      <!-- HALAMAN RINGKASAN OVERALL (sebelum breakdown per babak) — dipakai
           "Download Result" di HeadToHeadResult.vue supaya PDF-nya lengkap:
           ringkasan Overall dulu, baru breakdown Penalties Group tiap babak
           (sebelumnya PDF ini cuma py mode "overall" TANPA breakdown babak
           sama sekali, jadi Penalties Group tidak pernah ikut ter-export). -->
      <div
        v-if="
          pdfOverallPkg &&
          pdfOverallPkg.overallRows &&
          pdfOverallPkg.overallRows.length
        "
        class="page page--per-round"
      >
        <header class="head">
          <div class="trademark">
            @STiming.System.424.Timestamp {{ timestamp }} #-
          </div>

          <div class="band">
            <div class="band-left">
              <strong>SCORE BOARD</strong>
              <span class="dot">•</span>
              <span class="cat">HEAD TO HEAD</span>
              <span class="dot">•</span>
              <span class="cat">
                {{
                  eventData && eventData.levelName
                    ? eventData.levelName
                    : "Classification"
                }}
              </span>
            </div>
            <div class="band-right">
              <strong>
                {{ headToHeadCats.initial || "H2H" }} -
                {{ headToHeadCats.division || "DIV" }}
                {{ headToHeadCats.race || "RACE" }}
              </strong>
              <span class="dot">•</span>
              <span>{{ today }}</span>
            </div>
          </div>

          <div
            class="mid-image-row"
            v-if="
              eventData && eventData.eventFiles && eventData.eventFiles.length > 0
            "
          >
            <div
              v-for="(url, i4) in eventData.eventFiles"
              :key="'logo-ovr-' + i4"
              class="mid-image py-4"
            >
              <img :src="url" alt="Event Poster" />
            </div>
          </div>

          <div class="event">
            <div class="event-name">
              {{ eventData && eventData.eventName ? eventData.eventName : "-" }}
            </div>
            <div class="event-meta">
              Kp/Ds.
              {{
                eventData && eventData.addressVillage
                  ? eventData.addressVillage
                  : "-"
              }}, Kel.
              {{
                eventData && eventData.addressDistrict
                  ? eventData.addressDistrict
                  : "-"
              }}, Kec.
              {{
                eventData && eventData.addressSubDistrict
                  ? eventData.addressSubDistrict
                  : "-"
              }}, Kota
              {{
                eventData && eventData.addressCity
                  ? eventData.addressCity
                  : "-"
              }},
              {{
                eventData && eventData.addressProvince
                  ? eventData.addressProvince
                  : "-"
              }}
              –
              {{
                eventData && eventData.addressState
                  ? eventData.addressState
                  : "-"
              }}
              ({{
                eventData && eventData.addressZipCode
                  ? eventData.addressZipCode
                  : "-"
              }}) •
              {{ eventData && eventData.riverName ? eventData.riverName : "-" }}
            </div>
          </div>
        </header>

        <section class="table-wrap">
          <h3 class="sheet-title">Overall Result</h3>
          <table class="score-table score-table--center" style="margin-bottom: 10px">
            <thead>
              <tr>
                <th class="text-center">No</th>
                <th class="text-center">Team</th>
                <th class="text-center">BIB</th>
                <th class="text-center">Score</th>
                <th class="text-center">Rank</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in pdfOverallPkg.overallRows"
                :key="'ovr-allround-' + (r.ranked || i)"
              >
                <td class="text-center">{{ i + 1 }}</td>
                <td class="text-center text-strong">
                  {{ r.name }}
                  <CountryFlag :code="flagFor(r.name)" />
                </td>
                <td class="text-center">{{ r.bib }}</td>
                <td class="text-center">{{ r.score }}</td>
                <td class="text-center">{{ r.ranked }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer class="sign">
          <div class="sign-col" v-if="eventData && eventData.showTechnicalDelegate !== false">
            <div class="sign-title">Technical Delegate</div>
            <img
              v-if="eventData && eventData.technicalDelegateSignature && eventData.technicalDelegateSignature.secure_url"
              :src="eventData.technicalDelegateSignature.secure_url"
              class="sign-img"
              alt="Technical Delegate signature"
            />
            <div v-else class="sign-line"></div>
            <div class="sign-name">
              {{ eventData && eventData.technicalDelegate ? eventData.technicalDelegate : "—" }}
            </div>
          </div>
          <div class="sign-col" v-if="eventData && eventData.showChiefJudge !== false">
            <div class="sign-title">Chief Judge</div>
            <img
              v-if="eventData && eventData.chiefJudgeSignature && eventData.chiefJudgeSignature.secure_url"
              :src="eventData.chiefJudgeSignature.secure_url"
              class="sign-img"
              alt="Chief Judge signature"
            />
            <div v-else class="sign-line"></div>
            <div class="sign-name">
              {{ eventData && eventData.chiefJudge ? eventData.chiefJudge : "—" }}
            </div>
          </div>
          <div class="sign-col" v-if="eventData && eventData.showRaceDirector !== false">
            <div class="sign-title">Race Director</div>
            <img
              v-if="eventData && eventData.raceDirectorSignature && eventData.raceDirectorSignature.secure_url"
              :src="eventData.raceDirectorSignature.secure_url"
              class="sign-img"
              alt="Race Director signature"
            />
            <div v-else class="sign-line"></div>
            <div class="sign-name">
              {{ eventData && eventData.raceDirector ? eventData.raceDirector : "—" }}
            </div>
          </div>
          <div class="sign-col stamp-col">
            <span
              class="unofficial-stamp"
              :class="{ 'official-stamp': isOfficial }"
            >
              {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
            </span>
          </div>
        </footer>

        <div
          class="mid-image-sponsor-row"
          v-if="
            eventData && eventData.sponsorFiles && eventData.sponsorFiles.length > 0
          "
        >
          <div
            v-for="(url, i5) in eventData.sponsorFiles"
            :key="'logo-ovr-btm-' + i5"
            class="mid-image-sponsor py-4"
          >
            <img :src="url" alt="Event Sponsor" />
          </div>
        </div>
      </div>

      <div
        v-for="(R, idx) in pdfOverallPkg && pdfOverallPkg.rounds
          ? pdfOverallPkg.rounds
          : []"
        :key="'page-round-' + idx"
        class="page page--per-round"
      >
        <!-- HEADER -->
        <header class="head">
          <div class="trademark">
            @STiming.System.424.Timestamp {{ timestamp }} #-
          </div>

          <div class="band">
            <div class="band-left">
              <strong>RACETIME RESULT</strong>
              <span class="dot">•</span>
              <span class="cat">HEAD TO HEAD</span>
              <span class="dot">•</span>
              <span class="cat">
                {{
                  eventData && eventData.levelName
                    ? eventData.levelName
                    : "Classification"
                }}
              </span>
            </div>
            <div class="band-right">
              <strong>
                {{ headToHeadCats.initial || "H2H" }} -
                {{ headToHeadCats.division || "DIV" }}
                {{ headToHeadCats.race || "RACE" }}
              </strong>
              <span class="dot">•</span>
              <span>{{ today }}</span>
            </div>
          </div>

          <!-- LOGO ATAS -->
          <div
            class="mid-image-row"
            v-if="
              eventData &&
              eventData.eventFiles &&
              eventData.eventFiles.length > 0
            "
          >
            <div
              v-for="(url, i2) in eventData.eventFiles"
              :key="'logo-top-' + i2"
              class="mid-image py-4"
            >
              <img :src="url" alt="Event Poster" />
            </div>
          </div>

          <!-- EVENT INFO -->
          <div class="event">
            <div class="event-name">
              {{ eventData && eventData.eventName ? eventData.eventName : "-" }}
            </div>
            <div class="event-meta">
              Kp/Ds.
              {{
                eventData && eventData.addressVillage
                  ? eventData.addressVillage
                  : "-"
              }}, Kel.
              {{
                eventData && eventData.addressDistrict
                  ? eventData.addressDistrict
                  : "-"
              }}, Kec.
              {{
                eventData && eventData.addressSubDistrict
                  ? eventData.addressSubDistrict
                  : "-"
              }}, Kota
              {{
                eventData && eventData.addressCity
                  ? eventData.addressCity
                  : "-"
              }},
              {{
                eventData && eventData.addressProvince
                  ? eventData.addressProvince
                  : "-"
              }}
              –
              {{
                eventData && eventData.addressState
                  ? eventData.addressState
                  : "-"
              }}
              ({{
                eventData && eventData.addressZipCode
                  ? eventData.addressZipCode
                  : "-"
              }}) •
              {{ eventData && eventData.riverName ? eventData.riverName : "-" }}
            </div>
          </div>
        </header>

        <!-- CONTENT PER ROUND -->
        <section class="table-wrap">
          <h3 class="sheet-title">{{ R.roundName }} — Result</h3>

          <table class="score-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Heat</th>
                <th>Team Name</th>
                <th>BIB</th>
                <th class="pen-col">PS</th>
                <th class="pen-col">CL</th>
                <th class="pen-col">R1</th>
                <th class="pen-col">R2</th>
                <th class="pen-col">L1</th>
                <th class="pen-col">L2</th>
                <th class="pen-col">PB</th>
                <th class="pen-col">PF</th>
                <th class="pen-col">PO</th>
                <th>Penalty Time</th>
                <th>Penalty Sum</th>
                <th>Start Time</th>
                <th>Finish Time</th>
                <th>Race Time</th>
                <th>Total Time</th>
                <th>Win or Lose</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in R.rows || []" :key="row.no">
                <td class="text-center">{{ row.no }}</td>
                <td class="text-center">{{ row.heat || "" }}</td>
                <td class="text-strong">
                  {{ row.team }}
                  <CountryFlag :code="flagFor(row.team)" />
                </td>
                <td class="text-center">{{ row.bib }}</td>
                <td class="pen-col text-center">{{ penVal(row, "s") }}</td>
                <td class="pen-col text-center">{{ penVal(row, "cl") }}</td>
                <td class="pen-col text-center" :class="penClass(row, 'r1')">{{ penVal(row, "r1") }}</td>
                <td class="pen-col text-center" :class="penClass(row, 'r2')">{{ penVal(row, "r2") }}</td>
                <td class="pen-col text-center" :class="penClass(row, 'l1')">{{ penVal(row, "l1") }}</td>
                <td class="pen-col text-center" :class="penClass(row, 'l2')">{{ penVal(row, "l2") }}</td>
                <td class="pen-col text-center">{{ penVal(row, "pb") }}</td>
                <td class="pen-col text-center">{{ penVal(row, "f") }}</td>
                <td class="pen-col text-center">{{ penVal(row, "o") }}</td>
                <td class="mono pen-time-red">{{ row.penaltyTime }}</td>
                <td class="mono">{{ row.penaltySum }}</td>
                <td class="mono">{{ row.start }}</td>
                <td class="mono">{{ row.finish }}</td>
                <td class="mono">{{ row.race }}</td>
                <td class="mono text-strong total-time-green">{{ row.total }}</td>
                <td class="text-center" :class="winLoseClass(row.winLose)">{{ row.winLose || "" }}</td>
              </tr>
              <tr v-if="!R.rows || R.rows.length === 0">
                <td class="empty" colspan="18">No data</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- FOOTER -->
        <footer class="sign">
          <div class="sign-col" v-if="eventData && eventData.showTechnicalDelegate !== false">
            <div class="sign-title">Technical Delegate</div>
            <img
              v-if="eventData && eventData.technicalDelegateSignature && eventData.technicalDelegateSignature.secure_url"
              :src="eventData.technicalDelegateSignature.secure_url"
              class="sign-img"
              alt="Technical Delegate signature"
            />
            <div v-else class="sign-line"></div>
            <div class="sign-name">
              {{
                eventData && eventData.technicalDelegate ? eventData.technicalDelegate : "—"
              }}
            </div>
          </div>
          <div class="sign-col" v-if="eventData && eventData.showChiefJudge !== false">
            <div class="sign-title">Chief Judge</div>
            <img
              v-if="eventData && eventData.chiefJudgeSignature && eventData.chiefJudgeSignature.secure_url"
              :src="eventData.chiefJudgeSignature.secure_url"
              class="sign-img"
              alt="Chief Judge signature"
            />
            <div v-else class="sign-line"></div>
            <div class="sign-name">
              {{
                eventData && eventData.chiefJudge ? eventData.chiefJudge : "—"
              }}
            </div>
          </div>
          <div class="sign-col" v-if="eventData && eventData.showRaceDirector !== false">
            <div class="sign-title">Race Director</div>
            <img
              v-if="eventData && eventData.raceDirectorSignature && eventData.raceDirectorSignature.secure_url"
              :src="eventData.raceDirectorSignature.secure_url"
              class="sign-img"
              alt="Race Director signature"
            />
            <div v-else class="sign-line"></div>
            <div class="sign-name">
              {{
                eventData && eventData.raceDirector ? eventData.raceDirector : "—"
              }}
            </div>
          </div>
          <div class="sign-col stamp-col">
            <span
              class="unofficial-stamp"
              :class="{ 'official-stamp': isOfficial }"
            >
              {{ isOfficial ? "OFFICIAL" : "UNOFFICIAL" }}
            </span>
          </div>
        </footer>

        <!-- SPONSOR -->
        <div
          class="mid-image-sponsor-row"
          v-if="
            eventData && eventData.sponsorFiles && eventData.sponsorFiles.length > 0
          "
        >
          <div
            v-for="(url, i3) in eventData.sponsorFiles"
            :key="'logo-btm-' + i3"
            class="mid-image-sponsor py-4"
          >
            <img :src="url" alt="Event Sponsor" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CountryFlag from "@/components/common/CountryFlag.vue";

export default {
  name: "HeadToHeadPdfResult",
  components: { CountryFlag },
  props: {
    data: { type: Object, default: null },
    dataEventSafe: { type: Object, default: null },
    pdfMode: { type: String, default: "round" }, // 'round' | 'allround' | 'overall'
    pdfRound: { type: Object, default: null },
    pdfRoundRows: { type: Array, default: () => [] },
    pdfOverallPkg: { type: Object, default: null },
    categories: { type: String, default: "" },
    titleCategories: { type: String, default: "" },
    isOfficial: { type: Boolean, default: false },
    headToHeadCats: { type: Object, default: () => ({}) },
    countryMap: { type: Object, default: () => ({}) },
  },
  computed: {
    eventData() {
      if (this.data) return this.data;
      if (this.dataEventSafe) return this.dataEventSafe;
      return {};
    },
    today() {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return dd + "/" + mm + "/" + yyyy;
    },
    timestamp() {
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      return dd + "/" + mm + "/" + yyyy + " " + hh + ":" + mi + ":" + ss;
    },
  },
  methods: {
    flagFor(name) {
      var key = String(name || "")
        .trim()
        .toUpperCase();
      return (this.countryMap && this.countryMap[key]) || "";
    },
    // Nilai satu kolom Penalties Group (PS/CL/R1/R2/L1/L2/PB/PF/PO) dari
    // row hasil H2H — sama seperti getTotalPenalty() di HeadToHead.vue,
    // key R1/R2/L1/L2 berisi "Y"/"N" (booyan corner), sisanya angka detik.
    // "—" kalau belum diisi sama sekali (null/undefined), biar beda dgn 0.
    penVal(row, key) {
      var p = row && row.penalties;
      if (!p || typeof p !== "object") return "—";
      var v = p[key];
      if (v === null || v === undefined || v === "") return "—";
      return String(v);
    },
    // Warna khusus utk kolom booyan corner (R1/R2/L1/L2) yg isinya "Y"/"N"
    // — hijau kalau kena (Y), merah kalau tidak (N). Selain itu (mis. "—"
    // belum diisi) dibiarkan warna default.
    penClass(row, key) {
      var v = this.penVal(row, key);
      if (v === "Y") return "pen-yes";
      if (v === "N") return "pen-no";
      return "";
    },
    // Win hijau, Lose merah — Bye/kosong dibiarkan warna default.
    winLoseClass(value) {
      if (value === "Win") return "win-text";
      if (value === "Lose") return "lose-text";
      return "";
    },
  },
};
</script>

<style scoped>
@page {
  size: A4 landscape;
  margin: 8mm;
}

* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* ===== PAGE WRAPPER ===== */
.page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(210mm - 16mm);
  padding: 5mm 8mm;
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  font-size: 12px;
  line-height: 1.35;
  color: #17202a;
}
.page--per-round {
  page-break-after: always;
}

.table-wrap {
  flex: 1 1 auto;
  min-height: 0;
}

/* ===== HEADER ===== */
.band {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgb(24, 116, 165);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  margin-bottom: 6mm;
  font-weight: 700;
}
.band .dot {
  margin: 0 4px;
  opacity: 0.9;
}
.event {
  text-align: center;
  margin-bottom: 4mm;
}
.event-name {
  font-weight: 800;
  font-size: 16px;
  color: rgb(24, 116, 165);
  margin-bottom: 3px;
}
.event-meta {
  font-size: 9.5px;
  color: rgb(24, 116, 165);
}

/* ===== SECTION TITLE ===== */
.sheet-title {
  margin: 8px 0 6px 0;
  font-size: 14px;
  font-weight: 800;
  color: #1f3b57;
}

/* ===== TABLE ===== */
.score-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #dde6ee;
  border-radius: 8px;
  overflow: hidden;
  margin-left: auto;
  margin-right: auto;
}
.score-table--center th,
.score-table--center td {
  text-align: center;
}
.score-table th,
.score-table td {
  border-bottom: 1px solid #f1f4f8;
  padding: 6px 8px;
}
.score-table thead th {
  background: rgb(240, 250, 255);
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 800;
  text-align: start;
}
.score-table tbody td {
  font-size: 12px;
}
/* Kolom Penalties Group (PS/CL/R1/R2/L1/L2/PB/PF/PO) — font & padding
   lebih kecil drpd kolom lain krn isinya cuma 1 huruf/angka pendek,
   supaya tabel tidak melebar berlebihan walau ditambah 9 kolom baru. */
.score-table th.pen-col,
.score-table td.pen-col {
  padding: 6px 4px;
  text-align: center;
  font-size: 9px;
}
.score-table th.pen-col {
  font-size: 9px;
}
/* Booyan corner (R1/R2/L1/L2) — hijau kalau kena (Y), merah kalau tidak
   (N), supaya langsung kebaca sekilas tanpa perlu baca teksnya. */
.score-table td.pen-yes {
  color: #148a3b;
  font-weight: 800;
}
.score-table td.pen-no {
  color: #d9534f;
  font-weight: 800;
}
/* Penalty Time (waktu tambahan krn penalti) merah, Total Time (hasil
   akhir stlh ditambah penalti) hijau — biar langsung kebaca dampaknya. */
.score-table td.pen-time-red {
  color: #d9534f;
}
.score-table td.total-time-green {
  color: #148a3b;
}
/* Win or Lose — Win hijau, Lose merah, biar langsung kebaca hasilnya. */
.score-table td.win-text {
  color: #148a3b;
  font-weight: 800;
}
.score-table td.lose-text {
  color: #d9534f;
  font-weight: 800;
}
.score-table tbody tr:nth-child(odd) {
  background: #fafcff;
}
.text-center {
  text-align: center;
}
.text-strong {
  font-weight: 700;
}
.mono {
  font-family: monospace;
}
.empty {
  text-align: center;
  color: #999;
  padding: 10px 0;
}
.flag-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid #ddd;
  margin-left: 6px;
  font-size: 11px;
}

/* ===== FOOTER ===== */
.sign {
  display: flex;
  justify-content: space-between;
  margin-top: 8mm;
  margin-bottom: 2mm;
  text-align: center;
  gap: 8mm;
}
.sign-col {
  /* dulu width:30% tetap (pas cuma 2 kolom: Chief Judge + stamp) — sekarang
     Technical Delegate & Race Director bisa ikut tampil (on/off lewat Race
     Settings), jadi jumlah kolom yg kebentuk bisa 2-4. flex:1 supaya
     lebarnya selalu menyesuaikan berapa pun yg sedang tampil, drpd overflow
     saat 4 kolom @30% (120%) sekaligus muncul. */
  flex: 1;
  min-width: 0;
}
.sign-title {
  color: #8a95a3;
  font-size: 9px;
  margin-bottom: 5vh;
}
.sign-line {
  height: 2px;
  background: rgb(24, 116, 165);
  width: 75%;
  margin: 20px auto 6px;
  border-radius: 2px;
}
.sign-img {
  height: 50px;
  max-width: 75%;
  object-fit: contain;
  margin: 10px auto 6px;
  display: block;
}
.sign-name {
  font-weight: 800;
  font-size: 12px;
  color: #1f2937;
}

/* ===== STAMP ===== */
.unofficial-stamp {
  color: #d9534f;
  font-weight: bold;
  text-transform: uppercase;
  border: 2px solid #d9534f;
  padding: 5px 12px;
  border-radius: 5px;
  transform: rotate(5deg);
  opacity: 0.9;
  font-size: 1rem;
  display: inline-block;
  letter-spacing: 0.8px;
}
.official-stamp {
  color: #148a3b;
  border-color: #148a3b;
  transform: rotate(0deg);
  opacity: 1;
  box-shadow: 0 0 0 2px rgba(20, 138, 59, 0.12) inset;
}

/* ===== LOGOS ===== */
.mid-image-row,
.mid-image-sponsor-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  gap: 2mm;
}
.mid-image img {
  /* BUG FIX: dulu width+height sama2 di-fix (80x80, kotak) — html2canvas
     (dipakai vue-html2pdf) tidak selalu menghormati object-fit:contain,
     jadi logo non-persegi ke-stretch paksa jadi kotak (gepeng). Samakan
     dgn sprint-pdfResult.vue: cuma height yg di-fix, width auto ikut
     rasio asli gambar — proporsional apapun bentuk logonya.
  */
  height: 70px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}
.mid-image-sponsor img {
  height: 35px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

/* ===== AVOID BREAKS ===== */
header,
.band,
.mid-image-row,
.mid-image-sponsor-row,
.sign {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* ===== Trademark ===== */
.trademark {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(-9mm, 2mm);
  font-family: monospace;
  font-size: 8px;
  color: #8b8b8b;
  opacity: 0.7;
  letter-spacing: 0.5px;
}
</style>
