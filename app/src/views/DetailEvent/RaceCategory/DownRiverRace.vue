<template>
  <div class="px-3">
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
        <drrResult
          :data="dataEvent"
          :dataParticipant="participant.length == 0 ? [] : participant"
          :categories="titleCategories"
        />
      </section>
    </vue-html2pdf>

    <div style="display: flex; justify-content: space-between">
      <b-button @click="goTo()" variant="primary">
        <Icon icon="ic:baseline-keyboard-double-arrow-left" />Back</b-button
      >
      <!-- <b-button @click="goTo()" variant="primary">
        New Category
        <Icon icon="ic:baseline-add-circle-outline" />
      </b-button> -->
    </div>
    <br />

    <div class="card new" :class="{ 'v-shadow-on-scroll': isScrolled }">
      <div class="card-body">
        <b-row>
          <b-col>
            <h5 style="font-weight: 800; font-style: italic">
              {{ dataEvent.eventName }}
            </h5>

            <h6 style="font-weight: 800; font-style: italic">
              Nomor Lomba : DRR
            </h6>
            <h6 style="font-weight: 800; font-style: italic">
              Categories : {{ titleCategories }}
            </h6>
            <p style="font-style: italic">
              <span>{{ dataEvent.addressCity }}, </span>
              <span
                >{{ dataEvent.startDateEvent }} -
                {{ dataEvent.endDateEvent }}</span
              >
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
             <button
                type="button"
                class="btn btn-outline-success"
                @click="toggleSortRanked"
              >
                <Icon icon="icon-park-outline:ranking" />
                Simpan Event
              </button>

              <button
                type="button"
                class="btn btn-info"
                @click="toggleSortRanked"
              >
                <Icon icon="icon-park-outline:ranking" />
                Sort Ranked
              </button>

              <button
                type="button"
                class="btn btn-warning"
                @click="generatePDF()"
              >
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

    <!-- DRR OPERATION TIME  -->
    <div class="card" style="background-color: dodgerblue">
      <div class="card-body">
        <div v-if="!editResult">
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
                        v-for="(button, index) in participant"
                        id="btnStart"
                        :key="index"
                        type="button"
                        class="btn custom-btn"
                        :disabled="button.result.startTime ? true : false"
                        :class="
                          button.result.startTime ? 'btn-secondary' : 'btn-info'
                        "
                        @click="updateTime(digitTimeStart, index, 'start')"
                      >
                        {{ "BIB " + button.bibTeam }}
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
                        v-for="(button, index) in participant"
                        id="btnFinish"
                        :key="index"
                        type="button"
                        :disabled="button.result.finishTime ? true : false"
                        class="btn custom-btn"
                        :class="
                          button.result.finishTime
                            ? 'btn-secondary'
                            : 'btn-info'
                        "
                        @click="updateTime(digitTimeFinish, index, 'finish')"
                      >
                        {{ "BIB " + button.bibTeam }}
                      </button>
                    </b-col>
                  </b-row>
                </div>
              </div>
            </b-col>
          </b-row>
          <br />
          <br />
        </div>

        <div>
          <b-row>
            <b-col class="col">
              <div class="card">
                <div class="card-body">
                  <h4>List Result</h4>
                  <!-- <button
                    id="btnReset"
                    type="button"
                    class="btn btn-danger"
                    @click="resetRace()"
                  >
                    <Icon icon="iconamoon:flag-fill" />
                    Reset Race
                  </button> -->
                  <b-row>
                    <b-col>
                      <table class="table">
                        <thead>
                          <tr>
                            <th scope="col">No</th>
                            <th scope="col">Team Name</th>
                            <th scope="col">BIB</th>
                            <th scope="col">Start Time</th>
                            <th scope="col">Finish Time</th>
                            <th scope="col">Race Time</th>
                            <th scope="col">Pen Start</th>
                            <th scope="col">Pen Section</th>
                            <th scope="col">Pen Finish</th>
                            <th scope="col">Pen Total</th>
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

                            <!-- PEN START -->
                            <td>
                              <b-select
                                v-if="item.result.startTime != ''"
                                v-model="item.result.penaltyStartTime"
                                @change="
                                  updateTimePen(
                                    $event,
                                    item,
                                    'penaltyStartTime'
                                  )
                                "
                                :placeholder="'Penalty Start'"
                              >
                              <option disabled value="">
                                  Select Penalty Start Time
                                </option>
                                <option
                                  v-for="penalty in dataPenalties"
                                  :key="penalty.value"
                                  :value="penalty.timePen"
                                >
                                  {{ penalty.value }}
                                </option>
                              </b-select>
                            </td>

                            <!-- PEN Section -->
                            <td>
                              <b-select
                              class="small-select"

                                v-for="(section, index) in item.result
                                  .penaltySection"
                                :key="index"
                                v-model="item.result.penaltySection[index]"
                                @change="
                                  updateTimePen(
                                    $event,
                                    item,
                                    'penaltySection',
                                    index
                                  )
                                "
                              >
                                <!-- Placeholder option -->
                                <option disabled value="">
                                  Section {{ index + 1 }}
                                </option>
                                <option
                                  v-for="penalty in dataPenalties"
                                  :key="penalty.value"
                                  :value="penalty.timePen"
                                >
                                  {{ penalty.value }}
                                </option>
                              </b-select>
                            </td>

                            <!-- PEN FINISH -->
                            <td>
                              <b-select
                                v-if="item.result.startTime != ''"
                                v-model="item.result.penaltyFinishTime"
                                @change="
                                  updateTimePen(
                                    $event,
                                    item,
                                    'penaltyFinishTime'
                                  )
                                "
                                :placeholder="'Penalty Finish'"
                              >
                                <option disabled value="">
                                  Select Penalty Finish Time
                                </option>
                                <option
                                  v-for="penalty in dataPenalties"
                                  :key="penalty.value"
                                  :value="penalty.timePen"
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
              </div>
            </b-col>
          </b-row>
        </div>
      </div>
    </div>
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <!-- // AREA MODAL  -->
    <!-- <b-modal id="bv-modal-edit-team" hide-footer no-close-on-backdrop centered>
      <template #modal-title>
        Edit Result - {{ editForm.nameTeam }} Team
      </template>
      <div class="d-block text-left mx-4 my-3">

        <b-form-group label="Name Team">
          <b-form-input v-model="editForm.nameTeam" disabled></b-form-input>
        </b-form-group>

        <b-form-group label="BIB Number Team">
          <b-form-input v-model="editForm.bibTeam" disabled></b-form-input>
        </b-form-group>

        <b-form-group label="Start Time">
          <b-form-input v-model="editForm.result.startTime"></b-form-input>
        </b-form-group>

        <b-form-group label="Finish Time">
          <b-form-input v-model="editForm.result.finishTime"></b-form-input>
        </b-form-group>

        <b-form-group label="Penalties Team">
          <b-form-input v-model="editForm.result.penalties"></b-form-input>
        </b-form-group>
      </div>
      <div class="mt-5 p-4" style="display: flex; gap: 2vh">
        <b-button
          class="btn-md"
          style="border-radius: 20px"
          variant="primary"
          block
          @click="simpanNewTeam"
          >Save Result by Team</b-button
        >
      </div>
    </b-modal> -->
    <!-- // AREA MODAL  -->
  </div>
</template>

<script>
import VueHtml2pdf from "vue-html2pdf";
import { SerialPort } from "serialport";
import drrResult from "../ResultComponent/drr-pdfResult.vue";

export default {
  name: "SustainableTimingSystemDRRRace",
  components: {
    drrResult,
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
          value: 10,
          timePen: "00:00:10.000",
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
      console.log(dataStorage, "<< cek storage");
      console.log("<<<<<<>>>>>>>>>>>>>>>>");

      console.log(events, "<< cek events");
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

    async updateTimePen(
      selectedTimePen,
      item,
      penaltyType,
      sectionIndex = null
    ) {
      // Update penalti sesuai dengan jenisnya
      if (penaltyType === "penaltySection" && sectionIndex !== null) {
        item.result.penaltySection[sectionIndex] = selectedTimePen;
      } else {
        item.result[penaltyType] = selectedTimePen;
      }

      // Akumulasi semua waktu penalti
      const penaltyFields = [
        item.result.penaltyStartTime || "00:00:00.000",
        item.result.penaltyFinishTime || "00:00:00.000",
        ...item.result.penaltySection.map((time) => time || "00:00:00.000"),
      ];

      // Hitung total waktu penalti
      const totalPenaltyTime = await penaltyFields.reduce(
        async (acc, currentTime) => {
          const accumulatedTime = await acc;
          return this.tambahWaktu(accumulatedTime, currentTime);
        },
        "00:00:00.000"
      );

      // Set total penalti
      item.result.penaltyTime = totalPenaltyTime;

      // Jika ada raceTime, hitung totalTime
      if (item.result.raceTime) {
        item.result.totalTime = await this.tambahWaktu(
          item.result.raceTime,
          totalPenaltyTime
        );
      }

      this.editResult = true;

      // Update peringkat setelah penalti dihitung
      await this.assignRanks(this.participant);
    },

    async resetRace() {
      this.editResult = false;
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
              const selectedPort = ports[5];

              // console.log(selectedPort, "<<< SELECT");

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

.small-select {
  width: 140px; /* Atur lebar sesuai kebutuhan */
  display: flex; /* Untuk menghindari elemen mengambil ruang penuh */
}
</style>
