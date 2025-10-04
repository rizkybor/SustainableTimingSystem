// src/services/networkManager.js
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import fetch from 'node-fetch';

const userCfgPath = path.join(app.getPath('userData'), 'net.json');

export function ensureDefaults() {
  const defaultsPath = path.join(process.resourcesPath, 'defaults', 'net.json');
  if (!fs.existsSync(userCfgPath)) {
    const devFallback = path.join(process.cwd(), 'public', 'defaults', 'net.json');
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
  let mode = cfg.mode; // 'auto' | 'online' | 'lan'

  if (mode === 'auto') {
    const lanUrl = (cfg.api && cfg.api.lan) ? cfg.api.lan : '';
    const onUrl  = (cfg.api && cfg.api.online) ? cfg.api.online : '';

    const lanUp = await ok(lanUrl);
    if (lanUp) mode = 'lan';
    else {
      const onUp = await ok(onUrl);
      mode = onUp ? 'online' : 'lan';
    }
  }

  const apiBase  = (cfg.api && cfg.api[mode]) ? cfg.api[mode] : '';
  const mongoUri = (cfg.mongo && cfg.mongo[mode]) ? cfg.mongo[mode] : '';
  const realtime = (cfg.realtime && cfg.realtime[mode]) ? cfg.realtime[mode] : null;

  return { mode, apiBase, mongoUri, realtime };
}