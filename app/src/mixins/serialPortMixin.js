import { createSerialReader, listPorts } from "@/utils/serialConnection.js";

// Shared "Connect Racetime" serial port handling for all race category pages
// (SprintRace, HeadToHead, SlalomRace, DownRiverRace, RaftingCross). These 5
// pages used to each copy-paste this logic; consolidated here so the connect/
// disconnect/baud behavior, port auto-selection, and notifications stay in
// sync across all of them.
export default {
  data() {
    return {
      selectPath: "",
      baudRate: 9600,
      baudOptions: [1200, 2400, 9600],
      serialCtrl: null,
      port: null,
      isPortConnected: false,
      isConnectingPort: false,
      digitId: [],
      digitTime: [],
      digitTimeStart: null,
      digitTimeFinish: null,
      currentPort: [],
    };
  },

  beforeDestroy() {
    if (this.serialCtrl) {
      this.serialCtrl.disconnect();
    }
  },

  methods: {
    notifyPort(type, detail, title) {
      if (!this.$bvToast) return;
      var variant = type === "error" ? "danger" : type;
      this.$bvToast.toast(detail, {
        title: title || "Device",
        variant: variant,
        solid: true,
      });
    },

    _lastPortStorageKey() {
      return "serialPort:lastPath:" + (this.$options.name || "default");
    },

    async connectPort() {
      if (this.isPortConnected) {
        await this.disconnectPort();
        this.notifyPort("info", "Serial port disconnected.", "Device");
        return;
      }

      if (this.isConnectingPort) return;
      this.isConnectingPort = true;

      try {
        const ports = await listPorts();
        this.currentPort = ports;

        if (!ports || ports.length === 0) {
          this.notifyPort("warning", "No serial ports available.", "Device");
          return;
        }

        const rememberedPath = window.localStorage.getItem(this._lastPortStorageKey());
        let picked = null;
        if (rememberedPath) {
          picked = ports.find((p) => String(p.path) === rememberedPath) || null;
        }
        if (!picked) {
          picked = ports[0];
          if (ports.length > 1) {
            this.notifyPort(
              "info",
              `Multiple ports detected, using: ${picked.path}`,
              "Device"
            );
          }
        }

        this.selectPath = picked.path;

        this.serialCtrl = createSerialReader({
          path: picked.path,
          baudRate: this.baudRate,
          onNotify: (type, detail, message) => this.notifyPort(type, detail, message),
          onData: (a, b) => {
            this.digitId.unshift(a);
            this.digitTime.unshift(b);
          },
          onStart: (formatted) => {
            this.digitTimeStart = formatted;
          },
          onFinish: (formatted) => {
            this.digitTimeFinish = formatted;
          },
          onClose: () => {
            this.isPortConnected = false;
            this.serialCtrl = null;
            this.port = null;
            this.notifyPort("warning", "Serial device disconnected unexpectedly.", "Device");
          },
        });

        const res = await this.serialCtrl.connect();
        if (res.ok) {
          this.isPortConnected = true;
          this.port = this.serialCtrl.port;
          window.localStorage.setItem(this._lastPortStorageKey(), picked.path);
          this.notifyPort("success", `Connected to ${picked.path}.`, "Device");
        } else {
          this.isPortConnected = false;
          this.serialCtrl = null;
          const msg = (res.error && res.error.message) || "No valid serial port found / failed to open.";
          this.notifyPort("error", msg, "Device");
        }
      } finally {
        this.isConnectingPort = false;
      }
    },

    async disconnectPort() {
      try {
        if (this.serialCtrl) await this.serialCtrl.disconnect();
      } finally {
        this.port = null;
        this.serialCtrl = null;
        this.isPortConnected = false;
        this.selectPath = "";
      }
    },

    setBaud(br) {
      this.baudRate = br;
    },
  },
};
