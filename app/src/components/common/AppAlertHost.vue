<template>
  <transition name="aah-fade">
    <div
      v-if="current"
      class="aah-backdrop"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="'aah-title-' + current.id"
      @click.self="close"
    >
      <transition name="aah-pop" appear>
        <div :key="current.id" class="aah-card" :class="'aah-card--' + current.variant">
          <div class="aah-icon">
            <Icon :icon="iconFor(current.variant)" width="30" height="30" />
          </div>

          <h5 :id="'aah-title-' + current.id" class="aah-title">
            {{ current.title }}
          </h5>
          <p v-if="current.detail" class="aah-detail">{{ current.detail }}</p>

          <div class="aah-actions">
            <button
              v-for="(label, i) in current.buttons"
              :key="i"
              ref="buttons"
              type="button"
              class="aah-btn"
              :class="i === 0 ? 'aah-btn--primary' : 'aah-btn--ghost'"
              @click="close"
            >
              {{ label }}
            </button>
          </div>

          <div v-if="queue.length" class="aah-queue">
            +{{ queue.length }} pesan lagi
          </div>

          <!-- Alert sukses menutup sendiri; bar ini menunjukkan sisa waktunya -->
          <div
            v-if="current.autoCloseMs"
            :key="'bar-' + current.id"
            class="aah-timer"
            :style="{ animationDuration: current.autoCloseMs + 'ms' }"
          ></div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
// Pengganti dialog native Electron (dialog.showMessageBox) yang dulu dipakai
// ipcMain "get-alert" / "get-alert-saved" — main process sekarang meneruskan
// opsinya ke sini lewat "app-alert:show", jadi SEMUA pemanggil lama
// (ipcRenderer.send("get-alert", {...})) otomatis memakai tampilan ini tanpa
// perlu diubah. Alert antre (satu per satu), Enter/Esc menutup.
import { ipcRenderer } from "electron";

const SUCCESS_AUTO_CLOSE_MS = 3500;
const SUCCESS_WORDS = /^(success|successfully|berhasil|saved|import selesai|selesai)/i;

let seq = 0;

export default {
  name: "AppAlertHost",
  data() {
    return {
      current: null,
      queue: [],
    };
  },
  mounted() {
    this._onShow = (_e, opts) => this.push(opts);
    ipcRenderer.on("app-alert:show", this._onShow);
    this._onKey = (e) => {
      if (!this.current) return;
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        this.close();
      }
    };
    window.addEventListener("keydown", this._onKey);
  },
  beforeDestroy() {
    ipcRenderer.removeListener("app-alert:show", this._onShow);
    window.removeEventListener("keydown", this._onKey);
    clearTimeout(this._timer);
  },
  methods: {
    // opts = opsi dialog.showMessageBox lama: { type, message, detail,
    // buttons } + `channel` ("alert" | "saved") dari main process.
    push(opts) {
      const o = opts || {};
      const type = String(o.type || "info").toLowerCase();
      const title = String(o.message || o.title || "");
      let variant = { error: "error", warning: "warning", question: "question" }[type] || "info";
      // "get-alert-saved" & judul bernada sukses -> tampil sbg sukses.
      if (variant === "info" && (o.channel === "saved" || SUCCESS_WORDS.test(title))) {
        variant = "success";
      }
      const buttons =
        Array.isArray(o.buttons) && o.buttons.length ? o.buttons.map(String) : ["OK"];
      this.queue.push({
        id: ++seq,
        variant,
        title: title || this.defaultTitle(variant),
        detail: o.detail ? String(o.detail) : "",
        buttons,
        autoCloseMs: variant === "success" ? SUCCESS_AUTO_CLOSE_MS : 0,
      });
      if (!this.current) this.next();
    },
    next() {
      clearTimeout(this._timer);
      this.current = this.queue.shift() || null;
      if (!this.current) return;
      if (this.current.autoCloseMs) {
        this._timer = setTimeout(() => this.close(), this.current.autoCloseMs);
      }
      this.$nextTick(() => {
        const btns = this.$refs.buttons;
        if (btns && btns[0]) btns[0].focus();
      });
    },
    close() {
      this.next();
    },
    iconFor(variant) {
      return {
        success: "mdi:check-circle",
        error: "mdi:close-circle",
        warning: "mdi:alert",
        question: "mdi:help-circle",
        info: "mdi:information",
      }[variant];
    },
    defaultTitle(variant) {
      return {
        success: "Berhasil",
        error: "Terjadi Kesalahan",
        warning: "Perhatian",
        question: "Konfirmasi",
        info: "Informasi",
      }[variant];
    },
  },
};
</script>

<style scoped>
.aah-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
}

.aah-card {
  /* Electron 13 = Chromium 91: belum ada color-mix(), jadi varian
     transparan accent ditulis manual sbg --accent-glow (rgba). */
  --accent: #1c8fc7;
  --accent-soft: #e6f4fd;
  --accent-glow: rgba(28, 143, 199, 0.35);
  position: relative;
  width: min(420px, 100%);
  padding: 28px 26px 22px;
  border-radius: 20px;
  background: #ffffff;
  text-align: center;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
}
.aah-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent);
}
.aah-card--success {
  --accent: #16a34a;
  --accent-soft: #dcfce7;
  --accent-glow: rgba(22, 163, 74, 0.35);
}
.aah-card--error {
  --accent: #dc2626;
  --accent-soft: #fee2e2;
  --accent-glow: rgba(220, 38, 38, 0.35);
}
.aah-card--warning {
  --accent: #d97706;
  --accent-soft: #fef3c7;
  --accent-glow: rgba(217, 119, 6, 0.35);
}
.aah-card--question {
  --accent: #7c3aed;
  --accent-soft: #ede9fe;
  --accent-glow: rgba(124, 58, 237, 0.35);
}

.aah-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.6), 0 0 0 7px var(--accent-soft);
}

.aah-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}
.aah-detail {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #475569;
  white-space: pre-line;
  word-break: break-word;
  max-height: 40vh;
  overflow-y: auto;
}

.aah-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
}
.aah-btn {
  min-width: 110px;
  height: 40px;
  padding: 0 20px;
  border-radius: 11px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: filter 0.15s ease, background-color 0.15s ease,
    transform 0.08s ease;
}
.aah-btn:active {
  transform: translateY(1px);
}
.aah-btn--primary {
  background: var(--accent);
  color: #ffffff;
  box-shadow: 0 6px 16px var(--accent-glow);
}
.aah-btn--primary:hover {
  filter: brightness(1.08);
}
.aah-btn--primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.aah-btn--ghost {
  background: #ffffff;
  border-color: #e2e8f0;
  color: #334155;
}
.aah-btn--ghost:hover {
  background: #f8fafc;
}

.aah-queue {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.aah-timer {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--accent);
  opacity: 0.5;
  transform-origin: left;
  animation: aah-timer linear forwards;
}
@keyframes aah-timer {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Transisi */
.aah-fade-enter-active,
.aah-fade-leave-active {
  transition: opacity 0.18s ease;
}
.aah-fade-enter,
.aah-fade-leave-to {
  opacity: 0;
}
.aah-pop-enter-active {
  transition: transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.18s ease;
}
.aah-pop-enter {
  transform: scale(0.92) translateY(8px);
  opacity: 0;
}
</style>
