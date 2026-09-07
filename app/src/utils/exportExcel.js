import * as XLSX from "xlsx";

// Util bersama utk fitur "Download Result (.xlsx)" — dipakai di semua
// halaman Result (per-category & Overall) sebagai alternatif PDF.

function safeSheetName(name) {
  // Excel: nama sheet maks 31 char & tidak boleh berisi : \ / ? * [ ]
  return String(name || "Sheet1")
    .replace(/[:\\/?*[\]]/g, " ")
    .slice(0, 31) || "Sheet1";
}

function safeFilename(name) {
  const base = String(name || "result").replace(/[\\/:*?"<>|]/g, "_");
  return base.endsWith(".xlsx") ? base : base + ".xlsx";
}

/** Export satu tabel (array of plain object) jadi satu file .xlsx */
export function exportRowsToExcel(filename, rows = [], sheetName = "Result") {
  const ws = XLSX.utils.json_to_sheet(Array.isArray(rows) ? rows : []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName(sheetName));
  XLSX.writeFile(wb, safeFilename(filename));
}

/** Export beberapa tabel sekaligus jadi satu file .xlsx (multi-sheet) */
export function exportSheetsToExcel(filename, sheets = []) {
  const wb = XLSX.utils.book_new();
  const list = Array.isArray(sheets) ? sheets : [];
  if (!list.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), "Sheet1");
  } else {
    list.forEach((s) => {
      const ws = XLSX.utils.json_to_sheet(Array.isArray(s && s.rows) ? s.rows : []);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName(s && s.name));
    });
  }
  XLSX.writeFile(wb, safeFilename(filename));
}
