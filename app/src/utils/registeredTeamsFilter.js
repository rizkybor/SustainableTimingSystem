// src/utils/registeredTeamsFilter.js
//
// Cross-check skor per-discipline di dokumen "temporaryOverallEventResults"
// terhadap status registrasi tim yang SEBENARNYA saat ini (teamsRegisteredCollection).
//
// Kenapa perlu: eventResult di dokumen overall itu "cache" hasil per-race yang
// di-merge tiap kali sebuah kategori disimpan — nilainya tidak otomatis hilang
// kalau tim itu kemudian dihapus dari Registered Teams atau dipindah ke
// kombinasi divisi/race lain. Tanpa cross-check ini, skor basi tetap muncul
// di rekap Overall / Print Overall walau tim sudah tidak terdaftar lagi di
// kategori tsb.
//
// Dipakai oleh: EventOverallResult.vue (rekap seluruh kategori dalam 1 event)
// dan modal "Print Result Overall" di tiap halaman *Result.vue (Sprint/H2H/
// Slalom/DRR/RX) — supaya perilakunya konsisten & tidak duplikasi 5x.

import { ipcRenderer } from "electron";

// "categories[].name" di temporaryOverallEventResults kadang beda ejaan dgn
// discipline key yg dipakai teamsRegisteredCollection utk Head to Head
// (HEAD2HEAD saat registrasi, HEADTOHEAD saat hasil di-merge ke rekap).
const DISCIPLINE_KEY_ALIASES = { HEAD2HEAD: "HEADTOHEAD" };

export function normalizeDisciplineKey(key) {
  const up = String(key || "").toUpperCase();
  return DISCIPLINE_KEY_ALIASES[up] || up;
}

// Ambil semua bucket registrasi (lintas race category) utk SATU event —
// selalu di-scope by eventId supaya tidak pernah tercampur dgn event lain.
export function loadRegisteredBucketsByEvent(eventId) {
  return new Promise((resolve) => {
    if (typeof ipcRenderer === "undefined" || !eventId) {
      resolve([]);
      return;
    }
    const timeoutId = setTimeout(() => resolve([]), 5000);
    ipcRenderer.send("teams-registered:find-by-event", String(eventId));
    ipcRenderer.once("teams-registered:find-by-event-reply", (_e, res) => {
      clearTimeout(timeoutId);
      resolve(res && res.ok && Array.isArray(res.items) ? res.items : []);
    });
  });
}

// Apakah `teamName` benar-benar terdaftar di `disciplineKey` (SPRINT/
// HEAD2HEAD/SLALOM/DRR/RX) utk kombinasi initial/race/division ini?
// Fail-open (true) kalau registeredBuckets belum berhasil dimuat sama
// sekali, supaya kegagalan fetch IPC tidak diam-diam menyembunyikan skor
// yang sebenarnya valid.
export function isTeamRegisteredFor(
  registeredBuckets,
  disciplineKey,
  initialName,
  raceName,
  divisionName,
  teamName
) {
  if (!Array.isArray(registeredBuckets) || !registeredBuckets.length) {
    return true;
  }

  const wantedKey = normalizeDisciplineKey(disciplineKey);
  const nameUpper = String(teamName || "").trim().toUpperCase();
  const ini = String(initialName || "").toUpperCase();
  const rac = String(raceName || "").toUpperCase();
  const div = String(divisionName || "").toUpperCase();

  return registeredBuckets.some(
    (b) =>
      normalizeDisciplineKey(b.raceCategory) === wantedKey &&
      String(b.initialName || "").toUpperCase() === ini &&
      String(b.raceName || "").toUpperCase() === rac &&
      String(b.divisionName || "").toUpperCase() === div &&
      Array.isArray(b.teamNames) &&
      b.teamNames.indexOf(nameUpper) !== -1
  );
}
