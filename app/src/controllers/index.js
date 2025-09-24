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

const uri = process.env.MONGO_URI || SEED_URI;

let client;
let db;
let connecting;

async function getDb() {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 30,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      // family: 4, // uncomment jika jaringanmu bermasalah IPv6
    });
  }

  if (!connecting) {
    connecting = client
      .connect()
      .then(() => {
        db = client.db("sustainabledb_atlas");
        console.log("✅ Mongo connected to:", db.databaseName);
        return db;
      })
      .catch((err) => {
        const msg =
          err && typeof err === "object" && err.message
            ? err.message
            : String(err);
        console.error("❌ Mongo connect failed:", msg);
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
