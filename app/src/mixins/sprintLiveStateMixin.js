import { ipcRenderer } from "electron";

// Live Result Sprint per langkah input operator.
//
// Mengamati tabel Output Racetime (participant) dan mengirim snapshot baris
// tim yang BERUBAH — Start Time, Pen. Start (PS), Pen. Finish (PF), Finish
// Time, flag DNF/DNS/DSQ, maupun Reset — ke main process ("sprint:live-
// state" -> upsertSprintLiveState.js -> sprintlivepreviews + broadcast
// results:updated). Live Result jurysystem menurunkan kondisi tim (Belum
// Start / On Course / Finish / DNS-DNF-DSQ) dari data ini.
//
// Sengaja lewat WATCHER (bukan menyisipkan panggilan di tiap handler)
// supaya penalty dari juri yang masuk via applyPenaltyFromSocket() juga
// ikut terkirim TANPA mengubah logika socket SprintRace.vue yang sudah
// di-harden. Watcher lama (simpan cache lokal) tetap utuh — Vue
// menggabungkan watcher mixin & komponen.

const FLUSH_MS = 400;

function snapshot(row) {
  const r = (row && row.result) || {};
  return {
    teamId: String((row && row.teamId) || ""),
    bibTeam: String((row && row.bibTeam) || ""),
    nameTeam: String((row && row.nameTeam) || ""),
    startTime: r.startTime ? String(r.startTime) : "",
    finishTime: r.finishTime ? String(r.finishTime) : "",
    raceTime: r.raceTime ? String(r.raceTime) : "",
    startPenalty: Number(r.startPenalty) || 0,
    finishPenalty: Number(r.finishPenalty) || 0,
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
        clearTimeout(this.$_sprintLiveTimer);
        this.$_sprintLiveTimer = setTimeout(
          () => this.$_flushSprintLiveState(),
          FLUSH_MS
        );
      },
    },
  },

  methods: {
    $_flushSprintLiveState() {
      if (typeof ipcRenderer === "undefined") return;
      const key = this.selectedSprintKey;
      const b = key && this.sprintBucketMap ? this.sprintBucketMap[key] : null;
      if (!b || !b.eventId) return;

      const rows = Array.isArray(this.participantArr) ? this.participantArr : [];
      if (!rows.length) return;

      const current = {};
      rows.forEach((row) => {
        const s = snapshot(row);
        if (s.teamId) current[s.teamId] = s;
      });

      // Snapshot pertama per bucket = acuan (data hasil load/hydrate dari
      // DB, bukan input baru) — tidak dikirim.
      const base = this.$_sprintLiveBase;
      if (!base || base.key !== key) {
        this.$_sprintLiveBase = { key, map: current };
        return;
      }

      const changed = [];
      Object.keys(current).forEach((teamId) => {
        const now = current[teamId];
        const prev = base.map[teamId];
        if (prev && JSON.stringify(prev) === JSON.stringify(now)) return;
        // Baris kosong cuma dikirim kalau SEBELUMNYA berisi (= Reset), supaya
        // baris yg memang belum diisi tidak menghapus apa pun.
        if (isEmptySnap(now) && (!prev || isEmptySnap(prev))) return;
        changed.push(now);
      });
      this.$_sprintLiveBase = { key, map: current };
      if (!changed.length) return;

      try {
        ipcRenderer.send("sprint:live-state", {
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
    // Kirim perubahan terakhir yang masih tertunda sebelum halaman ditutup.
    if (this.$_sprintLiveTimer) {
      clearTimeout(this.$_sprintLiveTimer);
      this.$_flushSprintLiveState();
    }
  },
};
