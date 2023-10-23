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
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";

import { SerialPort } from "serialport";
// import { DelimiterParser } from '@serialport/parser-delimiter'

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
      serialData: null,
    };
  },

  async mounted() {
    try {
      // Read the list of serial ports
      const ports = await SerialPort.list();

      // Check if at least one port is available
      if (ports && ports.length > 0) {
        // Assuming you want to select the first port, change this logic as needed
        const selectedPort = ports[5];

        if (selectedPort.path) {
          // Open the selected serial port
          const port = new SerialPort(selectedPort.path, {
            baudRate: 9600,
          });

          // Add event listeners for the serial port
          port.on("open", () => {
            console.log("Port opened.");
          });

          port.on("data", (data) => {
            console.log("Data from serial port:", data.toString());
            // Do something with the data, e.g., store it in a variable or process it as needed.
          });

          port.on("error", (err) => {
            console.error("Error:", err.message);
          });
        } else {
          console.error("Selected port path is undefined.");
        }
      } else {
        console.error("No serial ports available.");
      }
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
