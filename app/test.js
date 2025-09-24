const { MongoClient } = require("mongodb");

const uri =
  "mongodb://rizkyak:Mongos-Jeko-STS2025@" +
  "mongo-jeko-shard-00-00.qdk8a.mongodb.net:27017," +
  "mongo-jeko-shard-00-01.qdk8a.mongodb.net:27017," +
  "mongo-jeko-shard-00-02.qdk8a.mongodb.net:27017/" +
  "sustainabledb_atlas" +
  "?tls=true&replicaSet=atlas-13yy7d-shard-0&authSource=admin" +
  "&retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  // family: 4, // aktifkan jika jaringanmu “alergi” IPv6
});

(async () => {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected (non-SRV) & ping OK");
  } catch (err) {
    console.error("❌ Failed:", err.name, err.code, err.message);
  } finally {
    await client.close().catch(()=>{});
  }
})();