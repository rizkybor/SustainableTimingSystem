import { ipcRenderer } from "electron";

// Live Result DRR per langkah input operator — pola sama dgn
// sprintLiveStateMixin.js.
//
// Mengamati tabel Output Racetime (participant) dan mengirim snapshot baris
// tim yang BERUBAH — Start Time, Pen. Start, penalty Section 1..N (termasuk
// akumulasi ±10), Pen. Finish, Finish Time, flag DNF/DNS/DSQ, maupun Reset —
// ke main process ("drr:live-state" -> upsertDrrLiveState.js ->
// drrlivepreviews + broadcast results:updated). Lewat watcher supaya penalty
// juri (socket, termasuk akumulasi Section ±10) ikut terkirim tanpa mengubah
// logika applyPenaltyFromSocketDirect() di DownRiverRace.vue.
//
// BEDA dgn Sprint/Slalom: snapshot pertama per bucket TETAP dikirim (baris
// yang berisi saja). DRR bisa berlomba lintas kategori bersamaan — penalty
// juri utk bucket yang sedang TIDAK dibuka ditampung di drrBucketCache &
// baru masuk tabel saat operator pindah ke bucket itu; kalau snapshot awal
// dijadikan acuan tanpa dikirim, perubahan itu tidak pernah sampai ke Live
// Result. Mengirim ulang data yang sama aman (idempotent).

const FLUSH_MS = 400;

// "HH:MM:SS(.ms)" (boleh diawali "-" = bonus) -> detik, sama aturan dgn
// timeToPenaltyValue() di DownRiverRace.vue.
function penaltyTimeToSeconds(timeStr) {
  const p = String(timeStr || "");
  if (!p) return 0;
  const neg = p.startsWith("-");
  const [hh = "0", mm = "0", ssms = "0"] = p.replace("-", "").split(":");
  const val = (Number(hh) || 0) * 3600 + (Number(mm) || 0) * 60 + (parseFloat(ssms) || 0);
  return (neg ? -1 : 1) * Math.round(val);
}

function snapshot(row) {
  const r = (row && row.result) || {};
  const sectionRaw = Array.isArray(r.penaltySection) ? r.penaltySection : [];
  return {
    teamId: String((row && row.teamId) || ""),
    bibTeam: String((row && row.bibTeam) || ""),
    nameTeam: String((row && row.nameTeam) || ""),
    startTime: r.startTime ? String(r.startTime) : "",
    finishTime: r.finishTime ? String(r.finishTime) : "",
    raceTime: r.raceTime ? String(r.raceTime) : "",
    startPenalty: Number(r.startPenalty) || 0,
    finishPenalty: Number(r.finishPenalty) || 0,
    sectionPenaltyTime: sectionRaw.map((v) => String(v || "")),
    sectionPenalties: sectionRaw.map(penaltyTimeToSeconds),
    sectionPenalty: Number(r.sectionPenalty) || 0,
    totalPenalty: Number(r.totalPenalty) || 0,
    penaltyTime: String(r.totalPenaltyTime || r.penaltyTime || ""),
    totalTime: r.totalTime ? String(r.totalTime) : "",
    flag: r.flag ? String(r.flag) : null,
  };
}

function isEmptySnap(s) {
  return !s.startTime && !s.finishTime && !s.flag;
}

export default {
  watch: {
    participant: {
      deep: true,
      handler() {
        clearTimeout(this.$_drrLiveTimer);
        this.$_drrLiveTimer = setTimeout(() => this.$_flushDrrLiveState(), FLUSH_MS);
      },
    },
  },

  methods: {
    $_flushDrrLiveState() {
      if (typeof ipcRenderer === "undefined") return;
      // Bucket yg datanya BENAR-BENAR sedang termuat (bukan selectedDrrKey
      // yg sudah berganti duluan saat pindah kategori).
      const key = this.activeDrrBucketKey;
      const b = key && this.drrBucketMap ? this.drrBucketMap[key] : null;
      if (!b || !b.eventId) return;

      const rows = Array.isArray(this.participantArr) ? this.participantArr : [];
      if (!rows.length) return;

      const current = {};
      rows.forEach((row) => {
        const s = snapshot(row);
        if (s.teamId) current[s.teamId] = s;
      });

      const base = this.$_drrLiveBase;
      const prevMap = base && base.key === key ? base.map : {};
      const changed = [];
      Object.keys(current).forEach((teamId) => {
        const now = current[teamId];
        const prev = prevMap[teamId];
        if (prev && JSON.stringify(prev) === JSON.stringify(now)) return;
        // Baris kosong cuma dikirim kalau sebelumnya berisi (= Reset).
        if (isEmptySnap(now) && (!prev || isEmptySnap(prev))) return;
        changed.push(now);
      });
      this.$_drrLiveBase = { key, map: current };
      if (!changed.length) return;

      try {
        ipcRenderer.send("drr:live-state", {
          bucket: {
            eventId: String(b.eventId || ""),
            initialId: String(b.initialId || ""),
            divisionId: String(b.divisionId || ""),
            raceId: String(b.raceId || ""),
          },
          rows: changed,
        });
      } catch (_e) {
        // non-critical — jangan ganggu input operator
      }
    },
  },

  beforeDestroy() {
    if (this.$_drrLiveTimer) {
      clearTimeout(this.$_drrLiveTimer);
      this.$_flushDrrLiveState();
    }
  },
};
