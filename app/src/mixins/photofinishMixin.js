// Menerapkan hasil STS Photo Finish (photofinish:verified) ke halaman race.
// Dipakai HeadToHead, RaftingCross, DownRiverRace. Setiap view menyediakan:
//
//   pfCategory          : "H2H" | "RX" | "DRR"
//   pfBucket()          : { eventId, divisionId, raceId, initialId } kategori aktif
//   pfLocateTeam(msg)   : { index, finishTime, name } di list yang dipakai
//                         updateTime(), atau null bila tim tidak ada di
//                         heat/babak yang sedang tampil
//
// Aturan (lihat feedback "Scope by 4 Categories"): hasil HANYA diterapkan
// bila Event + Division + Race + Initial sama persis. Hasil yang belum
// cocok tetap tersimpan di main process dan dicoba lagi saat operator
// membuka kategori/babak yang benar.
import { getPending, markApplied, onVerified } from "@/services/photofinish";

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
    this.pfRetryPending();
    this._pfTimer = setInterval(() => this.pfRetryPending(), RETRY_MS);
  },

  beforeDestroy() {
    if (this._pfOff) this._pfOff();
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
