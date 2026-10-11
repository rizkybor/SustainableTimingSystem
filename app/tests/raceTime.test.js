// Jalankan: yarn test  (atau: node --test tests/)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseClockMs,
  formatClockMs,
  clockDiff,
  clockAdd,
  secondsToClock,
} from "../src/lib/raceTime.js";

test("parseClockMs: format standar 3 digit", () => {
  assert.equal(parseClockMs("00:10:00.009"), 600009);
  assert.equal(parseClockMs("01:02:03.456"), 3723456);
  assert.equal(parseClockMs("00:00:00.000"), 0);
});

test("parseClockMs: pecahan dibaca sbg pecahan (perbaikan bug lama)", () => {
  assert.equal(parseClockMs("00:00:01.5"), 1500); // dulu 1005
  assert.equal(parseClockMs("00:00:01.09"), 1090); // dulu 1009
  assert.equal(parseClockMs("00:00:01.1234"), 1123); // dulu 2234 (melimpah)
});

test("parseClockMs: bagian hilang & input tidak valid", () => {
  assert.equal(parseClockMs("00:05"), 300000 * 0 + 5 * 60000); // HH:MM
  assert.equal(parseClockMs("12"), 12 * 3600000);
  assert.ok(Number.isNaN(parseClockMs("")));
  assert.ok(Number.isNaN(parseClockMs(null)));
  assert.ok(Number.isNaN(parseClockMs("ab:cd")));
  assert.ok(Number.isNaN(parseClockMs("1:2:3:4")));
  assert.equal(parseClockMs("-00:00:05.000"), -5000); // penalty bonus DRR
});

test("formatClockMs", () => {
  assert.equal(formatClockMs(600009), "00:10:00.009");
  assert.equal(formatClockMs(0), "00:00:00.000");
  assert.equal(formatClockMs(-5), "00:00:00.000");
  assert.equal(formatClockMs(NaN), "00:00:00.000");
  assert.equal(formatClockMs(25 * 3600000 + 1), "25:00:00.001");
});

test("clockDiff: identik dgn hitungSelisihWaktu lama utk input 3 digit", () => {
  // Kasus nyata UAT RAFTING (Semifinal MEN)
  assert.equal(clockDiff("00:10:00.000", "00:20:00.009"), "00:10:00.009");
  assert.equal(clockDiff("00:00:00.000", "00:10:00.999"), "00:10:00.999");
  assert.equal(clockDiff("09:59:59.900", "10:00:01.100"), "00:00:01.200");
});

test("clockDiff: negatif -> 0, kosong dianggap 0", () => {
  assert.equal(clockDiff("00:10:00.000", "00:09:00.000"), "00:00:00.000");
  assert.equal(clockDiff("", "00:01:00.000"), "00:01:00.000");
});

test("clockAdd: race time + penalty", () => {
  assert.equal(clockAdd("00:01:30.250", "00:00:50.000"), "00:02:20.250");
  assert.equal(clockAdd("00:00:59.999", "00:00:00.001"), "00:01:00.000");
  assert.equal(clockAdd("00:01:00.000", ""), "00:01:00.000");
  assert.equal(clockAdd("00:01:00.000", "-00:00:10.000"), "00:00:50.000");
});

test("secondsToClock", () => {
  assert.equal(secondsToClock(50), "00:00:50.000");
  assert.equal(secondsToClock(3661), "01:01:01.000");
  assert.equal(secondsToClock(-3), "00:00:00.000");
  assert.equal(secondsToClock("x"), "00:00:00.000");
});
