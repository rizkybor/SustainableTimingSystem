// Label + formatting util dipakai bareng oleh TeamDetailsModal (detail satu
// baris tim terdaftar di panel event) dan TeamDetail (halaman global per
// tim) untuk menampilkan field "result" race secara generik — bentuknya
// beda-beda per kategori (Sprint: objek tunggal, Slalom: array per-run,
// DRR: objek dengan sectionPenaltyTime array, dst) jadi field mana saja
// yang benar-benar ada di data itulah yang dirender.

export var RESULT_FIELD_LABELS = [
  ["session", "Session"],
  ["startTime", "Start Time"],
  ["finishTime", "Finish Time"],
  ["raceTime", "Race Time"],
  ["startPenalty", "Start Penalty"],
  ["finishPenalty", "Finish Penalty"],
  ["sectionPenalty", "Section Penalty"],
  ["totalPenalty", "Total Penalty"],
  ["startPenaltyTime", "Start Penalty Time"],
  ["finishPenaltyTime", "Finish Penalty Time"],
  ["sectionPenaltyTime", "Section Penalty Time"],
  ["penaltyTime", "Penalty Time"],
  ["penalty", "Penalty"],
  ["penaltyTotal", "Penalty Total"],
  ["totalTime", "Total Time"],
  ["ranked", "Ranked"],
  ["score", "Score"],
  ["judgesBy", "Judged By"],
  ["judgesTime", "Judged At"],
];

export var MATCH_FIELD_LABELS = [
  ["roundName", "Round"],
  ["heat", "Heat"],
  ["heatId", "Heat ID"],
  ["winLose", "Win / Lose"],
  ["qualified", "Qualified"],
  ["finishPosition", "Finish Position"],
];

export function isEmptyValue(v) {
  return v === null || v === undefined || v === "";
}

export function formatValue(v) {
  if (isEmptyValue(v)) return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) {
    var parts = v.filter(function (x) {
      return !isEmptyValue(x);
    });
    return parts.length ? parts.join(", ") : "-";
  }
  if (typeof v === "object") {
    var out = [];
    Object.keys(v).forEach(function (k) {
      var vv = v[k];
      if (isEmptyValue(vv)) return;
      if (Array.isArray(vv)) {
        var filtered = vv.filter(function (x) {
          return !isEmptyValue(x);
        });
        if (filtered.length) out.push(k + ": " + filtered.join(", "));
        return;
      }
      out.push(k + ": " + vv);
    });
    return out.length ? out.join(" · ") : "-";
  }
  return String(v);
}

export function collectFields(obj, defs) {
  var out = [];
  if (!obj) return out;
  defs.forEach(function (pair) {
    var key = pair[0];
    var label = pair[1];
    if (!Object.prototype.hasOwnProperty.call(obj, key)) return;
    var val = obj[key];
    if (isEmptyValue(val)) return;
    if (Array.isArray(val) && !val.length) return;
    out.push({ label: label, value: formatValue(val) });
  });
  return out;
}
