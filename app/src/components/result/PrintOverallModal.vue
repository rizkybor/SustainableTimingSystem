<template>
  <b-modal
    :visible="show"
    size="xl"
    hide-footer
    body-class="p-0"
    :centered="centered"
    @hide="$emit('close')"
  >
    <template #modal-title
      ><span class="modal-title-text">Print Result Overall </span></template
    >

    <div class="overall-wrap">
      <!-- HEADER -->
      <div class="overall-header text-center mb-3 py-5">
        <h2 class="overall-title">{{ dataEvent.eventName }}</h2>

        <div class="overall-subtitle">
          Kp/Ds.
          {{
            dataEvent && dataEvent.addressVillage
              ? dataEvent.addressVillage
              : "-"
          }}, Kel.
          {{
            dataEvent && dataEvent.addressDistrict
              ? dataEvent.addressDistrict
              : "-"
          }}, Kec.
          {{
            dataEvent && dataEvent.addressSubDistrict
              ? dataEvent.addressSubDistrict
              : "-"
          }}, Kota
          {{
            dataEvent && dataEvent.addressCity ? dataEvent.addressCity : "-"
          }},
          {{
            dataEvent && dataEvent.addressProvince
              ? dataEvent.addressProvince
              : "-"
          }}
          –
          {{
            dataEvent && dataEvent.addressState ? dataEvent.addressState : "-"
          }}
          ({{
            dataEvent && dataEvent.addressZipCode
              ? dataEvent.addressZipCode
              : "-"
          }}) •
          {{ dataEvent && dataEvent.riverName ? dataEvent.riverName : "-" }}
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-card">
        <div class="table-title">
          RANK RESULT OVERALL <span class="dot">•</span>
          {{ raceCats.initial }} <span class="dot">•</span>
          {{ raceCats.division }} <span class="dot">•</span>
          {{ raceCats.race }}
        </div>
        <div class="table-responsive table-ranking-wrapper">
          <table class="table table-ranking">
            <thead>
              <tr>
                <th rowspan="2" class="sticky-col small w-60">No</th>
                <th rowspan="2" class="sticky-col-left" style="width: 210px">
                  Team Name
                </th>
                <th rowspan="2" class="w-70 text-center">BIB</th>

                <th colspan="2" class="group sprint text-center">Sprint</th>
                <th colspan="2" class="group h2h text-center">H2H</th>
                <th colspan="2" class="group slalom text-center">Slalom</th>
                <th colspan="2" class="group drr text-center">DRR</th>

                <th rowspan="2" class="w-110 text-center">Total Score</th>
                <th rowspan="2" class="w-110 text-center">Rank Overall</th>
              </tr>
              <tr>
                <th class="sub">Score</th>
                <th class="sub">Ranked</th>
                <th class="sub">Score</th>
                <th class="sub">Ranked</th>
                <th class="sub">Score</th>
                <th class="sub">Ranked</th>
                <th class="sub">Score</th>
                <th class="sub">Ranked</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in processedRows" :key="r.rank">
                <td class="text-center">{{ r.rank }}</td>
                <td>{{ r.teamName }}</td>
                <td class="text-center">{{ r.bib }}</td>

                <td class="text-center">{{ r.sprintScore }}</td>
                <td class="text-center">{{ r.sprintRank }}</td>
                <td class="text-center">{{ r.h2hScore }}</td>
                <td class="text-center">{{ r.h2hRank }}</td>
                <td class="text-center">{{ r.slalomScore }}</td>
                <td class="text-center">{{ r.slalomRank }}</td>
                <td class="text-center">{{ r.drrScore }}</td>
                <td class="text-center">{{ r.drrRank }}</td>

                <td class="text-center font-weight-bold">{{ r.totalScore }}</td>
                <td class="text-center font-weight-bold">{{ r.rank }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="overall-footer"></div>

      <div class="btn-row">
        <b-button variant="outline-danger" @click="$emit('close')"
          >Cancel</b-button
        >
        <div>
          <b-button
            variant="outline-primary"
            class="mr-2"
            @click="generatePdfOverall"
          >
            Download Result
          </b-button>
        </div>
      </div>
    </div>

    <!-- ===== Komponen PDF (hidden) ===== -->
    <vue-html2pdf
      v-if="showPdf"
      ref="overallPdfRef"
      class="pdf-sr-only"
      :show-layout="false"
      :float-layout="false"
      :enable-download="true"
      :preview-modal="false"
      :paginate-elements-by-height="1400"
      :pdf-quality="2"
      :filename="pdfFilenameOverall"
      pdf-format="a4"
      pdf-orientation="landscape"
      pdf-content-width="100%"
      aria-hidden="true"
      @pdfGenerated="onPdfGenerated"
    >
      <section slot="pdf-content">
        <OverallPdf
          :dataEvent="dataEvent"
          :rows="processedRows"
          :raceCats="raceCats"
          :isOfficial="isOfficial"
        />
      </section>
    </vue-html2pdf>
  </b-modal>
</template>

<script>
import VueHtml2pdf from "vue-html2pdf";
import OverallPdf from "../../views/DetailEvent/ResultComponent/Overall/by-alltime.vue";

export default {
  name: "PrintOverallModal",
  components: {
    VueHtml2pdf,
    OverallPdf,
  },
  data() {
    return {
      showPdf: false,
    };
  },
  props: {
    show: { type: Boolean, default: false },
    centered: { type: Boolean, default: false },
    dataEvent: { type: Object },
    aggregate: {
      type: Object,
      default: () => ({
        header: { title: "", subTitle: "", dateStr: "", chiefJudge: "" },
        rows: [],
      }),
    },
    raceCats: { type: Object, required: false },
    isOfficial: { type: Boolean, default: false },
  },
  computed: {
    pdfFilenameOverall() {
      const ev = this.dataEvent || {};
      const title = ev.eventName ? String(ev.eventName).trim() : "Overall";

      const sc = this.raceCats || {};
      const cats =
        (sc.initial || "-") +
        " - " +
        (sc.division || "-") +
        " " +
        (sc.race || "-");

      return title + " - OVERALL (" + cats + ")";
    },
    processedRows() {
      var toNum = function (v) {
        var n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      var ag =
        this.aggregate && typeof this.aggregate === "object"
          ? this.aggregate
          : { rows: [] };

      var src = Array.isArray(ag.rows) ? ag.rows.slice() : [];

      var withTotals = src.map(function (r) {
        var sprint = toNum(r.sprintScore);
        var h2h = toNum(r.h2hScore);
        var slalom = toNum(r.slalomScore);
        var drr = toNum(r.drrScore);
        var total = sprint + h2h + slalom + drr;

        return Object.assign({}, r, {
          sprintScore: sprint,
          h2hScore: h2h,
          slalomScore: slalom,
          drrScore: drr,
          totalScore: total,
        });
      });

      withTotals.sort(function (a, b) {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;

        var aBestRank = Math.min(
          Number(a.sprintRank) || Infinity,
          Number(a.h2hRank) || Infinity,
          Number(a.slalomRank) || Infinity,
          Number(a.drrRank) || Infinity
        );
        var bBestRank = Math.min(
          Number(b.sprintRank) || Infinity,
          Number(b.h2hRank) || Infinity,
          Number(b.slalomRank) || Infinity,
          Number(b.drrRank) || Infinity
        );
        if (aBestRank !== bBestRank) return aBestRank - bBestRank;

        var an = String(a.teamName || "");
        var bn = String(b.teamName || "");
        return an.localeCompare(bn);
      });

      for (var i = 0; i < withTotals.length; i++) {
        withTotals[i].rank = i + 1;
      }

      return withTotals;
    },
  },
  methods: {
    async generatePdfOverall() {
      try {
        this.showPdf = true;
        await this.$nextTick();
        const inst = this.$refs.overallPdfRef;
        if (!inst) return;
        await new Promise(function (r) {
          setTimeout(r, 150);
        });
        await inst.generatePdf();
      } catch (e) {
        this.error = "Gagal membuat PDF";
      }
    },
    onPdfGenerated() {
      this.showPdf = false;
    },
  },
};
</script>

<style scoped>
/* Pastikan tidak ada margin yang “menarik” modal ke atas */
.overall-wrap {
  padding: 24px;
  background: #fff;
}

/* Membuat modal memiliki sudut membulat */
::v-deep(.modal-content) {
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Hilangkan margin vertikal agar tetap center sempurna */
::v-deep(.modal-dialog-centered) {
  margin: 0 auto !important;
  display: flex;
  align-items: center;
  min-height: 100vh;
}

/* header */
.overall-title {
  font-weight: 800;
  color: #000;
  font-size: 1.8rem;
}
.overall-subtitle {
  color: #555;
  font-weight: 600;
  font-size: 0.95rem;
}
.overall-date {
  text-align: right;
  font-size: 0.9rem;
  font-weight: 700;
  color: #000;
  margin-top: 6px;
}

/* table */
.table-card {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 24px;
}
.table-title {
  padding: 10px 16px;
  font-weight: 800;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.table-ranking {
  width: 100%;
  border-collapse: collapse;
}
.table-ranking thead th {
  border: 1px solid #ddd;
  padding: 10px 8px;
  background: #f9fafb;
  vertical-align: middle;
  font-weight: 800;
  font-size: 14px;
}

.table-ranking thead th.group {
  font-size: 15px;
}
.table-ranking thead th.group.sprint {
  background: #d9e8ff;
}
.table-ranking thead th.group.h2h {
  background: #ffe0c7;
}
.table-ranking thead th.group.slalom {
  background: #fff2b8;
}
.table-ranking thead th.group.drr {
  background: #ccf7d9;
}

.table-ranking thead th.sub {
  background: #ffffff;
  font-weight: 700;
}
.table-ranking tbody td {
  border: 1px solid #eee;
  padding: 10px;
  font-weight: 600;
}
.table-ranking tbody tr:nth-child(even) {
  background: #f9f9f9;
}

/* widths */
.w-60 {
  width: 60px;
}
.w-70 {
  width: 70px;
}
.w-110 {
  width: 110px;
}

/* footer */
.overall-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: 10px 0 32px;
}
.overall-footer .label {
  font-weight: 600;
  margin-bottom: 40px;
}
.overall-footer .signature {
  font-weight: 800;
  font-size: 1rem;
}

/* bottom buttons */
.btn-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn-row .btn {
  border-radius: 8px;
  font-weight: 700;
  padding: 6px 14px;
}

/* --- Batasi tampilan maksimal 10 baris tanpa ubah lebar kolom --- */
.table-card {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 24px;
}

/* Scroll hanya di isi tabel */
.table-ranking-wrapper {
  position: relative;
  max-height: 440px;
  overflow-y: auto;
}

/* header sticky */
.table-ranking thead th {
  position: sticky;
  z-index: 3;
  background: #f9fafb;
}

/* baris header 1 (Sprint/H2H/Slalom/DRR) nempel di atas */
.table-ranking thead tr:first-child th {
  top: 0;
  z-index: 4;
}

/* baris header 2 (Score/Ranked) nempel di bawah baris 1 */
.table-ranking {
  --hHead1: 44px;
}
.table-ranking thead tr:nth-child(2) th {
  top: var(--hHead1);
}

/* Benar-benar sembunyikan komponen PDF dari tampilan & interaksi */
.pdf-sr-only {
  position: absolute !important;
  left: -99999px !important;
  top: -99999px !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
  opacity: 0 !important;
}

/* Jangan ikut tercetak saat user print halaman */
@media print {
  .pdf-sr-only {
    display: none !important;
  }
}
</style>
