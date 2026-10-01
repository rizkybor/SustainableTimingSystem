// Menerapkan hasil STS Photo Finish (photofinish:verified) ke halaman race.
// Dipakai HeadToHead, RaftingCross, DownRiverRace. Setiap view menyediakan:
//
//   pfCategory          : "H2H" | "RX" | "DRR"
//   pfBucket()          : { eventId, divisionId, raceId, initialId } kategori aktif
//   pfLocateTeam(msg)   : { index, finishTime, name } di list yang dipakai
//                         updateTime(), atau null bila tim tidak ada di
//                         heat/babak yang sedang tampil
//   pfHeats()           : heat yang bisa dikirim ke Photo Finish (tombol
//                         "Kirim heat ke Photo Finish", lihat PhotofinishBar)
//
// Aturan (lihat feedback "Scope by 4 Categories"): hasil HANYA diterapkan
// bila Event + Division + Race + Initial sama persis. Hasil yang belum
// cocok tetap tersimpan di main process dan dicoba lagi saat operator
// membuka kategori/babak yang benar.
import { armHeat, getPending, markApplied, onTrigger, onVerified } from "@/services/photofinish";

const RETRY_MS = 5000;

export default {
  data() {
    return {
      pfQueue: [],
      pfBusy: false,
      pfNotified: {}, // kunci toast yang sudah ditampilkan — jangan spam tiap retry
    };
  },

  mounted() {
    this._pfOff = onVerified((msg) => this.pfEnqueue(msg));
    this._pfTriggerOff = onTrigger((msg) => this.pfOnTrigger(msg));
    this.pfRetryPending();
    this._pfTimer = setInterval(() => this.pfRetryPending(), RETRY_MS);
  },

  beforeDestroy() {
    if (this._pfOff) this._pfOff();
    if (this._pfTriggerOff) this._pfTriggerOff();
    if (this._pfTimer) clearInterval(this._pfTimer);
  },

  methods: {
    async pfRetryPending() {
      const list = await getPending();
      (list || []).forEach((msg) => this.pfEnqueue(msg));
    },

    pfEnqueue(msg) {
      if (!msg || !msg.crossingId) return;
      const dup = this.pfQueue.some((m) => m.crossingId === msg.crossingId && m.revision === msg.revision);
      if (!dup) this.pfQueue.push(msg);
      this.pfDrain();
    },

    async pfDrain() {
      if (this.pfBusy) return;
      this.pfBusy = true;
      try {
        while (this.pfQueue.length) {
          const msg = this.pfQueue.shift();
          try {
            await this.pfApply(msg);
          } catch (err) {
            this.pfToastOnce(msg, "error", "Photo Finish gagal diterapkan: " + ((err && err.message) || err));
          }
        }
      } finally {
        this.pfBusy = false;
      }
    },

    /**
     * Perahu terdeteksi kamera Photo Finish → tampil di panel waktu seperti
     * frame RaceTime2: baris "Photo Finish" di tabel Registration Id/Racetime,
     * dan waktunya masuk Buffer-Timer-Finish. Operator tetap menekan tombol BIB
     * untuk menetapkannya ke tim (atau menunggu hasil juri Photo Finish).
     * digitId/digitTime/digitTimeFinish milik serialPortMixin di komponen yang sama.
     */
    pfOnTrigger(msg) {
      if (!msg || !msg.time || msg.raceCategory !== this.pfCategory) return;
      if (msg.bucket && !this.pfBucketMatches(msg)) return; // heat kategori lain
      if (Array.isArray(this.digitId)) this.digitId.unshift("Photo Finish");
      if (Array.isArray(this.digitTime)) this.digitTime.unshift(msg.time);
      this.digitTimeFinish = msg.time;
    },

    pfBucketMatches(msg) {
      const b = typeof this.pfBucket === "function" ? this.pfBucket() : null;
      if (!b || !msg.bucket) return false;
      return (
        String(msg.eventId) === String(b.eventId) &&
        String(msg.bucket.divisionId) === String(b.divisionId) &&
        String(msg.bucket.raceId) === String(b.raceId) &&
        String(msg.bucket.initialId) === String(b.initialId)
      );
    },

    async pfApply(msg) {
      // Bukan untuk halaman/kategori ini — biarkan tertunda, tanpa notifikasi.
      if (msg.raceCategory !== this.pfCategory || !this.pfBucketMatches(msg)) return;

      const loc = this.pfLocateTeam(msg);
      if (!loc) {
        this.pfToastOnce(msg, "warning", `Hasil Photo Finish untuk BIB ${msg.bib || msg.teamId} menunggu — tim tidak ada di heat/babak yang sedang tampil.`);
        return;
      }

      const label = loc.name || "BIB " + (msg.bib || msg.teamId);
      if (loc.finishTime && loc.finishTime !== msg.finishTime) {
        const ok = await this.$bvModal.msgBoxConfirm(
          `Ganti Finish Time ${label} dari ${loc.finishTime} menjadi ${msg.finishTime} (Photo Finish, urutan ${msg.rank}${msg.revision > 1 ? ", koreksi juri" : ""})?`,
          { title: "Photo Finish", okTitle: "Ganti", cancelTitle: "Pertahankan", centered: true }
        );
        if (!ok) {
          // Keputusan operator — jangan ditanyakan ulang terus-menerus.
          markApplied(msg.crossingId, msg.revision);
          this.pfToast("info", `Finish Time ${label} dipertahankan (${loc.finishTime}).`);
          return;
        }
      }

      if (loc.finishTime !== msg.finishTime) {
        await this.updateTime(msg.finishTime, loc.index, "finish");
        const after = this.pfLocateTeam(msg);
        if (!after || after.finishTime !== msg.finishTime) {
          this.pfToastOnce(msg, "warning", `Photo Finish untuk ${label} belum bisa diterapkan (mis. Heat belum ditentukan). Akan dicoba lagi.`);
          return;
        }
      }

      markApplied(msg.crossingId, msg.revision);
      const p = msg.penalties || {};
      const notes = [];
      if (p.crewIncomplete) notes.push("awak tidak lengkap");
      if (p.capsized) notes.push("perahu terbalik");
      if (p.secondCrossing) notes.push("melintas finish 2×");
      this.pfToast(
        notes.length ? "warning" : "success",
        `Finish ${label}: ${msg.finishTime} (urutan ${msg.rank}).` +
          (notes.length ? ` Juri mencatat: ${notes.join(", ")} — terapkan penalti finish sesuai aturan.` : "")
      );
    },

    /** Jumlah awak dari nama Division (R4/R6) — null bila tidak terbaca. */
    pfCrewExpected(divisionName) {
      const m = /R\s*(\d{1,2})/i.exec(String(divisionName || ""));
      return m ? Number(m[1]) : null;
    },

    /** Label kategori yang mudah dibaca untuk nama sesi Photo Finish. */
    pfBucketLabel(b) {
      return [b && b.divisionName, b && b.raceName, b && b.initialName].filter(Boolean).join(" ");
    },

    /** Dipanggil PhotofinishBar: buat & aktifkan sesi Photo Finish untuk heat ini. */
    async pfSendHeat(heat) {
      const b = this.pfBucket();
      if (!b || !b.eventId || !b.divisionId || !b.raceId || !b.initialId) {
        this.pfToast("warning", "Buka kategori spesifik (Division/Race/Initial) dulu sebelum mengirim heat.");
        return { ok: false };
      }
      const res = await armHeat({
        eventId: b.eventId,
        bucket: { divisionId: b.divisionId, raceId: b.raceId, initialId: b.initialId },
        raceCategory: this.pfCategory,
        heatId: heat.heatId,
        label: heat.label,
        lanes: heat.lanes,
      });
      if (res && res.ok) {
        this.pfToast("success", `${res.created ? "Sesi dibuat" : "Sesi diperbarui"} & AKTIF: ${res.label}. Impuls RaceTime2 berikutnya masuk ke sesi ini.`);
      } else {
        this.pfToast("error", "Gagal mengirim heat ke Photo Finish: " + ((res && res.error) || "tidak diketahui"));
      }
      return res;
    },

    pfToast(variant, text) {
      if (!this.$bvToast) return;
      this.$bvToast.toast(text, { title: "Photo Finish", variant: variant === "error" ? "danger" : variant, solid: true, autoHideDelay: 8000 });
    },

    pfToastOnce(msg, variant, text) {
      const key = msg.crossingId + ":" + msg.revision + ":" + text;
      if (this.pfNotified[key]) return;
      this.$set(this.pfNotified, key, true);
      this.pfToast(variant, text);
    },
  },
};
