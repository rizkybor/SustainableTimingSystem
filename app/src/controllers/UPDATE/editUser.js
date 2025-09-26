const { getDb } = require("../index");
const { ObjectId } = require("mongodb");

async function updateUser(userId, payload) {
  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const db = await getDb();
  const col = db.collection("users");

  // Bangun $set dinamis
  const setDoc = { updatedAt: new Date() };

  // Hanya set kalau payload mengandung properti tsb (bukan falsy check)
  if (Object.prototype.hasOwnProperty.call(payload, "username")) {
    setDoc.username = payload.username; // biarkan undefined/null kalau mau hapus di tempat lain
  }
  if (Object.prototype.hasOwnProperty.call(payload, "image")) {
    setDoc.image = payload.image;
  }
  if (Array.isArray(payload.mainEvents)) {
    // Normalisasi: unique + hanya string non-empty
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