// src/utils/eventCategories.js
//
// Ambil daftar Race Category (SPRINT/HEAD2HEAD/SLALOM/DRR/RX) yang benar-benar
// dipilih/diaktifkan untuk SATU event tertentu (field `categoriesEvent` pada
// dokumen event, diisi lewat Event Settings) — dipakai supaya modal Race
// Settings & Judges Configuration cuma menampilkan konfigurasi kategori yang
// relevan utk event ini, bukan seluruh 5 kategori selalu tampil.
//
// Selalu di-scope by eventId (get-events-byid) supaya tidak pernah tercampur
// dengan event lain.

import { ipcRenderer } from "electron";

export function loadEnabledCategoryKeys(eventId) {
  return new Promise((resolve) => {
    if (typeof ipcRenderer === "undefined" || !eventId) {
      resolve(null); // null = gagal/tidak diketahui -> caller sebaiknya fail-open
      return;
    }
    const wantedId = String(eventId);

    // BUG FIX (2026-10-05): "get-events-byid-reply" adalah channel yang
    // dipakai BERSAMA banyak komponen lain sekaligus (RaceSettings/
    // JudgesSettings sendiri, 6 halaman Result, SlalomRace, TeamDetail,
    // EventSettings, Details/index.vue, dst — lihat komentar sama di
    // TeamDetail/index.vue). `.once()` polos sebelumnya di sini akan
    // mengambil balasan PERTAMA yang datang di channel itu — kalau
    // kebetulan ada komponen LAIN yang juga memanggil "get-events-byid"
    // utk event id BERBEDA nyaris bersamaan (mis. Details/index.vue
    // sendiri sedang reload info event saat operator membuka modal Race
    // Settings/Judges Configuration), panel yang tampil bisa diam-diam
    // mengikuti categoriesEvent event LAIN, bukan event yang sedang
    // dibuka — fitur filter panel per Event Categories jadi kelihatan
    // "tidak jalan" padahal cuma salah ambil balasan. Pakai `.on()` +
    // cek `res._id` cocok dgn eventId yang KITA minta sendiri sebelum
    // resolve, baru lepas listener-nya.
    const timeoutId = setTimeout(() => {
      ipcRenderer.removeListener("get-events-byid-reply", onReply);
      resolve(null);
    }, 5000);

    function onReply(_e, res) {
      const gotId = res && res._id ? String(res._id) : "";
      if (gotId !== wantedId) return; // balasan utk request komponen lain — abaikan
      clearTimeout(timeoutId);
      ipcRenderer.removeListener("get-events-byid-reply", onReply);
      const list =
        res && Array.isArray(res.categoriesEvent) ? res.categoriesEvent : [];
      if (!list.length) {
        resolve(null); // event belum punya categoriesEvent -> fail-open
        return;
      }
      resolve(new Set(list.map((c) => String((c && c.name) || "").toUpperCase())));
    }

    ipcRenderer.on("get-events-byid-reply", onReply);
    ipcRenderer.send("get-events-byid", wantedId);
  });
}
