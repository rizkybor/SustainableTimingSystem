const { getDb } = require("../index");

var VALID_CATEGORIES = ["sprint", "h2h", "slalom", "drr", "rx"];

// INSERT: satu pesan chat untuk sebuah event + kategori (Race Category)
async function insertChatMessage(payload) {
  var p = payload || {};
  var eventId = p.eventId ? String(p.eventId) : "";
  var category = p.category ? String(p.category).toLowerCase() : "";
  var senderEmail = p.senderEmail ? String(p.senderEmail) : "";
  var senderName = p.senderName ? String(p.senderName) : senderEmail;
  var text = p.text ? String(p.text).trim() : "";

  if (!eventId) throw new Error("eventId is required");
  if (VALID_CATEGORIES.indexOf(category) === -1) {
    throw new Error("category is required and must be one of: " + VALID_CATEGORIES.join(", "));
  }
  if (!senderEmail) throw new Error("senderEmail is required");
  if (!text) throw new Error("text is required");

  var db = await getDb();
  var col = db.collection("chatMessages");

  var doc = {
    eventId: eventId,
    category: category,
    senderEmail: senderEmail,
    senderName: senderName,
    text: text,
    createdAt: new Date(),
  };

  var res = await col.insertOne(doc);
  return {
    ...doc,
    _id: String(res.insertedId),
  };
}

// LIST: riwayat chat untuk satu event + kategori, urut lama -> baru
async function listChatMessagesByEvent(eventId, category, opts) {
  var options = opts || {};
  var limit = Number.isFinite(options.limit) ? options.limit : 200;

  var db = await getDb();
  var col = db.collection("chatMessages");

  var query = { eventId: String(eventId || "") };
  if (category) query.category = String(category).toLowerCase();

  var items = await col
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  items.reverse(); // jadi urut lama -> baru
  items.forEach(function (it) {
    it._id = String(it._id);
  });
  return items;
}

module.exports = {
  insertChatMessage,
  listChatMessagesByEvent,
  VALID_CATEGORIES,
};
