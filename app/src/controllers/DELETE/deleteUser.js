// controllers/users.controller.js
const { getDb } = require("../index");

function normalizeEmail(raw) {
  return String(raw || "").trim().toLowerCase();
}

async function deleteUser(email) {
  const norm = normalizeEmail(email);
  if (!norm) throw new Error("Invalid email");

  const db = await getDb();
  const col = db.collection("users");

  const result = await col.deleteMany({ email: norm });
  return { deletedCount: result.deletedCount || 0 };
}

module.exports = { deleteUser };
