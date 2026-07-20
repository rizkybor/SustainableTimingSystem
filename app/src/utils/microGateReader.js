// src/utils/microGateReader.js
// MicroGate (RaceTime2) reader.
//
// Live capture against the actual device (RaceTime2, RS232 -> CH340
// USB-serial, baud rate configurable on the device itself to 1200/2400/9600)
// showed frames of the shape:
//
//   <header ending in 'M' or 'R'><space><9-digit payload><CR>
//   e.g. "00180022001000000M 005113049\r"
//
// which is the SAME marker/flag convention originally used by
// serialConnection.js's now-removed createSerialReader() for the legacy
// STiming boards (dropped once every page migrated to this module — see
// git history for the original if ever needed): search the buffer for the
// first 'M' or 'R', split it into a header (`a`, up to and including the
// marker) and the remaining payload (`b`), then read a flag character out of
// the header to decide what the payload means.
//
// The flag position/values (`a[11]`, '0' = start / '2' = finish) are ported
// from that legacy logic, and CONFIRMED live against this device:
// while idle, RaceTime2 streams a continuous heartbeat with flag '0' (fires
// onStart, payload = a running HH:MM:SS.mmm clock); pressing STOP flips the
// flag to '2' (fires onFinish) on the very next frame, header digits shift
// accordingly, payload keeps decoding correctly via formatTime(). LAP was
// not exercised (not used in this deployment) so the 'R' marker branch and
// any lap-specific flag value remain unverified — if lap support is needed
// later, capture real LAP-triggered frames before assuming a flag value for
// it, same as was done here for start/finish.
//
// One important deviation from a literal port: serialConnection.js assumes
// a full frame (header + marker + payload) arrives in a single 'data' event,
// which held for the legacy board it was written for. At RaceTime2's 1200
// baud, Node delivers data far more granularly (often one byte per 'data'
// event), so firing the instant the marker character itself arrives cuts
// the frame off before its payload exists yet. Fixed by additionally
// waiting for the trailing '\r' every real frame was observed to end with
// before splitting off `a`/`b` — see handleChunk() below.
import { SerialPort } from "serialport";

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

/** "HHMMSSmmm" -> "HH:MM:SS.mmm" — identical to serialConnection.js's formatTime(). */
function formatTime(raw = "") {
  return String(raw).replace(/(\d{2})(\d{2})(\d{2})(\d{3})/, "$1:$2:$3.$4");
}

/**
 * Factory for a MicroGate (RaceTime2) reader.
 * options:
 *   - baudRate: number (default 1200 — RaceTime2's currently configured
 *     rate; the device also supports 2400/9600, pass to match its setting).
 *   - onData(a, b): called for every frame, marker-delimited exactly like
 *     serialConnection.js's onData — `a` is the header up to and including
 *     the 'M'/'R' marker, `b` is the remaining payload.
 *   - onStart(formattedTime, a, b): called when the header's flag byte
 *     (`a[11]`) is "0". `formattedTime` is `b` run through formatTime().
 *   - onFinish(formattedTime, a, b): called when the flag byte is "2".
 *   - onRawChunk(hex): every raw chunk exactly as received off the wire,
 *     before marker-splitting — kept for debugging/verifying new frame
 *     shapes against real button presses.
 *   - onNotify(type, detail, title): connection/error notifications.
 *   - onClose(portInfo): called when the port closes unexpectedly (device
 *     unplugged, cable fault) — NOT called on a deliberate disconnect().
 */
export function createMicroGateReader(options) {
  options = options || {};
  const baudRate = typeof options.baudRate === "number" ? options.baudRate : 1200;
  const onData = options.onData;
  const onStart = options.onStart;
  const onFinish = options.onFinish;
  const onRawChunk = options.onRawChunk;
  const onNotify = options.onNotify;
  const onClose = options.onClose;

  let port = null;
  let buffer = "";
  let openingPromise = null; // non-null while a connect() call's SerialPort open is in flight

  function notify(type, detail, title) {
    if (typeof onNotify === "function") onNotify(type, detail, title || "MicroGate Reader");
  }

  function handleChunk(chunk) {
    if (typeof onRawChunk === "function") onRawChunk(toHex(chunk));

    buffer += chunk.toString();

    // Cari marker pertama 'M' atau 'R' — same convention as serialConnection.js.
    // UNLIKE serialConnection.js's legacy board, RaceTime2 at 1200 baud
    // arrives byte-by-byte (each 'data' event can be a single character), so
    // firing the instant the marker character itself shows up would cut the
    // frame off before its payload has actually arrived (verified live: `b`
    // came back empty and the payload bled into the *next* frame instead).
    // Real captured frames are consistently terminated by '\r'
    // (e.g. "00180022001000000M 005113049\r"), so wait for that terminator
    // too before splitting off `a`/`b` — same header/flag shape, just frame
    // boundary aware.
    for (;;) {
      const idx = buffer.search(/[MR]/);
      if (idx === -1) return;

      const crIdx = buffer.indexOf("\r", idx + 1);
      if (crIdx === -1) return; // payload not fully arrived yet — wait for more bytes

      const a = buffer.slice(0, idx + 1); // termasuk marker
      const b = buffer.slice(idx + 1, crIdx); // sisa data sampai sebelum CR
      buffer = buffer.slice(crIdx + 1); // sisakan apa pun setelah CR untuk frame berikutnya

      if (typeof onData === "function") onData(a, b);

      const flag = a && a.length > 11 ? a[11] : undefined;
      if (flag === "0") {
        const vStart = formatTime(b);
        if (typeof onStart === "function") onStart(vStart, a, b);
      } else if (flag === "2") {
        const vFinish = formatTime(b);
        if (typeof onFinish === "function") onFinish(vFinish, a, b);
      }
    }
  }

  // List the ports and resolve the requested one from that list (rather
  // than trusting a bare path string), and only then open it. This catches
  // a stale/unplugged path with a clear "not found" message instead of
  // letting SerialPort fail open with an opaque OS-level error. Same
  // connect() shape used across this project's serial readers — see
  // [[feedback-serial-reader-connect-pattern]] in memory.
  async function connect(path, overrideBaudRate) {
    const effectiveBaud = typeof overrideBaudRate === "number" ? overrideBaudRate : baudRate;
    try {
      const ports = await SerialPort.list();
      if (!ports || ports.length === 0) {
        notify("warning", "No serial ports available.", "MicroGate Reader");
        return { ok: false };
      }

      const picked = path ? ports.find((p) => p.path === path) || null : ports[0];
      if (!picked || !picked.path) {
        notify("warning", "Selected serial port path is undefined.", "MicroGate Reader");
        return { ok: false };
      }

      let resolveOpening;
      openingPromise = new Promise((resolve) => {
        resolveOpening = resolve;
      });

      const opened = await new Promise((resolve) => {
        const candidate = new SerialPort({ path: picked.path, baudRate: effectiveBaud }, (err) => {
          // Signal disconnect() (if it's waiting) that the open attempt has
          // settled — verified live that calling port.close() before the
          // node-serialport binding considers the port open silently does
          // NOT queue/release it, it just no-ops, leaving the OS handle
          // locked until the whole process exits ("Cannot lock port" on the
          // next attempt).
          resolveOpening();
          if (err) {
            resolve({ ok: false, error: err });
            return;
          }
          resolve({ ok: true });
        });
        port = candidate;
      });
      openingPromise = null;

      if (!opened.ok) {
        const openMsg = (opened.error && opened.error.message) || String(opened.error);
        notify("error", openMsg, "MicroGate Reader setup failed");
        port = null;
        return { ok: false, error: opened.error };
      }

      port.on("data", handleChunk);
      port.on("error", (err) => {
        notify("error", err.message, "MicroGate Reader error");
      });
      port.on("close", () => {
        const wasPort = port;
        port = null;
        buffer = "";
        if (typeof onClose === "function") onClose(wasPort);
      });

      return { ok: true, portInfo: picked, baudRate: effectiveBaud };
    } catch (err) {
      const msg = (err && err.message) || String(err);
      notify("error", msg, "MicroGate Reader setup failed");
      return { ok: false, error: err };
    }
  }

  async function disconnect() {
    // If disconnect() lands while connect()'s SerialPort is still mid-open
    // (e.g. the page/component was left right after clicking Connect),
    // calling .close() before the binding considers the port open silently
    // no-ops instead of releasing the OS handle — verified live, it leaves
    // the port locked ("Resource temporarily unavailable" / "Cannot lock
    // port") until the whole process exits. Wait for the open to actually
    // settle first, THEN decide whether there's something to close.
    if (openingPromise) await openingPromise;

    if (port) {
      // Drop the 'close' listener first so a deliberate disconnect doesn't
      // also fire onClose's "unexpected disconnection" handling.
      port.removeAllListeners("close");
      // Deliberately NOT gated on `port.isOpen`: it was observed live to
      // still read `false` for a moment right after the open callback above
      // has already fired with no error (an internal-state timing lag in
      // the serialport binding) — gating on it here reintroduces the same
      // handle leak this function exists to avoid. close() on an
      // already-open port is always safe to call.
      await new Promise((resolve) => port.close(() => resolve()));
    }
    port = null;
    buffer = "";
  }

  return { connect, disconnect };
}
