import { listPorts } from "@/utils/serialConnection.js";
import { createMicroGateReader } from "@/utils/microGateReader.js";

// RaceTime2 pada mesin ini SELALU muncul di path tetap ini (dicek manual
// oleh user) — jadi Connect Racetime langsung cari path ini persis, bukan
// auto-pick/heuristik lagi. Kalau device-nya diganti/di-reflash macOS-nya
// dan path berubah, update konstanta ini.
const TARGET_PORT_PATH = "/dev/tty.usbserial-1130";

// Shared "Connect Racetime" serial port handling for all race category pages
// (SprintRace, HeadToHead, SlalomRace, DownRiverRace, RaftingCross). These 5
// pages used to each copy-paste this logic; consolidated here so the connect/
// disconnect/baud behavior and notifications stay in sync across all of them.
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
      // not part of the UI/render — plain instance flag consulted inside
      // connectPort()'s async continuations after the component may already
      // be gone (see beforeDestroy() below)
      _serialMixinDestroyed: false,
    };
  },

  beforeDestroy() {
    // Flip this BEFORE calling disconnect() so an in-flight connectPort()
    // (still awaiting listPorts()/serialCtrl.connect() at the moment the
    // page is navigated away from) knows to close whatever it opens next
    // instead of leaving it dangling — see the two `if
    // (this._serialMixinDestroyed)` checks in connectPort() below.
    this._serialMixinDestroyed = true;
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

    async connectPort() {
      // Guard BOTH branches (connect AND disconnect) with the same busy
      // flag — the template disables the button while isConnectingPort is
      // true, so this also stops a rapid double-click on "Disconnect" from
      // calling disconnectPort() twice concurrently on the same serialCtrl
      // (isPortConnected only flips to false in disconnectPort()'s own
      // finally block, so without this guard a second click landing before
      // that resolves would race the first call's port.close()).
      if (this.isConnectingPort) return;
      this.isConnectingPort = true;

      try {
        if (this.isPortConnected) {
          await this.disconnectPort();
          this.notifyPort("info", "Serial port disconnected.", "Device");
          return;
        }

        const ports = await listPorts();
        if (this._serialMixinDestroyed) return; // page navigated away mid-scan
        this.currentPort = ports;

        const picked = (ports || []).find((p) => p.path === TARGET_PORT_PATH);
        if (!picked) {
          this.notifyPort("error", "cannot reader serial", "Device");
          return;
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
            this.selectPath = "";
            this.notifyPort("warning", "Serial device disconnected unexpectedly.", "Device");
          },
        });

        const res = await this.serialCtrl.connect(picked.path, this.baudRate);

        // NOTE: no `_serialMixinDestroyed` check needed here (unlike the one
        // right after listPorts() above). If the page was navigated away
        // while THIS connect() call was in flight, beforeDestroy() already
        // ran with `this.serialCtrl` already assigned (it's set synchronously
        // a few lines up, before this await) and called
        // `this.serialCtrl.disconnect()` on that exact instance —
        // microGateReader's internal `openingPromise` gating makes that call
        // correctly wait for this same open attempt to settle and then close
        // it. Adding a second disconnect() call here would race that one on
        // the same underlying port.

        if (res.ok) {
          this.isPortConnected = true;
          this.port = res.portInfo;
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
