const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

async function updateUser(userId, payload) {
  const db = await getDb();
  const col = db.collection("users");

  const updateDoc = {
    $set: {
      username: payload.username || "",
      image: payload.image || "",
      judges: Array.isArray(payload.judges) ? payload.judges : [],
      mainEvents: Array.isArray(payload.mainEvents) ? payload.mainEvents : [],
      updatedAt: new Date(),
    },
  };

  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    updateDoc,
    { returnDocument: "after" }
  );

  return res.value;
}

module.exports = { updateUser };