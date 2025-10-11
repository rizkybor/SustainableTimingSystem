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
      ><span class="modal-title-text">Print Result</span></template
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

      <!-- TAB -->
      <!-- <div class="overall-tabs">
        <b-button size="sm" variant="primary" class="active"
          >Rank Overall</b-button
        >
      </div> -->

      <!-- TABLE -->
      <div class="table-card">
        <div class="table-title">Rank Result Overall</div>
        <div class="table-responsive">
          <table class="table table-ranking">
            <thead>
              <tr>
                <th rowspan="2" class="sticky-col small w-60">No</th>
                <th rowspan="2" class="sticky-col-left">Team Name</th>
                <th rowspan="2" class="w-70 text-center">BIB</th>

                <th colspan="2" class="group sprint text-center">Sprint</th>
                <th colspan="2" class="group h2h text-center">H2H</th>
                <th colspan="2" class="group slalom text-center">Slalom</th>
                <th colspan="2" class="group drr text-center">DRR</th>

                <th rowspan="2" class="w-110 text-center">Total Score</th>
                <th rowspan="2" class="w-110 text-center">Rank Overall</th>
              </tr>
              <tr>
                <!-- subhead for each group -->
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
              <tr v-for="r in aggregate.rows" :key="r.no">
                <td class="text-center">{{ r.no }}</td>
                <td>{{ r.teamName }}</td>
                <td class="text-center">{{ r.bib }}</td>

                <!-- Sprint -->
                <td class="text-center">{{ r.sprintScore }}</td>
                <td class="text-center">{{ r.sprintRank }}</td>
                <!-- H2H -->
                <td class="text-center">{{ r.h2hScore }}</td>
                <td class="text-center">{{ r.h2hRank }}</td>
                <!-- Slalom -->
                <td class="text-center">{{ r.slalomScore }}</td>
                <td class="text-center">{{ r.slalomRank }}</td>
                <!-- DRR -->
                <td class="text-center">{{ r.drrScore }}</td>
                <td class="text-center">{{ r.drrRank }}</td>

                <td class="text-center font-weight-bold">{{ r.totalScore }}</td>
                <td class="text-center font-weight-bold">{{ r.no }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="overall-footer">
      </div>

      <div class="btn-row">
        <b-button variant="outline-danger" @click="$emit('close')"
          >Cancel</b-button
        >
        <div>
          <b-button variant="outline-primary" class="mr-2"
            >Download Result</b-button
          >
          <!-- <b-button variant="primary">Print Result</b-button> -->
        </div>
      </div>
    </div>
  </b-modal>
</template>

<script>
export default {
  name: "PrintOverallModal",
  props: {
    show: { type: Boolean, default: false },
    centered: { type: Boolean, default: false },
    dataEvent: { type: Object, default: true },
    aggregate: {
      type: Object,
      default: () => ({
        header: { title: "", subTitle: "", dateStr: "", chiefJudge: "" },
        rows: [],
      }),
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
  border-radius: 20px !important; /* sudut lembut */
  overflow: hidden; /* pastikan isi tidak keluar dari radius */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); /* sedikit bayangan agar elegan */
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

/* tabs */
.overall-tabs {
  display: flex;
  justify-content: flex-start;
  margin: 12px 0 16px;
}
.overall-tabs .btn {
  border-radius: 8px;
  font-weight: 700;
  padding: 4px 12px;
}
.overall-tabs .btn.active {
  background: #0069d9;
  border-color: #0069d9;
  color: #fff;
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
.status-dropdown ::v-deep .btn {
  border-radius: 8px;
  font-weight: 700;
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
</style>
