// Jalankan: yarn test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clockToSeconds,
  elapsed,
  formatDuration,
  parseControls,
  evaluateCard,
  rankClass,
  STATUS,
  buildCategoryNames,
  buildCategoryNamesForType,
  buildLiveSnapshot,
  filterParticipants,
  sortParticipants,
  participantResultKey,
  sortResultRows,
  participantBreakdown,
  typeAppliesToRace,
  classesForRace,
  normalizeTypeRaceIds,
  ageGroupsForType,
  mergeCategoryNames,
  normalizeImportRows,
  normalizeStartTime,
  participantMatchKeys,
  courseOf,
  typeNameForCategory,
  genderOfCategory,
} from "../src/lib/orienteering.js";
import XLSX from "xlsx";
import { readFileSync } from "node:fs";

// Start List resmi dari user (MUBLOC VI 2026 Middle Distance) — 113 peserta.
const SAMPLE_CSV = new URL(
  "../src/views/Orienteering/MUBLOC_VI_2026_Middle_Distance_Starting_List_VALIDATED.csv",
  import.meta.url
);
const sheetRows = (buf) => {
  const wb = XLSX.read(buf, { type: "buffer", raw: true });
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: false });
};

// Contoh nyata dari SI Card Reader Test (SI9 #1421234)
const CARD = {
  card_number: 1421234,
  start: "15:31:52",
  finish: "16:19:48",
  check: "15:30:54",
  punches: [
    { station: 33, time: "15:35:02" },
    { station: 31, time: "15:38:19" },
    { station: 35, time: "15:40:40" },
    { station: 34, time: "15:56:12" },
    { station: 37, time: "15:57:51" },
    { station: 42, time: "16:02:35" },
    { station: 38, time: "16:03:35" },
    { station: 40, time: "16:05:13" },
    { station: 39, time: "16:05:51" },
    { station: 36, time: "16:12:19" },
    { station: 35, time: "16:16:42" },
    { station: 49, time: "16:17:33" },
    { station: 43, time: "16:17:46" },
    { station: 45, time: "16:18:10" },
    { station: 47, time: "16:18:29" },
    { station: 46, time: "16:19:06" },
    { station: 48, time: "16:19:23" },
  ],
};
const COURSE = [33, 31, 35, 34, 37, 42, 38, 40, 39, 36, 35, 49, 43, 45, 47, 46, 48];

test("clockToSeconds & label hari SI", () => {
  assert.equal(clockToSeconds("15:31:52"), 55912);
  assert.equal(clockToSeconds("0 Sa 15:30:54"), 55854);
  assert.equal(clockToSeconds(null), null);
  assert.equal(clockToSeconds("unsupported"), null);
  assert.equal(clockToSeconds("25:00:00"), null);
});

test("elapsed melewati tengah malam & formatDuration", () => {
  assert.equal(elapsed(clockToSeconds("23:50:00"), clockToSeconds("00:10:30")), 1230);
  assert.equal(formatDuration(2876), "47:56");
  assert.equal(formatDuration(3725), "1:02:05");
  assert.equal(formatDuration(null), "-");
});

test("parseControls: berbagai pemisah", () => {
  assert.deepEqual(parseControls("33, 31 35-34;37 > 42"), [33, 31, 35, 34, 37, 42]);
  assert.deepEqual(parseControls(""), []);
  assert.deepEqual(parseControls("x, 0, 12"), [12]);
});

test("kartu contoh + course lengkap -> OK 47:56, split benar, pos 35 dua kali", () => {
  const r = evaluateCard(CARD, { controls: COURSE });
  assert.equal(r.status, STATUS.OK);
  assert.equal(r.time, "47:56");
  assert.equal(r.startSource, "card");
  assert.equal(r.missing.length, 0);
  assert.equal(r.extra.length, 0);
  assert.equal(r.splits[0].legSec, 190); // start 15:31:52 -> 33 @15:35:02
  assert.equal(r.splits[10].code, 35); // pos 35 kedua dipakai utk urutan ke-11
  assert.equal(r.splits[10].punchTime, "16:16:42");
  assert.equal(r.finishLegSec, 25); // 48 @16:19:23 -> finish 16:19:48
});

test("pos wajib tidak dikunjungi -> MP dgn daftar pos terlewat", () => {
  const r = evaluateCard(CARD, { controls: [33, 31, 50, 35, 48] });
  assert.equal(r.status, STATUS.MP);
  assert.deepEqual(r.missing, [{ order: 3, code: 50 }]);
  assert.equal(r.splits[3].found, true); // pencarian lanjut setelah pos terlewat
});

test("salah urutan -> MP", () => {
  const r = evaluateCard(CARD, { controls: [31, 33] }); // 33 dipunch SEBELUM 31
  assert.equal(r.status, STATUS.MP);
  assert.deepEqual(r.missing, [{ order: 2, code: 33 }]);
});

test("pos di luar course diabaikan (extra), tetap OK", () => {
  const r = evaluateCard(CARD, { controls: [33, 48] });
  assert.equal(r.status, STATUS.OK);
  assert.equal(r.extra.length, CARD.punches.length - 2);
});

test("tanpa Finish -> DNF; tanpa punch Start -> NO_START (jadwal start TIDAK dipakai)", () => {
  assert.equal(evaluateCard({ ...CARD, finish: null }, { controls: COURSE }).status, STATUS.DNF);
  // walau opsi jadwal start dikirim (kode lama), waktu tetap hanya dari SI Card
  const noStart = evaluateCard({ ...CARD, start: null }, { controls: COURSE, scheduledStart: "15:30:00" });
  assert.equal(noStart.status, STATUS.NO_START);
  assert.equal(noStart.timeSec, null);
  assert.equal(noStart.startSource, null);
  assert.ok(noStart.splits.every((s) => s.cumSec === null)); // split juga tidak dihitung dari jadwal
});

test("rankClass: OK by waktu (seri = rank sama), lainnya tanpa rank di bawah", () => {
  const res = rankClass([
    { name: "C", status: "MP", timeSec: 100 },
    { name: "A", status: "OK", timeSec: 300 },
    { name: "B", status: "OK", timeSec: 200 },
    { name: "D", status: "OK", timeSec: 300 },
    { name: "E", status: "DNF", timeSec: null },
  ]);
  assert.deepEqual(
    res.map((r) => [r.name, r.rank, r.behindSec]),
    [
      ["B", 1, 0],
      ["A", 2, 100],
      ["D", 2, 100],
      ["C", null, null],
      ["E", null, null],
    ]
  );
});

test("buildCategoryNames: M = Men, W = Women, + E utk World Ranking", () => {
  assert.deepEqual(buildCategoryNames([21, 20], ["Men", "Women"]), ["M20", "W20", "M21", "W21"]);
  assert.deepEqual(buildCategoryNames([21], ["Men", "Women"], { elite: true }), ["M21E", "W21E"]);
  assert.deepEqual(buildCategoryNames([20, 20, "x"], ["Women"]), ["W20"]);
  assert.deepEqual(buildCategoryNames([20], ["Other"]), []);
  assert.deepEqual(buildCategoryNames([], ["Men"]), []);
});

test("genderOfCategory dari huruf depan", () => {
  assert.equal(genderOfCategory("M21E"), "Men");
  assert.equal(genderOfCategory("W21 Novice"), "Women");
  assert.equal(genderOfCategory("w20"), "Women");
  assert.equal(genderOfCategory("Open"), null);
});

test("mergeCategoryNames: tanpa dobel (abaikan huruf besar/kecil), urutan lama tetap", () => {
  assert.deepEqual(mergeCategoryNames(["M21E"], ["m21e", "W20", " ", "W20"]), ["M21E", "W20"]);
});

test("normalizeStartTime", () => {
  assert.equal(normalizeStartTime("08:30"), "08:30:00");
  assert.equal(normalizeStartTime("8.05"), "08:05:00");
  assert.equal(normalizeStartTime("09:01:15"), "09:01:15");
  assert.equal(normalizeStartTime(0.3541666667), "08:30:00"); // pecahan hari Excel
  assert.equal(normalizeStartTime("—"), "");
  assert.equal(normalizeStartTime("25:00"), null);
});

test("impor Start List asli MUBLOC VI 2026: 113 peserta, 6 kategori, SI opsional", () => {
  const { rows, errors, missingColumns } = normalizeImportRows(sheetRows(readFileSync(SAMPLE_CSV)));
  assert.deepEqual(missingColumns, []);
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 113);
  const cats = [...new Set(rows.map((r) => r.category))];
  assert.deepEqual(cats.sort(), ["M20", "M21 Novice", "M21E", "W20", "W21 Novice", "W21E"]);
  assert.equal(rows.filter((r) => r.siCard === null).length, 72); // "—" = belum punya SI Card
  const first = rows[0];
  assert.deepEqual(
    { ...first, rowNo: undefined },
    {
      rowNo: undefined,
      category: "M21E",
      startNo: 1,
      scheduledStart: "08:30:00",
      name: "RIDHO PUTRA WIBOWO",
      iofId: "57288",
      iofRanking: null,
      bib: "193",
      club: "MAHAPALA UNNES",
      nationality: "Indonesia",
      siCard: null,
    }
  );
  const quoted = rows.find((r) => r.name === "YU, Tsz Wai"); // nama dgn koma (dikutip)
  assert.equal(quoted.siCard, 8199246);
  assert.equal(quoted.iofRanking, 880);
  assert.equal(rows.find((r) => r.bib === "186").club, "Sispala Palteks, SMK Pustek Serpong");
});

test("normalizeImportRows: header alias, baris kosong, error per baris", () => {
  const { rows, errors } = normalizeImportRows([
    { Kategori: "M21E", Nama: "A", "SI Card": "123", BIB: "1" },
    { Kategori: "", Nama: "", "SI Card": "", BIB: "" },
    { Kategori: "M21E", Nama: "B", "SI Card": "123", BIB: "2" },
    { Kategori: "W21E", Nama: "", "SI Card": "x", BIB: "1" },
  ]);
  assert.equal(rows.length, 1);
  assert.deepEqual(errors.map((e) => e.rowNo), [4, 5]);
  assert.match(errors[0].message, /dobel/);
  assert.match(errors[1].message, /Nama kosong/);
  assert.deepEqual(normalizeImportRows([{ Foo: 1 }]).missingColumns, ["category", "name"]);
});

test("participantMatchKeys: BIB -> IOF -> nama+kategori", () => {
  assert.deepEqual(participantMatchKeys({ bib: "193", iofId: "57288", name: "Ridho" }, "M21E"), [
    "bib:193",
    "iof:57288",
    "name:RIDHO|M21E",
  ]);
});

test("courseOf: course per jenis, cadangan ke controls lama", () => {
  const cls = { controls: [1, 2], courses: { SPR: [31, 32], MID: [] } };
  assert.deepEqual(courseOf(cls, "SPR"), [31, 32]);
  assert.deepEqual(courseOf(cls, "MID"), []); // sengaja dikosongkan -> tetap kosong
  assert.deepEqual(courseOf(cls, "LONG"), [1, 2]); // belum diatur -> controls lama
  assert.deepEqual(courseOf({ controls: [5] }, ""), [5]);
  assert.deepEqual(courseOf(null, "x"), []);
});

test("impor Start List asli MUBLOC VI 2026 Sprint Distance: 115 peserta tanpa error", () => {
  const url = new URL(
    "../src/views/Orienteering/MUBLOC_VI_2026_Sprint_Distance_Starting_List_VALIDATED.csv",
    import.meta.url
  );
  const { rows, errors } = normalizeImportRows(sheetRows(readFileSync(url)));
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 115);
  assert.equal(rows.filter((r) => r.siCard === null).length, 74);
  assert.deepEqual([...new Set(rows.map((r) => r.category))].sort(), ["M20", "M21 Novice", "M21E", "W20", "W21 Novice", "W21E"]);
});

test("typeNameForCategory: akhiran E setelah angka = World Ranking Event", () => {
  assert.equal(typeNameForCategory("W21E"), "World Ranking Event");
  assert.equal(typeNameForCategory("M21E"), "World Ranking Event");
  assert.equal(typeNameForCategory(" m21e "), "World Ranking Event");
  assert.equal(typeNameForCategory("M20"), "National Event");
  assert.equal(typeNameForCategory("W21 Novice"), "National Event"); // berakhiran "e" tapi bukan angka+E
  assert.equal(typeNameForCategory("Open"), "National Event");
});

test("World Ranking Event: hanya umur 21 -> selalu M21E / W21E", () => {
  assert.deepEqual(ageGroupsForType("World Ranking Event"), [21]);
  assert.ok(ageGroupsForType("National Event").includes(20));
  // umur yang dipilih diabaikan, gender tetap dihormati
  assert.deepEqual(buildCategoryNamesForType("World Ranking Event", [20, 35], ["Men", "Women"]), ["M21E", "W21E"]);
  assert.deepEqual(buildCategoryNamesForType(" world ranking event ", [], ["Women"]), ["W21E"]);
  assert.deepEqual(buildCategoryNamesForType("World Ranking Event", [21], []), []);
  // National tidak berubah: tanpa E, umur sesuai pilihan
  assert.deepEqual(buildCategoryNamesForType("National Event", [21, 20], ["Men"]), ["M20", "M21"]);
});

test("buildLiveSnapshot: data publik saja, belum baca kartu = pending (bukan DNS)", () => {
  const ranked = rankClass([
    { name: "A", club: "X", siCard: 111, iofId: "9", status: "OK", timeSec: 600, readAt: new Date(), splits: [{ order: 1, code: 31, cumSec: 60, legSec: 60, punchTime: "10:01:00", found: true }], missing: [] },
    { name: "B", status: "OK", timeSec: 660, readAt: new Date(), splits: [], missing: [] },
    { name: "C", status: "DNS", timeSec: null, readAt: null, manualStatus: "" },
    { name: "D", status: "DNS", timeSec: null, readAt: null, manualStatus: "DNS" },
  ]);
  const snap = buildLiveSnapshot({ classes: [{ classId: "c1", className: "M21E", typeName: "World Ranking Event", controls: [31], results: ranked }] });
  const [cls] = snap.classes;
  assert.equal(cls.total, 4);
  assert.equal(cls.finished, 3);
  const by = Object.fromEntries(cls.rows.map((r) => [r.name, r]));
  const [a, b, c, d] = ["A", "B", "C", "D"].map((n) => by[n]);
  assert.deepEqual(cls.rows.map((r) => r.name), ["A", "B", "D", "C"]); // DNS manual (final) sebelum yg masih belum finish
  assert.equal(a.rank, 1);
  assert.equal(b.behind, "+1:00");
  assert.equal(a.behind, "");
  assert.equal(a.siCard, undefined);
  assert.equal(a.iofId, undefined);
  assert.deepEqual(a.splits, [{ order: 1, code: 31, found: true, punchTime: "10:01:00", cumSec: 60, legSec: 60 }]);
  assert.equal(c.name, "C");
  assert.equal(c.pending, true);
  assert.equal(d.pending, false); // DNS manual dari operator tetap DNS
});

const PS = [
  { _id: "a", name: "Budi", classId: "C1", bib: "12", siCard: 900, club: "Klub B", nationality: "Indonesia", startNo: 2, scheduledStart: "08:41:00" },
  { _id: "b", name: "andi", classId: "C2", bib: "3", siCard: null, club: "Klub A", nationality: "Malaysia", startNo: 1, scheduledStart: "08:40:00" },
  { _id: "c", name: "Citra", classId: "C1", bib: "", siCard: 100, club: "", nationality: "Indonesia", startNo: null, scheduledStart: "" },
];
const RES = {
  a: { status: "OK", timeSec: 700, readAt: new Date() },
  b: { status: "DNS", readAt: null, manualStatus: "" },
  c: { status: "OK", timeSec: 600, readAt: new Date() },
};
const ctxP = { typeOf: (id) => (id === "C1" ? "T1" : "T2"), classNameOf: (id) => (id === "C1" ? "M21E" : "W20"), resultOf: (p) => RES[p._id] };
const ids = (l) => l.map((p) => p._id).join("");

test("filterParticipants: kategori, type, SI, status, negara, cari", () => {
  assert.equal(ids(filterParticipants(PS, { classId: "C1" }, ctxP)), "ac");
  assert.equal(ids(filterParticipants(PS, { typeId: "T2" }, ctxP)), "b");
  assert.equal(ids(filterParticipants(PS, { si: "without" }, ctxP)), "b");
  assert.equal(ids(filterParticipants(PS, { si: "with" }, ctxP)), "ac");
  assert.equal(ids(filterParticipants(PS, { status: "NOT_READ" }, ctxP)), "b");
  assert.equal(ids(filterParticipants(PS, { status: "OK", nationality: "indonesia" }, ctxP)), "ac");
  assert.equal(ids(filterParticipants(PS, { q: "klub a" }, ctxP)), "b");
  assert.equal(ids(filterParticipants(PS, { q: "12" }, ctxP)), "a"); // BIB
  assert.equal(ids(filterParticipants(PS, { q: "90" }, ctxP)), "a"); // awalan SI Card
  assert.equal(participantResultKey({ status: "DNS", manualStatus: "DNS" }), "DNS");
});

test("sortParticipants: asc/desc, kosong selalu di bawah, hasil by status+waktu", () => {
  assert.equal(ids(sortParticipants(PS, "name", "asc", ctxP)), "bac"); // case-insensitive
  assert.equal(ids(sortParticipants(PS, "name", "desc", ctxP)), "cab");
  assert.equal(ids(sortParticipants(PS, "no", "asc", ctxP)), "bac");
  assert.equal(ids(sortParticipants(PS, "no", "desc", ctxP)), "abc"); // null tetap terakhir
  assert.equal(ids(sortParticipants(PS, "bib", "asc", ctxP)), "bac"); // numerik: 3 < 12
  assert.equal(ids(sortParticipants(PS, "si", "asc", ctxP)), "cab");
  assert.equal(ids(sortParticipants(PS, "start", "asc", ctxP)), "bac");
  assert.equal(ids(sortParticipants(PS, "category", "asc", ctxP)), "acb");
  assert.equal(ids(sortParticipants(PS, "result", "asc", ctxP)), "cab"); // OK 600, OK 700, belum baca
  assert.equal(ids(sortParticipants(PS, "", "asc", ctxP)), "abc"); // tanpa sort = urutan asal
});

test("sortResultRows: rank resmi default, waktu/selisih kosong di bawah", () => {
  const rows = rankClass([
    { participantId: "a", name: "Zaki", status: "OK", timeSec: 700, readAt: 1, bib: "5" },
    { participantId: "b", name: "Ayu", status: "OK", timeSec: 600, readAt: 1, bib: "12" },
    { participantId: "c", name: "Budi", status: "MP", timeSec: 550, readAt: 1, bib: "1" },
    { participantId: "d", name: "Cici", status: "DNS", readAt: null, manualStatus: "" },
  ]);
  const ids = (l) => l.map((r) => r.participantId).join("");
  assert.equal(ids(sortResultRows(rows)), "bacd");
  assert.equal(ids(sortResultRows(rows, "rank", "desc")), "dcab");
  assert.equal(ids(sortResultRows(rows, "time", "desc")), "abcd"); // MP & belum baca tanpa waktu -> bawah
  assert.equal(ids(sortResultRows(rows, "behind", "asc")), "bacd");
  assert.equal(ids(sortResultRows(rows, "name", "asc")), "bcda");
  assert.equal(ids(sortResultRows(rows, "bib", "asc")), "cabd");
  assert.equal(ids(sortResultRows(rows, "status", "desc")), "dcab");
});

test("buildLiveSnapshot: belum finish urut jam start lalu No (spt start list), + kolom start", () => {
  const ranked = rankClass([
    { name: "Zed", status: "DNS", readAt: null, manualStatus: "", scheduledStart: "08:42:00", startNo: 3 },
    { name: "Amy", status: "DNS", readAt: null, manualStatus: "", scheduledStart: "08:40:00", startNo: 1 },
    { name: "Bob", status: "DNS", readAt: null, manualStatus: "", scheduledStart: "", startNo: null },
    { name: "Cal", status: "OK", timeSec: 900, readAt: new Date(), scheduledStart: "08:41:00" },
  ]);
  const [cls] = buildLiveSnapshot({ classes: [{ classId: "c", className: "M20", results: ranked }] }).classes;
  assert.deepEqual(cls.rows.map((r) => r.name), ["Cal", "Amy", "Zed", "Bob"]);
  assert.equal(cls.rows[1].start, "08:40");
  assert.equal(cls.rows[3].start, "");
});

test("participantBreakdown: per Type & kategori, orang yg ikut Sprint+Middle dihitung 1x", () => {
  const ev = {
    types: [{ id: "T1", name: "World Ranking Event" }, { id: "T2", name: "National Event" }],
    classes: [
      { id: "C1", name: "M21E", typeId: "T1" },
      { id: "C2", name: "W21E", typeId: "T1" },
      { id: "C3", name: "M20", typeId: "T2" },
      { id: "C4", name: "Open", typeId: "" },
    ],
  };
  const ps = [
    { raceId: "R1", classId: "C1", iofId: "1", name: "A" },
    { raceId: "R2", classId: "C1", iofId: "1", name: "A" }, // orang sama, Middle
    { raceId: "R1", classId: "C2", bib: "7", name: "B" },
    { raceId: "R2", classId: "C2", bib: "7", name: "B" },
    { raceId: "R1", classId: "C3", name: "C" },
    { raceId: "R1", classId: "C4", name: "D" },
  ];
  const b = participantBreakdown(ev, ps);
  assert.equal(b.total, 4);
  assert.deepEqual(
    b.types.map((t) => [t.name, t.participants, t.classes.map((c) => `${c.name}:${c.participants}`).join(",")]),
    [
      ["World Ranking Event", 2, "M21E:1,W21E:1"],
      ["National Event", 1, "M20:1"],
      ["Tanpa Type", 1, "Open:1"],
    ]
  );
});

test("Type Event per jenis: WRE hanya Middle, National keduanya", () => {
  const ev = {
    races: [{ id: "S" }, { id: "M" }],
    types: [
      { id: "W", name: "World Ranking Event", raceIds: ["M"] },
      { id: "N", name: "National Event", raceIds: [] },
    ],
    classes: [
      { id: "c1", name: "M21E", typeId: "W" },
      { id: "c2", name: "M20", typeId: "N" },
      { id: "c3", name: "Open", typeId: "" },
    ],
  };
  assert.equal(typeAppliesToRace(ev.types[0], "S"), false);
  assert.equal(typeAppliesToRace(ev.types[0], "M"), true);
  assert.equal(typeAppliesToRace({ id: "x" }, "S"), true); // data lama tanpa raceIds
  assert.deepEqual(classesForRace(ev, "S").map((c) => c.name), ["M20", "Open"]);
  assert.deepEqual(classesForRace(ev, "M").map((c) => c.name), ["M21E", "M20", "Open"]);
  assert.deepEqual(normalizeTypeRaceIds(["M", "S"], ["S", "M"]), []); // semua = []
  assert.deepEqual(normalizeTypeRaceIds(["M", "X"], ["S", "M"]), ["M"]); // id asing dibuang
  assert.deepEqual(normalizeTypeRaceIds([], ["S", "M"]), []);
});

test("liveRowOf: jadwal start (Starting Order) terpisah dari start/finish SI Card", () => {
  const ev = evaluateCard({ start: "09:00:12", finish: "09:23:40", punches: [] }, { controls: [], scheduledStart: "09:00:00" });
  const [row] = buildLiveSnapshot({
    classes: [{ classId: "c", className: "M21", results: rankClass([{ name: "A", readAt: new Date(), scheduledStart: "09:00:00", start: "09:00:12", finish: "09:23:40", ...ev }]) }],
  }).classes[0].rows;
  assert.equal(row.scheduledStart, "09:00");
  assert.equal(row.cardStart, "09:00:12");
  assert.equal(row.cardFinish, "09:23:40");
  assert.equal(row.startSource, "card");
  // kartu tanpa punch Start -> NO_START, tanpa waktu (jadwal tidak dihitung)
  const ev2 = evaluateCard({ start: null, finish: "09:20:00", punches: [] }, { controls: [], scheduledStart: "09:00:00" });
  const [row2] = buildLiveSnapshot({
    classes: [{ classId: "c", className: "M21", results: rankClass([{ name: "B", readAt: new Date(), scheduledStart: "09:00:00", start: null, finish: "09:20:00", ...ev2 }]) }],
  }).classes[0].rows;
  assert.equal(row2.cardStart, "");
  assert.equal(row2.startSource, null);
  assert.equal(row2.status, "NO_START");
  assert.equal(row2.timeSec, null);
  assert.equal(row2.rank, null);
});

test("sortResultRows: urut Starting Order (jadwal) — kosong di bawah", () => {
  const rows = [
    { participantId: "a", name: "A", status: "OK", timeSec: 700, scheduledStart: "09:10:00" },
    { participantId: "b", name: "B", status: "OK", timeSec: 600, scheduledStart: "09:02:00" },
    { participantId: "c", name: "C", status: "DNS", scheduledStart: "" },
  ];
  assert.equal(sortResultRows(rows, "start", "asc").map((r) => r.participantId).join(""), "bac");
  assert.equal(sortResultRows(rows, "start", "desc").map((r) => r.participantId).join(""), "abc");
});

import { countryCode, flagUrl } from "../src/lib/countryFlag.js";
test("countryFlag: nama, kode IOC & ISO -> ISO2; tak dikenal -> kosong", () => {
  assert.equal(countryCode("Indonesia"), "ID");
  assert.equal(countryCode("INA"), "ID");
  assert.equal(countryCode(" indonesia "), "ID");
  assert.equal(countryCode("MAS"), "MY");
  assert.equal(countryCode("SGP"), "SG");
  assert.equal(countryCode("Atlantis"), "");
  assert.equal(flagUrl("INA", 20), "https://flagcdn.com/w20/id.png");
  assert.equal(flagUrl(""), "");
});

import { normalizeResultOverride, evaluateWithOverride, parseAdjust } from "../src/lib/orienteering.js";
test("Edit Hasil: normalisasi input koreksi", () => {
  assert.equal(normalizeResultOverride({}), null); // tidak ada koreksi
  assert.throws(() => normalizeResultOverride({ status: "DSQ" }), /Alasan/); // alasan wajib
  assert.throws(() => normalizeResultOverride({ start: "25:00", note: "x" }), /Start tidak valid/);
  assert.deepEqual(normalizeResultOverride({ start: "9:00", adjust: "+1:30", status: "ok", note: " jam rusak " }), {
    start: "09:00:00", finish: "", adjustSec: 90, status: "OK", punches: {}, note: "jam rusak",
  });
  assert.equal(parseAdjust("-0:45"), -45);
  assert.equal(parseAdjust("1:02:00"), 3720);
  assert.equal(parseAdjust("30"), 30);
});

test("Edit Hasil: koreksi start/finish, penalti, status — kartu mentah tidak berubah", () => {
  const card = { start: "10:00:00", finish: "10:20:00", punches: [{ station: 31, time: "10:05:00" }] };
  const opts = { controls: [31, 32] }; // 32 terlewat -> MP
  const auto = evaluateWithOverride(card, null, opts);
  assert.equal(auto.status, "MP");
  assert.equal(auto.edited, false);
  // pos 32 ternyata rusak -> operator paksa OK + penalti 1 menit
  const ok = evaluateWithOverride(card, { status: "OK", adjustSec: 60, note: "unit 32 rusak" }, opts);
  assert.equal(ok.status, "OK");
  assert.equal(ok.timeSec, 21 * 60);
  assert.equal(ok.autoStatus, "MP");
  assert.equal(ok.edited, true);
  // kartu tanpa punch Start: operator isi start dari backup
  const noStart = evaluateWithOverride({ ...card, start: null }, { start: "10:01:00", note: "backup" }, { controls: [31] });
  assert.equal(noStart.status, "OK");
  assert.equal(noStart.timeSec, 19 * 60);
  assert.equal(noStart.startEdited, true);
  assert.equal(card.start, "10:00:00"); // kartu asli tidak tersentuh
  // kartu hilang: start & finish manual
  const lost = evaluateWithOverride(null, { start: "10:00:00", finish: "10:30:00", status: "OK", note: "kartu hilang" }, { controls: [31] });
  assert.equal(lost.timeSec, 1800);
  assert.equal(lost.status, "OK");
  // paksa OK tanpa waktu -> tidak mungkin, tetap status hitungan
  assert.equal(evaluateWithOverride({ start: null, finish: null, punches: [] }, { status: "OK", note: "x" }, {}).status, "DNF");
  // status saja tanpa kartu
  assert.equal(evaluateWithOverride(null, { status: "DSQ", note: "x" }, {}).status, "DSQ");
});

test("Edit Hasil: rank diurutkan ulang otomatis setelah koreksi", () => {
  const card = (fin) => ({ start: "10:00:00", finish: fin, punches: [] });
  const rows = [
    { name: "A", ...evaluateWithOverride(card("10:20:00"), null, {}) },
    { name: "B", ...evaluateWithOverride(card("10:22:00"), null, {}) },
  ];
  assert.deepEqual(rankClass(rows).map((r) => `${r.rank}${r.name}`), ["1A", "2B"]);
  // A kena penalti 3 menit -> B jadi #1
  rows[0] = { name: "A", ...evaluateWithOverride(card("10:20:00"), { adjustSec: 180, note: "penalti" }, {}) };
  assert.deepEqual(rankClass(rows).map((r) => `${r.rank}${r.name}`), ["1B", "2A"]);
});

import { buildSplitTable } from "../src/lib/orienteering.js";
test("buildSplitTable: waktu kumulatif/leg per pos + peringkat leg, leg tercepat, finish", () => {
  const ctl = [31, 32];
  const card = (p1, p2, fin) => ({
    start: "10:00:00",
    finish: fin,
    punches: [p1 && { station: 31, time: p1 }, p2 && { station: 32, time: p2 }].filter(Boolean),
  });
  const rows = rankClass([
    { name: "A", ...evaluateCard(card("10:02:00", "10:06:00", "10:07:00"), { controls: ctl }) }, // leg 2:00, 4:00, 1:00
    { name: "B", ...evaluateCard(card("10:03:00", "10:05:00", "10:06:30"), { controls: ctl }) }, // leg 3:00, 2:00, 1:30
    { name: "C", ...evaluateCard(card("10:01:30", null, "10:05:00"), { controls: ctl }) }, // pos 32 terlewat -> MP
  ]);
  const t = buildSplitTable(rows, ctl.length);
  const by = Object.fromEntries(t.map((x) => [x.row.name, x.legs]));
  assert.equal(by.A.length, 3); // 2 pos + finish
  assert.equal(by.C[0].legRank, 1); // C tercepat ke pos 1 (1:30)
  assert.equal(by.C[0].best, true);
  assert.equal(by.A[0].legRank, 2);
  assert.equal(by.B[1].legSec, 120);
  assert.equal(by.B[1].best, true); // B tercepat pos 1->2
  assert.equal(by.C[1].missed, true);
  assert.equal(by.C[1].legRank, null);
  assert.equal(by.B[1].cumRank, 1); // B di depan di pos 2 (5:00 vs 6:00)
  assert.equal(by.A[2].legSec, 60); // leg ke Finish
  assert.equal(by.A[2].best, true);
  assert.equal(by.B[2].cumSec, 390); // waktu akhir = kumulatif finish
  assert.equal(by.C[2].cumSec, null); // MP tidak punya waktu resmi
});

test("Edit split per pos: jam punch dikoreksi / dianggap dipunch -> status & split dihitung ulang", () => {
  const card = { start: "10:00:00", finish: "10:20:00", punches: [{ station: 31, time: "10:05:00" }, { station: 33, time: "10:15:00" }] };
  const opts = { controls: [31, 32, 33] }; // 32 terlewat -> MP
  assert.equal(evaluateWithOverride(card, null, opts).status, "MP");
  assert.throws(() => normalizeResultOverride({ punches: { 2: "99:00" }, note: "x" }), /Jam pos 2/);
  // pos 32: jam dari unit backup 10:09:30
  const ov1 = normalizeResultOverride({ punches: { 2: "10:09:30" }, note: "backup unit 32" });
  const a = evaluateWithOverride(card, ov1, opts);
  assert.equal(a.status, "OK");
  assert.equal(a.missing.length, 0);
  assert.equal(a.splits[1].cumSec, 570);
  assert.equal(a.splits[1].legSec, 270); // 10:05:00 -> 10:09:30
  assert.equal(a.splits[2].legSec, 330); // 10:09:30 -> 10:15:00 (leg berikutnya ikut dihitung ulang)
  assert.equal(a.splits[1].edited, true);
  assert.equal(a.timeSec, 1200); // waktu total tetap Finish - Start
  assert.equal(a.autoSplits[1].found, false); // split asli tetap tercatat
  // pos 32 dianggap dipunch tanpa waktu (unit rusak)
  const b = evaluateWithOverride(card, normalizeResultOverride({ punches: { 2: "ok" }, note: "unit rusak" }), opts);
  assert.equal(b.status, "OK");
  assert.equal(b.splits[1].found, true);
  assert.equal(b.splits[1].cumSec, null);
  assert.equal(b.splits[2].legSec, 600); // leg pos 31 -> 33 (melewati pos tanpa waktu)
  // koreksi jam pos yang sudah dipunch
  const c = evaluateWithOverride(card, normalizeResultOverride({ punches: { 1: "10:04:00", 2: "OK" }, note: "jam unit 31 salah" }), opts);
  assert.equal(c.splits[0].cumSec, 240);
  assert.equal(card.punches[0].time, "10:05:00"); // kartu mentah tidak berubah
});
