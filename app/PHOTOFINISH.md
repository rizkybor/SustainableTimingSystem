# Integrasi STS Photo Finish

Sinyal finish RaceTime2 dikirim ke **STS Photo Finish**. Kamera di tepi
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

## Di halaman race

Halaman H2H / Rafting Cross / DRR hanya menampilkan badge **Photo Finish
terhubung / terputus**. Sesi dibuat oleh admin di aplikasi Photo Finish
(cukup pilih Event); hasil juri diterapkan bila Event sama dan tim ada di
heat/babak yang sedang tampil.

## Kode

- `src/services/photofinishCore.js`, `photofinishMain.js` (main process, menyimpan secret)
- `src/services/photofinish.js` (renderer, IPC)
- `src/mixins/photofinishMixin.js` + hook `pfCategory` / `pfBucket()` (hanya `eventId` yang dipakai) / `pfLocateTeam()` di view
- `src/components/photofinish/PhotofinishBadge.vue` (status terhubung/terputus)
- `src/utils/microGateReader.js`: callback menerima argumen ke-4 `meta = { recvUs, frameBytes }`
