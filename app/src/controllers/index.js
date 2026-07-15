// src/main/db.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

const SEED_URI="mongodb://rizkyak:Mongos-Jeko-STS2025@" +
  "mongo-jeko-shard-00-00.qdk8a.mongodb.net:27017," +
  "mongo-jeko-shard-00-01.qdk8a.mongodb.net:27017," +
  "mongo-jeko-shard-00-02.qdk8a.mongodb.net:27017/" +
  "sustainabledb_atlas" +
  "?tls=true&replicaSet=atlas-13yy7d-shard-0&authSource=admin" +
  "&retryWrites=true&w=majority";

const uri = SEED_URI;

let client;
let db;
let connecting;

// Index yang harus ada, dibuat sekali per koneksi (createIndex idempotent —
// aman dipanggil berkali-kali kalau index sudah ada).
async function ensureIndexes(database) {
  try {
    // Cegah duplikat tim di master roster: satu nama+bib hanya boleh sekali.
    await database
      .collection("teamsCollection")
      .createIndex({ nameTeam: 1, bibTeam: 1 }, { unique: true });
  } catch (err) {
    // Kalau data lama sudah mengandung duplikat nameTeam+bibTeam, MongoDB
    // menolak membuat unique index — jangan sampai itu menggagalkan seluruh
    // koneksi DB, cukup lanjut tanpa constraint ini untuk sementara.
  }

  try {
    // Dipakai buat cursor pagination live chat (load pesan lama saat scroll
    // ke atas) — filter by eventId+category lalu urut/filter by _id.
    await database
      .collection("chatMessages")
      .createIndex({ eventId: 1, category: 1, _id: -1 });
  } catch (err) {
    // non-fatal
  }
}

async function getDb() {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 30,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      family: 4,
    });
  }

  if (!connecting) {
    connecting = client
      .connect()
      .then(async () => {
        db = client.db("sustainabledb_atlas");
        await ensureIndexes(db);
        return db;
      })
      .catch((err) => {
        const msg =
          err && typeof err === "object" && err.message
            ? err.message
            : String(err);
        // reset state supaya percobaan selanjutnya bisa create client baru
        client = undefined;
        db = undefined;
        connecting = undefined;
        throw err;
      });
  }

  return connecting;
}

async function closeDb() {
  try {
    if (client) {
      await client.close();
    }
  } finally {
    client = undefined;
    db = undefined;
    connecting = undefined;
  }
}

module.exports = { getDb, closeDb };
