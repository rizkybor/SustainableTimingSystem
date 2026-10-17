// src/lib/orienteering.js
//
// Logika murni modul Orienteering (Classic — urutan pos wajib):
// mengevaluasi hasil baca SI Card (lihat utils/sportIdentReader.js) terhadap
// course satu kelas, lalu memeringkat peserta per kelas.
// TANPA import Vue/Electron — diuji di tests/orienteering.test.js.
//
// Bentuk data kartu (output sportIdentReader):
//   { card_number, start: "HH:MM:SS"|null, finish, check, clear,
//     punches: [{ station: 33, time: "15:35:02" }, ...] }

export const STATUS = {
  OK: "OK",
  MP: "MP", // Missing Punch — pos wajib terlewat / salah urutan
  DNF: "DNF", // tidak ada punch Finish
  NO_START: "NO_START", // tidak ada punch Start & tidak ada jam start terjadwal
  DSQ: "DSQ", // didiskualifikasi manual oleh operator
  DNS: "DNS", // tidak start (belum pernah membaca kartu)
};

export const STATUS_LABEL = {
  OK: "OK",
  MP: "MP (Missing Punch)",
  DNF: "DNF",
  NO_START: "Tanpa Start",
  DSQ: "DSQ",
  DNS: "DNS",
};

const DAY = 24 * 3600;

// "HH:MM:SS" (boleh diawali label hari, mis. "0 Sa 15:30:54") -> detik dalam
// hari. null/invalid -> null.
export function clockToSeconds(value) {
  if (value === null || value === undefined) return null;
  // pecahan detik (mis. "15:30:54.5") diabaikan/dipotong — aturan IOF: detik penuh
  const m = String(value).match(/(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,]\d+)?)?\s*$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  const s = Number(m[3] || 0);
  if (h > 23 || mi > 59 || s > 59) return null;
  return h * 3600 + mi * 60 + s;
}

// Selisih b - a (detik) dgn asumsi kejadian berurutan dalam < 24 jam —
// kalau b < a (melewati tengah malam) ditambah 24 jam.
export function elapsed(a, b) {
  if (a === null || b === null) return null;
  const d = b - a;
  return d >= 0 ? d : d + DAY;
}

// Selisih waktu LARI (start->pos->finish). SI Card lama (SI5) menyimpan jam
// format 12 jam tanpa AM/PM, jadi lari yang melewati jam 12 siang (mis. start
// 11:50, finish tercatat 00:10) terbaca +12 jam. Satu lari orienteering
// tidak mungkin >= 12 jam -> koreksi kelebihan 12 jam itu.
const HALF_DAY = 12 * 3600;
export function runElapsed(a, b) {
  const d = elapsed(a, b);
  return d !== null && d >= HALF_DAY ? d - HALF_DAY : d;
}

// detik -> "M:SS" / "H:MM:SS" (gaya hasil orienteering)
export function formatDuration(sec) {
  if (sec === null || sec === undefined || !Number.isFinite(sec)) return "-";
  const t = Math.max(0, Math.round(sec));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

// "33, 31 35-34" -> [33, 31, 35, 34]  (pemisah koma/spasi/strip/titik koma)
export function parseControls(text) {
  return String(text || "")
    .split(/[\s,;\-–>]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
}

// Pasangkan pos course ke punch kartu: hasil[i] = index punch utk pos ke-i,
// atau -1 (terlewat). Memaksimalkan jumlah pos yang cocok sesuai urutan
// (LCS); bila seri, pos dicocokkan ke punch paling awal.
export function matchControlsLCS(controls, punches) {
  const n = controls.length;
  const m = punches.length;
  const st = punches.map((p) => Number(p && p.station));
  // L[i][j] = jumlah cocok maksimal utk controls[i..] vs punches[j..]
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    const code = Number(controls[i]);
    for (let j = m - 1; j >= 0; j--) {
      L[i][j] = st[j] === code ? Math.max(1 + L[i + 1][j + 1], L[i][j + 1], L[i + 1][j]) : Math.max(L[i][j + 1], L[i + 1][j]);
    }
  }
  const out = new Array(n).fill(-1);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const code = Number(controls[i]);
    let pick = -1;
    for (let k = j; k < m; k++) {
      if (st[k] === code && 1 + L[i + 1][k + 1] === L[i][j]) {
        pick = k;
        break;
      }
    }
    if (pick !== -1) {
      out[i] = pick;
      j = pick + 1;
    }
    // tidak cocok -> pos terlewat; L[i+1][j] === L[i][j] terjamin oleh DP
  }
  return out;
}

// Evaluasi satu kartu terhadap course Classic.
// opts.controls     : [33, 31, 35, ...] urutan pos wajib
// Waktu HANYA dari SI Card (punch Start & Finish). Jadwal start / Starting
// Order TIDAK PERNAH dipakai menghitung (aturan user) — kartu tanpa punch
// Start = NO_START, tanpa waktu.
// Return {
//   status, timeSec, time, startSource: "card"|null,
//   splits: [{ order, code, found, punchTime, cumSec, legSec }],
//   missing: [{ order, code }], extra: [{ station, time }]
// }
export function evaluateCard(card, opts = {}) {
  const controls = Array.isArray(opts.controls) ? opts.controls : [];
  const punches = Array.isArray(card && card.punches) ? card.punches : [];

  const startSec = clockToSeconds(card && card.start);
  const startSource = startSec !== null ? "card" : null;
  const finishSec = clockToSeconds(card && card.finish);

  // Classic: pos wajib harus dikunjungi SESUAI URUTAN; punch lain di
  // antaranya diabaikan. Pencocokan memakai urutan bersama terpanjang (LCS)
  // supaya jumlah pos yang cocok MAKSIMAL — pencocokan "rakus" (ambil punch
  // pertama yg cocok) bisa salah menandai pos yang sebenarnya dikunjungi
  // sebagai terlewat bila peserta salah urutan di tengah course. Bila ada
  // beberapa pilihan, dipilih punch paling awal.
  // opts.skipOrders: urutan pos (1-based) yang sudah dikoreksi operator (Edit
  // split) — tidak ikut dicocokkan ke punch kartu, supaya punch yang ada
  // dipakai utk pos lain; nilainya diisi oleh patchSplits().
  const skip = new Set((opts.skipOrders || []).map(Number));
  const active = controls.map((_c, i) => i).filter((i) => !skip.has(i + 1));
  const sub = matchControlsLCS(active.map((i) => controls[i]), punches);
  const matchIdx = controls.map(() => -1);
  active.forEach((i, k) => (matchIdx[i] = sub[k]));
  const used = new Set(matchIdx.filter((j) => j !== -1));
  let prevSec = startSec;
  const splits = controls.map((code, i) => {
    const found = matchIdx[i];
    if (found === -1) {
      return { order: i + 1, code, found: false, punchTime: null, cumSec: null, legSec: null };
    }
    const ps = clockToSeconds(punches[found].time);
    const cumSec = startSec !== null && ps !== null ? runElapsed(startSec, ps) : null;
    const legSec = prevSec !== null && ps !== null ? runElapsed(prevSec, ps) : null;
    if (ps !== null) prevSec = ps;
    return { order: i + 1, code, found: true, punchTime: punches[found].time, cumSec, legSec };
  });

  const missing = splits.filter((s) => !s.found).map((s) => ({ order: s.order, code: s.code }));
  const extra = punches.filter((_p, j) => !used.has(j)).map((p) => ({ station: p.station, time: p.time }));

  const timeSec = startSec !== null && finishSec !== null ? runElapsed(startSec, finishSec) : null;
  const finishLegSec = prevSec !== null && finishSec !== null ? runElapsed(prevSec, finishSec) : null;

  let status = STATUS.OK;
  if (finishSec === null) status = STATUS.DNF;
  else if (startSec === null) status = STATUS.NO_START;
  else if (missing.length) status = STATUS.MP;

  return {
    status,
    timeSec,
    time: formatDuration(timeSec),
    startSource,
    finishLegSec,
    splits,
    missing,
    extra,
  };
}

// Peringkat per kelas: status OK diurutkan waktu tercepat (waktu sama =
// rank sama), sisanya (MP/DNF/NO_START/DSQ/DNS) tanpa rank di bawahnya.
// entries: [{ ...apa saja, status, timeSec }] -> salinan + { rank, behindSec }
export function rankClass(entries) {
  const list = (entries || []).map((e) => ({ ...e }));
  const ok = list
    .filter((e) => e.status === STATUS.OK && Number.isFinite(e.timeSec))
    .sort((a, b) => a.timeSec - b.timeSec || String(a.name || "").localeCompare(String(b.name || "")));
  const order = ["MP", "DNF", "NO_START", "DSQ", "DNS"];
  const others = list
    .filter((e) => !(e.status === STATUS.OK && Number.isFinite(e.timeSec)))
    .sort(
      (a, b) =>
        order.indexOf(a.status) - order.indexOf(b.status) ||
        String(a.name || "").localeCompare(String(b.name || ""))
    );
  const best = ok.length ? ok[0].timeSec : null;
  let prevTime = null;
  let prevRank = 0;
  ok.forEach((e, i) => {
    e.rank = e.timeSec === prevTime ? prevRank : i + 1;
    prevTime = e.timeSec;
    prevRank = e.rank;
    e.behindSec = best !== null ? e.timeSec - best : null;
  });
  others.forEach((e) => {
    e.rank = null;
    e.behindSec = null;
  });
  return ok.concat(others);
}

/* ===================== Type Event & Kategori ===================== */

// Type Event bawaan (1 event boleh punya lebih dari 1 type).
export const PRESET_EVENT_TYPES = ["National Event", "World Ranking Event"];

// Kelompok umur bawaan utk pembuat kategori.
export const PRESET_AGE_GROUPS = [10, 12, 14, 16, 18, 20, 21, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
export const PRESET_GENDERS = ["Men", "Women"];

// Kode kategori gaya IOF: huruf depan = gender (M = Men, W = Women), lalu
// umur, lalu "E" kalau Elite/World Ranking Event (mis. "M20", "W21E").
// Urut umur lalu gender sesuai urutan `genders` (["Men","Women"]).
export const GENDER_PREFIX = { Men: "M", Women: "W" };
export function buildCategoryNames(ages, genders, opts = {}) {
  const a = Array.from(new Set((ages || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))).sort(
    (x, y) => x - y
  );
  const g = (genders || []).map((x) => String(x).trim()).filter((x) => GENDER_PREFIX[x]);
  const suffix = opts.elite ? "E" : "";
  const out = [];
  a.forEach((age) => g.forEach((gender) => out.push(`${GENDER_PREFIX[gender]}${age}${suffix}`)));
  return out;
}

// Gender dari huruf depan kode kategori: "M..." -> "Men", "W..." -> "Women",
// selainnya null (mis. "Open").
export function genderOfCategory(name) {
  const c = String(name || "").trim().charAt(0).toUpperCase();
  return c === "M" ? "Men" : c === "W" ? "Women" : null;
}

// Gabungkan nama kategori baru ke daftar yang sudah ada (tanpa dobel,
// tidak peka huruf besar/kecil), urutan lama dipertahankan.
export function mergeCategoryNames(existing, incoming) {
  const seen = new Set((existing || []).map((n) => String(n).trim().toUpperCase()));
  const out = (existing || []).slice();
  (incoming || []).forEach((n) => {
    const name = String(n || "").trim();
    if (!name) return;
    const k = name.toUpperCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(name);
  });
  return out;
}

/* ===================== Import Start List (CSV/Excel) ===================== */

// Kolom template = format Start List resmi (mis. MUBLOC VI 2026):
// Category, No, Start Time (WIB), Full Name, IOF ID, Ranking IOF, BIB, Club,
// Nationality, Sportident Number
export const IMPORT_COLUMNS = [
  "Category",
  "No",
  "Start Time (WIB)",
  "Full Name",
  "IOF ID",
  "Ranking IOF",
  "BIB",
  "Club",
  "Nationality",
  "Sportident Number",
];

// Nama header yang diterima (huruf besar/kecil & spasi diabaikan).
const HEADER_ALIASES = {
  category: ["category", "kategori", "class", "kelas"],
  startNo: ["no", "nomor", "startno", "startnumber", "no."],
  startTime: ["starttime(wib)", "starttime", "start", "jamstart", "waktustart", "starttime(wita)", "starttime(wit)"],
  name: ["fullname", "name", "nama", "namalengkap", "participant", "peserta"],
  iofId: ["iofid", "iof"],
  iofRanking: ["rankingiof", "iofranking", "ranking", "rank"],
  bib: ["bib", "nobib", "bibnumber"],
  club: ["club", "klub", "team", "tim"],
  nationality: ["nationality", "negara", "country", "kebangsaan"],
  siCard: ["sportidentnumber", "sportident", "sicard", "si", "sinumber", "nomorsicard", "card", "chip"],
};

const normHeader = (h) => String(h || "").toLowerCase().replace(/[\s_-]/g, "");

// Nilai kosong di start list: "", "-", "—", "–", "n/a"
const isBlankCell = (v) => {
  const t = String(v === undefined || v === null ? "" : v).trim();
  return !t || ["-", "—", "–", "n/a", "na", "null"].includes(t.toLowerCase());
};

// "8:30" / "08:30" / "08:30:15" / angka pecahan hari Excel (0.354166) -> "HH:MM:SS"
export function normalizeStartTime(v) {
  if (isBlankCell(v)) return "";
  if (typeof v === "number" && v >= 0 && v < 1) {
    const sec = Math.round(v * 86400);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(Math.floor(sec / 3600))}:${p(Math.floor((sec % 3600) / 60))}:${p(sec % 60)}`;
  }
  const m = String(v).trim().match(/^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?$/);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null; // null = tidak valid
  return `${m[1].padStart(2, "0")}:${m[2]}:${m[3] || "00"}`;
}

// rawRows: hasil XLSX.utils.sheet_to_json(sheet, { defval: "" }) — array object
// dgn header apa adanya. Return { rows, errors, missingColumns }:
//   rows   : [{ rowNo, category, startNo, scheduledStart, name, iofId,
//              iofRanking, bib, club, nationality, siCard|null }]
//   errors : [{ rowNo, message }]  (baris bermasalah TIDAK masuk `rows`)
export function normalizeImportRows(rawRows) {
  const list = Array.isArray(rawRows) ? rawRows : [];
  const headerKeys = list.length ? Object.keys(list[0]) : [];
  const fieldOf = {};
  headerKeys.forEach((h) => {
    const n = normHeader(h);
    Object.keys(HEADER_ALIASES).forEach((field) => {
      if (!fieldOf[field] && HEADER_ALIASES[field].includes(n)) fieldOf[field] = h;
    });
  });
  const missingColumns = ["category", "name"].filter((f) => !fieldOf[f]);
  const get = (row, field) => (fieldOf[field] ? row[fieldOf[field]] : "");
  const text = (v) => (isBlankCell(v) ? "" : String(v).trim());

  const rows = [];
  const errors = [];
  const seenSi = new Map();
  const seenBib = new Map();
  list.forEach((raw, i) => {
    const rowNo = i + 2; // baris 1 = header
    const name = text(get(raw, "name"));
    const category = text(get(raw, "category"));
    if (!name && !category && Object.values(raw).every(isBlankCell)) return; // baris kosong
    const problems = [];
    if (!name) problems.push("Nama kosong");
    if (!category) problems.push("Kategori kosong");

    let siCard = null;
    const siRaw = get(raw, "siCard");
    if (!isBlankCell(siRaw)) {
      const n = Number(String(siRaw).replace(/\s/g, ""));
      if (!Number.isInteger(n) || n <= 0) problems.push(`SI Card "${siRaw}" tidak valid`);
      else if (seenSi.has(n)) problems.push(`SI Card ${n} dobel dgn baris ${seenSi.get(n)}`);
      else siCard = n;
    }
    const bib = text(get(raw, "bib"));
    if (bib && seenBib.has(bib.toUpperCase())) problems.push(`BIB ${bib} dobel dgn baris ${seenBib.get(bib.toUpperCase())}`);

    const scheduledStart = normalizeStartTime(get(raw, "startTime"));
    if (scheduledStart === null) problems.push(`Start Time "${get(raw, "startTime")}" tidak valid`);

    if (problems.length) {
      errors.push({ rowNo, name, message: problems.join("; ") });
      return;
    }
    if (siCard) seenSi.set(siCard, rowNo);
    if (bib) seenBib.set(bib.toUpperCase(), rowNo);
    const startNo = Number(text(get(raw, "startNo")));
    const rank = Number(text(get(raw, "iofRanking")));
    rows.push({
      rowNo,
      category,
      startNo: Number.isFinite(startNo) && startNo > 0 ? startNo : null,
      scheduledStart: scheduledStart || "",
      name,
      iofId: text(get(raw, "iofId")),
      iofRanking: Number.isFinite(rank) && rank > 0 ? rank : null,
      bib,
      club: text(get(raw, "club")),
      nationality: text(get(raw, "nationality")),
      siCard,
    });
  });
  return { rows, errors, missingColumns };
}

// Kunci pencocokan peserta saat impor ulang (update, bukan dobel):
// BIB -> IOF ID -> nama+kategori.
export function participantMatchKeys(p, categoryName) {
  const keys = [];
  if (p.bib) keys.push("bib:" + String(p.bib).trim().toUpperCase());
  if (p.iofId) keys.push("iof:" + String(p.iofId).trim());
  keys.push("name:" + String(p.name || "").trim().toUpperCase() + "|" + categoryKey(categoryName));
  return keys;
}

// Kunci pembanding nama kategori: tidak peka huruf besar/kecil & spasi, dan
// sebutan panjang Novice = singkatan "N" (aturan user): "M21 Novice" ==
// "M21N", "W21 novice" == "W21N".
export function categoryKey(name) {
  return String(name === undefined || name === null ? "" : name)
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
    .replace(/^([MW]\d+)\s*NOVICE$/, "$1N");
}

/* ===================== Jenis Orienteering (race) ===================== */

// 1 event bisa punya beberapa jenis/race; kategori dipakai bersama, tapi
// course, start list, readout & hasil terpisah per jenis.
export const PRESET_RACES = ["Sprint Distance", "Middle Distance"];

// Course satu kategori utk satu jenis. Data lama (sebelum ada jenis) cuma
// punya `controls` -> dipakai sbg cadangan supaya event lama tetap jalan.
export function courseOf(cls, raceId) {
  if (!cls) return [];
  const map = cls.courses && typeof cls.courses === "object" ? cls.courses : null;
  if (map && Array.isArray(map[raceId])) return map[raceId];
  return Array.isArray(cls.controls) ? cls.controls : [];
}

// Aturan Type Event dari nama kategori (permintaan user): kategori yang
// diakhiri "E" tepat setelah angka umur (mis. "W21E", "M21E") = World Ranking
// Event; selainnya (mis. "M20", "W21 Novice") = National Event.
export const WORLD_RANKING_TYPE = "World Ranking Event";
export const NATIONAL_TYPE = "National Event";
export function typeNameForCategory(categoryName) {
  return /\dE$/i.test(String(categoryName || "").trim()) ? WORLD_RANKING_TYPE : NATIONAL_TYPE;
}

// World Ranking Event hanya kelompok umur 21 (elite) -> kategorinya selalu
// M21E / W21E. Type lain memakai semua kelompok umur preset.
export const WORLD_RANKING_AGES = [21];
export function isWorldRankingType(typeName) {
  return String(typeName || "").trim().toUpperCase() === WORLD_RANKING_TYPE.toUpperCase();
}
export function ageGroupsForType(typeName) {
  return isWorldRankingType(typeName) ? WORLD_RANKING_AGES.slice() : PRESET_AGE_GROUPS.slice();
}
// Kategori dari pembuat kategori untuk satu type: umur di luar daftar type
// tsb dibuang; World Ranking otomatis umur 21 + akhiran "E".
export function buildCategoryNamesForType(typeName, ages, genders) {
  const wre = isWorldRankingType(typeName);
  const allowed = ageGroupsForType(typeName);
  const picked = wre ? allowed : (ages || []).map(Number).filter((a) => allowed.includes(a));
  return buildCategoryNames(picked, genders, { elite: wre });
}

/* ======================= Live Result (publik) ======================= */

// Baris hasil utk Live Result di sts-jurysystem — dari output rankClass().
// Hanya data yang pantas tampil publik (tanpa nomor SI Card / IOF ID /
// kartu mentah). Peserta yang belum membaca kartu & tanpa status manual
// ditandai `pending` (masih di lintasan / belum start), BUKAN DNS.
const clockText = (v) => {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(String(v || "").trim());
  return m ? `${m[1].padStart(2, "0")}:${m[2]}:${m[3] || "00"}` : "";
};
export function liveRowOf(r) {
  const pending = !r.readAt && r.status === STATUS.DNS && !r.manualStatus && !r.edited;
  return {
    rank: r.rank || null,
    name: r.name || "",
    club: r.club || "",
    nationality: r.nationality || "",
    bib: r.bib || "",
    startNo: r.startNo || null,
    status: r.status,
    pending,
    timeSec: Number.isFinite(r.timeSec) ? r.timeSec : null,
    time: Number.isFinite(r.timeSec) ? formatDuration(r.timeSec) : "",
    behindSec: Number.isFinite(r.behindSec) ? r.behindSec : null,
    behind: Number.isFinite(r.behindSec) && r.behindSec > 0 ? "+" + formatDuration(r.behindSec) : "",
    // Jadwal start (Starting Order) — BUKAN waktu start sebenarnya.
    // `start` = alias lama (dipakai jurysystem versi sebelumnya).
    start: /^\d{1,2}:\d{2}/.test(String(r.scheduledStart || "")) ? String(r.scheduledStart).slice(0, 5) : "",
    scheduledStart: /^\d{1,2}:\d{2}/.test(String(r.scheduledStart || "")) ? String(r.scheduledStart).slice(0, 5) : "",
    // Waktu sebenarnya dari punch SI Card (HH:MM:SS); kosong kalau kartu tidak punya punch-nya
    cardStart: clockText(r.start),
    cardFinish: clockText(r.finish),
    // "card" = waktu dari punch Start kartu; null = kartu tanpa punch Start (NO_START)
    startSource: r.startSource || null,
    // dikoreksi operator (Edit Hasil) — ditampilkan sbg tanda "Edited"
    edited: !!r.edited,
    editNote: r.edited ? String(r.editNote || "") : "",
    missing: Array.isArray(r.missing) ? r.missing.length : 0,
    splits: (Array.isArray(r.splits) ? r.splits : []).map((s) => ({
      order: s.order,
      code: s.code,
      // found = pos dipunch; cumSec null + found = kartu tanpa punch Start
      // (pos tetap dikunjungi, hanya waktu kumulatif yang tidak bisa dihitung)
      found: s.found !== false,
      punchTime: s.found ? clockText(s.punchTime) : "",
      cumSec: Number.isFinite(s.cumSec) ? s.cumSec : null,
      legSec: Number.isFinite(s.legSec) ? s.legSec : null,
    })),
    readAt: r.readAt || null,
  };
}

// Snapshot satu jenis (output getResults() controller) -> dokumen
// orienteeringLiveResults { classes:[{ classId, className, typeName,
// controls, finished, total, rows }] }.
export function buildLiveSnapshot(results) {
  const classes = ((results && results.classes) || []).map((c) => {
    const all = (c.results || []).map(liveRowOf);
    // yang belum mulai (kartu belum dibaca) diurutkan spt start list (jadwal start, No, nama) —
    // sebelum/selama lomba publik bisa lihat siapa yang start berikutnya.
    // Yang kosong (tanpa jam / No) di bawah.
    const last = (v) => (v === null || v === undefined || v === "" ? Infinity : v);
    const pending = all
      .filter((x) => x.pending)
      .sort(
        (a, b) =>
          String(a.start || "\uffff").localeCompare(String(b.start || "\uffff")) ||
          last(a.startNo) - last(b.startNo) ||
          a.name.localeCompare(b.name)
      );
    const rows = all.filter((x) => !x.pending).concat(pending);
    return {
      classId: c.classId,
      className: c.className,
      typeId: c.typeId || "",
      typeName: c.typeName || "",
      controls: Array.isArray(c.controls) ? c.controls.length : 0,
      total: rows.length,
      finished: rows.filter((x) => !x.pending).length,
      rows,
    };
  });
  return { classes };
}

/* =================== Daftar Peserta: filter & sort =================== */

// "Belum baca" = peserta tanpa hasil baca kartu & tanpa status manual
// (hasil DNS otomatis dari resultFor()).
export const NOT_READ = "NOT_READ";
export function participantResultKey(result) {
  if (!result) return NOT_READ;
  if (result.status === STATUS.DNS && !result.readAt && !result.manualStatus && !result.edited) return NOT_READ;
  return result.status;
}

// filters: { q, classId, typeId, si ("with"|"without"|""), status (STATUS|NOT_READ|""), nationality }
// ctx:     { typeOf(classId) -> typeId, resultOf(participant) -> result|null }
export function filterParticipants(list, filters = {}, ctx = {}) {
  const q = String(filters.q || "").trim().toLowerCase();
  const typeOf = ctx.typeOf || (() => "");
  const resultOf = ctx.resultOf || (() => null);
  const nat = String(filters.nationality || "").trim().toUpperCase();
  return (list || []).filter((p) => {
    if (filters.classId && p.classId !== filters.classId) return false;
    if (filters.typeId && typeOf(p.classId) !== filters.typeId) return false;
    if (filters.si === "with" && !p.siCard) return false;
    if (filters.si === "without" && p.siCard) return false;
    if (nat && String(p.nationality || "").trim().toUpperCase() !== nat) return false;
    if (filters.status && participantResultKey(resultOf(p)) !== filters.status) return false;
    if (q) {
      const hay = [p.name, p.club, p.nationality, p.iofId].map((x) => String(x || "").toLowerCase());
      const exact = [p.bib, p.siCard, p.startNo].map((x) => String(x || "").toLowerCase());
      if (!hay.some((x) => x.includes(q)) && !exact.some((x) => x === q || (x && x.startsWith(q)))) return false;
    }
    return true;
  });
}

const RESULT_ORDER = ["OK", "MP", "DNF", "NO_START", "DSQ", "DNS", NOT_READ];
const numOrNull = (v) => {
  const n = Number(v);
  return v === null || v === undefined || v === "" || !Number.isFinite(n) ? null : n;
};
const startSec = (v) => {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(String(v || ""));
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0) : null;
};

// key: no | name | category | bib | si | club | nationality | start | result
// dir: "asc" | "desc". Nilai kosong SELALU di bawah (asc maupun desc).
// ctx: { classNameOf(classId), resultOf(participant) }
export function sortParticipants(list, key, dir = "asc", ctx = {}) {
  const arr = (list || []).slice();
  if (!key) return arr;
  const classNameOf = ctx.classNameOf || (() => "");
  const resultOf = ctx.resultOf || (() => null);
  const sign = dir === "desc" ? -1 : 1;
  const text = (v) => {
    const s = String(v === null || v === undefined ? "" : v).trim();
    return s ? s : null;
  };
  const valueOf = (p) => {
    switch (key) {
      case "no": return numOrNull(p.startNo);
      case "name": return text(p.name);
      case "category": return text(classNameOf(p.classId));
      case "bib": return numOrNull(p.bib) !== null ? numOrNull(p.bib) : text(p.bib);
      case "si": return numOrNull(p.siCard);
      case "club": return text(p.club);
      case "nationality": return text(p.nationality);
      case "start": return startSec(p.scheduledStart);
      case "result": {
        const r = resultOf(p);
        const k = participantResultKey(r);
        // OK diurutkan by waktu, lalu status lain sesuai urutan baku
        return [RESULT_ORDER.indexOf(k), k === "OK" && r && Number.isFinite(r.timeSec) ? r.timeSec : 0];
      }
      default: return null;
    }
  };
  const cmp = (a, b) => {
    if (Array.isArray(a)) return a[0] - b[0] || a[1] - b[1];
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), "id", { numeric: true, sensitivity: "base" });
  };
  return arr
    .map((p, i) => ({ p, i, v: valueOf(p) }))
    .sort((x, y) => {
      if (x.v === null && y.v === null) return x.i - y.i;
      if (x.v === null) return 1;
      if (y.v === null) return -1;
      return sign * cmp(x.v, y.v) || x.i - y.i;
    })
    .map((x) => x.p);
}

/* ===================== Tab Hasil: sort per kategori ===================== */

// rows = output rankClass() (sudah urut resmi: OK by waktu, lalu status lain).
// key: rank | name | bib | club | nationality | si | time | behind | status
// "rank" (default) = urutan resmi; dir "desc" membaliknya. Nilai kosong
// (mis. waktu peserta MP/DNF/belum baca) selalu di bawah.
export function sortResultRows(rows, key = "rank", dir = "asc") {
  const list = (rows || []).slice();
  if (!key || key === "rank") return dir === "desc" ? list.reverse() : list;
  const map = {
    name: "name",
    bib: "bib",
    club: "club",
    nationality: "nationality",
    si: "si",
    status: "result",
    start: "start", // Starting Order (jadwal start) — hanya urutan tampilan
  };
  if (map[key]) return sortParticipants(list, map[key], dir, { resultOf: (r) => r });
  const sign = dir === "desc" ? -1 : 1;
  const val = (r) => {
    if (key === "time") return r.status === STATUS.OK && Number.isFinite(r.timeSec) ? r.timeSec : null;
    if (key === "behind") return r.rank && Number.isFinite(r.behindSec) ? r.behindSec : null;
    return null;
  };
  return list
    .map((r, i) => ({ r, i, v: val(r) }))
    .sort((a, b) => {
      if (a.v === null && b.v === null) return a.i - b.i;
      if (a.v === null) return 1;
      if (b.v === null) return -1;
      return sign * (a.v - b.v) || a.i - b.i;
    })
    .map((x) => x.r);
}

/* ============ Ringkasan peserta per Type Event (kartu List Event) ============ */

// Kunci orang yang sama lintas jenis (Sprint & Middle = 2 dokumen peserta):
// IOF ID -> BIB -> nama+kategori. Dipakai supaya jumlah peserta tidak dobel.
export function personKey(p) {
  const iof = String((p && p.iofId) || "").trim();
  if (iof) return `I:${iof}`;
  const bib = String((p && p.bib) || "").trim();
  if (bib) return `B:${bib.toUpperCase()}`;
  return `N:${String((p && p.name) || "").trim().toUpperCase()}|${(p && p.classId) || ""}`;
}

// -> { total, types: [{ typeId, name, participants, classes: [{ id, name, participants }] }] }
// Urutan type & kategori mengikuti event; kategori tanpa type -> "Tanpa Type".
export function participantBreakdown(event, participants) {
  const classes = (event && event.classes) || [];
  const types = ((event && event.types) || []).slice();
  if (classes.some((c) => !c.typeId || !types.some((t) => t.id === c.typeId))) {
    types.push({ id: "", name: "Tanpa Type" });
  }
  const classType = new Map(classes.map((c) => [c.id, types.some((t) => t.id === c.typeId) ? c.typeId : ""]));
  const all = new Set();
  const byType = new Map();
  const byClass = new Map();
  (participants || []).forEach((p) => {
    const key = personKey(p);
    all.add(key);
    if (!classType.has(p.classId)) return;
    const tid = classType.get(p.classId);
    if (!byType.has(tid)) byType.set(tid, new Set());
    byType.get(tid).add(key);
    if (!byClass.has(p.classId)) byClass.set(p.classId, new Set());
    byClass.get(p.classId).add(key);
  });
  return {
    total: all.size,
    types: types
      .map((t) => ({
        typeId: t.id,
        name: t.name,
        participants: (byType.get(t.id) || new Set()).size,
        classes: classes
          .filter((c) => classType.get(c.id) === t.id)
          .map((c) => ({ id: c.id, name: c.name, participants: (byClass.get(c.id) || new Set()).size })),
      }))
      .filter((t) => t.typeId || t.classes.length),
  };
}

/* ================ Type Event <-> Jenis (Sprint / Middle) ================ */

// type.raceIds: jenis tempat Type Event ini dipertandingkan. Kosong/tidak
// ada = SEMUA jenis (data lama & default). Mis. World Ranking Event hanya
// di Middle Distance -> raceIds: ["<id Middle>"].
export function typeAppliesToRace(type, raceId) {
  const ids = type && Array.isArray(type.raceIds) ? type.raceIds : [];
  return !raceId || !ids.length || ids.includes(raceId);
}

// Kategori tanpa Type (atau Type yang tidak dikenal) berlaku di semua jenis.
export function classAppliesToRace(event, cls, raceId) {
  const t = ((event && event.types) || []).find((x) => x.id === (cls && cls.typeId));
  return !t || typeAppliesToRace(t, raceId);
}

export function classesForRace(event, raceId) {
  return ((event && event.classes) || []).filter((c) => classAppliesToRace(event, c, raceId));
}

// Normalisasi raceIds sebuah type terhadap daftar jenis event: id yang
// tidak dikenal dibuang; mencakup SEMUA jenis -> [] (= semua).
export function normalizeTypeRaceIds(raceIds, allRaceIds) {
  const all = (allRaceIds || []).filter(Boolean);
  const picked = Array.from(new Set((Array.isArray(raceIds) ? raceIds : []).filter((id) => all.includes(id))));
  return !picked.length || picked.length === all.length ? [] : all.filter((id) => picked.includes(id));
}

/* ======================= Edit Hasil (koreksi operator) ======================= */

// Koreksi hasil oleh operator, disimpan TERPISAH dari kartu mentah
// (participant.resultOverride) supaya bisa dibatalkan & selalu tercatat:
//   { start, finish: "HH:MM:SS" (menggantikan punch kartu),
//     adjustSec: ±detik (penalti / koreksi waktu),
//     status: OK|MP|DNF|DSQ|DNS|NO_START (menggantikan status otomatis),
//     punches: { "<urutan pos>": "HH:MM:SS" | "OK" }  (edit split per pos:
//       jam punch pos dikoreksi, atau "OK" = dianggap dipunch tanpa waktu),
//     note: alasan (wajib), editedAt }
export const OVERRIDE_STATUSES = ["OK", "MP", "DNF", "DSQ", "DNS", "NO_START"];

function clockOrEmpty(v, label) {
  const s = String(v || "").trim();
  if (!s) return "";
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59 || Number(m[3] || 0) > 59) {
    throw new Error(`${label} tidak valid (format HH:MM:SS)`);
  }
  return `${m[1].padStart(2, "0")}:${m[2]}:${m[3] || "00"}`;
}

// "+1:30", "-0:45", "90", "-1:02:00" -> detik (bertanda)
export function parseAdjust(v) {
  const s = String(v === undefined || v === null ? "" : v).trim();
  if (!s || s === "0" || s === "+0" || s === "-0") return 0;
  const m = /^([+-])?(?:(\d+):)?(?:(\d+):)?(\d+)$/.exec(s);
  if (!m) throw new Error("Koreksi waktu tidak valid (contoh: +1:30 atau -0:45)");
  const parts = [m[2], m[3], m[4]].filter((x) => x !== undefined).map(Number);
  const sec = parts.reduce((acc, n) => acc * 60 + n, 0);
  return m[1] === "-" ? -sec : sec;
}

// Normalisasi input form -> objek override, atau null (= tidak ada koreksi).
export function normalizeResultOverride(input) {
  const o = input || {};
  const start = clockOrEmpty(o.start, "Start");
  const finish = clockOrEmpty(o.finish, "Finish");
  const adjustSec = typeof o.adjustSec === "number" ? Math.round(o.adjustSec) : parseAdjust(o.adjust);
  if (Math.abs(adjustSec) > 24 * 3600) throw new Error("Koreksi waktu terlalu besar");
  const status = String(o.status || "").trim().toUpperCase();
  if (status && !OVERRIDE_STATUSES.includes(status)) throw new Error("Status tidak valid");
  const punches = {};
  Object.entries(o.punches && typeof o.punches === "object" ? o.punches : {}).forEach(([order, v]) => {
    const n = Number(order);
    const val = String(v === undefined || v === null ? "" : v).trim();
    if (!Number.isInteger(n) || n < 1 || !val) return;
    punches[n] = val.toUpperCase() === "OK" ? "OK" : clockOrEmpty(val, `Jam pos ${n}`);
  });
  const note = String(o.note || "").trim().slice(0, 300);
  if (!start && !finish && !adjustSec && !status && !Object.keys(punches).length) return null;
  if (!note) throw new Error("Alasan / catatan koreksi wajib diisi");
  return { start, finish, adjustSec, status, punches, note };
}

// Edit split per pos: terapkan koreksi jam punch / "dianggap dipunch" ke
// hasil evaluateCard, lalu hitung ulang waktu kumulatif, leg, pos terlewat
// & status. Waktu total tetap Finish − Start (punch pos tidak mengubahnya).
function patchSplits(ev, card, punches) {
  const startSec = clockToSeconds(card && card.start);
  const finishSec = clockToSeconds(card && card.finish);
  const splits = ev.splits.map((sp) => {
    const v = punches[sp.order];
    if (!v) return { ...sp };
    if (v === "OK") return { ...sp, found: true, punchTime: null, edited: true, accepted: true };
    return { ...sp, found: true, punchTime: v, edited: true, accepted: false };
  });
  let prev = startSec;
  splits.forEach((sp) => {
    const ps = sp.found && sp.punchTime ? clockToSeconds(sp.punchTime) : null;
    sp.cumSec = startSec !== null && ps !== null ? runElapsed(startSec, ps) : null;
    sp.legSec = prev !== null && ps !== null ? runElapsed(prev, ps) : null;
    if (ps !== null) prev = ps;
  });
  const missing = splits.filter((sp) => !sp.found).map((sp) => ({ order: sp.order, code: sp.code }));
  let status = STATUS.OK;
  if (finishSec === null) status = STATUS.DNF;
  else if (startSec === null) status = STATUS.NO_START;
  else if (missing.length) status = STATUS.MP;
  return {
    ...ev,
    splits,
    missing,
    status,
    finishLegSec: prev !== null && finishSec !== null ? runElapsed(prev, finishSec) : null,
  };
}

// Evaluasi kartu + koreksi operator. card boleh null (mis. kartu hilang —
// operator isi start & finish manual). Return evaluasi spt evaluateCard +
// { edited, autoStatus, autoTimeSec, start, finish, startEdited, finishEdited }.
export function evaluateWithOverride(card, override, opts = {}) {
  const ov = override || null;
  const hasTimes = !!(ov && (ov.start || ov.finish));
  if (!card && !hasTimes) {
    if (!ov || !ov.status) return null;
    return {
      status: ov.status, timeSec: null, time: "-", startSource: null, splits: [], missing: [], extra: [],
      edited: true, autoStatus: null, autoTimeSec: null, start: null, finish: null, startEdited: false, finishEdited: false,
    };
  }
  const src = card ? { ...card } : { start: null, finish: null, punches: [] };
  if (ov && ov.start) src.start = ov.start;
  if (ov && ov.finish) src.finish = ov.finish;
  const fixed = ov && ov.punches ? Object.keys(ov.punches).map(Number) : [];
  // pos yang dikoreksi operator tidak ikut dicocokkan ke punch kartu
  let ev = evaluateCard(src, fixed.length ? { ...opts, skipOrders: fixed } : opts);
  const auto = card ? evaluateCard(card, opts) : null;
  if (fixed.length) ev = patchSplits(ev, src, ov.punches);
  let timeSec = ev.timeSec;
  if (ov && ov.adjustSec && Number.isFinite(timeSec)) timeSec = Math.max(0, timeSec + ov.adjustSec);
  // status paksa OK tanpa waktu tidak masuk akal -> tetap status hasil hitungan
  let status = ov && ov.status ? ov.status : ev.status;
  if (status === STATUS.OK && !Number.isFinite(timeSec)) status = ev.status;
  return {
    ...ev,
    timeSec,
    time: formatDuration(timeSec),
    status,
    edited: !!ov,
    autoStatus: auto ? auto.status : null,
    autoTimeSec: auto ? auto.timeSec : null,
    // split ASLI kartu (sebelum koreksi) — utk form edit split
    autoSplits: auto ? auto.splits : [],
    start: src.start || null,
    finish: src.finish || null,
    startEdited: !!(ov && ov.start),
    finishEdited: !!(ov && ov.finish),
  };
}

/* ===================== Tabel split antar pos (tab Hasil) ===================== */

// rows: hasil rankClass() satu kategori (punya splits[] & finishLegSec).
// Return per baris: legs[] = { cumSec, legSec, legRank, cumRank, best, missed }
// utk tiap pos course + 1 leg terakhir ke Finish (index terakhir).
// legRank = peringkat waktu leg itu di antara peserta yang punya waktunya;
// cumRank = posisi (waktu kumulatif) di pos tsb; best = leg tercepat.
export function buildSplitTable(rows, controlCount) {
  const n = Math.max(0, Number(controlCount) || 0);
  const legsOf = (r) => {
    const splits = Array.isArray(r.splits) ? r.splits : [];
    const out = [];
    for (let i = 0; i < n; i++) {
      const s = splits[i] || {};
      out.push({
        cumSec: Number.isFinite(s.cumSec) ? s.cumSec : null,
        legSec: Number.isFinite(s.legSec) ? s.legSec : null,
        missed: s.found === false,
      });
    }
    out.push({
      cumSec: r.status === STATUS.OK && Number.isFinite(r.timeSec) ? r.timeSec : null,
      legSec: Number.isFinite(r.finishLegSec) ? r.finishLegSec : null,
      missed: false,
    });
    return out;
  };
  const table = (rows || []).map((r) => ({ row: r, legs: legsOf(r) }));
  const rankBy = (idx, key, out) => {
    const vals = table.map((t) => t.legs[idx][key]).filter((v) => v !== null).sort((a, b) => a - b);
    table.forEach((t) => {
      const v = t.legs[idx][key];
      t.legs[idx][out] = v === null ? null : vals.indexOf(v) + 1; // seri = peringkat sama
    });
    return vals.length ? vals[0] : null;
  };
  for (let i = 0; i <= n; i++) {
    const bestLeg = rankBy(i, "legSec", "legRank");
    rankBy(i, "cumSec", "cumRank");
    table.forEach((t) => (t.legs[i].best = bestLeg !== null && t.legs[i].legSec === bestLeg));
  }
  return table;
}

/* ====================== Uji Course (tanpa menghitung hasil) ====================== */

// Bandingkan punch SI Card uji dengan urutan course (Classic, pencocokan LCS
// yang sama dgn hasil resmi). Murni pemeriksaan urutan pos — start/finish &
// waktu diabaikan, TIDAK ada yang disimpan.
// Return { ok, total, matched, missing:[{order,code}], extra:[{station,time}],
//          rows:[{ order, code, found, punchTime, punchIndex }] }
export function testCourse(card, controls) {
  const ctl = (controls || []).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const punches = Array.isArray(card && card.punches) ? card.punches : [];
  const idx = matchControlsLCS(ctl, punches);
  const used = new Set(idx.filter((j) => j !== -1));
  const rows = ctl.map((code, i) => ({
    order: i + 1,
    code,
    found: idx[i] !== -1,
    punchTime: idx[i] !== -1 ? punches[idx[i]].time || "" : "",
    punchIndex: idx[i],
  }));
  const missing = rows.filter((r) => !r.found).map((r) => ({ order: r.order, code: r.code }));
  return {
    ok: ctl.length > 0 && missing.length === 0,
    total: ctl.length,
    matched: ctl.length - missing.length,
    missing,
    extra: punches.filter((_p, j) => !used.has(j)).map((p) => ({ station: Number(p.station), time: p.time || "" })),
    rows,
  };
}

/* ============ Import SI Card dari SPORTident (Entries CSV) ============ */

// Kolom ekspor peserta (Entries) SPORTident — urutan & nama persis spt file
// asli, dipakai juga utk "Template SPORTident".
export const SPORTIDENT_COLUMNS = [
  "RaceNumber", "CardNumbers", "MembershipNumbers", "Name", "Category", "Club", "Country", "CourseClass",
  "StartTime", "StartTimePreference", "EnvelopeNumber", "NonCompetitive", "Seeded", "NotUsed", "Handicap",
  "RegistrationNotes", "SiEntriesIDs", "Eligibility", "SocialMedia", "GenderDOB", "Forenames", "Surnames",
  "NotUsed", "NotUsed", "NotUsed", "NotUsed", "CustomField1", "CustomField2", "CustomField3", "CustomField4",
  "CustomField5", "CustomField6", "CustomField7", "CustomField8", "CustomField9", "CustomField10",
];

const normKey = (s) => String(s === undefined || s === null ? "" : s).normalize("NFKC").trim().replace(/\s+/g, " ").toUpperCase();

// Baris CSV SPORTident -> { rowNo, name, category, siCard, bib, club, country }
// Kolom yg DIBACA hanya: Name, Club, Country, CourseClass (= Kategori),
// RaceNumber (= BIB) + CardNumbers (nomor SI Card). Kolom lain (mis.
// MembershipNumbers) diabaikan.
// CardNumbers boleh berisi >1 kartu ("8611237;8611238") -> kartu pertama.
// Return { entries, errors:[{rowNo,name,message}], missingColumns }
export function parseSiEntries(rawRows) {
  const list = Array.isArray(rawRows) ? rawRows : [];
  const keys = new Set(list.length ? Object.keys(list[0]).map((k) => normKey(k)) : []);
  const missingColumns = ["NAME", "COURSECLASS", "CARDNUMBERS"].filter((k) => !keys.has(k)).map((k) =>
    k === "NAME" ? "Name" : k === "COURSECLASS" ? "CourseClass" : "CardNumbers"
  );
  const get = (row, col) => {
    const k = Object.keys(row).find((x) => normKey(x) === normKey(col));
    return k === undefined ? "" : String(row[k] === undefined || row[k] === null ? "" : row[k]).trim();
  };
  const entries = [];
  const errors = [];
  list.forEach((row, i) => {
    const rowNo = i + 2; // baris 1 = header
    const name = get(row, "Name").replace(/\s+/g, " ");
    const category = get(row, "CourseClass");
    const cardRaw = get(row, "CardNumbers");
    if (!name && !category && !cardRaw) return; // baris kosong
    let siCard = null;
    if (cardRaw) {
      const first = cardRaw.split(/[;,\s/]+/).find(Boolean);
      const n = Number(first);
      if (!Number.isInteger(n) || n <= 0) {
        errors.push({ rowNo, name, message: `Nomor SI Card "${cardRaw}" tidak valid` });
        return;
      }
      siCard = n;
    }
    if (!name || !category) {
      errors.push({ rowNo, name, message: "Nama / CourseClass kosong" });
      return;
    }
    entries.push({ rowNo, name, category, siCard, bib: get(row, "RaceNumber"), club: get(row, "Club"), country: get(row, "Country") });
  });
  return { entries, errors, missingColumns };
}

// Rencana assign SI Card utk SATU jenis. Cocok HANYA bila nama & kategori
// sama (tidak peka huruf besar/kecil & spasi ganda) — aturan user.
// participants: [{ _id, name, classId, siCard, bib, iofId }]
// classNameOf(classId) -> nama kategori
// raceClasses (opsional): [{ id, name }] kategori yg dipertandingkan di jenis
//   ini — dipakai utk menawarkan "Peserta baru".
// Return { items, summary }; item = { entry, status, selected, participant?,
//   suggestion?, suggestionBy?, conflictWith?, prevSiCard?, newClassId?, required? }
//   status:
//     assign   SI dipasang ke peserta tanpa SI           (dicentang)
//     change   SI peserta diganti                          (dicentang)
//     remove   SI dikosongkan di file, peserta masih punya (TIDAK dicentang,
//              kecuali kartunya dipindah ke peserta lain di file yg sama)
//     new      nama belum ada di jenis ini & kategorinya ada -> ditambahkan
//              sbg peserta baru dari Name/CourseClass/Club/Country (dicentang)
//     same | nocard               tidak ada perubahan
//     notfound (+ saran: nama sama di kategori lain, atau BIB sama — harus
//              dicentang manual; pencocokan otomatis tetap nama+kategori)
//     conflict | dupcard | ambiguous   tidak bisa diterapkan
export function planSiAssign(entries, participants, classNameOf, raceClasses) {
  const ps = participants || [];
  const cls = classNameOf || (() => "");
  const classByName = new Map((raceClasses || []).map((c) => [categoryKey(c.name), c]));
  const byNameCat = new Map();
  ps.forEach((p) => {
    const k = `${normKey(p.name)}|${categoryKey(cls(p.classId))}`;
    byNameCat.set(k, (byNameCat.get(k) || []).concat(p));
  });
  const cardCount = new Map();
  (entries || []).forEach((e) => e.siCard && cardCount.set(e.siCard, (cardCount.get(e.siCard) || 0) + 1));

  const items = (entries || []).map((entry) => {
    const hits = byNameCat.get(`${normKey(entry.name)}|${categoryKey(entry.category)}`) || [];
    const one = hits.length === 1 ? hits[0] : null;
    if (entry.siCard && cardCount.get(entry.siCard) > 1) return { entry, status: "dupcard", participant: one };
    if (hits.length > 1) return { entry, status: "ambiguous" };
    if (!one) {
      // nama sama tapi kategori beda -> kemungkinan kategori diubah; saran manual
      const sug = ps.filter((p) => normKey(p.name) === normKey(entry.name));
      if (sug.length === 1) {
        return { entry, status: "notfound", suggestion: sug[0], suggestionBy: `nama sama, kategori ${cls(sug[0].classId)}` };
      }
      if (sug.length > 1) return { entry, status: "ambiguous" };
      // BIB (RaceNumber) sama -> mis. nama disingkat di SPORTident
      const byBib = entry.bib ? ps.find((p) => normKey(p.bib) === normKey(entry.bib)) : null;
      if (byBib) return { entry, status: "notfound", suggestion: byBib, suggestionBy: `BIB ${entry.bib}` };
      const c = classByName.get(categoryKey(entry.category));
      if (c) return { entry, status: "new", newClassId: c.id };
      return { entry, status: "notfound", suggestion: null, reason: raceClasses ? "Kategori belum ada di jenis ini" : "" };
    }
    if (!entry.siCard) return { entry, status: one.siCard ? "remove" : "nocard", participant: one, prevSiCard: one.siCard || null };
    if (Number(one.siCard) === entry.siCard) return { entry, status: "same", participant: one };
    return { entry, status: one.siCard ? "change" : "assign", participant: one, prevSiCard: one.siCard || null };
  });

  // kartu sudah dipakai peserta LAIN: boleh hanya bila pemilik itu di file yg
  // sama ikut melepas kartunya (dapat kartu lain = change, atau dikosongkan =
  // remove -> otomatis wajib dicentang). Selain itu = bentrok.
  const itemOf = new Map(items.filter((it) => it.participant).map((it) => [it.participant._id, it]));
  items.forEach((it) => {
    if (!["assign", "change", "new"].includes(it.status)) return;
    const selfId = it.participant ? it.participant._id : null;
    const owner = ps.find((p) => Number(p.siCard) === it.entry.siCard && p._id !== selfId);
    if (!owner) return;
    const ownerItem = itemOf.get(owner._id);
    if (ownerItem && ownerItem.status === "change") return;
    if (ownerItem && ownerItem.status === "remove") {
      ownerItem.required = true; // pindah kartu: pemilik lama wajib dilepas
      return;
    }
    it.status = "conflict";
    it.conflictWith = owner;
  });
  items.forEach((it) => {
    it.selected = it.status === "assign" || it.status === "change" || it.status === "new" || (it.status === "remove" && !!it.required);
  });

  const summary = items.reduce((m, it) => ((m[it.status] = (m[it.status] || 0) + 1), m), {});
  return { items, summary };
}

// Item rencana yg dicentang -> payload utk controller assignSiCards
export function siApplyPayload(items) {
  return (items || [])
    .filter((it) => it.selected)
    .map((it) => {
      if (it.status === "new") {
        const e = it.entry;
        return {
          create: { name: e.name, classId: it.newClassId, bib: e.bib || "", club: e.club || "", nationality: e.country || "" },
          siCard: e.siCard || null,
        };
      }
      if (it.status === "remove") return { participantId: it.participant._id, siCard: null };
      if (it.status === "notfound" && it.suggestion) return { participantId: it.suggestion._id, siCard: it.entry.siCard };
      if (it.status === "assign" || it.status === "change") return { participantId: it.participant._id, siCard: it.entry.siCard };
      return null;
    })
    .filter(Boolean);
}

// Daftar peserta 1 jenis -> baris CSV format SPORTident (Template SPORTident)
export function toSportidentRows(participants, classNameOf) {
  const cls = classNameOf || (() => "");
  return (participants || []).map((p) => {
    const row = {};
    SPORTIDENT_COLUMNS.forEach((c, i) => (row[`${c}#${i}`] = ""));
    row["RaceNumber#0"] = p.bib || "";
    row["CardNumbers#1"] = p.siCard ? String(p.siCard) : "";
    row["MembershipNumbers#2"] = p.iofId || "";
    row["Name#3"] = p.name || "";
    row["Club#5"] = p.club || "";
    row["Country#6"] = p.nationality || "";
    row["CourseClass#7"] = cls(p.classId);
    row["NonCompetitive#11"] = "N";
    return SPORTIDENT_COLUMNS.map((c, i) => row[`${c}#${i}`]);
  });
}

// baris (array) -> teks CSV (kutip bila perlu)
export function toCsv(header, rows) {
  const q = (v) => {
    const s = String(v === undefined || v === null ? "" : v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows].map((r) => r.map(q).join(",")).join("\r\n") + "\r\n";
}

// Byte file CSV -> teks. UTF-8 (dgn/tanpa BOM) bila valid; selain itu
// Windows-1252 (ekspor SPORTident / Excel Windows, mis. "Malmö"). Tanpa ini
// pembaca xlsx menganggap CSV UTF-8 tanpa BOM sbg Latin-1 -> "JÃ¶rg", dan
// nama ber-huruf khusus tidak pernah cocok.
export function decodeCsvBytes(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(u8).replace(/^\uFEFF/, "");
  } catch (_e) {
    return new TextDecoder("windows-1252").decode(u8);
  }
}
