const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

async function updateUser(userId, payload) {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const db = await getDb();
  const col = db.collection("users");
  const setDoc = { updatedAt: new Date() };

  if (Object.prototype.hasOwnProperty.call(payload, "username")) {
    setDoc.username = payload.username;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "image")) {
    setDoc.image = payload.image;
  }
  if (Array.isArray(payload.mainEvents)) {
    const cleaned = Array.from(
      new Set(payload.mainEvents.map(String).map(s => s.trim()).filter(Boolean))
    );
    setDoc.mainEvents = cleaned;
  }

  const updateDoc = { $set: setDoc };

  const res = await col.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    updateDoc,
    { returnDocument: "after" }
  );

  return res.value;
}

module.exports = { updateUser };