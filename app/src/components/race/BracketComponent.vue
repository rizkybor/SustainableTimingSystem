<template>
  <div class="bracket-shell">
    <div class="toolbar">
      <div class="left">
        <strong>{{ title }}</strong>
        <span class="muted">• {{ totalTeams }} teams • Single Elimination</span>
      </div>
      <div class="right">
        <b-button size="sm" variant="outline-secondary" @click="$emit('reset')"
          >Reset</b-button
        >
        <b-button
          size="sm"
          variant="outline-info"
          class="ml-2"
          @click="$emit('autofill')"
          >Auto Fill Winners</b-button
        >
      </div>
    </div>

    <div class="rounds" role="list">
      <div
        v-for="(round, rIndex) in rounds"
        :key="round.id"
        class="round"
        role="listitem"
      >
        <div class="round-title">{{ round.name }}</div>

        <div class="matches">
          <div
            v-for="(m, mIndex) in round.matches"
            :key="m.id"
            class="match-card"
            :class="{ decided: !!m.winner }"
            @keydown.enter.prevent="onPickWinnerKey(rIndex, mIndex, m)"
            tabindex="0"
            aria-label="match card"
          >
            <!-- Team 1 -->
            <button
              type="button"
              class="team"
              :class="{ win: m.winner === 'team1' }"
              @click="pickWinner(rIndex, mIndex, 'team1')"
            >
              <span class="seed" v-if="m.team1 && m.team1.seed"
                >#{{ m.team1.seed }}</span
              >
              <span class="name">{{ safeName(m.team1) }}</span>
              <span
                class="score"
                v-if="m.score1 !== null && m.score1 !== undefined"
                >{{ m.score1 }}</span
              >
            </button>

            <!-- Team 2 -->
            <button
              type="button"
              class="team"
              :class="{ win: m.winner === 'team2' }"
              @click="pickWinner(rIndex, mIndex, 'team2')"
            >
              <span class="seed" v-if="m.team2 && m.team2.seed"
                >#{{ m.team2.seed }}</span
              >
              <span class="name">{{ safeName(m.team2) }}</span>
              <span
                class="score"
                v-if="m.score2 !== null && m.score2 !== undefined"
                >{{ m.score2 }}</span
              >
            </button>

            <div class="meta">
              <small class="mono">M{{ m.id }}</small>
              <small v-if="m.winner" class="pill">
                Winner: {{ winnerName(m) }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="legend">
      <span class="pill">Click a team to set winner → auto advances</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "SimpleBracket",
  props: {
    title: { type: String, default: "Head to Head Bracket" },
    rounds: { type: Array, required: true },
  },
  computed: {
    totalTeams() {
      const r0 = this.rounds && this.rounds[0];
      return r0 ? r0.matches.length * 2 : 0;
    },
  },
  methods: {
    safeName(team) {
      return team && team.name ? team.name : "TBD";
    },
    winnerKey(w) {
      return w === "team1" ? "team1" : "team2";
    },
    winnerName(m) {
      const key = this.winnerKey(m.winner);
      const t = m[key];
      return this.safeName(t);
    },
    onPickWinnerKey(rIndex, mIndex, m) {
      if (!m.winner) this.pickWinner(rIndex, mIndex, "team1");
    },
    pickWinner(rIndex, mIndex, side) {
      const rounds = this.rounds;
      const match = rounds[rIndex].matches[mIndex];
      if (!match) return;

      match.winner = side;

      const advanceTeam = side === "team1" ? match.team1 : match.team2;
      if (!advanceTeam) return;

      const nextRound = rounds[rIndex + 1];
      if (!nextRound) return;

      const nextMatchIndex = Math.floor(mIndex / 2);
      const nextMatch = nextRound.matches[nextMatchIndex];
      if (!nextMatch) return;

      if (mIndex % 2 === 0) nextMatch.team1 = Object.assign({}, advanceTeam);
      else nextMatch.team2 = Object.assign({}, advanceTeam);

      nextMatch.winner = null;

      // bersihkan cabang setelahnya
      for (let rr = rIndex + 2; rr < rounds.length; rr++) {
        rounds[rr].matches.forEach((mm) => {
          if (mm.team1 && mm.team1.id === advanceTeam.id) {
            mm.team1 = null;
            mm.winner = null;
          }
          if (mm.team2 && mm.team2.id === advanceTeam.id) {
            mm.team2 = null;
            mm.winner = null;
          }
        });
      }

      this.$emit("update:rounds", rounds);
    },
  },
};
</script>

<style scoped>
.bracket-shell {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  background: #fff;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.toolbar .muted {
  color: #6b7280;
  margin-left: 8px;
}
.rounds {
  display: flex;
  gap: 22px;
  padding: 14px;
  overflow-x: auto;
}
.round {
  min-width: 260px;
}
.round-title {
  font-weight: 800;
  letter-spacing: 0.3px;
  font-size: 14px;
  margin: 6px 0 10px;
  color: #374151;
}
.matches {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.match-card {
  background: #f9fafb;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 8px;
  outline: none;
}
.match-card.decided {
  background: #eef7ff;
}
.team {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 8px 10px;
  margin: 4px 0;
  text-align: left;
  cursor: pointer;
  transition: transform 0.05s ease;
}
.team:hover {
  transform: translateY(-1px);
}
.team.win {
  border-color: #1874a5;
  box-shadow: 0 0 0 2px rgba(24, 116, 165, 0.12) inset;
}
.seed {
  font-weight: 700;
  color: #6b7280;
  margin-right: 6px;
}
.name {
  font-weight: 700;
}
.score {
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
  margin-top: 2px;
}
.mono {
  font-variant-numeric: tabular-nums;
  color: #6b7280;
}
.pill {
  background: #e5f2f9;
  color: #0f4d68;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
}
.legend {
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
  padding: 10px 14px;
  color: #475569;
}
</style>
