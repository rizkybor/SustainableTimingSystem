<template>
  <b-modal
    :id="id"
    v-model="show"
    hide-footer
    centered
    size="xl"
    body-class="p-0"
    content-class="rounded-20 overflow-hidden"
  >
    <!-- Header -->
    <template #modal-header>
      <div class="d-flex justify-content-between align-items-center w-100">
        <h5 class="mb-0 font-weight-bold">Event Setting</h5>
        <button type="button" class="btn-icon" @click="show = false">✕</button>
      </div>
    </template>

    <!-- Body -->
    <div class="p-4 modal-inner">
      <div class="text-muted small mb-3">
        Event: <strong>{{ eventName || "-" }}</strong> (ID: {{ eventId || "-" }})
      </div>

      <div class="cardish">
        <!-- ===================== Event Logo ===================== -->
        <section class="uploader-section">
          <div class="section-title">Event Logo</div>

          <div
            class="dropzone"
            :class="{ 'is-dragover': dzEventDragover }"
            @dragenter.prevent="onDragEnter('event')"
            @dragover.prevent="onDragOver('event')"
            @dragleave.prevent="onDragLeave('event')"
            @drop.prevent="onDrop('event', $event)"
            @click="onBrowse('event')"
          >
            <div class="dz-invite">
              <div class="dz-icon">⤓</div>
              <div class="dz-title">Drag &amp; Drop atau pilih file untuk upload</div>
              <div class="dz-sub">PNG maksimum {{ maxSizeMB }}MB</div>
            </div>
            <input
              ref="eventInput"
              type="file"
              accept="image/png"
              multiple
              class="d-none"
              @change="onFileChange('event', $event)"
            />
          </div>
          <div class="hint-danger">Max {{ maxFiles }} file (termasuk yang sudah ada)</div>

          <!-- File baru (belum diupload) -->
          <div v-if="eventFiles.length" class="file-list">
            <div
              class="file-pill"
              v-for="(f, idx) in eventFiles"
              :key="'evt-' + idx + '-' + f.name + '-' + f.size"
            >
              <span class="file-ext">PNG</span>
              <span class="file-name" :title="f.name">{{ f.name }}</span>
              <span class="file-size">{{ formatBytes(f.size) }}</span>
              <button class="file-del" @click.stop="removeFile('event', idx)" title="Remove">🗑️</button>
            </div>
          </div>

          <!-- Existing images as thumbnails -->
          <div v-if="keepEventUrls.length" class="gallery">
            <div
              v-for="(u, i) in keepEventUrls"
              :key="'evt-thumb-' + i"
              class="thumb"
            >
              <img
                class="thumb-img"
                :src="thumbFromUrl(u)"
                :alt="fileNameFromUrl(u)"
                loading="lazy"
              />
              <div class="thumb-caption" :title="fileNameFromUrl(u)">
                {{ fileNameFromUrl(u) }}
              </div>
              <button class="thumb-del" @click.stop="deleteExisting('event', u)" title="Delete">🗑</button>
            </div>
          </div>
        </section>

        <!-- ===================== Sponsorship Logo ===================== -->
        <section class="uploader-section mt-4">
          <div class="section-title">Sponsorship Logo</div>

          <div
            class="dropzone"
            :class="{ 'is-dragover': dzSponsorDragover }"
            @dragenter.prevent="onDragEnter('sponsor')"
            @dragover.prevent="onDragOver('sponsor')"
            @dragleave.prevent="onDragLeave('sponsor')"
            @drop.prevent="onDrop('sponsor', $event)"
            @click="onBrowse('sponsor')"
          >
            <div class="dz-invite">
              <div class="dz-icon">⤓</div>
              <div class="dz-title">Drag &amp; Drop atau pilih file untuk upload</div>
              <div class="dz-sub">PNG maksimum {{ maxSizeMB }}MB</div>
            </div>
            <input
              ref="sponsorInput"
              type="file"
              accept="image/png"
              multiple
              class="d-none"
              @change="onFileChange('sponsor', $event)"
            />
          </div>
          <div class="hint-danger">Max {{ maxFiles }} file (termasuk yang sudah ada)</div>

          <!-- File baru -->
          <div v-if="sponsorFiles.length" class="file-list">
            <div
              class="file-pill"
              v-for="(f, idx) in sponsorFiles"
              :key="'spn-' + idx + '-' + f.name + '-' + f.size"
            >
              <span class="file-ext">PNG</span>
              <span class="file-name" :title="f.name">{{ f.name }}</span>
              <span class="file-size">{{ formatBytes(f.size) }}</span>
              <button class="file-del" @click.stop="removeFile('sponsor', idx)" title="Remove">🗑️</button>
            </div>
          </div>

          <!-- Existing images as thumbnails -->
          <div v-if="keepSponsorUrls.length" class="gallery">
            <div
              v-for="(u, i) in keepSponsorUrls"
              :key="'spn-thumb-' + i"
              class="thumb"
            >
              <img
                class="thumb-img"
                :src="thumbFromUrl(u)"
                :alt="fileNameFromUrl(u)"
                loading="lazy"
              />
              <div class="thumb-caption" :title="fileNameFromUrl(u)">
                {{ fileNameFromUrl(u) }}
              </div>
              <button class="thumb-del" @click.stop="deleteExisting('sponsor', u)" title="Delete">🗑</button>
            </div>
          </div>
        </section>

        <!-- ===================== Signature Result ===================== -->
        <section class="signature mt-4">
          <div class="section-title">Signature Result</div>
          <div class="sig-list">
            <label class="sig-item">
              <input type="checkbox" v-model="signatureTechnicalDelegate" />
              <span>Technical Delegate</span>
            </label>
            <label class="sig-item">
              <input type="checkbox" v-model="signatureChiefJudge" />
              <span>Chief Judge</span>
            </label>
            <label class="sig-item">
              <input type="checkbox" v-model="signatureRaceDirector" />
              <span>Race Director</span>
            </label>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <div class="footer-actions">
        <button type="button" class="btn-outline" @click="show = false">Cancel</button>
        <button type="button" class="btn-primary" :disabled="isUpdating" @click="onUpdate">
          {{ isUpdating ? "Updating…" : "Update" }}
        </button>
      </div>
    </div>
  </b-modal>
</template>

<script>
import { ipcRenderer } from "electron";

export default {
  name: "EventSettingsModal",
  props: {
    value: { type: Boolean, default: false },
    id: { type: String, default: "event-settings-modal" },
    eventId: { type: String, default: "" },
    eventName: { type: String, default: "" },
    maxFiles: { type: Number, default: 10 },
    maxSizeMB: { type: Number, default: 100 },
  },
  data() {
    return {
      // file baru (File[])
      eventFiles: [],
      sponsorFiles: [],

      // URL existing dari DB
      existingEventUrls: [],
      existingSponsorUrls: [],

      // URL existing yang dipertahankan (bisa berkurang jika dihapus di UI)
      keepEventUrls: [],
      keepSponsorUrls: [],

      dzEventDragover: false,
      dzSponsorDragover: false,

      signatureTechnicalDelegate: false,
      signatureChiefJudge: false,
      signatureRaceDirector: false,

      isUpdating: false,
    };
  },

  computed: {
    show: {
      get: function () { return this.value; },
      set: function (v) { this.$emit("input", v); },
    },
  },

  watch: {
    show: {
      immediate: true,
      handler: function (v) {
        if (!v || !this.eventId) return;

        // reset state setiap modal dibuka
        this.eventFiles = [];
        this.sponsorFiles = [];
        this.existingEventUrls = [];
        this.existingSponsorUrls = [];
        this.keepEventUrls = [];
        this.keepSponsorUrls = [];

        var self = this;
        function onReply(_e, ev) {
          if (!self.show) return;

          var sig = ev && ev.signature ? ev.signature : {};
          self.signatureTechnicalDelegate = !!sig.technicalDelegate;
          self.signatureChiefJudge = !!sig.chiefJudge;
          self.signatureRaceDirector = !!sig.raceDirector;

          self.existingEventUrls   = ev && ev.eventFiles && Array.isArray(ev.eventFiles) ? ev.eventFiles.slice() : [];
          self.existingSponsorUrls = ev && ev.sponsorFiles && Array.isArray(ev.sponsorFiles) ? ev.sponsorFiles.slice() : [];

          self.keepEventUrls = self.existingEventUrls.slice();
          self.keepSponsorUrls = self.existingSponsorUrls.slice();

          ipcRenderer.removeListener("get-events-byid-reply", onReply);
        }

        ipcRenderer.on("get-events-byid-reply", onReply);
        ipcRenderer.send("get-events-byid", this.eventId);

        // guard timeout supaya listener tidak menggantung
        setTimeout(function () {
          ipcRenderer.removeListener("get-events-byid-reply", onReply);
        }, 3000);
      },
    },
  },

  methods: {
    /* ---------------- Existing thumbnail helpers ---------------- */
    fileNameFromUrl: function (url) {
      try {
        var u = new URL(String(url));
        var last = u.pathname.split("/").pop() || "";
        return decodeURIComponent(last);
      } catch (_e) {
        var s = String(url || "");
        var q = s.split("?")[0];
        return decodeURIComponent(q.split("/").pop() || s);
      }
    },
    thumbFromUrl: function (url) {
      // Jika Cloudinary: sisipkan transformasi thumbnail
      try {
        var u = new URL(String(url));
        // cari "/upload/"
        var p = u.pathname;
        var idx = p.indexOf("/upload/");
        if (idx !== -1) {
          var prefix = p.substring(0, idx + 8); // termasuk "/upload/"
          var suffix = p.substring(idx + 8);
          // transformasi ringan: lebar 240, tinggi 160, format otomatis, quality auto, crop fit
          var trans = "c_limit,w_240,h_160,q_auto,f_auto/";
          u.pathname = prefix + trans + suffix;
          return u.toString();
        }
        return url; // bukan Cloudinary
      } catch (_e) {
        return url;
      }
    },

    /* ---------------- Delete satu URL existing ---------------- */
    deleteExisting: async function (zone, url) {
      var list = zone === "event" ? this.keepEventUrls : this.keepSponsorUrls;
      var idx = list.indexOf(url);
      if (idx < 0) return;

      var publicId = this._publicIdFromUrl(url);

      try {
        if (window.cloud && typeof window.cloud.deleteByPublicId === "function" && publicId) {
          await window.cloud.deleteByPublicId(publicId);
        }
      } catch (e) {
        console.warn("Cloudinary delete failed:", e);
      }

      try {
        if (ipcRenderer && typeof ipcRenderer.send === "function") {
          ipcRenderer.send("services:event-assets:remove-one", {
            _id: this.eventId,
            field: zone === "event" ? "eventFiles" : "sponsorFiles",
            url: url,
            public_id: publicId,
          });
        }
      } catch (_e) {}

      list.splice(idx, 1);
      if (zone === "event") this.keepEventUrls = list.slice();
      else this.keepSponsorUrls = list.slice();
    },

    _publicIdFromUrl: function (url) {
      try {
        // contoh: /image/upload/v1760692994/sustainable-js/abc.png
        var u = new URL(String(url));
        var parts = u.pathname.split("/upload/");
        var afterUpload = parts.length > 1 ? parts[1] : "";
        var noVersion = afterUpload.replace(/^v\d+\//, "");
        return noVersion.replace(/\.[a-z0-9]+$/i, "");
      } catch (_e) {
        return "";
      }
    },

    /* ---------------- Dropzone helpers ---------------- */
    onBrowse: function (zone) {
      var refName = zone === "event" ? "eventInput" : "sponsorInput";
      var el = this.$refs[refName];
      if (el) el.click();
    },
    onFileChange: function (zone, e) {
      var list = e && e.target && e.target.files ? e.target.files : null;
      var files = [];
      if (list) { for (var i = 0; i < list.length; i++) files.push(list[i]); }
      this.addFiles(zone, files);
      if (e && e.target) e.target.value = "";
    },
    onDragEnter: function (zone) {
      if (zone === "event") this.dzEventDragover = true;
      else this.dzSponsorDragover = true;
    },
    onDragOver: function (zone) {
      if (zone === "event") this.dzEventDragover = true;
      else this.dzSponsorDragover = true;
    },
    onDragLeave: function (zone) {
      if (zone === "event") this.dzEventDragover = false;
      else this.dzSponsorDragover = false;
    },
    onDrop: function (zone, e) {
      if (zone === "event") this.dzEventDragover = false;
      else this.dzSponsorDragover = false;

      var list = e && e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files : null;
      var files = [];
      if (list) { for (var i = 0; i < list.length; i++) files.push(list[i]); }
      this.addFiles(zone, files);
    },

    addFiles: function (zone, files) {
      var target = zone === "event" ? this.eventFiles : this.sponsorFiles;
      var keptCount = zone === "event" ? this.keepEventUrls.length : this.keepSponsorUrls.length;

      var accepted = [];
      var errors = [];

      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        var name = f && f.name ? String(f.name) : "";
        var type = f && f.type ? String(f.type) : "";
        var size = Number((f && f.size) || 0);

        var isPng = /image\/png/i.test(type) || /\.png$/i.test(name);
        var sizeOk = size <= this.maxSizeMB * 1024 * 1024;

        if (!isPng) { errors.push(name + ": hanya PNG"); continue; }
        if (!sizeOk) { errors.push(name + ": > " + this.maxSizeMB + "MB"); continue; }

        accepted.push(f);
      }

      var remaining = this.maxFiles - (keptCount + target.length);
      if (remaining < 0) remaining = 0;

      var toAdd = accepted.slice(0, remaining);
      for (var j = 0; j < toAdd.length; j++) target.push(toAdd[j]);

      if (zone === "event") this.eventFiles = target.slice();
      else this.sponsorFiles = target.slice();

      if (errors.length) {
        var msg = errors.join("\n");
        if (this.$bvToast) this.$bvToast.toast(msg, { title: "Upload warning", variant: "warning", solid: true });
        else alert(msg);
      }

      if (accepted.length > toAdd.length) {
        var overMsg = "Max " + this.maxFiles + " file per section (termasuk yang sudah ada).";
        if (this.$bvToast) this.$bvToast.toast(overMsg, { title: "Limit reached", variant: "danger", solid: true });
        else alert(overMsg);
      }
    },

    removeFile: function (zone, idx) {
      var target = zone === "event" ? this.eventFiles : this.sponsorFiles;
      if (idx >= 0 && idx < target.length) {
        target.splice(idx, 1);
        if (zone === "event") this.eventFiles = target.slice();
        else this.sponsorFiles = target.slice();
      }
    },

    formatBytes: function (bytes) {
      if (!isFinite(bytes)) return "-";
      var units = ["B", "KB", "MB", "GB"];
      var i = 0;
      var n = bytes;
      while (n >= 1024 && i < units.length - 1) { n = n / 1024; i = i + 1; }
      var fixed = n >= 10 || i === 0 ? 0 : 1;
      return n.toFixed(fixed) + " " + units[i];
    },

    onUpdate: function () {
      this.isUpdating = true;

      var payload = {
        eventId: this.eventId,
        eventName: this.eventName,
        signature: {
          technicalDelegate: this.signatureTechnicalDelegate,
          chiefJudge: this.signatureChiefJudge,
          raceDirector: this.signatureRaceDirector,
        },
        eventFiles: this.eventFiles,       // File[] baru
        sponsorFiles: this.sponsorFiles,   // File[] baru
        keepEventUrls: this.keepEventUrls, // URL lama yang dipertahankan
        keepSponsorUrls: this.keepSponsorUrls,
      };

      this.$emit("update-settings", payload);
      this.show = false;
      this.isUpdating = false;
    },
  },
};
</script>

<style scoped>
.modal-inner { background: #f5f7fb; }
.cardish {
  background: #fff; border: 1px solid #e8edf5; border-radius: 14px;
  padding: 16px; box-shadow: 0 6px 16px rgba(16, 24, 40, 0.04);
}
.section-title { font-weight: 800; color: #222; margin-bottom: 8px; }

/* Dropzone */
.dropzone {
  border: 2px dashed #d6dee9; border-radius: 12px; background: #fcfdff;
  min-height: 120px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s ease;
}
.dropzone:hover { border-color: rgb(0, 180, 255); box-shadow: 0 0 20px rgba(0, 180, 255, 0.2); }
.dropzone.is-dragover { background: #eef6ff; border-color: rgb(0, 180, 255); }
.dz-invite { text-align: center; padding: 16px 8px; }
.dz-icon { font-size: 22px; opacity: 0.7; }
.dz-title { font-weight: 700; color: #3b3b3b; }
.dz-sub { color: #9aa6b2; font-size: 12px; }

.hint-danger { color: #e53935; font-size: 12px; margin-top: 6px; }

/* File list (baru) */
.file-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.file-pill {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #e6ebf4; border-radius: 12px;
  padding: 8px 12px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
}
.file-ext {
  background: #eef6ff; color: rgb(0, 180, 255);
  border: 1px solid #dbeafe; border-radius: 8px; font-weight: 800; font-size: 12px; padding: 2px 6px;
}
.file-name { max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700; }
.file-size { color: #64748b; font-size: 12px; }
.file-del { border: none; background: transparent; cursor: pointer; color: #e53935; font-size: 16px; line-height: 1; }

/* Gallery existing */
.gallery {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.thumb {
  position: relative;
  background: #fff;
  border: 1px solid #e6ebf4;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
}
.thumb-img {
  width: 100%;
  height: 120px;
  object-fit: contain;
  background: #f8fafc;
}
.thumb-caption {
  font-size: 12px;
  padding: 6px 10px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
}
.thumb-del {
  position: absolute;
  top: 6px;
  right: 6px;
  border: none;
  background: rgba(229, 57, 53, 0.9);
  color: #fff;
  border-radius: 8px;
  width: 28px;
  height: 24px;
  line-height: 24px;
  font-size: 14px;
  cursor: pointer;
}

/* Signature */
.signature .sig-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 12px;
}
.sig-item { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.sig-item input[type="checkbox"] { transform: scale(1.1); }

/* Footer */
.footer-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.btn-outline, .btn-primary {
  border-radius: 10px; padding: 10px 18px; font-weight: 800;
  border: 1px solid #cfd8e6; background: #fff; color: #1c4c7a;
}
.btn-outline:hover { box-shadow: 0 0 20px rgba(0, 180, 255, 0.2); }
.btn-primary { background: #2f6ea5; color: #fff; border-color: #2f6ea5; }
.btn-primary:disabled { opacity: .65; cursor: not-allowed; }

/* Header close button */
.btn-icon {
  background: #f6f7fb; border: 1px solid #e6ebf4; border-radius: 999px;
  width: 32px; height: 32px; font-weight: 700; line-height: 1;
}
</style>