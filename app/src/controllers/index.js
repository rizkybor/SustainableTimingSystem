// src/services/db.js
const { MongoClient } = require("mongodb");

const uri = "mongodb://rizkyak:Mongos-Jeko-STS2025@mongo-jeko-shard-00-00.qdk8a.mongodb.net:27017,mongo-jeko-shard-00-01.qdk8a.mongodb.net:27017,mongo-jeko-shard-00-02.qdk8a.mongodb.net:27017/?replicaSet=atlas-13yy7d-shard-0&ssl=true&authSource=admin";
let client;
let db;
let connecting; // promise guard

async function getDb() {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 30,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
      serverSelectionTimeoutMS: 5000,
    });
  }

  // pastikan connect hanya sekali
  if (!connecting) {
    connecting = client.connect().then(() => {
      db = client.db("sustainabledb_atlas");
      return db;
    });
  }

  return connecting; // selalu return db (via promise yang sama)
}

async function closeDb() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
    connecting = undefined;
  }
}

module.exports = { getDb, closeDb };