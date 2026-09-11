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
    const timeoutId = setTimeout(() => resolve(null), 5000);
    ipcRenderer.send("get-events-byid", String(eventId));
    ipcRenderer.once("get-events-byid-reply", (_e, res) => {
      clearTimeout(timeoutId);
      const list =
        res && Array.isArray(res.categoriesEvent) ? res.categoriesEvent : [];
      if (!list.length) {
        resolve(null); // event belum punya categoriesEvent -> fail-open
        return;
      }
      resolve(new Set(list.map((c) => String((c && c.name) || "").toUpperCase())));
    });
  });
}
