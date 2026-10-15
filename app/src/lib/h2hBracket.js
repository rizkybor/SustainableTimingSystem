// src/lib/h2hBracket.js
//
// Logika murni bracket Head to Head yg dulu tertanam di HeadToHead.vue —
// dipindah ke sini supaya bisa diuji otomatis (tests/h2hBracket.test.js).
// TANPA import Vue/Electron/alias "@/". HeadToHead.vue tinggal memanggil
// fungsi2 ini dgn data miliknya (this.rounds, buildRoundRows(), dst).
//
// Bentuk data (sama dgn h2h_brackets):
//   round = { id, name, size, bronze?, pool: [team], matches: [match] }
//   match = { heat, bye, team1: team, team2: team, winner: team|null }
//   team  = { name, bibTeam }

// Identitas tim = nama + BIB (dua klub bisa pakai nama sama). Implementasi
// SAMA PERSIS dgn _teamIdentityKey() di HeadToHead.vue.
export function teamIdentityKey(team) {
  return (
    String((team && (team.name || team.nameTeam || team.teamName)) || "")
      .trim()
      .toUpperCase() +
    "|" +
    String((team && team.bibTeam) || "").trim()
  );
}

// Identitas semua tim yg menempati slot match di babak ini.
export function roundSlotKeys(round) {
  const keys = new Set();
  ((round && round.matches) || []).forEach((m) => {
    if (m && m.team1 && m.team1.name) keys.add(teamIdentityKey(m.team1));
    if (m && m.team2 && m.team2.name) keys.add(teamIdentityKey(m.team2));
  });
  return keys;
}

// Pool yg sudah dibersihkan: buang tim yg SUDAH menempati slot di babak yg
// sama + entri dobel/kosong. Return { pool, changed } (tidak memutasi).
export function pruneStalePool(round) {
  const pool = Array.isArray(round && round.pool) ? round.pool : [];
  if (!pool.length) return { pool, changed: false };
  const seen = roundSlotKeys(round);
  const cleaned = pool.filter((t) => {
    if (!t || !t.name) return false;
    const k = teamIdentityKey(t);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { pool: cleaned, changed: cleaned.length !== pool.length };
}

// 2 tim kalah Semifinal yg BELUM menempati slot Final B. [] kalau Semifinal
// belum selesai semua / bukan 2 match / Final B sudah lengkap.
export function missingSemifinalLosers(semi, bronze) {
  if (!semi || !bronze || !Array.isArray(semi.matches)) return [];
  const losers = semi.matches.map((m) => {
    if (!m || !m.winner || !m.winner.name) return null;
    if (!(m.team1 && m.team1.name) || !(m.team2 && m.team2.name)) return null;
    const winKey = teamIdentityKey(m.winner);
    const lose = teamIdentityKey(m.team1) === winKey ? m.team2 : m.team1;
    return lose && lose.name ? lose : null;
  });
  if (losers.length !== 2 || !losers[0] || !losers[1]) return [];
  const taken = roundSlotKeys(bronze);
  return losers
    .filter((l) => !taken.has(teamIdentityKey(l)))
    .map((l) => ({ name: l.name, bibTeam: l.bibTeam || "" }));
}

// Peringkat akhir (Overall) satu kategori H2H — port 1:1 dari
// buildOverallPlacingsFromLastRound() (HeadToHead.vue):
// - Final A diputuskan -> 1 & 2; Final B diputuskan -> 3 & 4.
// - Final yg BELUM diputuskan -> kedua timnya ranked/score null + _pending
//   (permintaan user 2026-10-06: belum ada peringkat sebelum final
//   dipertandingkan), tetap tampil di urutan tier-nya.
// - Tim lain mulai dari 5: babak terjauh dulu, lalu waktu tercepat, nama.
//
// opts:
//   rounds         : semua babak (urutan bagan)
//   finalRound     : babak Final A (atau null)
//   bronzeRound    : babak Final B (atau null)
//   rowsForRound   : (round) => [{ team, bib, total, race }]
//   parseTimeMs    : (str) => number (Infinity/NaN kalau tidak ada)
//   scoreForRank   : (rank) => number
export function computeOverallPlacements(opts) {
  const {
    rounds = [],
    finalRound = null,
    bronzeRound = null,
    rowsForRound,
    parseTimeMs,
    scoreForRank,
  } = opts || {};
  if (!rounds.length) return [];

  const top4 = [];
  const top4Keys = new Set();
  const teamKey = (name, bib) => String(name || "").toUpperCase() + "|" + String(bib || "");
  const timeMsFromRow = (row) => {
    const t = row && (row.total || row.race) ? row.total || row.race : "";
    return parseTimeMs(t);
  };
  const byTime = (a, b) => {
    const ta = Number.isFinite(a.timeMs) ? a.timeMs : Number.POSITIVE_INFINITY;
    const tb = Number.isFinite(b.timeMs) ? b.timeMs : Number.POSITIVE_INFINITY;
    if (ta !== tb) return ta - tb;
    return String(a.name).localeCompare(String(b.name));
  };

  const pushUndecidedFinalists = (match, rows, firstPlace, source) => {
    const findRow = (nm) =>
      rows.find((r) => String(r.team).toUpperCase() === String(nm).toUpperCase()) || null;
    const present = [match.team1, match.team2]
      .filter((t) => t && t.name)
      .map((t) => {
        const rw = findRow(t.name);
        return { name: t.name, bib: rw ? rw.bib : t.bibTeam || "", timeMs: timeMsFromRow(rw) };
      })
      .filter((x) => !top4Keys.has(teamKey(x.name, x.bib)));
    present.sort(byTime);
    present.forEach((x, i) => {
      top4.push({
        place: null,
        order: firstPlace + i, // urutan tampil saja, bukan peringkat
        name: x.name,
        bib: x.bib,
        source,
        timeMs: x.timeMs,
        pending: true,
      });
      top4Keys.add(teamKey(x.name, x.bib));
    });
  };

  const placeFinal = (round, firstPlace, source, skipTaken) => {
    if (!round || !round.matches || !round.matches[0]) return;
    const m = round.matches[0];
    const t1 = m.team1 && m.team1.name ? m.team1.name : "";
    const t2 = m.team2 && m.team2.name ? m.team2.name : "";
    const rows = rowsForRound(round);
    const findRow = (nm) =>
      rows.find((r) => String(r.team).toUpperCase() === String(nm).toUpperCase()) || null;
    if (!(m.winner && m.winner.name)) {
      pushUndecidedFinalists(m, rows, firstPlace, source);
      return;
    }
    const winner = m.winner.name;
    const loser = (winner === t1 ? t2 : t1) || "";
    [
      [winner, firstPlace],
      [loser, firstPlace + 1],
    ].forEach(([nm, place]) => {
      if (!nm) return;
      const rw = findRow(nm);
      const k = teamKey(nm, rw ? rw.bib : "");
      if (skipTaken && top4Keys.has(k)) return;
      top4.push({ place, name: nm, bib: rw ? rw.bib : "", source, timeMs: timeMsFromRow(rw) });
      top4Keys.add(k);
    });
  };

  placeFinal(finalRound, 1, "FinalA", false);
  placeFinal(bronzeRound, 3, "FinalB", true);

  // Tim lain: babak terjauh yg dicapai (bronze sudah diambil di atas).
  const lastRowByTeam = new Map();
  rounds.forEach((r, ri) => {
    if (r && r.bronze) return;
    rowsForRound(r).forEach((row) => {
      const key = teamKey(row.team, row.bib);
      if (top4Keys.has(key)) return;
      const prev = lastRowByTeam.get(key);
      if (!prev || ri > prev.roundIdx) {
        lastRowByTeam.set(key, { row, roundIdx: ri, roundName: r.name });
      }
    });
  });
  const others = Array.from(lastRowByTeam.values()).map((v) => ({
    name: v.row.team,
    bib: v.row.bib,
    sourceRoundName: v.roundName,
    timeMs: timeMsFromRow(v.row),
    roundIdx: v.roundIdx,
  }));
  others.sort((a, b) => (a.roundIdx !== b.roundIdx ? b.roundIdx - a.roundIdx : byTime(a, b)));

  const overall = [];
  top4
    .sort((a, b) => (a.place || a.order) - (b.place || b.order))
    .forEach((x) => {
      overall.push({
        ranked: x.pending ? null : x.place,
        name: x.name,
        bib: x.bib,
        score: x.pending ? null : scoreForRank(x.place),
        _source: x.source,
        ...(x.pending ? { _pending: true } : {}),
      });
    });
  let rank = 5;
  others.forEach((o) => {
    overall.push({
      ranked: rank,
      name: o.name,
      bib: o.bib,
      score: scoreForRank(rank),
      _source: o.sourceRoundName,
    });
    rank++;
  });
  return overall;
}
