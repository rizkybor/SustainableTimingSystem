// src/createAppProtocol.js — handler protokol `app://` utk build produksi.
//
// Pengganti vue-cli-plugin-electron-builder/lib/createProtocol: handler
// bawaan plugin TIDAK memberi MIME type utk file media (mp3/wav/…), dan
// skema `app` sebelumnya didaftarkan tanpa privilege `stream`. Sejak
// Electron 12, <audio>/<video> butuh keduanya utk memutar file dari
// protokol custom — akibatnya SEMUA tone (Orienteering bip, tone_message
// chat, dll.) gagal diputar di aplikasi hasil build ("NotSupportedError"),
// padahal normal saat electron:serve (dilayani dev server).
import { protocol } from "electron";
import * as path from "path";
import { readFile } from "fs";
import { URL } from "url";

const MIME = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".svgz": "image/svg+xml",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

// Privilege skema — WAJIB dipanggil sebelum app "ready".
export const APP_SCHEME_PRIVILEGES = {
  scheme: "app",
  privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true, corsEnabled: true },
};

let registered = false;
export default function createAppProtocol(scheme = "app") {
  if (registered) return; // dipanggil dari splash & main window — cukup sekali
  registered = true;
  protocol.registerBufferProtocol(scheme, (request, respond) => {
    const pathName = decodeURI(new URL(request.url).pathname); // URL bisa berisi spasi
    readFile(path.join(__dirname, pathName), (error, data) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to read ${pathName} on ${scheme} protocol`, error);
        respond({ statusCode: 404, data: Buffer.from("") });
        return;
      }
      const mimeType = MIME[path.extname(pathName).toLowerCase()] || "";
      respond({ mimeType, data });
    });
  });
}
