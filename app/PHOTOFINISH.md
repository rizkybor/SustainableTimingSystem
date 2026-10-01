# Integrasi STS Photo Finish

Impuls finish RaceTime2 dikirim ke **STS Photo Finish**. Kamera di tepi
sungai menentukan urutan perahu, juri mengonfirmasi, lalu Finish Time terisi
otomatis di halaman H2H / Rafting Cross / DRR.

Panduan lengkap (alur, konfigurasi, aturan penerapan, checklist lapangan):
`sts-photofinish/docs/INTEGRATION-TIMING.md`.

## Aktivasi singkat

`.env` (dev) atau `<userData>/photofinish.json` (aplikasi terpasang):

```
PF_API_URL=http://<ip-laptop-photofinish>:4100
PF_DEVICE_TOKEN=<npm run token:device -w api -- timing "Laptop Timing">
PF_HMAC_SECRET=<sama dengan API>
```

Tanpa konfigurasi, integrasi nonaktif dan aplikasi berjalan seperti biasa.

## Kirim heat ke Photo Finish

Di halaman H2H / Rafting Cross / DRR, klik **Kirim heat ke Photo Finish**,
pilih heat, lalu **Kirim & aktifkan**. Sesi Photo Finish dibuat dengan
kategori, heat, dan tim yang sedang tampil, lalu langsung aktif.

## Kode

- `src/services/photofinishCore.js`, `photofinishMain.js` (main process, menyimpan secret)
- `src/services/photofinish.js` (renderer, IPC)
- `src/mixins/photofinishMixin.js` + hook `pfCategory` / `pfBucket()` / `pfLocateTeam()` / `pfHeats()` di view
- `src/components/photofinish/PhotofinishBar.vue` (badge + tombol kirim heat)
- `src/utils/microGateReader.js`: callback menerima argumen ke-4 `meta = { recvUs, frameBytes }`
