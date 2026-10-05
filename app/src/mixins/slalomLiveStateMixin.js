import { ipcRenderer } from "electron";

// Live Result Slalom per langkah input operator — pola sama dgn
// sprintLiveStateMixin.js, tapi per tim PER RUN (sessions[0] = Run 1,
// sessions[1] = Run 2).
//
// Mengamati tabel Output Racetime (this.teams) dan mengirim snapshot run yg
// BERUBAH — Start Time, Pen. Start, penalty Gate 1..N, Pen. Finish, Finish
// Time, flag DNF/DNS/DSQ per run, maupun Reset — ke main process
// ("slalom:live-state" -> upsertSlalomLiveState.js -> slalomlivepreviews +
// broadcast results:updated). Lewat watcher supaya penalty gate dari juri
// (socket) juga ikut terkirim tanpa mengubah logika socket SlalomRace.vue.

const FLUSH_MS = 400;

function runSnapshot(team, session, runNumber) {
  const s = session || {};
  return {
    teamId: String((team && (team.teamId || team.bibNumber)) || ""),
    bibTeam: String((team && team.bibNumber) || ""),
    nameTeam: String((team && team.nameTeam) || ""),
    runNumber,
    startTime: s.startTime ? String(s.startTime) : "",
    finishTime: s.finishTime ? String(s.finishTime) : "",
    raceTime: s.raceTime ? String(s.raceTime) : "",
    startPenalty: Number(s.startPenalty) || 0,
    finishPenalty: Number(s.finishPenalty) || 0,
    gatePenalties: Array.isArray(s.penalties)
      ? s.penalties.map((g) => Number(g) || 0)
      : [],
    totalPenalty: Number(s.totalPenalty) || 0,
    penaltyTime: String(s.penaltyTime || ""),
    totalTime: s.totalTime ? String(s.totalTime) : "",
    flag: s.flag ? String(s.flag) : null,
  };
}

function isEmptySnap(s) {
  return !s.startTime && !s.finishTime && !s.flag;
}

export default {
  watch: {
    teams: {
      deep: true,
      handler() {
        clearTimeout(this.$_slalomLiveTimer);
        this.$_slalomLiveTimer = setTimeout(
          () => this.$_flushSlalomLiveState(),
          FLUSH_MS
        );
      },
    },
  },

  methods: {
    $_flushSlalomLiveState() {
      if (typeof ipcRenderer === "undefined") return;
      // Bucket yg datanya BENAR-BENAR sedang termuat di this.teams (bukan
      // selectedSlalomKey yg sudah berganti duluan saat pindah kategori).
      const key = this.activeSlalomBucketKey;
      const b = key && this.slalomBucketMap ? this.slalomBucketMap[key] : null;
      if (!b || !b.eventId) return;

      const teams = Array.isArray(this.teams) ? this.teams : [];
      if (!teams.length) return;

      const current = {};
      teams.forEach((team) => {
        const sessions = Array.isArray(team && team.sessions) ? team.sessions : [];
        sessions.forEach((s, idx) => {
          const snap = runSnapshot(team, s, idx + 1);
          if (snap.teamId) current[snap.teamId + "#" + snap.runNumber] = snap;
        });
      });

      // Snapshot pertama per bucket = acuan (hasil load/hydrate), tidak dikirim.
      const base = this.$_slalomLiveBase;
      if (!base || base.key !== key) {
        this.$_slalomLiveBase = { key, map: current };
        return;
      }

      const changed = [];
      Object.keys(current).forEach((k) => {
        const now = current[k];
        const prev = base.map[k];
        if (prev && JSON.stringify(prev) === JSON.stringify(now)) return;
        // Run kosong cuma dikirim kalau sebelumnya berisi (= Reset).
        if (isEmptySnap(now) && (!prev || isEmptySnap(prev))) return;
        changed.push(now);
      });
      this.$_slalomLiveBase = { key, map: current };
      if (!changed.length) return;

      try {
        ipcRenderer.send("slalom:live-state", {
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
    if (this.$_slalomLiveTimer) {
      clearTimeout(this.$_slalomLiveTimer);
      this.$_flushSlalomLiveState();
    }
  },
};
