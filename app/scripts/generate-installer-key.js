// Generate nsis/installer-key.nsh dari INSTALLER_KEY di .env sebelum build.
// File hasil generate ini sengaja di-gitignore karena berisi kunci asli.
//
// Format kunci yang dipakai NSIS installer: XXXX-XXXX-XXXX-XXXX (16 karakter,
// huruf A-Z / angka 0-9). Kalau INSTALLER_KEY di .env kosong atau formatnya
// tidak valid, script ini akan generate kunci baru dan menuliskannya balik
// ke .env supaya kamu tahu kunci mana yang harus dipakai.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const ENV_PATH = path.join(__dirname, "..", ".env");
const OUT_PATH = path.join(__dirname, "..", "nsis", "installer-key.nsh");

function generateKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa 0/O/1/I biar tidak rancu
  const groups = [];
  for (let g = 0; g < 4; g++) {
    let group = "";
    for (let i = 0; i < 4; i++) {
      group += chars[crypto.randomInt(chars.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

function normalize(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

function isValidFormat(key) {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}

function writeKeyToEnv(key) {
  let envContent = "";
  try {
    envContent = fs.readFileSync(ENV_PATH, "utf8");
  } catch (e) {
    envContent = "";
  }

  if (/^INSTALLER_KEY=.*$/m.test(envContent)) {
    envContent = envContent.replace(/^INSTALLER_KEY=.*$/m, `INSTALLER_KEY=${key}`);
  } else {
    envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + `INSTALLER_KEY=${key}\n`;
  }
  fs.writeFileSync(ENV_PATH, envContent, "utf8");
}

let key = normalize(process.env.INSTALLER_KEY);

if (!isValidFormat(key)) {
  key = generateKey();
  writeKeyToEnv(key);
  console.log(
    `\nINSTALLER_KEY di .env kosong/tidak sesuai format XXXX-XXXX-XXXX-XXXX.\n` +
      `Kunci baru sudah dibuat dan disimpan otomatis ke .env: ${key}\n`
  );
} else {
  console.log(`Memakai INSTALLER_KEY dari .env: ${key}`);
}

const content = `!define INSTALLER_KEY "${key}"\n`;
fs.writeFileSync(OUT_PATH, content, "utf8");
console.log("nsis/installer-key.nsh berhasil di-generate.");
