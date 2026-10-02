import { listPorts } from "@/utils/serialConnection.js";
import { createMicroGateReader } from "@/utils/microGateReader.js";
import { reportFrame } from "@/services/photofinish";
import { getRecent as lrGetRecent, onRecall as lrOnRecall, onStart as lrOnStart, reportHeartbeat as lrHeartbeat } from "@/services/longrange";

// RaceTime2 pada mesin ini SELALU muncul di path tetap ini (dicek manual
// oleh user) — jadi Connect Racetime langsung cari path ini persis, bukan
// auto-pick/heuristik lagi. Kalau device-nya diganti/di-reflash macOS-nya
// dan path berubah, update konstanta ini.
const TARGET_PORT_PATH = "/dev/tty.usbserial-1130";

// STS Long Range Start: start dari pistol PS-77 di garis start jauh masuk ke
// Buffer-Timer-Start + baris live feed. Registration Id meniru bentuk frame
// RaceTime2 (19 karakter, marker "R") seperti baris Photo Finish, tetapi
// berawalan "LR": "LR" + nomor urut 7 digit + HHMMSSmmm + "R"; Racetime
// "LR" + HHMMSSmmm. Nomor urut di localStorage → unik walau aplikasi dibuka ulang.
const LR_SEQ_KEY = "lr.registrationSeq";
// Start yang tiba saat halaman race belum dibuka tetap dimuat bila belum selama ini.
const LR_RECENT_MS = 10 * 60 * 1000;

function nextLrSeq() {
  let seq = 0;
  try {
    seq = Number(window.localStorage.getItem(LR_SEQ_KEY)) || 0;
  } catch (_e) {
    seq = 0;
  }
  seq = (seq + 1) % 10000000;
  try {
    window.localStorage.setItem(LR_SEQ_KEY, String(seq));
  } catch (_e) {
    // localStorage tidak tersedia — nomor tetap unik selama aplikasi terbuka
  }
  return seq;
}

function lrRawTime(time) {
  return (String(time || "").replace(/\D+/g, "") + "000000000").slice(0, 9);
}

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

  mounted() {
    this._lrOff = [lrOnStart((entry) => this.lrApplyStart(entry, true)), lrOnRecall((entry) => this.lrApplyRecall(entry))];
    lrGetRecent().then((list) => {
      const last = (list || []).find((e) => e.kind === "START");
      if (!last || last.recalled || this.digitTimeStart || this._serialMixinDestroyed) return;
      if (Date.now() - Date.parse(last.receivedAt) > LR_RECENT_MS) return;
      this.lrApplyStart(last, false);
    });
  },

  beforeDestroy() {
    if (this._lrOff) this._lrOff.forEach((off) => off());
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
          onStart: (formatted, _a, _b, meta) => {
            this.digitTimeStart = formatted;
            // STS Photo Finish: frame start yg membawa jam berjalan = heartbeat sinkron jam.
            reportFrame("start", formatted, meta, this.baudRate);
            // STS Long Range Start: acuan jam RaceTime2 untuk waktu start garis start jauh.
            lrHeartbeat(formatted, meta, this.baudRate);
          },
          onFinish: (formatted, _a, _b, meta) => {
            this.digitTimeFinish = formatted;
            // STS Photo Finish: SETIAP sinyal finish dikirim & disimpan (tidak tertimpa).
            reportFrame("finish", formatted, meta, this.baudRate);
          },
          // LAP frame (a[11]="0" + a[13]="1", lihat komentar
          // createMicroGateReader() di microGateReader.js) — per instruksi
          // operator, waktunya masuk ke field yang SAMA dgn Finish (bukan
          // Start), jadi disamakan persis dgn handler onFinish di atas.
          onLap: (formatted, _a, _b, meta) => {
            this.digitTimeFinish = formatted;
            reportFrame("finish", formatted, meta, this.baudRate);
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

    /** Start dari STS Long Range Start → baris live feed "LR…" + Buffer-Timer-Start. */
    lrApplyStart(entry, notify) {
      if (!entry || !entry.time) return;
      this.digitId.unshift("LR" + String(nextLrSeq()).padStart(7, "0") + lrRawTime(entry.time) + "R");
      this.digitTime.unshift("LR" + lrRawTime(entry.time));
      this.digitTimeStart = entry.time;
      const where = [entry.raceId, entry.wave ? "wave " + entry.wave : null, entry.deviceName].filter(Boolean).join(" · ");
      const warn = !entry.clockSynced || !entry.starterClockSynced;
      if (entry.recomputed) {
        this.notifyPort(
          "info",
          "Start dihitung ulang dengan kalibrasi baru: " + (entry.originalTime || "?") + " → " + entry.time + ". Bila waktu lama sudah ditetapkan ke BIB, ubah di tim tersebut.",
          "Long Range Start"
        );
        return;
      }
      this.notifyPort(
        warn ? "warning" : "success",
        (notify ? "Start " : "Start terakhir dimuat: ") +
          entry.time +
          (where ? " (" + where + ")" : "") +
          (warn ? " — jam belum tersinkron, periksa waktunya." : ". Tekan tombol BIB untuk menetapkan."),
        "Long Range Start"
      );
    },

    /** Recall / false start → kosongkan Buffer-Timer-Start bila masih berisi start tersebut. */
    lrApplyRecall(entry) {
      if (!entry) return;
      const cleared = !!(entry.refTime && this.digitTimeStart === entry.refTime);
      if (cleared) this.digitTimeStart = "";
      this.notifyPort(
        "danger",
        "RECALL / false start" +
          (entry.refTime ? " untuk start " + entry.refTime : "") +
          (cleared ? " — Buffer-Timer-Start dikosongkan." : ". Bila waktu itu sudah ditetapkan ke BIB, ubah manual."),
        "Long Range Start"
      );
    },
  },
};
