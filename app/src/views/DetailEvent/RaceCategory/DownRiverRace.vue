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
              Nomor Lomba : DRR
            </h6>
            <p style="font-style: italic">
              Tigaraksa, 01-January-2024 - 10-January-2024
            </p>
            <p>{{ participant }}</p>
          </b-col>
          <b-col>
            <div
              style="
                display: flex;
                gap: 10px;
                justify-content: flex-end !important;
              "
            >
              <button
                type="button"
                class="btn btn-info"
                @click="toggleSortRanked"
              >
                <Icon icon="icon-park-outline:ranking" />
                Sort Ranked
              </button>

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
                :class="{
                  'btn-danger': isPortConnected,
                  'btn-success': !isPortConnected,
                }"
                class="btn"
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
                  <!-- <tr>
                    <td style="color: black">{{ digitId }}</td>
                    <td style="color: black">{{ digitTime }}</td>
                  </tr> -->
                  <tr v-for="(id, index) in digitId" :key="index">
                    <td style="color: black">{{ id }}</td>
                    <td style="color: black">{{ digitTime[index] }}</td>
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
                      :disabled="button.timeStart ? true : false"
                      :class="button.timeStart ? 'btn-secondary' : 'btn-info'"
                      @click="updateTime(digitTimeStart, button.id, 'start')"
                    >
                      {{ "BIB " + button.bibNumber }}
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
                      :disabled="button.timeFinish ? true : false"
                      class="btn custom-btn"
                      :class="button.timeFinish ? 'btn-secondary' : 'btn-info'"
                      @click="updateTime(digitTimeFinish, button.id, 'finish')"
                    >
                      {{ "BIB " + button.bibNumber }}
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
                <button
                  id="btnCheckPen"
                  type="button"
                  class="btn btn-warning"
                  @click="checkingPenalties()"
                >
                  <Icon icon="iconamoon:flag-fill" />
                  Penalty Check
                </button>
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
                          <td>
                            {{
                              item.penaltiesTime == ""
                                ? item.raceTime
                                : item.timeResult
                            }}
                          </td>
                          <td>{{ item.ranked }}</td>
                          <td>{{ getScoreByRanked(item.ranked) }}</td>
                          <!-- <td>{{ item.score }}</td> -->

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
      digitId: [],
      digitTime: [],
      items: [
        {
          id: 0,
          timeStart: "",
          timeFinish: "",
          nameTeam: "JAWA TENGAH",
          bibNumber: "01",
          raceTime: "",
          penalties: "0",
          penaltiesTime: "00:00:00.000",
          timeResult: "",
          ranked: null,
          score: null,
        },
        {
          id: 1,
          timeStart: "",
          timeFinish: "",
          nameTeam: "JAWA BARAT",
          bibNumber: "02",
          raceTime: "",
          penalties: "0",
          penaltiesTime: "00:00:00.000",
          timeResult: "",
          ranked: null,
          score: null,
        },
        {
          id: 2,
          timeStart: "",
          timeFinish: "",
          nameTeam: "BANTEN",
          bibNumber: "03",
          raceTime: "",
          penalties: "0",
          penaltiesTime: "00:00:00.000",
          timeResult: "",
          ranked: null,
          score: null,
        },
        {
          id: 3,
          timeStart: "",
          timeFinish: "",
          nameTeam: "DKI JAKARTA",
          bibNumber: "04",
          raceTime: "",
          penalties: "0",
          penaltiesTime: "00:00:00.000",
          timeResult: "",
          ranked: null,
          score: null,
        },
        {
          id: 4,
          timeStart: "",
          timeFinish: "",
          nameTeam: "SULAWESI SELATAN",
          bibNumber: "05",
          raceTime: "",
          penalties: "0",
          penaltiesTime: "00:00:00.000",
          timeResult: "",
          ranked: null,
          score: null,
        },
        {
          id: 5,
          timeStart: "",
          timeFinish: "",
          nameTeam: "SUMATERA SELATAN",
          bibNumber: "06",
          raceTime: "",
          penalties: "0",
          penaltiesTime: "00:00:00.000",
          timeResult: "",
          ranked: null,
          score: null,
        },
      ],
      penTeam: "",
      dataPenalties: [
        {
          label: "clear",
          value: 0,
          timePen: "00:00:00.000",
        },
        {
          label: "pen 1",
          value: 5,
          timePen: "00:00:05.000",
        },
        {
          label: "pen 2",
          value: 50,
          timePen: "00:00:50.000",
        },
      ],
      dataScore: [
        {
          ranking: 1,
          score: 100,
        },
        {
          ranking: 2,
          score: 92,
        },
        {
          ranking: 3,
          score: 86,
        },
        {
          ranking: 4,
          score: 82,
        },
        {
          ranking: 5,
          score: 79,
        },
        {
          ranking: 6,
          score: 76,
        },
        {
          ranking: 7,
          score: 73,
        },
        {
          ranking: 8,
          score: 70,
        },
        {
          ranking: 9,
          score: 67,
        },
        {
          ranking: 10,
          score: 64,
        },
        {
          ranking: 11,
          score: 61,
        },
        {
          ranking: 12,
          score: 58,
        },
        {
          ranking: 13,
          score: 55,
        },
        {
          ranking: 14,
          score: 52,
        },
        {
          ranking: 15,
          score: 49,
        },
        {
          ranking: 16,
          score: 46,
        },
        {
          ranking: 17,
          score: 43,
        },
        {
          ranking: 18,
          score: 40,
        },
        {
          ranking: 19,
          score: 38,
        },
        {
          ranking: 20,
          score: 36,
        },
        {
          ranking: 21,
          score: 34,
        },
        {
          ranking: 22,
          score: 32,
        },
        {
          ranking: 23,
          score: 30,
        },
        {
          ranking: 24,
          score: 28,
        },
        {
          ranking: 25,
          score: 26,
        },
        {
          ranking: 26,
          score: 24,
        },
        {
          ranking: 27,
          score: 22,
        },
        {
          ranking: 28,
          score: 20,
        },
        {
          ranking: 29,
          score: 18,
        },
        {
          ranking: 30,
          score: 16,
        },
        {
          ranking: 31,
          score: 14,
        },
        {
          ranking: 32,
          score: 12,
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
      // digitId: null,
      // digitTime: null,
      digitTimeStart: null,
      digitTimeFinish: null,
      currentPort: "",
      isRankedDescending: false,
      participant: {},
    };
  },
  async mounted() {
    window.addEventListener("scroll", this.handleScroll);
    await this.checkValueStorage();
  },
  destroyed() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    async checkValueStorage() {
      const dataStorage = localStorage.getItem("participantByCategories");
      const datas = JSON.parse(dataStorage);
      if (datas) {
        this.participant = datas;
      }
    },
    async assignRanks(items) {
      const itemsWithTimeResult = items.filter((item) => item.timeResult);
      itemsWithTimeResult.sort((a, b) => {
        const timeA = this.parsesTime(a.timeResult);
        const timeB = this.parsesTime(b.timeResult);
        return timeA - timeB;
      });

      itemsWithTimeResult.forEach((item, index) => {
        item.ranked = index + 1;
        console.log("item", item.id);
      });
      // itemsWithTimeResult.forEach(async (item, index) => {
      //   item.ranked = index + 1;
      //   console.log("cek ranked, ",item.id)
      //   // item.score = await this.calculateScore(item.ranked);
      // });
    },
    parsesTime(timeStr) {
      console.log("hkhhkhk", timeStr);
      const [hours, minutes, seconds] = timeStr.split(":").map(parseFloat);
      return hours * 3600 * 1000 + minutes * 60 * 1000 + seconds * 1000;
    },

    // Fungsi untuk menghitung skor berdasarkan peringkat
    async calculateScore(ranked) {
      // Mencari data score berdasarkan ranking
      const scoreData = this.dataScore.find((data) => data.ranking === ranked);

      // Jika data ditemukan, maka kembalikan skor dari data tersebut
      if (scoreData) {
        return scoreData.score;
      } else {
        // Jika data tidak ditemukan, kembalikan 0 atau nilai default yang Anda inginkan
        return 0;
      }
    },

    //BATAS TERAKHIR

    // Fungsi untuk mengonversi format waktu "HH:mm:ss.SSS" ke milidetik
    async parseTimeResult(timeResult) {
      const parts = timeResult.split(":");
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2]);
      const milliseconds = parseInt(parts[3]);

      return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
    },

    async checkingPenalties() {
      console.log(this.items, "<<< cek dulu");

      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];

        item.penalties = this.dataPenalties[2].value;
        item.penaltiesTime = this.dataPenalties[2].timePen;

        if (item.raceTime && item.penaltiesTime) {
          const newTimeResult = await this.tambahWaktu(
            item.raceTime,
            item.penaltiesTime
          );
          item.timeResult = newTimeResult;
        }
      }
      await this.assignRanks(this.items);
    },
    // async checkingPenalties() {
    //   this.items[0].penalties = this.dataPenalties[2].value;
    //   this.items[0].penaltiesTime = this.dataPenalties[2].timePen;

    //   if(this.items[0].raceTime && this.items[0].penaltiesTime){
    //     let a =await this.tambahWaktu(this.items[0].raceTime, this.items[0].penaltiesTime)
    //     this.items[0].timeResult = a

    //     if(this.items[0].timeResult != ''){
    //       await this.assignRanks()
    //     }
    //   } else {
    //     alert('Waktu Race Time belum tampil')
    //   }
    // },
    getScoreByRanked(ranked) {
      const matchingRank = this.dataScore.find(
        (data) => data.ranking === ranked
      );
      return matchingRank ? matchingRank.score : null;
    },
    toggleSortRanked() {
      // Ubah arah urutan setiap kali tombol diklik
      this.isRankedDescending = !this.isRankedDescending;
      this.sortRanked();
    },
    sortRanked() {
      if (this.isRankedDescending) {
        this.items.sort((a, b) => b.ranked - a.ranked);
      } else {
        this.items.sort((a, b) => a.ranked - b.ranked);
      }
    },
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
              console.log(ports[5], "<< ceks");
              const selectedPort = ports[5];

              if (selectedPort && selectedPort.path) {
                // Open the selected serial port
                this.port = new SerialPort({
                  path: selectedPort.path,
                  baudRate: 9600,
                });

                this.port.on("data", (data) => {
                  const newData = data.toString();
                  receivedData += newData;

                  for (let i = 0; i < receivedData.length; i++) {
                    const char = receivedData[i];

                    //  TIME BY RACETIME
                    if (char === "M") {
                      a = receivedData.slice(0, i + 1);
                      b = receivedData.slice(i + 1);

                      receivedData = "";
                      break;
                    }

                    //  TIME BY SENSOR
                    if (char === "R") {
                      a = receivedData.slice(0, i + 1);
                      b = receivedData.slice(i + 1);

                      receivedData = "";
                      break;
                    }
                  }

                  this.digitId.unshift(a);
                  this.digitTime.unshift(b);

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
    async updateTime(val, id, title) {
      if (title == "start") {
        this.items[id].timeStart = val;
      }
      if (title == "finish") {
        this.items[id].timeFinish = val;
        if (this.items[id].timeStart && this.items[id].timeFinish) {
          this.items[id].raceTime = await this.hitungSelisihWaktu(
            this.items[id].timeStart,
            this.items[id].timeFinish
          );
        }
      }
    },
    async hitungSelisihWaktu(waktuAwal, waktuAkhir) {
      // Parsing waktu awal dan waktu akhir menjadi objek Date
      var waktuAwalParts = waktuAwal.split(":");
      var waktuAkhirParts = waktuAkhir.split(":");

      var waktuAwalDate = new Date(0);
      waktuAwalDate.setUTCHours(parseInt(waktuAwalParts[0]));
      waktuAwalDate.setUTCMinutes(parseInt(waktuAwalParts[1]));
      waktuAwalDate.setUTCSeconds(parseInt(waktuAwalParts[2].split(".")[0]));
      waktuAwalDate.setUTCMilliseconds(
        parseInt(waktuAwalParts[2].split(".")[1])
      );

      var waktuAkhirDate = new Date(0);
      waktuAkhirDate.setUTCHours(parseInt(waktuAkhirParts[0]));
      waktuAkhirDate.setUTCMinutes(parseInt(waktuAkhirParts[1]));
      waktuAkhirDate.setUTCSeconds(parseInt(waktuAkhirParts[2].split(".")[0]));
      waktuAkhirDate.setUTCMilliseconds(
        parseInt(waktuAkhirParts[2].split(".")[1])
      );

      // Menghitung selisih waktu dalam milidetik
      var selisihMilidetik = waktuAkhirDate - waktuAwalDate;

      // Mengonversi selisih milidetik menjadi jam, menit, detik, dan milidetik
      var milidetik = selisihMilidetik % 1000;
      var detik = Math.floor((selisihMilidetik / 1000) % 60);
      var menit = Math.floor((selisihMilidetik / (1000 * 60)) % 60);
      var jam = Math.floor(selisihMilidetik / (1000 * 60 * 60));

      // Mengonversi hasil ke dalam format yang diinginkan
      var hasilFormat =
        (await this.pad(jam)) +
        ":" +
        (await this.pad(menit)) +
        ":" +
        (await this.pad(detik)) +
        "." +
        milidetik;

      return hasilFormat;
    },

    async pad(angka) {
      return angka < 10 ? "0" + angka : angka;
    },

    async tambahWaktu(waktuA, waktuB) {
      // Parsing waktu dalam format "HH:mm:ss.SSS"
      const partsA = waktuA.split(":");
      const partsB = waktuB.split(":");

      // Menghitung total milidetik
      const milidetikA =
        parseInt(partsA[0]) * 3600000 +
        parseInt(partsA[1]) * 60000 +
        parseFloat(partsA[2]) * 1000;
      const milidetikB =
        parseInt(partsB[0]) * 3600000 +
        parseInt(partsB[1]) * 60000 +
        parseFloat(partsB[2]) * 1000;

      // Menambahkan waktu bersama-sama
      const totalMilidetik = milidetikA + milidetikB;

      // Mengonversi total milidetik menjadi format waktu
      const jam = Math.floor(totalMilidetik / 3600000);
      const sisaMilidetik = totalMilidetik % 3600000;
      const menit = Math.floor(sisaMilidetik / 60000);
      const sisaMilidetik2 = sisaMilidetik % 60000;
      const detik = Math.floor(sisaMilidetik2 / 1000);
      const milidetik = sisaMilidetik2 % 1000;

      // Mengonversi hasil ke dalam format yang diinginkan
      const hasilFormat = `${String(jam).padStart(2, "0")}:${String(
        menit
      ).padStart(2, "0")}:${String(detik).padStart(2, "0")}.${String(
        milidetik
      ).padStart(3, "0")}`;

      return hasilFormat;
    },
    goTo() {
      this.$router.push(`/event-detail/${this.$route.params.id}`);
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
