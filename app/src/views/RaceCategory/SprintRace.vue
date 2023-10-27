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

            <h6 style="font-weight: 800; font-style: italic">
              Nomor Lomba : Sprint
            </h6>
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
             
            <button type="button" class="btn btn-secondary">
              <Icon icon="ic:outline-delete-sweep" />
              Reset
            </button>
             
              <button type="button" class="btn btn-warning">
                <Icon icon="ic:outline-local-printshop" />
                Print Result
              </button>

              <button
                type="button"
                :class="{ 'btn-danger': isPortConnected, 'btn-success': !isPortConnected }"

                class="btn "
                @click="connectPort"
              >
                <Icon icon="ic:baseline-sync" />
                {{ isPortConnected ? "Disconnect Device" : "Connect Device" }}
              </button>
              <span
                class="status-indicator"
                :class="{
                  connected: isPortConnected,
                  disconnected: !isPortConnected,
                }"
              ></span>
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
                  <tr>
                    <td style="color: black">{{ digitId }}</td>
                    <td style="color: black">{{ digitTime }}</td>
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
                      <b-col class="col">
                        <p>Get Time Start</p>
                        <div class="input-group mb-3">
                          <input
                            v-model="digitTimeStart"
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
                      v-for="(button, index) in items"
                      id="btnStart"
                      :key="index"
                      type="button"
                      class="btn custom-btn"
                      :class="button.class"
                      @click="inputTime(digitTimeStart, button.id,'start')"
                    >
                      {{ button.bibNumber }}
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
                      <b-col class="col">
                        <p>Get Time Finish</p>
                        <div class="input-group mb-3">
                          <input
                            v-model="digitTimeFinish"
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
                      v-for="(button, index) in items"
                      id="btnFinish"
                      :key="index"
                      type="button"
                      class="btn custom-btn"
                      :class="button.class"
                      @click="inputTime(digitTimeFinish, button.id, 'finish')"
                    >
                      {{ 'No BIB ' + button.bibNumber }}
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

                    <ul>
                      <li>{{ currentPort }}</li>
                    </ul>
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
import { SerialPort } from "serialport";

export default {
  name: "SustainableTimingSystemSprintRace",

  data() {
    return {
      isScrolled: false,
      port: null,
      isPortConnected: false,
      items: [
        {
          id: 0,
          timeStart: "",
          timeFinish: "",
          nameTeam: "Makopala",
          bibNumber: "01",
          raceTime: "00:00:35.680",
          penalties: true,
          penaltiesTime: "00:00:35.680",
          timeResult: "00:00:35.680",
          ranked: 1,
          score: 80,
          class: "btn-dark"
        },
        {
          id: 1,
          timeStart: "00:00:35.680",
          timeFinish: "00:00:35.680",
          nameTeam: "Eka Citra UNJ",
          bibNumber: "10",
          raceTime: "00:00:35.680",
          penalties: true,
          penaltiesTime: "00:00:35.680",
          timeResult: "00:00:35.680",
          ranked: 1,
          score: 80,
          class: "btn-secondary"
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
      digitId: null,
      digitTime: null,
      digitTimeStart: null,
      digitTimeFinish: null,
      currentPort: "",
    };
  },

  mounted() {
    window.addEventListener("scroll", this.handleScroll);
  },
  destroyed() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    async connectPort() {
      if (!this.isPortConnected) {
        await this.setupSerialListener();
        this.isPortConnected = true;
        alert("Connected");
      } else {
        await this.disconnected();
        this.isPortConnected = false;
        alert("Disconnected");
      }
    },
    async disconnected() {
      if (this.port && this.port.isOpen) {
        this.port.close();
      }
      this.isPortConnected = false;
    },
    async setupSerialListener() {
      let receivedData = "";
      let a = "";
      let b = "";
      try {
        // Read the list of serial ports
        SerialPort.list()
          .then((ports) => {
            // Check if at least one port is available
            if (ports && ports.length > 0) {
              this.currentPort = ports;
              const selectedPort = ports[5];

              console.log(JSON.stringify(ports),'<<')

              if (selectedPort && selectedPort.path) {
                // Open the selected serial port
                this.port = new SerialPort({
                  path: selectedPort.path,
                  baudRate: 9600,
                });

                console.log(this.port, '<<')

                this.port.on("data", (data) => {
                  const newData = data.toString();
                  receivedData += newData;

                  // console.log("Final Result :", receivedData);

                  for (let i = 0; i < receivedData.length; i++) {
                    const char = receivedData[i];

                    if (char === "M") {
                      a = receivedData.slice(0, i + 1);
                      b = receivedData.slice(i + 1);

                      receivedData = "";
                      break; // Keluar dari loop
                    }
                  }
                  this.digitId = a;
                  this.digitTime = b;


                  console.log(a[11]);

                  // Memeriksa waktu Start atau Finish
                  if (a[11] == "0") {
                    this.digitTimeStart = b.replace(
                      /(\d{2})(\d{2})(\d{2})(\d{3})/,
                      "$1:$2:$3.$4"
                    );
                  } else if (a[11] == "2") {
                    this.digitTimeFinish = b.replace(
                      /(\d{2})(\d{2})(\d{2})(\d{3})/,
                      "$1:$2:$3.$4"
                    );
                  } else {
                    // Kondisi jika digit ke-13 bukan 0 dan juga bukan lebih besar dari 0
                    console.log(
                      "Digit ke-13 bukan 0 dan juga bukan lebih besar dari 0."
                    );
                  }
                });
              } else {
                console.error("Selected port path is undefined.");
              }
            } else {
              console.error("No serial ports available.");
            }
          })
          .catch((err) => {
            console.error("Error:", err.message);
          });
      } catch (err) {
        console.error("Error:", err.message);
      }
    },
    formatTime(inputTime) {
      console.log(inputTime, "<< cek");
      const hours = inputTime.substr(0, 2);
      const minutes = inputTime.substr(2, 2);
      const seconds = inputTime.substr(4, 2);
      const milliseconds = inputTime.substr(6);
      
      const correctedMinutes = Math.min(parseInt(minutes, 10), 59);
      const correctedSeconds = Math.min(parseInt(seconds, 10), 59);
      
      return `${hours}:${correctedMinutes}:${correctedSeconds}.${milliseconds}`;
    },
    inputTime(val, title) {
      if (title == "start") {
        this.items[0].timeStart = val;
      }
      if (title == "finish") {
        this.items[0].timeFinish = val;
      }
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

/* Tambahkan ini ke dalam file CSS Anda */
.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%; /* Membuat lingkaran */
  margin-left: 0px; /* Atur margin sesuai kebutuhan Anda */
  transition: background-color 0.3s; /* Efek transisi untuk perubahan warna */
}

.connected {
  background-color: rgb(0, 255, 0); /* Warna saat terhubung (misalnya, hijau) */
}

/* Warna saat tidak terhubung (misalnya, merah) */
.disconnected {
  background-color: red;
}
</style>
