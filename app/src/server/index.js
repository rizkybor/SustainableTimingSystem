// index.js
const { MongoClient } = require("mongodb");

// URI MongoDB Anda
const uri = "mongodb://localhost:27017";
const dbName = "sustainabledb";

// Buat koneksi MongoClient
const client = new MongoClient(uri, { useUnifiedTopology: true });

async function main() {
  try {
    // Tunggu hingga koneksi berhasil
    await client.connect();
    console.log("Connected to MongoDB");

    // Dapatkan referensi ke database sustainabledb
    const db = client.db(dbName);

    // Dapatkan referensi ke koleksi stscollection
    const collection = db.collection("stscollection");

    // Dapatkan data dari koleksi
    const data = await collection.find({}).toArray();

    console.log("Data from stscollection:");
    console.log(data);
  } catch (error) {
    console.error("Error:", error);
  }
}

module.exports = { main, client, dbName }; // Export client dan dbName jika diperlukan
