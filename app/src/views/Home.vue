<template>
  <div class="mt-5">
    <!-- <h1>Halaman Home</h1> -->
    <b-row>
      <b-col>
        <b-button @click="goTo('create-new')" variant="primary">
          <Icon icon="ic:baseline-add-circle" />
          Create New Event</b-button
        >
        <br />
        <br />

        <br />

        <b-button @click="goTo('sprint-race')" variant="primary">
          <Icon icon="ic:baseline-add-circle" />
          BY PASS SPRINT RACE</b-button
        >
        <br />
        <br />
      </b-col>
      <b-col class="col-9">
        <div>
          <b-table striped hover :items="items"></b-table>
        </div>
      </b-col>
    </b-row>

    <p>ID Registrasi: {{ digitId }}</p>
    <p>Time: {{ digitTime }}</p>

  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";

import { SerialPort } from "serialport";

export default {
  name: "SustainableTimingSystemHome",
  components: {
    Icon,
  },
  data() {
    return {
      items: [
        { event_name: "MUBLOC", date: "DD-MM-YYYY", status: "Done" },
        { event_name: "MOSTFEST", date: "DD-MM-YYYY", status: "Coming Soon" },
        { event_name: "MOC", date: "DD-MM-YYYY", status: "Coming Soon" },
        { event_name: "UBL Run", date: "DD-MM-YYYY", status: "Coming Soon" },
      ],
      serialData: "",
      digitId: null,
      digitTime: null
    };
  },

  async mounted() {
    let receivedData = "";
    let a = '';
    let b = '';
    try {
      // Read the list of serial ports
      SerialPort.list()
        .then((ports) => {
          // Check if at least one port is available
          if (ports && ports.length > 0) {
            // console.log(ports, "<< cek");
            const selectedPort = ports[1];

            if (selectedPort && selectedPort.path) {
              // Open the selected serial port
              const port = new SerialPort({
                path: selectedPort.path,
                baudRate: 1200,
              });

              port.on("data", (data) => {
                const newData = data.toString();
                receivedData += newData;

                // console.log("Final Result :", receivedData);

                for (let i = 0; i < receivedData.length; i++) {
                  const char = receivedData[i];

                  if (char === "M") {
                    a = receivedData.slice(0, i + 1); // Potong dari awal hingga karakter 'M' termasuk 'M'
                    b = receivedData.slice(i + 1); // Potong dari setelah 'M' hingga akhir

                    receivedData = "";
                    break; // Keluar dari loop
                  }

                }

                this.digitId = a
                this.digitTime = receivedData

                console.log('Time :',receivedData)
                    console.log("ID Registrasi :", a);
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

  methods: {
    goTo(val) {
      this.$router.push(`${val}`);
    },
    copyTime() {
      // console.log(this.result)
      this.hasilValidasi = this.result;
    },
    async convertToTime() {
      // console.log(this.timeData, "<<< get TIME");

      let inputString = this.timeData;
      // Mengonversi string menjadi bilangan bulat
      let intValue = parseInt(inputString, 10);

      // Menghitung jam, menit, detik, dan milidetik
      let hours = Math.floor(intValue / 3600000);
      let minutes = Math.floor((intValue % 3600000) / 60000);
      let seconds = Math.floor((intValue % 60000) / 1000);
      let milliseconds = intValue % 1000;

      // Mengonversi hasil ke dalam format "HH:mm:ss.SSS"
      let formattedTime =
        (hours < 10 ? "0" : "") +
        hours +
        ":" +
        (minutes < 10 ? "0" : "") +
        minutes +
        ":" +
        (seconds < 10 ? "0" : "") +
        seconds +
        "." +
        (milliseconds < 100 ? (milliseconds < 10 ? "00" : "0") : "") +
        milliseconds;

      this.result = formattedTime;
      // console.log(formattedTime,'<< CEK GET TIME')
      // return formattedTime;
    },
  },
};
</script>

<style lang="scss" scoped></style>
