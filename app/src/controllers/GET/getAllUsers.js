const { getDb } = require("../index");

async function getAllUsers() {
  const db = await getDb();
  const col = db.collection("users");
  return await col.find({}).project({ password: 0 }).toArray(); // exclude password
}

module.exports = { getAllUsers };