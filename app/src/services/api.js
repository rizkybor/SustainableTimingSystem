// default dari .env aktif
const DEFAULT_CONFIG = {
  ONLINE: process.env.VUE_APP_RT_URL || "https://sts-racehub.onrender.com",
  LAN: "http://27.3.82.50:5050",
  OFFLINE: "http://localhost:4000"
};

// Simpan default ini dulu ke localStorage (hanya jika belum ada)
try {
  if (!localStorage.getItem("network_urls")) {
    localStorage.setItem("network_urls", JSON.stringify(DEFAULT_CONFIG));
    localStorage.setItem("network_base_url", DEFAULT_CONFIG.ONLINE);
  }
} catch (e) {}