// src/utils/sportIdentReader.js
// SPORTident station (BSM7/BSF7 family, Readout mode, extended protocol)
// communication, ported from a live-hardware-verified reference
// implementation of the SI Communication Protocol (STX/ETX framed, CRC16).
// Confirmed baud rate for this station family: 38400 (independent of the
// legacy STiming boards handled by serialConnection.js, which keep their
// own 9600 default).
import { SerialPort } from "serialport";

const STX = 0x02;
const ETX = 0x03;
const WAKEUP = 0xff;

const C_SI5_DET = 0xe5;
const C_SI6_DET = 0xe6;
const C_SI9_DET = 0xe8;
const C_SI_REM = 0xe7;
const C_GET_SI5 = 0xb1;
const C_GET_SI6 = 0xe1;
const C_GET_SI9 = 0xef;
const P_SI6_CB = 0x08;

function toInt2(bytes) {
  if (bytes.length === 1) return bytes[0] << 8;
  return ((bytes[0] << 8) | bytes[1]) >>> 0;
}

// Re-implementation of SIReader._crc from the SI Programmers manual example.
function crc16(bytesIn) {
  const bytes = bytesIn.slice();
  if (bytes.length < 1) return [0, 0];
  let crc = toInt2(bytes.slice(0, 2));
  let rest = bytes.slice(2);
  rest = rest.length % 2 === 0 ? rest.concat([0, 0]) : rest.concat([0]);
  for (let i = 0; i < rest.length; i += 2) {
    let val = toInt2([rest[i], rest[i + 1]]);
    for (let j = 0; j < 16; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) & 0xffff;
        if ((val & 0x8000) !== 0) crc += 1;
        crc ^= 0x8005;
      } else {
        crc = (crc << 1) & 0xffff;
        if ((val & 0x8000) !== 0) crc += 1;
      }
      crc &= 0xffff;
      val = (val << 1) & 0xffff;
    }
  }
  return [(crc >> 8) & 0xff, crc & 0xff];
}

function buildCommand(command, params) {
  const commandString = [command, params.length, ...params];
  const crc = crc16(commandString);
  return Buffer.from([WAKEUP, STX, ...commandString, ...crc, ETX]);
}

function toIntBE(arr) {
  return arr.reduce((acc, b) => (acc << 8) | b, 0) >>> 0;
}

function decodeCardNr(number) {
  if (number[0] !== 0) return null;
  const nr = toIntBE(number.slice(1, 4));
  if (nr < 500000) {
    const ret = toIntBE(number.slice(2, 4));
    if (number[1] < 2) return ret;
    return number[1] * 100000 + ret;
  }
  return nr;
}

function decodeTimeHHMM(raw2bytes, ptdByte) {
  if (raw2bytes[0] === 0xee && raw2bytes[1] === 0xee) return null;
  let seconds = toInt2(raw2bytes);
  let pm = false;
  if (ptdByte !== null && ptdByte !== undefined) {
    pm = (ptdByte & 0x01) === 1;
  }
  if (pm) seconds += 12 * 3600;
  const h = Math.floor(seconds / 3600) % 24;
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// PTD byte layout (per the SI Communication Protocol reference):
//   bit 0     - am/pm
//   bits 3..1 - day of week, 000 = Sunday ... 110 = Saturday
//   bits 5..4 - week counter (relative, rarely meaningful in practice)
const DOW_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function decodeWeekDay(ptdByte) {
  if (ptdByte === null || ptdByte === undefined) return null;
  const dow = (ptdByte >> 1) & 0b111;
  const week = (ptdByte >> 4) & 0b11;
  const dayName = DOW_NAMES[dow];
  if (!dayName) return null;
  return { week, dayName };
}

// Combines the time-of-day (HH:MM:SS) with the week/day-of-week info encoded
// in the PTD byte, e.g. "1 We 12:02:03" — matches SI-Config+'s own readout
// report format. Returns null if the time itself is unrecorded (TIME_RESET).
function formatFullTimestamp(time, ptdByte) {
  if (time === null) return null;
  const wd = decodeWeekDay(ptdByte);
  if (!wd) return time;
  return `${wd.week} ${wd.dayName} ${time}`;
}

// Offset tables ported from the SI Communication Protocol reference
// (byte offsets within the card data block, per card generation).
const CARD = {
  SI5: { CN2: 6, CN1: 4, CN0: 5, STD: null, ST: 19, FTD: null, FT: 21, CTD: null, CT: 25, LTD: null, LT: null, RC: 23, P1: 32, PL: 3, PM: 30, CN: 0, PTD: null, PTH: 1, PTL: 2, BC: 1 },
  SI6: { CN2: 11, CN1: 12, CN0: 13, STD: 24, ST: 26, FTD: 20, FT: 22, CTD: 28, CT: 30, LTD: 32, LT: 34, RC: 18, P1: 128, PL: 4, PM: 64, PTD: 0, CN: 1, PTH: 2, PTL: 3, BC: 3 },
  SI8: { CN2: 25, CN1: 26, CN0: 27, STD: 12, ST: 14, FTD: 16, FT: 18, CTD: 8, CT: 10, LTD: null, LT: null, RC: 22, P1: 136, PL: 4, PM: 50, PTD: 0, CN: 1, PTH: 2, PTL: 3, BC: 2 },
  SI9: { CN2: 25, CN1: 26, CN0: 27, STD: 12, ST: 14, FTD: 16, FT: 18, CTD: 8, CT: 10, LTD: null, LT: null, RC: 22, P1: 56, PL: 4, PM: 50, PTD: 0, CN: 1, PTH: 2, PTL: 3, BC: 2 },
  pCard: { CN2: 25, CN1: 26, CN0: 27, STD: 12, ST: 14, FTD: 16, FT: 18, CTD: 8, CT: 10, LTD: null, LT: null, RC: 22, P1: 176, PL: 4, PM: 20, PTD: 0, CN: 1, PTH: 2, PTL: 3, BC: 2 },
  SI10: { CN2: 25, CN1: 26, CN0: 27, STD: 12, ST: 14, FTD: 16, FT: 18, CTD: 8, CT: 10, LTD: 32, LT: 34, RC: 22, P1: 128, PL: 4, PM: 64, PTD: 0, CN: 1, PTH: 2, PTL: 3, BC: 8 },
};

// Fields we do NOT have a verified byte offset for on any currently-tested
// card type (Start reserve / Finish reserve — likely SIAC/SI11 dual-punch
// specific). Explicitly marked "unsupported" rather than guessed, so the UI
// never shows a fabricated value.
const UNSUPPORTED = "unsupported";

function decodeCardData(data, cardType) {
  const card = CARD[cardType];
  const cn = decodeCardNr([0, data[card.CN2], data[card.CN1], data[card.CN0]]);
  const stdByte = card.STD !== null ? data[card.STD] : null;
  const ftdByte = card.FTD !== null ? data[card.FTD] : null;
  const ctdByte = card.CTD !== null ? data[card.CTD] : null;
  const ltdByte = card.LTD !== null ? data[card.LTD] : null;

  const clearTime = card.LT !== null ? decodeTimeHHMM(data.slice(card.LT, card.LT + 2), ltdByte) : null;
  const checkTime = decodeTimeHHMM(data.slice(card.CT, card.CT + 2), ctdByte);
  const startTime = decodeTimeHHMM(data.slice(card.ST, card.ST + 2), stdByte);
  const finishTime = decodeTimeHHMM(data.slice(card.FT, card.FT + 2), ftdByte);

  const result = {
    cardType,
    card_number: cn,
    clear: clearTime,
    clearFull: formatFullTimestamp(clearTime, ltdByte),
    check: checkTime,
    checkFull: formatFullTimestamp(checkTime, ctdByte),
    start: startTime,
    startFull: formatFullTimestamp(startTime, stdByte),
    startReserve: UNSUPPORTED,
    finish: finishTime,
    finishFull: formatFullTimestamp(finishTime, ftdByte),
    finishReserve: UNSUPPORTED,
    record_count_raw: data[card.RC],
    punches: [],
  };

  let punchCount = data[card.RC];
  if (cardType === "SI5") punchCount -= 1;
  if (punchCount > card.PM) punchCount = card.PM;
  if (punchCount < 0 || Number.isNaN(punchCount)) punchCount = 0;

  let i = card.P1;
  for (let p = 0; p < punchCount; p++) {
    if (cardType === "SI5" && i % 16 === 0) i += 1;
    if (i + card.PL > data.length) break;
    const ptd = card.PTD !== null ? data[i + card.PTD] : null;
    const station = data[i + card.CN];
    const pt = data.slice(i + card.PTH, i + card.PTL + 1);
    const time = decodeTimeHHMM(pt, ptd);
    if (time !== null) result.punches.push({ station, time });
    i += card.PL;
  }
  return result;
}

/**
 * Factory for a SPORTident (Readout mode) card reader.
 * options: { onCardDetected(type, number), onCardData(decoded, raw), onCardRemoved(), onNotify(type, detail, title) }
 */
export function createSportIdentReader(options) {
  options = options || {};
  const onCardDetected = options.onCardDetected;
  const onCardData = options.onCardData;
  const onCardRemoved = options.onCardRemoved;
  const onNotify = options.onNotify;

  let port = null;
  let rx = [];
  let cardType = null;
  let cardCollectedData = [];
  let pendingBlocks = 0;
  let nextBlockIndex = 0;

  function notify(type, detail, title) {
    if (typeof onNotify === "function") onNotify(type, detail, title || "SI Reader");
  }

  function tryParseFrames() {
    for (;;) {
      const stxIdx = rx.indexOf(STX);
      if (stxIdx === -1) {
        if (rx.length > 0) rx = [];
        return;
      }
      if (stxIdx > 0) rx = rx.slice(stxIdx);
      if (rx.length < 5) return;
      const cmd = rx[1];
      const length = rx[2];
      const totalLen = 1 + 1 + 1 + length + 2 + 1;
      if (rx.length < totalLen) return;
      const frame = rx.slice(0, totalLen);
      rx = rx.slice(totalLen);
      const data = frame.slice(5, 5 + (length - 2));
      handleFrame(cmd, data);
    }
  }

  function requestNextBlock() {
    if (pendingBlocks <= 0) {
      finishCardRead();
      return;
    }
    port.write(buildCommand(C_GET_SI9, [nextBlockIndex]));
    nextBlockIndex += 1;
    pendingBlocks -= 1;
  }

  function finishCardRead() {
    if (!cardType) return;
    const decoded = decodeCardData(cardCollectedData, cardType);
    if (typeof onCardData === "function") {
      onCardData(decoded, cardCollectedData.slice());
    }
  }

  function handleFrame(cmd, data) {
    if (cmd === C_SI_REM) {
      cardType = null;
      cardCollectedData = [];
      pendingBlocks = 0;
      if (typeof onCardRemoved === "function") onCardRemoved();
      return;
    }

    if (cmd === C_SI5_DET) {
      const cn = decodeCardNr(data.slice(0, 4));
      cardType = "SI5";
      cardCollectedData = [];
      if (typeof onCardDetected === "function") onCardDetected(cardType, cn);
      port.write(buildCommand(C_GET_SI5, []));
      return;
    }

    if (cmd === C_SI6_DET) {
      const cn = toIntBE(data);
      cardType = "SI6";
      cardCollectedData = [];
      if (typeof onCardDetected === "function") onCardDetected(cardType, cn);
      port.write(buildCommand(C_GET_SI6, [P_SI6_CB]));
      return;
    }

    if (cmd === C_SI9_DET) {
      const cn = toIntBE(data.slice(1));
      let t = "SI9";
      if (cn >= 2000000 && cn <= 2999999) t = "SI8";
      else if (cn >= 1000000 && cn <= 1999999) t = "SI9";
      else if (cn >= 4000000 && cn <= 4999999) t = "pCard";
      else if (cn >= 7000000 && cn <= 9999999) t = "SI10";
      cardType = t;
      cardCollectedData = [];
      if (typeof onCardDetected === "function") onCardDetected(cardType, cn);
      // Read blocks SEQUENTIALLY (wait for each reply before requesting the
      // next) — firing all block reads at once caused the station to only
      // reliably answer the first one, silently dropping punch data beyond
      // block 0.
      pendingBlocks = CARD[t].BC;
      nextBlockIndex = 0;
      requestNextBlock();
      return;
    }

    // Reply to a GET_SI5 / GET_SI6 / GET_SI9 command: first byte is a
    // reserved/unused byte per the protocol, drop it before appending.
    if (cardType && data.length > 0) {
      cardCollectedData = cardCollectedData.concat(data.slice(1));
      if (cardType === "SI5" || cardType === "SI6") {
        // SI5/SI6 readout completes after a single reply.
        finishCardRead();
      } else {
        requestNextBlock();
      }
    }
  }

  function connect(path) {
    return new Promise((resolve) => {
      if (!path) {
        notify("warning", "No serial port path given.", "SI Reader");
        resolve({ ok: false });
        return;
      }
      const candidate = new SerialPort({ path, baudRate: 38400 }, (err) => {
        if (err) {
          notify("error", err.message, "SI Reader setup failed");
          port = null;
          resolve({ ok: false, error: err });
          return;
        }
        resolve({ ok: true });
      });
      port = candidate;
      port.on("data", (chunk) => {
        rx.push(...chunk);
        tryParseFrames();
      });
      port.on("error", (err) => {
        notify("error", err.message, "SI Reader error");
      });
    });
  }

  async function disconnect() {
    if (port && port.isOpen) {
      port.removeAllListeners("close");
      await new Promise((resolve) => port.close(resolve));
    }
    port = null;
    rx = [];
    cardType = null;
    cardCollectedData = [];
  }

  return { connect, disconnect };
}
