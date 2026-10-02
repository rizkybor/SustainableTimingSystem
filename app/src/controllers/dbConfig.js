// Sumber connection string MongoDB — TIDAK PERNAH ditulis di kode sumber/git.
//
// Urutan pencarian (yang pertama ditemukan dipakai):
//   1. MONGO_URI dari environment / app/.env (mode dev, dibaca dotenv)
//   2. <userData>/database.json → { "mongoUri": "..." }
//      (mis. macOS: ~/Library/Application Support/STiming System 424/database.json)
//      — untuk mengganti koneksi aplikasi terpasang tanpa build ulang
//   3. Nilai yang ditanam saat build dari MONGO_URI di .env mesin build
//      (DefinePlugin di vue.config.js → __BUILD_MONGO_URI__), agar installer
//      tetap langsung terhubung seperti sebelumnya.
/* global __BUILD_MONGO_URI__ */
const fs = require("fs");
const path = require("path");

function fromUserData() {
  try {
    const { app } = require("electron");
    const file = path.join(app.getPath("userData"), "database.json");
    const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
    return cfg && cfg.mongoUri ? String(cfg.mongoUri) : null;
  } catch (_e) {
    return null;
  }
}

function resolveMongoUri() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const fromFile = fromUserData();
  if (fromFile) return fromFile;
  if (typeof __BUILD_MONGO_URI__ !== "undefined" && __BUILD_MONGO_URI__) return __BUILD_MONGO_URI__;
  throw new Error(
    "Koneksi database belum dikonfigurasi. Isi MONGO_URI di app/.env (mode dev), " +
      "atau buat database.json berisi { \"mongoUri\": \"...\" } di folder data aplikasi."
  );
}

module.exports = { resolveMongoUri };
