// ===== Cloudinary config (dipakai bareng oleh CreateEvent, EventSettings & Chat) =====
var CLOUD_NAME = "kikiaka";
var UPLOAD_PRESET = "stiming-preset";
export var MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB, dipakai juga oleh chat widget

export function toCloudMeta(json) {
  return {
    public_id: json && json.public_id ? String(json.public_id) : "",
    secure_url:
      json && (json.secure_url || json.url)
        ? String(json.secure_url || json.url)
        : "",
    url:
      json && (json.secure_url || json.url)
        ? String(json.secure_url || json.url)
        : "",
    width: typeof (json && json.width) === "number" ? json.width : null,
    height: typeof (json && json.height) === "number" ? json.height : null,
    format: json && json.format ? String(json.format) : "",
    bytes: typeof (json && json.bytes) === "number" ? json.bytes : 0,
    resource_type:
      json && json.resource_type ? String(json.resource_type) : "image",
    original_filename:
      json && json.original_filename ? String(json.original_filename) : "",
  };
}

// resourceType: "image" (default) | "video" (dipakai juga utk audio, sesuai
// konvensi Cloudinary yang memperlakukan file audio sebagai resource "video")
export async function uploadOne(fileObj, folder, resourceType) {
  if (!fileObj) return { ok: false, error: "no-file" };

  var kind = resourceType || "image";

  var size =
    typeof fileObj.size === "number" ? fileObj.size : null;
  if (size != null && size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "file-too-large" };
  }

  // A) lewat bridge Electron kalau ada
  if (window.cloud && typeof window.cloud.uploadFile === "function") {
    try {
      var up = await window.cloud.uploadFile(fileObj, {
        folder: folder,
        resourceType: kind,
      });
      if (up && up.ok === true && up.result) {
        return { ok: true, result: toCloudMeta(up.result) };
      }
      return {
        ok: false,
        error: up && up.error ? String(up.error) : "upload-failed",
      };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  }

  // B) fallback unsigned upload
  try {
    var fd = new FormData();
    fd.append("file", fileObj);
    fd.append("upload_preset", UPLOAD_PRESET);
    if (folder) fd.append("folder", folder);

    var url =
      "https://api.cloudinary.com/v1_1/" + CLOUD_NAME + "/" + kind + "/upload";
    var res = await fetch(url, { method: "POST", body: fd });
    var json = null;
    try {
      json = await res.json();
    } catch (_e) {
      json = null;
    }

    if (!res.ok || !json || !(json.secure_url || json.url)) {
      var det =
        json && json.error && json.error.message
          ? json.error.message
          : "upload-failed";
      return { ok: false, error: det, raw: json };
    }
    return { ok: true, result: toCloudMeta(json) };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

export async function uploadMany(list, folder) {
  var out = [];
  if (!list || typeof list.length !== "number") return out;

  for (var i = 0; i < list.length; i++) {
    var f = list[i];

    // kalau yang datang path string (drag&drop), minta bridge bikin File-like
    if (
      typeof f === "string" &&
      window.cloud &&
      typeof window.cloud.pathToFile === "function"
    ) {
      try {
        var created = await window.cloud.pathToFile(f);
        if (created) f = created;
      } catch (_e) {
        // pakai nilai asli (string path) kalau konversi gagal
      }
    }

    var up = await uploadOne(f, folder);
    if (up && up.ok && up.result) out.push(up.result);
  }
  return out;
}
