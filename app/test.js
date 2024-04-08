const { MongoClient } = require("mongodb");

async function main() {
  // URI MongoDB Anda
  const uri = "mongodb://localhost:27017";
  const dbName = "sustainabledb";

  // Buat koneksi MongoClient
  const client = new MongoClient(uri, { useUnifiedTopology: true });

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
  } finally {
    // Tutup koneksi
    await client.close();
    console.log("Closed MongoDB connection");
  }
}

// Panggil fungsi utama
main();
