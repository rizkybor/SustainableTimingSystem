const { getDb } = require("../index");

async function getAllUsers() {
  const db = await getDb();
  const col = db.collection("users");
  // Urutkan terbaru dulu (createdAt desc) biar tabel User Management di
  // sts-timingsystem sudah tersortir begitu halaman dibuka, tanpa perlu
  // klik sort header dulu.
  return await col
    .find({})
    .project({ password: 0 }) // exclude password
    .sort({ createdAt: -1 })
    .toArray();
}

module.exports = { getAllUsers };