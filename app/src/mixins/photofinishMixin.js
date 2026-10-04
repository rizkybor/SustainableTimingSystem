// Menerapkan hasil STS Photo Finish (photofinish:verified) ke halaman race.
// Dipakai HeadToHead, RaftingCross, DownRiverRace. Setiap view menyediakan:
//
//   pfCategory          : "H2H" | "RX" | "DRR"
//   pfBucket()          : { eventId, ... } kategori aktif — Photo Finish hanya
//                         memakai eventId (dan eventName bila ada)
//   pfLocateTeam(msg)   : { index, finishTime, name } di list yang dipakai
//                         updateTime(), atau null bila tim tidak ada di
//                         heat/babak yang sedang tampil
//
// Aturan: sesi Photo Finish cukup terhubung ke EVENT (Id Event) — tidak
// membaca Division/Race/Initial maupun format lomba. Hasil diterapkan bila
// Event sama DAN tim ada di heat/babak yang sedang tampil (pfLocateTeam). Hasil
// yang belum cocok tetap tersimpan di main process dan dicoba lagi saat
// operator membuka halaman yang memuat tim tersebut.
import { getPending, markApplied, noteResult, onTrigger, onVerified } from "@/services/photofinish";

const RETRY_MS = 5000;

// Registration Id baris Photo Finish: bentuknya sama dengan frame RaceTime2
// (19 karakter, diakhiri marker "R", mis. "004800630010140010R") tetapi
// selalu diawali "PF": "PF" + nomor urut 7 digit + waktu HHMMSSmmm + "R".
// Nomor urut disimpan di localStorage → unik walau aplikasi dibuka ulang.
const PF_SEQ_KEY = "pf.registrationSeq";
let pfSeq = null;

function nextPfSeq() {
  if (pfSeq === null) {
    let saved = 0;
    try {
      saved = Number(window.localStorage.getItem(PF_SEQ_KEY)) || 0;
    } catch (_e) {
      saved = 0;
    }
    pfSeq = saved;
  }
  pfSeq = (pfSeq + 1) % 10000000;
  try {
    window.localStorage.setItem(PF_SEQ_KEY, String(pfSeq));
  } catch (_e) {
    // localStorage tidak tersedia — nomor tetap naik selama aplikasi terbuka
  }
  return pfSeq;
}

/** "HH:MM:SS.mmm" → "HHMMSSmmm" (format mentah Racetime seperti RaceTime2). */
// "H:MM:SS(.mmm)" -> "HHMMSSmmm" (9 digit). Jam/milidetik dipad dgn benar
// (mis. "8:14:02.25" -> "081402250"), BUKAN sekadar buang non-digit lalu
// pad kanan — cara lama membaca "8:14:02.25" sbg 81:40:22.500.
function toRawTime9(time) {
  const str = String(time || "").trim();
  const m = /^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(str);
  if (m) return m[1].padStart(2, "0") + m[2] + m[3] + (m[4] || "").padEnd(3, "0");
  return (str.replace(/\D+/g, "") + "000000000").slice(0, 9);
}

function pfRawTime(time) {
  return toRawTime9(time);
}

export function pfRegistrationId(time, seq) {
  return "PF" + String(seq).padStart(7, "0") + pfRawTime(time) + "R";
}

export function pfRacetime(time) {
  return "PF" + pfRawTime(time);
}

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
     * frame RaceTime2: baris dengan Registration Id unik berawalan "PF" dan
     * Racetime "PF" + HHMMSSmmm, waktunya masuk Buffer-Timer-Finish. Operator tetap menekan tombol BIB
     * untuk menetapkannya ke tim (atau menunggu hasil juri Photo Finish).
     * digitId/digitTime/digitTimeFinish milik serialPortMixin di komponen yang sama.
     */
    pfOnTrigger(msg) {
      if (!msg || !msg.time || !this.pfEventMatches(msg)) return; // event lain
      if (Array.isArray(this.digitId)) this.digitId.unshift(pfRegistrationId(msg.time, nextPfSeq()));
      if (Array.isArray(this.digitTime)) this.digitTime.unshift(pfRacetime(msg.time));
      this.digitTimeFinish = msg.time;
    },

    pfEventMatches(msg) {
      const b = typeof this.pfBucket === "function" ? this.pfBucket() : null;
      return !!(b && b.eventId && msg && String(msg.eventId) === String(b.eventId));
    },

    async pfApply(msg) {
      // Bukan untuk Event ini — biarkan tertunda, tanpa notifikasi. Sesi Photo
      // Finish tidak membawa format lomba (null) → berlaku di halaman mana pun
      // yang menampilkan tim tersebut; sesi lama yang masih membawa format
      // tetap dicocokkan formatnya.
      if (!this.pfEventMatches(msg)) {
        noteResult(msg.crossingId, msg.revision, "Menunggu halaman race Event ini dibuka");
        return;
      }
      if (msg.raceCategory && msg.raceCategory !== this.pfCategory) {
        noteResult(msg.crossingId, msg.revision, `Menunggu halaman ${msg.raceCategory} dibuka`);
        return;
      }

      const loc = this.pfLocateTeam(msg);
      if (!loc) {
        noteResult(msg.crossingId, msg.revision, "Tim tidak tampil di heat/babak yang sedang dibuka");
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
          markApplied(msg.crossingId, msg.revision, "dipertahankan");
          this.pfToast("info", `Finish Time ${label} dipertahankan (${loc.finishTime}).`);
          return;
        }
      }

      if (loc.finishTime !== msg.finishTime) {
        await this.updateTime(msg.finishTime, loc.index, "finish");
        const after = this.pfLocateTeam(msg);
        if (!after || after.finishTime !== msg.finishTime) {
          noteResult(msg.crossingId, msg.revision, "Belum bisa diisi (mis. Heat belum ditentukan) — dicoba lagi");
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
