# Integrasi STS Long Range Start

Start dari pistol **Seiko PS-77** di garis start yang jauh dikirim lewat
internet: HP/Laptop di garis start → server **sts-longrangestart** →
aplikasi ini. Hasilnya, kolom **Get Time Start** (Buffer-Timer-Start) terisi
otomatis dan baris `LR…` muncul di live feed. Operator tetap menekan tombol
**BIB** untuk menetapkan waktu itu ke tim.

Server dan aplikasi garis start ada di repo `sts-longrangestart` (lihat README di sana).

## Aktivasi

`.env` (dev) atau `<userData>/longrange.json` (aplikasi terpasang):

```
LRS_API_URL=https://<domain-server-longrangestart>
LRS_TIMING_TOKEN=<npm run secrets di sts-longrangestart>
LRS_HMAC_SECRET=<sama dengan server>
LRS_TRIM_MS=0
```

```json
{ "apiUrl": "https://…", "timingToken": "…", "hmacSecret": "…", "trimMs": 0 }
```

Tanpa konfigurasi, integrasi nonaktif dan aplikasi berjalan seperti biasa.

## Basis waktu

Server mengirim waktu start dalam jam server. `longrangeCore.js` mengubahnya ke jam Buffer-Timer-Start:

1. **Jam server → jam laptop.** Lewat ping-pong `clock:ping` (8 sampel, dipilih RTT terkecil, diulang tiap 60 dtk).
2. **Jam laptop → jam RaceTime2**, dengan urutan prioritas:
   1. **Kalibrasi manual** operator (lihat di bawah).
   2. **Heartbeat** frame START RaceTime2 yang berwaktu (min-filter, latensi serial dikurangkan).
   3. **Jam lokal laptop.**

   Setelah itu ditambah **trim** (ms). Nilai awal trim diambil dari `LRS_TRIM_MS`.

Badge di panel Buffer-Timer-Start menampilkan basis yang dipakai ("jam RaceTime2" / "jam laptop"). Tooltip-nya menampilkan RTT dan start terakhir.

## Kalibrasi manual

Klik badge **Long Range Start** di panel Buffer-Timer-Start untuk membuka jendela kalibrasi:

- **Jam Long Range** berjalan. Bandingkan dengan layar RaceTime2.
- **Set ke waktu RaceTime2**: ketik waktu yang *akan* tampil (tombol *+10 dtk* mengisinya otomatis), lalu tekan **SET** tepat saat RaceTime2 menunjukkan waktu itu. Waktu dicatat saat tombol ditekan (pointerdown), dan trim kembali ke 0.
- **Trim halus**: tombol −100/−10/−1/+1/+10/+100 ms, atau isi nilai persis lalu *Terapkan*. Batasnya ±60 detik.
- **Kunci dari heartbeat RaceTime2** bila heartbeat berwaktu tersedia. **Kembali otomatis** menghapus kalibrasi manual.
- **Hitung ulang start terakhir** dengan kalibrasi baru. Buffer-Timer-Start terisi lagi, dan toast menampilkan waktu lama → baru.
- **Riwayat kalibrasi** (10 terakhir) ditampilkan, disimpan di `<userData>/longrange-calibration.json`, dan tetap berlaku setelah aplikasi dibuka ulang.

Kalibrasi berlaku untuk start berikutnya. Start lama hanya berubah bila ditekan *Hitung ulang*. Status jam kalibrasi juga dikirim ke server (`timing:clock-state`: saat tersambung, setiap kali status berubah, dan tiap 15 dtk), begitu pula hasil *Hitung ulang* (`timing:recomputed`). Dengan itu jam dan waktu start di aplikasi garis start ikut berbasis RaceTime2 hasil kalibrasi, bukan jam laptop/server.

## Perilaku

- **START**: mengisi `digitTimeStart` dan menambah baris live feed `LR` + nomor urut 7 digit + `HHMMSSmmm` + `R` (Racetime `LR` + `HHMMSSmmm`), lalu muncul toast. Toast berwarna kuning bila jam belum tersinkron.
- **RECALL / false start**: toast merah. `digitTimeStart` dikosongkan bila masih berisi start tersebut. Bila waktunya sudah ditetapkan ke BIB, operator mengubahnya manual.
- **Start yang tiba saat halaman race belum dibuka** tetap diterima dan disimpan di main process. Start terakhir (≤ 10 menit) dimuat saat halaman race dibuka.
- **Kiriman ulang** dari server (setelah koneksi putus) tidak menggandakan start, karena dedupe memakai `startId`.
- Pesan dengan HMAC salah ditolak dan tidak di-ack, sehingga server tetap menyimpannya sebagai belum terkirim.

## Kode

| File | Peran |
|---|---|
| `src/services/longrangeCore.js` | Klien murni: socket.io, sinkron jam, konversi waktu, HMAC, dedupe, riwayat (diuji interop terhadap server) |
| `src/services/longrangeMain.js` | Wiring Electron main: konfigurasi, penyimpanan `<userData>/longrange-*.json`, IPC |
| `src/services/longrange.js` | Renderer: `reportHeartbeat()`, `onStart()`, `onRecall()`, status |
| `src/mixins/serialPortMixin.js` | Menerapkan start/recall ke halaman race + heartbeat dari frame START |
| `src/components/longrange/LongrangeBadge.vue` | Badge status di panel Buffer-Timer-Start (`OperationTeamPanel.vue`); klik → kalibrasi |
| `src/components/longrange/LongrangeCalibration.vue` | Jendela kalibrasi manual (jam berjalan, SET, trim, mode, hitung ulang, riwayat) |
| `src/background.js` | Memanggil `setupLongrange()` |
