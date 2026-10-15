// Jalankan: yarn test
// Fixture = bentuk bracket nyata UAT RAFTING (R4 MEN/WOMEN U19) dari bug2
// yang ditemukan 2026-10-06 — supaya bug yang sama tidak kembali diam-diam.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  teamIdentityKey,
  pruneStalePool,
  missingSemifinalLosers,
  computeOverallPlacements,
} from "../src/lib/h2hBracket.js";
import { parseClockMs } from "../src/lib/raceTime.js";

const T = (name, bibTeam) => ({ name, bibTeam });
const EMPTY = T("", "");
const BALI = T("FAJI BALI", "101");
const SULSEL = T("FAJI SULAWESI SELATAN", "102");
const NTT = T("FAJI NTT", "103");
const SUMUT = T("FAJI SUMATERA UTARA", "104");
const SUMSEL = T("FAJI SUMATERA SELATAN", "105");

const SCORE = [0, 100, 92, 86, 82, 79, 76, 73, 70, 67];
const scoreForRank = (r) => SCORE[r] ?? 0;
const parseTimeMs = (s) => {
  const v = parseClockMs(s);
  return Number.isFinite(v) ? v : Infinity;
};

// Bracket MEN U19: QF (1 match riil + 3 BYE) -> Semifinal selesai.
function menBracket({ finalAWinner = null, finalBWinner = null } = {}) {
  const qf = {
    id: "R1",
    name: "Quarterfinals",
    size: 8,
    pool: [],
    matches: [
      { heat: 1, bye: false, team1: BALI, team2: NTT, winner: BALI },
      { heat: null, bye: true, team1: SULSEL, team2: EMPTY, winner: SULSEL },
      { heat: null, bye: true, team1: SUMUT, team2: EMPTY, winner: SUMUT },
      { heat: null, bye: true, team1: SUMSEL, team2: EMPTY, winner: SUMSEL },
    ],
  };
  const sf = {
    id: "R2",
    name: "Semifinals",
    size: 4,
    pool: [],
    matches: [
      { heat: 4, bye: false, team1: BALI, team2: SULSEL, winner: BALI },
      { heat: 5, bye: false, team1: SUMUT, team2: SUMSEL, winner: SUMUT },
    ],
  };
  const fb = {
    id: "R_B",
    name: "Final B",
    size: 2,
    bronze: true,
    pool: [],
    matches: [{ heat: 6, bye: false, team1: SULSEL, team2: SUMSEL, winner: finalBWinner }],
  };
  const fa = {
    id: "R3",
    name: "Final A",
    size: 2,
    pool: [],
    matches: [{ heat: 7, bye: false, team1: BALI, team2: SUMUT, winner: finalAWinner }],
  };
  return { rounds: [qf, sf, fb, fa], qf, sf, fb, fa };
}

const TIMES = {
  "FAJI BALI": "00:10:00.000",
  "FAJI SULAWESI SELATAN": "00:10:00.009",
  "FAJI NTT": "00:10:00.999",
  "FAJI SUMATERA UTARA": "00:10:00.000",
  "FAJI SUMATERA SELATAN": "00:10:00.009",
};
const rowsForRound = (round) => {
  const out = [];
  (round.matches || []).forEach((m) =>
    [m.team1, m.team2].forEach((t) => {
      if (t && t.name && !out.some((o) => o.team === t.name)) {
        out.push({ team: t.name, bib: t.bibTeam, total: TIMES[t.name] || "", race: "" });
      }
    })
  );
  return out;
};
const placements = (b) =>
  computeOverallPlacements({
    rounds: b.rounds,
    finalRound: b.fa,
    bronzeRound: b.fb,
    rowsForRound,
    parseTimeMs,
    scoreForRank,
  }).map((r) => [r.name.replace("FAJI ", ""), r.ranked, r.score]);

test("teamIdentityKey: nama+BIB, trim & kapital", () => {
  assert.equal(teamIdentityKey(T(" faji bali ", " 101 ")), "FAJI BALI|101");
  assert.notEqual(teamIdentityKey(T("FAJI BALI", "101")), teamIdentityKey(T("FAJI BALI", "201")));
  assert.equal(teamIdentityKey({ nameTeam: "X", bibTeam: "1" }), "X|1");
});

test("pruneStalePool: buang tim yg sudah di slot + duplikat (bug SUMSEL x3)", () => {
  const { sf } = menBracket();
  sf.pool = [SUMSEL, SUMUT, SUMSEL, SULSEL, SUMUT, SUMSEL];
  const r = pruneStalePool(sf);
  assert.equal(r.changed, true);
  assert.deepEqual(r.pool, []);
});

test("pruneStalePool: tim yg benar2 menunggu tetap ada, dobel dibuang", () => {
  const round = { matches: [{ team1: BALI, team2: EMPTY }], pool: [NTT, NTT, BALI, EMPTY] };
  const r = pruneStalePool(round);
  assert.deepEqual(r.pool, [NTT]);
  assert.equal(r.changed, true);
  assert.equal(pruneStalePool({ matches: [], pool: [] }).changed, false);
});

test("missingSemifinalLosers: Final B kosong -> 2 tim kalah", () => {
  const { sf } = menBracket();
  const bronze = { matches: [{ team1: EMPTY, team2: EMPTY }] };
  assert.deepEqual(missingSemifinalLosers(sf, bronze), [
    { name: SULSEL.name, bibTeam: "102" },
    { name: SUMSEL.name, bibTeam: "105" },
  ]);
});

test("missingSemifinalLosers: Final B baru 1 tim (bug BYE) -> lengkapi yg hilang saja", () => {
  const { sf } = menBracket();
  const bronze = { matches: [{ team1: SULSEL, team2: EMPTY }] };
  assert.deepEqual(missingSemifinalLosers(sf, bronze), [{ name: SUMSEL.name, bibTeam: "105" }]);
});

test("missingSemifinalLosers: Semifinal belum selesai -> []", () => {
  const { sf } = menBracket();
  sf.matches[1].winner = null;
  assert.deepEqual(missingSemifinalLosers(sf, { matches: [{ team1: EMPTY, team2: EMPTY }] }), []);
});

test("Overall: Final A & B belum dipertandingkan -> finalis tanpa rank/score, NTT = 5", () => {
  assert.deepEqual(placements(menBracket()), [
    ["BALI", null, null],
    ["SUMATERA UTARA", null, null],
    ["SULAWESI SELATAN", null, null],
    ["SUMATERA SELATAN", null, null],
    ["NTT", 5, 79],
  ]);
});

test("Overall: hanya Final B selesai (kasus WOMEN) -> 3 & 4 terisi, Final A tetap kosong", () => {
  assert.deepEqual(placements(menBracket({ finalBWinner: SUMSEL })), [
    ["BALI", null, null],
    ["SUMATERA UTARA", null, null],
    ["SUMATERA SELATAN", 3, 86],
    ["SULAWESI SELATAN", 4, 82],
    ["NTT", 5, 79],
  ]);
});

test("Overall: semua final selesai -> 1..5 berurutan, tidak ada rank lompat (bug 5-9)", () => {
  const res = placements(menBracket({ finalAWinner: SUMUT, finalBWinner: SULSEL }));
  assert.deepEqual(res, [
    ["SUMATERA UTARA", 1, 100],
    ["BALI", 2, 92],
    ["SULAWESI SELATAN", 3, 86],
    ["SUMATERA SELATAN", 4, 82],
    ["NTT", 5, 79],
  ]);
  assert.deepEqual(
    res.map((r) => r[1]),
    [1, 2, 3, 4, 5]
  );
});
