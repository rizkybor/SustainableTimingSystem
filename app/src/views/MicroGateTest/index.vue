<template>
  <div class="mg-test-page">
    <b-container class="py-4">
      <div class="mb-4">
        <b-badge variant="warning" class="mb-2">Temporary / Dev Page</b-badge>
        <h2 class="font-weight-bold mb-1">MicroGate (RaceTime2) Reader Test</h2>
        <p class="text-muted mb-0">
          Parsing memakai pola marker 'M'/'R' yang sama seperti
          serialConnection.js. Flag di <code>a[11]</code> ('0' = start, '2' =
          finish) sudah terverifikasi lewat tombol Start/Stop asli di
          RaceTime2. Tombol Lap belum diuji (tidak dipakai di deployment ini)
          — kalau nanti perlu Lap, capture dulu frame aslinya sebelum
          menambahkan flag baru.
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
          <b-form-select
            v-model="selectedBaud"
            :options="baudOptions"
            :disabled="isConnected || isConnecting"
            style="max-width: 160px"
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
          <span class="text-muted small">
            {{ isConnected ? `Connected @ ${selectedBaud}` : "Disconnected" }}
          </span>
        </div>
      </b-card>

      <b-row>
        <b-col cols="12" lg="6" class="mb-4">
          <b-card>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="font-weight-bold mb-0">Decoded Events ({{ events.length }})</h5>
              <b-button size="sm" variant="outline-danger" :disabled="!events.length" @click="events = []">
                <Icon icon="mdi:trash-can-outline" /> Clear
              </b-button>
            </div>
            <div v-if="!events.length" class="text-muted text-center py-4">
              Belum ada frame ter-decode. Setiap frame (diakhiri marker M/R)
              akan muncul di sini, ditandai Start/Finish/Unknown sesuai flag.
            </div>
            <div v-else class="log-view">
              <div v-for="(e, idx) in events" :key="idx" class="log-line">
                <span class="text-muted">[{{ e.at }}]</span>
                <b-badge :variant="e.kind === 'start' ? 'success' : e.kind === 'finish' ? 'primary' : 'secondary'" class="ml-1">
                  {{ e.kind }}
                </b-badge>
                <span class="log-text">{{ e.formatted || "(no time payload)" }}</span>
                <div class="log-hex text-muted">a={{ JSON.stringify(e.a) }} b={{ JSON.stringify(e.b) }} flag={{ e.flag }}</div>
              </div>
            </div>
          </b-card>
        </b-col>

        <b-col cols="12" lg="6" class="mb-4">
          <b-card>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="font-weight-bold mb-0">Raw Log ({{ rawLines.length }})</h5>
              <div style="display: flex; gap: 8px">
                <b-button size="sm" variant="outline-secondary" :disabled="!rawLines.length" @click="copyLog">
                  <Icon icon="mdi:content-copy" /> Copy
                </b-button>
                <b-button size="sm" variant="outline-danger" :disabled="!rawLines.length" @click="rawLines = []">
                  <Icon icon="mdi:trash-can-outline" /> Clear
                </b-button>
              </div>
            </div>
            <div v-if="!rawLines.length" class="text-muted text-center py-4">
              Belum ada data masuk.
            </div>
            <div v-else class="log-view">
              <div v-for="(l, idx) in rawLines" :key="idx" class="log-line">
                <span class="text-muted">[{{ l.at }}]</span>
                <span class="log-hex">{{ l.hex }}</span>
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
import { createMicroGateReader } from "@/utils/microGateReader.js";

export default {
  name: "MicroGateTestPage",
  components: { Icon },
  data() {
    return {
      ports: [],
      selectedPath: "",
      selectedBaud: 1200,
      baudOptions: [1200, 2400, 9600],
      isConnected: false,
      isConnecting: false,
      reader: null,
      events: [],
      rawLines: [],
    };
  },
  computed: {
    portOptions() {
      if (!this.ports.length) {
        return [{ value: "", text: "No ports found — click Refresh" }];
      }
      return this.ports.map((p) => ({ value: p.path, text: p.path }));
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
    async refreshPorts() {
      this.ports = await listPorts();
      if (!this.selectedPath && this.ports.length) {
        this.selectedPath = this.ports[0].path;
      }
    },
    notify(type, detail, title) {
      if (this.$bvToast) {
        this.$bvToast.toast(detail, {
          title: title || "MicroGate Reader",
          variant: type === "error" ? "danger" : type,
          solid: true,
        });
      }
    },
    pushEvent(kind, formatted, a, b) {
      const flag = a && a.length > 11 ? a[11] : undefined;
      this.events.unshift({ at: this.nowLabel(), kind, formatted, a, b, flag });
      if (this.events.length > 300) this.events.pop();
    },
    async toggleConnect() {
      if (this.isConnected) {
        if (this.reader) await this.reader.disconnect();
        this.reader = null;
        this.isConnected = false;
        return;
      }

      this.isConnecting = true;
      this.reader = createMicroGateReader({
        baudRate: this.selectedBaud,
        onNotify: (type, detail, title) => this.notify(type, detail, title),
        onRawChunk: (hex) => {
          this.rawLines.unshift({ at: this.nowLabel(), hex });
          if (this.rawLines.length > 500) this.rawLines.pop();
        },
        onData: (a, b) => {
          // eslint-disable-next-line no-console
          console.log(`[MicroGate] data a=${JSON.stringify(a)} b=${JSON.stringify(b)}`);
          const flag = a && a.length > 11 ? a[11] : undefined;
          if (flag !== "0" && flag !== "2") this.pushEvent("unknown", null, a, b);
        },
        onStart: (formatted, a, b) => this.pushEvent("start", formatted, a, b),
        onFinish: (formatted, a, b) => this.pushEvent("finish", formatted, a, b),
      });

      const res = await this.reader.connect(this.selectedPath, this.selectedBaud);
      this.isConnecting = false;
      if (res.ok) {
        this.isConnected = true;
        this.notify("success", `Connected to ${this.selectedPath} @ ${this.selectedBaud}`, "MicroGate Reader");
      } else {
        this.reader = null;
        this.notify("error", (res.error && res.error.message) || "Failed to connect", "MicroGate Reader");
      }
    },
    copyLog() {
      if (!this.rawLines.length) return;
      const text = this.rawLines
        .slice()
        .reverse()
        .map((l) => `[${l.at}] ${l.hex}`)
        .join("\n");
      navigator.clipboard.writeText(text);
      this.notify("success", "Log copied to clipboard.", "Copied");
    },
  },
};
</script>

<style scoped>
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
.log-view {
  max-height: 520px;
  overflow: auto;
}
.log-line {
  font-size: 12.5px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}
.log-text {
  margin-left: 6px;
  font-family: monospace;
}
.log-hex {
  font-family: monospace;
  font-size: 11px;
  margin-left: 6px;
}
</style>
