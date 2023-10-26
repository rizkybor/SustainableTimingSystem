<template>
  <div>
    <div style="display: flex; justify-content: space-between">
      <b-button @click="goTo()" variant="primary">
        <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back</b-button
      >
      <b-button @click="goTo()" variant="primary">
        New Category
        <Icon icon="ic:baseline-add-circle-outline" />
      </b-button>
    </div>
    <br />

    <div class="card new" :class="{ 'v-shadow-on-scroll': isScrolled }">
      <div class="card-body">
        <b-row>
          <b-col>
            <h5 style="font-weight: 800; font-style: italic">
              Kejuaraan Arung Jeram 2024
            </h5>
            <p style="font-style: italic">
              Tigaraksa, 01-January-2024 - 10-January-2024
            </p>
          </b-col>
          <b-col>
            <div
              style="
                display: flex;
                gap: 10px;
                justify-content: flex-end !important;
              "
            >
              <button type="button" class="btn btn-warning">
                <Icon icon="ic:baseline-sync" />

                Connect Device
              </button>
              <button type="button" class="btn btn-info">
                <Icon icon="ic:outline-local-printshop" />
                Print Result
              </button>

              <button type="button" class="btn btn-danger">
                <Icon icon="ic:outline-delete-sweep" />
                Reset
              </button>
            </div>
          </b-col>
        </b-row>
      </div>
    </div>

    <br />

    <!-- SPRINT OPERATION TIME  -->

    <div class="card" style="background-color: dodgerblue">
      <div class="card-body">
        <b-row>
          <b-col class="col-3">
            <div
              class="card"
              style="
                padding: 10px;
                height: auto;
                min-height: 500px;
                background-color: rgb(32, 32, 32);
              "
            >
              <table class="table table-dark table-sm">
                <thead>
                  <tr>
                    <th scope="col">Id Registrasi</th>
                    <th scope="col">Racetime</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in getItems" :key="index">
                    <td>{{ item.idReg }}</td>
                    <td>{{ waktuSaatIni }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </b-col>

          <b-col class="col">
            <div class="card">
              <div class="card-body">
                <b-row>
                  <b-col class="col">
                    <h5 class="card-title">Buffer-Timer-Start</h5>
                    <b-row>
                      <!-- <b-col class="col-2">
                          <p>Start</p>
                          <div class="input-group mb-3">
                            <input
                              type="text"
                              class="form-control"
                              placeholder="Username"
                              aria-label="Username"
                              aria-describedby="basic-addon1"
                            />
                          </div>
                        </b-col> -->
                      <b-col class="col">
                        <p>Get Time Start</p>
                        <div class="input-group mb-3">
                          <input
                            v-model="hasilKonversi"
                            type="text"
                            class="form-control"
                            placeholder="Timer"
                            aria-label="Timer"
                            aria-describedby="basic-addon1"
                          />
                        </div>
                        <!-- <button type="button" class="btn btn-primary">
                            Validate Start Time
                          </button> -->
                      </b-col>
                    </b-row>
                  </b-col>
                  <b-col class="col-4">
                    <button
                      v-for="(button, index) in buttons"
                      :key="index"
                      type="button"
                      class="btn custom-btn"
                      :class="button.class"
                    >
                      {{ button.label }}
                    </button>
                  </b-col>
                </b-row>
              </div>
            </div>

            <br />

            <div class="card">
              <div class="card-body">
                <b-row>
                  <b-col class="col">
                    <h5 class="card-title">Buffer-Timer-Finish</h5>
                    <b-row>
                      <!-- <b-col class="col-2">
                          <p>Finish</p>
                          <div class="input-group mb-3">
                            <input
                              type="text"
                              class="form-control"
                              placeholder="Username"
                              aria-label="Username"
                              aria-describedby="basic-addon1"
                            />
                          </div>
                        </b-col> -->
                      <b-col class="col">
                        <p>Get Time Finish</p>
                        <div class="input-group mb-3">
                          <input
                            v-model="hasilKonversi"
                            type="text"
                            class="form-control"
                            placeholder="Timer"
                            aria-label="Timer"
                            aria-describedby="basic-addon1"
                          />
                        </div>
                        <!-- <button type="button" class="btn btn-success">
                            Validate Time Finish
                          </button> -->
                      </b-col>
                    </b-row>
                  </b-col>
                  <b-col class="col-4">
                    <button
                      v-for="(button, index) in buttons"
                      :key="index"
                      type="button"
                      class="btn custom-btn"
                      :class="button.class"
                    >
                      {{ button.label }}
                    </button>
                  </b-col>
                </b-row>
              </div>
            </div>
          </b-col>
        </b-row>
        <br />
        <br />

        <!-- Team 1  -->
        <b-row>
          <b-col class="col">
            <div class="card">
              <div class="card-body">
                <div>
                  <b-row>
                    <b-col class="col-12">
                      <div class="table-responsive">
                        <table class="table table-bordered">
                          <thead>
                            <tr>
                              <th scope="col">Team Name</th>
                              <th scope="col">BIB Number</th>
                              <th scope="col">Session</th>
                              <th scope="col">Total Penalty</th>

                              <th
                                scope="col"
                                v-for="(penalty, index) in 14"
                                :key="index"
                              >
                                {{ index + 1 }}
                              </th>

                              <th scope="col">Penalty Time</th>
                              <th scope="col">Start Time</th>
                              <th scope="col">Finish Time</th>
                              <th scope="col">Race Time</th>
                              <th scope="col">Total Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(team, teamIndex) in data"
                              :key="team.id"
                            >
                              <td>{{ team.nameTeam }}</td>
                              <td>{{ team.bibNumber }}</td>
                              <td>
                                <select>
                                  <option
                                    v-for="(
                                      session, sessionIndex
                                    ) in team.sessions"
                                    :key="session.id"
                                  >
                                    {{ sessionIndex + 1 }}
                                  </option>
                                </select>
                              </td>
                              <td>{{ team.sessions[0].totalPenalty }}</td>
                              <td
                                v-for="(penalty, index) in team.sessions[0]
                                  .penalties"
                                :key="index"
                              >
                                {{ penalty }}
                              </td>
                       <!-- <td style="color:red">{{ team.session }}</td>  -->

                              <td>{{ team.sessions[0].penaltyTime }}</td>
                              <td>{{ team.sessions[0].startTime }}</td>
                              <td>{{ team.sessions[0].finishTime }}</td>
                              <td>{{ team.sessions[0].raceTime }}</td>
                              <td>{{ team.sessions[0].totalTime }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </b-col>
                  </b-row>
                </div>
              </div>
            </div>
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SustainableTimingSystemSprintRace",

  data() {
    return {
      isScrolled: false,
      data: [
        {
          id: 0,
          nameTeam: "Makopala Universitas Budi Luhur",
          bibNumber: "001",
          sessions: [
            {
              id: 0,
              penalties: [5, 0, 0, 50, 5, 0, 0, 5, 0, 0, 0, 0, 0, 0],
              totalPenalty: 8,
              penaltyTime: "00:05:00",
              startTime: "09:00:00",
              finishTime: "09:30:00",
              raceTime: "00:30:00",
              totalTime: "00:35:00",
            },
            {
              id: 1,
              penalties: [0, 0, 0, 0, 5, 0, 0, 50, 0, 0, 0, 50, 0, 0],
              totalPenalty: 8,
              penaltyTime: "00:05:00",
              startTime: "09:00:00",
              finishTime: "09:30:00",
              raceTime: "00:30:00",
              totalTime: "00:35:00",
            },
          ],
        },
        {
          id: 1,
          nameTeam: "Swatala Mercu Buana",
          bibNumber: "002",
          sessions: [
            {
              id: 0,
              penalties: [0, 50, 0, 50, 5, 0, 0, 5, 0, 0, 0, 0, 0, 0],
              totalPenalty: 8,
              penaltyTime: "00:05:00",
              startTime: "09:00:00",
              finishTime: "09:30:00",
              raceTime: "00:30:00",
              totalTime: "00:35:00",
            },
            {
              id: 1,
              penalties: [0, 0, 0, 0, 5, 0, 0, 50, 0, 0, 0, 50, 0, 0],
              totalPenalty: 8,
              penaltyTime: "00:05:00",
              startTime: "09:00:00",
              finishTime: "09:30:00",
              raceTime: "00:30:00",
              totalTime: "00:35:00",
            },
          ],
        },
      ],
      selectedSession: 0,
      sessionOptions: [],

      getItems: [{ time: "00:00:35.680", idReg: "000500070010000000M" }],
      buttons: [
        { label: "Team 1", class: "btn-dark" },
        { label: "Team 2", class: "btn-secondary" },
        { label: "Team 3", class: "btn-secondary" },
        { label: "Team 4", class: "btn-dark" },
        { label: "Team 5", class: "btn-dark" },
        { label: "Team 6", class: "btn-secondary" },
        { label: "Team 7", class: "btn-secondary" },
        { label: "Team 8", class: "btn-dark" },
      ],
      currentTime: "",
      waktuSaatIni: "000000000",
      hasilKonversi: "",
    };
  },
  watch: {
    waktuSaatIni(newVal) {
      this.hasilKonversi = this.konversiFormatWaktu(newVal);
    },
  },

  computed: {
    currentSession() {
      return this.data.sesion.find(
        (session) => session.id === this.selectedSession
      );
    },
  },

  mounted() {
    window.addEventListener("scroll", this.handleScroll);

    setInterval(this.updateClock, 1000);

    // Panggil fungsi updateClock sekali pada awalnya untuk menginisialisasi waktu
    this.updateClock();
    this.hasilKonversi = this.konversiFormatWaktu(this.waktuSaatIni);

    
    this.sessionOptions = this.data.sesion.map((session) => ({
      value: session.id,
      text: `Session ${session.id}`,
    }));
  },
  destroyed() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    konversiFormatWaktu(waktu) {
      const milidetik = waktu % 1000;
      waktu = Math.floor(waktu / 1000); // Menghapus milidetik dari waktu

      const detik = waktu % 60;
      waktu = Math.floor(waktu / 60); // Menghapus detik dari waktu

      const menit = waktu % 60;
      const jam = Math.floor(waktu / 60);

      const formatJam = String(jam).padStart(2, "0");
      const formatMenit = String(menit).padStart(2, "0");
      const formatDetik = String(detik).padStart(2, "0");
      const formatMilidetik = String(milidetik).padStart(3, "0");

      return `${formatJam}:${formatMenit}:${formatDetik}.${formatMilidetik}`;
    },
    updateClock() {
      const now = new Date();
      const totalSeconds = now.getSeconds(); // Batasi waktu hingga detik
      this.waktuSaatIni = String(
        totalSeconds * 1000 + now.getMilliseconds()
      ).padStart(9, "0");
    },

    goTo() {
      this.$router.push("/");
    },
    handleScroll() {
      if (window.scrollY > 0) {
        this.isScrolled = true;
      } else {
        this.isScrolled = false;
      }
    },
  },
};
</script>

<style scoped>
/* Tabel Team Information */
.table-info th {
  background-color: dodgerblue;
  color: white;
}

/* Tabel Team 1 */
.table-team th {
  background-color: #007bff;
  color: white;
}

/* Tombol di dalam tabel */
.custom-btn {
  margin: 5px;
  width: 120px;
}

/* Tabel di dalam buffer-timer-start */
.table-start {
  background-color: #202020;
  color: white;
}

/* Tabel di dalam buffer-timer-finish */
.table-finish {
  background-color: #202020;
  color: white;
}

/* Tabel pada tabel Sprint Operation Time */
.table-sprint th {
  background-color: #343a40;
  color: white;
}

/* Tabel pada tabel Sprint Operation Time */
.table-sprint td {
  color: white;
}

/* Style untuk elemen dengan class "new" */
.new {
  color: white;
  position: sticky;
  top: 0;
  z-index: 1;
  transition: box-shadow 0.3s ease;
  background-color: rgb(30, 255, 83);
}

/* Efek shadow ketika digulirkan */
.v-shadow-on-scroll {
  box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 1.5);
  background-color: rgb(2, 102, 203);
}

/* Style untuk tabel */
table {
  width: 100%;
  border-collapse: collapse;
}

/* Style untuk header kolom */
th {
  background-color: #007bff;
  color: white;
  text-align: center;
  position: sticky;
  top: 0; /* Membuat header tetap di atas saat digulir */
  z-index: 2; /* Menutupi konten yang berada di bawahnya */
}

/* Style untuk baris ganjil */
tr:nth-child(odd) {
  background-color: #f2f2f2;
}

/* Style untuk baris genap */
tr:nth-child(even) {
  background-color: #e0e0e0;
}

/* Style untuk sel data */
td {
  text-align: center;
  padding: 8px;
}

/* Style untuk field "Penalty" */
td.penalty {
  display: flex;
  gap: 28px;
}

/* Style untuk sel data dalam field "Penalty" */
td.penalty span {
  background-color: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 5px;
}

/* Style untuk sel data dalam field "Penalty" (Teks hitam) */
td.penalty span.black {
  background-color: black;
}

/* Style untuk sel data dalam field "Penalty" (Teks merah) */
td.penalty span.red {
  background-color: red;
}

/* Style untuk sel data dalam field "Penalty" (Teks biru) */
td.penalty span.blue {
  background-color: blue;
}

/* Style untuk sel data dalam field "Penalty" (Teks hijau) */
td.penalty span.green {
  background-color: green;
}

/* Style untuk total pinalty */
td.totalPenalty {
  font-weight: bold;
}

/* Style untuk waktu */
td.time {
  font-style: italic;
}
</style>
