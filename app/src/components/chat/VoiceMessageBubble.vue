<template>
  <div class="voice-msg" :class="{ 'voice-msg--own': isOwn }">
    <button
      type="button"
      class="voice-msg-btn"
      :aria-label="playing ? 'Jeda' : 'Putar'"
      @click="toggle"
    >
      <Icon :icon="playing ? 'mdi:pause' : 'mdi:play'" width="15" height="15" />
    </button>
    <div class="voice-msg-track">
      <div class="voice-msg-progress" :style="{ width: progressPct + '%' }"></div>
    </div>
    <span class="voice-msg-time">{{ timeLabel }}</span>
    <audio
      ref="audioEl"
      :src="url"
      preload="metadata"
      style="display: none"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoaded"
      @ended="onEnded"
    />
  </div>
</template>

<script>
import { Icon } from "@iconify/vue2";

function formatDuration(totalSeconds) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default {
  name: "VoiceMessageBubble",
  components: { Icon },
  props: {
    url: { type: String, required: true },
    duration: { type: Number, default: 0 },
    isOwn: { type: Boolean, default: false },
  },
  data() {
    return {
      playing: false,
      currentTime: 0,
      totalDuration: this.duration || 0,
    };
  },
  computed: {
    progressPct() {
      if (!this.totalDuration) return 0;
      return Math.min(100, (this.currentTime / this.totalDuration) * 100);
    },
    timeLabel() {
      return formatDuration(this.currentTime > 0 ? this.currentTime : this.totalDuration);
    },
  },
  beforeDestroy() {
    if (this.$refs.audioEl) this.$refs.audioEl.pause();
  },
  methods: {
    toggle() {
      const el = this.$refs.audioEl;
      if (!el) return;
      if (this.playing) {
        el.pause();
        this.playing = false;
      } else {
        el.play().catch(() => {});
        this.playing = true;
      }
    },
    onTimeUpdate() {
      if (this.$refs.audioEl) this.currentTime = this.$refs.audioEl.currentTime;
    },
    onLoaded() {
      const el = this.$refs.audioEl;
      if (el && Number.isFinite(el.duration) && el.duration > 0) {
        this.totalDuration = el.duration;
      }
    },
    onEnded() {
      this.playing = false;
      this.currentTime = 0;
    },
  },
};
</script>

<style scoped>
.voice-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  background: #f1f5f9;
  min-width: 185px;
  margin-bottom: 4px;
}
.voice-msg--own {
  background: rgba(255, 255, 255, 0.18);
}
.voice-msg-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #1874a5;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.voice-msg--own .voice-msg-btn {
  background: #fff;
  color: #1874a5;
}
.voice-msg-track {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: #cbd5e1;
  overflow: hidden;
}
.voice-msg--own .voice-msg-track {
  background: rgba(255, 255, 255, 0.35);
}
.voice-msg-progress {
  height: 100%;
  background: #1874a5;
  border-radius: 999px;
  transition: width 0.1s linear;
}
.voice-msg--own .voice-msg-progress {
  background: #fff;
}
.voice-msg-time {
  font-size: 10px;
  color: #64748b;
  flex-shrink: 0;
  min-width: 26px;
  text-align: right;
}
.voice-msg--own .voice-msg-time {
  color: rgba(255, 255, 255, 0.85);
}
</style>
