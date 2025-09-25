<template>
  <div class="px-5 mb-4">
    <div class="card p-4" style="background-color:#4A4A4A; border-radius:20px">
      <div>
        <b-row>
          <!-- LEFT: Live Feed -->
          <b-col class="col-3">
            <div class="card-time" style="height:auto; min-height:500px; border:1px solid #e6ebf4;">
              <table class="table table-sm table-rounded">
                <thead style="background-color:white; color:#4A4A4A; padding: 10px;" >
                  <tr>
                    <th scope="col" style="padding: 15px;">Id Registrasi</th>
                    <th scope="col" style="padding: 15px;">Racetime</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(id, index) in digitId" :key="'feed-'+index">
                    <td style="color:black">{{ id }}</td>
                    <td style="color:black">{{ digitTime[index] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </b-col>

          <!-- RIGHT: Start / Finish Buffer & Buttons -->
          <b-col class="col">
            <!-- START -->
            <div class="card" style="border-radius:15px">
              <div class="card-body">
                <b-row>
                  <b-col class="col">
                    <h5 class="card-title" style="font-weight:800">Buffer-Timer-Start</h5>
                    <b-row>
                      <b-col class="col">
                        <p>Get Time Start</p>
                        <div class="input-group mb-3">
                          <input
                            :value="digitTimeStart"
                            @input="$emit('update:digitTimeStart', $event.target.value)"
                            type="text"
                            class="form-control"
                            placeholder="Timer"
                            aria-label="Timer"
                            aria-describedby="basic-addon1"
                          />
                        </div>
                      </b-col>
                    </b-row>
                  </b-col>

                  <b-col class="col-4">
                    <button
                      v-for="(button, index) in participant"
                      :key="'start-'+index"
                      id="btnStart"
                      type="button"
                      class="btn custom-btn"
                      :disabled="hasStartTime(button)"
                      :class="hasStartTime(button) ? 'btn-secondary' : 'btn-info'"
                      @click="$emit('update-time', digitTimeStart, index, 'start')"
                    >
                      {{ 'BIB ' + getBib(button) }}
                    </button>
                  </b-col>
                </b-row>
              </div>
            </div>

            <br />

            <!-- FINISH -->
            <div class="card" style="border-radius:15px">
              <div class="card-body">
                <b-row>
                  <b-col class="col">
                    <h5 class="card-title" style="font-weight:800">Buffer-Timer-Finish</h5>
                    <b-row>
                      <b-col class="col">
                        <p>Get Time Finish</p>
                        <div class="input-group mb-3">
                          <input
                            :value="digitTimeFinish"
                            @input="$emit('update:digitTimeFinish', $event.target.value)"
                            type="text"
                            class="form-control"
                            placeholder="Timer"
                            aria-label="Timer"
                            aria-describedby="basic-addon1"
                          />
                        </div>
                      </b-col>
                    </b-row>
                  </b-col>

                  <b-col class="col-4">
                    <button
                      v-for="(button, index) in participant"
                      :key="'finish-'+index"
                      id="btnFinish"
                      type="button"
                      class="btn custom-btn"
                      :disabled="hasFinishTime(button)"
                      :class="hasFinishTime(button) ? 'btn-secondary' : 'btn-info'"
                      @click="$emit('update-time', digitTimeFinish, index, 'finish')"
                    >
                      {{ 'BIB ' + getBib(button) }}
                    </button>
                  </b-col>
                </b-row>
              </div>
            </div>
          </b-col>
        </b-row>

        <br /><br />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OperationTimePanel',
  props: {
    digitId: { type: Array, default: () => [] },
    digitTime: { type: Array, default: () => [] },
    participant: { type: Array, default: () => [] },
    digitTimeStart: { type: String, default: '' },
    digitTimeFinish: { type: String, default: '' },
  },
  methods: {
    hasStartTime(btn) {
      return btn && btn.result && !!btn.result.startTime;
    },
    hasFinishTime(btn) {
      return btn && btn.result && !!btn.result.finishTime;
    },
    getBib(btn) {
      return btn && typeof btn.bibTeam !== 'undefined' ? btn.bibTeam : '-';
    },
  },
};
</script>

<style scoped>
.card-time { border-radius: 20px; }
.custom-btn { margin: 5px; width: 120px; }
.table-rounded {
  border-collapse: separate;   /* penting untuk radius */
  border-spacing: 0;           /* biar rapat seperti collapse */
}

.table-rounded thead th {
  background-color: #fff;
  color: #4A4A4A;
}

/* sudut kiri & kanan atas */
.table-rounded thead th:first-child {
  border-top-left-radius: 18px;
}
.table-rounded thead th:last-child {
  border-top-right-radius: 18px;
}

/* opsional: hilangkan garis */
.table-rounded th,
.table-rounded td {
  border: none;
}
</style>