<template>
  <div>
    <vue-html2pdf
      :show-layout="false"
      :float-layout="true"
      :enable-download="false"
      :preview-modal="true"
      :paginate-elements-by-height="500000"
      filename="tes"
      :manual-pagination="false"
      :pdf-margin="1"
      :pdf-quality="2"
      pdf-format="a4"
      pdf-content-width="100%"
      pdf-orientation="landscape"
      @progress="onProgress($event)"
      ref="html2Pdf"
    >
      <section slot="pdf-content">
        <!-- <ContentToPrint :data="updateDataforPDF" /> -->
        <sprintResult
          :data="dataEvent"
          :dataParticipant="participant.length == 0 ? [] : participant"
          :categories="titleCategories"
        />
      </section>
    </vue-html2pdf>

    <section class="detail-hero">
      <div class="hero-bg"></div>
      <b-container class="hero-inner">
        <b-row class="align-items-center">
          <!-- logo -->
          <b-col cols="auto" class="pr-0">
            <div
              class="hero-logo d-flex align-items-center justify-content-center"
            >
              <Icon icon="mdi:shield-crown" width="56" height="56" />
            </div>
          </b-col>

          <!-- judul + meta -->
          <b-col>
            <h2 class="h1 font-weight-bold mb-1 text-white">
              {{
                dataEvent.eventName || "Kejurnas Arung Jeram DKI Jakarta 2025"
              }}
            </h2>
            <div class="meta text-white-50">
              <span class="mr-3"
                ><strong class="text-white">Location</strong> :
                {{ dataEvent.addressCity || "-" }}</span
              >
              <span class="mr-3"
                ><strong class="text-white">River</strong> : {{ "-" }}</span
              >
              <span class="mr-3"
                ><strong class="text-white">Level</strong> : {{ "-" }}</span
              >
            </div>
          </b-col>
        </b-row>
      </b-container>
    </section>

    <div class="px-5">
      <div class="card-body">
        <b-row>
          <b-col>
            <h6 style="font-weight: 800; font-style: italic">
              Nomor Lomba : Sprint
            </h6>
            <h6 style="font-weight: 800; font-style: italic">
              Categories : {{ titleCategories }}
            </h6>
            <h6 style="font-weight: 800; font-style: italic">
              Tanggal : {{ dataEvent.startDateEvent }} -
              {{ dataEvent.endDateEvent }}
            </h6>
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
                class="btn btn-secondary"
                @click="saveResult"
              >
                <Icon icon="icon-park-outline:save" />
                Save Result
              </button>

              <button
                type="button"
                class="btn btn-info"
                @click="toggleSortRanked"
              >
                <Icon icon="icon-park-outline:ranking" />
                Sort Ranked
              </button>

              <!-- <button
                type="button"
                class="btn btn-warning"
                @click="generatePDF()"
              >
                <Icon icon="ic:outline-local-printshop" />
                Print Result
              </button> -->

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

    <!-- KOMPONEN OPERATION TIME  -->
    <OperationTimePanel
      :digit-id="digitId"
      :digit-time="digitTime"
      :participant="
        Array.isArray(participant)
          ? participant
          : Object.values(participant || {})
      "
      :digit-time-start.sync="digitTimeStart"
      :digit-time-finish.sync="digitTimeFinish"
      @update-time="updateTime"
    />
    <!-- END KOMPONEN OPERATION TIME  -->

    <div class="px-4 mt-4">
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
                  <th scope="col" v-if="editResult">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in participant" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.nameTeam }}</td>
                  <td>{{ item.bibTeam }}</td>
                  <td>{{ item.result.startTime }}</td>
                  <td>{{ item.result.finishTime }}</td>
                  <td>{{ item.result.raceTime }}</td>
                  <td>
                    <b-select
                      v-if="item.result.startTime != ''"
                      v-model="item.result.penalty"
                      @change="updateTimePen($event, item)"
                    >
                      <option
                        v-for="penalty in dataPenalties"
                        :key="penalty.value"
                        :value="penalty.value"
                      >
                        {{ penalty.value }}
                      </option>
                    </b-select>
                  </td>
                  <td>{{ item.result.penaltyTime }}</td>
                  <td>
                    {{
                      item.result.penaltyTime == ""
                        ? item.result.raceTime
                        : item.result.totalTime
                    }}
                  </td>
                  <td>{{ item.result.ranked }}</td>
                  <td>{{ getScoreByRanked(item.result.ranked) }}</td>
                  <td v-if="editResult">
                    <button
                      type="button"
                      class="btn btn-warning"
                      @click="openModal(item, 'R4men')"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- <ul>
                        <li>{{ currentPort }}</li>
                      </ul> -->
            <br />
          </b-col>
        </b-row>
      </div>
      <b-button @click="goTo()" variant="outline-info" class="custom-button">
        <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back
      </b-button>
    </div>
    <br />
    <br />
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import VueHtml2pdf from "vue-html2pdf";
import { SerialPort } from "serialport";
import OperationTimePanel from "../components/OperationTeamPanel.vue";
import sprintResult from "../ResultComponent/sprint-pdfResult.vue";

export default {
  name: "SustainableTimingSystemSprintRace",
  components: {
    OperationTimePanel,
    sprintResult,
    VueHtml2pdf,
  },
  data() {
    return {
      editForm: "",
      editResult: false,
      isScrolled: false,
      port: null,
      isPortConnected: false,
      digitId: [],
      digitTime: [],
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
      digitTimeStart: null,
      digitTimeFinish: null,
      currentPort: "",
      isRankedDescending: false,
      participant: {},
      dataEvent: "",
      titleCategories: "",
    };
  },
  computed: {
    showButtonApproval() {
      // console.log(this.participant, "COMPUTED");
    },
  },
  async mounted() {
    window.addEventListener("scroll", this.handleScroll);
    await this.checkValueStorage();
  },
  destroyed() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    openModal(datas, division) {
      // console.log(datas);
      this.editForm = datas;
      this.$bvModal.show("bv-modal-edit-team");
    },
    async checkValueStorage() {
      const dataStorage = localStorage.getItem("participantByCategories");
      const events = localStorage.getItem("eventDetails");
      this.dataEvent = JSON.parse(events);
      this.titleCategories = localStorage.getItem("currentCategories");

      let datas = JSON.parse(dataStorage);
      if (datas) {
        datas = datas.sort(function (a, b) {
          return a.praStart.localeCompare(b.praStart);
        });

        this.participant = datas;
        // console.log(JSON.stringify(this.participant));
      }
    },
    async assignRanks(items) {
      const itemsWithTimeResult = items.filter((item) => item.result.totalTime);

      itemsWithTimeResult.sort((a, b) => {
        const timeA = this.parsesTime(a.result.totalTime);
        const timeB = this.parsesTime(b.result.totalTime);
        return timeA - timeB;
      });

      itemsWithTimeResult.forEach((item, index) => {
        item.result.ranked = index + 1;
      });
    },
    parsesTime(timeStr) {
      // console.log("hkhhkhk", timeStr);
      const [hours, minutes, seconds] = timeStr.split(":").map(parseFloat);
      return hours * 3600 * 1000 + minutes * 60 * 1000 + seconds * 1000;
    },

    // Fungsi untuk menghitung skor berdasarkan peringkat
    async calculateScore(ranked) {
      const scoreData = this.dataScore.find((data) => data.ranking === ranked);
      if (scoreData) {
        return scoreData.score;
      } else {
        return 0;
      }
    },

    //BATAS TERAKHIR
    async parseTimeResult(timeResult) {
      const parts = timeResult.split(":");
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2]);
      const milliseconds = parseInt(parts[3]);

      return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
    },

    async updateTimePen(selectedValue, item) {
      const selectedPenaltyData = this.dataPenalties.find(
        (penalty) => penalty.value === selectedValue
      );
      if (selectedPenaltyData) {
        item.result.penaltyTime = selectedPenaltyData.timePen;
        // console.log(item.result.penaltyTime, "<<< CEK DATA PENALTY");
      }

      if (item.result.raceTime && item.result.penaltyTime) {
        const newTimeResult = await this.tambahWaktu(
          item.result.raceTime,
          item.result.penaltyTime
        );
        item.result.totalTime = newTimeResult;
      }
      this.editResult = true;
      await this.assignRanks(this.participant);
    },
    async resetRace() {
      this.editResult = false;
    },
    async checkingPenalties() {
      for (let i = 0; i < this.participant.length; i++) {
        const item = this.participant[i];
        // item.result.penalty = this.dataPenalties[2].value;
        // item.result.penaltyTime = this.dataPenalties[2].timePen;

        if (item.result.raceTime && item.result.penaltyTime) {
          const newTimeResult = await this.tambahWaktu(
            item.result.raceTime,
            item.result.penaltyTime
          );
          item.result.totalTime = newTimeResult;
        }
      }
      this.editResult = true;
      await this.assignRanks(this.participant);
    },
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
        this.participant.sort((a, b) => b.result.ranked - a.result.ranked);
      } else {
        this.participant.sort((a, b) => a.result.ranked - b.result.ranked);
      }
    },
    async connectPort() {
      if (!this.isPortConnected) {
        let connectCheck = await this.setupSerialListener();
        // console.log(connectCheck, "<< check");
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
              const selectedPort = ports[6];

              console.log(this.currentPort[6].path, "<<< CEK PORT");

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
                    // console.log(
                    //   "Digit ke-13 bukan 0 dan juga bukan lebih besar dari 0."
                    // );
                  }
                  return true;
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
      // console.log(inputTime, "<< cek");
      const hours = inputTime.substr(0, 2);
      const minutes = inputTime.substr(2, 2);
      const seconds = inputTime.substr(4, 2);
      const milliseconds = inputTime.substr(6);

      const correctedMinutes = Math.min(parseInt(minutes, 10), 59);
      const correctedSeconds = Math.min(parseInt(seconds, 10), 59);

      return `${hours}:${correctedMinutes}:${correctedSeconds}.${milliseconds}`;
    },
    async updateTime(val, id, title) {
      // console.log(val, id);
      if (title == "start") {
        this.participant[id].result.startTime = val;
      }
      if (title == "finish") {
        this.participant[id].result.finishTime = val;
        if (
          this.participant[id].result.startTime &&
          this.participant[id].result.finishTime
        ) {
          this.participant[id].result.raceTime = await this.hitungSelisihWaktu(
            this.participant[id].result.startTime,
            this.participant[id].result.finishTime
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
    onProgress(event) {
      // console.log(`Processed: ${event} / 100`);
    },
    hasGenerated() {
      alert("PDF generated successfully!");
    },
    generatePDF() {
      this.participant.forEach((e) => {
        // console.log(e.result);
        e.result.score = this.getScoreByRanked(e.result.ranked);
      });
      this.$refs.html2Pdf.generatePdf();
    },
    saveResult() {
      // Normalisasi ke array selalu
      let arr = Array.isArray(this.participant)
        ? this.participant
        : Object.values(this.participant || {});

      // Sanitasi minimal: buang field non-serializable/fungsi
      const clean = JSON.parse(JSON.stringify(arr));

      if (!Array.isArray(clean) || clean.length === 0) {
        ipcRenderer.send("get-alert", {
          type: "warning",
          detail: "Belum ada data yang bisa disimpan.",
          message: "Ups Sorry",
        });
        return;
      }

      // Ambil eventId dari dataEvent
      const eventId =
        this.dataEvent && this.dataEvent._id
          ? this.dataEvent._id.toString()
          : null;

      // Tambahkan eventId ke setiap item
      const payload = clean.map((it) => ({
        ...it,
        eventId,
      }));

      ipcRenderer.send("insert-sprint-result", payload);
      ipcRenderer.once("insert-sprint-result-reply", (_e, res) => {
        if (res && res.ok) {
          ipcRenderer.send("get-alert-saved", {
            type: "question",
            detail: `Result data has been successfully saved`,
            message: "Successfully",
          });
        } else {
          ipcRenderer.send("get-alert", {
            type: "error",
            detail: (res && res.error) || "Save failed",
            message: "Failed",
          });
        }
      });
    },
  },
};
</script>

<style scoped>
/* ===== HERO / BANNER ===== */
.detail-hero {
  position: relative;
  overflow: hidden;
}
.detail-hero .hero-bg {
  position: absolute;
  inset: 0;
  background-image: url("https://images.unsplash.com/photo-1520981825232-ece5fae45120?q=80&w=1600&auto=format&fit=crop");
  background-size: cover;
  background-position: center;
}
.detail-hero .hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45));
}
.detail-hero .hero-inner {
  position: relative;
  z-index: 1;
  padding: 22px;
}
.detail-hero h2 {
  color: #fff;
  font-weight: 800;
  font-size: clamp(26px, 4.2vw, 46px);
  line-height: 1.05;
  margin-bottom: 6px !important;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
  letter-spacing: 0.2px;
}
.detail-hero .meta {
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(12px, 1.6vw, 16px);
}
/* Kotak logo */
.hero-logo {
  width: 100px;
  height: 100px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ===== TABLE (List Result) ===== */
table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 12px;
  overflow: hidden;
}
thead {
  background-color: #4a4a4a;
  color: #fff;
  font-weight: 600;
}
thead th {
  padding: 12px 15px;
  text-align: left;
  font-size: 14px;
  border-bottom: 2px solid #f1f1f1;
}
tbody tr:nth-child(odd) {
  background-color: #f9f9f9;
}
tbody tr:nth-child(even) {
  background-color: #f2f2f2;
}
th,
td {
  border: none;
}
thead th:first-child {
  border-top-left-radius: 12px;
}
thead th:last-child {
  border-top-right-radius: 12px;
}

/* ===== PORT CONNECTION INDICATOR ===== */
.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 0;
  transition: background-color 0.3s;
}
.connected {
  background-color: rgb(0, 255, 0);
}
.disconnected {
  background-color: red;
}

/* ===== Buttons ===== */
.custom-button {
  border-color: #1874a5;
  color: #1874a5;
  transition: all 0.3s ease;
}
.custom-button:hover {
  background-color: #1874a5;
  color: #fff;
  border-color: #1874a5;
}
</style>
