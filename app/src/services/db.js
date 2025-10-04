// src/services/db.js
const { MongoClient } = require("mongodb");

let client;
let db;
let connecting;
let currentUri = null;

async function connectMongo(uri, attempts = 3) {
      console.log("⚙️ [DB] Connecting to Mongo:", uri);

  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      if (db && currentUri === uri) return db;
      if (!client) {
        client = new MongoClient(uri, {
          maxPoolSize: 30,
          minPoolSize: 5,
          maxIdleTimeMS: 10000,
          serverSelectionTimeoutMS: 8000,   // bisa naikkan 15000 kalau network lambat
          connectTimeoutMS: 8000,
          family: 4,
        });
      }
      await client.connect();
      currentUri = uri;
      db = client.db("sustainabledb_atlas");
      console.log("[DB] connected:", uri);
      return db;
    } catch (err) {
      lastErr = err;
      console.warn(`[DB] connect attempt ${i} failed:`, (err && err.message) ? err.message : err);
      await new Promise(r => setTimeout(r, 1000 * i)); // backoff 1s,2s,3s
      client = undefined; db = undefined;
    }
  }
  throw lastErr;
}

async function closeDb() {
  try {
    if (client) {
      await client.close();
      console.log("[DB] closed");
    }
  } finally {
    client = undefined;
    db = undefined;
    connecting = undefined;
    currentUri = null;
  }
}

module.exports = { connectMongo, closeDb };