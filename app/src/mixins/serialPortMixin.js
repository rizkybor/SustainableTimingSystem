import { listPorts } from "@/utils/serialConnection.js";
import { createMicroGateReader } from "@/utils/microGateReader.js";

// Shared "Connect Racetime" serial port handling for all race category pages
// (SprintRace, HeadToHead, SlalomRace, DownRiverRace, RaftingCross). These 5
// pages used to each copy-paste this logic; consolidated here so the connect/
// disconnect/baud behavior, port auto-selection, and notifications stay in
// sync across all of them.
//
// Reads via microGateReader.js (MicroGate RaceTime2) — see its header
// comment and [[project-microgate-racetime2-protocol]] for the confirmed
// M/R marker + a[11] flag protocol details. sportIdentReader.js (SPORTident
// SI cards) is intentionally NOT used here — it stays scoped to the
// SiCardTest dev page since it talks a completely different device/protocol.
export default {
  data() {
    return {
      selectPath: "",
      baudRate: 1200,
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
          const rememberedPort = ports.find((p) => String(p.path) === rememberedPath) || null;
          // Only trust a remembered path if it still looks like a real USB
          // device (has a vendorId). A path saved from an earlier bad
          // auto-pick — e.g. macOS virtual ttys like tty.debug-console /
          // tty.wlan-debug, which have no vendorId and open successfully
          // exactly once before staying OS-locked forever — would otherwise
          // keep getting reused on every connect attempt, always failing
          // with a confusing "Cannot lock port" unrelated to the actual
          // MicroGate device.
          if (rememberedPort && rememberedPort.vendorId) {
            picked = rememberedPort;
          }
        }
        if (!picked) {
          // Prefer a real USB device (has vendorId) over virtual/system
          // ttys, which otherwise sort first on macOS (tty.debug-console,
          // tty.wlan-debug, paired Bluetooth audio devices, etc. — none of
          // which are the RaceTime2).
          picked = ports.find((p) => p.vendorId) || ports[0];
          if (ports.length > 1) {
            this.notifyPort(
              "info",
              `Multiple ports detected, using: ${picked.path}`,
              "Device"
            );
          }
        }

        this.selectPath = picked.path;

        this.serialCtrl = createMicroGateReader({
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

        const res = await this.serialCtrl.connect(picked.path, this.baudRate);
        if (res.ok) {
          this.isPortConnected = true;
          this.port = res.portInfo;
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
