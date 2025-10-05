<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="flex flex-col items-center text-center">
      <!-- Gambar -->
      <img
        src="@/assets/icons/icon.png"
        alt="App Logo"
        class="mb-6"
        style="
          width: 15rem;
          height: 15rem;
          object-fit: contain;
          margin-top: 22vh;
        "
      />

      <!-- Judul -->
      <h1 class="text-2xl font-bold mb-3">Enter Access Key 🔑</h1>

      <!-- Error text -->
      <p
        v-if="error"
        class="text-danger small mb-2"
        role="alert"
        aria-live="assertive"
      >
        {{ error }}
      </p>

      <!-- Form -->
      <form class="w-25 mx-auto" @submit.prevent="submit">
        <b-form-input
          v-model.trim="key"
          type="password"
          placeholder="Input access key"
          :class="[
            'mb-3 p-4 text-center shadow-sm rounded-pill custom-input',
            error ? 'shake' : '',
          ]"
          autocomplete="off"
          required
          :disabled="loading"
        />

        <b-button
          type="submit"
          block
          :disabled="loading"
          :class="[
            'custom-btn-gradient rounded-pill btn-anim',
            loading ? 'is-loading' : '',
          ]"
        >
          <span v-if="!loading">Submit</span>
          <span v-else class="spinner"></span>
        </b-button>
      </form>
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
      expectedKey:
        process.env.VUE_APP_ACCESS_KEY && process.env.VUE_APP_ACCESS_KEY.length
          ? process.env.VUE_APP_ACCESS_KEY
          : "DEMO_KEY",
    };
  },
  mounted() {
    sessionStorage.removeItem("sts_home_visited_session");
  },
  methods: {
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
/* INPUT */
.custom-input {
  border: 1px solid #d1d5db;
  transition: all 0.2s ease;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}
.custom-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 0.25rem rgba(37, 99, 235, 0.25);
}

/* Shake untuk error */
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
  border-color: #dc3545 !important;
}

/* BUTTON */
.custom-btn-gradient {
  background: linear-gradient(90deg, #3b82f6, #2563eb, #1e3a8a);
  background-size: 200% 200%;
  border: none;
  color: #fff;
  font-weight: 700;
  font-size: 1.05rem;
  padding: 0.9rem 1.25rem;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

/* animasi hover: gradient bergerak + sedikit naik */
@keyframes gradient-move {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}
.btn-anim:hover {
  animation: gradient-move 1.2s linear infinite alternate;
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.25);
}

/* animasi pressed (active) */
.btn-anim:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
}

/* pulsate halus saat focus dengan keyboard */
.btn-anim:focus-visible {
  outline: none;
  box-shadow: 0 0 0 0.25rem rgba(37, 99, 235, 0.35),
    0 10px 20px rgba(0, 0, 0, 0.22);
}

/* Hover color variant yang Anda minta sebelumnya */
.custom-btn-gradient:hover {
  /* biar tetap ada transisi warna lembut saat hover */
  filter: brightness(1.03);
}

/* Loading state */
.is-loading {
  pointer-events: none;
  opacity: 0.9;
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
</style>
