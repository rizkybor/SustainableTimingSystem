const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// connectToDatabase();
async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db("sustainabledb");
    return database;
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}

module.exports = {
  connectToDatabase,
};
