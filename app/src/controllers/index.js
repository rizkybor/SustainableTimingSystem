const { MongoClient } = require("mongodb");

const uri = "mongodb://rizkyak:112024@mongo-jeko-shard-00-00.qdk8a.mongodb.net:27017,mongo-jeko-shard-00-01.qdk8a.mongodb.net:27017,mongo-jeko-shard-00-02.qdk8a.mongodb.net:27017/?replicaSet=atlas-13yy7d-shard-0&ssl=true&authSource=admin";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// connectToDatabase();
async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db("sustainabledb_atlas");
    return database;
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}

module.exports = {
  connectToDatabase,
};
