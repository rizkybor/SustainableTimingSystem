<template>
  <div class="si-test-page">
    <b-container class="py-4">
      <div class="mb-4">
        <b-badge variant="warning" class="mb-2">Temporary / Dev Page</b-badge>
        <h2 class="font-weight-bold mb-1">SI Card Reader Test</h2>
        <p class="text-muted mb-0">
          Halaman percobaan untuk integrasi SPORTident (BSM7/BSF7, mode
          Readout, 38400 baud). Tempel/lepas kartu SI setelah connect — hasil
          akan muncul otomatis di bawah dan di console DevTools.
        </p>
      </div>

      <b-card class="mb-4">
        <div class="d-flex flex-wrap align-items-center" style="gap: 12px">
          <b-form-select
            v-model="selectedPath"
            :options="portOptions"
            :disabled="isConnected || isConnecting"
            style="max-width: 320px"
          />
          <b-button variant="secondary" :disabled="isConnected || isConnecting" @click="refreshPorts">
            <Icon icon="ic:baseline-sync" /> Refresh Ports
          </b-button>
          <b-button
            :variant="isConnected ? 'danger' : 'success'"
            :disabled="isConnecting || (!isConnected && !selectedPath)"
            @click="toggleConnect"
          >
            <b-spinner small v-if="isConnecting" />
            <span v-else>{{ isConnected ? "Disconnect" : "Connect" }}</span>
          </b-button>
          <span class="status-dot" :class="{ connected: isConnected }"></span>
          <span class="text-muted small">{{ isConnected ? "Connected @ 38400" : "Disconnected" }}</span>
        </div>
      </b-card>

      <b-row>
        <b-col cols="12" lg="6" class="mb-4">
          <b-card class="position-relative">
            <div v-if="isReadingCard" class="reading-overlay">
              <b-spinner variant="primary" style="width: 2.5rem; height: 2.5rem" />
              <div class="mt-2 font-weight-bold text-primary">Membaca kartu...</div>
            </div>

            <h5 class="font-weight-bold mb-3">Status Kartu</h5>
            <div v-if="!lastEvent" class="text-muted text-center py-4">
              Belum ada aktivitas kartu.
            </div>
            <div v-else>
              <b-badge :variant="lastEvent.type === 'removed' ? 'secondary' : 'info'" class="mb-2">
                {{ lastEvent.type === "detected" ? "Kartu Terdeteksi" : lastEvent.type === "removed" ? "Kartu Dilepas" : "Kartu Terbaca" }}
              </b-badge>
              <div class="small text-muted">{{ lastEvent.at }}</div>
            </div>
          </b-card>

          <b-card class="mt-4" v-if="decoded">
            <h5 class="font-weight-bold mb-3">Hasil Decode</h5>
            <table class="table table-sm">
              <tbody>
                <tr>
                  <th style="width: 40%">No</th>
                  <td>{{ decoded.no }}</td>
                </tr>
                <tr>
                  <th>Read at</th>
                  <td>{{ decoded.readAt }}</td>
                </tr>
                <tr>
                  <th>Tipe Kartu</th>
                  <td>{{ decoded.cardType }}</td>
                </tr>
                <tr>
                  <th>SIID</th>
                  <td>{{ decoded.card_number }}</td>
                </tr>
                <tr>
                  <th>Clear</th>
                  <td>{{ decoded.clearFull || "(empty)" }}</td>
                </tr>
                <tr>
                  <th>Check</th>
                  <td>{{ decoded.checkFull || "(empty)" }}</td>
                </tr>
                <tr>
                  <th>Start</th>
                  <td>{{ decoded.startFull || "(empty)" }}</td>
                </tr>
                <tr>
                  <th>Start reserve</th>
                  <td class="text-muted font-italic">(not supported — no verified offset)</td>
                </tr>
                <tr>
                  <th>Finish</th>
                  <td>{{ decoded.finishFull || "(empty)" }}</td>
                </tr>
                <tr>
                  <th>Finish reserve</th>
                  <td class="text-muted font-italic">(not supported — no verified offset)</td>
                </tr>
                <tr>
                  <th>Record count</th>
                  <td>{{ decoded.punches.length }} (raw byte: {{ decoded.record_count_raw }})</td>
                </tr>
              </tbody>
            </table>

            <h6 class="font-weight-bold mt-3 mb-2">
              Punches ({{ decoded.punches.length }})
            </h6>
            <div v-if="!decoded.punches.length" class="text-muted small">
              Tidak ada punch tercatat di kartu ini.
            </div>
            <table v-else class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Station</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, idx) in decoded.punches" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ p.station }}</td>
                  <td>{{ p.time }}</td>
                </tr>
              </tbody>
            </table>
          </b-card>
        </b-col>

        <b-col cols="12" lg="6" class="mb-4">
          <b-card>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="font-weight-bold mb-0">Raw JSON</h5>
              <b-button size="sm" variant="outline-secondary" :disabled="!decoded" @click="copyJson">
                <Icon icon="mdi:content-copy" /> Copy
              </b-button>
            </div>
            <pre class="json-view">{{ decodedJson }}</pre>
          </b-card>

          <b-card class="mt-4">
            <h5 class="font-weight-bold mb-3">Event Log</h5>
            <div class="log-view">
              <div v-if="!eventLog.length" class="text-muted small">Belum ada event.</div>
              <div v-for="(l, idx) in eventLog" :key="idx" class="log-line">
                <span class="text-muted">[{{ l.at }}]</span> {{ l.message }}
              </div>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";
import { listPorts } from "@/utils/serialConnection.js";
import { createSportIdentReader } from "@/utils/sportIdentReader.js";
import tone from "@/assets/tone/tone_message.mp3";

export default {
  name: "SiCardTestPage",
  components: { Icon },
  data() {
    return {
      ports: [],
      selectedPath: "",
      isConnected: false,
      isConnecting: false,
      isReadingCard: false,
      reader: null,
      lastEvent: null,
      decoded: null,
      eventLog: [],
      readCounter: 0,
    };
  },
  computed: {
    portOptions() {
      if (!this.ports.length) {
        return [{ value: "", text: "No ports found — click Refresh" }];
      }
      return this.ports.map((p) => ({ value: p.path, text: p.path }));
    },
    decodedJson() {
      return this.decoded ? JSON.stringify(this.decoded, null, 2) : "// Belum ada data";
    },
  },
  async mounted() {
    await this.refreshPorts();
  },
  beforeDestroy() {
    if (this.reader) this.reader.disconnect();
  },
  methods: {
    nowLabel() {
      return new Date().toLocaleTimeString();
    },
    readAtLabel() {
      // Format: DD.MM.YYYY HH:MM:SS (matches the SI-Config+ readout report style)
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },
    log(message) {
      // eslint-disable-next-line no-console
      console.log(`[SI Reader] ${message}`);
      this.eventLog.unshift({ at: this.nowLabel(), message });
      if (this.eventLog.length > 50) this.eventLog.pop();
    },
    playTone() {
      try {
        new Audio(tone).play();
      } catch (err) {
        // gagal play audio bukan fatal
      }
    },
    async refreshPorts() {
      this.ports = await listPorts();
      if (!this.selectedPath && this.ports.length) {
        this.selectedPath = this.ports[0].path;
      }
    },
    notify(type, detail, title) {
      if (this.$bvToast) {
        this.$bvToast.toast(detail, {
          title: title || "SI Reader",
          variant: type === "error" ? "danger" : type,
          solid: true,
        });
      }
    },
    async toggleConnect() {
      if (this.isConnected) {
        if (this.reader) await this.reader.disconnect();
        this.reader = null;
        this.isConnected = false;
        this.log("Disconnected.");
        return;
      }

      this.isConnecting = true;
      this.reader = createSportIdentReader({
        onNotify: (type, detail, title) => this.notify(type, detail, title),
        onCardDetected: (cardType, cardNumber) => {
          this.isReadingCard = true;
          this.lastEvent = { type: "detected", at: this.nowLabel() };
          this.decoded = null;
          this.log(`Kartu terdeteksi: ${cardType} #${cardNumber}`);
        },
        onCardData: (decoded, rawBytes) => {
          this.isReadingCard = false;
          this.readCounter += 1;
          const enriched = {
            no: this.readCounter,
            readAt: this.readAtLabel(),
            ...decoded,
          };
          this.lastEvent = { type: "data", at: this.nowLabel() };
          this.decoded = enriched;
          this.log(`Kartu terbaca: ${decoded.cardType} #${decoded.card_number}, ${decoded.punches.length} punch(es)`);
          this.playTone();
          // eslint-disable-next-line no-console
          console.log("[SI Reader] decoded:", enriched);
          // eslint-disable-next-line no-console
          console.log("[SI Reader] raw bytes:", rawBytes);
        },
        onCardRemoved: () => {
          this.isReadingCard = false;
          this.lastEvent = { type: "removed", at: this.nowLabel() };
          this.log("Kartu dilepas.");
        },
      });

      const res = await this.reader.connect(this.selectedPath);
      this.isConnecting = false;
      if (res.ok) {
        this.isConnected = true;
        this.log(`Connected ke ${this.selectedPath} @ 38400.`);
        this.notify("success", `Connected to ${this.selectedPath}`, "SI Reader");
      } else {
        this.reader = null;
        this.notify("error", (res.error && res.error.message) || "Failed to connect", "SI Reader");
      }
    },
    copyJson() {
      if (!this.decoded) return;
      navigator.clipboard.writeText(this.decodedJson);
      this.notify("success", "JSON copied to clipboard.", "Copied");
    },
  },
};
</script>

<style scoped>
.reading-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.88);
  border-radius: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: si-fade-in 0.15s ease;
}
@keyframes si-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d9534f;
  display: inline-block;
}
.status-dot.connected {
  background: #28a745;
}
.json-view {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 8px;
  max-height: 420px;
  overflow: auto;
  font-size: 12.5px;
}
.log-view {
  max-height: 220px;
  overflow: auto;
}
.log-line {
  font-size: 12.5px;
  padding: 3px 0;
  border-bottom: 1px solid #f0f0f0;
}
</style>
