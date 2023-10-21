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
            <h5 style="font-weight: 800; font-style: italic;">Kejuaraan Arung Jeram 2024</h5>
            <p style="font-style: italic;">Tigaraksa, 01-January-2024 - 10-January-2024</p>
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
                          v-model=hasilKonversi
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
        <b-row>
          <b-col class="col">
            <div class="card">
              <div class="card-body">
                <h4>List Result</h4>
                <b-row>
                  <b-col>
                    <table class="table">
                      <thead>
                        <tr>
                          <th scope="col">No</th>
                          <th scope="col">Team Name</th>
                          <th scope="col">BIB Number</th>
                          <th scope="col">Start Time</th>
                          <th scope="col">Finish Time</th>
                          <th scope="col">Race Time</th>
                          <th scope="col">Penalties</th>
                          <th scope="col">Penalty Time</th>
                          <th scope="col">Result</th>
                          <th scope="col">Ranked</th>
                          <th scope="col">Score</th>
                          <th scope="col">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, index) in items" :key="index">
                          <td>{{ index + 1 }}</td>
                          <td>{{ item.nameTeam }}</td>
                          <td>{{ item.bibNumber }}</td>
                          <td>{{ item.timeStart }}</td>
                          <td>{{ item.timeFinish }}</td>
                          <td>{{ item.raceTime }}</td>
                          <td>{{ item.penalties }}</td>
                          <td>{{ item.penaltiesTime }}</td>
                          <td>{{ item.timeResult }}</td>
                          <td>{{ item.ranked }}</td>
                          <td>{{ item.score }}</td>
                          <td>
                            <button type="button" class="btn btn-warning">
                              Edit
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </b-col>
                </b-row>
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
      items: [
        {
          timeStart: "00:00:35.680",
          timeFinish: "00:00:35.680",
          nameTeam: "Makopala",
          bibNumber: 80,
          raceTime: "00:00:35.680",
          penalties: true,
          penaltiesTime: "00:00:35.680",
          timeResult: "00:00:35.680",
          ranked: 1,
          score: 80,
        },
        {
          timeStart: "00:00:35.680",
          timeFinish: "00:00:35.680",
          nameTeam: "Makopala",
          bibNumber: 80,
          raceTime: "00:00:35.680",
          penalties: true,
          penaltiesTime: "00:00:35.680",
          timeResult: "00:00:35.680",
          ranked: 1,
          score: 80,
        },
      ],
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

  mounted() {
    window.addEventListener("scroll", this.handleScroll);

    setInterval(this.updateClock, 1000);

    // Panggil fungsi updateClock sekali pada awalnya untuk menginisialisasi waktu
    this.updateClock();
    this.hasilKonversi = this.konversiFormatWaktu(this.waktuSaatIni);
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
.card-table {
  max-width: 100%;
  overflow-x: auto; /* Untuk mengaktifkan horizontal scroll jika tabel terlalu lebar */
}

.custom-btn {
  margin: 5px;
  width: 120px;
}

.new {
  color: white;
  position: sticky;
  top: 0;
  z-index: 1;
  transition: box-shadow 0.3s ease;
  background-color: dodgerblue;
}

.v-shadow-on-scroll {
  box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 1.5);
  background-color: rgb(2, 102, 203);
}
</style>
