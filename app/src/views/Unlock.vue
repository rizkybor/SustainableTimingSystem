<template>
  <div class="ul-page">
    <div class="ul-bg" aria-hidden="true"></div>

    <div class="ul-card">
      <!-- Panel brand -->
      <section class="ul-brand">
        <div class="ul-brand__bg" aria-hidden="true"></div>
        <div class="ul-brand__inner">
          <img src="@/assets/icons/icon.png" alt="App Logo" class="ul-brand__logo" />
          <span class="ul-brand__eyebrow">Sustainable Timing System</span>
          <h2 class="ul-brand__title">STiming System 424</h2>
          <p class="ul-brand__tagline">
            Timing, penalty juri realtime, dan hasil resmi lomba arung jeram
            dalam satu aplikasi.
          </p>
          <ul class="ul-features">
            <li>
              <span class="ul-features__icon"><Icon icon="mdi:timer-outline" /></span>
              Timing RaceTime2 &amp; Photo Finish
            </li>
            <li>
              <span class="ul-features__icon"><Icon icon="mdi:gavel" /></span>
              Penalty juri masuk secara realtime
            </li>
            <li>
              <span class="ul-features__icon"><Icon icon="mdi:trophy-outline" /></span>
              Hasil resmi, PDF &amp; Live Result
            </li>
          </ul>
        </div>
      </section>

      <!-- Form -->
      <section class="ul-form-side">
        <div class="ul-lock" :class="{ 'is-error': !!error }">
          <Icon :icon="error ? 'mdi:lock-alert-outline' : 'mdi:lock-outline'" />
        </div>
        <h1 class="ul-title">Masukkan Access Key</h1>
        <p class="ul-sub">
          Aplikasi terkunci. Masukkan access key untuk melanjutkan.
        </p>

        <form class="ul-form" @submit.prevent="submit">
          <label for="ul-key" class="ul-label">Access Key</label>
          <div class="ul-input-wrap" :class="{ 'is-error': !!error, shake: !!error }">
            <Icon icon="mdi:key-variant" class="ul-input-icon" />
            <input
              id="ul-key"
              ref="keyInput"
              v-model.trim="key"
              :type="showKey ? 'text' : 'password'"
              class="ul-input"
              placeholder="Input access key"
              autocomplete="off"
              required
              :disabled="loading"
              @keyup="onKeyEvent"
              @keydown="onKeyEvent"
            />
            <button
              type="button"
              class="ul-eye"
              :title="showKey ? 'Sembunyikan key' : 'Tampilkan key'"
              :aria-label="showKey ? 'Sembunyikan key' : 'Tampilkan key'"
              @click="showKey = !showKey"
            >
              <Icon :icon="showKey ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" />
            </button>
          </div>

          <div v-if="capsLock && !error" class="ul-hint ul-hint--warn">
            <Icon icon="mdi:keyboard-caps" /> Caps Lock aktif
          </div>
          <div v-if="error" class="ul-hint ul-hint--error" role="alert" aria-live="assertive">
            <Icon icon="mdi:alert-circle-outline" /> {{ error }}
          </div>

          <button
            type="submit"
            class="ul-submit"
            :class="{ 'is-loading': loading }"
            :disabled="loading || !key"
          >
            <span v-if="!loading" class="ul-submit__label">
              Buka Akses
              <Icon icon="mdi:arrow-right" />
            </span>
            <span v-else class="spinner"></span>
          </button>
        </form>

        <p class="ul-help">
          <Icon icon="mdi:information-outline" />
          Belum punya access key? Hubungi administrator event.
        </p>
      </section>
    </div>
  </div>
</template>

<script>
import { unlock } from "@/utils/auth";

export default {
  name: "Unlock",
  data() {
    return {
      key: "",
      error: "",
      loading: false,
      showKey: false,
      capsLock: false,
      expectedKey:
        process.env.VUE_APP_ACCESS_KEY && process.env.VUE_APP_ACCESS_KEY.length
          ? process.env.VUE_APP_ACCESS_KEY
          : "DEMO_KEY",
    };
  },
  mounted() {
    sessionStorage.removeItem("sts_home_visited_session");
    this.$nextTick(() => {
      if (this.$refs.keyInput) this.$refs.keyInput.focus();
    });
  },
  methods: {
    // Deteksi Caps Lock supaya operator tidak salah ketik key tanpa sadar.
    onKeyEvent(e) {
      if (e && typeof e.getModifierState === "function") {
        this.capsLock = e.getModifierState("CapsLock");
      }
    },
    submit() {
      this.error = "";
      if (this.key !== this.expectedKey) {
        this.error = "Key salah.";
        setTimeout(() => {
          this.error = "";
        }, 3000);

        return;
      }
      try {
        this.loading = true;
        setTimeout(() => {
          try {
            unlock();
            const redirect = this.$route.query.redirect || "/";
            this.$router.replace(redirect);
          } catch (_) {
            this.error = "Terjadi masalah saat membuka akses.";
            this.loading = false;
            setTimeout(() => (this.error = ""), 3000);
          }
        }, 200);
      } catch (_) {
        this.error = "Terjadi masalah saat membuka akses.";
        this.loading = false;
        setTimeout(() => (this.error = ""), 3000);
      }
    },
  },
};
</script>

<style scoped>
/* Halaman Unlock — kartu dua sisi (brand + form) di tengah area konten
   (Navbar & Footer tetap tampil). Palet brand: #1c4c7a navy, #25b0eb sky. */
.ul-page {
  position: relative;
  min-height: calc(100vh - var(--nav-h, 64px) - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  overflow: hidden;
}
.ul-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(600px 400px at 10% 10%, rgba(37, 176, 235, 0.14), transparent 70%),
    radial-gradient(500px 360px at 90% 90%, rgba(28, 76, 122, 0.12), transparent 70%), #f5f8fc;
}

.ul-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  width: min(960px, 100%);
  min-height: 520px;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e6edf6;
  box-shadow: 0 30px 70px rgba(15, 42, 67, 0.18);
}

/* ---------- Panel brand ---------- */
.ul-brand {
  position: relative;
  color: #ffffff;
}
.ul-brand__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(420px 260px at 85% 0%, rgba(37, 176, 235, 0.5), transparent 70%),
    linear-gradient(150deg, #0f2f52 0%, #1c4c7a 55%, #1d7fb8 100%);
}
.ul-brand__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 44px 40px;
}
.ul-brand__logo {
  width: 84px;
  height: 84px;
  object-fit: contain;
  padding: 10px;
  margin-bottom: 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
}
.ul-brand__eyebrow {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #bae6fd;
}
.ul-brand__title {
  margin: 6px 0 10px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.ul-brand__tagline {
  margin: 0 0 26px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
}
.ul-features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ul-features li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
}
.ul-features__icon {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: #bae6fd;
}

/* ---------- Form ---------- */
.ul-form-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 44px 44px 36px;
}
.ul-lock {
  width: 56px;
  height: 56px;
  margin-bottom: 18px;
  border-radius: 16px;
  background: #e6f4fd;
  color: #1c4c7a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  transition: background-color 0.2s ease, color 0.2s ease;
}
.ul-lock.is-error {
  background: #fee2e2;
  color: #dc2626;
}
.ul-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}
.ul-sub {
  margin: 0 0 26px;
  font-size: 14px;
  color: #64748b;
}
.ul-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #334155;
}
.ul-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
.ul-input-wrap:focus-within {
  background: #ffffff;
  border-color: #25b0eb;
  box-shadow: 0 0 0 4px rgba(37, 176, 235, 0.15);
}
.ul-input-wrap.is-error {
  border-color: #dc2626;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.12);
}
.ul-input-icon {
  position: absolute;
  left: 16px;
  color: #94a3b8;
  font-size: 19px;
  pointer-events: none;
}
.ul-input {
  flex: 1;
  height: 52px;
  padding: 0 48px 0 46px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #0f172a;
  outline: none;
}
.ul-input::placeholder {
  letter-spacing: 0;
  font-weight: 500;
  color: #94a3b8;
}
.ul-eye {
  position: absolute;
  right: 8px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  cursor: pointer;
}
.ul-eye:hover {
  background: #eef2f7;
  color: #1c4c7a;
}

.ul-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 600;
}
.ul-hint--warn {
  color: #b45309;
}
.ul-hint--error {
  color: #dc2626;
}

.ul-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  margin-top: 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #1c4c7a, #25b0eb);
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(28, 76, 122, 0.3);
  transition: filter 0.15s ease, transform 0.08s ease, box-shadow 0.15s ease;
}
.ul-submit__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ul-submit:hover:not(:disabled) {
  filter: brightness(1.07);
  box-shadow: 0 14px 28px rgba(28, 76, 122, 0.38);
}
.ul-submit:active:not(:disabled) {
  transform: translateY(1px);
}
.ul-submit:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(37, 176, 235, 0.35);
}
.ul-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}
.ul-submit.is-loading {
  opacity: 0.9;
}

.ul-help {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 22px 0 0;
  font-size: 12.5px;
  color: #94a3b8;
}

/* Shake utk error */
@keyframes k-shake {
  10%,
  90% {
    transform: translateX(-1px);
  }
  20%,
  80% {
    transform: translateX(2px);
  }
  30%,
  50%,
  70% {
    transform: translateX(-4px);
  }
  40%,
  60% {
    transform: translateX(4px);
  }
}
.shake {
  animation: k-shake 0.4s ease both;
}

.spinner {
  display: inline-block;
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  vertical-align: middle;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 767.98px) {
  .ul-card {
    grid-template-columns: 1fr;
    min-height: 0;
  }
  .ul-brand__inner {
    padding: 28px 24px;
  }
  .ul-features {
    display: none;
  }
  .ul-form-side {
    padding: 28px 24px;
  }
}
</style>
