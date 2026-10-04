// Helper tampilan modal Riwayat Judge (JudgeActionHistoryModal.vue di
// halaman race & UserJudgeHistoryModal.vue di User Management).

// Kelompokkan log per hari (urutan item dipertahankan apa adanya — sumber
// datanya sudah urut receivedAt terbaru dulu).
export function groupByDay(items, dateKey = "receivedAt") {
  const groups = [];
  let current = null;
  (items || []).forEach((it) => {
    const d = new Date(it && it[dateKey]);
    const key = isNaN(d.getTime()) ? "unknown" : d.toDateString();
    if (!current || current.key !== key) {
      current = {
        key,
        label: isNaN(d.getTime())
          ? "Tanpa tanggal"
          : d.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            }),
        items: [],
      };
      groups.push(current);
    }
    current.items.push(it);
  });
  return groups;
}

// Warna pill penalty: + (penalty) amber, − (bonus) hijau, 0 abu.
export function penaltyTone(value) {
  const n = Number(value);
  if (!isFinite(n) || n === 0) return "zero";
  return n > 0 ? "plus" : "minus";
}

export function formatClock(v) {
  const d = new Date(v);
  if (!v || isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
