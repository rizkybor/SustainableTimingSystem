// src/utils/serialConnection.js
import { SerialPort } from "serialport";

/** "HHMMSSmmm" -> "HH:MM:SS.mmm" */
function formatTime(raw = "") {
  return String(raw).replace(/(\d{2})(\d{2})(\d{2})(\d{3})/, "$1:$2:$3.$4");
}

export async function listPorts() {
  try {
    return await SerialPort.list();
  } catch (err) {
    return [];
  }
}

/**
 * Factory pembaca serial dengan callback
 */
export function createSerialReader(options) {
  options = options || {};
  var baudRate = typeof options.baudRate === "number" ? options.baudRate : 9600;
  var path = options.path || null;
  var portIndex = typeof options.portIndex === "number" ? options.portIndex : 0;
  var onData = options.onData;
  var onStart = options.onStart;
  var onFinish = options.onFinish;
  var onNotify = options.onNotify;

  var port = null;
  var buffer = "";

  function notify(type, detail, message) {
    if (typeof onNotify === "function") {
      onNotify(type, detail, message || "Device");
    }
  }

  function handleData(chunk) {
    buffer += chunk.toString();

    // Cari marker pertama 'M' atau 'R'
    var idx = buffer.search(/[MR]/);
    if (idx !== -1) {
      var a = buffer.slice(0, idx + 1); // termasuk marker
      var b = buffer.slice(idx + 1);    // sisa data
      buffer = "";

      if (typeof onData === "function") onData(a, b);

      var flag = a && a.length > 11 ? a[11] : undefined;
      if (flag === "0") {
        var vStart = formatTime(b);
        if (typeof onStart === "function") onStart(vStart, a, b);
      } else if (flag === "2") {
        var vFinish = formatTime(b);
        if (typeof onFinish === "function") onFinish(vFinish, a, b);
      }
    }
  }

  async function connect() {
    try {
      var ports = await SerialPort.list();
      if (!ports || ports.length === 0) {
        notify("warning", "No serial ports available.", "Device");
        return { ok: false };
      }

      var picked = null;
      if (path) {
        picked = ports.find(function (p) { return p.path === path; }) || null;
      } else {
        picked = ports[portIndex] || null;
      }

      if (!picked || !picked.path) {
        notify("warning", "Selected serial port path is undefined.", "Device");
        return { ok: false };
      }

      port = new SerialPort({ path: picked.path, baudRate: baudRate });
      port.on("data", handleData);
      port.on("error", function (err) {
        var msg = (err && err.message) ? err.message : String(err);
        notify("error", msg, "Serial error");
      });

      return { ok: true, portInfo: picked };
    } catch (err) {
      var msg = (err && err.message) ? err.message : String(err);
      notify("error", msg, "Serial setup failed");
      return { ok: false, error: err };
    }
  }

  async function disconnect() {
    if (port && port.isOpen) {
      await new Promise(function (resolve) { port.close(resolve); });
    }
    port = null;
    buffer = "";
  }

  return {
    connect: connect,
    disconnect: disconnect,
    get port() { return port; },
  };
}