// src/services/configurationNetworkingManager.js
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import fetch from 'node-fetch';

const userCfgPath = path.join(app.getPath('userData'), 'configurationNetworking.json');

export function ensureDefaults() {
  const defaultsPath = path.join(process.resourcesPath, 'defaults', 'configurationNetworking.json');
  if (!fs.existsSync(userCfgPath)) {
    const devFallback = path.join(process.cwd(), 'public', 'defaults', 'configurationNetworking.json');
    const src = fs.existsSync(defaultsPath) ? defaultsPath : devFallback;
    fs.copyFileSync(src, userCfgPath);
  }
}

export function readConfig() {
  return JSON.parse(fs.readFileSync(userCfgPath, 'utf8'));
}

export function writeConfig(next) {
  fs.writeFileSync(userCfgPath, JSON.stringify(next, null, 2));
  return next;
}

// health check ringan
async function ok(url, timeoutMs = 800) {
  if (!url) return false;
  try {
    const u = new URL('/health', url).toString();
    const ctrl = new AbortController();
    const t = setTimeout(function () { ctrl.abort(); }, timeoutMs);
    const res = await fetch(u, { signal: ctrl.signal });
    clearTimeout(t);
    return !!res && res.ok;
  } catch (_) { return false; }
}

export async function pickEndpoints() {
  const cfg = readConfig();
  var mode = cfg && cfg.mode ? cfg.mode : "online";

  // ⬇️ mode offline: langsung pakai offline (tanpa probing)
  if (mode === "offline") {
    return {
      mode: "offline",
      apiBase:  (cfg && cfg.api && cfg.api.offline) ? cfg.api.offline : "",
      mongoUri: (cfg && cfg.mongo && cfg.mongo.offline) ? cfg.mongo.offline : "",
      realtime: (cfg && cfg.realtime && cfg.realtime.offline) ? cfg.realtime.offline : null
    };
  }

  // ⬇️ mode auto: prefer LAN, kalau gagal baru online
  if (mode === "auto") {
    var lanUrl = (cfg && cfg.api && cfg.api.lan) ? cfg.api.lan : "";
    var onUrl  = (cfg && cfg.api && cfg.api.online) ? cfg.api.online : "";
    var lanUp = await ok(lanUrl);
    if (lanUp) mode = "lan";
    else {
      var onUp = await ok(onUrl);
      mode = onUp ? "online" : "lan";
    }
  }

  var apiBase  = (cfg && cfg.api && cfg.api[mode]) ? cfg.api[mode] : "";
  var mongoUri = (cfg && cfg.mongo && cfg.mongo[mode]) ? cfg.mongo[mode] : "";
  var realtime = (cfg && cfg.realtime && cfg.realtime[mode]) ? cfg.realtime[mode] : null;

  return { mode, apiBase, mongoUri, realtime };
}