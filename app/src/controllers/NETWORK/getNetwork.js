// controllers/Networks.js (atau file yang kamu lampirkan)
const { app } = require("electron");
const { getDb } = require("../index");
require("dotenv").config();

function detectEnvName() {
  const name = process.env.VUE_APP_ENV_NAME;
  if (name) return name;
  if (app && typeof app.isPackaged === "boolean" && app.isPackaged) return "production";
  const rt = process.env.VUE_APP_RT_URL || "";
  if (rt.includes("27.3.82.50")) return "lan";
  if (rt.includes("localhost") || rt.includes("127.0.0.1")) return "development";
  return "production";
}

// <-- DEFAULTS sekarang punya pasangan {base,realtime}
function buildEnvDefaults() {
  const env = detectEnvName();

  const defaults = {
    ONLINE:   { base: process.env.VITE_BASE_URL_ONLINE     || process.env.VUE_APP_BASE_URL || "https://sts-racehub.onrender.com", 
                realtime: process.env.VITE_REALTIME_URL_ONLINE || process.env.VUE_APP_RT_URL  || "https://sts-racehub.onrender.com" },
    LAN:      { base: process.env.VITE_BASE_URL_LAN        || "http://27.3.82.50:5050",
                realtime: process.env.VITE_REALTIME_URL_LAN    || "http://27.3.82.50:8181" },
    OFFLINE:  { base: process.env.VITE_BASE_URL_DEV        || "http://localhost:4000",
                realtime: process.env.VITE_REALTIME_URL_DEV    || "http://localhost:8000" },
  };

  // jika variabel tunggal VUE_APP_RT_URL diisi, pakai untuk env terdeteksi
  if (process.env.VUE_APP_RT_URL) {
    if (env === "development") defaults.OFFLINE.realtime = process.env.VUE_APP_RT_URL;
    else if (env === "lan")    defaults.LAN.realtime     = process.env.VUE_APP_RT_URL;
    else                       defaults.ONLINE.realtime  = process.env.VUE_APP_RT_URL;
  }
  return defaults;
}

async function getNetworkConfigRaw() {
  const db = await getDb();
  return db.collection("networkConfig").find({}).toArray();
}

// <-- PETAKAN portApp -> base, portRealtime -> realtime
function mapDocsToUrls(docs) {
  const map = {
    ONLINE:  { base: "", realtime: "" },
    LAN:     { base: "", realtime: "" },
    OFFLINE: { base: "", realtime: "" },
  };

  for (const d of docs || []) {
    if (!d || !d.networkName) continue;
    if (d.networkName === "global-network-config") {
      map.ONLINE.base = d.portApp || "";
      map.ONLINE.realtime = d.portRealtime || "";
    } else if (d.networkName === "lan-network-config") {
      map.LAN.base = d.portApp || "";
      map.LAN.realtime = d.portRealtime || "";
    } else if (d.networkName === "development-network-config") {
      map.OFFLINE.base = d.portApp || "";
      map.OFFLINE.realtime = d.portRealtime || "";
    }
  }

  // Isi yang kosong dengan defaults
  const def = buildEnvDefaults();
  ["ONLINE","LAN","OFFLINE"].forEach(k => {
    if (!map[k].base) map[k].base = def[k].base;
    if (!map[k].realtime) map[k].realtime = def[k].realtime;
  });

  return map;
}

async function getNetworkConfigMap() {
  const raw = await getNetworkConfigRaw();
  return mapDocsToUrls(raw);
}

module.exports = { getNetworkConfigRaw, getNetworkConfigMap, mapDocsToUrls };