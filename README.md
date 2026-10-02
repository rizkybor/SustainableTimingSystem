# SustainableTimingSystem
Sustainable Timing System Desktop App with VueJS


with Node v16.20.2
with Node v20.19.5

-rm -rf node_modules
-rm -rf package_log.json

Konfigurasi rahasia (app/.env — TIDAK di-commit):
- Salin app/.env.example → app/.env lalu isi.
- MONGO_URI = connection string MongoDB Atlas (wajib). Tidak lagi ditulis di
  kode sumber; dibaca src/controllers/dbConfig.js dengan urutan: MONGO_URI di
  .env → database.json { "mongoUri": "..." } di folder data aplikasi → nilai
  yang ditanam saat yarn electron:build. Build installer harus di mesin yang
  .env-nya berisi MONGO_URI.

install packages : yarn install

install vue-router : yarn vue-router@2

Start System on dev

Start mongo DB on terminal
-brew services start mongodb/brew/mongodb-community
-brew services stop mongodb/brew/mongodb-community

Connect mongodb compass
-open mongodb compass
-connect

Run on terminal in folder app
serve : yarn electron:serve

yarn electron:build (.dmg)
yarn electron:build --win --x64 (.exe)
yarn electron:build --win --x64 2>&1 | tail -30