<template>
  <b-modal
    v-model="show"
    hide-header
    hide-footer
    centered
    size="lg"
    body-class="p-0"
    content-class="stx-modal-content"
  >
    <div class="stx-modal-header">
      <h5>About</h5>
      <button
        type="button"
        class="stx-modal-close"
        aria-label="Close"
        @click="show = false"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <div class="stx-modal-body about-body">
      <!-- BRAND -->
      <div class="about-brand">
        <img src="@/assets/images/logo-sts.png" alt="STiming System 424" />
        <div>
          <div class="about-app-name">STiming System 424</div>
          <div class="about-app-tagline">
            Professional Timing System — Indonesia
          </div>
          <div class="about-version">
            Version {{ version || "…" }}
          </div>
        </div>
      </div>

      <!-- SYSTEM INFO -->
      <div class="about-section">
        <div class="about-section__title">Informasi Sistem / Aplikasi</div>
        <div class="about-row">
          <span class="about-row__label">Aplikasi</span>
          <span class="about-row__value">STiming System 424 (Desktop App)</span>
        </div>
        <div class="about-row">
          <span class="about-row__label">Versi</span>
          <span class="about-row__value">{{ version || "…" }}</span>
        </div>
        <div class="about-row">
          <span class="about-row__label">Lisensi</span>
          <span class="about-row__value">Proprietary — hak cipta dilindungi. Tidak untuk didistribusikan ulang tanpa izin tertulis.</span>
        </div>
      </div>

      <!-- DEVELOPER INFO -->
      <div class="about-section">
        <div class="about-section__title">Informasi Pembuat</div>
        <div class="about-row">
          <span class="about-row__label">Dikembangkan oleh</span>
          <span class="about-row__value">PT. Jendela Cakra Digital</span>
        </div>
        <div class="about-row">
          <span class="about-row__label">Website</span>
          <span class="about-row__value">
            <a href="#" @click.prevent="openExternal('https://jcdigital.co.id')"
              >jcdigital.co.id</a
            >
          </span>
        </div>
        <div class="about-row">
          <span class="about-row__label">Kontak</span>
          <span class="about-row__value">
            <a href="#" @click.prevent="openExternal('mailto:contact@jcdigital.co.id')"
              >contact@jcdigital.co.id</a
            >
          </span>
        </div>
        <div class="about-row">
          <span class="about-row__label">Tahun Dibuat</span>
          <span class="about-row__value"
            >Sejak 17 Oktober 2023, dan terus dikembangkan sampai
            sekarang</span
          >
        </div>
        <div class="about-row">
          <span class="about-row__label">Negara</span>
          <span class="about-row__value"
            >Indonesia</span
          >
        </div>
      </div>

      <!-- SUPPORTED TIMING DEVICES -->
      <div class="about-section">
        <div class="about-section__title">Perangkat Timing yang Didukung</div>
        <p class="about-text">
          Aplikasi ini sudah bisa menerima data langsung dari perangkat
          timing <strong>SPORTident</strong> dan <strong>MicroGate
          RaceTime2</strong> lewat koneksi serial (USB), untuk mencatat
          waktu start/finish tim secara otomatis dari lapangan.
        </p>
      </div>

      <!-- STS JURY SYSTEM CONNECTION -->
      <div class="about-section">
        <div class="about-section__title">Keterhubungan dengan STiming Scoring</div>
        <p class="about-text">
          Aplikasi ini terhubung secara <strong>real-time</strong> dengan
          <strong>STiming Scoring</strong> — portal web untuk judge/juri
          mencatat penalti dan tindakan langsung dari lapangan, yang dapat
          diakses di
          <a
            href="#"
            @click.prevent="openExternal('https://stimingscoring.jcdigital.co.id')"
            >stimingscoring.jcdigital.co.id</a
          >. Setiap tindakan judge yang dikirim dari sana akan otomatis
          tersinkronisasi ke aplikasi Timing System ini, dan sebaliknya hasil
          resmi dari aplikasi ini bisa dipantau live di sana.
        </p>
      </div>
    </div>
  </b-modal>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "AboutModal",
  props: {
    value: { type: Boolean, default: false },
  },
  data() {
    return {
      version: "",
    };
  },
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit("input", v);
      },
    },
  },
  watch: {
    value(v) {
      if (v && !this.version) this.fetchVersion();
    },
  },
  methods: {
    async fetchVersion() {
      try {
        const res = await ipcRenderer.invoke("app:get-version");
        if (res && res.ok) this.version = res.version;
      } catch (e) {
        // biarkan kosong kalau gagal — bukan info kritikal
      }
    },
    async openExternal(url) {
      try {
        await ipcRenderer.invoke("app:open-external", url);
      } catch (e) {
        // no-op — link eksternal gagal dibuka bukan hal fatal
      }
    },
  },
};
</script>

<style scoped>
.about-body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}
.about-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e6ebf4;
}
.about-brand img {
  height: 56px;
  width: auto;
}
.about-app-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}
.about-app-tagline {
  color: #6b7280;
  font-size: 0.9rem;
}
.about-version {
  margin-top: 4px;
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  color: #0ea5e9;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 2px 10px;
}
.about-section {
  margin-bottom: 20px;
}
.about-section:last-child {
  margin-bottom: 0;
}
.about-section__title {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.95rem;
  margin-bottom: 10px;
}
.about-row {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  font-size: 0.88rem;
  border-bottom: 1px dashed #f1f5f9;
}
.about-row:last-child {
  border-bottom: none;
}
.about-row__label {
  min-width: 140px;
  color: #6b7280;
  font-weight: 600;
}
.about-row__value {
  color: #111827;
}
.about-row__value a {
  color: #0ea5e9;
  text-decoration: none;
}
.about-row__value a:hover {
  text-decoration: underline;
}
.about-text {
  font-size: 0.88rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}
.about-text a {
  color: #0ea5e9;
  text-decoration: none;
}
.about-text a:hover {
  text-decoration: underline;
}
</style>
